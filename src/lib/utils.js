import { clsx } from "clsx";
import { twMerge } from "tailwind-merge"

// House style: no em dashes in displayed text. Agent/LLM output loves them,
// so sanitize at render time (covers already-stored transcripts too).
export function noEmDash(text) {
  return (text || "").replace(/\s*—\s*/g, ", ");
}

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}
