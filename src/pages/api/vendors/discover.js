import getVertical from "@/config/verticals";

// Real-world path stub: Google Places when a key is present, otherwise a
// canned response in the exact same shape so the demo never blocks on a key.
const CANNED = {
	moving: [
		{ name: "Two Brothers Moving", phone: "+1 803-555-0114", rating: 4.8, placeId: "canned-moving-1" },
		{ name: "QuickBudget Movers", phone: "+1 803-555-0177", rating: 3.9, placeId: "canned-moving-2" },
		{ name: "White Glove Relocations", phone: "+1 704-555-0135", rating: 4.9, placeId: "canned-moving-3" },
	],
	autobody: [
		{ name: "Precision Auto Body", phone: "+1 803-555-0161", rating: 4.7, placeId: "canned-autobody-1" },
		{ name: "Budget Collision Center", phone: "+1 803-555-0198", rating: 4.0, placeId: "canned-autobody-2" },
		{ name: "Elite Coach Works", phone: "+1 704-555-0122", rating: 4.9, placeId: "canned-autobody-3" },
	],
};

export default async function handler(req, res) {
	if (req.method !== "GET") {
		return res.status(405).json({ error: "Method not allowed" });
	}
	try {
		const { vertical = "moving", location = "Rock Hill, SC" } = req.query;
		const key = process.env.GOOGLE_PLACES_API_KEY;
		if (!key) {
			return res.status(200).json({ vendors: CANNED[vertical] || CANNED.moving });
		}

		const config = getVertical(vertical);
		const response = await fetch("https://places.googleapis.com/v1/places:searchText", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"X-Goog-Api-Key": key,
				"X-Goog-FieldMask":
					"places.id,places.displayName,places.rating,places.nationalPhoneNumber",
			},
			body: JSON.stringify({
				textQuery: `${config ? config.label : vertical} companies near ${location}`,
			}),
		});
		if (!response.ok) {
			return res.status(502).json({ error: `Places search failed: ${response.status}` });
		}
		const data = await response.json();
		const vendors = (data.places || []).map((p) => ({
			name: p.displayName?.text || "",
			phone: p.nationalPhoneNumber || null,
			rating: p.rating ?? null,
			placeId: p.id,
		}));
		return res.status(200).json({ vendors });
	} catch (error) {
		console.error("vendors/discover error:", error);
		return res.status(500).json({ error: error.message });
	}
}
