import dbConnect from "@/lib/dbConnect";
import Job from "@/backend/models/job";
import { confirmJob } from "@/backend/services/jobConfirmation";

export default async function handler(req, res) {
	if (req.method !== "POST") {
		return res.status(405).json({ error: "Method not allowed" });
	}
	try {
		await dbConnect();
		const job = await Job.findById(req.query.id);
		if (!job) return res.status(404).json({ error: "Job not found" });

		const confirmedJob = await confirmJob(job);
		return res.status(200).json({ job: confirmedJob });
	} catch (error) {
		console.error("jobs/confirm error:", error);
		return res.status(error.statusCode || 500).json({
			error: error.message,
			...(error.errors ? { errors: error.errors } : {}),
		});
	}
}
