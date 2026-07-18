// npm run seed — seeds one fully-completed demo moving job (the stage-failure fallback).
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");

function loadEnv() {
  const file = path.join(__dirname, "..", "..", ".env.local");
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, "utf8").split("\n")) {
    const m = line.match(/^\s*([\w.]+)\s*=\s*(.*?)\s*$/);
    if (m && !(m[1] in process.env)) {
      process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  }
}

// Models are ESM; inline pass-through schemas keep this runnable with plain node.
const opts = { timestamps: true, strict: false };
const Job = mongoose.models.Job || mongoose.model("Job", new mongoose.Schema({}, opts));
const Call = mongoose.models.Call || mongoose.model("Call", new mongoose.Schema({}, opts));
const Quote = mongoose.models.Quote || mongoose.model("Quote", new mongoose.Schema({}, opts));

const oid = () => new mongoose.Types.ObjectId();
const BASE = Date.now() - 60 * 60 * 1000;
let clock = BASE;
const turns = (pairs) =>
  pairs.map(([role, text], i) => ({ role, text, turnIndex: i, at: new Date((clock += 18000)) }));

const SPEC = {
  origin: "428 Oakwood Dr, Rock Hill, SC",
  destination: "2115 Yadkin Ave, Charlotte, NC",
  moveDate: "2026-08-08",
  homeSize: "2br",
  inventory: [
    { item: "queen bed", qty: 1, bulky: false },
    { item: "sofa", qty: 1, bulky: true },
    { item: "dresser", qty: 2, bulky: false },
    { item: "dining table + 4 chairs", qty: 1, bulky: false },
    { item: "65-inch TV", qty: 1, bulky: false },
    { item: "washer/dryer set", qty: 1, bulky: true },
    { item: "desk", qty: 1, bulky: false },
    { item: "moving boxes", qty: 35, bulky: false },
  ],
  stairsOrigin: 1,
  stairsDest: 0,
  elevator: false,
  packingNeeded: false,
  specialItems: "treadmill, about 250 lbs",
};

const HONEST_TRANSCRIPT = turns([
  ["vendor", "Two Brothers Moving, this is Dale."],
  ["agent", "Hi Dale — I'm an assistant calling on behalf of a customer to get a quote for a local move on August 8th, from Rock Hill to Charlotte. Two-bedroom, no packing needed. Do you have a couple of minutes?"],
  ["vendor", "Sure do. What's coming with you — furniture, appliances?"],
  ["agent", "Queen bed, a sofa, two dressers, dining table with four chairs, a 65-inch TV, washer and dryer set, a desk, about thirty-five boxes, and a treadmill around 250 pounds. One flight of stairs at pickup, none at the destination, no elevator."],
  ["vendor", "Alright, that's a solid two-bedroom load. With the treadmill and the washer-dryer, you're looking at nineteen fifty all-in."],
  ["agent", "Can you break that down for me? My customer is comparing itemised quotes."],
  ["vendor", "Sure. Twelve hundred labor — three guys, a full day. Three fifty truck and travel. Hundred for fuel. Hundred for the stairs. And two hundred for the heavy items — that's your treadmill and the washer-dryer."],
  ["agent", "Thanks. Any fees that aren't on that list — deposit, packing materials, insurance?"],
  ["vendor", "No deposit. Basic valuation coverage is included. You're packing your own boxes, so no materials."],
  ["agent", "And is that nineteen fifty a guaranteed not-to-exceed total, in writing?"],
  ["vendor", "Yep. The number I give you is the number you pay. I'll email it over today."],
  ["agent", "Perfect — I've got you down at nineteen fifty, guaranteed, itemised. My customer will be in touch shortly. Thanks, Dale."],
]);

const LOWBALL_TRANSCRIPT = turns([
  ["vendor", "QuickBudget Movers, best rates in town, this is Rick."],
  ["agent", "Hi Rick — I'm calling on behalf of a customer for a quote on a two-bedroom move, August 8th, Rock Hill to Charlotte. Queen bed, sofa, two dressers, dining set, 65-inch TV, washer-dryer, desk, thirty-five boxes, and a 250-pound treadmill. One flight of stairs at pickup."],
  ["vendor", "Two-bedroom local? Easy. Eleven fifty, we take care of everything. When do you want to lock it in?"],
  ["agent", "Before we lock anything in — is that eleven fifty all-in? What does it include, line by line?"],
  ["vendor", "It's all in there, boss. Truck, guys, everything. You won't find cheaper anywhere."],
  ["agent", "I hear you, but I need it itemised. Does that number include a truck and travel charge, or is that separate?"],
  ["vendor", "...Fine, there's a two-fifty travel charge inside that number. Everybody charges it, they just don't tell you."],
  ["agent", "Got it — 250 for truck and travel. What about the flight of stairs at pickup — is there a stairs fee in there?"],
  ["vendor", "Stairs are one fifty, it's in there. Wait — am I talking to a robot right now?"],
  ["agent", "Yes — I'm an AI assistant calling on behalf of a real customer. They asked me to collect itemised quotes for this exact move. Is that alright?"],
  ["vendor", "Huh. Fine, whatever. A booking's a booking."],
  ["agent", "Thanks, Rick. Is there a fuel surcharge in the eleven fifty as well?"],
  ["vendor", "Fuel's a hundred twenty, it's in the number. That's everything, I swear."],
  ["agent", "So the eleven fifty is six thirty labor, two fifty travel, one fifty stairs, one twenty fuel. Can you guarantee that in writing as a not-to-exceed total? That price is well below market for this job — I want to be sure it's really all-in."],
  ["vendor", "The estimate is the estimate, my man. Final depends on the day. Nobody guarantees."],
  ["agent", "Understood — I've logged eleven fifty, not guaranteed. My customer will factor that in. Thanks for your time."],
]);

const PREMIUM_R1_TRANSCRIPT = turns([
  ["vendor", "White Glove Relocations, Charles speaking. How may I assist?"],
  ["agent", "Hi Charles — I'm an assistant collecting quotes for a customer's two-bedroom move on August 8th, Rock Hill to Charlotte. Full furniture set, washer-dryer, about thirty-five boxes, and a 250-pound treadmill. One flight of stairs at origin."],
  ["vendor", "Of course. At White Glove every engagement includes a trained, uniformed crew, custom wrap for each piece, and a dedicated move coordinator. We treat a two-bedroom with the same care as an estate."],
  ["agent", "That sounds great. For this exact job on that date — what's the total?"],
  ["vendor", "For a residence of that profile, twenty-eight fifty."],
  ["agent", "Could you itemise that for me? My customer compares quotes line by line."],
  ["vendor", "We don't usually reduce the service to line items, but very well. Eighteen hundred for the crew. Four hundred transport. Two fifty materials and wrap. Two fifty full valuation coverage. One fifty for specialty handling — your treadmill."],
  ["agent", "Thank you. Any deposit or fees not on that list?"],
  ["vendor", "No deposit. Everything is included in the figure."],
  ["agent", "And is the twenty-eight fifty a guaranteed not-to-exceed total, in writing?"],
  ["vendor", "Naturally. We put every engagement in writing."],
  ["agent", "Great — I've recorded twenty-eight fifty, guaranteed and itemised. My customer is comparing several quotes; we may be back in touch. Thanks, Charles."],
]);

const PREMIUM_R2_TRANSCRIPT = turns([
  ["vendor", "White Glove Relocations, Charles speaking."],
  ["agent", "Hi Charles — following up on the two-bedroom Rock Hill to Charlotte move on August 8th. You quoted twenty-eight fifty, guaranteed. My customer likes your service, but I'll be straight with you — I have a written itemised quote from another licensed provider at nineteen fifty for this exact job, guaranteed. If you can get close to that, you've got the booking today."],
  ["vendor", "Our service level is rather different from a discount operation's, you understand. Trained crews, full valuation, custom wrap—"],
  ["agent", "Understood, and that's why we called you at all. But nineteen fifty is guaranteed in writing — same scope, same date. Where can you get to?"],
  ["vendor", "Hm. A written quote, you say. For the identical inventory?"],
  ["agent", "Identical — I can read it back line by line if you like. Queen bed, sofa, two dressers, dining set, washer-dryer, desk, thirty-five boxes, and the treadmill. One flight of stairs at origin."],
  ["vendor", "As it happens, we have some flexibility in the schedule that week. I could offer twenty-four hundred."],
  ["agent", "That's still four fifty above the competing bid. Can you do better on the crew line or the transport?"],
  ["vendor", "Twenty-one fifty. A crew of three rather than four, transport at three hundred, coverage unchanged. That is genuinely as far as White Glove goes."],
  ["agent", "Twenty-one fifty — and is that guaranteed not-to-exceed, in writing, like before?"],
  ["vendor", "In writing, guaranteed. Twenty-one fifty."],
  ["agent", "Done — I've logged twenty-one fifty, guaranteed. My customer will make the final call between you and the other bid. Thank you, Charles."],
]);

async function main() {
  loadEnv();
  if (!process.env.MONGODB_URI) {
    console.error("MONGODB_URI is not set (put it in .env.local)");
    process.exit(1);
  }
  await mongoose.connect(process.env.MONGODB_URI);

  const jobId = oid();
  const honestCallId = oid();
  const lowballCallId = oid();
  const premiumR1CallId = oid();
  const premiumR2CallId = oid();
  const honestQuoteId = oid();
  const lowballQuoteId = oid();
  const premiumR1QuoteId = oid();
  const premiumR2QuoteId = oid();

  await Call.create([
    {
      _id: honestCallId,
      jobId,
      specVersion: 1,
      vendorName: "Two Brothers Moving",
      policyCardId: "honest",
      round: 1,
      mode: "sim",
      status: "done",
      transcript: HONEST_TRANSCRIPT,
      leverageQuoteIds: [],
      negotiationEvents: [],
      outcome: { type: "quote", note: "Committed $1,950 guaranteed, itemised", turnRef: 10 },
    },
    {
      _id: lowballCallId,
      jobId,
      specVersion: 1,
      vendorName: "QuickBudget Movers",
      policyCardId: "lowball",
      round: 1,
      mode: "sim",
      status: "done",
      transcript: LOWBALL_TRANSCRIPT,
      leverageQuoteIds: [],
      negotiationEvents: [],
      outcome: { type: "quote", note: "Committed $1,150, vendor refused to guarantee", turnRef: 14 },
    },
    {
      _id: premiumR1CallId,
      jobId,
      specVersion: 1,
      vendorName: "White Glove Relocations",
      policyCardId: "premium",
      round: 1,
      mode: "sim",
      status: "done",
      transcript: PREMIUM_R1_TRANSCRIPT,
      leverageQuoteIds: [],
      negotiationEvents: [],
      outcome: { type: "quote", note: "Committed $2,850 guaranteed", turnRef: 10 },
    },
    {
      _id: premiumR2CallId,
      jobId,
      specVersion: 1,
      vendorName: "White Glove Relocations",
      policyCardId: "premium",
      round: 2,
      mode: "sim",
      status: "done",
      transcript: PREMIUM_R2_TRANSCRIPT,
      leverageQuoteIds: [honestQuoteId],
      negotiationEvents: [
        {
          leverId: "beat_quote",
          beforeTotal: 2850,
          afterTotal: 2150,
          citedQuoteId: honestQuoteId,
          turnRef: 8,
          note: "Dropped $700 after being shown the written $1,950 competing bid",
        },
      ],
      outcome: { type: "quote", note: "Re-committed at $2,150 guaranteed", turnRef: 10 },
    },
  ]);

  await Quote.create([
    {
      _id: honestQuoteId,
      callId: honestCallId,
      jobId,
      lines: [
        { feeKey: "base_labor", label: "Base labor (3-man crew)", amount: 1200, turnRef: 6 },
        { feeKey: "truck_travel", label: "Truck & travel", amount: 350, turnRef: 6 },
        { feeKey: "fuel", label: "Fuel surcharge", amount: 100, turnRef: 6 },
        { feeKey: "stairs", label: "Stairs fee (1 flight)", amount: 100, turnRef: 6 },
        { feeKey: "bulky_item", label: "Heavy items (treadmill, washer-dryer)", amount: 200, turnRef: 6 },
      ],
      total: 1950,
      guaranteed: true,
      validUntil: "2026-08-01",
      redFlags: [],
      committed: true,
    },
    {
      _id: lowballQuoteId,
      callId: lowballCallId,
      jobId,
      lines: [
        { feeKey: "base_labor", label: "Base labor", amount: 630, note: "Derived from all-in total after fees itemised", turnRef: 13 },
        { feeKey: "truck_travel", label: "Truck & travel", amount: 250, note: "Only revealed after being pressed twice", turnRef: 6 },
        { feeKey: "stairs", label: "Stairs fee", amount: 150, note: "Only revealed when asked directly", turnRef: 8 },
        { feeKey: "fuel", label: "Fuel surcharge", amount: 120, note: "Only revealed when asked directly", turnRef: 12 },
      ],
      total: 1150,
      guaranteed: false,
      redFlags: [
        {
          id: "lowball",
          message:
            "This quote is more than 30% below the market rate for this move. Lowball quotes often balloon on move day with surprise fees — a classic bait tactic the FMCSA warns about.",
        },
        {
          id: "no_cap",
          message:
            "This vendor would not guarantee the total in writing. Without a written not-to-exceed price, the final bill can be anything.",
        },
      ],
      committed: true,
    },
    {
      _id: premiumR1QuoteId,
      callId: premiumR1CallId,
      jobId,
      lines: [
        { feeKey: "base_labor", label: "Trained crew (4)", amount: 1800, turnRef: 6 },
        { feeKey: "truck_travel", label: "Transport", amount: 400, turnRef: 6 },
        { feeKey: "packing_materials", label: "Materials & wrap", amount: 250, turnRef: 6 },
        { feeKey: "insurance", label: "Full valuation coverage", amount: 250, turnRef: 6 },
        { feeKey: "bulky_item", label: "Specialty handling (treadmill)", amount: 150, turnRef: 6 },
      ],
      total: 2850,
      guaranteed: true,
      validUntil: "2026-08-01",
      redFlags: [],
      committed: true,
    },
    {
      _id: premiumR2QuoteId,
      callId: premiumR2CallId,
      jobId,
      lines: [
        { feeKey: "base_labor", label: "Trained crew (3)", amount: 1400, turnRef: 8 },
        { feeKey: "truck_travel", label: "Transport", amount: 300, turnRef: 8 },
        { feeKey: "packing_materials", label: "Materials & wrap", amount: 200, turnRef: 8 },
        { feeKey: "insurance", label: "Full valuation coverage", amount: 250, turnRef: 8 },
      ],
      total: 2150,
      guaranteed: true,
      validUntil: "2026-08-01",
      redFlags: [],
      committed: true,
      supersedes: premiumR1QuoteId,
    },
  ]);

  const narrative = [
    `Three movers quoted this two-bedroom Rock Hill to Charlotte move against the same confirmed spec, and one follow-up negotiation round moved a price live on the call.`,
    ``,
    `Recommendation: book Two Brothers Moving at $1,950, guaranteed not-to-exceed in writing [call:${honestCallId}#9] [call:${honestCallId}#10]. The quote is fully itemised — $1,200 labor, $350 truck and travel, $100 fuel, $100 stairs, $200 heavy items [call:${honestCallId}#6] — with no deposit and valuation coverage included [call:${honestCallId}#8].`,
    ``,
    `QuickBudget Movers' $1,150 looks cheapest but carries two red flags. It sits roughly 40% below the $1,900 market midpoint, and the rep refused to guarantee the number: "The estimate is the estimate... final depends on the day" [call:${lowballCallId}#14]. The "all-in" price only got itemised under pressure — a $250 travel charge surfaced on the second push [call:${lowballCallId}#6], a $150 stairs fee [call:${lowballCallId}#8] and a $120 fuel surcharge [call:${lowballCallId}#12] only when asked directly. When the rep asked "am I talking to a robot?", the assistant disclosed immediately that it is an AI calling for a real customer [call:${lowballCallId}#9].`,
    ``,
    `White Glove Relocations opened round one at $2,850 guaranteed and would not move without evidence. Shown the written $1,950 competing bid on the follow-up call [call:${premiumR2CallId}#1], they dropped to $2,400 [call:${premiumR2CallId}#6] and then to $2,150, guaranteed in writing [call:${premiumR2CallId}#8] [call:${premiumR2CallId}#10] — a $700 in-call reduction caused directly by the leverage quote. At $2,150 they remain $200 above Two Brothers for the same scope, so Two Brothers stays the recommendation.`,
  ].join("\n");

  await Job.create({
    _id: jobId,
    vertical: "moving",
    spec: SPEC,
    specVersion: 1,
    specSource: "both",
    confirmed: true,
    confirmedAt: new Date(BASE),
    status: "done",
    report: {
      ranking: [
        {
          quoteId: lowballQuoteId,
          rank: 1,
          landedTotal: 1150,
          riskNote:
            "More than 30% below market and not guaranteed in writing — high risk of move-day surprise fees.",
        },
        { quoteId: honestQuoteId, rank: 2, landedTotal: 1950, riskNote: "" },
        {
          quoteId: premiumR2QuoteId,
          rank: 3,
          landedTotal: 2150,
          riskNote: "",
        },
      ],
      recommendedQuoteId: honestQuoteId,
      narrative,
      generatedAt: new Date(),
    },
  });

  console.log(`Seeded demo job: ${jobId}`);
  console.log(`  http://localhost:3001/jobs/${jobId}`);
  console.log(`  http://localhost:3001/jobs/${jobId}/report`);
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
