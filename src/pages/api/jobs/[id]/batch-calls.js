import dbConnect from "@/lib/dbConnect";
import Job from "@/backend/models/job";
import Call from "@/backend/models/call";
import { createBatchCalls, runBatchesForJob } from "@/backend/services/batchCaller";

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

		// Idempotent: one batch run per job. Re-POST resumes orphaned runs (the
		// runner is a no-op when one is already active in this process).
		const existing = await Call.find({ jobId: job._id, batch: { $exists: true } });
		if (existing.length) {
			runBatchesForJob(job._id).catch((e) => console.error("batch resume failed:", e));
			return res.status(200).json({ calls: existing, alreadyRunning: true });
		}

		const { total = 20, batchSize = 5, location } = req.body || {};
		const calls = await createBatchCalls(job, { total, batchSize, location });
		job.status = "calling";
		await job.save();

		// Fire and forget: the batches run in this Node process while the UI polls.
		// (Fine for local/self-hosted; a serverless host would kill this.)
		runBatchesForJob(job._id).catch((e) => console.error("batch run failed:", e));

		return res.status(200).json({ calls });
	} catch (error) {
		console.error("batch-calls error:", error);
		return res.status(500).json({ error: error.message });
	}
}
