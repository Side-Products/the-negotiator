import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { ChevronDown, ShieldCheck, Lock, BarChart3, ArrowLeft, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { noEmDash } from "@/lib/utils";
import { getVertical } from "@/config/verticals";
import { Loader } from "@/components/ui/Loader";
import RankingTable from "@/components/report/RankingTable";
import RedFlagBadge from "@/components/report/RedFlagBadge";
import QuoteBreakdown from "@/components/report/QuoteBreakdown";
import TranscriptView from "@/components/calls/TranscriptView";

const fmt = (n) =>
  typeof n === "number"
    ? n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 })
    : "—";

const CITATION_RE = /\[call:([^\]#\s]+)#(\d+)\]/g;

function renderWithCitations(text, calls, onCite) {
  const parts = [];
  let last = 0;
  let m;
  CITATION_RE.lastIndex = 0;
  while ((m = CITATION_RE.exec(text))) {
    const callId = m[1];
    const turnRef = Number(m[2]);
    if (m.index > last) parts.push(text.slice(last, m.index));
    const call = calls.find((c) => c._id === callId);
    parts.push(
      <button
        key={`${callId}-${turnRef}-${m.index}`}
        type="button"
        onClick={() => onCite(callId, turnRef)}
        title="Jump to this transcript moment"
        className="mx-0.5 inline-flex translate-y-[-1px] items-center gap-1 rounded-full border border-primary-400/40 bg-primary-400/10 px-2 py-px align-baseline text-xs font-medium text-primary-600 transition-colors hover:bg-primary-400/25 dark:text-primary-400"
      >
        {call?.vendorName || "call"} · turn {turnRef}
      </button>
    );
    last = m.index + m[0].length;
  }
  parts.push(text.slice(last));
  return parts;
}

function roundTwoDelta(call, quote, quotes) {
  if (call?.round !== 2) return null;
  const events = call.negotiationEvents || [];
  let before = events[0]?.beforeTotal;
  let after = events[events.length - 1]?.afterTotal;
  if (before == null && quote?.supersedes) {
    before = quotes.find((q) => q._id === quote.supersedes)?.total;
    after = quote?.total;
  }
  if (before == null || after == null) return null;
  return { before, after };
}

// Audio player for a call's recording. Sim calls without one yet offer an
// on-demand rendering (transcript synthesized in buyer + vendor voices).
function CallAudio({ call }) {
  const [recordingPath, setRecordingPath] = useState(call.recordingPath);
  const [rendering, setRendering] = useState(false);

  if (recordingPath) {
    return (
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Call recording
          {call.mode === "sim" && (
            <span className="ml-2 font-normal normal-case tracking-normal">
              (synthesized rendering of the simulated call)
            </span>
          )}
        </p>
        <audio controls preload="none" className="w-full" src={`/api/calls/${call._id}/audio`} />
      </div>
    );
  }

  if (call.mode !== "sim" || !(call.transcript || []).length) return null;

  const render = async () => {
    setRendering(true);
    try {
      const res = await fetch(`/api/calls/${call._id}/render-audio`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Rendering failed");
      setRecordingPath(data.call?.recordingPath);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setRendering(false);
    }
  };

  return (
    <button onClick={render} disabled={rendering} className="btn btn-secondary text-xs">
      {rendering ? "Rendering audio (about 30s)…" : "Render call audio"}
    </button>
  );
}

export default function ReportPage() {
  const router = useRouter();
  const { id } = router.query;
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [openCalls, setOpenCalls] = useState(() => new Set());
  const [activeCitation, setActiveCitation] = useState(null);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/jobs/${id}`)
      .then((res) => res.json())
      .then((json) => (json.error ? setError(json.error) : setData(json)))
      .catch((e) => setError(e.message));
  }, [id]);

  const openCall = (callId) => {
    setOpenCalls((prev) => new Set(prev).add(callId));
  };

  const toggleCall = (callId) => {
    setOpenCalls((prev) => {
      const next = new Set(prev);
      next.has(callId) ? next.delete(callId) : next.add(callId);
      return next;
    });
  };

  const onCite = (callId, turnRef) => {
    openCall(callId);
    setActiveCitation({ callId, turnRef });
    setTimeout(() => {
      const el =
        document.getElementById(`turn-${callId}-${turnRef}`) ||
        document.getElementById(`call-${callId}`);
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 120);
  };

  if (error) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <p className="text-error-600">{error}</p>
      </div>
    );
  }
  if (!data) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader label="Loading report" />
      </div>
    );
  }

  const { job, calls = [], quotes = [] } = data;
  const vertical = getVertical(job.vertical);
  const report = job.report;

  if (!report?.ranking?.length) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <h1 className="font-display text-2xl font-semibold">No report yet</h1>
        <p className="mt-2 text-muted-foreground">
          Finish the calls and generate the report from the job page.
        </p>
        <Link
          href={`/jobs/${job._id}`}
          className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-primary-600 hover:underline dark:text-primary-400"
        >
          <ArrowLeft className="h-4 w-4" /> Back to job
        </Link>
      </div>
    );
  }

  const recommendedQuote = quotes.find((q) => q._id === report.recommendedQuoteId);
  const recommendedCall =
    recommendedQuote && calls.find((c) => c._id === recommendedQuote.callId);
  const recommendedRank = report.ranking.find((r) => r.quoteId === report.recommendedQuoteId);

  const sections = [...report.ranking]
    .sort((a, b) => a.rank - b.rank)
    .map((r) => {
      const quote = quotes.find((q) => q._id === r.quoteId);
      const call = quote && calls.find((c) => c._id === quote.callId);
      return { ...r, quote, call };
    })
    .filter((s) => s.call);

  // Vendors who did not quote: documented callbacks and declines are evidence
  // too. Derived from calls, so this works for reports generated before it.
  const nonQuoted = calls.filter(
    (c) =>
      ["callback", "declined"].includes(c.outcome?.type) &&
      !quotes.some((q) => q.callId === c._id && q.committed),
  );

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 pb-20 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Link
            href={`/jobs/${job._id}`}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to job
          </Link>
          <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight">
            Negotiation report
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {vertical?.label || job.vertical}
            {report.generatedAt && ` · generated ${new Date(report.generatedAt).toLocaleString()}`}
          </p>
        </div>
        <span className="badge badge-info">Spec v{job.specVersion}</span>
      </div>

      {/* Recommendation banner */}
      <section className="card rounded-lg border-primary-400/50 p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-primary-600 dark:text-primary-400">
              Our recommendation
            </p>
            <h2 className="mt-1 font-display text-2xl font-semibold">
              {recommendedCall?.vendorName || "See ranking below"}
            </h2>
          </div>
          {recommendedRank && (
            <div className="text-right">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Landed total</p>
              <p className="font-display text-3xl font-semibold tabular-nums">
                {fmt(recommendedRank.landedTotal ?? recommendedQuote?.total)}
              </p>
            </div>
          )}
        </div>
        {report.narrative && (
          <div className="mt-5 space-y-3 border-t border-border pt-5 text-[15px] leading-7 text-foreground/90">
            {report.narrative.split(/\n\n+/).map((para, i) => (
              <p key={i}>{renderWithCitations(noEmDash(para), calls, onCite)}</p>
            ))}
          </div>
        )}
        <p className="mt-4 text-xs text-muted-foreground">
          Every claim above cites a transcript turn. Click a chip to see the evidence.
        </p>
      </section>

      {/* Ranking */}
      <section className="card rounded-lg p-6 sm:p-8">
        <h2 className="font-display text-lg font-semibold">Ranking</h2>
        <p className="mt-1 mb-4 text-sm text-muted-foreground">
          Committed quotes ranked by landed total. Red flags are shown, not hidden.
        </p>
        <RankingTable
          ranking={report.ranking}
          quotes={quotes}
          calls={calls}
          recommendedQuoteId={report.recommendedQuoteId}
          onSelect={(callId) => {
            openCall(callId);
            setTimeout(
              () =>
                document
                  .getElementById(`call-${callId}`)
                  ?.scrollIntoView({ behavior: "smooth", block: "start" }),
              120
            );
          }}
        />
      </section>

      {/* Vendors who did not quote */}
      {nonQuoted.length > 0 && (
        <section className="card rounded-lg p-6 sm:p-8">
          <h2 className="font-display text-lg font-semibold">Didn't quote</h2>
          <p className="mt-1 mb-4 text-sm text-muted-foreground">
            Every call ends in a structured outcome. These vendors gave no committed
            quote; here is exactly how each call ended.
          </p>
          <div className="space-y-3">
            {nonQuoted.map((call) => (
              <div key={call._id} id={`call-${call._id}`} className="border-t border-border pt-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">{call.vendorName}</span>
                  <span
                    className={`badge ${
                      call.outcome?.type === "callback" ? "badge-warning" : "badge-error"
                    }`}
                  >
                    {call.outcome?.type === "callback" ? "callback requested" : "declined"}
                  </span>
                  {call.batch && (
                    <span className="text-xs text-muted-foreground">batch {call.batch}</span>
                  )}
                </div>
                {call.outcome?.note && (
                  <p className="mt-1 text-sm text-muted-foreground">{noEmDash(call.outcome.note)}</p>
                )}
                {(call.transcript || []).length > 0 && (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground">
                      Transcript ({call.transcript.length} turns)
                    </summary>
                    <div className="mt-2">
                      <TranscriptView transcript={call.transcript} callId={call._id} />
                    </div>
                  </details>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Per-vendor evidence */}
      <section className="space-y-4">
        <h2 className="font-display text-lg font-semibold">Evidence by vendor</h2>
        {sections.map(({ rank, quote, call }) => {
          const open = openCalls.has(call._id);
          const delta = roundTwoDelta(call, quote, quotes);
          const highlightTurns = [
            ...(call.negotiationEvents || []).map((e) => e.turnRef).filter((t) => t != null),
            ...(activeCitation?.callId === call._id ? [activeCitation.turnRef] : []),
          ];
          return (
            <div key={call._id} id={`call-${call._id}`} className="card scroll-mt-24 rounded-lg">
              <button
                type="button"
                onClick={() => toggleCall(call._id)}
                className="flex w-full items-center gap-3 px-5 py-4 text-left"
              >
                <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground">
                  {rank}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">{call.vendorName}</span>
                    {call.round === 2 && <span className="badge badge-info">Round 2</span>}
                    {(quote.redFlags || []).map((flag) => (
                      <RedFlagBadge key={flag.id} flag={flag} />
                    ))}
                  </span>
                </span>
                <span className="font-semibold tabular-nums">{fmt(quote.total)}</span>
                <ChevronDown
                  className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${
                    open ? "rotate-180" : ""
                  }`}
                />
              </button>

              {open && (
                <div className="space-y-6 border-t border-border px-5 py-5">
                  {call.placeId && !call.placeId.startsWith("canned") && (
                    <a
                      href={`https://www.google.com/maps/place/?q=place_id:${call.placeId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="focus-ring inline-flex items-center gap-1.5 text-sm text-primary-500 hover:underline"
                    >
                      <ExternalLink aria-hidden="true" className="h-3.5 w-3.5" />
                      View {call.vendorName} on Google
                      {call.rating != null && (
                        <span className="text-muted-foreground">· ★ {call.rating}</span>
                      )}
                    </a>
                  )}
                  {delta && (
                    <span className="badge badge-success text-sm">
                      was {fmt(delta.before)} → {fmt(delta.after)} after citing a competing bid
                    </span>
                  )}

                  <QuoteBreakdown quote={quote} vertical={vertical} />

                  <CallAudio call={call} />

                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Transcript
                    </p>
                    <TranscriptView transcript={call.transcript} highlightTurns={highlightTurns} callId={call._id} />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </section>

      {/* Footer: trust stamps */}
      <footer className="card rounded-lg p-6">
        <div className="grid gap-4 text-sm text-muted-foreground sm:grid-cols-3">
          <div className="flex items-start gap-2.5">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary-500" />
            <span>The agent discloses it is an AI on every call — no exceptions.</span>
          </div>
          <div className="flex items-start gap-2.5">
            <Lock className="mt-0.5 h-4 w-4 shrink-0 text-primary-500" />
            <span>Spec v{job.specVersion} used verbatim across all calls.</span>
          </div>
          <div className="flex items-start gap-2.5">
            <BarChart3 className="mt-0.5 h-4 w-4 shrink-0 text-primary-500" />
            <span>Benchmarks: {vertical?.benchmarks?.source || "n/a"}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
