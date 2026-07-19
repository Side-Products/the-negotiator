import mongoose from "mongoose";

const telegramSessionSchema = new mongoose.Schema(
	{
			chatId: { type: String, required: true, unique: true },
			jobId: { type: mongoose.Schema.Types.ObjectId, ref: "Job" },
			vertical: { type: String },
			// pick_vertical -> intake -> confirm_location/awaiting_confirmation -> done
			stage: { type: String, default: "pick_vertical" },
			lastUpdateId: { type: Number },
			pendingPatch: { type: mongoose.Schema.Types.Mixed },
			pendingReply: { type: String },
			pendingConfirmations: { type: mongoose.Schema.Types.Mixed },
			messages: [
			{
				role: { type: String, enum: ["user", "assistant"] },
				content: { type: String },
			},
		],
	},
	{ timestamps: true },
);

export default mongoose.models.TelegramSession ||
	mongoose.model("TelegramSession", telegramSessionSchema);
