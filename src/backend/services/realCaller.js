// Real outbound phone calls via ElevenLabs native telephony (Twilio-backed).
// The SAME buyer agent makes the call; dynamic variables configure it per
// vendor, and its webhook tools write quotes into our API mid-call (which is
// why PUBLIC_URL must be reachable from the internet). Runs the same batch
// structure as sim calls: batches of 5, baseline first, later batches carry
// the best committed quote as leverage. While a call is live, the poller
// mirrors ElevenLabs' status and partial transcript onto the Call doc so the
// UI (polling every 2s) shows what is happening in near-real time.

import Call from "@/backend/models/call";
import Job from "@/backend/models/job";
import Quote from "@/backend/models/quote";
import getVertical from "@/config/verticals";
import { buildBuyerVars } from "@/backend/services/agentVars";
import { finalizeCall } from "@/backend/services/callFinalizer";
import { discoverVendors, jobMarketLocation } from "@/backend/services/vendorDiscovery";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export const realCallsConfigured = () =>
	Boolean(
		process.env.ELEVENLABS_API_KEY &&
			process.env.ELEVENLABS_BUYER_AGENT_ID &&
			process.env.ELEVENLABS_PHONE_NUMBER_ID &&
			publicUrl(),
	);

export const publicUrl = () => process.env.PUBLIC_URL || process.env.PUBLIC_BASE_URL || "";

const RECORDING_NOTE =
	"Quick heads-up: I'm an AI assistant and this call is recorded so my customer can compare quotes. ";

const setDetail = async (call, statusDetail) => {
	call.statusDetail = statusDetail;
	await call.save();
};

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
	const conversationId = data.conversation_id || data.conversationId;
	// ElevenLabs can return HTTP 200 with success:false when telephony rejects
	// the dial (e.g. Twilio trial accounts only reach verified numbers).
	if (data.success === false || !conversationId) {
		throw new Error(`dial rejected: ${data.message || "no conversation id returned"}`);
	}
	return conversationId;
};

// Mirror the live conversation onto the Call doc every poll so the UI can
// show call progress and the transcript as it grows.
const syncLiveState = async (call, conversation) => {
	call.statusDetail = conversation.status || "in-progress";
	if (Array.isArray(conversation.transcript) && conversation.transcript.length) {
		call.transcript = conversation.transcript
			.filter((t) => t.message)
			.map((t, i) => ({
				role: t.role === "agent" ? "agent" : "vendor",
				text: t.message,
				turnIndex: i,
				at: new Date(),
			}));
	}
	await call.save();
};

const pollUntilDone = async (call, { timeoutMs = 12 * 60 * 1000 } = {}) => {
	const headers = { "xi-api-key": process.env.ELEVENLABS_API_KEY };
	const url = `https://api.elevenlabs.io/v1/convai/conversations/${call.elevenConversationId}`;
	const start = Date.now();
	while (Date.now() - start < timeoutMs) {
		await sleep(5000);
		const res = await fetch(url, { headers });
		if (!res.ok) continue;
		const conversation = await res.json();
		await syncLiveState(call, conversation);
		if (["done", "failed"].includes(conversation.status)) {
			return conversation.status;
		}
	}
	return "timeout";
};

// One real call, end to end: dial, mirror progress, pull evidence.
export const runRealCall = async (callId) => {
	const call = await Call.findById(callId);
	if (!call || call.status === "done") return;
	const job = await Job.findById(call.jobId);
	const vertical = getVertical(job.vertical);

	try {
		const vars = await buildBuyerVars(job, call, vertical, { recordingNote: RECORDING_NOTE });
		call.status = "live";
		call.statusDetail = "dialing";
		await call.save();

		call.elevenConversationId = await initiateOutboundCall(call, vars);
		await setDetail(call, "ringing");

		const status = await pollUntilDone(call);
		await setDetail(call, status === "done" ? "call ended, pulling evidence" : status);
		await finalizeCall(call);
		call.statusDetail = undefined;

		// A telephony-level failure (never connected) is a failed call, not a
		// vendor decline. Only completed calls without tool activity count as
		// documented declines.
		if (status !== "done") {
			call.status = "failed";
			if (!call.outcome?.type) call.outcome = { note: `call ${status} before completing` };
		} else if (!call.outcome?.type) {
			call.outcome = {
				type: "declined",
				note: "Call ended without a committed quote or logged outcome.",
			};
		}
		await call.save();
	} catch (error) {
		console.error(`real call ${callId} failed:`, error);
		call.status = "failed";
		call.statusDetail = undefined;
		if (!call.outcome?.type) call.outcome = { note: `error: ${error.message}` };
		await call.save();
	}
};

// Create the full real-call list up front, mirroring the sim batches: vendors
// discovered near the job's own location, assigned to batches of `batchSize`.
export const startRealCalls = async (job, { total = 20, batchSize = 5, location } = {}) => {
	const vertical = getVertical(job.vertical);
	const where = location || jobMarketLocation(job, vertical) || "Rock Hill, SC";
	const vendors = (await discoverVendors(job.vertical, where, { limit: total }))
		.filter((v) => v.phone)
		.slice(0, total);

	const calls = await Call.create(
		vendors.map((v, i) => ({
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
			batch: Math.floor(i / batchSize) + 1,
		})),
	);
	return { calls, vertical };
};

// Same batch semantics as the sim engine: batches run sequentially, calls in a
// batch run concurrently (staggered 2s so we don't burst-dial), batch 2+ gets
// the best clean committed quote as leverage. NO automatic retries: a failed
// real call means a real business's phone rang; a human decides about redials.
// Re-entrant and restart-safe like the sim runner.
const activeRealRuns = new Set();

export const runRealBatches = async (jobId) => {
	const key = jobId.toString();
	if (activeRealRuns.has(key)) return;
	activeRealRuns.add(key);
	try {
		// Orphan recovery after a server restart: calls with a conversation get
		// finalized (the phone call happened without us watching); calls that
		// never dialed go back to pending.
		const orphans = await Call.find({
			jobId,
			mode: "real",
			isTest: { $ne: true },
			status: "live",
		});
		for (const o of orphans) {
			if (o.elevenConversationId) {
				await finalizeCall(o).catch(() => {});
			} else {
				o.status = "pending";
				o.statusDetail = undefined;
				await o.save();
			}
		}

		const calls = await Call.find({
			jobId,
			mode: "real",
			isTest: { $ne: true },
			status: "pending",
		}).sort({ batch: 1 });
		const batches = [...new Set(calls.map((c) => c.batch))].sort((a, b) => a - b);

		for (const b of batches) {
			if (b > 1) {
				const committed = await Quote.find({ jobId, committed: true });
				const best = committed
					.filter((q) => !(q.redFlags || []).some((f) => f.id === "lowball"))
					.sort((x, y) => x.total - y.total || (y.guaranteed === true) - (x.guaranteed === true))[0];
				if (best) {
					await Call.updateMany(
						{ jobId, batch: b, mode: "real", status: "pending" },
						{ $set: { leverageQuoteIds: [best._id] } },
					);
				}
			}
			const batchCalls = calls.filter((c) => c.batch === b);
			await Promise.allSettled(
				batchCalls.map((c, i) => sleep(i * 2000).then(() => runRealCall(c._id))),
			);
		}
	} finally {
		activeRealRuns.delete(key);
	}
};

export default { realCallsConfigured, startRealCalls, runRealCall, runRealBatches };
