import dbConnect from "@/lib/dbConnect";
import Call from "@/backend/models/call";
import { addQuoteLine } from "@/backend/services/quoteOps";

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

    const result = await addQuoteLine(call, { feeKey: fee_key, label, amount, note, turnRef });
    return res.status(200).json(result);
  } catch (error) {
    console.error("quote-items error:", error);
    return res.status(500).json({ error: error.message });
  }
}
