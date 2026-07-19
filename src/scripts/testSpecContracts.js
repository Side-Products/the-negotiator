import fs from "node:fs";
import mongoose from "mongoose";

const loadEnv = () => {
  if (!fs.existsSync(".env.local")) return;
  for (const line of fs.readFileSync(".env.local", "utf8").split(/\r?\n/)) {
    const clean = line.trim();
    if (!clean || clean.startsWith("#")) continue;
    const index = clean.indexOf("=");
    if (index < 1) continue;
    const key = clean.slice(0, index).trim();
    let value = clean.slice(index + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = value;
  }
};

loadEnv();

const base = process.env.TEST_BASE_URL || "http://localhost:3001";
const futureDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
  .toISOString()
  .slice(0, 10);
let jobId;

const request = async (path, { method = "GET", body } = {}) => {
  const response = await fetch(`${base}${path}`, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await response.json().catch(() => ({}));
  return { response, data };
};

const assertStatus = (actual, expected, label) => {
  if (actual !== expected) {
    throw new Error(`${label}: expected HTTP ${expected}, received ${actual}`);
  }
};

const patch = async (fieldKey, value) =>
  request(`/api/jobs/${jobId}`, {
    method: "PATCH",
    body: { field_key: fieldKey, value_json: JSON.stringify(value) },
  });

try {
  const created = await request("/api/jobs", {
    method: "POST",
    body: { vertical: "moving" },
  });
  assertStatus(created.response.status, 201, "create draft");
  jobId = created.data.job?._id;
  if (!jobId) throw new Error("create draft: missing job id");

  const homeSize = await patch("homeSize", "1 bhk");
  assertStatus(homeSize.response.status, 200, "normalize home-size alias");
  if (homeSize.data.job?.spec?.homeSize !== "1br") {
    throw new Error("normalize home-size alias: expected canonical 1br");
  }

  const malformedInventory = await patch("inventory", { fridge: 1, bed: 1 });
  assertStatus(malformedInventory.response.status, 422, "reject object inventory");

  const incompleteConfirm = await request(`/api/jobs/${jobId}/confirm`, {
    method: "POST",
  });
  assertStatus(incompleteConfirm.response.status, 422, "reject incomplete confirmation");

  const validFields = [
    ["origin", "Plauen, Dresden, Germany"],
    ["destination", "Munich, Germany"],
    ["moveDate", futureDate],
    [
      "inventory",
      [
        { item: "fridge", qty: 1, bulky: true },
        { item: "bed", qty: 1, bulky: true },
      ],
    ],
    ["stairsOrigin", 7],
    ["stairsDest", 20],
    ["elevator", true],
    ["packingNeeded", true],
    ["specialItems", "Bed and fridge; user reports both are over 300 pounds"],
  ];
  for (const [field, value] of validFields) {
    const updated = await patch(field, value);
    assertStatus(updated.response.status, 200, `save ${field}`);
  }

  // The confirm route may return 422 with locationConfirmations when Places
  // verification suggests corrections; the contract is to re-confirm with
  // locationsReviewed: true (same flow as the UI).
  let confirmed = await request(`/api/jobs/${jobId}/confirm`, { method: "POST" });
  if (confirmed.response.status === 422 && confirmed.data.locationConfirmations?.length) {
    confirmed = await request(`/api/jobs/${jobId}/confirm`, {
      method: "POST",
      body: { locationsReviewed: true },
    });
  }
  assertStatus(confirmed.response.status, 200, "confirm valid spec");
  if (!confirmed.data.job?.confirmed || confirmed.data.job?.status !== "confirmed") {
    throw new Error("confirm valid spec: job was not frozen");
  }

  const frozenPatch = await patch("destination", "Berlin, Germany");
  assertStatus(frozenPatch.response.status, 409, "reject edits after confirmation");

  console.log("Spec contract regression checks passed.");
} finally {
  if (jobId && process.env.MONGODB_URI) {
    await mongoose.connect(process.env.MONGODB_URI);
    await mongoose.connection.collection("jobs").deleteOne({
      _id: new mongoose.Types.ObjectId(jobId),
    });
    await mongoose.disconnect();
  }
}
