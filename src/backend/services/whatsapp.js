import twilio from "twilio";

const getClient = () =>
	twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

// to: "whatsapp:+1555..." (or bare number — prefix is added)
export async function sendWhatsApp(to, body) {
	const toAddr = to.startsWith("whatsapp:") ? to : `whatsapp:${to}`;
	return getClient().messages.create({
		from: process.env.TWILIO_WHATSAPP_FROM,
		to: toAddr,
		body,
	});
}

// Verifies X-Twilio-Signature so only Twilio can hit the webhook.
export function validateTwilioRequest(req, url) {
	const token = process.env.TWILIO_AUTH_TOKEN;
	if (!token) return true; // no token configured — skip validation (dev)
	return twilio.validateRequest(
		token,
		req.headers["x-twilio-signature"] || "",
		url,
		req.body,
	);
}
