import dbConnect from "@/lib/dbConnect";
import Call from "@/backend/models/call";
import Job from "@/backend/models/job";
import Quote from "@/backend/models/quote";
import getVertical from "@/config/verticals";
import { evaluate } from "@/backend/services/redFlagService";

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

    const quote = await Quote.findOne({ callId: call._id, committed: false });
    if (!quote || !quote.lines.length) {
      // Idempotent: an agent retry after a successful commit gets the committed
      // quote back, not an error it would relay as "the vendor gave nothing".
      const committed = await Quote.findOne({ callId: call._id, committed: true });
      if (committed) {
        return res
          .status(200)
          .json({ total: committed.total, redFlags: committed.redFlags || [] });
      }
      return res.status(400).json({ error: "No quote lines logged for this call" });
    }

    const { total, guaranteed, valid_until, turnRef } = req.body || {};

    // The itemised sum is the truth — the agent's claimed total can't drift.
    const recomputed = quote.lines.reduce((sum, l) => sum + (l.amount || 0), 0);
    let note;
    if (total !== undefined && Math.abs(Number(total) - recomputed) > 1) {
      note = `Claimed total $${Number(total)} differs from itemised sum — corrected to $${recomputed}.`;
    }

    quote.total = recomputed;
    quote.guaranteed = !!guaranteed;
    if (valid_until !== undefined) quote.validUntil = valid_until;

    const job = await Job.findById(call.jobId);
    const vertical = getVertical(job?.vertical);
    const redFlags = vertical ? evaluate(quote, vertical) : [];
    quote.redFlags = redFlags;

    if (call.round === 2 && call.vendorName) {
      const round1Call = await Call.findOne({
        jobId: call.jobId,
        vendorName: call.vendorName,
        round: 1,
      });
      if (round1Call) {
        const superseded = await Quote.findOne({ callId: round1Call._id, committed: true });
        if (superseded) quote.supersedes = superseded._id;
      }
    }

    quote.committed = true;
    await quote.save();

    call.outcome = { type: "quote", turnRef };
    await call.save();

    return res.status(200).json({ total: recomputed, redFlags, ...(note && { note }) });
  } catch (error) {
    console.error("commit error:", error);
    return res.status(500).json({ error: error.message });
  }
}
