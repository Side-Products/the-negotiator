import { clsx } from "clsx";
import { twMerge } from "tailwind-merge"

// House style: no em dashes in displayed text. Agent/LLM output loves them,
// so sanitize at render time (covers already-stored transcripts too).
export function noEmDash(text) {
  return (text || "").replace(/\s*—\s*/g, ", ");
}

// Deal brain: the number to compare offers by is not the sticker price. Per
// the FMCSA pattern cited in the challenge brief, non-binding estimates
// routinely overrun; red-flagged lowballs hide their real total by design.
// Used by reportService (ranking order) and the report UI (display) so the
// two can never disagree.
export function riskAdjustedTotal(quote, multiplier = 1.3) {
  const flagged = (quote.redFlags || []).some((f) => f.id === "lowball");
  if (quote.guaranteed && !flagged) return quote.total;
  return Math.round(quote.total * multiplier);
}

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}
