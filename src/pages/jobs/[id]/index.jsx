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
  if (value === undefined || value === null || value === "") return "—";
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
          Spec v{job.specVersion || 1} — used verbatim in every call
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
  // Poll only while a call is actually live — pending calls change nothing
  // server-side until a human starts them, and client tools already refetch.
  const active = calls.some((c) => c.status === "live");

  useEffect(() => {
    if (!active) return;
    const t = setInterval(load, 2000);
    return () => clearInterval(t);
  }, [active, load]);

  if (!data?.job) return <FullPageLoader />;
  const { job } = data;
  const vertical = getVertical(job.vertical);

  const committedQuotes = quotes.filter((q) => q.committed);
  const hasRound2 = calls.some((c) => c.round === 2);
  const allDone =
    calls.length > 0 && calls.every((c) => c.status === "done" || c.status === "failed");

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

  const startCalls = run("calls", () => api(`/api/jobs/${id}/calls`, "POST", {}));
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
        {calls.length === 0 && (
          <CutButton onClick={startCalls} disabled={!job.confirmed || busy === "calls"}>
            {busy === "calls" ? "Starting…" : "Start calls"}
          </CutButton>
        )}
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
        {allDone && (
          <CutButton variant="outline" onClick={generateReport} disabled={busy === "report"}>
            {busy === "report" ? "Generating…" : "Generate report"}
          </CutButton>
        )}
        {calls.length > 0 && committedQuotes.length < 2 && !hasRound2 && (
          <span className="text-xs text-muted-foreground">
            {committedQuotes.length}/2 committed quotes needed for round 2
          </span>
        )}
      </div>

      {calls.length > 0 && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {calls.map((call) => (
            <CallCard
              key={call._id}
              call={call}
              job={job}
              quote={quoteForCall(call)}
              leverageAmount={call.round === 2 ? leverageAmountFor(call) : undefined}
              onChanged={load}
            />
          ))}
        </div>
      )}
    </div>
  );
}
