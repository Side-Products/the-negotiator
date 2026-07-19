import dbConnect from "@/lib/dbConnect";
import TelegramSession from "@/backend/models/telegramSession";
import {
	isRestart,
	processChatIntake,
	processChatMedia,
	verticalMenu,
} from "@/backend/services/chatIntake";

const sendTelegramMessage = async (chatId, text) => {
	const chunks = String(text || "").match(/[\s\S]{1,4000}/g) || [""];
	for (const chunk of chunks) {
		const response = await fetch(
			`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`,
			{
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ chat_id: chatId, text: chunk }),
			},
		);
		const data = await response.json().catch(() => ({}));
		if (!response.ok || !data.ok) {
			throw new Error(
				`Telegram sendMessage failed: ${data.description || response.status}`,
			);
		}
	}
};

const webhookIsAuthorized = (req) => {
	const expected = process.env.TELEGRAM_WEBHOOK_SECRET;
	if (!expected) return false;
	return (
		req.headers["x-telegram-bot-api-secret-token"] === expected ||
		req.query.secret === expected
	);
};

const jobLink = (jobId) => {
	const base = (process.env.PUBLIC_BASE_URL || "http://localhost:3001").replace(/\/$/, "");
	return `${base}/jobs/${jobId}`;
};

const telegramMedia = (message) => {
	if (message.photo?.length) {
		return {
			fileId: message.photo[message.photo.length - 1].file_id,
			mediaType: "image/jpeg",
			description: "uploaded photo",
		};
	}
	if (message.document?.mime_type === "application/pdf") {
		return {
			fileId: message.document.file_id,
			mediaType: "application/pdf",
			description: message.document.file_name || "uploaded PDF",
		};
	}
	return null;
};

const downloadTelegramFile = async (fileId) => {
	const token = process.env.TELEGRAM_BOT_TOKEN;
	const metadataResponse = await fetch(
		`https://api.telegram.org/bot${token}/getFile?file_id=${encodeURIComponent(fileId)}`,
	);
	const metadata = await metadataResponse.json().catch(() => ({}));
	if (!metadataResponse.ok || !metadata.ok || !metadata.result?.file_path) {
		throw new Error(
			`Telegram getFile failed: ${metadata.description || metadataResponse.status}`,
		);
	}
	const fileResponse = await fetch(
		`https://api.telegram.org/file/bot${token}/${metadata.result.file_path}`,
	);
	if (!fileResponse.ok) throw new Error(`Telegram file download failed: ${fileResponse.status}`);
	const buffer = Buffer.from(await fileResponse.arrayBuffer());
	if (buffer.length > 12 * 1024 * 1024) {
		throw new Error("The uploaded file is larger than 12 MB");
	}
	return buffer.toString("base64");
};

export default async function handler(req, res) {
	if (req.method !== "POST") {
		return res.status(405).json({ error: "Method not allowed" });
	}
	if (!webhookIsAuthorized(req)) {
		return res.status(403).json({ error: "Invalid Telegram webhook secret" });
	}

	const message = req.body?.message;
	if (!message || message.chat?.id == null) {
		return res.status(200).json({ ok: true });
	}

	const chatId = String(message.chat.id);
	const text = (message.text || message.caption || "").trim();
	const media = telegramMedia(message);
	if (!text && !media) return res.status(200).json({ ok: true });
	const updateId = Number(req.body?.update_id);

	try {
		await dbConnect();
		let session = await TelegramSession.findOne({ chatId });
		if (
			session &&
			Number.isFinite(updateId) &&
			session.lastUpdateId !== undefined &&
			updateId <= session.lastUpdateId
		) {
			return res.status(200).json({ ok: true, duplicate: true });
		}

		if (!session || (text && isRestart(text))) {
			if (session) await session.deleteOne();
			session = await TelegramSession.create({
				chatId,
				...(Number.isFinite(updateId) ? { lastUpdateId: updateId } : {}),
			});
			await sendTelegramMessage(chatId, verticalMenu());
			return res.status(200).json({ ok: true });
		}

		if (Number.isFinite(updateId)) {
			const claimed = await TelegramSession.findOneAndUpdate(
				{
					_id: session._id,
					$or: [
						{ lastUpdateId: { $lt: updateId } },
						{ lastUpdateId: { $exists: false } },
					],
				},
				{ $set: { lastUpdateId: updateId } },
				{ new: true },
			);
			if (!claimed) return res.status(200).json({ ok: true, duplicate: true });
			session = claimed;
		}

		const result = media
			? await processChatMedia(session, {
					fileBase64: await downloadTelegramFile(media.fileId),
					mediaType: media.mediaType,
					description: media.description,
				})
			: await processChatIntake(session, text, { channel: "Telegram" });
		if (result.confirmed) {
			await sendTelegramMessage(
				chatId,
				`✅ Spec confirmed! Track calls and quotes here:\n${jobLink(result.jobId)}\n\nSend "restart" to start a new job.`,
			);
		} else if (result.done) {
			await sendTelegramMessage(
				chatId,
				`Your job is in progress: ${jobLink(result.jobId)}\nSend "restart" to start a new one.`,
			);
		} else {
			await sendTelegramMessage(chatId, result.text);
		}
		return res.status(200).json({ ok: true });
	} catch (error) {
		console.error("telegram webhook error:", error);
		try {
			await sendTelegramMessage(
				chatId,
				"⚠️ Something went wrong. Your previous answers are still saved, so please try again.",
			);
		} catch {}
		return res.status(200).json({ ok: false });
	}
}
