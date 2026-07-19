// One vendor call: buyer-agent voice session + live quote build-up.
// Sim mode: mic muted, vendor turns come from /vendor-turn (Anthropic + TTS)
// and are injected back via sendUserMessage. Role-play mode: mic on, the human
// answers as the vendor.

import { useEffect, useRef, useState } from "react";
import { ConversationProvider, useConversation } from "@elevenlabs/react";
import { ExternalLink, Star } from "lucide-react";
import { toast } from "sonner";
import TranscriptView from "@/components/calls/TranscriptView";
import { noEmDash } from "@/lib/utils";

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

const fmt = (n) => `$${Number(n || 0).toLocaleString()}`;

export default function CallCard(props) {
  return (
    <ConversationProvider>
      <CallSession {...props} />
    </ConversationProvider>
  );
}

function CallSession({ call, job, quote, onChanged, leverageAmount }) {
  const [mode, setMode] = useState(call.mode || "sim");
  const [turns, setTurns] = useState([]);
  const [showTranscript, setShowTranscript] = useState(false);
  const [starting, setStarting] = useState(false);
  const turnsRef = useRef([]);
  const busyRef = useRef(false);
  const pendingRef = useRef("");
  const startedRef = useRef(false);
  const connectedRef = useRef(false);

  const { status, startSession, endSession, sendUserMessage } = useConversation({
    micMuted: mode === "sim",
  });
  const connected = status === "connected" || status === "connecting";

  useEffect(() => () => endSession(), [endSession]);

  const pushTurn = (role, text) => {
    const turn = { role, text, turnIndex: turnsRef.current.length, at: new Date().toISOString() };
    turnsRef.current = [...turnsRef.current, turn];
    setTurns(turnsRef.current);
  };
  const curTurn = () => Math.max(0, turnsRef.current.length - 1);

  const markFailed = async (msg) => {
    toast.error(msg);
    try {
      await api(`/api/calls/${call._id}`, "PATCH", { status: "failed" });
    } catch {}
    onChanged?.();
  };

  const vendorTurn = async (lastAgentText) => {
    // Queue buyer utterances that land mid-round-trip: dropping them would
    // desync turnRefs between the client and the persisted transcript.
    if (busyRef.current) {
      pendingRef.current = pendingRef.current
        ? `${pendingRef.current} ${lastAgentText}`
        : lastAgentText;
      return;
    }
    busyRef.current = true;
    try {
      const { text, audioB64 } = await api(`/api/calls/${call._id}/vendor-turn`, "POST", {
        lastAgentText,
      });
      if (audioB64) {
        const audio = new Audio(`data:audio/mpeg;base64,${audioB64}`);
        await new Promise((resolve) => {
          audio.onended = resolve;
          audio.onerror = resolve;
          audio.play().catch(resolve);
        });
      }
      pushTurn("vendor", text);
      sendUserMessage(text);
    } catch (err) {
      toast.error(`Vendor turn failed: ${err.message}`);
    } finally {
      busyRef.current = false;
      if (pendingRef.current) {
        const queued = pendingRef.current;
        pendingRef.current = "";
        vendorTurn(queued);
      }
    }
  };

  // Client tools the buyer agent calls mid-conversation. Errors return a string
  // so the agent hears about the failure instead of the session crashing.
  const tool = (fn) => async (params) => {
    try {
      return await fn(params || {});
    } catch (err) {
      toast.error(err.message);
      return `Tool failed: ${err.message}`;
    }
  };

  const clientTools = {
    log_quote_item: tool(async ({ fee_key, label, amount, note }) => {
      const data = await api(`/api/calls/${call._id}/quote-items`, "POST", {
        fee_key,
        label,
        amount,
        note,
        turnRef: curTurn(),
      });
      onChanged?.();
      return JSON.stringify(data);
    }),
    commit_quote: tool(async ({ total, guaranteed, valid_until }) => {
      const data = await api(`/api/calls/${call._id}/commit`, "POST", {
        total,
        guaranteed,
        valid_until,
        turnRef: curTurn(),
      });
      (data.redFlags || []).forEach((f) => toast.warning(f.message));
      onChanged?.();
      return JSON.stringify(data);
    }),
    record_negotiation_event: tool(async ({ lever_id, before_total, after_total, note }) => {
      await api(`/api/calls/${call._id}/negotiation-event`, "POST", {
        lever_id,
        before_total,
        after_total,
        note,
        turnRef: curTurn(),
      });
      onChanged?.();
      return "recorded";
    }),
    log_outcome: tool(async ({ type, note }) => {
      await api(`/api/calls/${call._id}/outcome`, "POST", { type, note, turnRef: curTurn() });
      onChanged?.();
      return "logged";
    }),
    get_leverage: tool(async () => {
      const data = await api(`/api/calls/${call._id}/leverage`);
      return JSON.stringify(data.leverage || []);
    }),
  };

  const finish = async () => {
    if (!startedRef.current) return;
    startedRef.current = false;
    setStarting(false);
    try {
      await api(`/api/calls/${call._id}/finalize`, "POST", {});
    } catch (err) {
      toast.error(`Finalize failed: ${err.message}`);
      try {
        await api(`/api/calls/${call._id}`, "PATCH", { status: "failed" });
      } catch {}
    }
    onChanged?.();
  };

  const start = async () => {
    setStarting(true);
    try {
      const { signedUrl, dynamicVariables } = await api("/api/agent/session", "POST", {
        role: "buyer",
        jobId: job._id,
        callId: call._id,
      });
      const sim = mode === "sim";
      turnsRef.current = [];
      pendingRef.current = "";
      setTurns([]);
      startedRef.current = true;
      connectedRef.current = false;
      startSession({
        signedUrl,
        dynamicVariables,
        connectionType: "websocket",
        clientTools,
        onConnect: async ({ conversationId }) => {
          connectedRef.current = true;
          setStarting(false);
          try {
            await api(`/api/calls/${call._id}`, "PATCH", {
              status: "live",
              elevenConversationId: conversationId,
              mode,
            });
          } catch (err) {
            toast.error(err.message);
          }
          onChanged?.();
        },
        onMessage: ({ message, role }) => {
          if (role === "agent") {
            pushTurn("buyer", message);
            if (sim) vendorTurn(message);
          } else if (!sim) {
            pushTurn("vendor", message);
          }
        },
        onError: (message) => {
          toast.error(String(message));
          // A failure before onConnect means the session never opened; the
          // SDK won't fire onDisconnect, so unstick the button here.
          if (!connectedRef.current) {
            setStarting(false);
            startedRef.current = false;
          }
        },
        onDisconnect: () => finish(),
      });
    } catch (err) {
      setStarting(false);
      startedRef.current = false;
      await markFailed(`Could not start call: ${err.message}`);
    }
  };

  const displayStatus = connected ? "live" : call.status;
  const canStart = !connected && !starting && displayStatus !== "done";
  const lines = quote?.lines || [];
  const total = quote?.total ?? lines.reduce((s, l) => s + (l.amount || 0), 0);
  const displayTurns = turns.length ? turns : call.transcript || [];

  const statusChip = {
    pending: <span className="badge badge-info">pending</span>,
    live: (
      <span className="badge badge-success inline-flex items-center gap-1.5">
        <span className="h-3 w-3 animate-spin rounded-full border-2 border-success-600 border-t-transparent" /> live
      </span>
    ),
    done: <span className="badge bg-muted text-muted-foreground">done</span>,
    failed: <span className="badge badge-error">failed</span>,
  }[displayStatus] || <span className="badge badge-info">{displayStatus}</span>;

  // Real Places businesses link out to their Google listing; canned/sim-only
  // vendors have no listing to link to.
  const googleUrl =
    call.placeId && !call.placeId.startsWith("canned")
      ? `https://www.google.com/maps/place/?q=place_id:${call.placeId}`
      : null;

  return (
    <div className="card flex flex-col gap-3 p-4">
      <div className="flex flex-wrap items-center gap-2">
        {googleUrl ? (
          <a
            href={googleUrl}
            target="_blank"
            rel="noopener noreferrer"
            title="Open this business on Google"
            className="focus-ring inline-flex items-center gap-1 font-display text-sm font-semibold text-foreground hover:text-primary-500 hover:underline"
          >
            {call.vendorName}
            <ExternalLink aria-hidden="true" className="h-3.5 w-3.5 text-muted-foreground" />
          </a>
        ) : (
          <h3 className="font-display text-sm font-semibold text-foreground">{call.vendorName}</h3>
        )}
        {call.rating != null && (
          <span className="inline-flex items-center gap-0.5 text-xs text-muted-foreground">
            <Star aria-hidden="true" className="h-3 w-3 fill-warning-400 text-warning-400" />
            {call.rating}
          </span>
        )}
        <span className={`badge ${call.round === 2 ? "badge-warning" : "badge-info"}`}>
          Round {call.round}
        </span>
        {statusChip}
        {call.round === 2 && leverageAmount != null && (
          <span className="badge badge-info">using leverage: {fmt(leverageAmount)} best bid</span>
        )}
      </div>

      {/* Sim calls run server-side in batches, real calls dial actual
          businesses, role-play is the live browser session. */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        {mode === "roleplay" ? (
          <span className="badge bg-foreground text-background">live role-play</span>
        ) : mode === "real" ? (
          <>
            <span className="badge badge-warning">real call</span>
            {call.batch && <span className="badge badge-info">batch {call.batch}</span>}
            {call.phone && <span>{call.phone}</span>}
            {call.statusDetail && displayStatus === "live" && (
              <span className="inline-flex items-center gap-1.5 text-foreground">
                <span className="h-2 w-2 animate-pulse rounded-full bg-success-500" aria-hidden="true" />
                {call.statusDetail}
              </span>
            )}
          </>
        ) : call.batch ? (
          <>
            <span className="badge badge-info">auto (batch {call.batch})</span>
            {displayStatus === "pending" && <span>waiting for its batch…</span>}
          </>
        ) : (
          <>
            <span className="badge bg-foreground text-background">agent vs agent</span>
            {connected && <span>buyer live, vendor speaks via TTS, mic muted</span>}
          </>
        )}
      </div>

      {/* Running quote */}
      <div className="border-t border-border pt-3">
        <div className="flex items-baseline justify-between">
          <span className="text-xs text-muted-foreground">Quote</span>
          <span className="font-display text-lg font-semibold text-foreground">{fmt(total)}</span>
        </div>
        {lines.length > 0 && (
          <ul className="mt-1 space-y-0.5">
            {lines.map((l, i) => (
              <li key={i} className="flex justify-between text-xs text-muted-foreground">
                <span>{l.label || l.feeKey}</span>
                <span>{fmt(l.amount)}</span>
              </li>
            ))}
          </ul>
        )}
        <div className="mt-2 flex flex-wrap gap-1.5">
          {quote?.committed && <span className="badge badge-success">committed</span>}
          {quote?.guaranteed && <span className="badge badge-success">guaranteed</span>}
          {(quote?.redFlags || []).map((f) => (
            <span key={f.id} className="badge badge-error" title={f.message}>
              {f.id}
            </span>
          ))}
        </div>
      </div>

      {/* Live caption: the latest utterance, so a busy call grid visibly talks
          without opening every transcript. */}
      {displayStatus === "live" && displayTurns.length > 0 && !showTranscript && (
        <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
          <span
            className="mt-1 h-1.5 w-1.5 shrink-0 animate-pulse rounded-full bg-success-500"
            aria-hidden="true"
          />
          <span className="line-clamp-2">
            <span className="font-medium text-foreground">
              {["agent", "buyer", "assistant"].includes(displayTurns[displayTurns.length - 1].role)
                ? "Buyer"
                : "Vendor"}
              :
            </span>{" "}
            {noEmDash(displayTurns[displayTurns.length - 1].text)}
          </span>
        </p>
      )}

      {/* Transcript */}
      <button
        onClick={() => setShowTranscript((s) => !s)}
        className="self-start text-xs text-muted-foreground hover:text-foreground"
      >
        {showTranscript ? "Hide" : "Show"} transcript ({displayTurns.length})
      </button>
      {showTranscript && <TranscriptView transcript={displayTurns} />}

      {/* Browser-started calls: role-play (human vendor via mic) and live sim
          (agent vs agent, audible). Batch sim and real calls are server-driven
          and have no start button. */}
      {(mode === "roleplay" || (mode === "sim" && !call.batch)) && (
        <div className="mt-auto flex gap-2 border-t border-border pt-3">
          {connected ? (
            <button onClick={() => endSession()} className="btn bg-error-500 text-white hover:bg-error-600">
              End call
            </button>
          ) : (
            <button onClick={start} disabled={!canStart} className="btn btn-primary disabled:opacity-50">
              {starting
                ? "Connecting…"
                : displayStatus === "failed"
                  ? "Retry call"
                  : mode === "roleplay"
                    ? "Answer as vendor"
                    : "Run agent vs agent"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
