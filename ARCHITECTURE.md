# Architecture

> Orientation doc for AI assistants and new contributors. Read this before touching code — it encodes the contracts and invariants the codebase depends on but cannot always express in code.

## What this is

A voice-agent negotiation system (ElevenLabs hackathon challenge): **intake** a job spec by voice interview or document upload → **call** a market of vendors in parallel and extract itemised quotes → **negotiate** a second round using real competing bids as leverage → **report** a ranked, citation-backed comparison with recordings and transcripts.

Stack: Next.js 15 **Pages Router**, plain **JavaScript/JSX** (no TypeScript), Tailwind 3 (HSL css-variable theme), MongoDB via Mongoose 8, no auth (single-user hackathon build). Path alias `@/*` → `src/*`. Dev server: `npm run dev` on port 3001.

## The one design decision that explains everything

**There are exactly two ElevenLabs agents in the entire system, and neither contains any vertical- or vendor-specific content.** Their prompts (defined in `src/scripts/createAgents.js`) are templates full of `{{dynamic_variables}}`. Every session is parameterised at start time by `POST /api/agent/session`, which builds all variable values **server-side** from:

1. the vertical config file (`src/config/verticals/*.js`), and
2. the job/call state in Mongo.

Consequences you must preserve:
- Adding a vertical = adding one config file + registering it in `src/config/verticals/index.js`. **No agent code, prompt, component, or route may ever branch on a vertical id.**
- Vendors are not agents and not DB records. Simulated vendors are **policy cards inside the vertical config**; a Call references one by `policyCardId`.
- The client never composes prompt data. If a browser could alter `leverage_json`, the honesty guarantee (below) would be void.

## Hard invariants (do not weaken)

1. **The agent physically cannot invent a competing bid.** `leverage_json` (session bootstrap) and `GET /api/calls/[id]/leverage` are both built from `Quote.find({ _id: { $in: call.leverageQuoteIds }, committed: true })`. Round-1 calls have `leverageQuoteIds: []`, so leverage is empty by construction. Vendor names are redacted to "another licensed provider".
2. **The spec freezes at confirmation.** `POST /api/jobs/[id]/confirm` sets `confirmed: true`; after that, spec PATCHes return 409. Every Call pins `specVersion`. This is the challenge's "same spec reused verbatim across every call" requirement.
3. **Quote totals are server truth.** `commit.js` recomputes `total = sum(lines)` and overrides the agent's claimed total (returning a correction note if it drifted > $1). Red flags are computed server-side (`redFlagService.evaluate`) at commit time.
4. **AI disclosure.** The buyer prompt requires an immediate, truthful "Yes — I'm an AI assistant calling on behalf of a real customer" whenever asked. Never remove or soften this.
5. **Every call ends in a structured outcome**: a committed quote, or `log_outcome(callback | declined)`. The prompt and the `end_call` system tool enforce this; the UI never persists a "vague number".

## Data model (3 collections, `src/backend/models/`)

```
Job   { vertical, spec: Mixed (keyed by taxonomy field key), specVersion, specSource: voice|doc|both,
        confirmed, confirmedAt, status: draft|confirmed|calling|negotiating|done,
        intakeConversationId, report: { ranking[], recommendedQuoteId, narrative, generatedAt } }

Call  { jobId, specVersion, vendorName, policyCardId, round: 1|2, mode: sim|roleplay,
        status: pending|live|done|failed, elevenConversationId,
        transcript: [{ role: 'agent'|'vendor', text, turnIndex, at }],   // our live copy
        elevenTranscript: Mixed,                                          // authoritative, pulled at finalize
        recordingPath, leverageQuoteIds: [QuoteId],
        negotiationEvents: [{ leverId, beforeTotal, afterTotal, citedQuoteId, turnRef, note }],
        outcome: { type: quote|callback|declined, note, turnRef } }

Quote { callId, jobId, lines: [{ feeKey, label, amount, note, turnRef }], total, guaranteed,
        validUntil, redFlags: [{ id, message }], committed, supersedes: QuoteId }
```

Conventions:
- **Transcript roles** are `'agent'` (the buyer AI) and `'vendor'` (everything else). `TranscriptView` treats `buyer|agent|assistant` as the buyer side.
- **`turnRef`** = index into `call.transcript`. Quote lines, outcomes, and negotiation events carry it; report citations use the form `[call:<callId>#<turnRef>]` and the report page deep-links to DOM id `turn-<callId>-<turnRef>`.
- **Round-2 supersedes**: a round-2 committed quote sets `supersedes` to the same vendor's round-1 quote. Superseded quotes are excluded from ranking and from narrative evidence — never cite them in a narrative.

## Vertical config shape (`src/config/verticals/moving.js` is the reference)

```
{ id, label, tagline,
  jobSpec: { fields: [{ key, label, type: string|date|enum|number|boolean|list, required, ask, options?, itemShape?, default? }] },
  interview: { opener, style, mustConfirm },            // prose, prompt-ready
  benchmarks: { marketMid, marketMin, marketMax, source },
  redFlags:  [{ id, type: below_market_pct|missing_term|fee_over_pct|fee_present, thresholdPct?|term?|feeKey?|minAmount?, message }],
  fees:      [{ key, label }],                          // itemisation taxonomy; every quote line maps to one key
  levers:    [{ id, requires: leverage|fee|null, script }],
  vendorPolicyCards: [{ id, businessName, voiceId, persona,
      pricing: { openingTotal, floor, hiddenFees: [{ feeKey, amount, revealWhen }], guaranteedWillingly },
      matchBehavior, friction: [..], aiReaction }] }
```

`jobSpec.fields` drives three things from one source: the intake agent's interview, the document-extraction JSON schema (`docIntake.js` generates it), and the `SpecPreview` UI. `autobody.js` exists to prove the swap.

## Runtime flows

### Intake (the Estimator)
```
/jobs/new ── VerticalPicker ── POST /api/jobs (draft)
   ├─ VoiceInterviewPanel: POST /api/agent/session {role:'intake'} → ElevenLabs session
   │    client tools: update_spec → PATCH /api/jobs/[id] {field_key, value_json}
   │                  confirm_spec → POST /api/jobs/[id]/confirm
   └─ DocUpload: base64 → POST /api/jobs/extract → docIntake.extractSpec (Anthropic vision,
        forced tool_use, schema generated from jobSpec.fields) → merged into the same draft spec
Both paths land in the same editable SpecPreview; Confirm freezes spec v1.
```

### Calls (the Caller) — the subtle part
The **buyer agent is always a live ElevenLabs voice session in the browser** (one per `CallCard`, each wrapped in its own `ConversationProvider`). The two modes differ only in who answers:

- **Sim mode** (mic muted): on each final buyer utterance, `CallCard` → `POST /api/calls/[id]/vendor-turn` → `vendorBrain.nextVendorTurn` (Anthropic `claude-sonnet-5`, **thinking disabled**, system prompt rendered from the policy card: hidden-fee reveal rules, floor, friction, AI-reaction) → ElevenLabs TTS in the card's voice → browser plays the audio, then injects the text via `conversation.sendUserMessage(text)`. The server appends both turns to `call.transcript`. Buyer utterances arriving mid-round-trip are **queued, never dropped** (turnRef integrity).
- **Role-play mode** (mic on): a human answers as the vendor. No loop; `call.transcript` is recovered at finalize from the ElevenLabs transcript.

Buyer client tools (browser handlers → API): `log_quote_item`, `commit_quote` (returns recomputed total + red flags so the agent reacts in-call), `record_negotiation_event`, `log_outcome`, `get_leverage`. Session lifecycle: `onConnect` PATCHes `{status:'live', elevenConversationId}`; disconnect → `POST /api/calls/[id]/finalize` (pulls authoritative transcript + audio → `public/recordings/<callId>.mp3`, polls up to 4×2s because ElevenLabs processes asynchronously).

### Negotiation (the Closer)
`POST /api/jobs/[id]/negotiate` creates a round-2 Call on the premium policy card with `leverageQuoteIds = [best committed round-1 quote]` (lowest non-lowball total, guaranteed preferred; 409 if none; idempotent). The premium card's `matchBehavior` only concedes when shown a concrete bid — so the price drop is *caused* by leverage, not scripted. Proof chain stored: `negotiationEvents` (before/after + citedQuoteId + turnRef) + the superseding Quote + the transcript turn + ElevenLabs' own tool-call timestamps.

### Report
`POST /api/jobs/[id]/report` → `reportService.generateReport`: ranks non-superseded committed quotes by landed total (lowball ranked *with* its warning, not hidden), picks recommended (guaranteed non-lowball first), then one Anthropic call (`claude-opus-4-8`, adaptive thinking, max_tokens 8000) writes a plain-language narrative in which **every factual claim must carry a `[call:<id>#<turn>]` citation**; the evidence passed to the model contains only ranked calls, so it cannot cite anything the report page doesn't render.

## File map

```
src/config/verticals/        moving.js autobody.js index.js   ← THE extension point
src/backend/models/          job.js call.js quote.js
src/backend/services/        vendorBrain.js      (policy-card persona → Anthropic → vendor line)
                             redFlagService.js   (rule engine over quote lines vs benchmarks)
                             reportService.js    (ranking + cited narrative; saves job.report)
                             docIntake.js        (vision extraction; schema from jobSpec.fields)
src/pages/api/agent/         session.js          (signed URL + server-built dynamicVariables — guardrail)
src/pages/api/jobs/          index.js extract.js [id]/{index,confirm,calls,negotiate,report}.js
src/pages/api/calls/[id]/    index.js quote-items.js commit.js outcome.js negotiation-event.js
                             leverage.js vendor-turn.js finalize.js audio.js
src/pages/api/vendors/       discover.js         (Google Places; canned fallback without key)
src/pages/                   index.jsx (hero) · jobs/{index,new}.jsx · jobs/[id]/{index,report}.jsx
src/components/intake/       VoiceInterviewPanel DocUpload SpecPreview
src/components/calls/        CallCard (the core component) TranscriptView
src/components/report/       RankingTable RedFlagBadge QuoteBreakdown
src/components/              Logo ThemeSwitch Layout/{DashboardLayout,SidebarThemeToggle}
src/components/ui/           CutButton Loader     (copied from viraloop; NAMED exports)
src/lib/                     dbConnect.js (global-promise-cache singleton) utils.js (cn)
src/scripts/                 createAgents.js (agent prompts + tool defs live HERE) seedDemoJob.js (demo fallback)
```

## Dynamic-variable & tool contracts (exact names — both sides must match)

| Agent | Dynamic variables (all values stringified JSON or primitives) | Client tools |
|---|---|---|
| Intake | `vertical_label, taxonomy_json, interview_json, spec_draft_json` | `update_spec(field_key, value_json)`, `confirm_spec()`, `end_call` (system) |
| Buyer | `vendor_name, job_spec_json, round, leverage_json, levers_json, fees_json, benchmarks_json` | `log_quote_item(fee_key,label,amount,note)`, `commit_quote(total,guaranteed,valid_until)`, `record_negotiation_event(lever_id,before_total,after_total,note)`, `log_outcome(type,note)`, `get_leverage()`, `end_call` (system) |

ElevenLabs dynamic variables accept **primitives only** — nested data must be `JSON.stringify`ed. Agent config changes go in `createAgents.js` (re-run `npm run create-agents` and update the agent IDs in `.env.local`).

## Gotchas / hard-won facts

- **SDK versions are newer than most training data**: `@elevenlabs/react` 1.10, `@elevenlabs/client` 1.15, `@elevenlabs/elevenlabs-js` 2.58. Verify APIs against `node_modules/**/dist/*.d.ts`, not memory. Key facts: `useConversation` must sit inside `ConversationProvider`; `startSession({ signedUrl, connectionType: "websocket", dynamicVariables, clientTools, onConnect, onMessage, onError, onDisconnect })`; mic mute is the `micMuted` hook option; `onConnect` receives `{ conversationId }`.
- A session failure **before** `onConnect` fires only `onError` (no `onDisconnect`) — `CallCard` tracks `connectedRef` to unstick the UI; keep that pattern.
- `vendorBrain` runs with `thinking: { type: "disabled" }` and small `max_tokens` deliberately: adaptive thinking would eat the budget and return empty spoken turns.
- Anthropic model ids in use: `claude-sonnet-5` (vendor persona — cheap, fast), `claude-opus-4-8` (doc extraction + report narrative).
- `next.config.js` sets `serverExternalPackages: ["mongoose", "mongodb"]` — required so dev HMR doesn't recompile models into separate mongoose instances.
- Uploads are base64 JSON bodies (`bodyParser sizeLimit 12mb`), not multipart. Recordings are plain files under `public/recordings/` (gitignored), served via `/api/calls/[id]/audio`.
- Sim-call recordings contain **only the buyer's audio** (vendor turns enter as text); role-play recordings are two-sided. Transcripts are complete in both modes. This is a known, acceptable limitation — disclose it rather than hide it.
- `npm run seed` inserts a complete demo job (3 round-1 calls, a $2,850→$2,150 round-2 negotiation, generated report with valid citations). It is the on-stage fallback; it must always render perfectly through the real UI — if you change models or the report page, re-verify the seed.
