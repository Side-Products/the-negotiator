// New job — pick a vertical (the config-swap moment), then build one spec
// from voice + documents and freeze it.

import { useCallback, useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { toast } from "sonner";
import { VERTICALS, getVertical } from "@/config/verticals";
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

  const handleConfirm = async () => {
    try {
      const res = await fetch(`/api/jobs/${jobId}/confirm`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not confirm the spec");
      router.push(`/jobs/${jobId}`);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const vertical = job ? getVertical(job.vertical) : null;

  return (
    <>
      <Head>
        <title>New job — The Negotiator</title>
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
              {VERTICALS.map((v) => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => pickVertical(v.id)}
                  disabled={!!creating}
                  className="card cut-corners p-6 text-left transition-colors hover:border-primary-400 disabled:opacity-50"
                >
                  <div className="text-lg font-semibold">{v.label}</div>
                  <p className="mt-1 text-sm text-muted-foreground">{v.tagline}</p>
                  {creating === v.id && <div className="spinner mt-3" />}
                </button>
              ))}
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
