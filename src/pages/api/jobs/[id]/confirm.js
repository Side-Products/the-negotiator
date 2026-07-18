import dbConnect from "@/lib/dbConnect";
import Job from "@/backend/models/job";

export default async function handler(req, res) {
	if (req.method !== "POST") {
		return res.status(405).json({ error: "Method not allowed" });
	}
	try {
		await dbConnect();
		const job = await Job.findById(req.query.id);
		if (!job) return res.status(404).json({ error: "Job not found" });

		if (!job.confirmed) {
			job.confirmed = true;
			job.confirmedAt = new Date();
			job.status = "confirmed";
			await job.save();
		}
		return res.status(200).json({ job });
	} catch (error) {
		console.error("jobs/confirm error:", error);
		return res.status(500).json({ error: error.message });
	}
}
