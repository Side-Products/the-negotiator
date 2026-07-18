import dbConnect from "@/lib/dbConnect";
import Job from "@/backend/models/job";
import Call from "@/backend/models/call";
import Quote from "@/backend/models/quote";
import getVertical from "@/config/verticals";

const AGENT_IDS = {
	intake: () => process.env.ELEVENLABS_INTAKE_AGENT_ID,
	buyer: () => process.env.ELEVENLABS_BUYER_AGENT_ID,
};

export default async function handler(req, res) {
	if (req.method !== "POST") {
		return res.status(405).json({ error: "Method not allowed" });
	}
	try {
		await dbConnect();
		const { role, jobId, callId } = req.body || {};
		if (!AGENT_IDS[role]) {
			return res.status(400).json({ error: "role must be 'intake' or 'buyer'" });
		}

		const job = await Job.findById(jobId);
		if (!job) return res.status(404).json({ error: "Job not found" });
		const vertical = getVertical(job.vertical);
		if (!vertical) return res.status(400).json({ error: "Unknown vertical" });

		let dynamicVariables;
		if (role === "intake") {
			dynamicVariables = {
				vertical_label: vertical.label,
				taxonomy_json: JSON.stringify(vertical.jobSpec.fields),
				interview_json: JSON.stringify(vertical.interview),
				spec_draft_json: JSON.stringify(job.spec || {}),
			};
		} else {
			const call = await Call.findById(callId);
			if (!call) return res.status(404).json({ error: "Call not found" });

			// Honesty guardrail: leverage is built server-side from committed Quote
			// docs pinned to this call only (round 1 gets []), vendor names redacted —
			// the agent physically cannot cite a bid that doesn't exist in Mongo.
			const quotes = await Quote.find({
				_id: { $in: call.leverageQuoteIds || [] },
				committed: true,
			});
			const leverage = quotes.map((q) => ({
				amount: q.total,
				guaranteed: !!q.guaranteed,
				itemised: (q.lines || []).map((l) => ({
					label: l.label,
					amount: l.amount,
				})),
				descriptor: "another licensed provider",
			}));

			dynamicVariables = {
				vendor_name: call.vendorName || "",
				job_spec_json: JSON.stringify(job.spec || {}),
				round: call.round || 1,
				leverage_json: JSON.stringify(leverage),
				levers_json: JSON.stringify(vertical.levers),
				fees_json: JSON.stringify(vertical.fees),
				benchmarks_json: JSON.stringify(vertical.benchmarks),
			};
		}

		const agentId = AGENT_IDS[role]();
		if (!agentId) {
			return res.status(500).json({ error: `Missing ElevenLabs agent id for role '${role}'` });
		}

		const response = await fetch(
			`https://api.elevenlabs.io/v1/convai/conversation/get-signed-url?agent_id=${agentId}`,
			{ headers: { "xi-api-key": process.env.ELEVENLABS_API_KEY } },
		);
		if (!response.ok) {
			return res
				.status(502)
				.json({ error: `ElevenLabs signed-url request failed: ${response.status}` });
		}
		const { signed_url: signedUrl } = await response.json();

		return res.status(200).json({ signedUrl, dynamicVariables });
	} catch (error) {
		console.error("agent/session error:", error);
		return res.status(500).json({ error: error.message });
	}
}
