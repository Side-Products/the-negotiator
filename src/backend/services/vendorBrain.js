import { complete } from "@/backend/services/llm";

const REVEAL_RULES = {
  pressed_twice: "reveal it ONLY after the caller has pressed you about the total cost at least twice",
  asked_directly: "reveal it ONLY if the caller asks directly about that specific charge",
};

const renderSystemPrompt = ({ card, vertical, job, vendorName, jitter = 1 }) => {
  // Per-vendor price scale so a 20-vendor market doesn't quote 3 identical numbers.
  const scale = (v) => Math.round((v * jitter) / 10) * 10;
  const pricing = {
    ...card.pricing,
    openingTotal: scale(card.pricing.openingTotal),
    floor: scale(card.pricing.floor),
  };
  const hiddenFees = (card.pricing.hiddenFees || [])
    .map((f) => {
      const fee = (vertical.fees || []).find((x) => x.key === f.feeKey);
      const when = REVEAL_RULES[f.revealWhen] || `reveal it only when: ${f.revealWhen}`;
      return `- $${scale(f.amount)} ${fee?.label || f.feeKey}: do NOT mention this up front — ${when}. It is not included in your opening price.`;
    })
    .join("\n");
  const businessName = vendorName || card.businessName;

  return `You are role-playing a real small-business owner/salesperson on a live phone call. Stay in character at all times.

WHO YOU ARE
Business: ${businessName} (${vertical.label.toLowerCase()})
Persona: ${card.persona}

THE CALLER'S JOB (what they want a price for)
${JSON.stringify(job.spec)}

YOUR PRICING PLAYBOOK
- Opening total: $${pricing.openingTotal}. Start here when asked for a price.
- Absolute floor: $${pricing.floor}. Never go below it, ever.
- ${pricing.guaranteedWillingly ? "You WILL put a guaranteed not-to-exceed total in writing if asked." : "You will NOT guarantee the total in writing — deflect ('the estimate is the estimate, final depends on the day')."}
${hiddenFees ? `HIDDEN FEES (spring these per their reveal rules, never volunteer them):\n${hiddenFees}` : "- No hidden fees. Your itemised numbers are honest."}

HOW YOU NEGOTIATE
${card.matchBehavior}

YOUR QUIRKS (weave these in naturally)
${(card.friction || []).map((f) => `- ${f.replace(/_/g, " ")}`).join("\n")}

IF ASKED WHETHER THEY'RE TALKING TO AN AI / IF THE CALLER SAYS THEY ARE AN AI
${card.aiReaction}

RULES
- Spoken phone-call register: contractions, fillers, short sentences. No lists, no markdown.
- Keep every reply under 60 words.
- You may be vague, evasive, or self-serving if that fits your persona — you're a vendor trying to win a job on your own terms.
- Never break character. Never say you are an AI, a language model, or part of a simulation. You are ${businessName}.`;
};

export const nextVendorTurn = async ({ call, job, vertical, card, lastAgentText }) => {
  const messages = (call.transcript || []).map((t) => ({
    role: t.role === "vendor" ? "assistant" : "user",
    text: t.text,
  }));
  messages.push({ role: "user", text: lastAgentText });

  const text =
    (await complete({
      system: renderSystemPrompt({
        card,
        vertical,
        job,
        vendorName: call.vendorName,
        jitter: call.pricingJitter || 1,
      }),
      messages,
      maxTokens: 300,
      tier: "fast",
    })) || "Sorry, you cut out there for a second — what was that?";
  return { text };
};

export default { nextVendorTurn };
