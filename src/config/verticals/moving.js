// ElevenLabs premade voice IDs (Josh / Adam / Antoni) — any valid voice ID works here.
const VOICES = {
  honest: "TxGEqnHWrfWFTfGW9XjX",
  lowball: "pNInz6obpgDQGcFmaJgB",
  premium: "ErXwobaYiN019PkySvjV",
};

const moving = {
  id: "moving",
  label: "Local Moving",
  tagline: "Get itemised moving quotes, then make movers compete for your job.",
  // Spec fields (in preference order) that locate the market for vendor search.
  marketLocationFields: ["origin", "destination"],

  jobSpec: {
    fields: [
      {
        key: "origin",
        label: "Origin address",
        type: "string",
        required: true,
        ask: "Where are you moving from? Street address or at least the neighborhood and city.",
        default: "Rock Hill, SC",
      },
      {
        key: "destination",
        label: "Destination address",
        type: "string",
        required: true,
        ask: "And where are you moving to?",
        default: "Charlotte, NC",
      },
      {
        key: "moveDate",
        label: "Move date",
        type: "date",
        required: true,
        ask: "What date do you want to move? A specific day helps lock the price.",
      },
      {
        key: "homeSize",
        label: "Home size",
        type: "enum",
        required: true,
        options: ["studio", "1br", "2br", "3br", "4br+"],
        ask: "How big is the place you're moving out of — studio, one bedroom, two, three, or larger?",
      },
      {
        key: "inventory",
        label: "Inventory",
        type: "list",
        required: true,
        itemShape: { item: "string", qty: "number", bulky: "boolean" },
        ask: "Let's list the big stuff — furniture and anything heavy or awkward. What are the main items and how many of each?",
      },
      {
        key: "stairsOrigin",
        label: "Flights of stairs at origin",
        type: "number",
        required: true,
        default: 0,
        ask: "Any stairs at the pickup? How many flights?",
      },
      {
        key: "stairsDest",
        label: "Flights of stairs at destination",
        type: "number",
        required: true,
        default: 0,
        ask: "And stairs at the new place — how many flights?",
      },
      {
        key: "elevator",
        label: "Elevator available",
        type: "boolean",
        required: true,
        default: false,
        ask: "Is there an elevator at either building?",
      },
      {
        key: "packingNeeded",
        label: "Packing service needed",
        type: "boolean",
        required: true,
        default: false,
        ask: "Do you want the movers to pack for you, or will everything be boxed and ready?",
      },
      {
        key: "specialItems",
        label: "Special items",
        type: "string",
        required: false,
        ask: "Anything special — piano, safe, artwork, anything fragile or over 300 pounds?",
      },
    ],
  },

  interview: {
    opener:
      "Hey! I'm going to help you get real, comparable moving quotes. I'll ask a few quick questions about your move — takes about two minutes. First up: where are you moving from?",
    style:
      "Warm and conversational. Ask exactly one question at a time and wait for the answer. Never stack questions. If an answer is vague, ask one short follow-up. Keep it moving — no small talk beyond a friendly acknowledgment.",
    mustConfirm:
      "Before finishing, read the complete spec back to the user — every field, including the full inventory list — and ask for an explicit yes. Only call confirm_spec after they clearly say yes. If they correct anything, update it and read it back again.",
  },

  benchmarks: {
    marketMid: 1900,
    marketMin: 1400,
    marketMax: 2600,
    source: "moveBuddha 2025 local-move data; FMCSA Protect Your Move",
  },

  redFlags: [
    {
      id: "lowball",
      type: "below_market_pct",
      thresholdPct: 30,
      message:
        "This quote is more than 30% below the market rate for this move. Lowball quotes often balloon on move day with surprise fees — a classic bait tactic the FMCSA warns about.",
    },
    {
      id: "no_cap",
      type: "missing_term",
      term: "guaranteed",
      message:
        "This vendor would not guarantee the total in writing. Without a written not-to-exceed price, the final bill can be anything.",
    },
    {
      id: "big_deposit",
      type: "fee_over_pct",
      feeKey: "deposit",
      thresholdPct: 20,
      message:
        "The deposit is over 20% of the total. Reputable movers ask for little or nothing up front — large deposits are a hostage-your-move risk.",
    },
    {
      id: "vague_fees",
      type: "fee_present",
      feeKey: "other",
      minAmount: 200,
      message:
        "Over $200 of this quote sits in unexplained 'other' fees. Vague line items are where the price grows after you've signed.",
    },
  ],

  fees: [
    { key: "base_labor", label: "Base labor" },
    { key: "truck_travel", label: "Truck & travel" },
    { key: "fuel", label: "Fuel surcharge" },
    { key: "stairs", label: "Stairs fee" },
    { key: "bulky_item", label: "Bulky item fee" },
    { key: "packing_materials", label: "Packing materials" },
    { key: "insurance", label: "Valuation / insurance" },
    { key: "deposit", label: "Deposit" },
    { key: "other", label: "Other fees" },
  ],

  levers: [
    {
      id: "beat_quote",
      requires: "leverage",
      script:
        "I'll be straight with you — I have a written itemised quote from another mover at {{amount}} for this exact job. If you can beat that, you've got the booking today.",
    },
    {
      id: "waive_fee",
      requires: "fee",
      script:
        "The {{feeLabel}} is the part that's giving me pause. If you can waive it, I think we have a deal.",
    },
    {
      id: "price_match",
      requires: "leverage",
      script:
        "Another company came in at {{amount}} all-in, guaranteed. Can you match that number? Same job, same date.",
    },
    {
      id: "cap_total",
      requires: null,
      script:
        "One thing I need before booking: can you put a guaranteed not-to-exceed total in writing? No surprises on move day.",
    },
  ],

  vendorPolicyCards: [
    {
      id: "honest",
      businessName: "Two Brothers Moving",
      voiceId: VOICES.honest,
      persona:
        "Family-run local mover, 15 years in Rock Hill. Straight shooter — quotes are itemised up front and the number he says is the number you pay. Proud of his crew, hates the fly-by-night outfits undercutting him.",
      pricing: {
        openingTotal: 1950,
        floor: 1750,
        hiddenFees: [],
        guaranteedWillingly: true,
      },
      matchBehavior:
        "Will shave up to $200 off the opening price when shown a credible written competing quote for the same scope. Never goes below the floor — 'below that we lose money, and we don't do that.'",
      friction: ["asks_clarifying_questions"],
      aiReaction:
        "Mildly amused when told he's talking to an AI assistant — 'huh, first time for everything' — then carries on completely normally.",
    },
    {
      id: "lowball",
      businessName: "QuickBudget Movers",
      voiceId: VOICES.lowball,
      persona:
        "High-volume budget operation. Sales guy quotes low to win the booking and lets the fees show up on move day. Fast talker, allergic to specifics, treats every question as an obstacle to closing.",
      pricing: {
        openingTotal: 1150,
        floor: 1100,
        hiddenFees: [
          { feeKey: "truck_travel", amount: 250, revealWhen: "pressed_twice" },
          { feeKey: "stairs", amount: 150, revealWhen: "asked_directly" },
          { feeKey: "fuel", amount: 120, revealWhen: "asked_directly" },
        ],
        guaranteedWillingly: false,
      },
      matchBehavior:
        "Already the cheapest on paper and knows it. Will never put a guaranteed total in writing — 'the estimate is the estimate, final depends on the day.'",
      friction: ["interrupts", "vague_first_answer", "callback_deflect_once"],
      aiReaction:
        "Suspicious — at some point asks 'wait, am I talking to a robot?' and needs the disclosure before continuing.",
    },
    {
      id: "premium",
      businessName: "White Glove Relocations",
      voiceId: VOICES.premium,
      persona:
        "Boutique full-service mover for people who don't ask the price. Polished, unhurried, sells the experience: trained crews, custom crating, white-glove everything. Considers itemising slightly beneath him.",
      pricing: {
        openingTotal: 2850,
        floor: 2100,
        hiddenFees: [],
        guaranteedWillingly: true,
      },
      matchBehavior:
        "Defends the premium at length. Drops the price meaningfully ONLY when shown a concrete competing bid with a real number — then finds sudden 'flexibility in the schedule' to get close to it. Vague pressure gets nothing.",
      friction: ["long_monologues", "reluctant_to_itemise"],
      aiReaction:
        "Perfectly professional about speaking with an AI — 'we work with assistants all the time.'",
    },
  ],
};

export default moving;
