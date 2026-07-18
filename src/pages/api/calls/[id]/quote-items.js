import dbConnect from "@/lib/dbConnect";
import Call from "@/backend/models/call";
import Quote from "@/backend/models/quote";

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

    const { fee_key, label, amount, note, turnRef } = req.body || {};
    if (!fee_key || amount === undefined) {
      return res.status(400).json({ error: "fee_key and amount are required" });
    }

    // Atomic upsert-and-push: overlapping tool calls must not each create
    // their own uncommitted quote and split the lines across two docs.
    const quote = await Quote.findOneAndUpdate(
      { callId: call._id, committed: false },
      {
        $push: {
          lines: { feeKey: fee_key, label: label || fee_key, amount: Number(amount), note, turnRef },
        },
        $setOnInsert: { jobId: call.jobId },
      },
      { upsert: true, new: true },
    );
    const runningTotal = quote.lines.reduce((sum, l) => sum + (l.amount || 0), 0);
    quote.total = runningTotal;
    await quote.save();

    return res.status(200).json({ ok: true, runningTotal });
  } catch (error) {
    console.error("quote-items error:", error);
    return res.status(500).json({ error: error.message });
  }
}
