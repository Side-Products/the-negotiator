import mongoose from "mongoose";

const quoteSchema = new mongoose.Schema(
  {
    callId: { type: mongoose.Schema.Types.ObjectId, ref: "Call", required: true },
    jobId: { type: mongoose.Schema.Types.ObjectId, ref: "Job", required: true },
    lines: [
      {
        feeKey: { type: String },
        label: { type: String },
        amount: { type: Number },
        note: { type: String },
        turnRef: { type: Number },
      },
    ],
    total: { type: Number },
    guaranteed: { type: Boolean },
    validUntil: { type: String },
    redFlags: [
      {
        id: { type: String },
        message: { type: String },
      },
    ],
    committed: { type: Boolean, default: false },
    supersedes: { type: mongoose.Schema.Types.ObjectId, ref: "Quote" },
  },
  { timestamps: true },
);

export default mongoose.models.Quote || mongoose.model("Quote", quoteSchema);
