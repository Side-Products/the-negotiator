import getVertical from "@/config/verticals";

// Google Places when a key is present, otherwise canned data in the same shape.
const CANNED = {
	moving: [
		{ name: "Two Brothers Moving", phone: "+1 803-555-0114", rating: 4.8, placeId: "canned-moving-1" },
		{ name: "QuickBudget Movers", phone: "+1 803-555-0177", rating: 3.9, placeId: "canned-moving-2" },
		{ name: "White Glove Relocations", phone: "+1 704-555-0135", rating: 4.9, placeId: "canned-moving-3" },
		{ name: "Palmetto Haulers", phone: "+1 803-555-0142", rating: 4.5, placeId: "canned-moving-4" },
		{ name: "Carolina Careful Movers", phone: "+1 704-555-0189", rating: 4.6, placeId: "canned-moving-5" },
	],
	autobody: [
		{ name: "Precision Auto Body", phone: "+1 803-555-0161", rating: 4.7, placeId: "canned-autobody-1" },
		{ name: "Budget Collision Center", phone: "+1 803-555-0198", rating: 4.0, placeId: "canned-autobody-2" },
		{ name: "Elite Coach Works", phone: "+1 704-555-0122", rating: 4.9, placeId: "canned-autobody-3" },
	],
};

export const discoverVendors = async (verticalId, location, { limit = 20 } = {}) => {
	const key = process.env.GOOGLE_PLACES_API_KEY;
	const canned = CANNED[verticalId] || CANNED.moving;
	if (!key) return canned.slice(0, limit);

	const config = getVertical(verticalId);
	const response = await fetch("https://places.googleapis.com/v1/places:searchText", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			"X-Goog-Api-Key": key,
			"X-Goog-FieldMask":
				"places.id,places.displayName,places.rating,places.nationalPhoneNumber",
		},
		body: JSON.stringify({
			textQuery: `${config ? config.label : verticalId} companies near ${location}`,
			pageSize: Math.min(limit, 20),
		}),
	});
	if (!response.ok) return canned.slice(0, limit);
	const data = await response.json();
	const vendors = (data.places || []).map((p) => ({
		name: p.displayName?.text || "",
		phone: p.nationalPhoneNumber || null,
		rating: p.rating ?? null,
		placeId: p.id,
	}));
	return (vendors.length ? vendors : canned).slice(0, limit);
};

export default discoverVendors;
