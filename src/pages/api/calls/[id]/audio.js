import fs from "fs";
import path from "path";
import dbConnect from "@/lib/dbConnect";
import Call from "@/backend/models/call";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  try {
    await dbConnect();
    const { id } = req.query;
    const call = await Call.findById(id);
    if (!call || !call.recordingPath) {
      return res.status(404).json({ error: "No recording for this call" });
    }

    const filePath = path.join(process.cwd(), "public", call.recordingPath);
    let stat;
    try {
      stat = await fs.promises.stat(filePath);
    } catch {
      return res.status(404).json({ error: "Recording file missing" });
    }

    res.setHeader("Content-Type", "audio/mpeg");
    res.setHeader("Content-Length", stat.size);
    fs.createReadStream(filePath).pipe(res);
  } catch (error) {
    console.error("audio error:", error);
    return res.status(500).json({ error: error.message });
  }
}
