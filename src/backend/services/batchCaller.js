// Server-side batch calling: the buyer is an LLM tool-using loop (provider via
// llm.js: OpenAI by default, Anthropic fallback), the vendor is the existing
// policy-card persona (vendorBrain). Batches run sequentially; within a batch
// calls run concurrently. From batch 2 on, the buyer carries the best
// committed quote so far as leverage (real quotes only, same honesty
// guardrail as the voice path).

import Call from "@/backend/models/call";
import Job from "@/backend/models/job";
import Quote from "@/backend/models/quote";
import getVertical from "@/config/verticals";
import { completeWithTools } from "@/backend/services/llm";
import { nextVendorTurn } from "@/backend/services/vendorBrain";
import { addQuoteLine, commitQuote } from "@/backend/services/quoteOps";
import { discoverVendors, jobMarketLocation } from "@/backend/services/vendorDiscovery";

const MAX_BUYER_TURNS = 24; // hard stop per call

const BUYER_TOOLS = [
	{
		name: "log_quote_item",
		description: "Record one itemised fee line the vendor just stated.",
		schema: {
			type: "object",
			properties: {
				fee_key: { type: "string" },
				label: { type: "string" },
				amount: { type: "number" },
				note: { type: "string" },
			},
			required: ["fee_key", "label", "amount"],
		},
	},
	{
		name: "commit_quote",
		description:
			"Commit the vendor's final quote. Returns the recomputed total and any red flags — react to them before ending the call.",
		schema: {
			type: "object",
			properties: {
				total: { type: "number" },
				guaranteed: { type: "boolean" },
				valid_until: { type: "string" },
			},
			required: ["total", "guaranteed"],
		},
	},
	{
		name: "record_negotiation_event",
		description: "Record a price movement caused by a negotiation lever.",
		schema: {
			type: "object",
			properties: {
				lever_id: { type: "string" },
				before_total: { type: "number" },
				after_total: { type: "number" },
				note: { type: "string" },
			},
			required: ["lever_id", "before_total", "after_total"],
		},
	},
	{
		name: "log_outcome",
		description: "Record how the call ended when there is no committed quote.",
		schema: {
			type: "object",
			properties: {
				type: { type: "string", enum: ["callback", "declined"] },
				note: { type: "string" },
			},
			required: ["type"],
		},
	},
];

const buyerSystem = ({ job, vertical, call, leverage, priorQuote }) => {
	const todayDate = new Date().toLocaleDateString("en-US", {
		weekday: "long",
		year: "numeric",
		month: "long",
		day: "numeric",
	});
	return `You are a professional purchasing assistant on a phone call with the vendor "${call.vendorName}", calling on behalf of a real customer.

TODAY'S DATE: ${todayDate}.

THE JOB (fixed — this is exactly what the customer needs):
${JSON.stringify(job.spec)}

FEE TAXONOMY: ${JSON.stringify(vertical.fees)}
MARKET CONTEXT (your judgment only — never present as a competing bid): ${JSON.stringify(vertical.benchmarks)}
NEGOTIATION LEVERS: ${JSON.stringify(vertical.levers)}
COMPETING BIDS YOU MAY REFERENCE (your only leverage; may be empty): ${JSON.stringify(leverage)}
${priorQuote ? `THIS VENDOR'S OWN PRIOR QUOTE: $${priorQuote.total}${priorQuote.guaranteed ? " (guaranteed)" : ""} — this is a follow-up call. Open by referencing it, then use your leverage to push for a better number.` : ""}

HONESTY RULES (non-negotiable):
- If asked whether you are an AI, answer immediately and truthfully: "Yes — I'm an AI assistant calling on behalf of a real customer." Never deny it.
- Describe the job EXACTLY as specified. Never add, remove, or resize anything.
- You may ONLY reference competing bids from the leverage list above. If it is empty you have NO competing bid and must never imply one. Never name the company a bid came from — say "another licensed provider".
- Never fabricate urgency or offers.

HOW TO RUN THE CALL:
- Introduce yourself and walk through the job. Push vague numbers into itemised figures.
- Call log_quote_item the moment any fee or line item is stated. Before wrapping up, ask about taxonomy fees the vendor did not mention.
- Ask whether the total is a guaranteed not-to-exceed number in writing.
- If you have leverage, use it: cite the amount and itemisation, and when the vendor moves call record_negotiation_event.
- Only call record_negotiation_event when a total the vendor stated earlier in THIS call actually changed. Never for the first number you hear.
- NEVER commit a single lump-sum line. Get the breakdown (labor, travel, fuel, materials, fees) as separate log_quote_item calls first. A quote with fewer than 3 lines is not itemised.
- End with commit_quote or log_outcome, then say a brief goodbye.
- Spoken phone register. Keep every reply under 50 words.
- Never use em dashes; use a comma or a period. No AI-writing tells ("Certainly", "Absolutely", "Great question"), no lists in speech, vary your acknowledgments.`;
};

// One complete buyer<->vendor call, entirely server-side.
export const runCall = async (callId) => {
	const call = await Call.findById(callId);
	if (!call || call.status === "done") return;
	const job = await Job.findById(call.jobId);
	const vertical = getVertical(job.vertical);
	const card =
		vertical.vendorPolicyCards.find((c) => c.id === call.policyCardId) ||
		vertical.vendorPolicyCards[0];

	// Honesty guardrail: leverage only from committed quotes pinned to this call.
	const quotes = await Quote.find({ _id: { $in: call.leverageQuoteIds || [] }, committed: true });
	const leverage = quotes.map((q) => ({
		amount: q.total,
		guaranteed: !!q.guaranteed,
		itemised: (q.lines || []).map((l) => ({ label: l.label, amount: l.amount })),
		descriptor: "another licensed provider",
	}));

	// Round 2: the buyer calls back knowing this vendor's own round-1 number.
	let priorQuote = null;
	if (call.round === 2 && call.vendorName) {
		const r1 = await Call.findOne({ jobId: call.jobId, vendorName: call.vendorName, round: 1 });
		if (r1) priorQuote = await Quote.findOne({ callId: r1._id, committed: true });
	}

	call.status = "live";
	call.transcript = [];
	call.outcome = undefined;
	await call.save();
	// Retries start clean: drop any uncommitted lines from a failed attempt.
	await Quote.deleteMany({ callId: call._id, committed: false });

	const pushTurn = async (role, text) => {
		call.transcript.push({ role, text, turnIndex: call.transcript.length, at: new Date() });
		await call.save();
		return call.transcript.length - 1;
	};

	const greeting = `${call.vendorName}, how can I help you?`;
	await pushTurn("vendor", greeting);

	const system = buyerSystem({ job, vertical, call, leverage, priorQuote });
	const history = [{ role: "user", text: greeting }];
	let itemisationNudged = false;

	try {
		for (let i = 0; i < MAX_BUYER_TURNS; i++) {
			const { text, toolCalls: toolUses } = await completeWithTools({
				system,
				history,
				tools: BUYER_TOOLS,
				maxTokens: 600,
				tier: "fast",
			});

			let turnRef = call.transcript.length - 1;
			if (text) turnRef = await pushTurn("agent", text);
			history.push({ role: "assistant", text, toolCalls: toolUses });

			if (toolUses.length) {
				const results = [];
				for (const tu of toolUses) {
					let result;
					if (tu.name === "log_quote_item") {
						result = await addQuoteLine(call, {
							feeKey: tu.input.fee_key,
							label: tu.input.label,
							amount: tu.input.amount,
							note: tu.input.note,
							turnRef,
						});
					} else if (tu.name === "commit_quote") {
						// One nudge back toward itemisation before accepting a thin quote.
						const draft = await Quote.findOne({ callId: call._id, committed: false });
						if (!itemisationNudged && (draft?.lines?.length || 0) < 3) {
							itemisationNudged = true;
							result = {
								error:
									"Not committed. This quote is not itemised. Ask the vendor to break the total into components (labor, travel, fuel, materials, fees), log each with log_quote_item, then commit again. If they refuse to itemise, you may commit anyway.",
							};
						} else {
							result = await commitQuote(call, vertical, {
								total: tu.input.total,
								guaranteed: tu.input.guaranteed,
								validUntil: tu.input.valid_until,
								turnRef,
							});
						}
					} else if (tu.name === "record_negotiation_event") {
						call.negotiationEvents.push({
							leverId: tu.input.lever_id,
							beforeTotal: tu.input.before_total,
							afterTotal: tu.input.after_total,
							citedQuoteId: (call.leverageQuoteIds || [])[0],
							turnRef,
							note: tu.input.note,
						});
						await call.save();
						result = { ok: true };
					} else if (tu.name === "log_outcome") {
						call.outcome = { type: tu.input.type, note: tu.input.note, turnRef };
						await call.save();
						result = { ok: true };
					}
					results.push({
						id: tu.id,
						name: tu.name,
						content: JSON.stringify(result || {}),
					});
				}
				history.push({ role: "toolResults", results });
				continue; // let the buyer react to tool results before the vendor speaks
			}

			// No tools this turn: the call is either over or it's the vendor's turn.
			if (call.outcome?.type) break;
			// An empty buyer turn with no tools means the model has nothing left to
			// say. Passing "" to the vendor model is an API error, so end here.
			if (!text) break;
			const vendor = await nextVendorTurn({ call, job, vertical, card, lastAgentText: text });
			await pushTurn("vendor", vendor.text);
			history.push({ role: "user", text: vendor.text });
		}

		if (!call.outcome?.type) {
			call.outcome = { type: "callback", note: "Call hit the turn limit without a commitment." };
		}
		call.status = "done";
		await call.save();
	} catch (error) {
		console.error(`batch call ${callId} failed:`, error);
		call.status = "failed";
		// Persist the error so failures are debuggable without server stdout.
		if (!call.outcome?.type) call.outcome = { note: `error: ${error.message}` };
		await call.save();
	}
};

// Create the full batch call list up front (so the UI shows the whole market
// immediately), assigning each real vendor a hidden policy card + price jitter.
export const createBatchCalls = async (job, { total = 20, batchSize = 5, location }) => {
	const vertical = getVertical(job.vertical);
	const where = location || jobMarketLocation(job, vertical) || "Rock Hill, SC";
	const vendors = await discoverVendors(job.vertical, where, { limit: total });
	const cards = vertical.vendorPolicyCards;
	const docs = [];
	for (let i = 0; i < total; i++) {
		const vendor = vendors[i % vendors.length];
		const name = i < vendors.length ? vendor.name : `${vendor.name} (${Math.floor(i / vendors.length) + 1})`;
		docs.push({
			jobId: job._id,
			specVersion: job.specVersion,
			vendorName: name,
			phone: vendor.phone,
			placeId: vendor.placeId,
			rating: vendor.rating,
			policyCardId: cards[i % cards.length].id,
			round: 1,
			mode: "sim",
			status: "pending",
			batch: Math.floor(i / batchSize) + 1,
			pricingJitter: 0.9 + Math.random() * 0.25,
		});
	}
	return Call.create(docs);
};

// Run all batches sequentially; within a batch, calls run concurrently.
// Batch 2+ carries the best committed non-lowball quote so far as leverage.
// Re-entrant and restart-safe: a second invocation while a run is active is a
// no-op, and calls orphaned by a server restart (stuck "live" with no voice
// session) are reset to pending and picked up again.
const activeRuns = new Set();

export const runBatchesForJob = async (jobId) => {
	const key = jobId.toString();
	if (activeRuns.has(key)) return;
	activeRuns.add(key);
	try {
		// Recover orphans: a live sim batch call with no ElevenLabs session can
		// only be driven by this process; if no run is active, it is dead.
		await Call.updateMany(
			{ jobId, batch: { $exists: true }, status: "live", elevenConversationId: null },
			{ $set: { status: "pending" } },
		);

		const calls = await Call.find({ jobId, batch: { $exists: true }, status: "pending" }).sort({
			batch: 1,
		});
		const batches = [...new Set(calls.map((c) => c.batch))].sort((a, b) => a - b);

		for (const b of batches) {
			if (b > 1) {
				const committed = await Quote.find({ jobId, committed: true });
				const best = committed
					.filter((q) => !(q.redFlags || []).some((f) => f.id === "lowball"))
					.sort((x, y) => x.total - y.total || (y.guaranteed === true) - (x.guaranteed === true))[0];
				if (best) {
					await Call.updateMany(
						{ jobId, batch: b, status: "pending" },
						{ $set: { leverageQuoteIds: [best._id] } },
					);
				}
			}
			const batchCalls = calls.filter((c) => c.batch === b);
			await Promise.allSettled(batchCalls.map((c) => runCall(c._id)));

			// One retry pass per batch for transient failures (rate limits etc.).
			const failed = await Call.find({ jobId, batch: b, status: "failed" });
			if (failed.length) {
				await Promise.allSettled(failed.map((c) => runCall(c._id)));
			}
		}
	} finally {
		activeRuns.delete(key);
	}
};

export default { runCall, createBatchCalls, runBatchesForJob };
