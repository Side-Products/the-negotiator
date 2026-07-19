# Remaining work

Gap analysis vs the challenge brief, as of Sunday July 19, 2026. The build is ~90% complete and live-verified; what remains is mostly verification, demo choreography, and one deliberate audio gap. Ordered by priority.

## 1. Full end-to-end run as a human (BLOCKER for demo, ~30 min, needs a voice)

Nobody has run the connected loop once. Do: voice intake -> confirm spec -> Start calls (20 vendors) -> answer one role-play call by mic -> Negotiate round 2 -> Generate report. This single run verifies three unproven things at once:

- [ ] The continuous loop through the real UI (every stage is individually tested, the chain is not)
- [ ] Round 2 live (rewritten for the batch world: auto-targets the priciest clean vendor, runs server-side; untested since the rewrite)
- [ ] Red-team moments, captured for the demo: ask the buyer "am I talking to a robot?" mid-call; try to bait it into citing a fake competing bid (it physically cannot; get it on record)

Keep this job in the DB afterwards. It is your second fallback next to the seeded one.

## 2. Audio story (RESOLVED Sunday July 19)

- [x] "+ Live agent-vs-agent call" button on mission control: the buyer agent negotiates out loud with an AI vendor persona spoken in its own TTS voice (rotates through the policy cards on repeated calls). This is the brief's option 3 made audible; the batch engine remains the at-scale simulated market.
- [ ] Rehearse it once and pick which persona to demo live

## 3. Doc intake live test (~5 min)

- [ ] Upload one real room photo and one quote PDF through /jobs/new
- [ ] Check extracted fields merge into the spec (PDFs auto-route to Anthropic, images use OpenAI)

## 4. Eval checklist / golden calls (brief hint, ~1 h)

Nothing exists. A small script that takes a finished jobId and asserts: spec version identical on every call, every committed quote has >= 3 itemised lines, lowball quote carries the 30% flag, disclosure turn present when asked, every call has a structured outcome, all report citations resolve to real transcript turns. Print pass/fail per check. Reads as rigor to judges.

- [ ] Write `src/scripts/evalJob.js` + `npm run eval`
- [ ] Run it against the end-to-end job from item 1

## 5. Demo prep (~2 h, mostly non-engineering)

- [ ] Re-seed the fallback job (`npm run seed`) and click through /jobs/[id] + report; the current seed predates several schema changes (batch, placeId, phone)
- [ ] Write the 5-minute demo script with the four conversation-requirement callouts (disclosure, friction, honesty line, structured endings); the brief explicitly says to highlight them
- [ ] Rehearse the fallback drill: any voice failure > 20s -> switch to the seeded job in the same UI
- [ ] Record the demo video
- [ ] Capture backup recordings of the role-play call

## 6. Real phone calls activation (ACTIVATED Sunday July 19; final steps below)

Code is complete and capped at 5 sequential calls.

- [x] Phone number attached: +1 908 386 5713 (Twilio, `phnum_2601...pds9` in `.env.local`)
- [x] Public URL: falls back to `PUBLIC_BASE_URL` (the ngrok tunnel); buyer agent switched to WEBHOOK tool mode against it
- [x] `npm run create-agents` re-run in webhook mode
- [ ] RESTART the dev server (it booted before the phone-number env var existed)
- [ ] First test call to YOUR OWN phone (verifies webhooks, recording, transcript before dialing businesses):
      `curl -X POST localhost:3001/api/jobs/<confirmedJobId>/real-calls -H 'Content-Type: application/json' -d '{"testNumber":"+1XXXXXXXXXX"}'`
- [ ] Legal check before dialing businesses: recording consent rules for the businesses' location (Germany requires all-party consent; SC/NC are one-party). Only call with genuine quote intent, per the brief
- NOTE: the ngrok URL changes when the tunnel restarts; re-run `npm run create-agents` after any tunnel restart or the agent's tools point at a dead URL. Role-play browser calls also use the webhook tools now, so the tunnel must be up for them too

## 7. Production deployment (teammate track)

- [ ] Deploy (note: batch runner and real-call poller run in the server process; a serverless host kills them. Use a persistent Node host, or accept the resume-on-repost recovery)
- [ ] Set all env vars in prod; `PUBLIC_BASE_URL` (WhatsApp) and `PUBLIC_URL` (agent webhooks) must both be the prod domain
- [ ] Update the Twilio WhatsApp webhook URL to the prod domain
- [ ] Add the four GitHub Actions secrets so CI updates agents on merge: `ELEVENLABS_API_KEY`, both agent IDs, `PUBLIC_URL`

## 8. Commit and push (do this FIRST, 2 min)

The entire application is uncommitted on local main: app, batch engine, real calls, Wasabi, WhatsApp bot, LLM adapter, CI workflow. One accident loses everything. Secrets are gitignored.

- [ ] `git add -A && git commit`
- [ ] Push to GitHub (also required for the CI workflow and team collaboration)

## Known limitations (say these in the demo, do not hide them)

- Batch sim calls: transcripts only, no audio (scale vs audio trade-off)
- Sim-call vendor personas may lie and stonewall by design; only the buyer agent is honesty-constrained
- Roughly a third of tough-persona calls end as callback/declined; that is realistic and every one is a structured outcome
- Fire-and-forget runners die on server restart; re-clicking Start calls resumes them (verified)
