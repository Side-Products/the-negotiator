import dbConnect from "@/lib/dbConnect";
import Job from "@/backend/models/job";
import { createWinnerCircleCalls, runCall } from "@/backend/services/batchCaller";

// Manual negotiation trigger. The winner circle runs AUTOMATICALLY when the
// batch run completes; this route remains for per-vendor renegotiation
// (body.vendorName) or for re-firing the round by hand.
export default async function handler(req, res) {
	if (req.method !== "POST") {
		return res.status(405).json({ error: "Method not allowed" });
	}
	try {
		await dbConnect();
		const job = await Job.findById(req.query.id);
		if (!job) return res.status(404).json({ error: "Job not found" });

		let created;
		try {
			created = await createWinnerCircleCalls(job._id, {
				vendorName: (req.body || {}).vendorName,
			});
		} catch (e) {
			return res.status(409).json({ error: e.message });
		}

		// Fire and forget; the UI polls.
		(async () => {
			for (const c of created.filter((x) => x.status === "pending")) {
				await runCall(c._id);
			}
		})().catch((e) => console.error("round-2 run failed:", e));

		return res.status(200).json({ calls: created, call: created[0] });
	} catch (error) {
		console.error("jobs/negotiate error:", error);
		return res.status(500).json({ error: error.message });
	}
}
