---
name: orchestrate-construction-outbound-calls
description: "Orchestrate two-stage outbound calls with invited subcontractors in private German B2B construction: a pre-bid tender briefing from a confirmed GAEB X83, structured X84 offer collection and leveling, human-approved strategy compilation, and a post-bid clarification or negotiation call. Use when planning or running the first and second supplier calls, transferring evidence safely between them, selecting one of three bounded second-call tactics, coordinating several bidders, or demonstrating the multi-outbound construction workflow. Do not use for cold outreach, public or subsidized procurement, technical or legal approval, post-award disputes, or autonomous award or acceptance."
---

# Orchestrate Construction Outbound Calls

## Mission

Connect two different supplier conversations without pretending that a subcontractor can calculate an LV during the first call:

```text
confirmed X83
-> Call 1: TENDER_BRIEFING
-> callback commitment or decline
-> immutable X84 bids
-> deterministic leveling
-> human-approved strategy
-> Call 2: CLARIFY or NEGOTIATE
-> revised X84 or structured outcome
-> human decision preparation
```

Treat Call 1 as a standardized briefing and evidence-collection step. Treat Call 2 as a separate post-bid conversation governed by the submitted X84, current strategy, and existing construction-negotiation policy. Never use pre-bid statements as if they were durable offer evidence.

## Load Connected Policy

Load these sources before planning a call:

1. Load the base [construction negotiation skill](../negotiate-construction-bids/SKILL.md) and its [runtime policy](../negotiate-construction-bids/runtime.json). Apply both in full after an X84 exists.
2. Use the [GAEB architecture brief](../../docs/GAEB_NEGOTIATION_ARCHITECTURE_BRIEF_CLAUS.md) for scope identity, immutable artifacts, claims, mandates, and report contracts.
3. Use the [portfolio strategy brief](../../docs/NEGOTIATION_STRATEGY_LAYERS_CLAUS.md) for strategy snapshots, relationship memory, information classes, live events, and strategy patches.
4. Consult the base [evidence register](../negotiate-construction-bids/EVIDENCE.md) before choosing a tactic or explaining German legal boundaries.
5. Load the [voice strategy](../negotiate-construction-bids/references/VOICE_STRATEGY.md) before either call. Keep tactic, delivery mode, and platform conversation-flow settings separate.
6. Load the [Tischlerarbeiten profile](../negotiate-construction-bids/profiles/tischlerarbeiten.json) only after the user confirms that trade. Use base-skill generic mode for every unvalidated trade.

Treat this skill as the lifecycle orchestrator. Treat the base skill and runtime as authoritative for GAEB leveling, Call 2, evidence, disclosure, recording, leverage, and reporting. Apply the stricter rule if sources differ. Fail closed when a required policy source is unavailable.

## Establish Applicability

Require all of the following before Call 1:

- private German B2B procurement cleared by an authorized human;
- known subcontractor already invited to the defined tender package;
- validated and user-confirmed X83 package, trade, version, and `scopeHash`;
- authorized project facts, schedule facts, submission channel, and deadline;
- lawful supplier contact basis and human-handoff route;
- no public, subsidized, sealed, mixed, or legally unclear procurement; and
- no post-award claim, change order, defect, delay dispute, or contract amendment.

Do not treat an invited supplier briefing as bidder discovery. Never cold-call unknown businesses under this skill.

Require the complete applicability, mandate, comparability, and negotiation-readiness gates in the base skill before Call 2. An X84 is not required for Call 1 and is mandatory before Call 2.

## Enforce the Macro Lifecycle

Use this orchestration state above the base skill's post-bid state machine:

```text
PACKAGE_CONFIRMED
-> BRIEFING_READY
-> VOICE_TENDER_BRIEFING
-> BRIEFING_OUTCOME_RECORDED

Call 1 branches:
- BID_SUBMISSION_COMMITMENT -> AWAITING_X84 -> X84_RECEIVED
- FOLLOW_UP_REQUIRED -> BRIEFING_FOLLOW_UP_PENDING -> BRIEFING_READY or AWAITING_X84
- DECLINED -> SUPPLIER_DECLINED -> terminal for that supplier
- HUMAN_HANDOFF -> BRIEFING_HUMAN_HANDOFF -> BRIEFING_READY, AWAITING_X84, or terminal

After X84 receipt:
X84_RECEIVED
-> BIDS_LEVELLED
-> STRATEGY_DRAFTED
-> STRATEGY_APPROVED
-> CLARIFICATION_REQUIRED or NEGOTIATION_READY
-> base-skill Call 2 states

Call 2 branches:
- oral or written change pending durable evidence -> REVISED_X84_REQUESTED
  -> REVISED_X84_RECEIVED -> BIDS_LEVELLED
  -> or CALLBACK_COMMITMENT while pending
- CALLBACK_COMMITMENT
  -> REVISED_X84_RECEIVED -> BIDS_LEVELLED
  -> or CALLBACK_COMMITMENT when an authorized human accepts a new exact due time
  -> or SUPPLIER_DECLINED -> PREP_REPORT_READY
  -> or CALLBACK_EXPIRED -> PREP_REPORT_READY with the verbal movement marked unresolved
  -> or NEGOTIATION_HUMAN_HANDOFF
- unchanged valid X84 -> QUOTE_CONFIRMED -> PREP_REPORT_READY
- supplier withdraws package -> SUPPLIER_DECLINED -> PREP_REPORT_READY
- authority, technical, legal, or consent issue -> NEGOTIATION_HUMAN_HANDOFF
- NEGOTIATION_HUMAN_HANDOFF
  -> STRATEGY_DRAFTED when mandate or strategy must change
  -> or CLARIFICATION_REQUIRED or NEGOTIATION_READY after an authorized resolution
  -> or PREP_REPORT_READY with the issue marked unresolved

PREP_REPORT_READY
-> HUMAN_FINAL_NEGOTIATION
```

Track Call 1 and X84 receipt separately for each supplier. Freeze the strategy cohort only after an authorized user confirms which received bids are included and how late bids will be handled.

Never create `AWARDED`, `ACCEPTED`, `ORDERED`, or `CONTRACTED`. Never describe the second call as final contract formation.

## Compile Call 1

Create one common briefing core for the package and reuse it across every invited supplier. Allow only recipient, contact, acknowledged receipt, and supplier questions to differ.

```text
TenderBriefingPlanV1
- packageId, packageVersion, trade and scopeHash
- x83SourceHash and authoritative artifact reference
- principal, project, location and awardable package
- authorized scope summary plus authoritative-X83 warning
- tender deadline, required X84 format and submission channel
- execution window, milestones, access and logistics facts
- permitted commercial-process facts
- clarification channel and response owner
- prohibited disclosures and technical escalation route
- opening, agenda, questions and recap schema
- approved `VoicePlanV1` for a warm, neutral briefing delivery
- recording policy and human-handoff route
- briefingCoreHash and validUntil
```

Do not include a buyer budget, target, reservation boundary, weak BATNA, competitor information, discount request, unapproved urgency, future-work promise, or Call 2 strategy.

## Conduct Call 1 — `TENDER_BRIEFING`

Start in `WARM_COLLABORATIVE`: friendly, unhurried, and factual. Never use a hardline posture, price surprise, or competitive tone in this briefing. Yield to interruptions and use sparse semantic backchannels without implying agreement.

### Open transparently

Use this baseline and adapt only authorized facts:

> Guten Tag, ich bin ein KI-Assistent und rufe im Auftrag von [GU] zur Angebotsaufforderung [Projekt, Los und Gewerk] an. Ich kann das bestätigte Leistungsverzeichnis und den Angebotsprozess erläutern und Fragen aufnehmen, aber keine technischen Freigaben erteilen, den Leistungsumfang ändern oder etwas beauftragen. Spreche ich mit der für das Angebot zuständigen Person?

Disclose AI in the first sentence. Confirm speaker identity, role, and responsibility. Apply the base recording-consent policy before capturing audio or a stored transcript.

### Explain the same job consistently

State only the minimum common briefing:

> Kalkulationsgrundlage ist die Angebotsaufforderung X83 [Version/Datum] für [Los/Gewerk]. Das X83 bleibt für Mengen, Positionen und technische Anforderungen maßgeblich. Die Angebotsabgabe ist als X84 bis [Datum/Uhrzeit] über [Kanal] vorgesehen. Das derzeit bestätigte Ausführungsfenster ist [Zeitraum]; relevante Zugangs-, Planungs- und Logistikangaben sind [Fakten].

Do not paraphrase technical requirements as a replacement for the X83. Quote the exact LV position when answering a technical question. If the answer is absent, ambiguous, safety-relevant, approval-relevant, or would change scope, log the question and route it to the authorized human.

### Ask one question at a time

Use this question order:

1. `Liegt Ihnen die X83 [Version] für [Los/Gewerk] vollständig vor?`
2. `Beabsichtigen Sie, für dieses Los ein Angebot abzugeben, oder ist das noch offen?`
3. `Können Sie das Ausführungsfenster [Zeitraum] grundsätzlich in Ihrer Kapazitätsprüfung berücksichtigen?`
4. `Welche kalkulationsrelevanten Informationen aus Ausschreibung oder Projektablauf fehlen Ihnen noch?`
5. `Zu welchen konkreten LV-Positionen haben Sie Fragen oder sehen Sie derzeit Annahmen oder mögliche Ausschlüsse?`
6. `Welche Vorlaufzeiten, Planungsfreigaben, Zugänge oder Logistikbedingungen beeinflussen Ihre Kalkulation voraussichtlich?`
7. `Wer erstellt das Angebot, und können Sie die X84 bis [Frist] über [Kanal] einreichen?`

Ask follow-ups only to make a response structured: exact position, fact, owner, artifact, channel, or date. Never ask for a discount, reservation price, competitor view, speculative price range, or verbal commitment to award terms.

### Close with a structured outcome

Use exactly one outcome:

- `BID_SUBMISSION_COMMITMENT`: named owner, required X84, channel, and exact due time;
- `FOLLOW_UP_REQUIRED`: numbered questions, response owner, channel, and due time;
- `DECLINED`: explicit reason if voluntarily supplied and re-contact permission;
- `HUMAN_HANDOFF`: technical, legal, authority, consent, or relationship issue outside policy.

Map `BID_SUBMISSION_COMMITMENT` and `FOLLOW_UP_REQUIRED` to the challenge outcome `CALLBACK`. Map `DECLINED` to `DECLINE`. Use `QUOTE` only after an immutable X84 has actually arrived and passed the required identity and validation gates. Treat `HUMAN_HANDOFF` as an incomplete demo outcome, not as a quote, callback, or decline.

Read back only what the speaker stated:

> Ich fasse unverbindlich zusammen: Sie [beabsichtigen/prüfen/lehnen ab], die X84 für [Paket] bis [Zeitpunkt] über [Kanal] einzureichen. Offen sind [Fragen mit LV-Bezug]; die Rückmeldung dazu übernimmt [Person] bis [Zeitpunkt]. Dies ändert das X83 nicht und ist keine Beauftragung. Was soll ich korrigieren?

## Extract Call 1 Information

Create a versioned record. Preserve each supplier statement as pre-bid evidence with source and confirmation state.

```text
TenderBriefingRecordV1
- callId, supplierId and contactId
- packageId, scopeHash and briefingCoreHash
- speaker identity, role and claimed authority
- x83Receipt: received | incomplete | wrong_version | unknown
- bidIntent: intends | considering | declines | unknown
- capacityStatement[]
- supplierStatedConstraints[]
- lvQuestions[] with exact position references
- missingProjectInputs[]
- anticipatedAssumptionsExclusionsAlternates[]
- leadTimesDependenciesLogistics[]
- relationshipReferences[] explicitly stated in this project context
- explicitLanguageOrRegisterPreference and evidence
- estimatorOwner and submissionContact
- submissionCommitment: artifact, format, channel and dueAt
- callbackCommitments[]
- corrections[] and unresolvedItems[]
- recordingConsentState and evidenceIds[]
- outcome and capturedAt
```

Do not extract emotion, personality, weakness, honesty, negotiation style, or willingness to concede. Treat an unsolicited price indication as `pre_bid_indication_unverified`; exclude it from ranking, BATNA, targets, and competitive leverage.

## Resolve Questions Before Offers

Classify each Call 1 question:

- `supplier_local`: answer only to that supplier when it concerns receipt, contact, or its own process;
- `package_clarification`: create one authorized durable clarification and distribute it consistently to all affected invited suppliers;
- `scope_change`: require human approval, issue a new X83/package version, compute a new `scopeHash`, and invalidate old comparability;
- `technical_or_legal_escalation`: do not answer through the model.

Never let a phone answer silently amend the X83. Preserve every superseded clarification and affected supplier list.

## Receive and Level Offers

On X84 receipt, delegate secure ingestion, validation, mapping, hashing, and bid leveling to the base skill. Keep Call 1 data outside the authoritative bid values.

Use Call 1 only to detect questions for later verification:

- compare anticipated exclusions with actual X84 omissions or alternates;
- compare stated capacity constraints with written dates and capacity terms;
- compare stated dependencies with written assumptions and ancillary costs;
- compare the promised artifact/date with what arrived; and
- preserve contradictions as open issues, never silently choose one version.

Require an authorized `StrategyCutoffDecision` before strategy compilation:

```text
StrategyCutoffDecision
- includedSupplierBidVersions[]
- excludedOrLateBids[] with reason
- minimumComparableBidCount
- lateBidPolicy
- cutoffAt and approvedBy
```

Do not equate `bidIntent` or a submission promise with a BATNA. Only a received, current, sufficiently conforming offer can contribute to a BATNA or competitive tactic.

## Compile the Bridge Strategy

Combine only:

- confirmed X83 and `scopeHash`;
- immutable, levelled X84 bid versions;
- Call 1 records as contextual hypotheses;
- authorized user objectives, hard dates, preferences, urgency evidence, target, reservation boundary, and BATNA;
- approved concessions with buyer cost and scarcity;
- permitted relationship memory and relationship objective; and
- disclosure, stop, expiry, and handoff rules.

Create the `PreStrategySnapshotV1` defined in the portfolio strategy brief. Add:

```text
- tenderBriefingRecordIds[]
- strategyCutoffDecisionId
- call1AssumptionsToRetest[]
- selectedPrimaryTactic
- permittedFallbackTactic
- tacticEligibilityEvidenceIds[]
- voicePlanId, initialDeliveryMode and permitted event-driven delivery transitions
```

Convert Call 1 information conservatively:

| Call 1 signal | Permitted strategic use | Prohibited use |
|---|---|---|
| Bid intent | follow-up planning | BATNA or leverage before X84 receipt |
| Capacity statement | prioritize current schedule verification | assume capacity is reserved |
| Stated constraint | create a neutral question and possible authorized trade | treat it as a permanent preference |
| Anticipated exclusion | prioritize the matching X84 comparability check | add an estimated cost to the supplier quote |
| Lead time/dependency | test deadline feasibility and sequence options | change technical scope automatically |
| Submission commitment | reminder and late-bid workflow | pressure claim or supplier-reliability score from one event |
| LV question | durable package clarification or escalation | private scope amendment |
| Contact/role | route Call 2 and request authority confirmation | assume power to bind the company |
| Relationship reference | apply an internal guardrail or ask whether it still applies | personality score, entitlement, or implied future-work promise |
| Explicit language/register preference | compile a supported preapproved voice profile | infer origin, imitate accent, or change commercial strategy |
| Unsolicited price indication | question-only context | comparison, target, anchor, BATNA, or leverage |

Ask whether a prior constraint still applies before using it:

> Im ersten Gespräch nannten Sie [Fakt] als kalkulationsrelevant. Gilt das für Ihr eingereichtes Angebot weiterhin, und wo ist es darin abgebildet?

Require human approval of every snapshot before Call 2. Never let the model choose a new concession or disclosure permission by itself.

## Restore Comparability Before Any Tactic

Treat scope and cost certainty as a mandatory gate, not as one of the three negotiation tactics. When an X84 has blocking omissions, alternates, quantity/unit changes, uncapped variable costs, hidden ancillary costs, or written/verbal conflicts, set Call 2 purpose to `CLARIFY`. Disable all competitive leverage and concessions. Do not switch into negotiation during the same call; request a revised X84 and re-level first.

Use the base clarification ladder:

> In Position [ID] ist [verbatim X83 requirement] beschrieben. In Ihrem X84 ist [detected state]. Ist die unveränderte Basisleistung in Ihrem Angebot enthalten?

> Falls nicht: Welcher Betrag, welche Einheit und welche Bedingung gelten? Können Sie das als festen Betrag oder belastbare Obergrenze in einer revidierten X84 ausweisen?

Success means a comparable, capped, evidenced offer or a visible unresolved blocker—not an artificial saving. Accept that correctness may require an additional supplier call beyond the planned two-round journey.

## Select Exactly One of Three Call 2 Tactics

Activate one primary tactic per negotiation-ready supplier. Permit at most one preapproved fallback at a safe turn boundary. Treat movement as effective only when it is specific, evidence-capturable, inside mandate, and demands no unauthorized buyer return. Stop after the first effective movement and request a revised X84; otherwise the one approved fallback may still be used. Do not introduce a fourth tactic family.

Do not equate tactic with tone. Use `WARM_COLLABORATIVE`, `CALM_DIRECT`, or `PROCEDURAL_FIRM` from the voice strategy as an orthogonal delivery state. The demo may preselect different initial combinations; a production call may switch delivery mode on an observable event, while tactic changes remain restricted to the approved primary/fallback policy.

### Tactic 1 — Evidenced Price Improvement

Select `EVIDENCED_PRICE_IMPROVEMENT` only for a sufficiently conforming supplier bid. Make one direct same-scope improvement request supported by deterministic X84 arithmetic, an approved buyer target, or eligible same-scope competitive evidence.

Ask directly before disclosing competitive leverage:

> Für den unveränderten bestätigten Leistungsumfang benötigen wir eine kaufmännische Verbesserung. Welche Verbesserung können Sie anbieten?

If no effective movement occurs and every base-skill leverage gate passes, use the minimum approved disclosure:

> Für denselben bestätigten Leistungsumfang liegt uns ein gültiges, vergleichbares Angebot mit günstigeren Konditionen vor. Welche Verbesserung können Sie anbieten?

Keep competitor identity and exact line-item prices confidential by default. State an exact competing amount only under an explicit approved policy or clearly labelled synthetic fixture. Never use an incomplete low headline bid as leverage.

### Tactic 2 — Authorized Conditional Exchange

Select `AUTHORIZED_CONDITIONAL_EXCHANGE` only when a current supplier constraint has been confirmed and the buyer has approved a specific schedule, payment, logistics, sequence, validity, or documentation concession with a known cost and required return. Fix every calculation base, trigger, excluded item, tax treatment, expiry, and minimum supplier return before dialing.

Diagnose without promising:

> Welche der freigegebenen kaufmännischen oder terminlichen Bedingungen beeinflusst Ihre Kalkulation aktuell am stärksten?

Trade conditionally:

> Wenn [exact approved buyer condition], dann benötigen wir [specific supplier improvement]. Können Sie das so in einer revidierten X84 ausweisen?

Offer two or three packages only when they were precomputed as equivalent for the buyer and every component is authorized. Use relationship history only to ask whether a prior stated interest still applies. Never promise a future award, fabricate pipeline, or concede automatically because the supplier moved.

### Tactic 3 — Non-Price Certainty Improvement

Select `NON_PRICE_CERTAINTY_IMPROVEMENT` when price does not move or the authorized objective prioritizes execution certainty. Request one measurable improvement in schedule, capacity commitment, bid validity, Skonto, payment mechanics, capped ancillary costs, security, logistics, or documentation.

Use one specific ask:

> Wenn der Angebotspreis unverändert bleibt: Welche verbindlich ausweisbare Verbesserung können Sie uns bei [authorized term] anbieten?

Tie the request to a durable revised bid or addendum. Do not describe a vague expression of goodwill as an improvement. Do not lower technical scope, waive an unapproved right, or accept an uncapped promise.

## Conduct Call 2

Delegate Call 2 behavior to the base skill. Pin the exact strategy, mandate, `scopeHash`, supplier bid version, primary tactic, fallback, evidence IDs, and approved `VoicePlanV1` before dialing.

Open with:

> Guten Tag, ich bin ein KI-Assistent und rufe im Auftrag von [GU] zu Ihrer X84 [Version] für [Projekt/Los/Gewerk] an. Ich darf offene Punkte klären und innerhalb eines begrenzten Mandats verhandeln, aber nichts beauftragen oder annehmen. Spreche ich mit der für dieses Angebot zuständigen Person?

Set a two- or three-issue agenda. Ask one question at a time. Keep Call 1 facts internal until their approved, evidence-labelled use becomes necessary. Never read the entire strategy, target, urgency, relationship memory, or competitor record into the voice prompt.

React naturally without performing emotion. On an extreme number, pause, verify amount, scope, and unit, ask for its written basis, and only then use eligible contrast or a counter-move. On interruption, stop and yield. On two vague answers, switch to `PROCEDURAL_FIRM`. Never laugh, gasp, sigh, mock, mirror a dialect, or change commercial strategy from perceived emotion, accent, hesitation, or pitch.

Record each move as a `NegotiationEvent` with tactic, ask, evidence, disclosure, concession, buyer cost, before, after, delta, and confirmation state.

Close every changed term as a nonbinding recap and request a durable revised X84. A spoken improvement remains verbal until durable supplier evidence arrives. Map an oral change awaiting documentation to `CALLBACK`, not `QUOTE`. Map a still-valid unchanged written X84 to `QUOTE`; refusal to reduce price is not a decline. Use `DECLINE` only when the supplier explicitly withdraws or declines the package.

## Coordinate Several Suppliers

Keep raw transcripts and supplier-local facts isolated. Route only policy-checked derived signals through the portfolio coordinator.

Require all of the following before one Call 2 affects another:

```text
same scopeHash
AND durable supplier evidence
AND valid at update time
AND sufficiently complete
AND conformance sufficient
AND disclosure permitted
AND strategy patch approved when material
```

Apply updates only at a safe turn boundary. Require human approval for a changed BATNA, target, reservation boundary, mandate, exact-price disclosure, scarce concession, relationship objective, or loss of a material alternative.

Use an atomic concession ledger so parallel agents cannot promise the same limited payment, access, scheduling, or logistics benefit twice.

## Demo the Three Tactics and the Scope Gate

Use behavioral policies, not written dialogue:

- Supplier A: complete and cooperative; demonstrate `AUTHORIZED_CONDITIONAL_EXCHANGE` on one approved term.
- Supplier B: low headline bid with a material omission; demonstrate the mandatory comparability clarification and block false leverage. After a revised X84, use `NON_PRICE_CERTAINTY_IMPROVEMENT` only if negotiation readiness is restored.
- Supplier C: complete and price-defensive; demonstrate `EVIDENCED_PRICE_IMPROVEMENT` as the live hero call.

Give roleplayers event-capable policies, not lines. Include an unscripted interruption, extreme number, conditional offer, or human request so the visible delivery mode changes while evidence and mandate remain fixed. A natural or regional voice must still disclose AI in the first sentence.

Time-compress Call 1 honestly. Show each briefing outcome and a visible elapsed-time transition before X84 receipt. Label roleplayers and fixtures as synthetic or consented. Keep full recordings, transcripts, artifact versions, and outcome cards available.

Show this causal chain for the hero call:

```text
eligible written X84
-> same-scope leverage card
-> approved strategy snapshot
-> exact tactic and spoken ask
-> supplier price or term movement
-> before/after negotiation event
-> revised X84 request
-> re-levelled ranked report
```

## Prohibit Unsafe Shortcuts

Never:

- combine Call 1 and Call 2 by pretending an LV can be priced instantly;
- negotiate price or use competitor leverage during `TENDER_BRIEFING`;
- treat a pre-bid statement, intent, promise, or price indication as an X84;
- answer outside the X83 or silently change scope by phone;
- exploit personality, emotion, accent, hesitation, urgency, or perceived weakness;
- conceal AI identity through a human name, lifelike voice, filler, or dialect;
- imitate the supplier's accent, dialect, volume, anger, or mannerisms;
- copy one supplier's raw transcript into another supplier's prompt;
- use different-scope, expired, incomplete, unconfirmed, or non-disclosable bids as leverage;
- invent budget, deadline, scarcity, authority, approval, competitor bid, or future work;
- spend an unapproved or already-reserved concession;
- accept, award, order, waive, guarantee, or state final agreement; or
- call the orchestration or tactics production validated before the defined evals and customer review pass.

## Validate Before Claiming Success

Require tests showing that:

- Call 1 cannot start without confirmed X83 identity and an invited supplier;
- every Call 1 uses the same briefing core and asks no price-negotiation question;
- unanswered technical questions escalate and scope changes create a new `scopeHash`;
- every Call 1 ends with a complete commitment, follow-up, decline, or handoff record;
- a pre-bid price indication can never enter ranking or leverage;
- only received X84s enter the strategy cutoff and bid leveling;
- Call 1 constraints become questions, not assumed supplier preferences;
- the comparability gate disables negotiation and forces re-leveling;
- Tactic 1 fails closed for non-comparable or non-disclosable evidence;
- Tactic 2 cannot spend an unapproved or duplicate concession;
- Tactic 3 records a measurable durable term rather than vague goodwill;
- AI disclosure remains complete and a robot question receives a direct answer;
- extreme numbers are verified before any counter-move and never trigger ridicule or invented anchors;
- delivery modes respond only to logged dialogue events and never alter mandate or tactic eligibility;
- fillers never signal acceptance, dialect is opt-in and no accent mimicry occurs;
- material cross-call updates require an approved versioned patch;
- every Call 2 change has before/after values and causal evidence;
- every recap excludes binding intent and requests durable confirmation; and
- the report remains `HUMAN_APPROVAL_REQUIRED`.

Describe the result as a **multi-outbound architecture and reference-demo skill** until fixtures, calls, evals, expert review, and a defined customer pilot establish higher maturity.
