import dbConnect from "@/lib/dbConnect";
import Job from "@/backend/models/job";
import getVertical from "@/config/verticals";
import { extractSpec } from "@/backend/services/docIntake";

export const config = { api: { bodyParser: { sizeLimit: "12mb" } } };

export default async function handler(req, res) {
	if (req.method !== "POST") {
		return res.status(405).json({ error: "Method not allowed" });
	}
	try {
		await dbConnect();
		const { vertical, jobId, fileBase64, mediaType } = req.body || {};
		if (!fileBase64 || !mediaType) {
			return res.status(400).json({ error: "fileBase64 and mediaType are required" });
		}

		let job = null;
		if (jobId) {
			job = await Job.findById(jobId);
			if (!job) return res.status(404).json({ error: "Job not found" });
			if (job.confirmed) {
				return res.status(409).json({ error: "Spec is confirmed and locked" });
			}
		} else if (!getVertical(vertical)) {
			return res.status(400).json({ error: "Unknown vertical" });
		}

		const spec = await extractSpec({
			vertical: job ? job.vertical : vertical,
			fileBase64,
			mediaType,
		});

		if (!job) {
			job = await Job.create({ vertical, spec, specSource: "doc" });
		} else {
			job.spec = { ...(job.spec || {}), ...spec };
			job.markModified("spec");
			job.specSource =
				job.specSource === "voice" || job.specSource === "both" ? "both" : "doc";
			await job.save();
		}

		return res.status(200).json({ job });
	} catch (error) {
		console.error("jobs/extract error:", error);
		return res.status(500).json({ error: error.message });
	}
}
