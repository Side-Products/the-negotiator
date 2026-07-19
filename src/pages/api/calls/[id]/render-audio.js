import dbConnect from "@/lib/dbConnect";
import Call from "@/backend/models/call";
import { renderCallAudio } from "@/backend/services/audioRenderer";

// Synthesizes a sim call's transcript into a playable recording (idempotent:
// returns the existing recording if one exists). Takes ~20-40s for a full call.
export default async function handler(req, res) {
	if (req.method !== "POST") {
		return res.status(405).json({ error: "Method not allowed" });
	}
	try {
		await dbConnect();
		const existing = await Call.findById(req.query.id);
		if (!existing) return res.status(404).json({ error: "Call not found" });
		if (existing.recordingPath) return res.status(200).json({ call: existing });
		if (existing.mode !== "sim" || !(existing.transcript || []).length) {
			return res.status(400).json({ error: "Only sim calls with a transcript can be rendered" });
		}
		const call = await renderCallAudio(existing._id);
		return res.status(200).json({ call });
	} catch (error) {
		console.error("render-audio error:", error);
		return res.status(500).json({ error: error.message });
	}
}
