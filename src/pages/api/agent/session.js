import dbConnect from "@/lib/dbConnect";
import Job from "@/backend/models/job";
import Call from "@/backend/models/call";
import getVertical from "@/config/verticals";
import { buildIntakeVars, buildBuyerVars } from "@/backend/services/agentVars";
import { renderVendorSystemPrompt } from "@/backend/services/vendorBrain";

const AGENT_IDS = {
	intake: () => process.env.ELEVENLABS_INTAKE_AGENT_ID,
	buyer: () => process.env.ELEVENLABS_BUYER_AGENT_ID,
	vendor: () => process.env.ELEVENLABS_VENDOR_AGENT_ID,
};

export default async function handler(req, res) {
	if (req.method !== "POST") {
		return res.status(405).json({ error: "Method not allowed" });
	}
	try {
		await dbConnect();
		const { role, jobId, callId } = req.body || {};
		if (!AGENT_IDS[role]) {
			return res.status(400).json({ error: "role must be 'intake', 'buyer' or 'vendor'" });
		}

		const job = await Job.findById(jobId);
		if (!job) return res.status(404).json({ error: "Job not found" });
		const vertical = getVertical(job.vertical);
		if (!vertical) return res.status(400).json({ error: "Unknown vertical" });

		let dynamicVariables;
		let voiceId;
		if (role === "intake") {
			dynamicVariables = buildIntakeVars(job, vertical);
		} else if (role === "vendor") {
			// Counter-agent: the whole persona ships as one server-rendered prompt,
			// same renderer the Anthropic sim brain uses. Voice comes from the card
			// and is applied client-side as a tts override.
			const call = await Call.findById(callId);
			if (!call) return res.status(404).json({ error: "Call not found" });
			const card =
				vertical.vendorPolicyCards.find((c) => c.id === call.policyCardId) ||
				vertical.vendorPolicyCards[0];
			dynamicVariables = {
				vendor_system_prompt: renderVendorSystemPrompt({
					card,
					vertical,
					job,
					vendorName: call.vendorName,
					jitter: call.pricingJitter || 1,
				}),
			};
			voiceId = card.voiceId;
		} else {
			const call = await Call.findById(callId);
			if (!call) return res.status(404).json({ error: "Call not found" });
			// buildBuyerVars enforces the honesty guardrail: leverage comes only
			// from committed Quote docs pinned to this call, vendor names redacted.
			dynamicVariables = await buildBuyerVars(job, call, vertical);
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

		return res.status(200).json({ signedUrl, dynamicVariables, ...(voiceId && { voiceId }) });
	} catch (error) {
		console.error("agent/session error:", error);
		return res.status(500).json({ error: error.message });
	}
}
