import dbConnect from "@/lib/dbConnect";
import Call from "@/backend/models/call";
import Quote from "@/backend/models/quote";

export default async function handler(req, res) {
  try {
    await dbConnect();
    const { id } = req.query;
    const call = await Call.findById(id);
    if (!call) {
      return res.status(404).json({ error: "Call not found" });
    }

    if (req.method === "GET") {
      const quote = await Quote.findOne({ callId: call._id, committed: true });
      return res.status(200).json({ call, quote });
    }

    if (req.method === "PATCH") {
      const { status, elevenConversationId, mode, vendorName } = req.body || {};
      if (status !== undefined) call.status = status;
      if (elevenConversationId !== undefined) call.elevenConversationId = elevenConversationId;
      if (mode !== undefined) call.mode = mode;
      if (vendorName !== undefined) call.vendorName = vendorName;
      await call.save();
      return res.status(200).json({ call });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    console.error("calls/[id] error:", error);
    return res.status(500).json({ error: error.message });
  }
}
