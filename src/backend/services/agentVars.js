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

// Leverage is more than a number: the other conversations recorded guarantees,
// waived fees, and in-call price movements. All of it comes from committed
// Quote docs and their calls' recorded negotiation events, so every fact the
// buyer may cite exists in the database. Vendor names are never included.
export const buildLeverage = async (call) => {
	const quotes = await Quote.find({
		_id: { $in: call.leverageQuoteIds || [] },
		committed: true,
	});
	const sourceCalls = await Call.find({ _id: { $in: quotes.map((q) => q.callId) } });
	const callById = Object.fromEntries(sourceCalls.map((c) => [c._id.toString(), c]));

	return quotes.map((q) => {
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
		levers_json: JSON.stringify(vertical.levers),
		fees_json: JSON.stringify(vertical.fees),
		benchmarks_json: JSON.stringify(vertical.benchmarks),
	};
};

export default { todayDate, buildIntakeVars, buildBuyerVars };
