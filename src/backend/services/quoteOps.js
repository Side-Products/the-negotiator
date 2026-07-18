// Single implementation of quote mutations, used by both the client-tool API
// routes (browser voice calls) and the server-side batch caller.

import Quote from "@/backend/models/quote";
import Call from "@/backend/models/call";
import { evaluate } from "@/backend/services/redFlagService";

export const addQuoteLine = async (call, { feeKey, label, amount, note, turnRef }) => {
	// Atomic upsert-and-push: overlapping calls must not split lines across docs.
	const quote = await Quote.findOneAndUpdate(
		{ callId: call._id, committed: false },
		{
			$push: {
				lines: { feeKey, label: label || feeKey, amount: Number(amount), note, turnRef },
			},
			$setOnInsert: { jobId: call.jobId },
		},
		{ upsert: true, new: true },
	);
	const runningTotal = quote.lines.reduce((s, l) => s + (l.amount || 0), 0);
	quote.total = runningTotal;
	await quote.save();
	return { ok: true, runningTotal };
};

export const commitQuote = async (call, vertical, { total, guaranteed, validUntil, turnRef }) => {
	const quote = await Quote.findOne({ callId: call._id, committed: false });
	if (!quote || !quote.lines.length) {
		// Idempotent: a retry after a successful commit gets the committed quote back.
		const committed = await Quote.findOne({ callId: call._id, committed: true });
		if (committed) return { total: committed.total, redFlags: committed.redFlags || [] };
		return { error: "No quote lines logged for this call" };
	}

	// The itemised sum is the truth: the agent's claimed total can't drift.
	const recomputed = quote.lines.reduce((s, l) => s + (l.amount || 0), 0);
	let note;
	if (total !== undefined && Math.abs(Number(total) - recomputed) > 1) {
		note = `Claimed total $${Number(total)} differs from itemised sum — corrected to $${recomputed}.`;
	}

	quote.total = recomputed;
	quote.guaranteed = !!guaranteed;
	if (validUntil !== undefined) quote.validUntil = validUntil;
	quote.redFlags = vertical ? evaluate(quote, vertical) : [];

	if (call.round === 2 && call.vendorName) {
		const round1 = await Call.findOne({ jobId: call.jobId, vendorName: call.vendorName, round: 1 });
		if (round1) {
			const superseded = await Quote.findOne({ callId: round1._id, committed: true });
			if (superseded) quote.supersedes = superseded._id;
		}
	}

	quote.committed = true;
	await quote.save();

	call.outcome = { type: "quote", turnRef };
	await call.save();

	return { total: recomputed, redFlags: quote.redFlags, ...(note && { note }) };
};

export default { addQuoteLine, commitQuote };
