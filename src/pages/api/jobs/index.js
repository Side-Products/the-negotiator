import dbConnect from "@/lib/dbConnect";
import Job from "@/backend/models/job";
import getVertical from "@/config/verticals";

export default async function handler(req, res) {
	try {
		await dbConnect();

		if (req.method === "GET") {
			const jobs = await Job.find().sort({ createdAt: -1 });
			return res.status(200).json({ jobs });
		}

		if (req.method === "POST") {
			const { vertical } = req.body || {};
			if (!getVertical(vertical)) {
				return res.status(400).json({ error: "Unknown vertical" });
			}
			const job = await Job.create({ vertical, spec: {} });
			return res.status(201).json({ job });
		}

		return res.status(405).json({ error: "Method not allowed" });
	} catch (error) {
		console.error("jobs error:", error);
		return res.status(500).json({ error: error.message });
	}
}
