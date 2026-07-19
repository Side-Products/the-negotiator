import mongoose from "mongoose";

const callSchema = new mongoose.Schema(
  {
    jobId: { type: mongoose.Schema.Types.ObjectId, ref: "Job", required: true },
    specVersion: { type: Number },
    vendorName: { type: String },
    policyCardId: { type: String },
    round: { type: Number, enum: [1, 2], default: 1 },
    // counter: agent-vs-agent with a real ElevenLabs vendor agent on the other side
    mode: { type: String, enum: ["sim", "roleplay", "real", "counter"], default: "sim" },
    phone: { type: String }, // real calls: the business number dialed
    isTest: { type: Boolean, default: false }, // test dial to the user's own phone
    placeId: { type: String }, // Google Places id of the business (links out)
    rating: { type: Number }, // Google rating at discovery time
    batch: { type: Number }, // 1-based batch index for server-driven batch calls
    pricingJitter: { type: Number, default: 1 }, // per-vendor scale on the policy card's prices
    status: {
      type: String,
      enum: ["pending", "live", "done", "failed"],
      default: "pending",
    },
    statusDetail: { type: String }, // real calls: dialing / in-progress / processing…
    elevenConversationId: { type: String },
    transcript: [
      {
        role: { type: String },
        text: { type: String },
        turnIndex: { type: Number },
        at: { type: Date },
      },
    ],
    elevenTranscript: { type: mongoose.Schema.Types.Mixed },
    recordingPath: { type: String },
    leverageQuoteIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Quote" }],
    negotiationEvents: [
      {
        leverId: { type: String },
        beforeTotal: { type: Number },
        afterTotal: { type: Number },
        citedQuoteId: { type: mongoose.Schema.Types.ObjectId, ref: "Quote" },
        turnRef: { type: Number },
        note: { type: String },
      },
    ],
    outcome: {
      type: { type: String, enum: ["quote", "callback", "declined"] },
      note: { type: String },
      turnRef: { type: Number },
    },
  },
  { timestamps: true },
);

export default mongoose.models.Call || mongoose.model("Call", callSchema);
