// Landing page in the HomePixel design language (viraloop): sharp hairline
// panels, kickers, corner-plus marks, cut-corner buttons, radial washes, a
// before/after comparison, and a clipped-panel footer. Scroll reveals come
// from a native IntersectionObserver (no motion dependency) driving the CSS
// `.enter` keyframes in globals.css.

import { useEffect, useRef, useState } from "react";
import { Logo } from "@/components/Logo";
import { CutButton } from "@/components/ui/CutButton";
import { ThemeSwitch } from "@/components/ThemeSwitch";
import {
  TelegramIcon,
  WhatsAppIcon,
  TELEGRAM_BOT_USERNAME,
  WHATSAPP_JOIN_CODE,
  telegramHref,
  whatsappJoinHref,
} from "@/components/ui/ChannelIcons";
import {
  ArrowRight,
  Bug,
  Car,
  Check,
  Clock,
  FileCheck,
  KeyRound,
  ListChecks,
  Mic,
  Phone,
  PhoneCall,
  Quote,
  Scale,
  ShieldCheck,
  Star,
  TrendingDown,
  TriangleAlert,
  Truck,
  X,
} from "lucide-react";

/* ---------- shared bits ---------- */

// Hand-drawn padlock. `open` animates the shackle springing open (CSS
// keyframe, reduced-motion aware); without it the lock sits closed, for the
// faint floating background figures.
function LockFigure({ className = "", open = false, style, strokeWidth = 1.8 }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 26"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      className={className}
      style={style}
    >
      <path d="M8 10V7a4 4 0 0 1 8 0v3" className={open ? "anim-shackle" : undefined} />
      <rect x="5" y="10" width="14" height="11" rx="2" fill="currentColor" fillOpacity="0.08" />
      <circle cx="12" cy="14.6" r="1.6" fill="currentColor" stroke="none" />
      <path d="M12 16v2.4" />
    </svg>
  );
}

function CornerPlus({ className }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className={`pointer-events-none absolute z-10 h-3.5 w-3.5 text-primary-400 ${className}`}
    >
      <path d="M12 4v16M4 12h16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function Kicker({ children }) {
  return (
    <p className="text-xs font-medium uppercase tracking-[0.2em] text-primary-400">{children}</p>
  );
}

// Reveal-on-scroll wrapper: adds the `.enter` keyframe class once the element
// scrolls into view. IntersectionObserver is native, so no motion library.
function Reveal({ children, delay = 0, className = "" }) {
  const ref = useRef(null);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true);
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -80px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div
      ref={ref}
      className={`${shown ? "enter" : "opacity-0"} ${className}`}
      style={{ "--enter-delay": `${delay}ms` }}
    >
      {children}
    </div>
  );
}

function SectionHeading({ kicker, title, sub, align = "center" }) {
  const isCenter = align === "center";
  return (
    <div className={isCenter ? "mx-auto max-w-2xl text-center" : "max-w-2xl"}>
      <Kicker>{kicker}</Kicker>
      <h2 className="mt-3 text-balance font-jakarta text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
        {title}
      </h2>
      {sub && <p className="mt-4 text-balance text-muted-foreground">{sub}</p>}
    </div>
  );
}

/* ---------- data ---------- */

const STEPS = [
  {
    icon: Mic,
    title: "Say what happened",
    copy: "Locked out, broken key, rekeying after a breakup. A one-minute interview captures the door, the urgency, and the hours, once.",
  },
  {
    icon: PhoneCall,
    title: "Every locksmith nearby gets a call",
    copy: "The agent rings them in parallel and demands all-in numbers: call-out, labor, travel, after-hours. No 'the tech will price it on site'.",
  },
  {
    icon: Scale,
    title: "The leverage round",
    copy: "Armed with real committed bids, it presses each shop to beat the best one, and asks where the tech actually dispatches from.",
  },
  {
    icon: FileCheck,
    title: "Pick with proof",
    copy: "A ranked comparison with red flags, transcripts, and a recording behind every number. You choose, they drive over.",
  },
];

const FEATURES = [
  {
    icon: ListChecks,
    title: "The price locks before the van moves",
    copy: "Every shop commits an all-in itemised number on the phone. If the tech quotes more on your doorstep, you have the recording.",
  },
  {
    icon: TriangleAlert,
    title: "Scam patterns flagged",
    copy: "The $35 teaser call-out, padded travel from a distant dispatch, the fake-local call center. Each one is a rule that fires with the transcript to prove it.",
  },
  {
    icon: ShieldCheck,
    title: "Honest by construction",
    copy: "Leverage is built server-side from committed quotes only. The agent physically cannot bluff on your behalf.",
  },
];

const VERTICALS = [
  {
    icon: KeyRound,
    name: "Locksmith",
    tag: "Flagship",
    copy: "Lockouts, rekeys, broken keys. The panic purchase where overpaying is the business model, fixed by calling everyone at once.",
  },
  {
    icon: Truck,
    name: "Moving",
    tag: "Live",
    copy: "Apartment and house moves: crew, truck, packing, stairs, insurance, all quoted line by line.",
  },
  {
    icon: Car,
    name: "Auto body",
    tag: "Live",
    copy: "Collision repair estimates: parts, labour, paint, OEM vs aftermarket. Same engine, new market.",
  },
  {
    icon: Bug,
    name: "Pest control",
    tag: "Live",
    copy: "Fixed treatment prices before anyone rings your bell, instead of 'special fees' invented inside your home.",
  },
];

const OLD_WAY = [
  'Google "locksmith near me" into a wall of ads and fake local numbers',
  'Accept "$35 call-out, the tech prices the rest on site"',
  "Wait outside while the meter quietly runs",
  "Learn the real price on your doorstep, with no way back",
];

const NEW_WAY = [
  "One minute of questions fans out to every locksmith nearby",
  "All-in itemised numbers, travel and call-out included",
  "The agent asks where they actually dispatch from",
  "A fixed, recorded price before anyone drives over",
];

/* ---------- mock visuals (pure CSS/SVG, no images) ---------- */

// Hero product mock: a ranked-quotes dashboard mid-negotiation.
function QuotesMock() {
  const rows = [
    { name: "SecureHome Master Locksmiths", price: "$320", best: false, bar: 95 },
    { name: "Bolt & Barrel Security", price: "$180", best: false, bar: 62 },
    { name: "Keystone Lock & Door", price: "$130", best: true, bar: 45 },
  ];
  return (
    <div className="cut-corners-lg bg-border p-px shadow-xl">
      <div className="cut-corners-lg bg-card">
        {/* window chrome */}
        <div className="flex items-center gap-2 border-b border-border px-4 py-3">
          <span className="h-2.5 w-2.5 rounded-full bg-primary-400" />
          <span className="h-2.5 w-2.5 rounded-full bg-foreground/15" />
          <span className="h-2.5 w-2.5 rounded-full bg-foreground/15" />
          <span className="ml-3 flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary-400" />
            Round 2 · negotiating
          </span>
          <span className="ml-auto font-mono text-xs text-muted-foreground">3 locksmiths</span>
        </div>

        {/* rows */}
        <div className="space-y-2.5 p-4">
          {rows.map((r) => (
            <div
              key={r.name}
              className={`relative flex items-center gap-3 rounded-lg border p-3 ${
                r.best ? "border-primary-400/50 bg-primary-400/[0.06]" : "border-border bg-background"
              }`}
            >
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md ${
                  r.best ? "bg-primary-400 text-white" : "bg-muted text-muted-foreground"
                }`}
              >
                <Phone className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate text-sm font-semibold">{r.name}</p>
                  {r.best && (
                    <span className="badge badge-success shrink-0 gap-1">
                      <Star className="h-3 w-3" /> best
                    </span>
                  )}
                </div>
                <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className={`h-full rounded-full ${r.best ? "bg-primary-400" : "bg-foreground/25"}`}
                    style={{ width: `${r.bar}%` }}
                  />
                </div>
              </div>
              <p className="shrink-0 font-jakarta text-base font-bold tabular-nums">{r.price}</p>
            </div>
          ))}
        </div>

        {/* savings footer */}
        <div className="flex items-center justify-between border-t border-border px-4 py-3">
          <span className="flex items-center gap-2 text-sm text-muted-foreground">
            <TrendingDown className="h-4 w-4 text-primary-400" />
            Best all-in price vs first quote found
          </span>
          <span className="font-jakarta text-sm font-bold text-primary-500">−$190 (59%)</span>
        </div>
      </div>
    </div>
  );
}

// "Old way" mock: a scattered, muted notepad of half-finished calls.
function NotepadMock() {
  const scraps = [
    { text: "24/7 Locks: $35... 'tech prices on site'??", strike: false },
    { text: "2nd one: no price over the phone", strike: true },
    { text: "SecureHome: $320, 'certified'", strike: false },
    { text: "how far away IS this guy", strike: false },
  ];
  return (
    <div className="relative h-full w-full overflow-hidden p-6">
      <div className="mx-auto max-w-xs -rotate-1 rounded-lg border border-border bg-background p-5 shadow-sm">
        <p className="mb-3 font-mono text-[11px] uppercase tracking-widest text-muted-foreground/70">
          locksmiths · locked out
        </p>
        <ul className="space-y-2.5">
          {scraps.map((s) => (
            <li key={s.text} className="flex items-start gap-2 text-sm">
              <span className="mt-0.5 h-4 w-4 shrink-0 rounded-sm border border-border" />
              <span
                className={`leading-snug ${
                  s.strike ? "text-muted-foreground/50 line-through" : "text-foreground/70"
                }`}
              >
                {s.text}
              </span>
            </li>
          ))}
        </ul>
      </div>
      <span className="absolute right-5 top-5 flex items-center gap-1 rounded-full bg-foreground/85 px-2.5 py-1 text-[11px] font-medium text-background shadow-md">
        <Clock className="h-3 w-3" /> 40 min outside
      </span>
    </div>
  );
}

/* ---------- page ---------- */

export default function Home() {
  return (
    <div className="relative flex min-h-screen flex-col bg-background text-foreground">
      <ThemeSwitch />

      {/* Nav */}
      <header className="fixed inset-x-0 top-0 z-40 border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between px-5 sm:px-8 lg:px-10">
          <Logo />
          <nav className="flex items-center gap-5">
            <a
              href="#how"
              className="focus-ring hidden text-sm text-muted-foreground transition-colors hover:text-foreground sm:block"
            >
              How it works
            </a>
            <a
              href="#compare"
              className="focus-ring hidden text-sm text-muted-foreground transition-colors hover:text-foreground sm:block"
            >
              Why Haggle
            </a>
            <a
              href="/jobs"
              className="focus-ring hidden text-sm text-muted-foreground transition-colors hover:text-foreground sm:block"
            >
              Jobs
            </a>
            <CutButton href="/jobs/new">Start a job</CutButton>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero. `isolate` creates a stacking context so the -z-10 background
            layers (dot grid, washes, lock figures) render above the page
            background instead of being buried beneath it. */}
        <section className="relative isolate overflow-hidden">
          {/* dotted grid + radial washes */}
          <div
            aria-hidden="true"
            className="bg-dot-grid pointer-events-none absolute inset-0 -z-10 opacity-[0.5]"
            style={{
              maskImage: "radial-gradient(70% 55% at 50% 0%, black, transparent 75%)",
              WebkitMaskImage: "radial-gradient(70% 55% at 50% 0%, black, transparent 75%)",
            }}
          />

          {/* Giant background lock: anchored to the right edge and half
              off-canvas so it reads as texture beside the copy, never under
              it. Shackle springs open once on load. */}
          <LockFigure
            open
            strokeWidth={1}
            className="pointer-events-none absolute -right-28 top-1/2 -z-10 hidden h-[30rem] w-[30rem] -translate-y-1/2 rotate-[8deg] text-primary-400/[0.1] lg:block dark:text-primary-400/[0.07]"
          />

          {/* Floating background lock (decorative, desktop only) */}
          <LockFigure className="float-y pointer-events-none absolute left-[8%] top-40 -z-10 hidden h-14 w-14 text-primary-400/25 lg:block" />

          <div className="mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-10">
            <div className="mx-auto flex max-w-4xl flex-col items-center pb-14 pt-32 text-center sm:pt-40">
              <span
                className="enter inline-flex items-center gap-2 border border-border bg-muted/50 px-3 py-1 text-xs font-medium text-muted-foreground"
                style={{ "--enter-delay": "0ms" }}
              >
                <span aria-hidden="true" className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary-400" />
                ElevenLabs &times; Hack-Nation: Global AI Hackathon
              </span>

              <h1
                className="enter mt-7 text-balance font-jakarta text-5xl font-black leading-[1.04] tracking-[-0.02em] sm:text-6xl lg:text-7xl"
                style={{ "--enter-delay": "80ms" }}
              >
                Locked out? Don't panic.{" "}
                <span className="text-primary-400">Haggle</span>.
              </h1>

              <p
                className="enter mt-6 max-w-2xl text-balance text-base leading-relaxed text-muted-foreground sm:text-lg"
                style={{ "--enter-delay": "160ms" }}
              >
                Locksmiths price your desperation. Haggle's AI agent phones every locksmith
                nearby at once, stays calm, demands all-in numbers, and makes them beat each
                other, so a fair, recorded price is waiting before anyone drives over.
              </p>

              <div
                className="enter mt-9 flex flex-wrap items-center justify-center gap-3"
                style={{ "--enter-delay": "240ms" }}
              >
                <CutButton size="lg" href="/jobs/new">
                  Get locksmith quotes <ArrowRight className="h-4 w-4" />
                </CutButton>
                <CutButton size="lg" variant="outline" href="#how">
                  See how it works
                </CutButton>
              </div>
            </div>

            {/* Hero mock */}
            <div className="enter mx-auto max-w-2xl pb-20" style={{ "--enter-delay": "340ms" }}>
              <QuotesMock />
            </div>
          </div>

          {/* Stat strip */}
          <div className="border-y border-border">
            <div className="mx-auto grid max-w-[1440px] grid-cols-1 divide-y divide-border sm:grid-cols-3 sm:divide-x sm:divide-y-0">
              {[
                ["4 to 10x", "Price inflation in fake-locksmith networks sued by the FTC in 30+ states"],
                ["1 in 2", "Locksmiths charged above fair price in a study of 4,224 shops"],
                ["Zero bluffing", "The agent's leverage comes only from quotes shops committed"],
              ].map(([stat, copy]) => (
                <div key={stat} className="px-6 py-5 text-center">
                  <p className="font-jakarta text-lg font-bold">{stat}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{copy}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section id="how" className="scroll-mt-20 py-20 sm:py-28">
          <div className="mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-10">
            <Reveal>
              <SectionHeading
                kicker="How it works"
                title="From locked out to a fair price in four steps"
                sub="Two voice agents, an interviewer and a buyer, make the calls you can't make while standing outside your own door."
              />
            </Reveal>

            <Reveal delay={120}>
              <div className="relative mt-12 border border-border">
                <CornerPlus className="-left-[7px] -top-[7px]" />
                <CornerPlus className="-right-[7px] -top-[7px]" />
                <CornerPlus className="-bottom-[7px] -left-[7px]" />
                <CornerPlus className="-bottom-[7px] -right-[7px]" />

                <div className="grid gap-px bg-border sm:grid-cols-2 lg:grid-cols-4">
                  {STEPS.map(({ icon: Icon, title, copy }, i) => (
                    <div key={title} className="group relative bg-card p-6 transition-colors hover:bg-primary-400/[0.03] sm:p-7">
                      <div className="flex items-center justify-between">
                        <span className="flex h-10 w-10 items-center justify-center bg-primary-50 text-primary-600 transition-transform duration-300 group-hover:scale-110 dark:bg-primary-400/10 dark:text-primary-400">
                          <Icon className="h-5 w-5" aria-hidden="true" />
                        </span>
                        <span className="font-mono text-xs text-muted-foreground">0{i + 1}</span>
                      </div>
                      <h3 className="mt-5 font-jakarta text-lg font-bold">{title}</h3>
                      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{copy}</p>
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        {/* Chat channels: the interview also runs in WhatsApp / Telegram */}
        <section id="chat" className="scroll-mt-20 border-t border-border py-20 sm:py-28">
          <div className="mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-10">
            <Reveal>
              <SectionHeading
                kicker="No laptop needed"
                title="Locked out with just your phone? Text us."
                sub="The same interview runs in chat. Message the bot from the doorstep, answer a few questions, and the calls start while you wait."
              />
            </Reveal>

            <div className="mx-auto mt-12 grid max-w-4xl gap-6 sm:grid-cols-2">
              {WHATSAPP_JOIN_CODE && (
                <Reveal delay={80} className="h-full">
                  <div className="cut-corners-lg h-full bg-border p-px">
                    <div className="cut-corners-lg flex h-full flex-col bg-card p-6 sm:p-7">
                      <div className="flex items-center justify-between">
                        <span className="flex h-10 w-10 items-center justify-center bg-[#25D366]/10 text-[#25D366]">
                          <WhatsAppIcon className="h-5 w-5" />
                        </span>
                        <span className="badge badge-info">free sandbox</span>
                      </div>
                      <h3 className="mt-5 font-jakarta text-lg font-bold">WhatsApp</h3>
                      <ol className="mt-3 space-y-2.5 text-sm leading-relaxed text-muted-foreground">
                        <li className="flex gap-3">
                          <span className="font-mono text-xs text-primary-500">01</span>
                          <span>
                            Unlock the bot once. The button opens WhatsApp with the join message
                            pre-filled, just hit send.
                          </span>
                        </li>
                        <li className="flex gap-3">
                          <span className="font-mono text-xs text-primary-500">02</span>
                          <span>Say hi, pick Locksmith, and answer the interview.</span>
                        </li>
                        <li className="flex gap-3">
                          <span className="font-mono text-xs text-primary-500">03</span>
                          <span>Every quote and the final report land on your job page.</span>
                        </li>
                      </ol>
                      <p className="mt-4 text-xs text-muted-foreground">
                        Runs on Twilio's free sandbox: access lasts 72 hours, rejoin anytime with
                        the same message.
                      </p>
                      <div className="mt-5">
                        <CutButton
                          href={whatsappJoinHref()}
                          target="_blank"
                          rel="noreferrer"
                          className="w-full sm:w-auto"
                        >
                          <WhatsAppIcon className="h-4 w-4" />
                          Open WhatsApp
                        </CutButton>
                      </div>
                    </div>
                  </div>
                </Reveal>
              )}

              {TELEGRAM_BOT_USERNAME && (
                <Reveal delay={160} className="h-full">
                  <div className="cut-corners-lg h-full bg-border p-px">
                    <div className="cut-corners-lg flex h-full flex-col bg-card p-6 sm:p-7">
                      <div className="flex items-center justify-between">
                        <span className="flex h-10 w-10 items-center justify-center bg-[#26A5E4]/10 text-[#26A5E4]">
                          <TelegramIcon className="h-5 w-5" />
                        </span>
                        <span className="badge badge-success">no signup</span>
                      </div>
                      <h3 className="mt-5 font-jakarta text-lg font-bold">Telegram</h3>
                      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                        One tap, hit start, done. The bot interviews you right in the chat, and you
                        can send photos of the lock or door mid-conversation. It answers in your
                        language.
                      </p>
                      <p className="mt-3 text-sm text-muted-foreground">
                        Same engine, same evidence-backed calls, same report.
                      </p>
                      <div className="mt-auto pt-5">
                        <CutButton
                          href={telegramHref()}
                          target="_blank"
                          rel="noreferrer"
                          className="w-full sm:w-auto"
                        >
                          <TelegramIcon className="h-4 w-4" />
                          Open @{TELEGRAM_BOT_USERNAME}
                        </CutButton>
                      </div>
                    </div>
                  </div>
                </Reveal>
              )}
            </div>
          </div>
        </section>

        {/* Before / after comparison */}
        <section id="compare" className="scroll-mt-20 border-t border-border py-20 sm:py-28">
          <div className="mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-10">
            <Reveal>
              <SectionHeading
                kicker="Before & after"
                title="The lockout, with and without an agent on your side"
              />
            </Reveal>

            <div className="mx-auto mt-14 grid max-w-5xl gap-6 lg:grid-cols-2">
              {/* Old way */}
              <Reveal className="h-full">
                <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-muted/20">
                  <div className="border-b border-border bg-foreground px-6 py-5">
                    <p className="font-jakarta text-lg font-semibold text-background">
                      Calling around yourself
                    </p>
                  </div>
                  <div className="relative flex flex-1 items-center justify-center border-b border-border py-10">
                    <NotepadMock />
                  </div>
                  <ul className="px-6 py-2">
                    {OLD_WAY.map((t) => (
                      <li
                        key={t}
                        className="flex items-center gap-3 border-t border-border/70 py-4 first:border-t-0"
                      >
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-foreground/10 text-foreground/40">
                          <X className="h-3.5 w-3.5" strokeWidth={3} />
                        </span>
                        <span className="text-sm font-medium text-muted-foreground">{t}</span>
                      </li>
                    ))}
                  </ul>
                </article>
              </Reveal>

              {/* With Haggle */}
              <Reveal delay={120} className="h-full">
                <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-primary-400/40 bg-primary-400/[0.04]">
                  <div className="flex items-center justify-between bg-primary-400 px-6 py-5">
                    <p className="font-jakarta text-lg font-semibold text-white">With Haggle</p>
                    <Scale className="h-5 w-5 text-white" />
                  </div>
                  <div className="relative flex flex-1 items-center border-b border-primary-400/20 bg-primary-400/[0.03] p-5">
                    <div className="w-full">
                      <QuotesMock />
                    </div>
                  </div>
                  <ul className="px-6 py-2">
                    {NEW_WAY.map((t) => (
                      <li
                        key={t}
                        className="flex items-center gap-3 border-t border-primary-400/15 py-4 first:border-t-0"
                      >
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-400 text-white">
                          <Check className="h-3.5 w-3.5" strokeWidth={3} />
                        </span>
                        <span className="text-sm font-medium text-foreground">{t}</span>
                      </li>
                    ))}
                  </ul>
                </article>
              </Reveal>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="border-t border-border py-20 sm:py-28">
          <div className="mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-10">
            <Reveal>
              <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
                <SectionHeading
                  align="left"
                  kicker="Why it wins"
                  title="Negotiation you can audit"
                  sub="Cheap talk is easy for an AI. Haggle is built so every number it uses on a call traces back to evidence."
                />
                <div className="lg:text-right">
                  <p className="text-xs uppercase tracking-widest text-muted-foreground">
                    Backed by
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2 lg:justify-end">
                    {["ElevenLabs voice", "Committed quotes", "Call recordings"].map((label) => (
                      <span
                        key={label}
                        className="rounded-full border border-border bg-card px-3 py-1 text-xs uppercase tracking-wide text-muted-foreground"
                      >
                        {label}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </Reveal>

            <div className="mt-12 grid gap-5 md:grid-cols-3">
              {FEATURES.map(({ icon: Icon, title, copy }, i) => (
                <Reveal key={title} delay={i * 100}>
                  <div className="cut-corners card group h-full p-6 transition-colors hover:border-primary-400">
                    <span className="flex h-10 w-10 items-center justify-center bg-primary-50 text-primary-600 transition-transform duration-300 group-hover:scale-110 dark:bg-primary-400/10 dark:text-primary-400">
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <h3 className="mt-5 font-jakarta text-lg font-bold">{title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{copy}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* Pull quote */}
        <section className="border-t border-border py-20 sm:py-24">
          <div className="mx-auto max-w-3xl px-5 text-center sm:px-8">
            <Reveal>
              <Quote className="mx-auto h-8 w-8 text-primary-400" />
              <p className="mt-6 text-balance font-jakarta text-2xl font-bold leading-snug tracking-tight sm:text-3xl">
                “The agent can only bring leverage it can prove. That constraint isn't a limitation,
                it's the whole product.”
              </p>
              <p className="mt-5 text-sm text-muted-foreground">The honesty guardrail, in one line</p>
            </Reveal>
          </div>
        </section>

        {/* Verticals */}
        <section className="border-t border-border py-20 sm:py-28">
          <div className="mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-10">
            <Reveal>
              <SectionHeading
                kicker="Beyond lockouts"
                title="Locksmiths first. Any phone-priced market next."
                sub="Verticals are config files, not code. The same two agents that beat lockout scams already run three more markets."
              />
            </Reveal>

            <div className="mx-auto mt-12 grid max-w-5xl gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {VERTICALS.map(({ icon: Icon, name, tag, copy }, i) => (
                <Reveal key={name} delay={i * 100}>
                  <div className="cut-corners card group relative h-full p-6 transition-colors hover:border-primary-400 sm:p-7">
                    <div className="flex items-center justify-between">
                      <span className="flex h-11 w-11 items-center justify-center bg-primary-50 text-primary-600 transition-transform duration-300 group-hover:scale-110 dark:bg-primary-400/10 dark:text-primary-400">
                        <Icon className="h-6 w-6" aria-hidden="true" />
                      </span>
                      <span className="border border-border bg-muted/50 px-2 py-0.5 text-xs font-medium text-muted-foreground">
                        {tag}
                      </span>
                    </div>
                    <h3 className="mt-5 font-jakarta text-xl font-bold">{name}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{copy}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="relative isolate overflow-hidden border-t border-border py-20 sm:py-28">
          <div className="mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-10">
            <Reveal>
              <div className="cut-corners-lg mx-auto max-w-4xl bg-border p-px">
                <div className="cut-corners-lg flex flex-col items-center bg-card px-6 py-16 text-center sm:px-10 sm:py-20">
                  <h2 className="text-balance font-jakarta text-4xl font-bold leading-[1.08] tracking-tight sm:text-5xl">
                    The lock isn't the problem.
                    <br />
                    The price is.
                  </h2>
                  <p className="mt-5 max-w-xl text-balance text-muted-foreground">
                    Say what happened once. Haggle rings every locksmith nearby, locks a fair
                    all-in price, and brings the receipts.
                  </p>
                  <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                    <CutButton size="lg" href="/jobs/new">
                      Get locksmith quotes <ArrowRight className="h-4 w-4" />
                    </CutButton>
                    <CutButton size="lg" variant="outline" href="/jobs">
                      Browse jobs
                    </CutButton>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border">
        <div className="mx-auto max-w-[1440px] px-5 py-14 sm:px-8 lg:px-10">
          <div className="grid gap-10 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
            <div>
              <Logo />
              <p className="mt-5 max-w-xs text-sm leading-relaxed text-muted-foreground">
                Voice agents that call every locksmith nearby, lock all-in prices, and negotiate
                with evidence-backed leverage. More markets, same engine.
              </p>
            </div>

            {[
              {
                title: "Product",
                links: [
                  ["How it works", "#how"],
                  ["Why Haggle", "#compare"],
                  ["Start a job", "/jobs/new"],
                  ["Jobs", "/jobs"],
                ],
              },
              {
                title: "Markets",
                links: [
                  ["Locksmith", "/jobs/new"],
                  ["Moving", "/jobs/new"],
                  ["Auto body", "/jobs/new"],
                  ["Pest control", "/jobs/new"],
                ],
              },
              {
                title: "Built with",
                links: [
                  ["ElevenLabs", "https://elevenlabs.io"],
                  ["Hack-Nation", "#"],
                ],
              },
            ].map((col, i) => (
              <div key={col.title} className={`relative md:pl-8 ${i > 0 ? "md:border-l md:border-border" : ""}`}>
                {i > 0 && (
                  <>
                    <CornerPlus className="left-0 top-0 hidden -translate-x-1/2 -translate-y-1/2 md:block" />
                    <CornerPlus className="bottom-0 left-0 hidden -translate-x-1/2 translate-y-1/2 md:block" />
                  </>
                )}
                <h3 className="text-sm font-semibold tracking-tight">{col.title}</h3>
                <ul className="mt-4 space-y-2">
                  {col.links.map(([label, href]) => (
                    <li key={label}>
                      <a
                        href={href}
                        className="focus-ring text-sm text-muted-foreground transition-colors hover:text-foreground"
                      >
                        {label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="mt-12 flex flex-col-reverse items-start justify-between gap-4 border-t border-border pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center">
            <span>ElevenLabs &times; Hack-Nation: Haggle</span>
            <span>Built in 24 hours. Negotiates in minutes.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
