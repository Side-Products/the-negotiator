import dbConnect from "@/lib/dbConnect";
import Job from "@/backend/models/job";
import Call from "@/backend/models/call";
import getVertical from "@/config/verticals";

export default async function handler(req, res) {
	if (req.method !== "POST") {
		return res.status(405).json({ error: "Method not allowed" });
	}
	try {
		await dbConnect();
		const job = await Job.findById(req.query.id);
		if (!job) return res.status(404).json({ error: "Job not found" });
		if (!job.confirmed) {
			return res.status(409).json({ error: "Confirm the spec before starting calls" });
		}
		const vertical = getVertical(job.vertical);
		if (!vertical) return res.status(400).json({ error: "Unknown vertical" });

		// Idempotent: re-POST returns the existing round-1 calls instead of duplicating.
		let calls = await Call.find({ jobId: job._id, round: 1 });
		if (!calls.length) {
			calls = await Call.create(
				vertical.vendorPolicyCards.map((card) => ({
					jobId: job._id,
					specVersion: job.specVersion,
					vendorName: card.businessName,
					policyCardId: card.id,
					round: 1,
					mode: "sim",
					status: "pending",
				})),
			);
		}

		job.status = "calling";
		await job.save();
		return res.status(200).json({ calls });
	} catch (error) {
		console.error("jobs/calls error:", error);
		return res.status(500).json({ error: error.message });
	}
}
