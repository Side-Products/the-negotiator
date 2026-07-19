import dbConnect from "@/lib/dbConnect";
import Job from "@/backend/models/job";
import Call from "@/backend/models/call";
import getVertical from "@/config/verticals";

// Creates a single LIVE browser call: role-play (human plays the vendor via
// the mic) or sim (agent vs agent — buyer voice session + vendor persona
// spoken via TTS). Live sim calls carry NO batch number, so the server-side
// batch runner never touches them. Batch calls go through /batch-calls.
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
		const vertical = getVertical(job.vertical);
		if (!vertical) return res.status(400).json({ error: "Unknown vertical" });

		const body = req.body || {};
		const mode = ["sim", "counter"].includes(body.mode) ? body.mode : "roleplay";
		// counter mode may create a batch of cards in one click (capped at 10);
		// sim and roleplay stay single.
		const howMany = mode === "counter" ? Math.min(Math.max(Number(body.count) || 1, 1), 10) : 1;
		const existing = await Call.countDocuments({ jobId: job._id, mode, batch: { $exists: false } });
		const cards = vertical.vendorPolicyCards;

		const created = [];
		for (let i = 0; i < howMany; i++) {
			const n = existing + i;
			// Rotate through the policy cards so repeated calls show distinct
			// negotiation styles. Suffix repeat visits so vendorName stays unique:
			// leverage building and round-2 targeting key off vendorName.
			const card = cards[n % cards.length];
			const visit = Math.floor(n / cards.length);
			const baseName = mode === "roleplay" ? `Role-play vendor ${n + 1}` : card.businessName;
			created.push(
				await Call.create({
					jobId: job._id,
					specVersion: job.specVersion,
					vendorName:
						(howMany === 1 && body.vendorName) ||
						(visit > 0 ? `${baseName} #${visit + 1}` : baseName),
					policyCardId: card.id,
					round: 1,
					mode,
					pricingJitter: 0.9 + Math.random() * 0.25,
					status: "pending",
				}),
			);
		}

		if (job.status === "confirmed") {
			job.status = "calling";
			await job.save();
		}
		return res.status(200).json({ call: created[0], calls: created });
	} catch (error) {
		console.error("jobs/calls error:", error);
		return res.status(500).json({ error: error.message });
	}
}
