import dbConnect from "@/lib/dbConnect";
import Job from "@/backend/models/job";
import Call from "@/backend/models/call";
import Quote from "@/backend/models/quote";

export default async function handler(req, res) {
	try {
		await dbConnect();
		const { id } = req.query;
		const job = await Job.findById(id);
		if (!job) return res.status(404).json({ error: "Job not found" });

		if (req.method === "GET") {
			const [calls, quotes] = await Promise.all([
				Call.find({ jobId: id }).sort({ createdAt: 1 }),
				Quote.find({ jobId: id }).sort({ createdAt: 1 }),
			]);
			return res.status(200).json({ job, calls, quotes });
		}

		if (req.method === "PATCH") {
			// Call metadata, not spec content — allowed regardless of confirm state.
			if (req.body?.intakeConversationId) {
				job.intakeConversationId = req.body.intakeConversationId;
				await job.save();
				return res.status(200).json({ job });
			}
			if (job.confirmed) {
				return res.status(409).json({ error: "Spec is confirmed and locked" });
			}
			const { field_key, value_json } = req.body || {};
			if (!field_key) {
				return res.status(400).json({ error: "field_key is required" });
			}
			let value = value_json;
			try {
				value = JSON.parse(value_json);
			} catch {
				// fall back to the raw string
			}
			job.spec = { ...(job.spec || {}), [field_key]: value };
			job.markModified("spec");
			job.specSource =
				job.specSource === "doc" || job.specSource === "both" ? "both" : "voice";
			await job.save();
			return res.status(200).json({ job });
		}

		return res.status(405).json({ error: "Method not allowed" });
	} catch (error) {
		console.error("jobs/[id] error:", error);
		return res.status(500).json({ error: error.message });
	}
}
