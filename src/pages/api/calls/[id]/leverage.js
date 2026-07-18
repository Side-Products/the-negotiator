import dbConnect from "@/lib/dbConnect";
import Call from "@/backend/models/call";
import Quote from "@/backend/models/quote";

// Same server-side filter as leverage_json in /api/agent/session: only committed
// quotes explicitly pinned on the call. Round-1 calls have none, so the buyer
// agent physically cannot cite a bid that doesn't exist. Never leak vendor names.
export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  try {
    await dbConnect();
    const { id } = req.query;
    const call = await Call.findById(id);
    if (!call) {
      return res.status(404).json({ error: "Call not found" });
    }

    const quotes = await Quote.find({
      _id: { $in: call.leverageQuoteIds || [] },
      committed: true,
    });

    const leverage = quotes.map((q) => ({
      amount: q.total,
      guaranteed: !!q.guaranteed,
      itemised: (q.lines || []).map((l) => ({ label: l.label, amount: l.amount })),
      descriptor: "another licensed provider",
    }));

    return res.status(200).json({ leverage });
  } catch (error) {
    console.error("leverage error:", error);
    return res.status(500).json({ error: error.message });
  }
}
