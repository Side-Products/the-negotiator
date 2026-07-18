import { discoverVendors } from "@/backend/services/vendorDiscovery";

export default async function handler(req, res) {
	if (req.method !== "GET") {
		return res.status(405).json({ error: "Method not allowed" });
	}
	try {
		const { vertical = "moving", location = "Rock Hill, SC" } = req.query;
		const vendors = await discoverVendors(vertical, location);
		return res.status(200).json({ vendors });
	} catch (error) {
		console.error("vendors/discover error:", error);
		return res.status(500).json({ error: error.message });
	}
}
