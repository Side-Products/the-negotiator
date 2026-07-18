# Hack-Nation Challenge Assessment

**Team:** Pushpit Bhardwaj, Claus Schöning, Sagar Katariya, Parth Dhawan, Ivan Vetrov<br>
**Constraint:** Deliver a credible, working submission within 24 hours<br>
**Assessment date:** 18 July 2026

## Executive recommendation

Choose **Challenge 01 — ElevenLabs: The Negotiator**.

It offers the best combination of team fit, probability of finishing, demo impact, and judging alignment. Use **Challenge 03 — RealPage: RealDoor** as the fallback if the voice integration spike fails within the first 90 minutes.

The team is particularly well suited to an agentic voice product:

- [Pushpit Bhardwaj](https://www.linkedin.com/in/pushpit-bhardwaj/) brings full-stack, cloud, distributed-systems, DevOps, and extensive hackathon experience.
- [Parth Dhawan](https://www.linkedin.com/in/parth-dhawan/) brings software engineering, Python, data processing, and office automation.
- [Ivan Vetrov](https://www.linkedin.com/in/ivan-vetrov/) combines mechanical engineering, computer science, embedded AI, industrial automation, and startup experience.
- [Sagar Katariya](https://www.linkedin.com/in/sagar-katariya-aviation/) brings logistics, supply-chain/process optimization, and networking.
- [Claus Schöning](https://www.linkedin.com/in/claus-sch%C3%B6ning/) adds biochemistry, bioethics, science communication, creative direction, audio/MCP work, and multi-agent prototyping.

## Scoring methodology

The weighted score prioritizes what matters under a 24-hour constraint:

- Team fit: 30%
- Probability of a complete submission: 30%
- Demo and judging clarity: 20%
- Differentiation and upside: 10%
- Dependency resilience: 10%

Scores within roughly three points should be treated as ties. Conditional scores assume the named dataset or organizer pack is immediately available.

| Rank | Challenge | Score | Verdict |
|---:|---|---:|---|
| 1 | [The Negotiator](/Users/clausgeorggustavschoning/Downloads/1784382172163-01-ElevenLabs-The-Negotiator.docx.pdf) | 89/100 | Best expected result |
| 2 | [RealDoor](/Users/clausgeorggustavschoning/Downloads/1784383492519-03-RealPage-RealDoor.docx.pdf) | 84/100 | Safest complete submission |
| 3 | [Women’s Hormonal Health](/Users/clausgeorggustavschoning/Downloads/1784383032781-05-Hack-Nation-Foundations-Model-for-Womens-Hormonal-Health.docx.pdf) | 75/100 conditional | Strong research alternative |
| 4 | [Genome Firewall](/Users/clausgeorggustavschoning/Downloads/1784386483301-06-Hack-Nation-Genome-Firewall.docx.pdf) | 70/100 conditional | High upside, fragile prerequisites |
| 5 | [Data Legend](/Users/clausgeorggustavschoning/Downloads/1784382653830-04-Databricks-Data-Legend.docx.pdf) | 69/100 conditional | Platform-risk bet |
| 6 | [The VC Brain](/Users/clausgeorggustavschoning/Downloads/1784381921507-02-Maschmeyer-Group-The-VC-Brain.docx.pdf) | 66/100 | Scope trap |

## Challenge evaluations

### 01 — ElevenLabs: The Negotiator

**Verdict: Tackle this challenge.**

#### Why it fits

- The required product separates cleanly into voice, backend/schema, document intake, vendor simulation, evaluation, and presentation workstreams.
- The brief permits teammates or counter-agents to role-play vendors, removing dependence on unreliable calls to real businesses.
- Voice produces an immediately understandable demo with a strong before-and-after moment.
- Claus's audio and conversation-design experience is unusually relevant, while Pushpit and Parth can own the integration and structured data path.

#### Recommended MVP

Use the **moving** vertical already developed in the brief:

1. A voice interview or inventory document produces one confirmed, versioned job specification.
2. The exact same specification is given to three live vendors with hidden policy cards: honest, lowball, and premium.
3. Every conversation returns an itemized quote through a strict structured tool.
4. The system discovers hidden fees, flags the suspicious lowball, and ranks landed cost and risk.
5. It truthfully uses the best comparable quote to improve another offer.
6. The demo highlights the exact transcript turn that caused the measurable improvement.

Do not make Twilio the initial critical path. ElevenLabs supports browser voice components as well as native Twilio integration. Begin with browser-based live role-play and add telephony only after the entire loop works. See the [ElevenLabs Agents documentation](https://elevenlabs.io/docs/eleven-agents/overview).

#### Main risks

- Telephony setup, latency, barge-in, and transcript/tool-call reliability.
- A staged or obviously scripted negotiation will be weak.
- A polished dashboard cannot compensate for the absence of a real causal negotiation.
- Calling or recording real businesses introduces consent and reliability problems.

#### Go/no-go gate

Within 90 minutes, demonstrate one live conversation that produces a structured quote and stored transcript. If that does not work, switch to RealDoor.

### 02 — Maschmeyer Group: The VC Brain

**Verdict: Avoid under a 24-hour constraint.**

The team's startup, engineering, and networking experience fits the subject, but the brief combines too many major systems:

- Proactive founder sourcing
- Entity resolution and enrichment
- Cold-start assessment
- Persistent founder memory and trend history
- Three independent opportunity axes
- Per-claim trust scoring and contradiction detection
- Evidence-backed investment memos
- Investor-grade UX

A simple deck-upload-and-score product would miss the prioritized sourcing and cold-start requirements. Public data access, licensing, identity matching, longitudinal history, and fairness would consume much of the event.

If selected despite the risk, constrain the system to 10–20 hackathon founders, GitHub plus one deck, one compound search, one deliberately seeded contradiction, and the five required memo sections. Do not depend on LinkedIn or Crunchbase access.

### 03 — RealPage: RealDoor

**Verdict: Best fallback and safest complete build.**

The acceptance test is unusually explicit, and the core flow has limited external integration risk. The team can cover document extraction, deterministic rules, privacy, adversarial testing, accessibility, and presentation.

#### Recommended MVP

Build one synthetic renter case for one metro and one program year:

1. Upload a pay stub and show 6–8 extracted allowlisted fields with source boxes and confidence.
2. Correct gross pay or pay period and visibly recompute annual income.
3. Answer one rules question with an authoritative citation and effective date.
4. Show the confirmed inputs and deterministic calculation without declaring eligibility.
5. Identify one expired and one missing document.
6. Preview and export an editable packet, then delete the session.
7. Demonstrate refusal of “Am I eligible?” and resistance to an embedded prompt injection.

#### Main risks

- The promised organizer pack must be available immediately.
- OCR/source-box work can consume the day; use constrained document types and gold coordinates where provided.
- Any approval, denial, score, ranking, or “likely eligible” badge can violate the challenge boundary.
- Accessibility represents 15% of judging and must be built in from the start.

Avoid the optional property-discovery stretch.

### 04 — Databricks: Data Legend

**Verdict: Select only after a successful platform spike.**

Pushpit and Parth fit the data and evidence-engineering work, but no team profile demonstrates current Databricks Apps experience. The hard requirement for a live Free Edition app adds platform risk.

#### Recommended MVP

Choose **Facility Trust Desk**:

- Filter by ICU capability and one region.
- Retrieve the exact corroborating and contradicting sentences for each facility.
- Produce a transparent evidence-strength score rather than claiming that the facility truly has a functioning ICU.
- Show missing fields and score contributions.
- Let a planner override the assessment with a persisted note.
- Add one deterministic consistency validator.

#### Main risks

Databricks Free Edition is quota-limited, restricts outbound internet, allows one limited AI Search endpoint without Direct Vector Access, and stops apps automatically after 24 hours unless restarted. See the [Databricks Free Edition limitations](https://docs.databricks.com/aws/en/getting-started/free-edition-limitations).

In the first 60 minutes, verify dataset access, a serverless query, a deployed hello-world app, and persistent storage. Pivot immediately if any critical step fails.

### 05 — Foundation Models for Women’s Hormonal Health

**Verdict: Best research-oriented alternative if data access is already secured.**

Claus's biochemistry and bioethics background, combined with Parth's data work and Pushpit's infrastructure experience, makes the team more credible here than a typical generalist hackathon team. The brief rewards one reusable scientific layer rather than a full foundation model.

#### Recommended MVP: OpenCycleBench

- Predict a hormone-defined menstrual phase or ovulation window from prior wearable and symptom data.
- Compare calendar-only, wearable-only, and multimodal baselines.
- Split by participant, never by random days, to avoid identity leakage.
- Report balanced accuracy, macro-F1, calibration/Brier score, class balance, and limitations.
- Publish the preprocessing and evaluation pipeline, split manifest, reproducible notebook, data card, model card, and permitted model artifacts.
- Use any UI only as a research explorer, never for diagnosis or treatment advice.

#### Main risks

The [mcPHASES dataset](https://physionet.org/content/mcphases/1.0.0/) is restricted-access, requires a signed data-use agreement, contains only 42 participants, and has substantial multimodal missingness. Its license also prevents unrestricted redistribution of raw data.

If access is not working in the first hour, use a narrowly defined NHANES benchmark or abandon the challenge. Do not fall back to a generic symptom journal without a reusable benchmark or model contribution.

### 06 — Genome Firewall

**Verdict: High-upside option only if the organizer data pack is complete.**

The team has enough biology and engineering literacy to understand the problem, but no profile demonstrates direct bioinformatics, antimicrobial-resistance modeling, or probability-calibration experience.

#### Recommended MVP: AMR Guard

- Support one organizer-provided bacterial species and 3–5 antibiotics.
- Convert FASTA through basic QC and supplied AMRFinderPlus annotations into standardized features.
- Train one regularized logistic-regression model per antibiotic using genetic-group splits.
- Calibrate confidence on a separate calibration set.
- Introduce an explicit no-call region based on coverage versus error.
- Apply a deterministic molecular-target gate.
- Show drug, likely work/fail/no-call, calibrated confidence, evidence category, detected marker, and mandatory laboratory-confirmation warning.

#### Main risks

- Without organizer-provided labels, genetic groups, fixed splits, and preferably precomputed AMRFinderPlus output, data preparation can consume the entire event.
- Sequence leakage, sparse labels, class imbalance, calibration, and target-presence mapping require real domain judgment.
- Statistical feature importance must not be presented as proven biological causality.

Run an end-to-end data and baseline check in the first hour. If it fails, do not continue with this challenge.

## Recommended team split for The Negotiator

- **Pushpit:** technical lead, ElevenLabs integration, backend, and deployment.
- **Parth:** job and quote schemas, structured tools, ranking, and evidence storage.
- **Ivan:** rule-driven vendor simulators, failure handling, and integration tests.
- **Sagar:** moving-market logic, negotiation styles, test calls, and demo operations.
- **Claus:** conversation design, audio experience, safety/evaluations, visual narrative, and pitch.

## 24-hour execution plan

### Hours 0–2: Prove the critical path

- Lock the moving vertical and exact data schema.
- Complete one live voice conversation that returns a structured quote and transcript.
- Define three vendor policy cards and the measurable negotiation outcome.
- Make the final challenge decision no later than minute 90.

### Hours 2–10: Build the complete vertical slice

- Voice/document intake to confirmed job specification.
- Live vendor conversation to structured quote.
- Transcript, evidence, and landed-cost storage.
- Initial ranking and recommendation UI.

### Hours 10–16: Complete judging-critical behavior

- Three negotiation styles.
- Hidden-fee discovery and lowball detection.
- One causal second-round improvement.
- Interruption, evasive-answer, and tool-failure handling.

### Hours 16–20: Freeze features and evaluate

- Stop adding product scope.
- Run adversarial calls and golden test cases.
- Capture backup recordings and transcripts.
- Check that the same versioned specification was used in every call.

### Hours 20–24: Submission and rehearsal

- Record the demonstration video.
- Rehearse the live path and failure fallback.
- Finalize architecture, limitations, and safety notes.
- Center the pitch on one indisputable before-and-after negotiation.

## Final decision rule

1. Start with The Negotiator.
2. Lock it if the voice-to-structured-quote loop works within 90 minutes.
3. Otherwise switch to RealDoor if the complete organizer pack is present.
4. If neither prerequisite holds, choose Women’s Hormonal Health only when dataset access is already active.

Do not continue debugging a blocked dependency after the relevant decision gate. Under a 24-hour deadline, a narrow complete loop will outperform a broad partially functioning platform.
