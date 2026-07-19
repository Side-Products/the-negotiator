# Hack Nation Submission Schedule — Claus

- **Date:** Sunday, July 19, 2026
- **Start:** 11:37 CEST
- **Hard deadline:** 15:00 CEST
- **Internal submit deadline:** **14:45 CEST**
**Time available:** 3 hours 23 minutes

## Non-negotiable scope freeze

The submission is **Haggle: the multilingual AI locksmith negotiator**. The reference scenario is an urgent after-hours residential lockout. The demo shows one confirmed job specification, three supplier styles, truthful AI disclosure, hidden-fee detection, real quote leverage, measurable price movement, and an evidence-backed recommendation.

Do not add another vertical, a new skill loader, a new channel, a new deployment target, or a new architecture before submission. Fix only defects that block the recorded path.

## Assign four owners now

| Workstream | Owner | Backup |
|---|---|---|
| Demo flow and live calls | `[NAME]` | `[NAME]` |
| Tech video and repository | `[NAME]` | `[NAME]` |
| Team video and portal copy | `[NAME]` | `[NAME]` |
| Editing, export, upload, final submit | `[NAME]` | `[NAME]` |

One person must own final submission authority. Everyone else sends assets to that person; nobody independently changes the final portal entry.

## 11:37–11:47 — Freeze decisions and assign owners

- Fill the owner table above.
- Confirm the project name: `Haggle`.
- Confirm the spoken submission language: English.
- Confirm the exact four people displayed in the portal, or immediately verify whether more are allowed.
- Confirm one demo location and currency. Use the already implemented US-dollar Locksmith fixture unless the live build is already configured differently.
- Stop all non-blocking engineering work.
- Create one shared folder for raw recordings, final MP4 files, cover image, and team assets.

**Gate at 11:47:** one owner per workstream, one scenario, one currency, one final submitter.

## 11:47–12:17 — Prove the complete demo path

Run the exact flow once without recording pressure:

1. Start or restart the app and required services.
2. Create the Locksmith job through voice or document intake.
3. Confirm and freeze the complete job specification.
4. Run the three supplier styles:
   - transparent/cooperative;
   - teaser-price/hidden-fee;
   - premium/hardline.
5. Force the AI-disclosure moment: a supplier asks whether the caller is a real person.
6. Show the lowball price expanding into itemised fees and remaining non-guaranteed.
7. Run round two against the premium supplier with a real committed competing quote.
8. Capture measurable movement from the supplier's own opening price to its final price.
9. Generate the report and click at least one transcript citation.

Record screen and system audio during this rehearsal. It may become the fallback footage.

**Gate at 12:17:** the complete path works and the report contains three structured outcomes plus one evidenced price movement.

## 12:17–12:32 — Fix blockers only

Allowed fixes:

- broken start button or route;
- missing environment variable;
- unusable audio;
- quote not being committed;
- round-two leverage not appearing;
- report not rendering;
- disclosure or structured ending missing from the captured call.

Not allowed:

- refactors;
- design polish;
- new features;
- new integrations;
- new market research;
- rewriting the architecture.

If the live path is not stable by **12:32**, switch to the existing counter-agents, role-play mode, saved job, or recorded rehearsal. Do not spend the remaining day debugging real outbound calls.

## 12:32–13:02 — Record the 60-second Demo Video

- Record the strongest successful path in short clips, not one perfect continuous take.
- Capture: multilingual intake, confirmed spec, three supplier cards, one transparent quote, lowball fee reveal, AI disclosure, premium price movement, final ranking, and transcript citation.
- Preserve real call audio for the key moments.
- Record two takes of every essential clip.
- Keep the final video at **59 seconds or less**.

**Gate at 13:02:** all required Demo Video source clips exist and are understandable without another recording session.

## 13:02–13:22 — Record the 60-second Tech Video

Show only implemented technology:

- voice/document intake to one typed and confirmed spec;
- generic ElevenLabs agents with server-built dynamic variables;
- three Locksmith vendor policy cards;
- itemised quote tools and server-recomputed totals;
- committed quotes as the only permitted leverage;
- negotiation event with before/after values;
- report citations to transcript turns;
- brief stack view: Next.js, MongoDB, ElevenLabs, OpenAI/Anthropic.

Do not claim that `SKILL.md` files are dynamically loaded at runtime; the current counter-agent reads `src/config/verticals/locksmith.js`.

**Gate at 13:22:** complete Tech Video source recording exists.

## 13:22–13:37 — Record the 60-second Team Video

- Use the final portal team only.
- Each person says name, role, and one relevant proof point in one sentence.
- Explain why this team can build voice AI, negotiation logic, product, and go-to-market.
- End with the shared mission: reduce the penalty people pay for urgency and language barriers.
- Record one clean group take and one backup take.

**Gate at 13:37:** Team Video source recording and correct name/title spellings exist.

## 13:37–14:02 — Edit and export all three videos

Export three separate files:

```text
Haggle_Demo_60s.mp4
Haggle_Tech_60s.mp4
Haggle_Team_60s.mp4
```

For every video:

- maximum `00:59` final duration;
- MP4, H.264 video, AAC audio;
- English burned-in captions;
- readable UI crop at normal laptop size;
- no dead time, loading screens, notifications, secrets, phone numbers, or API keys;
- speech and call audio clearly audible on laptop speakers;
- keep the file below 150 MB as the conservative upload target.

**Gate at 14:02:** all three final MP4 files play locally from beginning to end.

## 14:02–14:17 — Finalise submission assets

- Project title and short description.
- Project Summary, 150–300 words if the field requests it.
- Problem, target audience, solution, USP, implementation, results/impact, and most-fun-moment fields.
- Public GitHub repository URL.
- Working live-project URL.
- Project/team cover image.
- Source ZIP created from the final submission commit, if requested.
- Dataset link, or `N/A` with a note that the demo uses synthetic vendor policy cards and generated transcripts.
- Correct team members and user IDs.

Replace every placeholder and every unverified result before upload. Never present an expected synthetic concession as a completed result unless it is visible in the recorded run.

**Gate at 14:17:** one final asset folder contains everything the submitter needs.

## 14:17–14:35 — Upload

- Upload Demo, Tech, and Team videos to their correct fields.
- Upload cover image and any requested ZIP or supporting media.
- Paste final text and URLs.
- Save after each section.
- Confirm the repository is public in a logged-out/private browser window.
- Confirm the live URL opens without local credentials.

**Gate at 14:35:** the portal contains every required asset and no upload is still processing.

## 14:35–14:45 — Independent final QA and submit

The person who did **not** perform the uploads checks:

- all three videos are present, under 60 seconds, and play with sound;
- captions are readable;
- Demo, Tech, and Team videos are not swapped;
- GitHub and live-project links work logged out;
- no secrets or personal phone numbers appear;
- project name, team names, roles, and challenge are correct;
- claims match what the recording actually proves;
- no placeholder such as `[NAME]`, `TBD`, or `[[ACTUAL_RESULT]]` remains;
- the final submit action is completed and a confirmation screenshot is saved.

**Submit no later than 14:45. Do not use the final 15 minutes for improvements.**

## 14:45–15:00 — Safety buffer only

Use this window only for failed uploads, portal errors, or confirmation recovery. If submission succeeded, stop editing and preserve:

- confirmation screenshot;
- exact submitted commit hash;
- final videos;
- final text copy;
- source ZIP;
- live URL.

## Absolute priority order if time collapses

1. Submit a working Demo Video that proves the loop and measurable negotiation.
2. Submit a clear Tech Video grounded in the implemented architecture.
3. Submit a concise Team Video with correct people and roles.
4. Make the repository public and the live URL accessible.
5. Complete every required text field and verify playback.
6. Polish visuals only if all five items above are already complete.

## One-line decision rule

At every choice, ask: **Does this improve a required submission artifact before 14:45?** If not, defer it.
