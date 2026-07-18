import dbConnect from "@/lib/dbConnect";
import Job from "@/backend/models/job";
import Call from "@/backend/models/call";
import Quote from "@/backend/models/quote";
import getVertical from "@/config/verticals";

export default async function handler(req, res) {
	if (req.method !== "POST") {
		return res.status(405).json({ error: "Method not allowed" });
	}
	try {
		await dbConnect();
		const job = await Job.findById(req.query.id);
		if (!job) return res.status(404).json({ error: "Job not found" });
		const vertical = getVertical(job.vertical);
		if (!vertical) return res.status(400).json({ error: "Unknown vertical" });

		const cardId = (req.body || {}).policyCardId || "premium";
		const card = vertical.vendorPolicyCards.find((c) => c.id === cardId);
		if (!card) {
			return res.status(400).json({ error: `Unknown policy card: ${cardId}` });
		}

		// Idempotent: a double-click must not spawn a second round-2 call.
		const existing = await Call.findOne({ jobId: job._id, round: 2, policyCardId: card.id });
		if (existing) return res.status(200).json({ call: existing });

		// Best committed round-1 quote: lowest total without the lowball red flag,
		// preferring guaranteed on comparable totals.
		const round1Calls = await Call.find({ jobId: job._id, round: 1 });
		const quotes = await Quote.find({
			jobId: job._id,
			callId: { $in: round1Calls.map((c) => c._id) },
			committed: true,
		});
		const eligible = quotes
			.filter((q) => !(q.redFlags || []).some((f) => f.id === "lowball"))
			.sort(
				(a, b) =>
					a.total - b.total ||
					(b.guaranteed === true) - (a.guaranteed === true),
			);
		if (!eligible.length) {
			return res
				.status(409)
				.json({ error: "No committed round-1 quote available as leverage" });
		}

		const call = await Call.create({
			jobId: job._id,
			specVersion: job.specVersion,
			vendorName: card.businessName,
			policyCardId: card.id,
			round: 2,
			mode: "sim",
			status: "pending",
			leverageQuoteIds: [eligible[0]._id],
		});

		job.status = "negotiating";
		await job.save();
		return res.status(200).json({ call });
	} catch (error) {
		console.error("jobs/negotiate error:", error);
		return res.status(500).json({ error: error.message });
	}
}
