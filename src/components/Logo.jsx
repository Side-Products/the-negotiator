import Link from "next/link";

export function Logo() {
  return (
    <Link
      href="/"
      className="focus-ring group flex items-center gap-2 font-jakarta text-xl font-black tracking-tight"
      aria-label="The Negotiator home"
    >
      {/* U+FE0E forces text presentation so the glyph takes the orange color. */}
      <span className="flex text-[24px] leading-none text-primary-400 transition-transform duration-300 group-hover:scale-[1.2]">
        &#x260E;&#xFE0E;
      </span>
      The&nbsp;Negotiator
    </Link>
  );
}
