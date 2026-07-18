// Real outbound phone calls via ElevenLabs native telephony (Twilio-backed).
// The SAME buyer agent makes the call; dynamic variables configure it per
// vendor, and its webhook tools write quotes into our API mid-call (which is
// why PUBLIC_URL must be reachable from the internet). Recording + transcript
// come from ElevenLabs conversation history after the call ends.

import Call from "@/backend/models/call";
import Job from "@/backend/models/job";
import getVertical from "@/config/verticals";
import { buildBuyerVars } from "@/backend/services/agentVars";
import { finalizeCall } from "@/backend/services/callFinalizer";
import { discoverVendors } from "@/backend/services/vendorDiscovery";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// PUBLIC_URL with PUBLIC_BASE_URL (WhatsApp bot) as fallback: one public
// origin for the whole app unless deliberately split.
export const publicUrl = () => process.env.PUBLIC_URL || process.env.PUBLIC_BASE_URL || "";

export const realCallsConfigured = () =>
	Boolean(
		process.env.ELEVENLABS_API_KEY &&
			process.env.ELEVENLABS_BUYER_AGENT_ID &&
			process.env.ELEVENLABS_PHONE_NUMBER_ID &&
			publicUrl(),
	);

const RECORDING_NOTE =
	"Quick heads-up: I'm an AI assistant and this call is recorded so my customer can compare quotes. ";

const initiateOutboundCall = async (call, dynamicVariables) => {
	const res = await fetch("https://api.elevenlabs.io/v1/convai/twilio/outbound-call", {
		method: "POST",
		headers: {
			"xi-api-key": process.env.ELEVENLABS_API_KEY,
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			agent_id: process.env.ELEVENLABS_BUYER_AGENT_ID,
			agent_phone_number_id: process.env.ELEVENLABS_PHONE_NUMBER_ID,
			to_number: call.phone,
			conversation_initiation_client_data: {
				dynamic_variables: dynamicVariables,
			},
		}),
	});
	if (!res.ok) {
		throw new Error(`outbound-call failed: ${res.status} ${await res.text()}`);
	}
	const data = await res.json();
	return data.conversation_id || data.conversationId;
};

const pollUntilDone = async (call, { timeoutMs = 10 * 60 * 1000 } = {}) => {
	const headers = { "xi-api-key": process.env.ELEVENLABS_API_KEY };
	const url = `https://api.elevenlabs.io/v1/convai/conversations/${call.elevenConversationId}`;
	const start = Date.now();
	while (Date.now() - start < timeoutMs) {
		await sleep(10000);
		const res = await fetch(url, { headers });
		if (!res.ok) continue;
		const conversation = await res.json();
		if (["done", "failed"].includes(conversation.status)) {
			return conversation.status;
		}
	}
	return "timeout";
};

// One real call, end to end: dial, wait, pull evidence.
export const runRealCall = async (callId) => {
	const call = await Call.findById(callId);
	if (!call) return;
	const job = await Job.findById(call.jobId);
	const vertical = getVertical(job.vertical);

	try {
		const vars = await buildBuyerVars(job, call, vertical, { recordingNote: RECORDING_NOTE });
		call.status = "live";
		await call.save();

		call.elevenConversationId = await initiateOutboundCall(call, vars);
		await call.save();

		const status = await pollUntilDone(call);
		await finalizeCall(call);

		// A phone call has no browser to log a structured outcome if the agent's
		// webhook tools never fired. Leave a documented decline rather than nothing.
		if (!call.outcome?.type) {
			call.outcome = {
				type: "declined",
				note:
					status === "done"
						? "Call ended without a committed quote or logged outcome."
						: `Call ${status} before completing.`,
			};
			await call.save();
		}
	} catch (error) {
		console.error(`real call ${callId} failed:`, error);
		call.status = "failed";
		if (!call.outcome?.type) call.outcome = { note: `error: ${error.message}` };
		await call.save();
	}
};

// Create call records for real vendors and dial them ONE AT A TIME. Sequential
// on purpose: respects ElevenLabs concurrency, keeps costs visible, and keeps
// the blast radius small when calling real businesses.
export const startRealCalls = async (job, { limit = 3, location } = {}) => {
	const vertical = getVertical(job.vertical);
	const vendors = (await discoverVendors(job.vertical, location || "Rock Hill, SC", { limit: 20 }))
		.filter((v) => v.phone)
		.slice(0, limit);

	const calls = await Call.create(
		vendors.map((v) => ({
			jobId: job._id,
			specVersion: job.specVersion,
			vendorName: v.name,
			phone: v.phone,
			placeId: v.placeId,
			rating: v.rating,
			policyCardId: null,
			round: 1,
			mode: "real",
			status: "pending",
		})),
	);
	return { calls, vertical };
};

export const runRealCallsSequentially = async (callIds) => {
	for (const id of callIds) {
		await runRealCall(id);
	}
};

export default { realCallsConfigured, startRealCalls, runRealCall, runRealCallsSequentially };
