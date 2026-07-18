import { Logo } from "@/components/Logo";
import { CutButton } from "@/components/ui/CutButton";
import { ThemeSwitch } from "@/components/ThemeSwitch";

export default function Home() {
  return (
    <main className="relative flex min-h-screen flex-col bg-background text-foreground">
      <ThemeSwitch />

      <div className="flex flex-1 flex-col items-center justify-center gap-8 px-6 text-center">
        <Logo />

        <div className="flex max-w-2xl flex-col gap-4">
          <h1 className="font-jakarta text-4xl font-black leading-tight tracking-tight sm:text-5xl">
            Voice agents that call, compare, and{" "}
            <span className="text-primary-400">haggle</span>.
          </h1>
          <p className="text-lg text-muted-foreground">
            Pick your market. Never overpay again.
          </p>
        </div>

        <CutButton size="lg" href="/jobs/new">
          Start a job
        </CutButton>

        <div className="cut-corners card mt-4 max-w-md px-6 py-4 text-sm text-muted-foreground">
          Parallel calls to real vendors, itemised quotes, and a second round
          that uses competing bids as leverage — every claim backed by a
          recording.
        </div>
      </div>

      <footer className="pb-6 text-center text-xs text-muted-foreground">
        ElevenLabs &times; Hack-Nation — The Negotiator
      </footer>
    </main>
  );
}
