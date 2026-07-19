# Customer Discovery & Negotiation Mastery — Combined Reference

> Source reference for the distilled INTERVIEW CRAFT (intake agent) and
> NEGOTIATION CRAFT (buyer agent) prompt blocks in `src/scripts/createAgents.js`
> and `src/backend/services/batchCaller.js`. The prompts carry only the subset
> that is honest, voice-appropriate, and consistent with
> `skills/negotiate-construction-bids/references/VOICE_STRATEGY.md` (no
> performed emotion, no manufactured social proof, no fake scarcity).

Two synthesized skills in one file: (1) Customer Discovery — asking clear questions with emotional attunement, from 10 books; (2) Negotiation Tactics — from 20 books. Both adapted for multicultural and multilingual contexts.

---

## Part 1 — The Core Rules of Good Questions

### Rule 1: Talk about their life, not your idea (The Mom Test)
People lie to be nice. Never pitch, then ask "would you use this?" Instead:
- Ask about **specifics in the past**, not opinions about the future. "When did this last happen? Walk me through it."
- Bad: "Would you pay for X?" → Good: "What are you currently paying/doing to solve this?"
- Compliments, fluff ("I'd definitely use that"), and hypotheticals are **not data**. Facts, commitments, and money are.
- If they haven't tried to solve the problem themselves, they don't care enough about it.

### Rule 2: Follow the SPIN progression (SPIN Selling)
Sequence questions from context to consequence:
1. **Situation** — facts about their current setup (use sparingly; do homework first)
2. **Problem** — difficulties, dissatisfactions ("What's frustrating about...?")
3. **Implication** — consequences of the problem ("What does that delay cost you downstream?")
4. **Need-payoff** — let *them* articulate the value ("How would it help if...?")
Implication questions are where amateurs stop and experts dig. The customer convincing themselves beats you convincing them.

### Rule 3: Find the gap (Gap Selling)
Every need is a gap between **current state** and **desired future state**. Map both explicitly. No gap = no need = no sale. Quantify the gap wherever possible.

### Rule 4: Stay humble and curious (Humble Inquiry)
Ask from a position of genuine not-knowing, not interrogation. Prefer open questions you truly don't know the answer to. Avoid disguised statements ("Don't you think that...?").

### Rule 5: Use the seven power questions (The Coaching Habit)
"What's on your mind?" · "And what else?" (ask 2–3 times) · "What's the real challenge here **for you**?" · "What do you want?" · "How can I help?" · "If you say yes to this, what are you saying no to?" · "What was most useful for you?"

### Rule 6: Question the question (A More Beautiful Question)
Walk the ladder: **Why?** → **What if?** → **How?**

### Rule 7: Interview like a researcher (Lean Customer Development, Talking to Humans)
- Ask about **behavior**, not intent: "Tell me about the last time you…"
- One question at a time; then be silent. Silence does the digging.
- Get stories, not summaries. Look for workarounds — workarounds = validated pain.
- End with: "Who else should I talk to?" and "What should I have asked that I didn't?"

## Part 2 — Emotional Attunement

**The empathy loop — use it whenever emotion surfaces:**
1. **Notice** the feeling (tone shift, sigh, laughter, hesitation, strong word choice)
2. **Reflect** it briefly and tentatively: "That sounds genuinely exhausting — is that right?"
3. **Validate** without judging or fixing: "That makes sense given what you're juggling."
4. **Then** deepen: "What's the hardest part of that for you?"

**Rules of humane conversation:**
- Never rush past pain to your next scripted question.
- Empathy ≠ agreement, and ≠ pity. It's accurate understanding, reflected back.
- Match energy: mirror their formality, pace, and vocabulary. Use their exact words for their problem.
- Distinguish **feelings** ("I'm overwhelmed") from **needs** ("I need predictability").
- Don't fake emotion. One genuine reaction beats five performed ones.

## Part 3 — Multicultural & Multilingual Adaptation (The Culture Map)

| Dial | Low-context (US, DE, NL, Scandinavia) | High-context (JP, CN, IN, FR, Arab world, LATAM) |
|---|---|---|
| Communication | Take words at face value | Read pauses, hedges, what's *not* said |
| Disagreement | "No" is said directly | "That could be difficult" often means no |
| Trust | Built through competence/tasks | Built through relationship/time |
| Hierarchy | Anyone speaks freely | Junior people may not voice problems in front of seniors |

**Multilingual practice:**
- Short sentences, no idioms, no phrasal-verb stacking.
- Confirm understanding by asking them to describe it back — never "Do you understand?"
- Offer to continue in their stronger language; people describe pain most accurately in their mother tongue.
- In indirect cultures, use third-person framing: "How do people usually handle...?"
- Watch for "yes" that means "I hear you" rather than "I agree". Verify with behavioral questions.

## Part 4 — Negotiation: Preparation

- **BATNA** (Getting to Yes): your power = your best alternative, not your desire. Estimate theirs too.
- **Reservation point & ZOPA**: your walk-away number; the zone between both walk-aways.
- **Target high, justify it**: ambitious-but-defensible anchors capture more value.
- **3-D moves** (Lax & Sebenius): if the table looks bad, change the setup.
- **Multiple issues > one issue**: never negotiate price alone. Add timing, scope, volume, guarantees — trade what's cheap for you but valuable to them (**logrolling**).

## Part 5 — The Conversation: Tactical Empathy & Information

**From Never Split the Difference:**
- **Mirroring**: repeat their last 1–3 words as a question. They elaborate; you learn.
- **Labeling**: "It seems like you're worried about the timeline." Naming emotions defuses negatives.
- **Accusation audit**: preempt their objections yourself.
- **Calibrated questions**: open "How/What" questions that make them solve your problem. Never "Why" (sounds accusatory).
- **Aim for "That's right"** (they feel understood) — not "You're right" (they want you to stop talking).
- Slow, calm, downward-inflected voice when tension spikes.

**From Getting to Yes / Getting Past No:**
- Separate the **people** from the **problem**; soft on people, hard on the problem.
- Negotiate **interests, not positions** — ask what's behind every demand.
- When attacked: pause, step to their side, reframe attacks as attacks on the problem.
- **Build them a golden bridge**: make yes easy, let victory look like their idea, help them save face.
- Use **objective criteria** (market rates, precedent, benchmarks): standards vs. standards, not will vs. will.

**From Difficult/Crucial Conversations, Beyond Reason:** make it safe; contrast statements ("I don't mean X; I do mean Y"); feed the five core concerns: appreciation, affiliation, autonomy, status, role.

**From Getting More:** use their standards against their positions; be incremental; small steps beat big leaps with distrustful parties.

## Part 6 — Concessions, Deadlock & Closing

- **Never concede without getting something.** "If I do X, can you do Y?" — always trade, never gift.
- **Decreasing increments**: each concession smaller than the last; signals you're near bottom.
- **Higher authority**: "I need to check with my customer" buys time and deflects pressure (for our agent this is literally true).
- Recognize the classics — good guy/bad guy, nibbling, the vise ("You'll have to do better than that") — and name them calmly.
- **Deadlock tools**: change a variable, set the hard issue aside, use objective criteria.
- **Close**: summarize agreements in their words, confirm implementation details, get it in writing.
- **Silence**: after you state a number, stop talking. In East Asia and Finland silence means thinking, not discomfort. Filling silence is where people concede unnecessarily.
- Numbers in writing/read back explicitly — spoken numbers across accents are a classic source of deal-killing errors.

## Not adopted into agent prompts (deliberate)

- Visible flinching / performed reactions — conflicts with the evidence-based voice strategy (no strategic emotion).
- Frame-control status games (Pitch Anything) — wrong register for a polite purchasing assistant.
- Liking-through-flattery and referenced "similar customers" — the agent may not invent social proof.
- Any scarcity or deadline that is not real — the honesty line.
