// New job — pick a vertical (the config-swap moment), then build one spec
// from voice + documents and freeze it.

import { useCallback, useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { ArrowRight, Briefcase, Bug, Car, KeyRound, Truck } from "lucide-react";
import { toast } from "sonner";
import { VERTICALS, getVertical } from "@/config/verticals";

const VERTICAL_ICONS = { moving: Truck, autobody: Car, locksmith: KeyRound, pestcontrol: Bug };
import VoiceInterviewPanel from "@/components/intake/VoiceInterviewPanel";
import DocUpload from "@/components/intake/DocUpload";
import SpecPreview from "@/components/intake/SpecPreview";

export default function NewJob() {
  const router = useRouter();
  const [job, setJob] = useState(null);
  const [creating, setCreating] = useState(null);
  const jobId = job?._id;

  const pickVertical = async (verticalId) => {
    setCreating(verticalId);
    try {
      const res = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vertical: verticalId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not create the job");
      setJob(data.job);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setCreating(null);
    }
  };

  const refetchJob = useCallback(async () => {
    if (!jobId) return;
    const res = await fetch(`/api/jobs/${jobId}`);
    if (!res.ok) return;
    const data = await res.json();
    setJob(data.job);
    if (data.job?.confirmed) router.push(`/jobs/${jobId}`);
  }, [jobId, router]);

  const handleFieldEdit = async (fieldKey, value) => {
    try {
      const res = await fetch(`/api/jobs/${jobId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ field_key: fieldKey, value_json: JSON.stringify(value) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Update failed");
      setJob(data.job);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleConfirm = async (locationsReviewed) => {
    try {
      const res = await fetch(`/api/jobs/${jobId}/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locationsReviewed: locationsReviewed === true }),
      });
      const data = await res.json();
      if (res.ok) {
        router.push(`/jobs/${jobId}`);
        return;
      }
      if (data.locationConfirmations?.length) {
        for (const c of data.locationConfirmations) {
          if (c.kind === "area") {
            const keepArea = window.confirm(
              `${c.label}: "${c.original}" is an area, not an exact address.\n\nOK = keep it as the area, Cancel = go back and add a street or landmark.`,
            );
            if (!keepArea) return;
          } else if (c.suggestion && c.suggestion !== c.original) {
            const useSuggestion = window.confirm(
              `${c.label}: did you mean "${c.suggestion}"?\n\nOK = use the suggestion, Cancel = keep "${c.original}".`,
            );
            if (useSuggestion) await handleFieldEdit(c.field, c.suggestion);
          } else {
            const keepAnyway = window.confirm(
              `${c.label}: "${c.original}" could not be verified.\n\nOK = keep it anyway, Cancel = go back and edit.`,
            );
            if (!keepAnyway) return;
          }
        }
        await handleConfirm(true);
        return;
      }
      throw new Error(data.error || "Could not confirm the spec");
    } catch (err) {
      toast.error(err.message);
    }
  };

  const vertical = job ? getVertical(job.vertical) : null;

  return (
    <>
      <Head>
        <title>New job — Haggle</title>
      </Head>
      <div className="mx-auto max-w-6xl px-6 pb-12">
        {!job ? (
          <div className="mx-auto max-w-3xl pt-6">
            <h1 className="text-2xl font-semibold">What are we negotiating?</h1>
            <p className="mt-1 text-muted-foreground">
              Pick a vertical. Everything downstream — the interview, the calls, the red flags —
              comes from its config file.
            </p>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {VERTICALS.map((v) => {
                const Icon = VERTICAL_ICONS[v.id] || Briefcase;
                return (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => pickVertical(v.id)}
                    disabled={!!creating}
                    className="group cut-corners relative bg-border p-px text-left transition-all hover:-translate-y-0.5 hover:bg-primary-400 disabled:opacity-50"
                  >
                    <div className="cut-corners flex h-full flex-col bg-card p-6">
                    <div className="flex items-start justify-between gap-3">
                      <span className="cut-corners inline-flex h-11 w-11 items-center justify-center bg-primary-500/10 text-primary-500 transition-colors group-hover:bg-primary-500 group-hover:text-white">
                        <Icon className="h-5 w-5" aria-hidden="true" />
                      </span>
                      <ArrowRight
                        className="h-4 w-4 text-muted-foreground/40 transition-all group-hover:translate-x-0.5 group-hover:text-primary-500"
                        aria-hidden="true"
                      />
                    </div>
                    <div className="mt-4 text-lg font-semibold">{v.label}</div>
                    <p className="mt-1 flex-1 text-sm leading-relaxed text-muted-foreground">
                      {v.tagline}
                    </p>
                    <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 border-t border-border pt-3 text-xs text-muted-foreground">
                      <span>
                        market ~<span className="font-medium text-foreground">${v.benchmarks.marketMid.toLocaleString()}</span>
                      </span>
                      <span>
                        <span className="font-medium text-foreground">{v.vendorPolicyCards.length}</span> negotiation styles
                      </span>
                      <span>
                        <span className="font-medium text-foreground">{v.redFlags.length}</span> red-flag rules
                      </span>
                    </div>
                    {creating === v.id && <div className="spinner mt-3" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="pt-6">
            <h1 className="text-2xl font-semibold">New {vertical.label.toLowerCase()} job</h1>
            <p className="mt-1 text-muted-foreground">
              Build the spec by voice, by document, or both — then confirm to freeze it for every call.
            </p>
            <div className="mt-6 grid gap-6 lg:grid-cols-2">
              <div className="min-w-0 space-y-6">
                <VoiceInterviewPanel jobId={jobId} vertical={vertical} onSpecUpdate={refetchJob} />
                <DocUpload jobId={jobId} vertical={vertical} onSpecUpdate={refetchJob} />
              </div>
              <SpecPreview job={job} onFieldEdit={handleFieldEdit} onConfirm={handleConfirm} />
            </div>
          </div>
        )}
      </div>
    </>
  );
}
