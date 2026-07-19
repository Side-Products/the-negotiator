// Voice intake — a live ElevenLabs intake-agent session that fills the job
// spec via client tools. Wrapped in its own ConversationProvider (required by
// useConversation in @elevenlabs/react v1.10).

import { useEffect, useRef, useState } from "react";
import { ConversationProvider, useConversation } from "@elevenlabs/react";
import { Mic, MicOff, Phone, PhoneOff } from "lucide-react";
import { toast } from "sonner";
import { noEmDash } from "@/lib/utils";

function Panel({ jobId, vertical, onSpecUpdate }) {
  const [micMuted, setMicMuted] = useState(false);
  const [starting, setStarting] = useState(false);
  const [transcript, setTranscript] = useState([]);
  const scrollRef = useRef(null);

  const conversation = useConversation({
    micMuted,
    onMessage: ({ message, role }) => {
      setTranscript((t) => [...t, { role, text: message }]);
    },
    onError: (message) => toast.error(message || "Voice session error"),
  });
  const { status, isSpeaking } = conversation;
  const connected = status === "connected";
  const connecting = starting || status === "connecting";

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [transcript]);

  const start = async () => {
    setStarting(true);
    try {
      // Pre-flight mic permission only — release the stream immediately (the
      // SDK opens its own) so the browser mic indicator doesn't stick on.
      const preflight = await navigator.mediaDevices.getUserMedia({ audio: true });
      preflight.getTracks().forEach((t) => t.stop());
      const res = await fetch("/api/agent/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: "intake", jobId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not start the interview");

      setTranscript([]);
      conversation.startSession({
        signedUrl: data.signedUrl,
        connectionType: "websocket",
        dynamicVariables: data.dynamicVariables,
        onConnect: ({ conversationId }) => {
          // Evidence trail: the intake interview's ElevenLabs conversation id.
          fetch(`/api/jobs/${jobId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ intakeConversationId: conversationId }),
          }).catch(() => {});
        },
        clientTools: {
          update_spec: async ({ field_key, value_json }) => {
            const r = await fetch(`/api/jobs/${jobId}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ field_key, value_json }),
            });
            onSpecUpdate();
            return r.ok ? "ok" : "error: spec is confirmed and frozen";
          },
          confirm_spec: async () => {
            const r = await fetch(`/api/jobs/${jobId}/confirm`, { method: "POST" });
            onSpecUpdate();
            return r.ok ? "confirmed" : "error: could not confirm";
          },
        },
      });
    } catch (err) {
      toast.error(err.message || "Microphone unavailable");
    } finally {
      setStarting(false);
    }
  };

  const statusLabel = connecting
    ? "Connecting…"
    : connected
      ? isSpeaking
        ? "Agent speaking"
        : "Listening"
      : "Not connected";

  return (
    <section className="card p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="font-semibold">Voice interview</h2>
          <p className="text-sm text-muted-foreground">
            Talk through your {vertical.label.toLowerCase()} job — the spec fills in live.
          </p>
        </div>
        <span className="flex items-center gap-2 text-sm text-muted-foreground">
          <span
            className={`h-2 w-2 rounded-full ${
              connected
                ? isSpeaking
                  ? "bg-primary-400 animate-pulse"
                  : "bg-success-500"
                : connecting
                  ? "bg-warning-500 animate-pulse"
                  : "bg-border"
            }`}
          />
          {statusLabel}
        </span>
      </div>

      {transcript.length > 0 && (
        <div
          ref={scrollRef}
          className="mt-4 max-h-56 space-y-2 overflow-y-auto border border-border bg-background p-3 text-sm"
        >
          {transcript.map((m, i) => (
            <div key={i} className={m.role === "user" ? "text-right" : ""}>
              <span className="mr-2 text-xs uppercase tracking-wide text-muted-foreground">
                {m.role === "user" ? "You" : "Agent"}
              </span>
              <span>{noEmDash(m.text)}</span>
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 flex items-center gap-2">
        {connected ? (
          <>
            <button
              type="button"
              onClick={() => setMicMuted((m) => !m)}
              className={`btn ${micMuted ? "btn-secondary" : "btn-primary"}`}
            >
              {micMuted ? <MicOff className="mr-2 h-4 w-4" /> : <Mic className="mr-2 h-4 w-4" />}
              {micMuted ? "Unmute mic" : "Mute mic"}
            </button>
            <button
              type="button"
              onClick={() => conversation.endSession()}
              className="btn btn-secondary"
            >
              <PhoneOff className="mr-2 h-4 w-4" />
              End interview
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={start}
            disabled={connecting}
            className="btn btn-primary disabled:opacity-50"
          >
            <Phone className="mr-2 h-4 w-4" />
            {connecting ? "Connecting…" : "Start interview"}
          </button>
        )}
      </div>
    </section>
  );
}

export default function VoiceInterviewPanel(props) {
  return (
    <ConversationProvider>
      <Panel {...props} />
    </ConversationProvider>
  );
}
