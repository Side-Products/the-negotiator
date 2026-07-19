import Anthropic from "@anthropic-ai/sdk";
import getVertical from "@/config/verticals";
import { fieldToJsonSchema } from "@/backend/services/jobSpec";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Vision extraction: the tool input schema is generated from the vertical's
// jobSpec taxonomy, so a doc and the voice interview produce the same JSON.
export const extractSpec = async ({ vertical, fileBase64, mediaType }) => {
	const config = getVertical(vertical);
	if (!config) throw new Error(`Unknown vertical: ${vertical}`);

	const properties = Object.fromEntries(
		config.jobSpec.fields.map((f) => [f.key, fieldToJsonSchema(f)]),
	);

	const data = fileBase64.replace(/^data:[^;]+;base64,/, "");
	const source = { type: "base64", media_type: mediaType, data };
	const fileBlock =
		mediaType === "application/pdf"
			? { type: "document", source }
			: { type: "image", source };

	const response = await anthropic.messages.create({
		model: "claude-opus-4-8",
		max_tokens: 4096,
		tools: [
			{
				name: "record_spec",
				description: `Record the ${config.label} job details extracted from the document. Only include fields the document actually contains — never guess missing ones.`,
				input_schema: { type: "object", properties },
			},
		],
		tool_choice: { type: "tool", name: "record_spec" },
		messages: [
			{
				role: "user",
				content: [
					fileBlock,
					{
						type: "text",
						text: "Extract the job details from this document into record_spec. Skip any field the document does not mention.",
					},
				],
			},
		],
	});

	const toolUse = response.content.find((block) => block.type === "tool_use");
	return toolUse ? toolUse.input : {};
};

export default extractSpec;
