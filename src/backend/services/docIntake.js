import getVertical from "@/config/verticals";
import { extractStructured } from "@/backend/services/llm";

const ITEM_TYPES = { string: "string", number: "number", boolean: "boolean" };

const fieldToJsonSchema = (field) => {
	switch (field.type) {
		case "enum":
			return { type: "string", enum: field.options, description: field.label };
		case "number":
			return { type: "number", description: field.label };
		case "boolean":
			return { type: "boolean", description: field.label };
		case "list":
			return {
				type: "array",
				description: field.label,
				items: {
					type: "object",
					properties: Object.fromEntries(
						Object.entries(field.itemShape || {}).map(([key, t]) => [
							key,
							{ type: ITEM_TYPES[t] || "string" },
						]),
					),
				},
			};
		default:
			// string, date
			return { type: "string", description: field.label };
	}
};

// Vision extraction: the tool input schema is generated from the vertical's
// jobSpec taxonomy, so a doc and the voice interview produce the same JSON.
export const extractSpec = async ({ vertical, fileBase64, mediaType }) => {
	const config = getVertical(vertical);
	if (!config) throw new Error(`Unknown vertical: ${vertical}`);

	const properties = Object.fromEntries(
		config.jobSpec.fields.map((f) => [f.key, fieldToJsonSchema(f)]),
	);

	return extractStructured({
		prompt: `Extract the ${config.label} job details from this document. Only include fields the document actually contains — never guess missing ones.`,
		schema: { type: "object", properties },
		fileBase64,
		mediaType,
	});
};

export default extractSpec;
