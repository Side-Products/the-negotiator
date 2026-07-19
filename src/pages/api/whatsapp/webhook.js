import OpenAI from "openai";
import dbConnect from "@/lib/dbConnect";
import Job from "@/backend/models/job";
import WhatsappSession from "@/backend/models/whatsappSession";
import { validateTwilioRequest } from "@/backend/services/whatsapp";
import getVertical, { VERTICALS } from "@/config/verticals";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const twiml = (text) =>
	`<?xml version="1.0" encoding="UTF-8"?><Response><Message>${text
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")}</Message></Response>`;

const verticalMenu = () =>
	`👋 Welcome to *Haggle* — I get vendors to compete for your job.\n\nWhat do you need quotes for?\n${VERTICALS.map(
		(v, i) => `${i + 1}. ${v.label}`,
	).join("\n")}\n\nReply with a number. (Send "restart" anytime to start over.)`;

const pickVertical = (text) => {
	const t = text.trim().toLowerCase();
	const byIndex = VERTICALS[parseInt(t, 10) - 1];
	if (byIndex) return byIndex;
	return VERTICALS.find(
		(v) => v.id === t || v.label.toLowerCase().includes(t),
	);
};

const intakeSystemPrompt = (vertical) => {
	const fields = vertical.jobSpec.fields
		.map(
			(f) =>
				`- ${f.key} (${f.type}${f.required ? ", required" : ""}${
					f.options ? `, options: ${f.options.join("/")}` : ""
				}): ${f.ask}`,
		)
		.join("\n");
	return `You are the WhatsApp intake assistant for Haggle, collecting a "${vertical.label}" job spec so AI voice agents can call vendors and get competing quotes.
Today's date is ${new Date().toISOString().slice(0, 10)} — resolve relative dates ("Saturday", "August 15") to the nearest FUTURE date.

${vertical.interview?.style || "Be warm and concise. Ask exactly one question at a time."}
This is WhatsApp: keep messages short, use light emoji sparingly.

Fields to collect:
${fields}

Rules:
- Ask one question at a time, in a sensible order.
- When every required field is answered, summarise the spec and ask the user to confirm with "yes".
- Respond ONLY with JSON (no markdown fence): {"reply": "<message to send>", "spec": {<all field keys collected so far, best-effort typed>}, "complete": <true only after the user explicitly confirms the summary>}`;
};

async function runIntakeTurn(session, userText) {
	const vertical = getVertical(session.vertical);
	const history = session.messages.slice(-30).map((m) => ({
		role: m.role,
		content: m.content,
	}));
	const response = await openai.chat.completions.create({
		model: "gpt-4o-mini",
		max_tokens: 1000,
		response_format: { type: "json_object" },
		messages: [
			{ role: "system", content: intakeSystemPrompt(vertical) },
			...history,
			{ role: "user", content: userText },
		],
	});
	const raw = response.choices[0]?.message?.content || "{}";
	try {
		return JSON.parse(raw.replace(/^```(json)?|```$/g, "").trim());
	} catch {
		return { reply: raw, spec: null, complete: false };
	}
}

export default async function handler(req, res) {
	if (req.method !== "POST") {
		return res.status(405).json({ error: "Method not allowed" });
	}

	try {
		await dbConnect();

		const url = `${process.env.PUBLIC_BASE_URL || ""}/api/whatsapp/webhook`;
		if (process.env.PUBLIC_BASE_URL && !validateTwilioRequest(req, url)) {
			return res.status(403).json({ error: "Invalid Twilio signature" });
		}

		const from = req.body.From; // "whatsapp:+1555..."
		const text = (req.body.Body || "").trim();
		if (!from) return res.status(400).json({ error: "Missing From" });

		res.setHeader("Content-Type", "text/xml");

		let session = await WhatsappSession.findOne({ phone: from });

		if (!session || text.toLowerCase() === "restart") {
			if (session) await session.deleteOne();
			session = await WhatsappSession.create({ phone: from });
			return res.status(200).send(twiml(verticalMenu()));
		}

		if (session.stage === "pick_vertical") {
			const vertical = pickVertical(text);
			if (!vertical) {
				return res.status(200).send(twiml(verticalMenu()));
			}
			const job = await Job.create({ vertical: vertical.id, spec: {} });
			session.vertical = vertical.id;
			session.jobId = job._id;
			session.stage = "intake";
			const first = await runIntakeTurn(session, "Hi, let's start.");
			session.messages.push(
				{ role: "user", content: "Hi, let's start." },
				{ role: "assistant", content: JSON.stringify(first) },
			);
			await session.save();
			return res
				.status(200)
				.send(twiml(first.reply || vertical.interview?.opener || "Let's start!"));
		}

		if (session.stage === "intake") {
			const turn = await runIntakeTurn(session, text);
			session.messages.push(
				{ role: "user", content: text },
				{ role: "assistant", content: JSON.stringify(turn) },
			);

			if (turn.spec && session.jobId) {
				await Job.findByIdAndUpdate(session.jobId, {
					spec: turn.spec,
					specSource: "voice",
				});
			}

			if (turn.complete && session.jobId) {
				await Job.findByIdAndUpdate(session.jobId, {
					confirmed: true,
					confirmedAt: new Date(),
					status: "confirmed",
				});
				session.stage = "done";
				await session.save();
				const base = process.env.PUBLIC_BASE_URL || "http://localhost:3001";
				return res
					.status(200)
					.send(
						twiml(
							`✅ Spec confirmed! Track calls and quotes here:\n${base}/jobs/${session.jobId}\n\nSend "restart" to start a new job.`,
						),
					);
			}

			await session.save();
			return res.status(200).send(twiml(turn.reply || "Got it — what else?"));
		}

		// stage === "done"
		const base = process.env.PUBLIC_BASE_URL || "http://localhost:3001";
		return res
			.status(200)
			.send(
				twiml(
					`Your job is in progress: ${base}/jobs/${session.jobId}\nSend "restart" to start a new one.`,
				),
			);
	} catch (error) {
		console.error("whatsapp webhook error:", error);
		res.setHeader("Content-Type", "text/xml");
		return res
			.status(200)
			.send(twiml("⚠️ Something went wrong — please try again."));
	}
}
