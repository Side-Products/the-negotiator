import mongoose from "mongoose";
import { validateSpec, validationMessage } from "@/backend/services/jobSpec";

const jobSchema = new mongoose.Schema(
  {
    vertical: { type: String, required: true },
    // Object keyed by taxonomy field key (shape comes from the vertical config).
    spec: { type: mongoose.Schema.Types.Mixed, default: {} },
    specVersion: { type: Number, default: 1 },
    specSource: { type: String, enum: ["voice", "doc", "both"] },
    // Which channel created the job (chat bots stamp themselves; web is default).
    source: { type: String, enum: ["web", "whatsapp", "telegram"], default: "web" },
    confirmed: { type: Boolean, default: false },
    confirmedAt: { type: Date },
    status: {
      type: String,
      enum: ["draft", "confirmed", "calling", "negotiating", "done"],
      default: "draft",
    },
    intakeConversationId: { type: String },
    sourceDocKey: { type: String }, // Wasabi key of the uploaded intake document
    report: {
      ranking: [
        {
          quoteId: { type: mongoose.Schema.Types.ObjectId, ref: "Quote" },
          rank: { type: Number },
          landedTotal: { type: Number },
          riskAdjusted: { type: Number }, // expected cost after overrun adjustment
          riskNote: { type: String },
        },
      ],
      recommendedQuoteId: { type: mongoose.Schema.Types.ObjectId, ref: "Quote" },
      narrative: { type: String },
      generatedAt: { type: Date },
    },
  },
  { timestamps: true },
);

jobSchema.pre("validate", function validateDynamicSpec() {
  const result = validateSpec(this.vertical, this.spec || {}, {
    requireComplete: this.confirmed,
  });
  if (!result.valid) {
    this.invalidate("spec", validationMessage(result.errors));
    return;
  }
  this.spec = result.spec;
  this.markModified("spec");
});

export default mongoose.models.Job || mongoose.model("Job", jobSchema);
