// Renders a simulated call's transcript to a single playable MP3: buyer turns
// in the buyer voice, vendor turns in the policy card's voice. Sim calls are
// text-native, so this synthesized rendering IS the call's audio form (say so
// in the demo; it is not a phone recording).

import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";
import Call from "@/backend/models/call";
import Job from "@/backend/models/job";
import getVertical from "@/config/verticals";
import { storeRecording } from "@/backend/services/callFinalizer";

// Keep in sync with the buyer agent's voice in createAgents.js (Eric).
const BUYER_VOICE_ID = "cjVigY5qzO86Huf0OWal";

let client = null;
const eleven = () => (client ||= new ElevenLabsClient({ apiKey: process.env.ELEVENLABS_API_KEY }));

const streamToBuffer = async (stream) => {
	const chunks = [];
	for await (const chunk of stream) chunks.push(chunk);
	return Buffer.concat(chunks);
};

const synth = async (voiceId, text) =>
	streamToBuffer(
		await eleven().textToSpeech.convert(voiceId, {
			text,
			modelId: "eleven_turbo_v2_5",
			outputFormat: "mp3_44100_128",
		}),
	);

const rendering = new Set();

export const renderCallAudio = async (callId) => {
	const key = callId.toString();
	if (rendering.has(key)) return null;
	rendering.add(key);
	try {
		const call = await Call.findById(callId);
		if (!call || call.recordingPath || call.mode !== "sim" || !(call.transcript || []).length) {
			return call;
		}
		const job = await Job.findById(call.jobId);
		const vertical = getVertical(job.vertical);
		const card =
			vertical.vendorPolicyCards.find((c) => c.id === call.policyCardId) ||
			vertical.vendorPolicyCards[0];

		// Same MP3 params for every segment, so plain concatenation plays fine.
		const buffers = [];
		for (const turn of call.transcript) {
			if (!turn.text) continue;
			const voice = ["agent", "buyer", "assistant"].includes(turn.role)
				? BUYER_VOICE_ID
				: card.voiceId;
			buffers.push(await synth(voice, turn.text));
		}
		if (!buffers.length) return call;

		call.recordingPath = await storeRecording(call._id, Buffer.concat(buffers));
		await call.save();
		return call;
	} finally {
		rendering.delete(key);
	}
};

export default renderCallAudio;
