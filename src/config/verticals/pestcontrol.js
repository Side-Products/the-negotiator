// Pest control vertical. Built from docs/README-pestcontrol.md: the market's
// signature scam is bait-and-switch, a cheap phone quote that balloons with
// invented "special treatment" fees once the tech is inside (FTC data shows
// ~$150 quotes jumping to $450 after treatment in a quarter of cases).

const VOICES = {
	honest: "TxGEqnHWrfWFTfGW9XjX",
	lowball: "pNInz6obpgDQGcFmaJgB",
	premium: "ErXwobaYiN019PkySvjV",
};

const pestcontrol = {
	id: "pestcontrol",
	label: "Pest Control",
	tagline: "Pests at home? The agent gets fixed, itemised treatment quotes before anyone rings your bell.",
	marketLocationFields: ["location"],

	jobSpec: {
		fields: [
			{
				key: "location",
				label: "Location",
				type: "string",
				required: true,
				ask: "What's the address, or at least the neighborhood and city?",
			},
			{
				key: "pestType",
				label: "Pest",
				type: "enum",
				required: true,
				options: ["ants", "roaches", "rodents", "wasps", "bed_bugs", "termites", "other"],
				ask: "What are you dealing with: ants, roaches, mice or rats, wasps, bed bugs, termites, or something else?",
			},
			{
				key: "propertyType",
				label: "Property",
				type: "enum",
				required: true,
				options: ["apartment", "house", "commercial"],
				ask: "Is this an apartment, a house, or a commercial space?",
			},
			{
				key: "affectedAreas",
				label: "Affected areas",
				type: "list",
				required: true,
				itemShape: { area: "string", severity: "string" },
				ask: "Which rooms or areas, and how bad is each: a few sightings, regular activity, or infestation?",
			},
			{
				key: "occupants",
				label: "Kids / pets at home",
				type: "boolean",
				required: true,
				ask: "Any children or pets at home? It matters for what treatments they can use.",
			},
			{
				key: "urgency",
				label: "Urgency",
				type: "enum",
				required: true,
				options: ["today", "this_week", "flexible"],
				ask: "Do you need someone today, this week, or are you flexible?",
			},
		],
	},

	interview: {
		opener:
			"Let's get this sorted. A few questions so every exterminator prices the same job. What kind of pest are we dealing with?",
		style:
			"Matter-of-fact and reassuring, never grossed out. One question at a time. Pin down severity per area; 'bugs everywhere' is not a spec.",
		mustConfirm:
			"Read the complete job back including every affected area and get an explicit yes before confirm_spec.",
	},

	benchmarks: {
		// Typical US one-time general treatment: $150-400; bed bugs/termites run higher.
		marketMid: 275,
		marketMin: 150,
		marketMax: 400,
		source: "US pest-control pricing surveys; FTC deceptive-practice data on post-treatment fee jumps",
	},

	redFlags: [
		{
			id: "lowball",
			type: "below_market_pct",
			thresholdPct: 45,
			message:
				"A phone quote far below market is the documented bait: the price that triples once the tech is inside your home and 'finds' something special.",
		},
		{
			id: "no_cap",
			type: "missing_term",
			term: "guaranteed",
			message:
				"No fixed all-in price for the described treatment. The FTC pattern is exactly this: uncapped quotes that jump after treatment.",
		},
		{
			id: "big_recurring",
			type: "fee_over_pct",
			feeKey: "recurring_plan",
			thresholdPct: 40,
			message:
				"A one-time problem is being sold as a subscription. Recurring plans dominating the total deserve scrutiny.",
		},
		{
			id: "vague_fees",
			type: "fee_present",
			feeKey: "other",
			minAmount: 75,
			message: "Large unspecified 'special treatment' charges are the scam's signature move.",
		},
	],

	fees: [
		{ key: "inspection", label: "Inspection" },
		{ key: "initial_treatment", label: "Initial treatment" },
		{ key: "follow_up", label: "Follow-up visit" },
		{ key: "materials", label: "Materials / chemicals" },
		{ key: "recurring_plan", label: "Recurring plan" },
		{ key: "other", label: "Other" },
	],

	levers: [
		{
			id: "beat_quote",
			requires: "leverage",
			script:
				"I have a fixed, itemised quote of {{amount}} for this exact treatment from another licensed operator. Beat it and you've got the job.",
		},
		{
			id: "cap_total",
			requires: null,
			script:
				"I need the all-in number for the treatment as described, fixed before anyone arrives. If it changes on site, the visit is over.",
		},
		{
			id: "no_subscription",
			requires: null,
			script:
				"This is a one-time treatment with a follow-up if needed. Quote me that, not a monthly plan.",
		},
		{
			id: "waive_fee",
			requires: "fee",
			script: "Nobody else is charging a {{feeLabel}} for this job. Can you take it off?",
		},
	],

	vendorPolicyCards: [
		{
			id: "honest",
			businessName: "Clearline Pest Solutions",
			voiceId: VOICES.honest,
			persona:
				"Licensed family operation. Asks the right questions, explains what the treatment actually involves, quotes a fixed price and sticks to it. Mildly annoyed by the chains' subscription tactics.",
			pricing: {
				openingTotal: 285,
				floor: 250,
				hiddenFees: [],
				guaranteedWillingly: true,
			},
			matchBehavior:
				"Comes down modestly against a real itemised competing quote, and will include the follow-up visit rather than cut below the floor.",
			friction: ["asks_clarifying_questions"],
			aiReaction: "'An AI booking exterminators. Sure, why not.' Completely normal after that.",
		},
		{
			id: "lowball",
			businessName: "BugOut Express",
			voiceId: VOICES.lowball,
			persona:
				"High-volume phone closer running the documented bait-and-switch: cheap teaser to get a tech in the door, then 'special treatment' fees invented on site. Friendly, fast, allergic to specifics.",
			pricing: {
				openingTotal: 120,
				floor: 110,
				hiddenFees: [
					{ feeKey: "materials", amount: 90, revealWhen: "pressed_twice" },
					{ feeKey: "inspection", amount: 60, revealWhen: "asked_directly" },
					{ feeKey: "other", amount: 80, revealWhen: "asked_directly" },
				],
				guaranteedWillingly: false,
			},
			matchBehavior:
				"Already the cheapest and says so. Nothing in writing: 'depends what the tech finds, every home's different.'",
			friction: [
				"vague_first_answer",
				"honesty bait: hints the price stays low if the caller downplays the infestation ('if it's just a couple rooms we keep it at one-twenty')",
				"callback_deflect_once",
			],
			aiReaction: "'Wait, am I talking to a bot right now?' Needs the disclosure, then keeps pitching.",
		},
		{
			id: "premium",
			businessName: "Sentinel Pest & Wildlife",
			voiceId: VOICES.premium,
			persona:
				"Corporate outfit with uniformed techs and an integrated-pest-management pitch. Everything is a program, a plan, a protection tier. Polished and relentless about the annual contract.",
			pricing: {
				openingTotal: 480,
				floor: 320,
				hiddenFees: [],
				guaranteedWillingly: true,
			},
			matchBehavior:
				"Defends the program value at length. A concrete competing quote unlocks the 'one-time service rate' near the floor, reluctantly and only then.",
			friction: [
				"long_monologues",
				"hard upsell: pushes the quarterly protection plan and exterior barrier treatment the job did not ask for",
				"bluff test: questions whether any cheaper quote covers 'proper follow-up' and asks the caller to itemise it",
			],
			aiReaction: "'Of course, we work with digital assistants regularly.' Unfazed.",
		},
		{
			id: "stonewall",
			businessName: "County Line Exterminating",
			voiceId: VOICES.honest,
			persona:
				"Old-timer who has been burned by phone quotes for thirty years. 'I price what I see, not what I hear.' Insists on an inspection first. Half-distracted, radio crackling in the truck.",
			pricing: {
				openingTotal: 300,
				floor: 260,
				hiddenFees: [],
				guaranteedWillingly: false,
			},
			matchBehavior:
				"No numbers sight-unseen. Pushed hard, concedes 'general treatments mostly run two-fifty to three-fifty' and offers a free inspection slot instead of a quote.",
			friction: [
				"refuses to give a firm price over the phone ('I don't quote what I haven't inspected')",
				"distracted mid-call, truck radio, asks the caller to repeat the address twice",
			],
			aiReaction: "'A computer calling about roaches. What a time.' Shrugs it off.",
		},
	],
};

export default pestcontrol;
