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

    const { type, note, turnRef } = req.body || {};
    if (!["quote", "callback", "declined"].includes(type)) {
      return res.status(400).json({ error: "type must be quote, callback, or declined" });
    }

    call.outcome = { type, note, turnRef };
    await call.save();

    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error("outcome error:", error);
    return res.status(500).json({ error: error.message });
  }
}
