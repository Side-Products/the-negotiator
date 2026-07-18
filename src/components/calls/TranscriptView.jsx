// Scrolling call transcript: buyer agent on the right (orange), vendor on the
// left (muted). `highlightTurns` flags turnRefs with a "leverage" badge.

import { useEffect, useRef } from "react";

const isBuyer = (role) => role === "buyer" || role === "agent" || role === "assistant";

export default function TranscriptView({ transcript, turns, highlightTurns = [], callId, className = "" }) {
  const list = turns || transcript || [];
  const boxRef = useRef(null);

  useEffect(() => {
    const el = boxRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [list.length]);

  if (!list.length) {
    return <p className="py-3 text-sm text-muted-foreground">No transcript yet.</p>;
  }

  return (
    <div ref={boxRef} className={`max-h-72 space-y-2 overflow-y-auto pr-1 ${className}`}>
      {list.map((t, i) => {
        const idx = t.turnIndex ?? i;
        const buyer = isBuyer(t.role);
        const highlighted = highlightTurns.includes(idx);
        return (
          <div
            key={`${idx}-${i}`}
            id={callId ? `turn-${callId}-${idx}` : undefined}
            className={`flex ${buyer ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] rounded-lg border px-3 py-2 text-sm ${
                buyer
                  ? "border-primary-500/30 bg-primary-500/10"
                  : "border-border bg-muted"
              } ${highlighted ? "ring-1 ring-warning-500" : ""}`}
            >
              <div className="mb-0.5 flex items-center gap-2">
                <span className="text-[10px] font-medium text-muted-foreground">
                  #{idx} · {buyer ? "buyer" : "vendor"}
                </span>
                {highlighted && <span className="badge badge-warning">leverage</span>}
              </div>
              <p className="whitespace-pre-wrap text-foreground">{t.text}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
