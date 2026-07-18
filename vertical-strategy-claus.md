# The Negotiator — Vertical Strategy Deep Dive

**Decision date:** 18 July 2026<br>
**Constraint:** Build a credible end-to-end product in 24 hours<br>
**Primary market preference:** Germany / Europe, with a globally understandable pitch

## Executive decision

**Recommended default: build `FairFix`, a multilingual AI buyer for one precisely specified car-repair job.**

The initial idea of a broad freight negotiator is not wrong, but it is no longer the best default after a second research pass. Car repair offers the best combination of:

- strict fit with the challenge requirements;
- a simple story a judge understands in seconds;
- real German evidence of price dispersion and response friction;
- a natural document-to-structured-specification workflow;
- genuine, itemized negotiation levers;
- a credible social-impact layer; and
- a realistic path from a 24-hour counter-agent demo to German customers.

The best alternatives are:

1. **Construction-equipment rental** — strongest differentiated B2B/European commercial option.
2. **FairFarewell / funeral price-rights advocate** — strongest US-facing social-impact wildcard, but ethically sensitive and less suitable for immediate German sales.
3. **Narrow freight** — only if the team already has authentic shipment documents, quotes, and a domain contact who can validate the behavior today.
4. **Emergency locksmith** — very clear consumer pain, but lower repeat use and higher safety/reputation risk.

**Do not use accessibility or multilingual support as the vertical itself.** Make it a product capability on top of a concrete market. A previous Hack-Nation ElevenLabs runner-up, SignCall, already used an autonomous calling agent to help Deaf and non-speaking users book medical appointments, so an accessibility-only headline would look derivative. [SignCall project description](https://www.linkedin.com/posts/bethany-anne-wong_recently-our-team-won-2nd-place-in-the-elevenlabs-activity-7430685496898654208-EZ5L)

## What the challenge actually rewards

The supplied brief is more restrictive than “an AI that negotiates.” A strong submission needs the complete loop:

1. Voice intake plus at least one document type.
2. One confirmed, structured job specification.
3. The same specification reused for three distinct counterparties or negotiation styles.
4. Itemized and comparable quotes.
5. At least one price or term improvement caused by truthful leverage gathered in the earlier conversations.
6. Ranked results with transcripts, recordings, evidence, and a recommendation.
7. Honest AI disclosure and no invented bids.

The brief permits real businesses, human role-play, or dynamic counter-agents. That means reliability is more important than trying to force real companies into a live hackathon demo.

The public Hack-Nation page does **not** currently publish a named July 2026 judge roster. It says teams must ship a working AI product in 24 hours, finalists pitch in three minutes, and top teams can enter a Venture Track centered on customer validation and venture potential. The reasonable inference is that a complete, legible product loop and a credible business wedge matter more than a grand market narrative. [Hack-Nation event](https://hack-nation.ai/global-ai-hackathon), [Venture Track](https://hack-nation.ai/venture-track)

This event collaborates with MIT-related clubs and has a Cambridge/MIT hub; it should not be described as an official MIT-organized competition unless the organizers confirm that wording.

Generic quote-shopping is also not novel by itself. Previous ElevenLabs hackathons have already rewarded products such as Dealwise, which called local businesses for prices and availability, and Procuro, which called suppliers for delayed parts. The differentiator must be the **canonical specification, discovery of hidden terms, causal negotiation, and evidence trail**. [ElevenLabs Worldwide Hackathon winners](https://elevenlabs.io/blog/announcing-the-winners-of-the-elevenlabs-worldwide-hackathon)

## Decision matrix

Scores are a comparative decision tool, not market facts. They weight challenge compliance, 24-hour reliability, judge clarity, differentiation, commercial potential, social value, and risk.

| Rank | Vertical | Score | Best use | Main weakness |
|---:|---|---:|---|---|
| 1 | **Known-job car repair** | **8.8/10** | Best overall / recommended | Scope must be identical across shops |
| 2 | **Construction-equipment rental** | **8.1/10** | Best European B2B alternative | Less emotionally immediate |
| 3 | **Funeral pre-planning / direct cremation** | **8.0/10** | Best US social-impact wildcard | Ethical sensitivity; US-specific rules |
| 4 | **Emergency locksmith** | **7.8/10** | Best urgency/scam-prevention story | Safety, provider hostility, low repeat use |
| 5 | **Narrow freight** | **7.3/10** | Best conditional team-fit option | Complex comparison and strong incumbents |
| 6 | **Movers** | **7.2/10** | Safest use of the supplied example | Likely crowded and less differentiated |
| 7 | **Weddings** | **6.7/10** | Visually attractive consumer demo | Highly bespoke and slower buying cycle |
| 8 | **Telecom / bill negotiation** | **6.1/10** | Recurring savings story | Authentication, IVRs, and weak three-provider loop |

Debt, medical bills, tenant disputes, and worker-rate negotiation have authentic social value but are poor choices for this challenge. They usually involve one counterparty rather than three comparable suppliers and introduce legal, authorization, privacy, or relationship risks that cannot be responsibly solved in 24 hours.

## Recommendation 1: FairFix — multilingual car-repair buying

### The exact wedge

Do **not** diagnose an unknown mechanical problem. Start from a known, documented job, for example:

> Replace front brake pads and rotors for a specific vehicle/VIN, using OEM-equivalent parts, including labor, consumables, disposal, VAT, warranty, and a written all-in cap.

The user speaks in their preferred language and uploads a registration document, inspection report, service plan, or existing quote. FairFix converts this into one versioned German job specification and uses it unchanged with three workshops.

### Why this is the strongest choice

- Germany had **49.3 million registered passenger cars** at the beginning of 2025. [Destatis](https://www.destatis.de/DE/Presse/Pressemitteilungen/2025/08/PD25_N044_46_85.html)
- In a 2026 ADAC sample, only **94 of 120** requested workshop estimates arrived. Prices varied materially between urban and surrounding-area workshops, and customers could sometimes save **several hundred euros**. [ADAC workshop comparison](https://presse.adac.de/meldungen/adac-ev/technik/vergleich-kundendienstkosten-e-auto-verbrenner.html)
- The price is not one number. Parts quality, labor, diagnostics, consumables, disposal, tax, warranty, replacement mobility, timing, and exclusions make the comparison meaningfully agentic.
- The customer can supply a real document immediately, while counter-agents can safely simulate the three workshops during the demo.
- The social value is concrete: language, hearing, confidence, and technical-literacy barriers are removed without claiming that every workshop is exploitative.

### Canonical quote schema

Every workshop must return:

- exact included work;
- parts manufacturer and quality tier;
- parts subtotal;
- labor hours and hourly rate;
- diagnostic fee and whether it is credited;
- shop supplies and disposal;
- VAT and all-in total;
- warranty;
- earliest appointment and completion time;
- loaner or mobility option;
- binding-price status, validity, and exclusions.

### Three useful counterparties

1. **Transparent independent shop:** complete quote, equivalent parts, good warranty.
2. **Dealer/premium shop:** higher price, OEM parts, stronger mobility and warranty.
3. **Lowball shop:** omits rotors, VAT, disposal, or diagnostic work until questioned.

The closer can then truthfully say:

> “We have a comparable all-in offer at €X with a two-year warranty. Can you match the landed price, waive the diagnostic fee, or include the loaner?”

The result is a visible causal improvement even if a safety-critical part itself is not discounted.

### Guardrails

- Compare procurement offers; do not diagnose, prescribe, or declare a vehicle safe.
- Require user approval before booking or accepting a binding offer.
- Highlight scope differences rather than automatically choosing the cheapest bid.
- Show original and translated terms side by side; never silently translate a number, date, or commitment.
- Disclose the AI and recording at the start of every call.

### Commercial starting point

The first product can be a consumer transaction service, but customer acquisition may be easier through roadside-assistance organizations, insurers, fleet/leasing managers, employee-benefit programs, or consumer-protection partners. The hackathon should prove savings and trust; it should not pretend the distribution channel is already validated.

## Recommendation 2: construction-equipment rental

This is the strongest alternative if the team prefers a recurring B2B customer and a clearly European go-to-market.

The 2025 European Rental Association report puts 2024 equipment-rental turnover at approximately **€33.5 billion across 17 countries**. [ERA report coverage](https://www.internationalrentalnews.com/de/news/die-european-rental-association-era-veroffentlicht-den-marktbericht-2025/8087050.article)

Use one precise job:

> Rent a 2-ton mini excavator with a specified bucket for three days at a German postcode, eight operating hours per day, including delivery, pickup, damage waiver, fuel policy, cleaning, and VAT.

Natural negotiation levers include flexible dates, self-pickup, duration tiers, bundled attachments, delivery fees, damage-waiver percentage/deductible, excess hours, refueling, and cleaning. A current German rate card, for example, lists a 2-ton mini excavator at €120 per day before VAT, adds a 10% damage waiver, caps normal use at eight hours per day, and separately charges delivery, missing fuel, or cleaning. That is enough real structure to ground counter-agents without inventing arbitrary prices. [SBB 2026 rental rate card](https://www.sbb-online.de/downloads.html?file=files%2FMainTheme%2Ffiles%2Fsbb-mietpreisliste.pdf)

Why it is not first: judges understand brake repair faster, and the social-impact case is mainly procurement access for small contractors rather than direct help to a vulnerable consumer.

## Recommendation 3: FairFarewell — US social-impact wildcard

This is the most surprising and evidence-rich alternative, but it must be framed as a **compassionate price-rights and options advocate**, not an aggressive funeral haggler.

The US FTC Funeral Rule requires providers to give accurate price information by phone, permits consumers to choose itemized goods and services, and does not allow providers to demand the caller's identity before answering price questions. [FTC Funeral Rule guidance](https://www.ftc.gov/business-guidance/resources/complying-funeral-rule)

In an FTC sweep of 278 providers:

- no after-hours price was obtained from 73 providers (26%);
- no business-hours price was obtained from 21 providers (7%);
- about half used estimates or ranges rather than actual prices;
- at least 33% supplied package pricing without full itemization; and
- at least 37 providers quoted different prices for identical services across calls.

[FTC phone-sweep report](https://www.ftc.gov/news-events/news/press-releases/2024/11/ftc-staff-issues-report-undercover-funeral-rule-phone-sweep)

A strong demo would compare one direct-cremation specification, ask providers to remove optional items or waive transfer fees, and return a dignified bilingual explanation.

Only choose this if the team is comfortable with the subject and can use these guardrails:

- frame the scenario as advance planning;
- never invent a recent death or deceive a real provider;
- use counter-agents or consenting role-players for the hackathon;
- never authorize payment or arrangements without explicit human approval; and
- limit legal claims to the US demo.

It may stand out to US judges, but it is weaker for the stated goal of selling quickly in Germany because the FTC rights framework is US-specific.

## Recommendation 4: emergency locksmith

Locksmith pricing is highly phone-dependent, urgent, and easy to explain. Verbraucherzentrale reports a case approaching **€800** for a simple opening and advises consumers to agree a fixed all-in price covering travel and surcharges. [Verbraucherzentrale](https://www.verbraucherzentrale.de/wissen/vertraege-reklamation/abzocke/schluesseldienste-so-schuetzen-sie-sich-vor-ueberzogen-hohen-rechnungen-6687)

A canonical job can capture postcode, time, door state, lock type, drilling authorization, proof of occupancy, dispatch fee, travel, labor, surcharges, replacement cylinder, VAT, and arrival time.

The demo is powerful, but the commercial case is weaker than car repair because use is rare, real providers may refuse agent calls, and urgency makes a failed call or delayed response unacceptable. Safety and response time must outrank savings.

## Freight: corrected assessment

### What remains attractive

- Excellent document intake from a packing list, commercial invoice, existing tariff, or carrier invoice.
- Genuine hidden-cost discovery through accessorials.
- Strong team credibility through Sagar's logistics background.
- Large underlying activity: EU road freight reached **1,869 billion tonne-kilometres in 2024**, with Germany accounting for 15%. [Eurostat](https://ec.europa.eu/eurostat/web/products-eurostat-news/w/ddn-20250709-1)

### What was overstated earlier

- The German logistics sector's headline revenue is not the addressable software market or external freight spend.
- A bottom-up calculation using all German SMEs is not a sourced market size. Only a small subset has enough repeat transport spend and procurement complexity.
- **5–15% savings should not be promised as the effect of the negotiation agent.** Transporeon's established procurement product already includes benchmarking, bid validation, and multi-round negotiation; it reports an additional **1.5–4%** reduction from feedback rounds in one procurement workflow. [Transporeon Freight Procurement](https://www.transporeon.com/en/platform/freight-marketplace/shipper/freight-procurement)
- Transporeon also markets AI-native autonomous spot procurement and claims 12% spot savings in its own context. This proves demand but also proves that broad AI freight procurement is not an uncontested category. [Transporeon Autonomous Procurement](https://www.transporeon.com/en_US/platform/freight-sourcing-hub/shipper/autonomous-procurement)
- Standard shipments increasingly have instant digital prices. Voice needs to solve exceptions, incomplete specifications, follow-up, or contract negotiation—not merely reproduce an online rate form.

### If the team insists on freight

Separate the hackathon wedge from the startup wedge:

- **Hackathon demo:** one time-critical, nonstandard shipment with fixed dimensions, commodity, route, Incoterm, pickup constraints, customs responsibility, insurance, and deadline. It is dramatic but operationally complex.
- **Commercial starting point:** parcel/CEP contract renewal and invoice audit, or recurring FTL lanes with already approved carriers. These are more standardized and savings can be verified against historical, fuel-, toll-, volume-, and service-adjusted baselines.

Use human approval before award. Position the product as **verified tender automation and index-adjusted savings**, not a fully autonomous freight buyer. A plausible target is a mid-sized industrial or wholesale company with substantial annual transport spend, not every SME.

Choose freight only if the team can answer “yes” to all four questions now:

1. Do we have an authentic, anonymized quote, tariff, or invoice?
2. Can a domain expert define every field needed for a truly comparable shipment?
3. Can three counterparties return itemized offers within the demo window?
4. Can we explain the result to a non-logistics judge in under 20 seconds?

If any answer is no, use FairFix.

## Social impact: what is real and what is performative

Social impact should change the product mechanics, not just the pitch language.

Build these capabilities after the core negotiation works:

- preferred-language voice intake;
- provider calls in the appropriate language;
- live captions and text-to-voice control;
- bilingual, line-by-line quote comparison;
- plain-language explanations of exclusions and hidden fees;
- explicit approval before a commitment;
- a free or subsidized access route through a partner.

Avoid claims that providers intentionally exploit migrants, older people, disabled people, or low-income customers unless the team has evidence. Say that these users can face **language, access, time, confidence, or technical-literacy barriers** and show exactly how the interface removes them.

Do not present the product as a replacement for regulated relay services, legal counsel, emergency services, or a professional interpreter.

## Concepts to deprioritize

### Weddings

Wedding photographers, venues, catering, and entertainment have negotiable packages and hidden extras, but a full wedding is too bespoke. If selected, narrow to one service such as a six-hour photography package with a fixed shot list, editing scope, travel, delivery, usage rights, deposit, cancellation, and overtime. It remains less urgent and less repeatable than car repair.

### Telecom and essential bills

Recurring savings are attractive, but three providers may not serve the same address, plans are difficult to normalize, and retention calls require identity verification, account PINs, long IVRs, and handling of sensitive credentials. Broadband labels and online pricing also weaken the argument that voice is essential.

### SaaS renewals and B2B telecom

These can be commercially attractive because renewal dates, margins, and recurring spend create negotiation room. They are better post-hackathon discovery tracks than 24-hour demos: sales cycles are long, authentic contracts are hard to source, and enterprise negotiation often runs through email and procurement portals rather than a clean three-call market.

### Debt, medical bills, tenants, and worker pay

These are important problems, but generally involve one counterparty, legal rights, sensitive data, authorization, and potentially irreversible admissions or deadlines. They fail the challenge's clean three-quote loop and carry disproportionate harm if the prototype is wrong.

## The 60-minute decision gate

Before building more UI, run this exact test:

1. Select one real car and one known repair from a document.
2. Produce a single versioned job JSON through voice intake.
3. Send that exact JSON to three dynamic counter-agents.
4. Capture three itemized quote objects and transcript evidence.
5. Use one truthful quote to improve another price or term.
6. Render one ranked comparison with the causal before/after highlighted.

If this works, lock **FairFix** and stop vertical research.

Only override the decision when one of these conditions is already true:

- **Equipment rental:** the team has a small-contractor customer or rental-domain expert ready to validate.
- **FairFarewell:** the team explicitly wants a US-first social-impact pitch and accepts the ethical positioning.
- **Freight:** authentic artifacts and a narrow domain workflow already exist.

## Final second opinion

The prior discussion was directionally right about three things: price opacity is the right market signal, voice matters most where calls and follow-up still dominate, and social-impact features can make the product meaningful.

The corrections are equally important:

- urgency alone does not make a good business;
- a large sector is not the same as an addressable market;
- claimed savings must isolate what the negotiation actually caused;
- accessibility is a capability, not a vertical;
- broad freight is already served by sophisticated procurement platforms; and
- the winning demo is the smallest complete evidence-backed loop, not the broadest vision.

**Final recommendation: build FairFix now. Keep construction-equipment rental as the B2B fallback, FairFarewell as the bold US wildcard, and freight only as a narrow evidence-backed exception.**
