// Locksmith vertical. Built from docs/README-locksmith.md: lockouts are the
// classic panic purchase, and the market's signature scam is the fake-local
// call-center that dispatches from far away and bills the travel. US market
// pricing (FTC has sued fake locksmith networks in 30+ states).

const VOICES = {
	honest: "TxGEqnHWrfWFTfGW9XjX",
	lowball: "pNInz6obpgDQGcFmaJgB",
	premium: "ErXwobaYiN019PkySvjV",
};

const locksmith = {
	id: "locksmith",
	label: "Locksmith",
	tagline: "Locked out? The agent calls every locksmith nearby before you overpay in a panic.",
	marketLocationFields: ["location"],

	jobSpec: {
		fields: [
			{
				key: "location",
				label: "Location",
				type: "string",
				required: true,
				ask: "Where is the door? Street address or at least the neighborhood and city.",
			},
			{
				key: "serviceType",
				label: "Service needed",
				type: "enum",
				required: true,
				options: ["lockout_home", "lockout_car", "rekey", "lock_replacement", "broken_key_extraction"],
				ask: "What do you need: locked out of home or car, rekeying, replacing a lock, or a broken key stuck in the lock?",
			},
			{
				key: "lockType",
				label: "Lock type",
				type: "string",
				required: false,
				ask: "If you know it, what kind of lock is it? Standard pin, deadbolt, smart lock, high-security?",
			},
			{
				key: "urgency",
				label: "Urgency",
				type: "enum",
				required: true,
				options: ["right_now", "today", "this_week"],
				ask: "Is this an emergency right now, sometime today, or can it wait for an appointment this week?",
			},
			{
				key: "afterHours",
				label: "Night / weekend",
				type: "boolean",
				required: true,
				ask: "Is this outside normal business hours, meaning a night or weekend call-out?",
			},
			{
				key: "damageOk",
				label: "Non-destructive entry required",
				type: "boolean",
				required: false,
				default: true,
				ask: "Should they open it without damaging the lock, or is drilling acceptable if needed?",
			},
		],
	},

	interview: {
		opener:
			"Sorry you're dealing with this. A few quick questions and I'll get locksmiths pricing it. First, where's the door?",
		style:
			"Calm and quick. The caller may be stressed and standing outside. One short question at a time, no chit-chat, confirm the essentials and move on.",
		mustConfirm:
			"Read the complete job back and get an explicit yes before confirm_spec. Speed matters, but the spec must still be confirmed.",
	},

	benchmarks: {
		// Typical US lockout: $75-150 service call daytime, $150-250 after hours.
		marketMid: 150,
		marketMin: 75,
		marketMax: 250,
		source: "US lockout pricing surveys; FTC actions against fake locksmith networks",
	},

	redFlags: [
		{
			id: "lowball",
			type: "below_market_pct",
			thresholdPct: 60,
			message:
				"A teaser quote far below market is the classic locksmith bait: the '$19 service call' that becomes hundreds on site. Treat it as the start of a scam, not a deal.",
		},
		{
			id: "no_cap",
			type: "missing_term",
			term: "guaranteed",
			message:
				"No all-in total in writing. Lockout bills are inflated on the doorstep when the price was never fixed on the phone.",
		},
		{
			id: "travel_padding",
			type: "fee_over_pct",
			feeKey: "travel",
			thresholdPct: 40,
			message:
				"Travel is a large share of the total, the signature of a call-center dispatching from far away while claiming to be local.",
		},
		{
			id: "vague_fees",
			type: "fee_present",
			feeKey: "other",
			minAmount: 50,
			message: "Unspecified extras on a job this simple deserve an explanation.",
		},
	],

	fees: [
		{ key: "service_call", label: "Service call-out" },
		{ key: "labor", label: "Labor" },
		{ key: "travel", label: "Travel" },
		{ key: "parts", label: "Parts / hardware" },
		{ key: "after_hours", label: "After-hours surcharge" },
		{ key: "other", label: "Other" },
	],

	levers: [
		{
			id: "beat_quote",
			requires: "leverage",
			script:
				"I already have a confirmed all-in quote of {{amount}} from a locksmith nearby. If you can beat it, the job is yours right now.",
		},
		{
			id: "local_dispatch",
			requires: null,
			script:
				"Are you dispatching someone who is actually local, and where is the technician coming from? I'm not paying travel from another city.",
		},
		{
			id: "cap_total",
			requires: null,
			script:
				"Before anyone drives over: give me the all-in total for this exact job, fixed. If the tech quotes more on site, we send them back.",
		},
		{
			id: "waive_fee",
			requires: "fee",
			script: "Others aren't charging a {{feeLabel}} for this. Can you drop it?",
		},
	],

	vendorPolicyCards: [
		{
			id: "honest",
			businessName: "Keystone Lock & Door",
			voiceId: VOICES.honest,
			persona:
				"Licensed local locksmith, one van, twenty years on the same streets. Quotes the real all-in number up front and is sick of the fake-local outfits poisoning the trade.",
			pricing: {
				openingTotal: 140,
				floor: 120,
				hiddenFees: [],
				guaranteedWillingly: true,
			},
			matchBehavior:
				"Will come down about $20 against a confirmed nearby quote. Below the floor he wishes you luck, politely.",
			friction: ["asks_clarifying_questions"],
			aiReaction: "Unbothered. 'Long as somebody pays the invoice, I don't care who calls.'",
		},
		{
			id: "lowball",
			businessName: "1st Choice 24/7 Locksmith",
			voiceId: VOICES.lowball,
			persona:
				"Call-center dispatcher for a network that advertises everywhere with fake local numbers. Quotes a teaser price to get a tech in front of your door, where the real bill appears.",
			pricing: {
				openingTotal: 35,
				floor: 30,
				hiddenFees: [
					{ feeKey: "labor", amount: 120, revealWhen: "pressed_twice" },
					{ feeKey: "travel", amount: 85, revealWhen: "asked_directly" },
					{ feeKey: "after_hours", amount: 60, revealWhen: "asked_directly" },
				],
				guaranteedWillingly: false,
			},
			matchBehavior:
				"The $35 is 'just the service call, the tech prices the rest on site.' Nothing goes in writing, ever.",
			friction: [
				"vague_first_answer",
				"dodges the question of where the technician is actually dispatched from ('we have someone in your area')",
				"callback_deflect_once",
			],
			aiReaction: "Asks 'is this a real person?' once, then keeps selling either way after the disclosure.",
		},
		{
			id: "premium",
			businessName: "SecureHome Master Locksmiths",
			voiceId: VOICES.premium,
			persona:
				"High-end security outfit that treats a lockout as a security consultation. Bonded, insured, name-drops certifications, and would love to upgrade your whole door while they're there.",
			pricing: {
				openingTotal: 320,
				floor: 190,
				hiddenFees: [],
				guaranteedWillingly: true,
			},
			matchBehavior:
				"Defends the premium as 'what licensed and insured costs.' Moves seriously only when shown a concrete competing all-in quote, then finds a 'standard-service rate' close to it.",
			friction: [
				"long_monologues",
				"hard upsell: pushes a lock upgrade and a 'security assessment' the job did not ask for",
				"bluff test: doubts any cheap competing quote is from a licensed shop and asks the caller to itemise it",
			],
			aiReaction: "Smooth. 'We handle calls from assistants all the time, no trouble at all.'",
		},
		{
			id: "stonewall",
			businessName: "Bolt & Barrel Security",
			voiceId: VOICES.honest,
			persona:
				"Gruff owner-operator mid-job with a drill going in the background. Doesn't quote sight unseen because 'every door lies.' Short answers, half-distracted, not rude but close.",
			pricing: {
				openingTotal: 180,
				floor: 160,
				hiddenFees: [],
				guaranteedWillingly: false,
			},
			matchBehavior:
				"Won't commit to a number without seeing the door. Pushed hard, allows 'standard lockouts mostly run one-fifty to two hundred' and offers to have the tech call back.",
			friction: [
				"refuses to give a firm price over the phone ('can't price a door I haven't seen')",
				"distracted mid-call, drill noise, asks the caller to repeat things",
			],
			aiReaction: "'A robot calling a locksmith. There it is.' Carries on regardless.",
		},
	],
};

export default locksmith;
