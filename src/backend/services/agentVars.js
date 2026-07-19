// Builds the dynamic variables for both agents. Single source of truth so
// browser sessions and real phone calls configure the agent identically.
// Honesty guardrail lives here: buyer leverage comes only from committed Quote
// docs pinned to the call, with vendor names redacted.

import Call from "@/backend/models/call";
import Quote from "@/backend/models/quote";

export const todayDate = () =>
	new Date().toLocaleDateString("en-US", {
		weekday: "long",
		year: "numeric",
		month: "long",
		day: "numeric",
	});

export const buildIntakeVars = (job, vertical) => ({
	today_date: todayDate(),
	// The agent's literal opening line: each vertical's config opener, so the
	// interview starts in-domain instead of with a generic greeting.
	interview_opener: vertical.interview.opener,
	vertical_label: vertical.label,
	taxonomy_json: JSON.stringify(vertical.jobSpec.fields),
	interview_json: JSON.stringify(vertical.interview),
	spec_draft_json: JSON.stringify(job.spec || {}),
});

// LIVE leverage: every committed quote from this job's OTHER conversations,
// as of right now. Enriched with recorded terms (guarantees, waived fees,
// in-call price movements). Everything comes from committed Quote docs and
// recorded negotiation events, so every fact the buyer may cite exists in the
// database; vendor names are never included; a vendor's own quotes are never
// offered as leverage against them. Grows during a run as other calls commit,
// which is the point: each conversation negotiates with everything the
// system has already learned.
export const buildLeverage = async (call) => {
	const jobCalls = await Call.find({ jobId: call.jobId });
	const callById = Object.fromEntries(jobCalls.map((c) => [c._id.toString(), c]));
	const otherCallIds = jobCalls
		.filter((c) => c.vendorName !== call.vendorName)
		.map((c) => c._id);
	const quotes = await Quote.find({
		jobId: call.jobId,
		committed: true,
		$or: [{ callId: { $in: otherCallIds } }, { _id: { $in: call.leverageQuoteIds || [] } }],
	});

	return quotes
		.sort((a, b) => (a.total || 0) - (b.total || 0))
		.map((q) => {
			const source = callById[q.callId?.toString()];
			const waived = (q.lines || []).filter((l) => l.amount === 0).map((l) => l.label);
			const moved = (source?.negotiationEvents || [])[0];
			return {
				amount: q.total,
				guaranteed: !!q.guaranteed,
				itemised: (q.lines || []).map((l) => ({ label: l.label, amount: l.amount })),
				...(waived.length && { waivedFees: waived }),
				...(moved && { movedInCall: { from: moved.beforeTotal, to: moved.afterTotal } }),
				descriptor: "another licensed provider",
			};
		});
};

// A defensible price target the buyer can ASK for, derived from real data:
// a notch under the best committed bid when one exists, else the low end of
// the vertical's market data. The target is an ask, never presented as a bid;
// its basis is real so the agent can justify it out loud honestly.
export const buildNegotiationTargets = (vertical, leverage) => {
	const b = vertical.benchmarks || {};
	const round5 = (n) => Math.max(5, Math.round(n / 5) * 5);
	const counterBelowBestPct = b.counterBelowBestPct || 8;
	const best = leverage.length ? Math.min(...leverage.map((l) => l.amount)) : null;

	let suggestedCounter = null;
	let basis = "none";
	if (best) {
		suggestedCounter = round5(best * (1 - counterBelowBestPct / 100));
		basis = `a notch under the best committed bid ($${best})`;
	} else if (b.marketMin) {
		suggestedCounter = round5(b.marketMin);
		basis = `the low end of market data ($${b.marketMin})`;
	}
	if (suggestedCounter && b.marketMin) {
		suggestedCounter = Math.max(suggestedCounter, round5(b.marketMin * 0.9));
	}
	return { suggestedCounter, basis, marketLow: b.marketMin ?? null, marketMid: b.marketMid ?? null };
};

export const buildBuyerVars = async (job, call, vertical, { recordingNote = "" } = {}) => {
	const leverage = await buildLeverage(call);

	return {
		today_date: todayDate(),
		call_id: call._id.toString(),
		recording_note: recordingNote,
		vendor_name: call.vendorName || "",
		job_spec_json: JSON.stringify(job.spec || {}),
		round: call.round || 1,
		leverage_json: JSON.stringify(leverage),
		targets_json: JSON.stringify(buildNegotiationTargets(vertical, leverage)),
		levers_json: JSON.stringify(vertical.levers),
		fees_json: JSON.stringify(vertical.fees),
		benchmarks_json: JSON.stringify(vertical.benchmarks),
	};
};

export default { todayDate, buildIntakeVars, buildBuyerVars };
