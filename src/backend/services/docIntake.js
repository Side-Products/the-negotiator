import getVertical from "@/config/verticals";
import { fieldToJsonSchema } from "@/backend/services/jobSpec";
import { extractStructured } from "@/backend/services/llm";

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
