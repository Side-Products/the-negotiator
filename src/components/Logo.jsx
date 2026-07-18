import Link from "next/link";
import { twMerge } from "tailwind-merge";

// `className` (merged via twMerge so callers win) resizes the wordmark: the
// homepage nav uses the default text-xl, the dashboard sidebar passes a smaller
// size. The icon is 1.2em so it scales with whatever font size wins.
export function Logo({ className = "" }) {
  return (
    <Link
      href="/"
      className={twMerge(
        "focus-ring group flex min-w-0 items-center gap-2 font-jakarta text-xl font-black tracking-tight",
        className,
      )}
      aria-label="The Negotiator home"
    >
      {/* U+FE0E forces text presentation so the glyph takes the brand color. */}
      <span className="flex flex-shrink-0 text-[1.2em] leading-none text-primary-400 transition-transform duration-300 group-hover:scale-[1.2]">
        &#x260E;&#xFE0E;
      </span>
      <span className="truncate">The&nbsp;Negotiator</span>
    </Link>
  );
}
