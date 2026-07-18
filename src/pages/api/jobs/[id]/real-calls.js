import dbConnect from "@/lib/dbConnect";
import Job from "@/backend/models/job";
import Call from "@/backend/models/call";
import {
	realCallsConfigured,
	startRealCalls,
	runRealCallsSequentially,
} from "@/backend/services/realCaller";

const MAX_REAL_CALLS = 5; // hard cap: these are real businesses' phone lines

export default async function handler(req, res) {
	if (req.method !== "POST") {
		return res.status(405).json({ error: "Method not allowed" });
	}
	try {
		await dbConnect();
		if (!realCallsConfigured()) {
			return res.status(501).json({
				error:
					"Real calls not configured. Set ELEVENLABS_PHONE_NUMBER_ID (attach a phone number to the agent in the ElevenLabs dashboard) and PUBLIC_URL (deployed URL or tunnel), then re-run npm run create-agents.",
			});
		}
		const job = await Job.findById(req.query.id);
		if (!job) return res.status(404).json({ error: "Job not found" });
		if (!job.confirmed) {
			return res.status(409).json({ error: "Confirm the spec before starting calls" });
		}

		const { limit = 3, location, testNumber } = req.body || {};

		// Test dial: one call to the user's own phone so the whole pipeline
		// (webhook tools, recording, transcript) can be verified before dialing
		// real businesses. Repeatable; does not block the real run.
		if (testNumber) {
			const call = await Call.create({
				jobId: job._id,
				specVersion: job.specVersion,
				vendorName: "Test vendor (your phone)",
				phone: testNumber,
				round: 1,
				mode: "real",
				isTest: true,
				status: "pending",
			});
			runRealCallsSequentially([call._id]).catch((e) =>
				console.error("test call failed:", e),
			);
			return res.status(200).json({ calls: [call], test: true });
		}

		// Idempotent: one real-call run per job (test dials excluded).
		const existing = await Call.find({ jobId: job._id, mode: "real", isTest: { $ne: true } });
		if (existing.length) return res.status(200).json({ calls: existing, alreadyRunning: true });
		const { calls } = await startRealCalls(job, {
			limit: Math.min(limit, MAX_REAL_CALLS),
			location,
		});
		job.status = "calling";
		await job.save();

		// Sequential dialing, fire and forget; the UI polls for progress.
		runRealCallsSequentially(calls.map((c) => c._id)).catch((e) =>
			console.error("real-calls run failed:", e),
		);

		return res.status(200).json({ calls });
	} catch (error) {
		console.error("real-calls error:", error);
		return res.status(500).json({ error: error.message });
	}
}
