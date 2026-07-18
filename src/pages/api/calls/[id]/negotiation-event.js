import dbConnect from "@/lib/dbConnect";
import Call from "@/backend/models/call";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  try {
    await dbConnect();
    const { id } = req.query;
    const call = await Call.findById(id);
    if (!call) {
      return res.status(404).json({ error: "Call not found" });
    }

    const { lever_id, before_total, after_total, note, turnRef } = req.body || {};
    if (!lever_id) {
      return res.status(400).json({ error: "lever_id is required" });
    }

    call.negotiationEvents.push({
      leverId: lever_id,
      beforeTotal: Number(before_total),
      afterTotal: Number(after_total),
      citedQuoteId: call.leverageQuoteIds?.[0] || null,
      turnRef,
      note,
    });
    await call.save();

    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error("negotiation-event error:", error);
    return res.status(500).json({ error: error.message });
  }
}
