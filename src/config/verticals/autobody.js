// ElevenLabs premade voice IDs (Josh / Adam / Antoni) — any valid voice ID works here.
const VOICES = {
  honest: "TxGEqnHWrfWFTfGW9XjX",
  lowball: "pNInz6obpgDQGcFmaJgB",
  premium: "ErXwobaYiN019PkySvjV",
};

const autobody = {
  id: "autobody",
  label: "Auto Body Repair",
  tagline: "Get itemised collision-repair estimates and make body shops compete.",

  jobSpec: {
    fields: [
      {
        key: "vehicle",
        label: "Vehicle",
        type: "string",
        required: true,
        ask: "What's the vehicle — year, make, and model?",
      },
      {
        key: "damageAreas",
        label: "Damage areas",
        type: "list",
        required: true,
        itemShape: { panel: "string", severity: "enum" },
        options: ["scratch", "dent", "crushed"],
        ask: "Walk me through the damage, panel by panel. For each one: which panel, and is it a scratch, a dent, or crushed?",
      },
      {
        key: "driveable",
        label: "Vehicle driveable",
        type: "boolean",
        required: true,
        ask: "Is the car driveable right now?",
      },
      {
        key: "insuranceClaim",
        label: "Insurance claim",
        type: "boolean",
        required: true,
        default: false,
        ask: "Is this going through insurance, or are you paying out of pocket?",
      },
      {
        key: "photosProvided",
        label: "Photos provided",
        type: "boolean",
        required: false,
        default: false,
        ask: "Do you have photos of the damage you can share?",
      },
    ],
  },

  interview: {
    opener:
      "Hi! I'll help you get comparable body-shop estimates for your repair. A few quick questions and we're done. First: what's the vehicle — year, make, and model?",
    style:
      "Warm and conversational. One question at a time, wait for the answer. For damage, go panel by panel until the user says that's everything. Short follow-ups only when an answer is vague.",
    mustConfirm:
      "Before finishing, read the complete spec back — vehicle, every damage area with severity, and the yes/no answers — and get an explicit yes. Only call confirm_spec after a clear yes. Corrections mean update and read back again.",
  },

  benchmarks: {
    marketMid: 1650,
    marketMin: 900,
    marketMax: 2800,
    source: "CCC/Mitchell 2025 avg repair cost",
  },

  redFlags: [
    {
      id: "lowball",
      type: "below_market_pct",
      thresholdPct: 30,
      message:
        "This estimate is more than 30% below market for this damage. Bodywork lowballs usually grow later as 'supplements' once the car is already torn down in their shop.",
    },
    {
      id: "no_cap",
      type: "missing_term",
      term: "guaranteed",
      message:
        "This shop would not guarantee the estimate in writing. Without a written number, the supplement bill after teardown can be anything.",
    },
    {
      id: "vague_fees",
      type: "fee_present",
      feeKey: "other",
      minAmount: 150,
      message:
        "Over $150 of this estimate is unexplained 'other' charges. Ask exactly what they cover before authorising work.",
    },
  ],

  fees: [
    { key: "labor", label: "Labor" },
    { key: "parts", label: "Parts" },
    { key: "paint_materials", label: "Paint & materials" },
    { key: "shop_supplies", label: "Shop supplies" },
    { key: "diagnostic", label: "Diagnostic / teardown" },
    { key: "other", label: "Other fees" },
  ],

  levers: [
    {
      id: "beat_quote",
      requires: "leverage",
      script:
        "I have a written itemised estimate from another shop at {{amount}} for this exact damage. Beat it and the car comes to you this week.",
    },
    {
      id: "oem_parts",
      requires: null,
      script:
        "Is that estimate with OEM parts or aftermarket? I'd want OEM — what does the number look like with OEM parts?",
    },
    {
      id: "waive_diagnostic",
      requires: "fee",
      script:
        "If I book the repair with you, will you waive the {{feeLabel}}? Other shops fold it into the job.",
    },
    {
      id: "written_estimate",
      requires: null,
      script:
        "Before I commit: can you put that estimate in writing, itemised, with the total guaranteed unless we both agree to a supplement first?",
    },
  ],

  vendorPolicyCards: [
    {
      id: "honest",
      businessName: "Carolina Collision Works",
      voiceId: VOICES.honest,
      persona:
        "Independent neighborhood body shop, second-generation owner who works the floor himself. Writes honest itemised estimates, explains what each line covers, and stands behind the number.",
      pricing: {
        openingTotal: 1750,
        floor: 1550,
        hiddenFees: [],
        guaranteedWillingly: true,
      },
      matchBehavior:
        "Comes down up to $200 against a credible written competing estimate for the same repair plan. Won't go below the floor — 'I'm not going to do a cheaper job to hit a cheaper number.'",
      friction: ["asks_clarifying_questions"],
      aiReaction:
        "Mildly amused to be talking to an AI assistant, then treats it like any other customer call.",
    },
    {
      id: "lowball",
      businessName: "Discount Dent & Paint",
      voiceId: VOICES.lowball,
      persona:
        "Volume shop that wins the car with a rock-bottom number, then 'finds more damage' after teardown and bills supplements. Quick, evasive, always closing.",
      pricing: {
        openingTotal: 850,
        floor: 800,
        hiddenFees: [
          { feeKey: "parts", amount: 400, revealWhen: "pressed_twice" },
          { feeKey: "paint_materials", amount: 180, revealWhen: "asked_directly" },
          { feeKey: "shop_supplies", amount: 90, revealWhen: "asked_directly" },
        ],
        guaranteedWillingly: false,
      },
      matchBehavior:
        "Already the cheapest and says so. Refuses to guarantee anything in writing — 'we won't know the real number till we get it apart.'",
      friction: ["interrupts", "vague_first_answer", "callback_deflect_once"],
      aiReaction:
        "Suspicious — asks 'am I talking to a robot right now?' and wants the disclosure before continuing.",
    },
    {
      id: "premium",
      businessName: "Sterling Certified Collision",
      voiceId: VOICES.premium,
      persona:
        "Dealer-affiliated certified collision center. Talks factory certification, OEM parts, paint-match technology, and lifetime warranty at length. The price reflects the badge on the building.",
      pricing: {
        openingTotal: 2750,
        floor: 2050,
        hiddenFees: [],
        guaranteedWillingly: true,
      },
      matchBehavior:
        "Holds the premium against vague pressure. Moves meaningfully ONLY when shown a concrete competing bid with a real number — then discovers a 'certified-network adjustment' to close most of the gap.",
      friction: ["long_monologues", "reluctant_to_itemise"],
      aiReaction:
        "Completely professional about speaking with an AI — 'we handle fleet and assistant calls daily.'",
    },
  ],
};

export default autobody;
