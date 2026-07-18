# The Negotiator

Voice agents that call, compare, and haggle — pick your market, never overpay again.

Built for the Hack-Nation 6th Global AI Hackathon, ElevenLabs Challenge 01. The system runs the full loop: **intake** (voice interview + document upload → one confirmed job spec) → **calls** (parallel buyer-agent calls against vendors with hidden negotiation styles) → **close** (leverage-driven round 2 where the price measurably drops in-call, then a ranked, evidence-backed report with recordings, transcripts, and red flags).

## How it works

**Two generic ElevenLabs agents, zero per-vendor agents.** Everything vertical- and vendor-specific is injected at session start via dynamic variables built server-side from a config file:

- `src/config/verticals/moving.js` — the demoed vertical: job-spec taxonomy, market benchmarks (moveBuddha/FMCSA), red-flag rules (30%-below-market lowball, no not-to-exceed cap, oversized deposit), negotiation levers, and three vendor policy cards (honest / lowball-with-hidden-fees / premium hard-sell).
- `src/config/verticals/autobody.js` — the proof that switching verticals means swapping a config file, not rewriting agents.

**Vendor modes per call:**
- **Sim** — the vendor is an Anthropic-driven persona (its policy card as system prompt). The buyer agent runs as a live ElevenLabs voice session; vendor turns are generated server-side, spoken via ElevenLabs TTS in a distinct voice, and injected back into the conversation.
- **Role-play** — a human answers as the vendor through the browser mic against the same live buyer agent (full two-sided recording).
- Real calls would go through ElevenLabs batch calling / native Twilio with the same dynamic variables — zero agent changes (see `src/pages/api/vendors/discover.js` for the Google Places call-list path).

**Honesty is enforced physically, not just in the prompt.** The buyer agent discloses it is an AI whenever asked. It can only cite competing bids that the server assembles from committed quotes in the database (`/api/agent/session` + `/api/calls/[id]/leverage`) — round-1 calls get an empty list, so inventing a bid is impossible. Quote totals are recomputed server-side from itemised lines; the job spec freezes at confirmation and is reused verbatim on every call.

## Setup

```bash
npm install
cp .env.example .env.local   # fill in the values below
```

| Variable | Where to get it |
|---|---|
| `MONGODB_URI` | local MongoDB or Atlas, e.g. `mongodb://127.0.0.1:27017/the-negotiator` |
| `ELEVENLABS_API_KEY` | elevenlabs.io → Settings → API keys |
| `ANTHROPIC_API_KEY` | console.anthropic.com |
| `ELEVENLABS_INTAKE_AGENT_ID` / `ELEVENLABS_BUYER_AGENT_ID` | created by the next step |
| `GOOGLE_PLACES_API_KEY` | optional — vendor discovery falls back to canned data |

```bash
npm run create-agents   # creates both ElevenLabs agents (prompts + tools), prints the two IDs for .env.local
npm run seed            # seeds a fully-completed demo job (fallback if live voice fails on stage)
npm run dev             # http://localhost:3001
```

## Demo flow

1. `/jobs/new` — pick a vertical (Moving / Auto Body — the config swap), then build the spec by **voice interview**, by **uploading a photo/quote PDF**, or both. Confirm to freeze spec v1.
2. `/jobs/[id]` — **Start calls**: three parallel call cards, one per hidden policy card. Watch itemised quote lines land as the buyer agent logs them mid-call. Toggle one card to role-play and answer as the vendor yourself.
3. When ≥2 quotes are in, **Negotiate round 2**: the buyer agent calls the premium vendor armed with the best committed bid ("I have a written quote for $1,950 — can you beat it?") and the price drops in-call. The before/after is recorded as a negotiation event tied to the exact transcript turn.
4. **Generate report** → `/jobs/[id]/report`: ranked landed costs, the lowball flagged (not hidden), fee breakdowns vs benchmark, audio players, and a plain-language recommendation where every claim is a clickable citation into the transcript.

## Stack

Next.js 15 (Pages Router, JS/JSX) · Tailwind 3 · MongoDB/Mongoose · `@elevenlabs/react` + `@elevenlabs/client` (voice sessions) · `@elevenlabs/elevenlabs-js` (TTS, agent management) · `@anthropic-ai/sdk` (vendor personas, document intake, report narrative). No auth — hackathon single-user build.
