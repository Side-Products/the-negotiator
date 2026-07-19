import dbConnect from "@/lib/dbConnect";
import Job from "@/backend/models/job";
import getVertical from "@/config/verticals";
import { extractSpec } from "@/backend/services/docIntake";
import { wasabiConfigured, uploadBuffer } from "@/backend/services/wasabiStorage";
import { applySpecPatch, validationMessage } from "@/backend/services/jobSpec";

const EXT = { "application/pdf": "pdf", "image/png": "png", "image/webp": "webp" };

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
		const applied = applySpecPatch(job ? job.vertical : vertical, job?.spec || {}, spec);
		if (!applied.valid) {
			return res.status(422).json({
				error: validationMessage(applied.errors),
				errors: applied.errors,
			});
		}

		if (!job) {
			job = await Job.create({ vertical, spec: applied.spec, specSource: "doc" });
		} else {
			job.spec = applied.spec;
			job.markModified("spec");
			job.specSource =
				job.specSource === "voice" || job.specSource === "both" ? "both" : "doc";
			await job.save();
		}

		// Keep the source document as evidence (Wasabi key on the job).
		if (wasabiConfigured()) {
			try {
				const ext = EXT[mediaType] || "jpg";
				const key = `documents/${job._id}-${Date.now()}.${ext}`;
				await uploadBuffer(Buffer.from(fileBase64, "base64"), key, mediaType);
				job.sourceDocKey = key;
				await job.save();
			} catch (storeError) {
				// Evidence storage must never fail the extraction itself.
				console.error("doc store error:", storeError);
			}
		}

		return res.status(200).json({ job });
	} catch (error) {
		console.error("jobs/extract error:", error);
		return res.status(500).json({ error: error.message });
	}
}
