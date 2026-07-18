import Anthropic from "@anthropic-ai/sdk";
import Job from "@/backend/models/job";
import Call from "@/backend/models/call";
import Quote from "@/backend/models/quote";
import getVertical from "@/config/verticals";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const hasFlag = (quote, flagId) => (quote.redFlags || []).some((f) => f.id === flagId);

export const generateReport = async (jobId) => {
  const job = await Job.findById(jobId);
  if (!job) throw new Error("Job not found");

  const vertical = getVertical(job.vertical);
  const calls = await Call.find({ jobId });
  const quotes = await Quote.find({ jobId, committed: true });

  // A round-2 quote supersedes the same vendor's round-1 quote — rank only the live ones.
  const supersededIds = new Set(quotes.map((q) => q.supersedes?.toString()).filter(Boolean));
  const active = quotes
    .filter((q) => !supersededIds.has(q._id.toString()))
    .sort((a, b) => (a.total || 0) - (b.total || 0));

  const ranking = active.map((q, i) => ({
    quoteId: q._id,
    rank: i + 1,
    landedTotal: q.total,
    riskNote: (q.redFlags || []).map((f) => f.message).join(" ") || "",
  }));

  const nonLowball = active.filter((q) => !hasFlag(q, "lowball"));
  const recommended =
    nonLowball.find((q) => q.guaranteed) || nonLowball[0] || active[0] || null;

  const callById = Object.fromEntries(calls.map((c) => [c._id.toString(), c]));
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

  const response = await anthropic.messages.create({
    model: "claude-opus-4-8",
    max_tokens: 8000,
    thinking: { type: "adaptive" },
    system: `You write plain-language buyer reports comparing vendor quotes gathered by phone.

RULES
- Every factual claim (a price, a fee, a refusal, a concession, a red flag) MUST carry a citation in the exact form [call:<callId>#<turnRef>] pointing at the transcript turn that proves it. No uncited claims.
- Use the callId and turnIndex/turnRef values from the data verbatim.
- Plain language a homeowner understands. No jargon, no markdown headings, short paragraphs.
- Explain the recommendation, the risks on the cheaper options, and any price movement caused by negotiation (before vs after, and what leverage caused it).
- Market context: mid $${vertical.benchmarks.marketMid}, range $${vertical.benchmarks.marketMin}-$${vertical.benchmarks.marketMax} (${vertical.benchmarks.source}).`,
    messages: [
      {
        role: "user",
        content: `Job spec: ${JSON.stringify(job.spec)}

Recommended quoteId: ${recommended?._id?.toString() || "none"}

Quotes with evidence:
${JSON.stringify(evidence)}

Write the report narrative.`,
      },
    ],
  });

  const narrative = response.content.find((b) => b.type === "text")?.text?.trim() || "";

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
