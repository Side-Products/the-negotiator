import dbConnect from "@/lib/dbConnect";
import Job from "@/backend/models/job";
import { confirmJob } from "@/backend/services/jobConfirmation";
import { normalizeLocationPatch } from "@/backend/services/locationValidation";
import getVertical from "@/config/verticals";

export default async function handler(req, res) {
	if (req.method !== "POST") {
		return res.status(405).json({ error: "Method not allowed" });
	}
	try {
		await dbConnect();
		const job = await Job.findById(req.query.id);
		if (!job) return res.status(404).json({ error: "Job not found" });

		// Same location validation the chat bots run: silently normalize obvious
		// matches, bounce ambiguous ones back for review unless already reviewed.
		const locationsReviewed = req.body?.locationsReviewed === true;
		const vertical = getVertical(job.vertical);
		if (!job.confirmed && vertical) {
			const { patch, confirmations } = await normalizeLocationPatch(
				vertical,
				job.spec,
			);
			const pending = new Set(confirmations.map((c) => c.field));
			let changed = false;
			for (const [key, value] of Object.entries(patch)) {
				if (!pending.has(key) && job.spec[key] !== value) {
					job.spec[key] = value;
					changed = true;
				}
			}
			if (changed) {
				job.markModified("spec");
				await job.save();
			}
			if (confirmations.length && !locationsReviewed) {
				return res.status(422).json({
					error: confirmations
						.map((c) => {
							if (c.kind === "area")
								return `${c.label}: "${c.original}" is an area, keeping it as is unless a street or landmark is added`;
							return c.suggestion && c.suggestion !== c.original
								? `${c.label}: did you mean "${c.suggestion}"?`
								: `${c.label}: could not verify "${c.original}"`;
						})
						.join(" "),
					locationConfirmations: confirmations,
					job,
				});
			}
		}

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
