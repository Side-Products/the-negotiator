import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";
import dbConnect from "@/lib/dbConnect";
import Call from "@/backend/models/call";
import Job from "@/backend/models/job";
import getVertical from "@/config/verticals";
import { nextVendorTurn } from "@/backend/services/vendorBrain";

const eleven = new ElevenLabsClient({ apiKey: process.env.ELEVENLABS_API_KEY });

const streamToBase64 = async (stream) => {
  const chunks = [];
  for await (const chunk of stream) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString("base64");
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  try {
    await dbConnect();
    const { id } = req.query;
    const call = await Call.findById(id);
    if (!call) {
      return res.status(404).json({ error: "Call not found" });
    }

    const { lastAgentText } = req.body || {};
    if (!lastAgentText) {
      return res.status(400).json({ error: "lastAgentText is required" });
    }

    const job = await Job.findById(call.jobId);
    const vertical = getVertical(job?.vertical);
    const card = vertical?.vendorPolicyCards.find((c) => c.id === call.policyCardId);
    if (!card) {
      return res.status(400).json({ error: "No policy card for this call" });
    }

    const { text } = await nextVendorTurn({ call, job, vertical, card, lastAgentText });

    const now = new Date();
    const base = call.transcript.length;
    call.transcript.push(
      { role: "agent", text: lastAgentText, turnIndex: base, at: now },
      { role: "vendor", text, turnIndex: base + 1, at: now },
    );
    await call.save();

    let audioB64 = null;
    try {
      const audioStream = await eleven.textToSpeech.convert(card.voiceId, {
        text,
        modelId: "eleven_turbo_v2_5",
        outputFormat: "mp3_44100_128",
      });
      audioB64 = await streamToBase64(audioStream);
    } catch (ttsError) {
      // Text loop still works without audio — degrade instead of failing the turn.
      console.error("vendor-turn TTS error:", ttsError);
    }

    return res.status(200).json({ text, audioB64 });
  } catch (error) {
    console.error("vendor-turn error:", error);
    return res.status(500).json({ error: error.message });
  }
}
