import dbConnect from "@/lib/dbConnect";
import Call from "@/backend/models/call";
import Job from "@/backend/models/job";
import getVertical from "@/config/verticals";
import { commitQuote } from "@/backend/services/quoteOps";

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

    const { total, guaranteed, valid_until, turnRef } = req.body || {};
    const job = await Job.findById(call.jobId);
    const vertical = getVertical(job?.vertical);

    const result = await commitQuote(call, vertical, {
      total,
      guaranteed,
      validUntil: valid_until,
      turnRef,
    });
    if (result.error) return res.status(400).json({ error: result.error });
    return res.status(200).json(result);
  } catch (error) {
    console.error("commit error:", error);
    return res.status(500).json({ error: error.message });
  }
}
