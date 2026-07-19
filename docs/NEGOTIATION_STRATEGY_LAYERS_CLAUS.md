# Portfolio Strategy Layers for Construction Negotiation — Claus

**Status:** architecture proposal; not implemented or validated

**Scope:** private German B2B, pre-award, LV-based subcontractor negotiations

**Companions:** [GAEB negotiation architecture brief](GAEB_NEGOTIATION_ARCHITECTURE_BRIEF_CLAUS.md), [multi-outbound orchestration skill](../skills/orchestrate-construction-outbound-calls/SKILL.md), and [construction negotiation skill](../skills/negotiate-construction-bids/SKILL.md)

## 1. Decision

The product should evolve from isolated voice agents into a **proof-carrying negotiation control system**. Human experience, historical GC–subcontractor relationships, project constraints, submitted bids, and current negotiation events should inform strategy without allowing one model to freely copy transcripts or confidential bidder data into another call.

The defensible wedge is:

> A pre-strategy compiler creates a bounded strategy for each supplier. A live portfolio coordinator can update several negotiations from newly confirmed evidence while preserving scope identity, mandate, confidentiality, relationship value, and human control.

The scientific literature supports preparation, target and boundary setting, multi-issue diagnosis, conditional packages, calibrated trust, structured recap, and resistance to deception. It does **not** yet prove that four live-connected AI negotiations produce better savings. Cross-negotiation adaptation is a product hypothesis that must be tested.

## 2. Architectural separation

```text
GAEB + user input + project constraints + relationship memory
                             ↓
                   Pre-Strategy Compiler
                             ↓
             approved, versioned strategy snapshots
                 ↓           ↓           ↓
             Supplier A  Supplier B  Supplier C ...
                 ↑           ↑           ↑
                  Live Portfolio Coordinator
                             ↓
              policy-checked strategy patches
```

Keep five responsibilities separate:

1. `SKILL.md` defines behavioral policy, question patterns, negotiation moves, prohibitions, and escalation rules.
2. The pre-strategy compiler combines the fixed skill with current project and user input.
3. Supplier agents receive only their approved, supplier-specific snapshot and permitted updates.
4. The portfolio coordinator evaluates cross-call events and routes the minimum permitted information.
5. An immutable event store retains provenance, confirmation state, strategy versions, and human approvals.

Dynamic strategy and relationship history must not be embedded permanently in `SKILL.md` or copied into an unrestricted prompt.

## 3. Pre-strategy layer

### 3.1 User input

The pre-call interface should request only decision-relevant information and distinguish evidence from judgment:

| Input | Required distinction | Default disclosure |
|---|---|---|
| Negotiation objective | saving, scope completeness, date, capacity, payment, validity, risk | internal |
| Dates | hard contractual milestone, dependency, preferred date, bid validity | minimum necessary |
| Urgency | verified reason, cost of delay, preference, or unsupported assertion | internal |
| Economics | aspiration, target, reservation boundary, BATNA | internal |
| Issue priorities | price, schedule, payment, logistics, reliability, relationship | internal |
| Concessions | exact permission, buyer cost, scarcity, expiry, required return | disclose only when offered |
| Project dependencies | predecessor/successor trade, float, access, release decision | factual minimum |
| Relationship objective | preserve, develop, repair, or transaction-only, selected by user | internal by default |
| Prior experience | documented fact, supplier statement, user observation, or assumption | internal by default |
| Future opportunity | verified pipeline, authorized wording, and no promise of award | prohibited unless approved |
| Stop rules | no-deal, callback, legal/technical escalation, human takeover | internal |

The system should never manufacture urgency from a close date. A hard milestone must carry its source; an unsupported user impression remains an internal assumption and may not be spoken as fact.

### 3.2 Compiled output

```text
PreStrategySnapshotV1
- strategyId, version, portfolioId
- packageId, scopeHash, supplierId, bidVersion
- mandateId, approvedBy, validFrom, validUntil
- objective and success measures
- hardConstraints[] and preferences[]
- target, reservationBoundary and BATNA
- issueUtilities[]
- prioritizedIssueCards[]
- approvedPackages[]
- approvedConcessions[] with buyer cost and scarcity
- eligibleLeverageCards[]
- relationshipObjective
- assumptionsToTest[]
- disclosureMatrix
- stopRules and humanHandoffRules
- sourceEvidenceIds[]
```

The output is immutable. Any change creates a new version and records why the old version became stale.

### 3.3 Strategy construction

The compiler should:

1. restore scope comparability before optimizing price;
2. separate hard constraints from preferences;
3. load a target, reservation boundary, and BATNA before the supplier applies pressure;
4. identify multiple issues instead of assuming a fixed price-only conflict;
5. create two or three approved multi-issue packages only when their buyer value is genuinely equivalent;
6. attach a cost and required return to every concession;
7. prioritize no more than five issues per call;
8. state which facts must be verified rather than treating history as a prediction; and
9. require human confirmation before activation.

## 4. Relationship memory for inherited GC–subcontractor relationships

Historical relationships can improve preparation, especially when a new buyer or project manager inherits an incumbent subcontractor. The memory must remain factual, contextual, expiring, and contestable.

```text
SupplierRelationshipMemoryV1
- supplierId
- priorProjects[] and trades[]
- documented delivery, quality and schedule events[]
- prior negotiated terms[]
- supplier-stated interests or constraints[]
- GC payment and commitment performance[]
- open commitments, disputes or unresolved items[]
- responsible GC relationship owner
- approved contact preferences
- source, projectContext and capturedAt
- factType: durable_fact | supplier_statement | user_observation | assumption
- confidence and expiresAt
- usage: internal_only | question_only | disclosure_allowed
```

Correct use:

> “On Project X, the supplier stated that early payment affected its calculation. Ask whether that remains relevant here.”

Incorrect use:

> “This supplier always gives a discount when pressured with early payment.”

Relationship memory may influence issue order, questions, evidence requirements, relationship-cost weighting, and human escalation. It may not become a personality profile, truth score, blacklist, automatic discount expectation, or substitute for current capacity and price evidence.

## 5. Live portfolio strategy

Every active call pins one approved `PreStrategySnapshotV1`. The live agent may collect new facts, close or reopen issues, use a preapproved package, and request a strategy update. It may not silently change targets, authority, technical scope, future-work promises, or disclosure policy.

### 5.1 Live events and patches

```text
LivePortfolioEventV1
- eventId, sourceCallId and sourceTurn
- packageId, scopeHash, supplierId
- claim, before, after and affectedIssues[]
- evidenceIds[] and confirmationState
- validFrom and expiresAt
- informationClass
- eligibleConsumers[]
- leverageEligibility
```

```text
StrategyPatchV1
- patchId
- baseStrategyVersion and portfolioVersion
- sourceEventIds[]
- proposedChanges[]
- approvedDisclosureText
- materiality
- approvalState
- effectiveAt: next_safe_turn_boundary
- expiresAt
```

The coordinator distributes derived, policy-checked signals—not raw transcripts. Each patch must explain what changed, why, from which evidence, and who approved it.

### 5.2 Three update classes

**Automatic safe update**

- mark an expired offer ineligible;
- add a confirmed clarification to the comparison;
- reprioritize the next factual question;
- remove invalid leverage;
- pause a stale call plan.

**Preauthorized update**

- activate a previously approved package;
- use an approved minimum-disclosure leverage statement;
- pivot to an approved non-price issue.

**Human approval required**

- change BATNA, target, reservation boundary, or mandate;
- reveal an exact competitor price or identity;
- consume a scarce project-wide concession;
- promise or imply future work;
- react to a material loss of alternatives;
- change the relationship objective; or
- introduce any technical alternative.

No strategy changes mid-utterance. An agent checks the current portfolio version at a safe turn boundary before every material ask or concession.

## 6. How simultaneous negotiations may affect one another

### 6.1 Same awardable package and same `scopeHash`

A confirmed offer may become competitive leverage only when it is durable, current, sufficiently complete, sufficiently conforming, and permitted by the disclosure policy. Other calls should receive the least revealing truthful statement, not the bidder's transcript, identity, or line-item details.

Example: Supplier B submits a valid written improvement. Suppliers C and D may receive an approved statement such as:

> “For the same confirmed scope, we have a valid comparable offer with more favorable commercial terms. What improvement can you offer?”

### 6.2 Different packages or trades

Different `scopeHash` values cannot provide price leverage. Cross-package events may change only shared project facts or constraints, such as access dates, predecessor completion, sequencing, available float, award timing, or the availability of a project-wide payment concession.

Example: a confirmed dry-in delay changes the earliest feasible Tischler installation date. The Tischler agent receives the updated access date and evidence, not the other trade's price or private conversation.

### 6.3 Same supplier across projects

Current and historical interactions may update supplier-specific questions and relationship risk, but statements from one project do not automatically apply to another. Reuse requires context, currency, purpose compatibility, and permission.

### 6.4 Loss or gain of a BATNA

If a bidder withdraws, the portfolio BATNA may weaken. The system must not disclose the buyer's new urgency. It should mark affected snapshots stale and request human review when the change is material.

### 6.5 Scarce concessions

Use an atomic `ConcessionLedger`. If only one supplier can receive accelerated payment, a slot, mobilization support, or another limited benefit, one agent may reserve it temporarily. Other agents cannot offer the same resource until it is released or expanded by an authorized user.

## 7. Information barriers and legal controls

Default information classes should be:

- `call_local`: available only to the originating supplier call;
- `same_scope_derived`: sanitized facts potentially available to the comparable cohort;
- `project_constraint`: factual project updates available to affected packages;
- `relationship_internal`: supplier-specific history for internal preparation;
- `human_confidential`: target, reservation boundary, budget, weak BATNA, internal urgency;
- `prohibited_to_propagate`: raw competitor transcript, unauthorized exact price, personal profile, unsupported allegation.

The architecture must enforce:

- no bidder-to-bidder coordination;
- competitor identity and detailed prices confidential by default;
- no unauthorized use or disclosure of trade secrets;
- purpose limitation, minimization, accuracy, access control, and expiry for personal contact history;
- no emotion, personality, weakness, or lie inference;
- no autonomous award, acceptance, or binding commitment; and
- full event, evidence, mandate, and strategy-version auditability.

These are conservative product controls, not legal advice. German competition, trade-secret, privacy, tender, and contractual obligations require review for the actual customer and procurement process.

## 8. Scientific support and limits

The existing [evidence register](../skills/negotiate-construction-bids/EVIDENCE.md) supports the following design choices:

- targets and boundaries before the call, with private information protected;
- constructive problem solving without uncontrolled yielding;
- diagnosis across several issues rather than fixed-pie assumptions;
- two or three approved multi-issue packages;
- active listening used to clarify and correct multi-issue information;
- trust, process quality, and relationship value alongside economic outcome;
- no fabricated leverage, strategic anger, lie detection, or automatic reciprocal concessions.

Construction relationship research indicates that GC–subcontractor relationship quality can affect project outcomes, but evidence that a shared past alone improves performance is mixed. Therefore, historical relationship data should generate questions and weighted considerations—not deterministic predictions.

Do not claim that the literature proves live multi-agent coordination increases savings. Validate the portfolio layer separately with static-strategy versus updated-strategy trials and real customer pilots.

## 9. Hackathon implementation slice

Use a controlled wave model instead of unrestricted real-time learning:

1. The user confirms project priorities, deadlines, mandate, relationship context, and approved concessions.
2. The system compiles supplier-specific snapshots for three or four Tischler bidders.
3. Parallel clarification calls resolve scope and commercial blockers.
4. Durable confirmations are re-levelled.
5. The portfolio coordinator produces one visible, sanitized strategy patch.
6. A human approves the patch.
7. A later negotiation call uses the updated eligible leverage or schedule information.
8. The UI shows the before/after strategy, evidence, disclosure text, and affected calls.

This demonstrates the technical wedge without pretending the system has already validated unrestricted autonomous real-time portfolio bargaining.

## 10. Acceptance criteria

- Every call is pinned to a strategy, mandate, bid, and `scopeHash` version.
- A raw transcript can never be broadcast to another supplier agent.
- Unconfirmed, expired, different-scope, incomplete, or non-disclosable offers cannot create leverage.
- Different trades exchange project constraints but never price leverage.
- A scarce concession cannot be spent twice.
- Material strategy changes require approval and create a new version.
- Historical statements retain source, context, fact type, confidence, and expiry.
- User observations never become supplier facts automatically.
- Every live change explains what changed, why, and from which evidence.
- Relationship quality and project feasibility are reported alongside price improvement.

## 11. Primary references

- De Dreu, Weingart & Kwon, problem solving and resistance to yielding: <https://doi.org/10.1037/0022-3514.78.5.889>
- Kong, Dirks & Ferrin, trust in negotiation: <https://doi.org/10.5465/amj.2012.0461>
- Galinsky & Mussweiler, first offers and targets: <https://doi.org/10.1037/0022-3514.81.4.657>
- Thompson & Hastie, fixed-pie perceptions: <https://doi.org/10.1016/0749-5978(90)90048-E>
- Leonardelli et al., multiple equivalent simultaneous offers: <https://doi.org/10.1016/j.obhdp.2019.01.007>
- Yao et al., multi-issue offers and joint gains: <https://doi.org/10.1016/j.obhdp.2020.10.012>
- Curhan, Elfenbein & Xu, subjective value in negotiation: <https://doi.org/10.1037/0022-3514.91.3.493>
- Loosemore et al., construction relationship quality: <https://www.sciencedirect.com/science/article/pii/S0263786321000569>
- van der Krift et al., shared past/future in construction buyer–supplier relations: <https://www.sciencedirect.com/science/article/abs/pii/S1478409206000264>
- German Competition Act § 1: <https://www.gesetze-im-internet.de/gwb/__1.html>
- German Trade Secrets Act § 4: <https://www.gesetze-im-internet.de/geschgehg/__4.html>
- GDPR Article 5: <https://eur-lex.europa.eu/eli/reg/2016/679/art_5/oj>
