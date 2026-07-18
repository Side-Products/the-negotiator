// Pulls the authoritative ElevenLabs transcript + recording for a call.
// Used by the finalize API route (browser sessions) and the real-call poller.

import fs from "fs";
import path from "path";
import { wasabiConfigured, uploadBuffer } from "@/backend/services/wasabiStorage";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Wasabi when configured (recordingPath = object key, e.g. "recordings/x.mp3"),
// local public/ dir otherwise (recordingPath = "/recordings/x.mp3").
const storeRecording = async (callId, buffer) => {
	if (wasabiConfigured()) {
		const key = `recordings/${callId}.mp3`;
		await uploadBuffer(buffer, key, "audio/mpeg");
		return key;
	}
	const dir = path.join(process.cwd(), "public", "recordings");
	await fs.promises.mkdir(dir, { recursive: true });
	await fs.promises.writeFile(path.join(dir, `${callId}.mp3`), buffer);
	return `/recordings/${callId}.mp3`;
};

export const finalizeCall = async (call, { attempts = 4 } = {}) => {
	const headers = { "xi-api-key": process.env.ELEVENLABS_API_KEY };

	if (call.elevenConversationId) {
		const convUrl = `https://api.elevenlabs.io/v1/convai/conversations/${call.elevenConversationId}`;

		let conversation = null;
		for (let attempt = 0; attempt < attempts; attempt++) {
			if (attempt > 0) await sleep(2000);
			const convRes = await fetch(convUrl, { headers });
			if (convRes.ok) {
				conversation = await convRes.json();
			}
			if (!call.recordingPath) {
				try {
					const audioRes = await fetch(`${convUrl}/audio`, { headers });
					if (audioRes.ok) {
						const buffer = Buffer.from(await audioRes.arrayBuffer());
						call.recordingPath = await storeRecording(call._id, buffer);
					}
				} catch (audioError) {
					// Recording is nice-to-have evidence, never fail finalize over it.
					console.error("finalize audio error:", audioError);
				}
			}
			if (conversation?.status === "done" && call.recordingPath) break;
		}
		if (conversation) {
			call.elevenTranscript = conversation;
			// Calls with no in-app transcript (role-play, real phone calls) recover
			// it from the ElevenLabs transcript so reports and citations work.
			if (!call.transcript?.length && Array.isArray(conversation.transcript)) {
				call.transcript = conversation.transcript
					.filter((t) => t.message)
					.map((t, i) => ({
						role: t.role === "agent" ? "agent" : "vendor",
						text: t.message,
						turnIndex: i,
						at: new Date(),
					}));
			}
		}
	}

	call.status = "done";
	await call.save();
	return call;
};

export default finalizeCall;
