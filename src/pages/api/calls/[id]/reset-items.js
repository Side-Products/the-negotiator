import dbConnect from "@/lib/dbConnect";
import Call from "@/backend/models/call";
import { resetQuoteLines } from "@/backend/services/quoteOps";

// Clears the call's uncommitted quote lines so the agent can re-itemise after
// the deal changed mid-negotiation. Committed quotes are never touched.
export default async function handler(req, res) {
	if (req.method !== "POST") {
		return res.status(405).json({ error: "Method not allowed" });
	}
	try {
		await dbConnect();
		const call = await Call.findById(req.query.id);
		if (!call) return res.status(404).json({ error: "Call not found" });
		const result = await resetQuoteLines(call);
		return res.status(200).json(result);
	} catch (error) {
		console.error("reset-items error:", error);
		return res.status(500).json({ error: error.message });
	}
}
