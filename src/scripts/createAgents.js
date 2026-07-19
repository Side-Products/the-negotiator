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

// Webhook variant for real phone calls: no browser on the line, so the tool
// executes from ElevenLabs' side against our public API. The {call_id} path
// param is bound to the conversation's call_id dynamic variable (set
// server-side), so the LLM cannot route a tool call to another call's records.
const publicUrl = () =>
  (process.env.PUBLIC_URL || process.env.PUBLIC_BASE_URL || "").replace(/\/$/, "");

function webhookTool(name, description, { method = "POST", path, properties, required }) {
  const tool = {
    type: "webhook",
    name,
    description,
    response_timeout_secs: 20,
    api_schema: {
      url: `${publicUrl()}${path}`,
      method,
      path_params_schema: {
        call_id: { type: "string", dynamic_variable: "call_id" },
      },
    },
  };
  if (properties) {
    tool.api_schema.request_body_schema = {
      type: "object",
      properties,
      required: required || [],
    };
  }
  return tool;
}

const INTAKE_PROMPT = `You are an intake interviewer for "{{vertical_label}}" jobs. Your only goal is to build one complete, confirmed job spec so the customer never has to repeat themselves to any vendor.

TODAY'S DATE: {{today_date}}. If asked what today is, answer directly. Convert relative dates ("tomorrow", "next Saturday") into concrete calendar dates using it before saving.

HOW YOU TALK (this is a phone conversation, not a script):
- Sound like a calm, competent human assistant. Contractions, plain words, short sentences.
- One thought per turn: most replies are one or two sentences plus a single question.
- No salesy filler — never say things like "That's a great question!" or "Let's get you moving fast!". Avoid exclamation marks.
- When the user asks you something, answer it directly FIRST, then return to the interview. If you genuinely don't know (vendor availability, market prices), say so plainly in one sentence — never spin a non-answer into a pitch.
- No pressure tactics. You collect details; you don't sell.
- Never use em dashes; use a comma or a period instead. Avoid AI-writing tells: no "Certainly", "Absolutely", "I understand", "Great question", no restating what the user just said, no lists or headings, and vary your acknowledgments instead of repeating "Got it".

FIELD TAXONOMY (the fields you must fill, with types and suggested phrasings):
{{taxonomy_json}}

INTERVIEW STYLE AND RULES:
{{interview_json}}

CURRENT DRAFT SPEC (fields already filled — do not re-ask these, briefly confirm them instead):
{{spec_draft_json}}

RULES:
- Ask ONE question at a time, guided by each field's "ask" phrasing. Wait for the answer. Never stack questions.
- People volunteer information. If one answer covers several fields ("we're going from Oak Street to the new place on Elm, first week of August"), save ALL of them with update_spec and skip those questions. Never ask for something the user already told you.
- Immediately after each answer, call update_spec with the field's key and the JSON-encoded value. Match the field's type: strings as JSON strings, numbers as bare numbers, booleans as true/false, list fields as JSON arrays of objects in the field's itemShape.
- If an answer is vague or doesn't fit the field type, ask one short follow-up before saving.
- Addresses: take whatever the user gives, then fill gaps like a person would. If there's no street or house number, ask once, casually: "Do you have the street address handy? City's fine if not." Accept whatever they answer and move on; never demand precision twice.
- If update_spec or confirm_spec returns a location correction or says an address could not be verified, never read the error message out loud. Fold it into conversation naturally: "Quick check on the pickup address, I have 123 Main Street in Rock Hill, South Carolina. That the one?" If they say no, ask them to spell it out and save exactly what they say.
- Skip fields already present in the draft spec unless the user corrects them.
- When every required field is filled, confirm the COMPLETE spec conversationally: summarize it in natural flowing sentences that still mention every field and every list item ("so that's a two-bedroom from Oak Street to Elm Avenue on August 8th, with the bed, the sofa, both dressers and about thirty boxes, one flight of stairs, packing included"). Not a field-by-field enumeration. Then ask for a clear yes.
- Only call confirm_spec after the user clearly says yes. If they correct anything, call update_spec with the fix and confirm the corrected version the same way.
- Never invent values. Never call confirm_spec without the full summary and an explicit yes.
- After confirm_spec succeeds, close warmly in one short sentence (the calls start shortly) and use end_call to hang up.
- Sound like a person on the phone: brief natural acknowledgments, numbers spoken plainly, and if the user pauses or thinks out loud, give them room instead of re-prompting.
- If the user speaks another language, switch and continue the whole interview in their language. But ALWAYS save update_spec values in English (addresses as given), because the vendor calls happen in English.`;

const BUYER_PROMPT = `You are a professional purchasing assistant on a phone call with the vendor "{{vendor_name}}", calling on behalf of a real customer. This is round {{round}} of quoting.

TODAY'S DATE: {{today_date}}. Use it to state the job date concretely and to interpret validity dates the vendor gives you.

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
Each bid may include recorded terms from that conversation: waivedFees (charges another provider waived), movedInCall (a price that dropped under pressure), guaranteed. You may cite any of these facts as leverage, for example "another provider waived the fuel surcharge". Never the company name, and never a fact not present in the data.

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
- In round 2, use the levers: cite a competing bid from your leverage (amount and itemisation, never the company), and when the vendor moves the price, call record_negotiation_event with the lever id, the before total, and the after total. Both totals are THIS vendor's own numbers from this call, never the competing bid, and only record when the number actually changed.
- If the agreed total changes during the call, call reset_quote_items and log the FINAL itemisation fresh before commit_quote. Never commit a mix of old and new lines.
- Every call MUST end with either commit_quote or log_outcome. If the vendor wants to call back, accept politely and call log_outcome with type "callback". If they decline the job, call log_outcome with type "declined". Never end with a vague number and nothing logged.
- After commit_quote or log_outcome, say a brief goodbye and use end_call to hang up. Do not linger in small talk.

FRICTION HANDLING:
- If interrupted, stay polite, let them finish, and return to your question.
- If answers are vague or rambling, restate what you need in one concise sentence.
- If they deflect with "call us back", try once more for a number, then accept and call log_outcome with type "callback".
- If they refuse to give prices over the phone, ask once for a typical range for this scope. If they still refuse, accept it politely and call log_outcome with type "callback" (estimator visit or callback offered) or "declined", with a note saying they do not quote by phone.
- If they offer a better price for describing the job as smaller or different than it is, refuse plainly: the job is exactly as specified. Log nothing based on the misstated version.
- If they push add-ons the job does not need, decline them and ask for the total without the extras. Never let unrequested services into the committed quote.
- If they accuse you of bluffing about a competing bid, do not escalate: offer the competing quote's amount and line items (never the company name). If you have no leverage, say plainly that you have no other bid yet.
- Keep your turns short and natural — this is a phone call, not an essay.

STYLE:
- Never use em dashes; use a comma or a period instead. Avoid AI-writing tells: no "Certainly", "Absolutely", "I understand", "Great question", no restating what the vendor just said, no lists or headings in speech, and vary your acknowledgments.`;

const intakeAgent = {
  name: "Haggle — Intake",
  conversation_config: {
    // Jessica ("Playful, Bright, Warm" — labeled conversational, unlike
    // Sarah's broadcast register) on the expressive v3 conversational model:
    // human delivery over minimum latency, the right trade for an interview.
    tts: {
      voice_id: "cgSgspJ2msm6clMCkdW9",
      model_id: "eleven_v3_conversational",
      expressive_mode: true,
      stability: 0.5,
      similarity_boost: 0.8,
    },
    // Languages the interview can auto-switch into (v3 conversational is
    // multilingual; the language_detection system tool does the switching).
    language_presets: {
      de: { overrides: {} },
      hi: { overrides: {} },
      es: { overrides: {} },
      fr: { overrides: {} },
    },
    agent: {
      first_message: "{{interview_opener}}",
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
          { type: "system", name: "language_detection" },
        ],
      },
    },
  },
};

// The five buyer tool definitions, buildable as client tools (browser sessions)
// or webhook tools (real phone calls hitting our public API). PUBLIC_URL set =
// webhook mode; both agree on names and argument shapes.
function buildBuyerTools() {
  const defs = [
    {
      name: "log_quote_item",
      description:
        "Record one itemised fee line the vendor just stated. Call every time a price component is mentioned.",
      path: "/api/calls/{call_id}/quote-items",
      properties: {
        fee_key: str("The fee taxonomy key this line maps to (from the fee taxonomy list)."),
        label: str("Short human label for the line, e.g. 'Truck & travel'."),
        amount: num("Dollar amount of this line."),
        note: str("Optional context, e.g. 'revealed only after being pressed twice'."),
      },
      required: ["fee_key", "label", "amount"],
    },
    {
      name: "commit_quote",
      description:
        "Commit the vendor's final quote. Returns the recomputed total and any red flags — react to them on the call before hanging up.",
      path: "/api/calls/{call_id}/commit",
      properties: {
        total: num("The all-in total the vendor stated."),
        guaranteed: bool("Whether the vendor will guarantee the total in writing (not-to-exceed)."),
        valid_until: str("Optional date the quote is valid until, if the vendor gave one."),
      },
      required: ["total", "guaranteed"],
    },
    {
      name: "reset_quote_items",
      description:
        "Clear all logged quote lines for this call. Use when the agreed total changes during negotiation, then log the FINAL itemisation fresh before committing.",
      path: "/api/calls/{call_id}/reset-items",
      properties: {},
    },
    {
      name: "record_negotiation_event",
      description:
        "Record a price movement by THIS vendor during THIS call: before_total and after_total are both numbers this vendor stated, never the competing bid. Only when the number actually changed.",
      path: "/api/calls/{call_id}/negotiation-event",
      properties: {
        lever_id: str("The id of the lever used (from the levers list)."),
        before_total: num("The vendor's total before the lever was applied."),
        after_total: num("The vendor's total after they moved."),
        note: str("Optional one-line description of what happened."),
      },
      required: ["lever_id", "before_total", "after_total"],
    },
    {
      name: "log_outcome",
      description:
        "Record how the call ended when there is no committed quote. Every call must end with commit_quote or this.",
      path: "/api/calls/{call_id}/outcome",
      properties: {
        type: str("How the call ended.", { enum: ["callback", "declined"] }),
        note: str("Optional one-line context, e.g. 'asked to call back tomorrow morning'."),
      },
      required: ["type"],
    },
    {
      name: "get_leverage",
      description:
        "Fetch the competing bids you are allowed to reference. Returns an empty list if you have none — in that case you must not imply any competing bid exists.",
      path: "/api/calls/{call_id}/leverage",
      method: "GET",
    },
  ];

  const tools = publicUrl()
    ? defs.map((d) =>
        webhookTool(d.name, d.description, {
          method: d.method || "POST",
          path: d.path,
          properties: d.properties,
          required: d.required,
        }),
      )
    : defs.map((d) => clientTool(d.name, d.description, d.properties, d.required));
  tools.push({ type: "system", name: "end_call" });
  return tools;
}

function buildBuyerAgent() {
  return {
    name: "Haggle — Buyer",
    conversation_config: {
      // Eric ("Smooth, Trustworthy", conversational): a competent-assistant
      // register for vendor calls. Turbo (not v3) because negotiation latency
      // matters more than expressiveness on the phone; lower stability adds
      // natural variation, slight speed lift matches phone pacing.
      tts: {
        voice_id: "cjVigY5qzO86Huf0OWal",
        // English agents must use the v2 English models (platform rule).
        model_id: "eleven_turbo_v2",
        stability: 0.4,
        similarity_boost: 0.85,
        speed: 1.03,
      },
      agent: {
        first_message:
          "Hi there — I'm calling on behalf of a customer to get a quote for a job. {{recording_note}}Do you have a couple of minutes?",
        prompt: {
          prompt: BUYER_PROMPT,
          llm: "claude-sonnet-4-6",
          tools: buildBuyerTools(),
        },
      },
    },
  };
}

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

// Update in place when the agent already exists — keeps the same agent id, so
// .env.local and the running dev server stay untouched. The display name is
// NOT sent on update: the team renames agents in the dashboard (e.g. "Haggle")
// and this script must not clobber that.
async function updateAgent(agentId, payload) {
  const { name, ...config } = payload;
  const res = await fetch(`https://api.elevenlabs.io/v1/convai/agents/${agentId}`, {
    method: "PATCH",
    headers: {
      "xi-api-key": process.env.ELEVENLABS_API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(config),
  });
  if (!res.ok) {
    throw new Error(`Failed to update "${payload.name}": ${res.status} ${await res.text()}`);
  }
  return agentId;
}

async function upsertAgent(existingId, payload) {
  if (existingId) {
    await updateAgent(existingId, payload);
    return { id: existingId, action: "Updated" };
  }
  return { id: await createAgent(payload), action: "Created" };
}

async function main() {
  loadEnv();
  if (!process.env.ELEVENLABS_API_KEY) {
    console.error("ELEVENLABS_API_KEY is not set (put it in .env.local)");
    process.exit(1);
  }
  // In CI this script must only UPDATE the two known agents. Creating agents
  // there would silently mint a new agent on every push if an ID secret is
  // missing, and nobody would see the printed IDs.
  if (process.env.CI && !(process.env.ELEVENLABS_INTAKE_AGENT_ID && process.env.ELEVENLABS_BUYER_AGENT_ID)) {
    console.error("CI run refused: ELEVENLABS_INTAKE_AGENT_ID and ELEVENLABS_BUYER_AGENT_ID must both be set as secrets.");
    process.exit(1);
  }
  const intake = await upsertAgent(process.env.ELEVENLABS_INTAKE_AGENT_ID, intakeAgent);
  console.log(`${intake.action} intake agent: ${intake.id}`);
  const buyer = await upsertAgent(process.env.ELEVENLABS_BUYER_AGENT_ID, buildBuyerAgent());
  console.log(`${buyer.action} buyer agent:  ${buyer.id}`);
  console.log(
    publicUrl()
      ? `Buyer tools: WEBHOOK mode -> ${publicUrl()}`
      : "Buyer tools: CLIENT mode (browser sessions only; set PUBLIC_URL + re-run for real phone calls)",
  );
  if (intake.action === "Created" || buyer.action === "Created") {
    console.log("\nAdd to .env.local:\n");
    console.log(`ELEVENLABS_INTAKE_AGENT_ID=${intake.id}`);
    console.log(`ELEVENLABS_BUYER_AGENT_ID=${buyer.id}`);
  }
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
