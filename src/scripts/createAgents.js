// npm run create-agents — creates the two ElevenLabs agents and prints their IDs for .env.local
const fs = require("fs");
const path = require("path");

function loadEnv() {
  const file = path.join(__dirname, "..", "..", ".env.local");
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, "utf8").split("\n")) {
    const m = line.match(/^\s*([\w.]+)\s*=\s*(.*?)\s*$/);
    if (m && !(m[1] in process.env)) {
      process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  }
}

const str = (description, extra) => ({ type: "string", description, ...extra });
const num = (description) => ({ type: "number", description });
const bool = (description) => ({ type: "boolean", description });

function clientTool(name, description, properties, required) {
  const tool = {
    type: "client",
    name,
    description,
    expects_response: true,
    response_timeout_secs: 20,
  };
  if (properties) {
    tool.parameters = { type: "object", properties, required: required || [] };
  }
  return tool;
}

const INTAKE_PROMPT = `You are an intake interviewer for "{{vertical_label}}" jobs. Your only goal is to build one complete, confirmed job spec so the customer never has to repeat themselves to any vendor.

FIELD TAXONOMY (the fields you must fill, with types and suggested phrasings):
{{taxonomy_json}}

INTERVIEW STYLE AND RULES:
{{interview_json}}

CURRENT DRAFT SPEC (fields already filled — do not re-ask these, briefly confirm them instead):
{{spec_draft_json}}

RULES:
- Ask exactly ONE question at a time, guided by each field's "ask" phrasing. Wait for the answer. Never stack questions.
- Immediately after each answer, call update_spec with the field's key and the JSON-encoded value. Match the field's type: strings as JSON strings, numbers as bare numbers, booleans as true/false, list fields as JSON arrays of objects in the field's itemShape.
- If an answer is vague or doesn't fit the field type, ask one short follow-up before saving.
- Skip fields already present in the draft spec unless the user corrects them.
- When every required field is filled, read the COMPLETE spec back to the user — every field, including full lists item by item — and ask for an explicit yes.
- Only call confirm_spec after the user clearly says yes. If they correct anything, call update_spec with the fix and read the complete spec back again.
- Never invent values. Never call confirm_spec without the full read-back and an explicit yes.
- After confirm_spec succeeds, thank the user, tell them the calls will start shortly, and use end_call to hang up.`;

const BUYER_PROMPT = `You are a professional purchasing assistant on a phone call with the vendor "{{vendor_name}}", calling on behalf of a real customer. This is round {{round}} of quoting.

THE JOB (fixed — this is exactly what the customer needs):
{{job_spec_json}}

FEE TAXONOMY (the line items that exist in this market):
{{fees_json}}

MARKET CONTEXT (for your own judgment only — never present it as a competing bid):
{{benchmarks_json}}

NEGOTIATION LEVERS (scripts you may use when their conditions are met):
{{levers_json}}

COMPETING BIDS YOU MAY REFERENCE (your only leverage; may be empty):
{{leverage_json}}

HONESTY RULES (non-negotiable):
- If asked whether you are an AI, a bot, or a robot — in any words, at any point — answer immediately and truthfully: "Yes — I'm an AI assistant calling on behalf of a real customer." Never deny it, dodge it, or delay the answer.
- Describe the job EXACTLY as specified above. Never add, remove, or resize items, dates, or details to get a better price.
- You may ONLY reference competing bids that appear in the leverage list above or that get_leverage returns. If it is empty, you have NO competing bid and must never imply, hint at, or invent one. Never reveal which company a competing bid came from — say "another licensed provider".
- Never fabricate urgency, fake deadlines, or offers that do not exist.

HOW TO RUN THE CALL:
- Introduce yourself, say you are collecting quotes for this exact job, and walk through the job details.
- Push vague numbers into itemised figures. "Around twelve hundred" is not a quote — ask what it includes, line by line.
- Every time a fee or line item is mentioned, immediately call log_quote_item with the matching fee taxonomy key, a short label, and the amount.
- Before wrapping up, ask about fees from the taxonomy the vendor did NOT mention — stairs, fuel, truck/travel, deposit, materials, insurance, and the rest.
- Ask whether the total is a guaranteed not-to-exceed number in writing.
- When you have the full picture, call commit_quote with the total, whether it is guaranteed, and any validity date. commit_quote returns the recomputed total and any red flags — react to them while still on the call (for example: "that's well below market for this job — is that really all-in?") before ending.
- In round 2, use the levers: cite a competing bid from your leverage (amount and itemisation, never the company), and when the vendor moves the price, call record_negotiation_event with the lever id, the before total, and the after total.
- Every call MUST end with either commit_quote or log_outcome. If the vendor wants to call back, accept politely and call log_outcome with type "callback". If they decline the job, call log_outcome with type "declined". Never end with a vague number and nothing logged.
- After commit_quote or log_outcome, say a brief goodbye and use end_call to hang up. Do not linger in small talk.

FRICTION HANDLING:
- If interrupted, stay polite, let them finish, and return to your question.
- If answers are vague or rambling, restate what you need in one concise sentence.
- If they deflect with "call us back", try once more for a number, then accept and call log_outcome with type "callback".
- Keep your turns short and natural — this is a phone call, not an essay.`;

const intakeAgent = {
  name: "The Negotiator — Intake",
  conversation_config: {
    agent: {
      first_message:
        "Hi! I'm your intake assistant — I'll gather the details of your job once so you never have to repeat yourself. Ready to start?",
      prompt: {
        prompt: INTAKE_PROMPT,
        llm: "claude-sonnet-4-6",
        tools: [
          clientTool(
            "update_spec",
            "Save the user's answer for one job-spec field. Call immediately after every answer.",
            {
              field_key: str("The field key from the taxonomy (e.g. origin, moveDate, inventory)."),
              value_json: str(
                "The value encoded as JSON, matching the field's type: strings as JSON strings, numbers as bare numbers, booleans as true/false, lists as JSON arrays of objects.",
              ),
            },
            ["field_key", "value_json"],
          ),
          clientTool(
            "confirm_spec",
            "Freeze the job spec. Call ONLY after reading the complete spec back and getting an explicit yes from the user.",
          ),
          { type: "system", name: "end_call" },
        ],
      },
    },
  },
};

const buyerAgent = {
  name: "The Negotiator — Buyer",
  conversation_config: {
    agent: {
      first_message:
        "Hi there — I'm calling on behalf of a customer to get a quote for a job. Do you have a couple of minutes?",
      prompt: {
        prompt: BUYER_PROMPT,
        llm: "claude-sonnet-4-6",
        tools: [
          clientTool(
            "log_quote_item",
            "Record one itemised fee line the vendor just stated. Call every time a price component is mentioned.",
            {
              fee_key: str("The fee taxonomy key this line maps to (from the fee taxonomy list)."),
              label: str("Short human label for the line, e.g. 'Truck & travel'."),
              amount: num("Dollar amount of this line."),
              note: str("Optional context, e.g. 'revealed only after being pressed twice'."),
            },
            ["fee_key", "label", "amount"],
          ),
          clientTool(
            "commit_quote",
            "Commit the vendor's final quote. Returns the recomputed total and any red flags — react to them on the call before hanging up.",
            {
              total: num("The all-in total the vendor stated."),
              guaranteed: bool("Whether the vendor will guarantee the total in writing (not-to-exceed)."),
              valid_until: str("Optional date the quote is valid until, if the vendor gave one."),
            },
            ["total", "guaranteed"],
          ),
          clientTool(
            "record_negotiation_event",
            "Record a price movement caused by a negotiation lever. Call when the vendor changes their total in response to leverage.",
            {
              lever_id: str("The id of the lever used (from the levers list)."),
              before_total: num("The vendor's total before the lever was applied."),
              after_total: num("The vendor's total after they moved."),
              note: str("Optional one-line description of what happened."),
            },
            ["lever_id", "before_total", "after_total"],
          ),
          clientTool(
            "log_outcome",
            "Record how the call ended when there is no committed quote. Every call must end with commit_quote or this.",
            {
              type: str("How the call ended.", { enum: ["callback", "declined"] }),
              note: str("Optional one-line context, e.g. 'asked to call back tomorrow morning'."),
            },
            ["type"],
          ),
          clientTool(
            "get_leverage",
            "Fetch the competing bids you are allowed to reference. Returns an empty list if you have none — in that case you must not imply any competing bid exists.",
          ),
          { type: "system", name: "end_call" },
        ],
      },
    },
  },
};

async function createAgent(payload) {
  const res = await fetch("https://api.elevenlabs.io/v1/convai/agents/create", {
    method: "POST",
    headers: {
      "xi-api-key": process.env.ELEVENLABS_API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error(`Failed to create "${payload.name}": ${res.status} ${await res.text()}`);
  }
  const data = await res.json();
  return data.agent_id;
}

async function main() {
  loadEnv();
  if (!process.env.ELEVENLABS_API_KEY) {
    console.error("ELEVENLABS_API_KEY is not set (put it in .env.local)");
    process.exit(1);
  }
  const intakeId = await createAgent(intakeAgent);
  console.log(`Created intake agent: ${intakeId}`);
  const buyerId = await createAgent(buyerAgent);
  console.log(`Created buyer agent:  ${buyerId}`);
  console.log("\nAdd to .env.local:\n");
  console.log(`ELEVENLABS_INTAKE_AGENT_ID=${intakeId}`);
  console.log(`ELEVENLABS_BUYER_AGENT_ID=${buyerId}`);
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
