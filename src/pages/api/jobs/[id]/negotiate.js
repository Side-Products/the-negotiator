import dbConnect from "@/lib/dbConnect";
import Job from "@/backend/models/job";
import Call from "@/backend/models/call";
import Quote from "@/backend/models/quote";
import { runCall } from "@/backend/services/batchCaller";

export default async function handler(req, res) {
	if (req.method !== "POST") {
		return res.status(405).json({ error: "Method not allowed" });
	}
	try {
		await dbConnect();
		const job = await Job.findById(req.query.id);
		if (!job) return res.status(404).json({ error: "Job not found" });

		const round1Calls = await Call.find({ jobId: job._id, round: 1 });
		const callById = Object.fromEntries(round1Calls.map((c) => [c._id.toString(), c]));
		const quotes = await Quote.find({ jobId: job._id, committed: true });
		const clean = quotes
			.filter((q) => !(q.redFlags || []).some((f) => f.id === "lowball"))
			.sort((a, b) => a.total - b.total || (b.guaranteed === true) - (a.guaranteed === true));
		if (clean.length < 2) {
			return res
				.status(409)
				.json({ error: "Need at least two committed clean quotes to negotiate" });
		}

		// Leverage = the best clean bid; target = the priciest clean vendor (the
		// most room to move, and the strongest before/after story).
		const leverageQuote = clean[0];
		const targetQuote = clean[clean.length - 1];
		const targetCall = callById[targetQuote.callId?.toString()];
		if (!targetCall) return res.status(409).json({ error: "Target vendor call not found" });

		// Idempotent: one round-2 call per vendor.
		const existing = await Call.findOne({
			jobId: job._id,
			round: 2,
			vendorName: targetCall.vendorName,
		});
		if (existing) return res.status(200).json({ call: existing });

		const call = await Call.create({
			jobId: job._id,
			specVersion: job.specVersion,
			vendorName: targetCall.vendorName,
			policyCardId: targetCall.policyCardId,
			pricingJitter: targetCall.pricingJitter,
			round: 2,
			mode: "sim",
			status: "pending",
			leverageQuoteIds: [leverageQuote._id],
		});

		job.status = "negotiating";
		await job.save();

		// Round 2 runs server-side like the batches: fire and forget, UI polls.
		runCall(call._id).catch((e) => console.error("round-2 call failed:", e));

		return res.status(200).json({ call });
	} catch (error) {
		console.error("jobs/negotiate error:", error);
		return res.status(500).json({ error: error.message });
	}
}
