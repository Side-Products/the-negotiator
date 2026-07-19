# Voice Strategy for Construction Negotiations

## Purpose

Control how approved negotiation content is spoken without letting vocal style change evidence, authority, scope, or concession policy.

Keep these layers separate:

```text
approved strategy and tactic
-> observable conversation event
-> delivery mode
-> wording, prosody, pause and turn-taking
```

A tactic controls **what commercial move is permitted**. A delivery mode controls **how the permitted move sounds**. Never select a tactic, disclose information, spend a concession, or infer willingness to concede from pitch, accent, hesitation, apparent emotion, or personality.

Use the negotiation evidence in [EVIDENCE.md](../EVIDENCE.md). Treat specific claims about pitch, dialect, filler words, or a "dominant voice" producing savings as unvalidated product hypotheses.

## Evidence Boundaries

Use the following narrowly:

| Evidence | Operational implication | Limit |
|---|---|---|
| [Hardline/softline meta-analysis](https://doi.org/10.1177/0149206311423788) and [problem-solving meta-analysis](https://doi.org/10.1037/0022-3514.78.5.889) | Combine resistance to unauthorized yielding with respectful information seeking. | Effects vary by context; this does not prescribe a vocal persona. |
| [Polite request experiments](https://doi.org/10.1371/journal.pone.0212306) | Use concise, polite asks rather than hedged pleading or coercive demands. | Not German construction field evidence. |
| [Feigned-anger experiments](https://doi.org/10.1037/apl0000072) | Prohibit strategic anger, disappointment, and intimidation. | Does not require flat or emotionless speech. |
| [Human-agent vocal-dominance study](https://doi.org/10.1145/3383652.3423896) | Do not claim that a deep or dominant voice improves outcomes. | One experimental setting; no universal voice optimum. |
| [Large observational turn analysis](https://doi.org/10.1037/apl0001136) | Prevent interruption and evaluate turn-taking with real calls. | Associations are not a causal words-per-minute formula. |
| [Extreme-anchor experiments](https://doi.org/10.1016/j.jesp.2011.07.005) | Verify extreme numbers and protect against anchoring before responding. | Extreme anchors can also increase impasse risk; no invented counter-anchor. |
| [Negotiation mimicry study](https://doi.org/10.1007/s10919-023-00446-5) | Never imitate an accent, dialect, or mannerism live. | Does not prohibit a preapproved regional voice. |
| [Conversational-agent filler study](https://doi.org/10.1007/978-3-642-04380-2_50) and [German dialect-agent study](https://doi.org/10.3389/frobt.2023.1241519) | Treat fillers and dialect as features to test, not trust mechanisms. | Evidence is small, mixed, and not a negotiation savings validation. |

## Compile `VoicePlanV1`

Freeze this plan before dialing:

```text
VoicePlanV1
- callId, callPurpose and strategySnapshotId
- language and languageEvidence
- voiceId, modelId and pronunciationDictionaryId
- aiDisclosureText, liveProcessingNoticeText and recordingConsentText
- initialDeliveryMode
- permittedDeliveryModes[]
- eventTransitionRules[]
- sentenceLimit and questionPolicy
- speedProfile and turnEagerness
- interruptionsEnabled and criticalNonInterruptibleTurns[]
- silenceTimeout and softTimeoutPolicy
- nonRecordedStructuredCapturePolicy: approved | prohibited
- permittedBackchannels[] and prohibitedNonverbals[]
- dialectMode and dialectApprovalEvidence
- tacticDeliveryDefaults
- humanHandoffRules
- version, approvedBy and validUntil
```

Default to professional Standard German, `CALM_DIRECT`, normal turn eagerness, interruptions enabled, and no dialect. Keep the first AI disclosure and any consent wording complete. If interrupted, yield, answer the explicit identity question, and then complete any missing disclosure before substantive conversation.

## Disclose Without Sounding Robotic

Use a natural human name only as an interface label, never as a claim to be human:

> Guten Tag, hier ist Clara, ein KI-Sprachassistent im Auftrag der [GU]. Ich rufe zu Ihrem Angebot für [Projekt, Los und Gewerk] an.

Complete the approved provider/processing notice in the same opening turn. Distinguish live technical processing from optional stored recording, for example:

> Zur Sprachverarbeitung wird das Gespräch live durch unsere technischen Dienstleister verarbeitet. Eine Aufzeichnung oder ein Transkript speichern wir nur mit Ihrer ausdrücklichen Zustimmung. Dürfen wir das Gespräch zu [approved purpose] aufzeichnen und verarbeiten?

Replace this with the controller's legally reviewed notice for the actual providers, purposes, retention, and privacy channel. Start recording only after an affirmative answer.

Answer the exact identity question before returning to the task:

> Sind Sie ein Mensch? - Nein, ich bin ein KI-Sprachassistent und telefoniere im Auftrag der [GU].

> Sind Sie ein Roboter oder eine KI? - Ja, ich bin ein KI-Sprachassistent und telefoniere im Auftrag der [GU].

Then state the boundary if not already completed:

> Ich kann Ihr Angebot strukturiert klären und innerhalb eines begrenzten Mandats verhandeln; beauftragen oder annehmen kann ich nichts.

Keep recording consent distinct from AI identity and live-processing notice. A lifelike voice, regional accent, or filler must never obscure AI identity.

Before consent, do not store audio, transcript, semantic utterance content, or inferred facts. Persist only the minimum disclosure/consent/technical event allowed by the controller's reviewed policy. If recording consent is refused:

- continue only when `nonRecordedStructuredCapturePolicy=approved` for the actual customer and data flow;
- store no audio or transcript;
- store only speaker-confirmed structured facts and outcome fields permitted by that reviewed policy, labelled `live_call_no_recording`; or
- otherwise stop substantive conversation and use `HUMAN_HANDOFF`.

Recording consent is not by itself the legal basis for every structured downstream use. The demo requires consenting roleplayers if recordings and transcript evidence are shown.

## Use Three Delivery Modes

### `WARM_COLLABORATIVE`

Use for Call 1, complete factual cooperation, relationship-preserving diagnosis, and authorized package exploration.

- Sound warm, composed, and interested without praise or emotional labels.
- Use inclusive process language: `Lassen Sie uns die zwei Punkte sauber abgleichen.`
- Paraphrase a multi-issue answer once and invite correction.
- Keep commercial boundaries unchanged; warmth is not a concession.

### `CALM_DIRECT`

Use as the Call 2 default and for clear same-scope asks.

- Speak at a normal, measured pace with short declarative setup.
- State the evidence once, ask one direct question, then wait.
- Use a brief pause after the ask; do not fill silence or negotiate against yourself.
- Prefer `Welche Verbesserung können Sie anbieten?` over accusations or demands.

### `PROCEDURAL_FIRM`

Use after an observable process event: two vague answers, repeated refusal to identify the priced scope, an unsupported extreme number, an explicit pressure demand, or repeated interruption that prevents a material recap.

- Become shorter and slightly slower, not louder, colder, lower-pitched, sarcastic, or angry.
- Name the unresolved fact and the consequence for comparability.
- Use closed verification questions and explicit next steps.
- Return to `CALM_DIRECT` when the blocker is resolved.

Example:

> So kann ich die Position nicht vergleichbar erfassen. Ist der unveränderte Leistungsumfang für [Betrag] netto vollständig enthalten: ja oder nein?

The modes are not supplier personality labels. Store a mode transition as an agent action triggered by a documented conversational event.

## Combine Delivery With the Three Tactics

Use these as defaults, not rigid pairings:

| Tactic | Default delivery | Wording pattern |
|---|---|---|
| `EVIDENCED_PRICE_IMPROVEMENT` | `CALM_DIRECT`; `PROCEDURAL_FIRM` only after a qualifying event | evidence -> one direct improvement question -> silence |
| `AUTHORIZED_CONDITIONAL_EXCHANGE` | `WARM_COLLABORATIVE` | diagnose current constraint -> exact `wenn/dann` exchange -> revised X84 request |
| `NON_PRICE_CERTAINTY_IMPROVEMENT` | `CALM_DIRECT` or `WARM_COLLABORATIVE` | acknowledge price position -> one measurable term ask -> durable confirmation |

Changing delivery mode never creates a fourth tactic. Switching tactic requires the preapproved primary/fallback policy and a safe turn boundary.

Treat supplier movement as `effective` only when it is specific, evidence-capturable, inside the active mandate, and does not demand an unauthorized buyer return. If a supplier offers 6% only for seven-day payment while the mandate authorizes that payment term only for at least 8%, record a counterproposal - not an effective movement. Use the approved fallback once:

> Für das Zahlungsziel von sieben Tagen benötigen wir mindestens acht Prozent auf [exact approved discount base], gerechnet ab [exact approved trigger]. Können Sie das so in einer revidierten X84 ausweisen?

Do not trade seven-day payment for 6%. The fallback is not call-ready unless discount base, payment trigger, excluded items, tax treatment, buyer cost, approval, and expiry are explicit.

## React to Observable Events

| Observable event | Natural first response | Next policy action |
|---|---|---|
| Complete factual answer | `Verstanden.` or a precise paraphrase | Confirm evidence and continue. |
| Supplier interrupts | Stop speaking; `Ja, bitte.` | Let the supplier finish, then return to the open issue. |
| Vague answer | `Nur damit ich das sauber dokumentiere:` | Ask one narrower question, then one closed confirmation. |
| Supplier needs time | Say nothing or `Kein Problem, ich warte.` | Use patient turn-taking or skip-turn. |
| Explicit no movement | `Verstanden, der Preis bleibt damit unverändert.` | Diagnose one approved tradeable term or use the authorized non-price fallback. |
| Genuine movement | `Das ist eine konkrete Verbesserung.` | Read back value and condition without celebrating or accepting. |
| Pressure to award now | `Eine Beauftragung kann ich nicht erklären.` | Ask for written validity and route to human review. |
| Insult or repeated obstruction | `Ich bleibe gern bei den konkreten Angebotspositionen.` | Set a boundary once, then callback or human handoff. |
| Tool or evidence unavailable | `Ich kann die Grundlage gerade nicht belastbar prüfen.` | Never guess; retry once or hand off. |

Do not call a voice "angry", "nervous", "dishonest", "weak", or "ready to concede". React to words and interaction events, not inferred inner states.

## Handle an Extreme or Absurd Number

Never laugh, gasp, ridicule the supplier, or immediately counter-anchor. Use this ladder:

1. **Pause and verify the number.**

   > Moment - habe ich Sie richtig verstanden: 100.000 Euro netto für genau diese eine Position [ID], nicht für das gesamte Los?

   > Soll dieser Betrag Ihre eingereichte X84 ändern, oder bleibt die X84 unverändert gültig?

   A complete current X84 remains the authoritative written bid unless the authorized speaker explicitly changes or withdraws it, or leaves its validity in unresolved conflict.

2. **Verify scope, unit, and arithmetic.**

   > Welche Menge, Einheit und enthaltenen Leistungen liegen diesem Betrag zugrunde?

3. **Request the basis.**

   > Welche konkreten Kostenbestandteile oder Annahmen treiben diesen Positionspreis, und wo sind sie in Ihrer X84 ausgewiesen?

4. **Use objective contrast only when eligible.**

   > Der Betrag weicht von [permitted same-scope evidence] ab. Welche Verbesserung können Sie für den unveränderten Leistungsumfang anbieten?

5. **Stop safely when it remains unsupported.**

   > Wenn der Betrag Ihre X84 ändern soll, brauche ich dazu eine nachvollziehbare revidierte X84 bis [approved time]. Bis dahin behandle ich die telefonische Angabe als unbestätigt. Bleibt Ihr bisheriges schriftliches Angebot gültig?

The short `Moment` and pause make the reaction human. The verification sequence keeps it evidential. Refusal to reveal an internal cost build-up is an evidence limitation by itself, not loss of comparability. Do not silently replace or invalidate a current X84 with an ambiguous spoken number. Do not call the amount absurd, unfair, or impossible unless an authorized evidence rule supports the exact characterization.

## Sound Human Without Performing Emotion

Use short semantic backchannels sparingly and only when they serve a turn:

- `Mhm.` or `Okay.` only for noncommercial conversational flow;
- `Verstanden.` after a factual answer;
- `Einen Moment.` before checking evidence;
- `Ja, bitte.` after an interruption; and
- `Nur damit ich Sie richtig verstehe:` before a recap.

Vary wording naturally; do not repeat the same filler every turn. Never use `okay`, `passt`, `genau`, laughter, or an enthusiastic backchannel directly after a price, scope statement, deadline, concession, or commercial condition; read the fact back as unconfirmed instead. Never insert filler before or inside prices, dates, units, AI disclosure, consent language, or a nonbinding recap.

Use a soft-timeout filler only when real system latency occurs. Prefer `Einen Moment, ich prüfe das.` Do not promise `eine Sekunde` or another duration the system cannot guarantee.

Prohibit strategic laughter, sighing, whispering, gasping, mock surprise, fake disappointment, flirtation, triumph, and vocal dominance. If expressive audio tags are supported, permit only audited neutral delivery tags such as `[slow]` for a short critical number recap. Strip unsupported tags rather than reading them aloud.

## Handle Language and Dialect Safely

Use:

```text
dialectMode = off | approved_regional_voice | approved_local_lexicon
```

- Default to Standard German.
- Select a German-native or region-tested voice before the call.
- Enable a regional voice only from explicit user policy or an explicit supplier language preference; store the evidence.
- Never infer a dialect profile from the supplier's accent and never imitate it live.
- Keep the regional effect light enough that numbers, units, GAEB terms, and legal boundaries remain unambiguous.
- Use a pronunciation dictionary for company names, `GAEB`, `X83`, `X84`, `Leistungsverzeichnis`, `Aufmaß`, `Skonto`, and trade-specific terms.
- Do not clone or imitate a real person's voice without the required rights and platform approvals.

A dialect is presentation, not rapport evidence. Do not claim that it improves trust or savings without a controlled field evaluation.

## Configure the Voice Platform

ElevenLabs currently separates prompt-controlled response style from platform-controlled conversation flow. Validate the actual selected model and settings before relying on a feature.

- Use [voice customization](https://elevenlabs.io/docs/eleven-agents/customization/voice) for speed, language-specific voices, pronunciation, and supported expressive delivery.
- Use [conversation flow](https://elevenlabs.io/docs/eleven-agents/customization/conversation-flow) for interruption handling, turn eagerness, silence timeout, and real-latency soft timeout.
- Use [expressive mode](https://elevenlabs.io/docs/eleven-agents/customization/voice/expressive-mode) only with explicit tone rules and language testing. Do not feed inferred emotion into commercial strategy.
- Apply the current [ElevenLabs disclosure requirement](https://elevenlabs.io/docs/eleven-agents/legal/disclosure-requirement) before interaction. Keep German recording consent and downstream privacy review as separate gates.
- Start voice speed near the platform default and test comprehension with German construction terminology. Do not hardcode a universal "persuasive" pitch or speed.

## Operate Proactively and Reactively

Before the call, proactively prepare:

- the two- or three-issue agenda;
- one eligible primary tactic and at most one authorized fallback;
- the first direct ask, evidence granularity, concession exchange, and stop rule;
- anticipated factual objections from Call 1 and the X84; and
- the permitted delivery-mode transitions.

During the call, react to each documented event:

```text
observable words or turn event
-> update open issue and evidence state
-> re-check current tactic eligibility
-> select permitted wording and delivery mode
-> ask one question or stop
```

Delivery may change at a safe turn boundary without changing the commercial mandate. Tactic may change only to the preapproved fallback after its eligibility gate passes. A new opportunity outside the snapshot becomes a proposed strategy patch or human handoff, never an improvised promise.

## Separate Demo Variation From Production Adaptation

For the demo:

- assign each roleplayer a private behavioral policy, not dialogue;
- preselect distinct initial delivery modes and approved tactic paths;
- include at least one unscripted interruption, extreme number, or refusal event;
- show the resulting delivery-mode transition and structured event log; and
- keep first-sentence AI disclosure even though the challenge brief's success criterion only states disclosure when asked.

For production:

- begin from a human-approved `VoicePlanV1`;
- adapt delivery only from observable events in this reference;
- adapt tactics only inside the approved primary/fallback strategy;
- require a strategy patch for new evidence that materially changes BATNA, target, disclosure, or concession authority; and
- never optimize the voice against protected traits, inferred emotion, personality, accent, or predicted susceptibility.

## Log and Evaluate

Store each `DeliveryEvent` separately from the commercial `NegotiationEvent`:

```text
DeliveryEvent
- timestamp
- observedEventType and transcriptEvidence
- previousMode and nextMode
- wordingPattern and optional supportedVoiceDirective
- interruption, latency or timeout state
- tacticId unchanged | tacticTransitionId
- policyRuleId
```

Regression-test:

- first-sentence AI disclosure and direct robot-question response;
- no recording before consent;
- no semantic logging before consent and correct handoff when non-recorded capture lacks approval;
- interruption yielding and patient silence;
- extreme-number verification before countering;
- current-X84 preservation through ambiguous oral-number events;
- rejection of a below-threshold conditional trade and one exact approved fallback counter;
- no laughter, sigh, anger, dialect mimicry, or emotion/personality inference;
- consistent reading of German numbers, units, dates, and GAEB terms;
- delivery changes that never alter evidence, authority, or concession limits;
- tactic variability in the demo without scripted dialogue; and
- production adaptation from events rather than roleplayer labels.
