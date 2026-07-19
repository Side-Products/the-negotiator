import dbConnect from "@/lib/dbConnect";
import WhatsappSession from "@/backend/models/whatsappSession";
import { validateTwilioRequest } from "@/backend/services/whatsapp";
import {
	isRestart,
	processChatIntake,
	verticalMenu,
} from "@/backend/services/chatIntake";

const twiml = (text) =>
	`<?xml version="1.0" encoding="UTF-8"?><Response><Message>${String(text || "")
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")}</Message></Response>`;

const jobLink = (jobId) => {
	const base = (process.env.PUBLIC_BASE_URL || "http://localhost:3001").replace(/\/$/, "");
	return `${base}/jobs/${jobId}`;
};

export default async function handler(req, res) {
	if (req.method !== "POST") {
		return res.status(405).json({ error: "Method not allowed" });
	}

	try {
		await dbConnect();
		const url = `${process.env.PUBLIC_BASE_URL || ""}/api/whatsapp/webhook`;
		if (process.env.PUBLIC_BASE_URL && !validateTwilioRequest(req, url)) {
			return res.status(403).json({ error: "Invalid Twilio signature" });
		}

		const from = req.body.From;
		const text = (req.body.Body || "").trim();
		const messageSid = req.body.MessageSid;
		if (!from) return res.status(400).json({ error: "Missing From" });
		res.setHeader("Content-Type", "text/xml");

		let session = await WhatsappSession.findOne({ phone: from });
		if (session && messageSid && session.lastMessageSid === messageSid) {
			return res.status(200).send(twiml(""));
		}

		if (!session || isRestart(text)) {
			if (session) await session.deleteOne();
			session = await WhatsappSession.create({
				phone: from,
				...(messageSid ? { lastMessageSid: messageSid } : {}),
			});
			return res.status(200).send(twiml(verticalMenu()));
		}

		if (messageSid) {
			const claimed = await WhatsappSession.findOneAndUpdate(
				{ _id: session._id, lastMessageSid: { $ne: messageSid } },
				{ $set: { lastMessageSid: messageSid } },
				{ new: true },
			);
			if (!claimed) return res.status(200).send(twiml(""));
			session = claimed;
		}

		const result = await processChatIntake(session, text, { channel: "WhatsApp" });
		if (result.confirmed) {
			return res.status(200).send(
				twiml(
					`✅ Spec confirmed! Track calls and quotes here:\n${jobLink(result.jobId)}\n\nSend "restart" to start a new job.`,
				),
			);
		}
		if (result.done) {
			return res.status(200).send(
				twiml(
					`Your job is in progress: ${jobLink(result.jobId)}\nSend "restart" to start a new one.`,
				),
			);
		}
		return res.status(200).send(twiml(result.text));
	} catch (error) {
		console.error("whatsapp webhook error:", error);
		res.setHeader("Content-Type", "text/xml");
		return res
			.status(200)
			.send(
				twiml(
					"⚠️ Something went wrong. Your previous answers are still saved, so please try again.",
				),
			);
	}
}
