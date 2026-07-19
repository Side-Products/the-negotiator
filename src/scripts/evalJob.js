// npm run eval <jobId> — golden-call checks from the challenge brief, run
// against a finished job through the local API. Prints PASS/FAIL per check.
// Brief: "build simple evals: does the agent extract every fee? Does it catch
// the 30%-below-market red flag? Use these to iterate on your prompts."

const BASE = process.env.EVAL_BASE_URL || "http://localhost:3001";

const ROBOT_RE = /robot|are you (an? )?(ai|bot)|talking to a (machine|computer|robot)/i;
const DISCLOSE_RE = /\b(ai|artificial intelligence) assistant\b/i;

async function main() {
	const jobId = process.argv[2];
	if (!jobId) {
		console.error("usage: npm run eval <jobId>");
		process.exit(1);
	}
	const res = await fetch(`${BASE}/api/jobs/${jobId}`);
	if (!res.ok) {
		console.error(`GET /api/jobs/${jobId} failed: ${res.status}`);
		process.exit(1);
	}
	const { job, calls, quotes } = await res.json();
	const committed = quotes.filter((q) => q.committed);
	const results = [];
	const check = (name, pass, detail) => results.push({ name, pass, detail });

	// 1. One confirmed spec, reused verbatim: every call pins the same version.
	check(
		"spec confirmed and version-pinned on every call",
		job.confirmed && calls.length > 0 && calls.every((c) => c.specVersion === job.specVersion),
		`spec v${job.specVersion}, ${calls.length} calls`,
	);

	// 2. Every finished call ends in a structured outcome.
	const finished = calls.filter((c) => c.status === "done");
	const unstructured = finished.filter(
		(c) => !c.outcome?.type && !committed.some((q) => q.callId === c._id),
	);
	check(
		"every finished call has a structured outcome",
		finished.length > 0 && unstructured.length === 0,
		`${finished.length} finished, ${unstructured.length} without outcome`,
	);

	// 3. Itemisation: committed quotes carry >= 3 fee lines.
	const thin = committed.filter((q) => (q.lines || []).length < 3);
	check(
		"committed quotes are itemised (>= 3 lines)",
		committed.length > 0 && thin.length === 0,
		`${committed.length} committed, thin: ${thin.map((q) => `$${q.total}`).join(", ") || "none"}`,
	);

	// 4. The 30%-below-market red flag fires exactly when it should.
	const verticalRes = await fetch(`${BASE}/api/jobs/${jobId}`);
	void verticalRes; // benchmarks come from config; recompute from the report page's source
	const configs = { moving: 1900, autobody: 1650 };
	const mid = configs[job.vertical];
	const misflagged = mid
		? committed.filter((q) => {
				const shouldFlag = q.total < mid * 0.7;
				const flagged = (q.redFlags || []).some((f) => f.id === "lowball");
				return shouldFlag !== flagged;
			})
		: [];
	check(
		"lowball red flag fires iff total < 70% of market mid",
		mid !== undefined && misflagged.length === 0,
		misflagged.length ? `wrong on: ${misflagged.map((q) => `$${q.total}`).join(", ")}` : "consistent",
	);

	// 5. Disclosure: wherever the robot question was asked, the buyer disclosed.
	const askedCalls = calls.filter((c) =>
		(c.transcript || []).some((t) => t.role === "vendor" && ROBOT_RE.test(t.text || "")),
	);
	const undisclosed = askedCalls.filter(
		(c) => !(c.transcript || []).some((t) => t.role !== "vendor" && DISCLOSE_RE.test(t.text || "")),
	);
	check(
		"AI disclosure whenever the robot question was asked",
		undisclosed.length === 0,
		`asked in ${askedCalls.length} call(s), undisclosed: ${undisclosed.length}`,
	);

	// 6. Leverage integrity: negotiation events only on calls that had leverage.
	const badEvents = calls.filter(
		(c) => (c.negotiationEvents || []).length > 0 && !(c.leverageQuoteIds || []).length && c.round === 1,
	);
	check(
		"negotiation events only where leverage existed",
		badEvents.length === 0,
		badEvents.length ? badEvents.map((c) => c.vendorName).join(", ") : "clean",
	);

	// 7. Report citations resolve to real transcript turns.
	let citationCheck = { pass: true, detail: "no report yet" };
	if (job.report?.narrative) {
		const cites = [...job.report.narrative.matchAll(/\[call:([a-f0-9]{24})#(\d+)\]/g)];
		const broken = cites.filter(([, callId, turn]) => {
			const call = calls.find((c) => c._id === callId);
			return !call || !(call.transcript || []).some((t) => t.turnIndex === Number(turn));
		});
		citationCheck = {
			pass: cites.length > 0 && broken.length === 0,
			detail: `${cites.length} citations, ${broken.length} broken`,
		};
	}
	check("report citations resolve to real transcript turns", citationCheck.pass, citationCheck.detail);

	// 8. Totals are the sum of their lines (server-truth invariant held).
	const drift = committed.filter(
		(q) => Math.abs((q.lines || []).reduce((s, l) => s + (l.amount || 0), 0) - q.total) > 1,
	);
	check("committed totals equal the sum of itemised lines", drift.length === 0, `drift: ${drift.length}`);

	console.log(`\nEval: job ${jobId} (${job.vertical}, ${calls.length} calls, ${committed.length} committed)\n`);
	for (const r of results) {
		console.log(` ${r.pass ? "PASS" : "FAIL"}  ${r.name}${r.detail ? `  [${r.detail}]` : ""}`);
	}
	const failed = results.filter((r) => !r.pass).length;
	console.log(`\n${results.length - failed}/${results.length} checks passed\n`);
	process.exit(failed ? 1 : 0);
}

main().catch((err) => {
	console.error(err.message || err);
	process.exit(1);
});
