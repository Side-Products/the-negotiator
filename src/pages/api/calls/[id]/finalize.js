import fs from "fs";
import path from "path";
import dbConnect from "@/lib/dbConnect";
import Call from "@/backend/models/call";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

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

    const headers = { "xi-api-key": process.env.ELEVENLABS_API_KEY };

    if (call.elevenConversationId) {
      const convUrl = `https://api.elevenlabs.io/v1/convai/conversations/${call.elevenConversationId}`;

      // ElevenLabs finishes processing shortly after the session ends — poll
      // both transcript and audio briefly (audio often lags the transcript).
      let conversation = null;
      for (let attempt = 0; attempt < 4; attempt++) {
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
              const dir = path.join(process.cwd(), "public", "recordings");
              await fs.promises.mkdir(dir, { recursive: true });
              await fs.promises.writeFile(path.join(dir, `${call._id}.mp3`), buffer);
              call.recordingPath = `/recordings/${call._id}.mp3`;
            }
          } catch (audioError) {
            // Recording is nice-to-have evidence — never fail finalize over it.
            console.error("finalize audio error:", audioError);
          }
        }
        if (conversation?.status === "done" && call.recordingPath) break;
      }
      if (conversation) {
        call.elevenTranscript = conversation;
        // Role-play calls have no vendor-turn loop writing call.transcript —
        // recover it from the ElevenLabs transcript (agent = buyer, user = the
        // human playing the vendor) so reports and citations still work.
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

    return res.status(200).json({ call });
  } catch (error) {
    console.error("finalize error:", error);
    return res.status(500).json({ error: error.message });
  }
}
