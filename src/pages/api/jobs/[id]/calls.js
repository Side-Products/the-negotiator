import dbConnect from "@/lib/dbConnect";
import Job from "@/backend/models/job";
import Call from "@/backend/models/call";
import getVertical from "@/config/verticals";

// Creates a single live role-play call (human plays the vendor via the browser
// mic against the buyer agent). Batch/sim calls go through /batch-calls.
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

		const count = await Call.countDocuments({ jobId: job._id, mode: "roleplay" });
		const call = await Call.create({
			jobId: job._id,
			specVersion: job.specVersion,
			vendorName: (req.body || {}).vendorName || `Role-play vendor ${count + 1}`,
			policyCardId: vertical.vendorPolicyCards[0].id,
			round: 1,
			mode: "roleplay",
			status: "pending",
		});

		if (job.status === "confirmed") {
			job.status = "calling";
			await job.save();
		}
		return res.status(200).json({ call, calls: [call] });
	} catch (error) {
		console.error("jobs/calls error:", error);
		return res.status(500).json({ error: error.message });
	}
}
