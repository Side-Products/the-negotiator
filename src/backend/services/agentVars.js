// Builds the dynamic variables for both agents. Single source of truth so
// browser sessions and real phone calls configure the agent identically.
// Honesty guardrail lives here: buyer leverage comes only from committed Quote
// docs pinned to the call, with vendor names redacted.

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
	vertical_label: vertical.label,
	taxonomy_json: JSON.stringify(vertical.jobSpec.fields),
	interview_json: JSON.stringify(vertical.interview),
	spec_draft_json: JSON.stringify(job.spec || {}),
});

export const buildBuyerVars = async (job, call, vertical, { recordingNote = "" } = {}) => {
	const quotes = await Quote.find({
		_id: { $in: call.leverageQuoteIds || [] },
		committed: true,
	});
	const leverage = quotes.map((q) => ({
		amount: q.total,
		guaranteed: !!q.guaranteed,
		itemised: (q.lines || []).map((l) => ({ label: l.label, amount: l.amount })),
		descriptor: "another licensed provider",
	}));

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
