const comparable = (value) =>
	String(value)
		.normalize("NFKD")
		.replace(/\p{Diacritic}/gu, "")
		.toLowerCase()
		.replace(/[^\p{Letter}\p{Number}]+/gu, " ")
		.trim();

export const suggestLocation = async (input) => {
	const value = String(input || "").trim();
	const key = process.env.GOOGLE_PLACES_API_KEY;
	if (!value || !key) return { value, verified: false, needsConfirmation: false };

	try {
		const response = await fetch("https://places.googleapis.com/v1/places:autocomplete", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"X-Goog-Api-Key": key,
				"X-Goog-FieldMask":
					"suggestions.placePrediction.placeId,suggestions.placePrediction.text",
			},
			body: JSON.stringify({ input: value }),
		});
		if (!response.ok) return { value, verified: false, needsConfirmation: false };
		const data = await response.json();
		const predictions = (data.suggestions || [])
			.map((item) => item.placePrediction)
			.filter(Boolean)
			.slice(0, 3)
			.map((prediction) => ({
				value: prediction.text?.text || "",
				placeId: prediction.placeId || "",
			}))
			.filter((prediction) => prediction.value);
		if (!predictions.length) {
			return {
				value,
				verified: false,
				needsConfirmation: true,
				suggestions: [],
			};
		}
		const best = predictions[0];
		const original = comparable(value);
		const candidate = comparable(best.value);
		const obviousExtension =
			candidate === original ||
			candidate.startsWith(`${original} `) ||
			original.startsWith(`${candidate} `);
		return {
			value: best.value,
			placeId: best.placeId,
			verified: true,
			needsConfirmation: !obviousExtension,
			suggestions: predictions,
		};
	} catch {
		return { value, verified: false, needsConfirmation: false };
	}
};

export const normalizeLocationPatch = async (vertical, patch) => {
	const normalized = { ...patch };
	const confirmations = [];
	for (const field of vertical.jobSpec.fields.filter(
		(candidate) => candidate.format === "location" && typeof patch[candidate.key] === "string",
	)) {
		const result = await suggestLocation(patch[field.key]);
		normalized[field.key] = result.value;
		if (result.needsConfirmation) {
			confirmations.push({
				field: field.key,
				label: field.label,
				original: patch[field.key],
				suggestion: result.value,
				alternatives: result.suggestions || [],
			});
		}
	}
	return { patch: normalized, confirmations };
};

export default suggestLocation;
