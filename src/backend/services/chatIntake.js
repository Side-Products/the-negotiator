import OpenAI from "openai";
import Job from "@/backend/models/job";
import getVertical, { VERTICALS } from "@/config/verticals";
import { confirmJob } from "@/backend/services/jobConfirmation";
import {
	applySpecPatch,
	buildIntakeResponseSchema,
	formatSpecSummary,
	validateSpec,
	validationMessage,
} from "@/backend/services/jobSpec";
import { normalizeLocationPatch } from "@/backend/services/locationValidation";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const YES = new Set([
	"yes",
	"y",
	"correct",
	"confirm",
	"confirmed",
	"looks good",
	"everything is fine",
]);
const NO = new Set(["no", "n", "incorrect", "change", "edit"]);

const commandToken = (text) => text.trim().toLowerCase().split(/\s+/)[0].split("@")[0];

export const isRestart = (text) =>
	commandToken(text) === "/start" || text.trim().toLowerCase() === "restart";

const normalizedAnswer = (text) =>
	text
		.trim()
		.toLowerCase()
		.replace(/[.!]+$/g, "")
		.replace(/\s+/g, " ");

const isYes = (text) => YES.has(normalizedAnswer(text));
const isNo = (text) => NO.has(normalizedAnswer(text));

export const verticalMenu = () =>
	`👋 Welcome to Haggle. I get vendors to compete for your job.\n\nWhat do you need quotes for?\n${VERTICALS.map(
		(vertical, index) => `${index + 1}. ${vertical.label}`,
	).join("\n")}\n\nReply with a number. Send "restart" anytime to start over.`;

const pickVertical = (text) => {
	const token = text.trim().toLowerCase();
	const index = Number.parseInt(token, 10);
	if (Number.isInteger(index) && String(index) === token && VERTICALS[index - 1]) {
		return VERTICALS[index - 1];
	}
	return VERTICALS.find(
		(vertical) =>
			vertical.id === token ||
			vertical.label.toLowerCase() === token ||
			vertical.label.toLowerCase().startsWith(token),
	);
};

const intakeSystemPrompt = (vertical, currentSpec, channel) => {
	const fields = vertical.jobSpec.fields
		.map(
			(field) =>
				`- ${field.key} (${field.type}${field.required ? ", required" : ""}${
					field.options ? `, options: ${field.options.join("/")}` : ""
				}${field.itemShape ? `, itemShape: ${JSON.stringify(field.itemShape)}` : ""}): ${field.ask}`,
		)
		.join("\n");
	return `You are the ${channel} intake assistant for Haggle. Collect a "${vertical.label}" job specification.
Today's date is ${new Date().toISOString().slice(0, 10)}. Resolve relative dates to the nearest future date.

${vertical.interview?.style || "Be warm and concise. Ask exactly one question at a time."}

Fields:
${fields}

Current server-owned draft:
${JSON.stringify(currentSpec || {})}

Rules:
- Ask exactly one question at a time.
- The patch contains only facts learned or corrected from the latest user message. Set every unchanged field to null.
- Never remove, relocate, or rename fields.
- Lists must be arrays of objects matching itemShape exactly.
- For moving inventory, "over 300 pounds", heavy, bulky, or awkward means bulky=true on each affected inventory row. Keep the descriptive answer in the separate top-level specialItems field too.
- Accept common enum wording such as "1 BHK" or "one bedroom", and output the canonical option.
- If an answer is ambiguous, ask one short follow-up and return an all-null patch.
- Do not ask the user to confirm. The server handles the final summary and confirmation.
- Respond only through the supplied JSON schema.`;
};

const runIntakeTurn = async ({ session, userText, currentSpec, channel }) => {
	const vertical = getVertical(session.vertical);
	const history = session.messages.slice(-20).map((message) => ({
		role: message.role,
		content: message.content,
	}));
	const response = await openai.chat.completions.create({
		model: "gpt-4o-mini",
		max_tokens: 1000,
		response_format: {
			type: "json_schema",
			json_schema: {
				name: "job_intake_turn",
				strict: true,
				schema: buildIntakeResponseSchema(vertical),
			},
		},
		messages: [
			{
				role: "system",
				content: intakeSystemPrompt(vertical, currentSpec, channel),
			},
			...history,
			{ role: "user", content: userText },
		],
	});
	const message = response.choices[0]?.message;
	if (message?.refusal) throw new Error(`Intake model refused: ${message.refusal}`);
	const raw = message?.content;
	if (!raw) throw new Error("Intake model returned an empty response");
	return JSON.parse(raw);
};

const remember = (session, role, content) => {
	session.messages.push({ role, content });
	if (session.messages.length > 100) {
		session.messages = session.messages.slice(-100);
	}
};

const clearPending = (session) => {
	session.pendingPatch = undefined;
	session.pendingReply = undefined;
	session.pendingConfirmations = undefined;
};

const confirmationQuestion = (confirmations) => {
	const lines = confirmations.map((item) => {
		if (!item.alternatives?.length) {
			return `I couldn't find "${item.original}" on the map for the ${item.label.toLowerCase()}.`;
		}
		return `Quick check on the ${item.label.toLowerCase()}: I found "${item.suggestion}". That the one?`;
	});
	const hasUnresolved = confirmations.some((item) => !item.alternatives?.length);
	return hasUnresolved
		? `${lines.join("\n")}\nMind sending it again with the city (and country if it's outside the US)? No worries if there's no street number.`
		: `${lines.join("\n")}\nA quick "yes" works, or just send the right one.`;
};

const savePatch = async (session, job, patch) => {
	const result = applySpecPatch(job.vertical, job.spec, patch);
	if (!result.valid) {
		return { error: validationMessage(result.errors), errors: result.errors };
	}
	job.spec = result.spec;
	job.markModified("spec");
	job.specSource =
		job.specSource === "doc" || job.specSource === "both" ? "both" : "voice";
	await job.save();
	return { job };
};

const replyAfterPatch = async (session, job, fallbackReply) => {
	const complete = validateSpec(job.vertical, job.spec, { requireComplete: true });
	if (complete.valid) {
		session.stage = "awaiting_confirmation";
		await session.save();
		return { text: formatSpecSummary(job.vertical, complete.spec) };
	}
	session.stage = "intake";
	await session.save();
	return { text: fallbackReply || "Thanks. What is the next detail?" };
};

const processModelTurn = async (session, text, channel) => {
	const job = await Job.findById(session.jobId);
	if (!job) throw new Error("The draft job no longer exists");
	if (job.confirmed) {
		session.stage = "done";
		await session.save();
		return { confirmed: true, jobId: job._id };
	}

	const turn = await runIntakeTurn({
		session,
		userText: text,
		currentSpec: job.spec || {},
		channel,
	});
	remember(session, "user", text);
	remember(session, "assistant", turn.reply);

	const vertical = getVertical(job.vertical);
	const locations = await normalizeLocationPatch(vertical, turn.patch || {});
	if (locations.confirmations.length) {
		session.pendingPatch = locations.patch;
		session.pendingReply = turn.reply;
		session.pendingConfirmations = locations.confirmations;
		session.stage = "confirm_location";
		await session.save();
		return { text: confirmationQuestion(locations.confirmations) };
	}

	const saved = await savePatch(session, job, locations.patch);
	if (saved.error) {
		await session.save();
		return { text: `I could not save that answer: ${saved.error}. Please try again.` };
	}
	return replyAfterPatch(session, saved.job, turn.reply);
};

export const processChatIntake = async (session, text, { channel }) => {
	if (session.stage === "pick_vertical") {
		const vertical = pickVertical(text);
		if (!vertical) return { text: verticalMenu() };
		const job = await Job.create({ vertical: vertical.id, spec: {} });
		session.vertical = vertical.id;
		session.jobId = job._id;
		session.stage = "intake";
		await session.save();
		return processModelTurn(session, "Hi, let's start.", channel);
	}

	if (session.stage === "confirm_location") {
		const confirmations = session.pendingConfirmations || [];
		if (isYes(text) && !confirmations.some((item) => !item.alternatives?.length)) {
			const job = await Job.findById(session.jobId);
			const saved = await savePatch(session, job, session.pendingPatch || {});
			const reply = session.pendingReply;
			clearPending(session);
			if (saved.error) {
				session.stage = "intake";
				await session.save();
				return { text: `I could not save that location: ${saved.error}. Please try again.` };
			}
			return replyAfterPatch(session, saved.job, reply);
		}
		clearPending(session);
		session.stage = "intake";
		await session.save();
		if (isNo(text)) return { text: "Please send the correct location." };
		return processModelTurn(session, text, channel);
	}

	if (session.stage === "awaiting_confirmation") {
		if (isYes(text)) {
			const job = await Job.findById(session.jobId);
			const confirmed = await confirmJob(job);
			session.stage = "done";
			await session.save();
			return { confirmed: true, jobId: confirmed._id };
		}
		if (isNo(text)) {
			session.stage = "intake";
			await session.save();
			return { text: "What should I change?" };
		}
		session.stage = "intake";
		await session.save();
		return processModelTurn(session, text, channel);
	}

	if (session.stage === "intake") return processModelTurn(session, text, channel);
	return { done: true, jobId: session.jobId };
};

export const processChatMedia = async (
	session,
	{ fileBase64, mediaType, description = "uploaded document" },
) => {
	if (!session.jobId || session.stage === "pick_vertical") {
		return { text: "Choose a job type before uploading a document or photo." };
	}
	if (session.stage === "done") return { done: true, jobId: session.jobId };

	const job = await Job.findById(session.jobId);
	if (!job) throw new Error("The draft job no longer exists");
	if (job.confirmed) return { done: true, jobId: job._id };

	const { extractSpec } = await import("@/backend/services/docIntake");
	const extracted = await extractSpec({
		vertical: job.vertical,
		fileBase64,
		mediaType,
	});
	const vertical = getVertical(job.vertical);
	const locations = await normalizeLocationPatch(vertical, extracted);
	remember(session, "user", `[${description}]`);

	if (locations.confirmations.length) {
		const reply = "I extracted the document. We can continue with any missing details after checking the location.";
		remember(session, "assistant", reply);
		session.pendingPatch = locations.patch;
		session.pendingReply = reply;
		session.pendingConfirmations = locations.confirmations;
		session.stage = "confirm_location";
		await session.save();
		return { text: confirmationQuestion(locations.confirmations) };
	}

	const saved = await savePatch(session, job, locations.patch);
	if (saved.error) {
		remember(session, "assistant", `The upload contained invalid data: ${saved.error}`);
		await session.save();
		return {
			text: `I could not use the extracted details: ${saved.error}. Please send the details as text or try another file.`,
		};
	}
	const reply = Object.keys(locations.patch).length
		? "I extracted the document and added its details."
		: "I could not find any job details in that file.";
	remember(session, "assistant", reply);
	return replyAfterPatch(session, saved.job, reply);
};

export default processChatIntake;
