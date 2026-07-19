// Mission control for one job: frozen spec, the parallel call grid, the
// round-2 negotiate trigger, and the report generator.

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/router";
import { toast } from "sonner";
import { getVertical } from "@/config/verticals";
import { CutButton } from "@/components/ui/CutButton";
import { FullPageLoader } from "@/components/ui/Loader";
import CallCard from "@/components/calls/CallCard";

async function api(url, method = "GET", body) {
  const res = await fetch(url, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

function formatValue(value) {
  if (value === undefined || value === null || value === "") return "\u2013";
  if (Array.isArray(value))
    return value
      .map((i) =>
        typeof i === "object" && i !== null
          ? `${i.item ?? i.name ?? ""}${i.qty ? ` ×${i.qty}` : ""}`
          : String(i)
      )
      .join(", ");
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return String(value);
}

function SpecCard({ job, vertical }) {
  const fields = vertical?.jobSpec?.fields || [];
  return (
    <div className="card p-4">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <h2 className="font-display text-sm font-semibold text-foreground">
          {vertical?.label || job.vertical} spec
        </h2>
        <span className="badge badge-info">
          Spec v{job.specVersion || 1}: used verbatim in every call
        </span>
      </div>
      <dl className="grid grid-cols-1 gap-x-6 gap-y-1.5 sm:grid-cols-2">
        {fields.map((f) => (
          <div key={f.key} className="flex justify-between gap-3 text-sm">
            <dt className="shrink-0 text-muted-foreground">{f.label}</dt>
            <dd className="text-right text-foreground">{formatValue(job.spec?.[f.key])}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

export default function JobMissionControl() {
  const router = useRouter();
  const { id } = router.query;
  const [data, setData] = useState(null);
  const [busy, setBusy] = useState(null); // 'calls' | 'negotiate' | 'report'

  const load = useCallback(async () => {
    if (!id) return;
    try {
      setData(await api(`/api/jobs/${id}`));
    } catch (err) {
      toast.error(err.message);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const calls = data?.calls || [];
  const quotes = data?.quotes || [];
  // Batches run server-side, so pending calls DO progress without us. Poll
  // while anything is pending or live.
  const active = calls.some((c) => c.status === "live" || c.status === "pending");

  useEffect(() => {
    if (!active) return;
    const t = setInterval(load, 2000);
    return () => clearInterval(t);
  }, [active, load]);

  if (!data?.job) return <FullPageLoader />;
  const { job } = data;
  const vertical = getVertical(job.vertical);

  const committedQuotes = quotes.filter((q) => q.committed);
  const hasReport = Boolean(job.report?.narrative);
  const hasRound2 = calls.some((c) => c.round === 2);
  const allDone =
    calls.length > 0 && calls.every((c) => c.status === "done" || c.status === "failed");

  // Batch progress + running baseline (best clean committed bid so far).
  const batchCalls = calls.filter((c) => c.batch);
  const totalBatches = Math.max(0, ...batchCalls.map((c) => c.batch));
  const currentBatch = Math.max(0, ...batchCalls.filter((c) => c.status !== "pending").map((c) => c.batch));
  const doneCount = batchCalls.filter((c) => c.status === "done" || c.status === "failed").length;
  const cleanCommitted = committedQuotes.filter(
    (q) => !(q.redFlags || []).some((f) => f.id === "lowball"),
  );
  const baseline = cleanCommitted.length
    ? Math.min(...cleanCommitted.map((q) => q.total))
    : null;
  const flaggedCount = committedQuotes.filter((q) => (q.redFlags || []).length > 0).length;

  const quoteForCall = (call) =>
    quotes.find((q) => q.callId === call._id && q.committed) ||
    quotes.find((q) => q.callId === call._id);

  const leverageAmountFor = (call) => {
    const q = (call.leverageQuoteIds || [])
      .map((qid) => quotes.find((x) => x._id === qid))
      .find(Boolean);
    return q?.total;
  };

  const run = (name, fn) => async () => {
    setBusy(name);
    try {
      await fn();
      await load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(null);
    }
  };

  const startCalls = run("calls", () =>
    api(`/api/jobs/${id}/batch-calls`, "POST", { batchSizes: [3, 3, 4] }),
  );
  const startRealCalls = run("real", async () => {
    if (
      !window.confirm(
        "This dials up to 20 REAL businesses near the job's location, in 4 batches of 5. The agent discloses it is an AI and that the call is recorded. Batch 1 sets the baseline; later batches negotiate with it. Continue?",
      )
    )
      return;
    const data = await api(`/api/jobs/${id}/real-calls`, "POST", { total: 20, batchSize: 5 });
    toast.success(
      data.alreadyRunning
        ? "Real-call run resumed. Watch the cards for live progress."
        : `Dialing ${data.calls.length} vendors in batches of 5. Cards update live as calls progress.`,
    );
  });
  const addRolePlay = run("roleplay", () => api(`/api/jobs/${id}/calls`, "POST", { mode: "roleplay" }));
  const addLiveSim = run("livesim", () => api(`/api/jobs/${id}/calls`, "POST", { mode: "sim" }));
  const negotiate = run("negotiate", () => api(`/api/jobs/${id}/negotiate`, "POST", {}));
  const generateReport = run("report", async () => {
    await api(`/api/jobs/${id}/report`, "POST", {});
    router.push(`/jobs/${id}/report`);
  });

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 px-4 pb-12 lg:px-8">
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="font-display text-xl font-semibold text-foreground">Mission control</h1>
        <span className="badge badge-info">{job.status}</span>
      </div>

      <SpecCard job={job} vertical={vertical} />

      <div className="flex flex-wrap items-center gap-3">
        {batchCalls.length === 0 && (
          <CutButton onClick={startCalls} disabled={!job.confirmed || busy === "calls"}>
            {busy === "calls" ? "Dialing the market…" : "Start calls (10 vendors, 3 batches)"}
          </CutButton>
        )}
        <CutButton
          variant="outline"
          onClick={addRolePlay}
          disabled={!job.confirmed || busy === "roleplay"}
        >
          {busy === "roleplay" ? "Adding…" : "+ Live role-play call"}
        </CutButton>
        <CutButton
          variant="outline"
          onClick={addLiveSim}
          disabled={!job.confirmed || busy === "livesim"}
          title="Buyer agent negotiates out loud with an AI vendor persona in its own voice"
        >
          {busy === "livesim" ? "Adding…" : "+ Live agent-vs-agent call"}
        </CutButton>
        <CutButton
          variant="outline"
          onClick={startRealCalls}
          disabled={!job.confirmed || busy === "real"}
          title="Requires ELEVENLABS_PHONE_NUMBER_ID and PUBLIC_URL"
        >
          {busy === "real" ? "Dialing…" : "Start real calls (4 batches of 5)"}
        </CutButton>
        {!job.confirmed && (
          <span className="text-xs text-muted-foreground">
            Confirm the spec on the intake page before calling vendors.
          </span>
        )}
        {calls.length > 0 && !hasRound2 && (
          <CutButton
            variant="inverse"
            onClick={negotiate}
            disabled={committedQuotes.length < 2 || busy === "negotiate"}
            title={
              committedQuotes.length < 2
                ? "Need at least 2 committed quotes to negotiate with leverage"
                : undefined
            }
          >
            {busy === "negotiate" ? "Setting up…" : "Negotiate round 2"}
          </CutButton>
        )}
        {hasReport && (
          <CutButton href={`/jobs/${id}/report`}>View report</CutButton>
        )}
        {allDone && (
          <CutButton variant="outline" onClick={generateReport} disabled={busy === "report"}>
            {busy === "report"
              ? "Generating…"
              : hasReport
                ? "Regenerate report"
                : "Generate report"}
          </CutButton>
        )}
        {calls.length > 0 && committedQuotes.length < 2 && !hasRound2 && (
          <span className="text-xs text-muted-foreground">
            {committedQuotes.length}/2 committed quotes needed for round 2
          </span>
        )}
      </div>

      {batchCalls.length > 0 && (
        <div className="card flex flex-wrap items-center gap-x-6 gap-y-1 px-4 py-3 text-sm">
          <span className="font-medium text-foreground">
            Batch {Math.max(currentBatch, 1)}/{totalBatches}
          </span>
          <span className="text-muted-foreground">{doneCount}/{batchCalls.length} calls done</span>
          <span className="text-muted-foreground">
            Baseline (best clean bid): {baseline != null ? `$${baseline.toLocaleString()}` : "\u2013"}
          </span>
          {flaggedCount > 0 && (
            <span className="badge badge-warning">{flaggedCount} red-flagged</span>
          )}
          {!allDone && <span className="spinner" aria-hidden="true" />}
        </div>
      )}

      {calls.length > 0 && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {calls.map((call) => (
            <CallCard
              key={call._id}
              call={call}
              job={job}
              quote={quoteForCall(call)}
              leverageAmount={call.round === 2 ? leverageAmountFor(call) : undefined}
              canNegotiate={
                committedQuotes.length >= 2 &&
                !calls.some((c) => c.round === 2 && c.vendorName === call.vendorName)
              }
              onChanged={load}
            />
          ))}
        </div>
      )}
    </div>
  );
}
