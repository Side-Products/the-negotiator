// New job: pick a vertical (the config-swap moment), then build one spec
// from voice + documents and freeze it.

import { useCallback, useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { ArrowRight, Briefcase, Bug, Car, KeyRound, Truck } from "lucide-react";
import { toast } from "sonner";
import { VERTICALS, getVertical } from "@/config/verticals";

import VoiceInterviewPanel from "@/components/intake/VoiceInterviewPanel";
import DocUpload from "@/components/intake/DocUpload";
import SpecPreview from "@/components/intake/SpecPreview";
import {
  TelegramIcon,
  WhatsAppIcon,
  TELEGRAM_BOT_USERNAME,
  WHATSAPP_JOIN_CODE,
  telegramHref,
  whatsappJoinHref,
} from "@/components/ui/ChannelIcons";

const VERTICAL_ICONS = { moving: Truck, autobody: Car, locksmith: KeyRound, pestcontrol: Bug };

// Locksmith is the flagship market; the rest are shown small and de-emphasized.
const FEATURED = VERTICALS.find((v) => v.id === "locksmith") || VERTICALS[0];
const OTHER_VERTICALS = VERTICALS.filter((v) => v.id !== FEATURED.id);

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
        <title>New job · Haggle</title>
      </Head>
      <div className="mx-auto max-w-6xl px-6 pb-12">
        {!job ? (
          <div className="mx-auto max-w-3xl pt-6">
            <h1 className="text-2xl font-semibold">What are we negotiating?</h1>
            <p className="mt-1 text-muted-foreground">
              Pick a market. Everything downstream comes from its config file: the interview, the
              calls, the red flags.
            </p>

            {/* Featured: Locksmith */}
            <button
              type="button"
              onClick={() => pickVertical(FEATURED.id)}
              disabled={!!creating}
              className="group cut-corners-lg relative mt-8 block w-full bg-primary-400 p-px text-left transition-all hover:-translate-y-0.5 disabled:opacity-50"
            >
              <div className="cut-corners-lg relative overflow-hidden bg-card p-7 sm:p-8">
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0"
                  style={{
                    background:
                      "radial-gradient(60% 90% at 100% 0%, color-mix(in srgb, #08A0E9 13%, transparent), transparent 70%)",
                  }}
                />
                <div className="relative flex items-start gap-5">
                  <span className="cut-corners inline-flex h-14 w-14 shrink-0 items-center justify-center bg-primary-400 text-white">
                    {(() => {
                      const Icon = VERTICAL_ICONS[FEATURED.id] || Briefcase;
                      return <Icon className="h-7 w-7" aria-hidden="true" />;
                    })()}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="badge badge-info">Flagship</span>
                      <span className="text-xs uppercase tracking-wide text-muted-foreground">
                        most popular
                      </span>
                    </div>
                    <div className="mt-2 flex items-center gap-2 font-jakarta text-2xl font-bold">
                      {FEATURED.label}
                      <ArrowRight
                        className="h-5 w-5 text-primary-500 transition-transform group-hover:translate-x-1"
                        aria-hidden="true"
                      />
                    </div>
                    <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
                      {FEATURED.tagline}
                    </p>
                    <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted-foreground">
                      <span>
                        market ~
                        <span className="font-medium text-foreground">
                          ${FEATURED.benchmarks.marketMid.toLocaleString()}
                        </span>
                      </span>
                      <span>
                        <span className="font-medium text-foreground">
                          {FEATURED.vendorPolicyCards.length}
                        </span>{" "}
                        negotiation styles
                      </span>
                      <span>
                        <span className="font-medium text-foreground">
                          {FEATURED.redFlags.length}
                        </span>{" "}
                        red-flag rules
                      </span>
                    </div>
                    {creating === FEATURED.id && <div className="spinner mt-4" />}
                  </div>
                </div>
              </div>
            </button>

            {/* De-emphasized: other markets */}
            <p className="mt-8 text-xs font-medium uppercase tracking-widest text-muted-foreground/70">
              Other markets
            </p>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              {OTHER_VERTICALS.map((v) => {
                const Icon = VERTICAL_ICONS[v.id] || Briefcase;
                return (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => pickVertical(v.id)}
                    disabled={!!creating}
                    className="group cut-corners flex items-center gap-3 border border-border bg-card/50 p-3.5 text-left opacity-80 transition-all hover:-translate-y-0.5 hover:border-primary-400 hover:opacity-100 disabled:opacity-50"
                  >
                    <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground transition-colors group-hover:text-primary-500">
                      <Icon className="h-4 w-4" aria-hidden="true" />
                    </span>
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold">{v.label}</div>
                      <div className="truncate text-xs text-muted-foreground">
                        market ~${v.benchmarks.marketMid.toLocaleString()}
                      </div>
                    </div>
                    {creating === v.id && <div className="spinner ml-auto h-4 w-4" />}
                  </button>
                );
              })}
            </div>

            {/* Chat entry points: same interview, from the phone */}
            {(WHATSAPP_JOIN_CODE || TELEGRAM_BOT_USERNAME) && (
              <div className="mt-8 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-border pt-5 text-sm text-muted-foreground">
                <span>Prefer chat? The same interview runs on</span>
                {WHATSAPP_JOIN_CODE && (
                  <a
                    href={whatsappJoinHref()}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 font-medium text-foreground transition-colors hover:text-[#25D366]"
                  >
                    <WhatsAppIcon className="h-4 w-4 text-[#25D366]" />
                    WhatsApp
                  </a>
                )}
                {WHATSAPP_JOIN_CODE && TELEGRAM_BOT_USERNAME && <span>and</span>}
                {TELEGRAM_BOT_USERNAME && (
                  <a
                    href={telegramHref()}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 font-medium text-foreground transition-colors hover:text-[#26A5E4]"
                  >
                    <TelegramIcon className="h-4 w-4 text-[#26A5E4]" />
                    Telegram
                  </a>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="pt-6">
            <h1 className="text-2xl font-semibold">New {vertical.label.toLowerCase()} job</h1>
            <p className="mt-1 text-muted-foreground">
              Build the spec by voice, by document, or both, then confirm to freeze it for every call.
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
