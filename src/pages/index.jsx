// Landing page in the HomePixel design language (viraloop): sharp hairline
// panels, kickers, corner-plus marks, cut-corner buttons, radial washes.
// Animations are the CSS `.enter` keyframes from globals.css (no motion dep).

import { Logo } from "@/components/Logo";
import { CutButton } from "@/components/ui/CutButton";
import { ThemeSwitch } from "@/components/ThemeSwitch";
import {
  Car,
  FileCheck,
  ListChecks,
  Mic,
  PhoneCall,
  Scale,
  ShieldCheck,
  TriangleAlert,
  Truck,
} from "lucide-react";

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
  return <p className="text-xs font-medium uppercase tracking-[0.2em] text-primary-400">{children}</p>;
}

const STEPS = [
  {
    icon: Mic,
    title: "Brief the intake agent",
    copy: "Talk through your job, or upload the paperwork. The agent turns it into an itemised spec every vendor quotes against.",
  },
  {
    icon: PhoneCall,
    title: "Calls go out in parallel",
    copy: "A buyer agent rings each vendor, works through the same spec, and gathers line-item quotes, recorded end to end.",
  },
  {
    icon: Scale,
    title: "The leverage round",
    copy: "Armed with committed bids, the agent calls back and haggles, quoting real competitor numbers and never invented ones.",
  },
  {
    icon: FileCheck,
    title: "Evidence-backed report",
    copy: "Ranked quotes, red flags, and a recording behind every claim land in one report you can act on.",
  },
];

const FEATURES = [
  {
    icon: ListChecks,
    title: "Itemised, comparable quotes",
    copy: "Every vendor prices the same spec, so line items line up and hidden extras stand out immediately.",
  },
  {
    icon: TriangleAlert,
    title: "Red flags surfaced",
    copy: "Vague pricing, pressure tactics, and dodged questions get flagged, with the transcript to prove it.",
  },
  {
    icon: ShieldCheck,
    title: "Honest by construction",
    copy: "Leverage is built server-side from committed quotes only. The agent physically cannot bluff on your behalf.",
  },
];

const VERTICALS = [
  {
    icon: Truck,
    name: "Moving",
    tag: "Live demo",
    copy: "Apartment and house moves: crew size, truck, packing, stairs, insurance, all quoted line by line.",
  },
  {
    icon: Car,
    name: "Auto body",
    tag: "Config swap",
    copy: "Collision repair estimates: parts, labour, paint, OEM vs aftermarket. Same engine, new market.",
  },
];

function SectionHeading({ kicker, title, sub }) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <Kicker>{kicker}</Kicker>
      <h2 className="mt-3 text-balance font-jakarta text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
        {title}
      </h2>
      {sub && <p className="mt-4 text-balance text-muted-foreground">{sub}</p>}
    </div>
  );
}

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
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 -z-10"
            style={{
              background:
                "radial-gradient(60% 50% at 50% -5%, color-mix(in srgb, #08A0E9 14%, transparent), transparent 70%)",
            }}
          />

          <div className="mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-10">
            <div className="mx-auto flex max-w-4xl flex-col items-center pb-20 pt-32 text-center sm:pt-40">
              <span
                className="enter inline-flex items-center gap-2 border border-border bg-muted/50 px-3 py-1 text-xs font-medium text-muted-foreground"
                style={{ "--enter-delay": "0ms" }}
              >
                <span aria-hidden="true" className="h-1.5 w-1.5 animate-pulse bg-primary-400" />
                ElevenLabs &times; Hack-Nation: Global AI Hackathon
              </span>

              <h1
                className="enter mt-7 text-balance font-jakarta text-5xl font-black leading-[1.04] tracking-[-0.02em] sm:text-6xl lg:text-7xl"
                style={{ "--enter-delay": "80ms" }}
              >
                Voice agents that call, compare, and <span className="text-primary-400">haggle</span>.
              </h1>

              <p
                className="enter mt-6 max-w-2xl text-balance text-base leading-relaxed text-muted-foreground sm:text-lg"
                style={{ "--enter-delay": "160ms" }}
              >
                Brief an AI buyer once. It phones every vendor in parallel, collects itemised
                quotes, then calls back and negotiates with competing bids as leverage, every
                claim backed by a recording.
              </p>

              <div
                className="enter mt-9 flex flex-wrap items-center justify-center gap-3"
                style={{ "--enter-delay": "240ms" }}
              >
                <CutButton size="lg" href="/jobs/new">
                  Start a job
                </CutButton>
                <CutButton size="lg" variant="outline" href="#how">
                  See how it works
                </CutButton>
              </div>
            </div>
          </div>

          {/* Stat strip */}
          <div className="enter border-y border-border" style={{ "--enter-delay": "320ms" }}>
            <div className="mx-auto grid max-w-[1440px] grid-cols-1 divide-y divide-border sm:grid-cols-3 sm:divide-x sm:divide-y-0">
              {[
                ["Parallel calls", "Every vendor rung at once, not one by one"],
                ["Two rounds", "Quote first, then negotiate with leverage"],
                ["Zero bluffing", "Leverage only from quotes vendors committed"],
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
            <SectionHeading
              kicker="How it works"
              title="From brief to best price in four steps"
              sub="Two generic voice agents, an intake interviewer and a buyer, do the calling so you never have to."
            />

            <div className="relative mt-12 border border-border">
              <CornerPlus className="-left-[7px] -top-[7px]" />
              <CornerPlus className="-right-[7px] -top-[7px]" />
              <CornerPlus className="-bottom-[7px] -left-[7px]" />
              <CornerPlus className="-bottom-[7px] -right-[7px]" />

              <div className="grid gap-px bg-border sm:grid-cols-2 lg:grid-cols-4">
                {STEPS.map(({ icon: Icon, title, copy }, i) => (
                  <div key={title} className="relative bg-card p-6 sm:p-7">
                    <div className="flex items-center justify-between">
                      <span className="flex h-10 w-10 items-center justify-center bg-primary-50 text-primary-600 dark:bg-primary-400/10 dark:text-primary-400">
                        <Icon className="h-5 w-5" aria-hidden="true" />
                      </span>
                      <span className="font-mono text-xs text-muted-foreground">
                        0{i + 1}
                      </span>
                    </div>
                    <h3 className="mt-5 font-jakarta text-lg font-bold">{title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{copy}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="border-t border-border py-20 sm:py-28">
          <div className="mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-10">
            <SectionHeading
              kicker="Why it wins"
              title="Negotiation you can audit"
              sub="Cheap talk is easy for an AI. Haggle is built so every number it uses on a call traces back to evidence."
            />

            <div className="mx-auto mt-12 grid max-w-5xl gap-5 md:grid-cols-3">
              {FEATURES.map(({ icon: Icon, title, copy }) => (
                <div key={title} className="cut-corners card p-6">
                  <span className="flex h-10 w-10 items-center justify-center bg-primary-50 text-primary-600 dark:bg-primary-400/10 dark:text-primary-400">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <h3 className="mt-5 font-jakarta text-lg font-bold">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{copy}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Verticals */}
        <section className="border-t border-border py-20 sm:py-28">
          <div className="mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-10">
            <SectionHeading
              kicker="Pick your market"
              title="One engine, any vertical"
              sub="Verticals are config files, not code. The same two agents negotiate a house move or a fender bender."
            />

            <div className="mx-auto mt-12 grid max-w-4xl gap-5 sm:grid-cols-2">
              {VERTICALS.map(({ icon: Icon, name, tag, copy }) => (
                <div key={name} className="cut-corners card relative p-6 sm:p-7">
                  <div className="flex items-center justify-between">
                    <span className="flex h-11 w-11 items-center justify-center bg-primary-50 text-primary-600 dark:bg-primary-400/10 dark:text-primary-400">
                      <Icon className="h-6 w-6" aria-hidden="true" />
                    </span>
                    <span className="border border-border bg-muted/50 px-2 py-0.5 text-xs font-medium text-muted-foreground">
                      {tag}
                    </span>
                  </div>
                  <h3 className="mt-5 font-jakarta text-xl font-bold">{name}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{copy}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="relative overflow-hidden border-t border-border">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 -z-10"
            style={{
              background:
                "radial-gradient(50% 80% at 50% 110%, color-mix(in srgb, #08A0E9 16%, transparent), transparent 70%)",
            }}
          />
          <div className="mx-auto flex max-w-[1440px] flex-col items-center px-5 py-24 text-center sm:px-8 sm:py-32 lg:px-10">
            <h2 className="text-balance font-jakarta text-4xl font-bold leading-[1.08] tracking-tight sm:text-5xl">
              Stop overpaying.
              <br />
              Put an agent on the phone.
            </h2>
            <p className="mt-5 max-w-xl text-balance text-muted-foreground">
              Describe the job once. The agents handle the calls, the haggling, and the receipts.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <CutButton size="lg" href="/jobs/new">
                Start a job
              </CutButton>
              <CutButton size="lg" variant="outline" href="/jobs">
                Browse jobs
              </CutButton>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-[1440px] flex-col items-center justify-between gap-3 px-5 py-6 text-xs text-muted-foreground sm:flex-row sm:px-8 lg:px-10">
          <span>ElevenLabs &times; Hack-Nation: Haggle</span>
          <span>Built in 24 hours. Negotiates in minutes.</span>
        </div>
      </footer>
    </div>
  );
}
