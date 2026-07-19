import dbConnect from "@/lib/dbConnect";
import Call from "@/backend/models/call";
import { buildLeverage } from "@/backend/services/agentVars";

// Same server-side builder as leverage_json in /api/agent/session: only
// committed quotes explicitly pinned on the call, enriched with recorded
// terms (guarantees, waived fees, in-call price movements). Round-1 calls
// have none, so the buyer agent physically cannot cite a bid that doesn't
// exist. Never leaks vendor names.
export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  try {
    await dbConnect();
    const call = await Call.findById(req.query.id);
    if (!call) {
      return res.status(404).json({ error: "Call not found" });
    }
    const leverage = await buildLeverage(call);
    return res.status(200).json({ leverage });
  } catch (error) {
    console.error("leverage error:", error);
    return res.status(500).json({ error: error.message });
  }
}
