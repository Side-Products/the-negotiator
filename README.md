# Haggle

Voice agents that call, compare, and haggle — pick your market, never overpay again.

Built for the Hack-Nation 6th Global AI Hackathon, ElevenLabs Challenge 01. The system runs the full loop: **intake** (voice interview + document upload → one confirmed job spec) → **calls** (parallel buyer-agent calls against vendors with hidden negotiation styles) → **close** (leverage-driven round 2 where the price measurably drops in-call, then a ranked, evidence-backed report with recordings, transcripts, and red flags).

> **Construction team:** the GAEB construction path described in the documents below is an implementation plan and skill package; it is **not implemented in the current app yet**. Do not reuse the current moving-specific `committed` quote flag, dollar/market assumptions, cold-call discovery, or recording flow as proof that the construction requirements are met.

## GAEB construction handoff

- [Architecture brief — Claus](docs/GAEB_NEGOTIATION_ARCHITECTURE_BRIEF_CLAUS.md): product boundary, data contracts, proof-carrying wedge, delivery phases, acceptance tests, and demo script.
- [Construction negotiation skill](skills/negotiate-construction-bids/SKILL.md): live conversation and negotiation policy.
- [Runtime policy](skills/negotiate-construction-bids/runtime.json): machine-readable gates, states, red flags, leverage, and report policy.
- [Tischlerarbeiten profile](skills/negotiate-construction-bids/profiles/tischlerarbeiten.json): triggered reference-demo questions and mandatory escalations.
- [Evidence register](skills/negotiate-construction-bids/EVIDENCE.md): scientific, GAEB, construction, German, and EU sources with limitations.
- [Blocking eval specification](skills/negotiate-construction-bids/evals/cases.json): required parser, dialogue, legal, numeric, and leverage behaviors.

The intended claim is broad structural support for conforming, private LV-based packages with safe generic behavior; Tischlerarbeiten remains a `reference_demo_candidate` until the fixtures, expert review, and blocking evals pass.

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
| `OPENAI_API_KEY` | platform.openai.com → API keys (WhatsApp intake chat) |
| `TWILIO_ACCOUNT_SID` / `TWILIO_AUTH_TOKEN` | console.twilio.com → Account Info (WhatsApp bot) |
| `TWILIO_WHATSAPP_FROM` | `whatsapp:+14155238886` (shared sandbox number) |
| `PUBLIC_BASE_URL` | your public URL, e.g. the ngrok https URL in dev |

```bash
npm run create-agents   # creates both ElevenLabs agents (prompts + tools), prints the two IDs for .env.local
npm run seed            # seeds a fully-completed demo job (fallback if live voice fails on stage)
npm run dev             # http://localhost:3001
```

## WhatsApp bot (Twilio)

Job intake also works over WhatsApp: message the bot, it interviews you (GPT-driven, one question at a time, reusing the same vertical config), then confirms the spec and creates the job — same pipeline as the web intake.

Setup (~5 min, uses the free Twilio sandbox):

1. Fill `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, and `OPENAI_API_KEY` in `.env.local` (`TWILIO_WHATSAPP_FROM` stays `whatsapp:+14155238886`).
2. Expose the app publicly: `ngrok http 3001` → put the https URL in `PUBLIC_BASE_URL`, restart `npm run dev`. (`PUBLIC_BASE_URL` also switches on Twilio signature validation for the webhook.)
3. Twilio Console → Messaging → Try it out → **Send a WhatsApp message** → *Sandbox settings*: set **"When a message comes in"** to `<PUBLIC_BASE_URL>/api/whatsapp/webhook`, method POST, save.
4. From your phone, WhatsApp the `join <code>` shown on that page to **+1 415 523 8886**, then send `hi`.

Flow: `hi` → pick a vertical → answer the interview → confirm the summary with `yes` → the bot replies with the job link. `restart` resets the conversation. Code: `src/pages/api/whatsapp/webhook.js` (inbound + intake loop), `src/backend/services/whatsapp.js` (outbound sends via `sendWhatsApp()`), `src/backend/models/whatsappSession.js` (per-phone state).

To message from your own number/name instead of the shared sandbox (which always shows as "Twilio Sandbox"): Console → Messaging → Senders → WhatsApp senders → register a number through the Meta flow, then change `TWILIO_WHATSAPP_FROM`.

## Demo flow

1. `/jobs/new` — pick a vertical (Moving / Auto Body — the config swap), then build the spec by **voice interview**, by **uploading a photo/quote PDF**, or both. Confirm to freeze spec v1.
2. `/jobs/[id]` — **Start calls**: three parallel call cards, one per hidden policy card. Watch itemised quote lines land as the buyer agent logs them mid-call. Toggle one card to role-play and answer as the vendor yourself.
3. When ≥2 quotes are in, **Negotiate round 2**: the buyer agent calls the premium vendor armed with the best committed bid ("I have a written quote for $1,950 — can you beat it?") and the price drops in-call. The before/after is recorded as a negotiation event tied to the exact transcript turn.
4. **Generate report** → `/jobs/[id]/report`: ranked landed costs, the lowball flagged (not hidden), fee breakdowns vs benchmark, audio players, and a plain-language recommendation where every claim is a clickable citation into the transcript.

## Stack

Next.js 15 (Pages Router, JS/JSX) · Tailwind 3 · MongoDB/Mongoose · `@elevenlabs/react` + `@elevenlabs/client` (voice sessions) · `@elevenlabs/elevenlabs-js` (TTS, agent management) · `@anthropic-ai/sdk` (vendor personas, document intake, report narrative) · `openai` + `twilio` (WhatsApp intake bot). No auth — hackathon single-user build.
