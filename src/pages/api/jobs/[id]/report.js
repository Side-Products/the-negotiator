import dbConnect from "@/lib/dbConnect";
import Job from "@/backend/models/job";
import { generateReport } from "@/backend/services/reportService";

export default async function handler(req, res) {
	if (req.method !== "POST") {
		return res.status(405).json({ error: "Method not allowed" });
	}
	try {
		await dbConnect();
		const job = await Job.findById(req.query.id);
		if (!job) return res.status(404).json({ error: "Job not found" });

		const report = await generateReport(job._id.toString());
		job.report = report;
		job.status = "done";
		await job.save();
		return res.status(200).json({ job });
	} catch (error) {
		console.error("jobs/report error:", error);
		return res.status(500).json({ error: error.message });
	}
}
