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
      aria-label="Haggle home"
    >
      {/* The brand padlock, same mark as the favicon (public/favicon.svg). */}
      <svg
        aria-hidden="true"
        viewBox="0 0 64 64"
        className="h-[1.2em] w-[1.2em] flex-shrink-0 transition-transform duration-300 group-hover:scale-[1.15]"
      >
        <rect width="64" height="64" rx="14" className="fill-primary-400" />
        <path
          d="M22 30v-7a10 10 0 0 1 20 0v7"
          fill="none"
          stroke="#fff"
          strokeWidth="6"
          strokeLinecap="round"
        />
        <rect x="16" y="30" width="32" height="24" rx="6" fill="#fff" />
        <circle cx="32" cy="40" r="4" className="fill-primary-400" />
        <rect x="30" y="42" width="4" height="7" rx="2" className="fill-primary-400" />
      </svg>
      <span className="truncate">Haggle</span>
    </Link>
  );
}
