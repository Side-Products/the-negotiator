import Job from "@/backend/models/job";
import Call from "@/backend/models/call";
import Quote from "@/backend/models/quote";
import getVertical from "@/config/verticals";
import { complete } from "@/backend/services/llm";
import { riskAdjustedTotal } from "@/lib/utils";

const hasFlag = (quote, flagId) => (quote.redFlags || []).some((f) => f.id === flagId);

export const generateReport = async (jobId) => {
  const job = await Job.findById(jobId);
  if (!job) throw new Error("Job not found");

  const vertical = getVertical(job.vertical);
  const calls = await Call.find({ jobId });
  const quotes = await Quote.find({ jobId, committed: true });

  const riskMultiplier = vertical.benchmarks.riskMultiplier || 1.3;
  const callByIdForRanking = Object.fromEntries(calls.map((c) => [c._id.toString(), c]));
  // Deal brain: one offer per vendor, and it is that vendor's BEST committed
  // quote by risk-adjusted cost, whatever round produced it. A round-2 call
  // that lands worse than round 1 must not replace the better offer.
  const bestByVendor = new Map();
  for (const q of quotes) {
    const vendor = callByIdForRanking[q.callId?.toString()]?.vendorName || q.callId?.toString();
    const current = bestByVendor.get(vendor);
    if (!current || riskAdjustedTotal(q, riskMultiplier) < riskAdjustedTotal(current, riskMultiplier)) {
      bestByVendor.set(vendor, q);
    }
  }
  // Rank by risk-adjusted cost, not sticker price. An unguaranteed or
  // red-flagged quote carries an expected overrun (see utils.riskAdjustedTotal).
  const active = [...bestByVendor.values()].sort(
    (a, b) =>
      riskAdjustedTotal(a, riskMultiplier) - riskAdjustedTotal(b, riskMultiplier) ||
      (a.total || 0) - (b.total || 0),
  );

  const ranking = active.map((q, i) => ({
    quoteId: q._id,
    rank: i + 1,
    landedTotal: q.total,
    riskAdjusted: riskAdjustedTotal(q, riskMultiplier),
    riskNote: (q.redFlags || []).map((f) => f.message).join(" ") || "",
  }));

  const nonLowball = active.filter((q) => !hasFlag(q, "lowball"));
  const recommended = nonLowball[0] || active[0] || null;

  const callById = Object.fromEntries(calls.map((c) => [c._id.toString(), c]));

  // Structured non-quotes are evidence too: the report must account for every
  // call, not just the ones that produced a number.
  const quotedCallIds = new Set(quotes.map((q) => q.callId?.toString()));
  const nonQuoted = calls
    .filter(
      (c) =>
        ["callback", "declined"].includes(c.outcome?.type) && !quotedCallIds.has(c._id.toString()),
    )
    .map((c) => ({
      callId: c._id.toString(),
      vendorName: c.vendorName,
      outcome: c.outcome?.type,
      note: c.outcome?.note,
      transcript: (c.transcript || []).map((t) => ({
        turnIndex: t.turnIndex,
        role: t.role,
        text: t.text,
      })),
    }));
  const evidence = active.map((q) => {
    const call = callById[q.callId?.toString()];
    return {
      quoteId: q._id.toString(),
      callId: q.callId?.toString(),
      vendorName: call?.vendorName,
      round: call?.round,
      total: q.total,
      guaranteed: q.guaranteed,
      validUntil: q.validUntil,
      lines: (q.lines || []).map((l) => ({
        label: l.label,
        amount: l.amount,
        turnRef: l.turnRef,
      })),
      redFlags: q.redFlags || [],
      supersedes: q.supersedes?.toString() || null,
      negotiationEvents: (call?.negotiationEvents || []).map((e) => ({
        leverId: e.leverId,
        beforeTotal: e.beforeTotal,
        afterTotal: e.afterTotal,
        turnRef: e.turnRef,
        note: e.note,
      })),
      transcript: (call?.transcript || []).map((t) => ({
        turnIndex: t.turnIndex,
        role: t.role,
        text: t.text,
      })),
    };
  });

  const narrative = await complete({
    tier: "smart",
    maxTokens: 8000,
    system: `You write plain-language buyer reports comparing vendor quotes gathered by phone.

RULES
- Every factual claim (a price, a fee, a refusal, a concession, a red flag) MUST carry a citation in the exact form [call:<callId>#<turnRef>] pointing at the transcript turn that proves it. No uncited claims.
- Use the callId and turnIndex/turnRef values from the data verbatim.
- Plain language a homeowner understands. No jargon, no markdown headings, short paragraphs.
- Never use em dashes; use commas, colons, or periods. Avoid AI-writing patterns: no "delve", "It's worth noting", "In conclusion", no bullet lists, no hedging boilerplate.
- Explain the recommendation, the risks on the cheaper options, and any price movement caused by negotiation (before vs after, and what leverage caused it).
- Account for every call: vendors who requested a callback or declined get one short sentence each on how the call ended and why, with a citation where transcript turns exist. If a call has NO transcript turns, describe its outcome without any citation; never cite a turn that is not present in the provided data.
- Quotes are ranked by RISK-ADJUSTED cost: quotes that are not guaranteed in writing, or carry a lowball red flag, are adjusted upward (the data shows such estimates routinely overrun). When the adjustment changes the order, explain it in plain words: a cheaper sticker price lost because the number is not dependable.
- Market context: mid $${vertical.benchmarks.marketMid}, range $${vertical.benchmarks.marketMin}-$${vertical.benchmarks.marketMax} (${vertical.benchmarks.source}).`,
    messages: [
      {
        role: "user",
        text: `Job spec: ${JSON.stringify(job.spec)}

Recommended quoteId: ${recommended?._id?.toString() || "none"}

Quotes with evidence:
${JSON.stringify(evidence)}

Vendors who did not quote (callbacks/declines, with transcripts):
${JSON.stringify(nonQuoted)}

Write the report narrative.`,
      },
    ],
  });

  const report = {
    ranking,
    recommendedQuoteId: recommended?._id || null,
    narrative,
    generatedAt: new Date(),
  };

  job.report = report;
  job.status = "done";
  await job.save();

  return report;
};

export default { generateReport };
