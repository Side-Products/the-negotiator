import dbConnect from "@/lib/dbConnect";
import Call from "@/backend/models/call";
import { finalizeCall } from "@/backend/services/callFinalizer";

export default async function handler(req, res) {
	if (req.method !== "POST") {
		return res.status(405).json({ error: "Method not allowed" });
	}
	try {
		await dbConnect();
		const call = await Call.findById(req.query.id);
		if (!call) {
			return res.status(404).json({ error: "Call not found" });
		}
		await finalizeCall(call);
		return res.status(200).json({ call });
	} catch (error) {
		console.error("finalize error:", error);
		return res.status(500).json({ error: error.message });
	}
}
