import mongoose from "mongoose";

const whatsappSessionSchema = new mongoose.Schema(
	{
		phone: { type: String, required: true, unique: true },
		jobId: { type: mongoose.Schema.Types.ObjectId, ref: "Job" },
		vertical: { type: String },
		// "pick_vertical" → "intake" → "done"
		stage: { type: String, default: "pick_vertical" },
		messages: [
			{
				role: { type: String, enum: ["user", "assistant"] },
				content: { type: String },
			},
		],
	},
	{ timestamps: true },
);

export default mongoose.models.WhatsappSession ||
	mongoose.model("WhatsappSession", whatsappSessionSchema);
