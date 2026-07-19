import getVertical from "@/config/verticals";

const TYPE_MAP = {
	string: "string",
	date: "string",
	enum: "string",
	number: "number",
	boolean: "boolean",
};

const isPlainObject = (value) =>
	value !== null && typeof value === "object" && !Array.isArray(value);

const normalizedToken = (value) =>
	String(value)
		.trim()
		.toLowerCase()
		.replace(/[._-]+/g, " ")
		.replace(/\s+/g, " ");

const optionValue = (option) =>
	typeof option === "object" && option !== null ? option.value : option;

const optionLabel = (field, value) => {
	const option = (field.options || []).find((candidate) => optionValue(candidate) === value);
	if (typeof option === "object" && option !== null) return option.label || option.value;
	return field.optionLabels?.[value] || value;
};

const nullable = (schema) => {
	const type = Array.isArray(schema.type) ? schema.type : [schema.type];
	return {
		...schema,
		type: [...type, "null"],
		...(schema.enum ? { enum: [...schema.enum, null] } : {}),
	};
};

export const fieldToJsonSchema = (field, { allowNull = false } = {}) => {
	let schema;
	if (field.type === "enum") {
		schema = {
			type: "string",
			enum: (field.options || []).map(optionValue),
			description: field.label,
		};
	} else if (field.type === "list") {
		const properties = Object.fromEntries(
			Object.entries(field.itemShape || {}).map(([key, type]) => {
				if (type === "enum") {
					return [
						key,
						{
							type: "string",
							enum: field.itemOptions?.[key] || field.options || [],
						},
					];
				}
				return [key, { type: TYPE_MAP[type] || "string" }];
			}),
		);
		schema = {
			type: "array",
			description: field.label,
			items: {
				type: "object",
				properties,
				required: Object.keys(properties),
				additionalProperties: false,
			},
		};
	} else {
		schema = {
			type: TYPE_MAP[field.type] || "string",
			description: field.label,
		};
	}
	return allowNull ? nullable(schema) : schema;
};

export const buildSpecJsonSchema = (
	vertical,
	{ partial = false, strict = false } = {},
) => {
	const properties = Object.fromEntries(
		vertical.jobSpec.fields.map((field) => [
			field.key,
			fieldToJsonSchema(field, { allowNull: partial && strict }),
		]),
	);
	return {
		type: "object",
		properties,
		required: strict
			? Object.keys(properties)
			: vertical.jobSpec.fields.filter((field) => field.required && !partial).map((field) => field.key),
		additionalProperties: false,
	};
};

export const buildIntakeResponseSchema = (vertical) => ({
	type: "object",
	properties: {
		reply: { type: "string" },
		patch: buildSpecJsonSchema(vertical, { partial: true, strict: true }),
	},
	required: ["reply", "patch"],
	additionalProperties: false,
});

const errorFor = (field, message) => ({
	field: field?.key || null,
	message,
});

const normalizeEnum = (field, value) => {
	const token = normalizedToken(value);
	const options = (field.options || []).map(optionValue);
	const direct = options.find((option) => normalizedToken(option) === token);
	if (direct !== undefined) return direct;
	const alias = Object.entries(field.aliases || {}).find(
		([candidate]) => normalizedToken(candidate) === token,
	);
	return alias ? alias[1] : value;
};

const normalizeBoolean = (value) => {
	if (typeof value === "boolean") return value;
	const token = normalizedToken(value);
	if (["yes", "y", "true", "1"].includes(token)) return true;
	if (["no", "n", "false", "0"].includes(token)) return false;
	return value;
};

const normalizeListItem = (field, row) => {
	if (!isPlainObject(row)) return row;
	const normalized = { ...row };
	Object.entries(field.itemShape || {}).forEach(([key, type]) => {
		let value = row[key];
		if (type === "string" && typeof value === "string") value = value.trim();
		if (type === "number" && typeof value === "string" && value.trim() !== "") {
			value = Number(value);
		}
		if (type === "boolean") value = normalizeBoolean(value);
		if (type === "enum") {
			const itemField = {
				...field,
				options: field.itemOptions?.[key] || field.options || [],
				aliases: field.itemAliases?.[key] || {},
			};
			value = normalizeEnum(itemField, value);
		}
		normalized[key] = value;
	});
	return normalized;
};

const normalizeFieldValue = (field, value) => {
	if (value === null || value === undefined) return value;
	if ((field.type === "string" || field.type === "date") && typeof value === "string") {
		return value.trim();
	}
	if (field.type === "enum") return normalizeEnum(field, value);
	if (field.type === "boolean") return normalizeBoolean(value);
	if (field.type === "number" && typeof value === "string" && value.trim() !== "") {
		return Number(value);
	}
	if (field.type === "list" && Array.isArray(value)) {
		return value.map((row) => normalizeListItem(field, row));
	}
	return value;
};

const validateDate = (field, value) => {
	if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
		return "must be a date in YYYY-MM-DD format";
	}
	const date = new Date(`${value}T00:00:00Z`);
	if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
		return "must be a real calendar date";
	}
	if (field.future) {
		const today = new Date().toISOString().slice(0, 10);
		if (value < today) return "must not be in the past";
	}
	return null;
};

const validateScalar = (field, value) => {
	if (field.type === "string") {
		if (typeof value !== "string" || !value.trim()) return "must be a non-empty string";
		return null;
	}
	if (field.type === "date") return validateDate(field, value);
	if (field.type === "enum") {
		const options = (field.options || []).map(optionValue);
		if (typeof value !== "string" || !options.includes(value)) {
			return `must be one of: ${options.join(", ")}`;
		}
		return null;
	}
	if (field.type === "number") {
		if (typeof value !== "number" || !Number.isFinite(value)) return "must be a number";
		if (field.integer && !Number.isInteger(value)) return "must be a whole number";
		if (field.min !== undefined && value < field.min) return `must be at least ${field.min}`;
		if (field.max !== undefined && value > field.max) return `must be no more than ${field.max}`;
		return null;
	}
	if (field.type === "boolean" && typeof value !== "boolean") return "must be yes or no";
	return null;
};

const validateList = (field, value) => {
	if (!Array.isArray(value)) return ["must be a list"];
	if (field.required && value.length === 0) return ["must contain at least one item"];
	const errors = [];
	value.forEach((row, index) => {
		if (!isPlainObject(row)) {
			errors.push(`item ${index + 1} must be an object`);
			return;
		}
		const allowed = new Set(Object.keys(field.itemShape || {}));
		Object.keys(row)
			.filter((key) => !allowed.has(key))
			.forEach((key) => errors.push(`item ${index + 1} has unknown field ${key}`));
		Object.entries(field.itemShape || {}).forEach(([key, type]) => {
			const itemField = {
				key,
				type,
				options: field.itemOptions?.[key] || field.options || [],
				aliases: field.itemAliases?.[key] || {},
				integer: type === "number" ? field.itemInteger?.[key] !== false : undefined,
				min: type === "number" ? field.itemMin?.[key] ?? 0 : undefined,
			};
			const error = validateScalar(itemField, row[key]);
			if (error) errors.push(`item ${index + 1} ${key} ${error}`);
		});
	});
	return errors;
};

export const normalizeSpecPatch = (verticalId, patch) => {
	const vertical = getVertical(verticalId);
	if (!vertical) {
		return { patch: {}, errors: [errorFor(null, `Unknown vertical: ${verticalId}`)] };
	}
	if (!isPlainObject(patch)) {
		return { patch: {}, errors: [errorFor(null, "Spec patch must be an object")] };
	}
	const fields = new Map(vertical.jobSpec.fields.map((field) => [field.key, field]));
	const errors = [];
	const normalized = {};
	Object.entries(patch).forEach(([key, value]) => {
		if (value === null || value === undefined) return;
		const field = fields.get(key);
		if (!field) {
			errors.push(errorFor(null, `Unknown spec field: ${key}`));
			return;
		}
		const next = normalizeFieldValue(field, value);
		const fieldErrors =
			field.type === "list"
				? validateList(field, next)
				: [validateScalar(field, next)].filter(Boolean);
		fieldErrors.forEach((message) => errors.push(errorFor(field, message)));
		if (fieldErrors.length === 0) normalized[key] = next;
	});
	return { patch: normalized, errors };
};

export const validateSpec = (verticalId, input, { requireComplete = false } = {}) => {
	const vertical = getVertical(verticalId);
	if (!vertical) {
		return {
			valid: false,
			spec: {},
			errors: [errorFor(null, `Unknown vertical: ${verticalId}`)],
		};
	}
	const { patch: spec, errors } = normalizeSpecPatch(verticalId, input || {});
	const fields = vertical.jobSpec.fields;
	if (requireComplete) {
		fields
			.filter((field) => field.required)
			.forEach((field) => {
				const value = spec[field.key];
				const missing =
					value === undefined ||
					value === null ||
					value === "" ||
					(Array.isArray(value) && value.length === 0);
				if (missing) errors.push(errorFor(field, "is required"));
			});
	}
	for (const rule of vertical.jobSpec.rules || []) {
		const message = rule.validate(spec);
		if (message) errors.push(errorFor({ key: rule.field || null }, message));
	}
	return { valid: errors.length === 0, spec, errors };
};

export const applySpecPatch = (verticalId, currentSpec, patch) => {
	const normalizedPatch = normalizeSpecPatch(verticalId, patch);
	if (normalizedPatch.errors.length) {
		return {
			valid: false,
			spec: currentSpec || {},
			patch: {},
			errors: normalizedPatch.errors,
		};
	}
	const merged = { ...(currentSpec || {}), ...normalizedPatch.patch };
	const checked = validateSpec(verticalId, merged);
	return { ...checked, patch: normalizedPatch.patch };
};

export const formatSpecValue = (field, value) => {
	if (value === undefined || value === null || value === "") return "Not provided";
	if (field.type === "boolean") return value ? "Yes" : "No";
	if (field.type === "enum") return optionLabel(field, value);
	if (field.type === "list") {
		if (!Array.isArray(value)) return "Invalid list data";
		return value
			.map((row) => {
				if (!isPlainObject(row)) return String(row);
				const primary = row.item ?? row.name ?? row.panel ?? "Item";
				const quantity = row.qty !== undefined ? ` ×${row.qty}` : "";
				const details = Object.entries(row)
					.filter(([key]) => !["item", "name", "panel", "qty"].includes(key))
					.map(([key, itemValue]) => {
						if (typeof itemValue === "boolean") return itemValue ? key : null;
						return itemValue ? `${key}: ${itemValue}` : null;
					})
					.filter(Boolean);
				return `${primary}${quantity}${details.length ? ` (${details.join(", ")})` : ""}`;
			})
			.join(", ");
	}
	return String(value);
};

export const formatSpecSummary = (verticalId, spec) => {
	const vertical = getVertical(verticalId);
	if (!vertical) return "Invalid job specification";
	const lines = vertical.jobSpec.fields
		.filter((field) => spec?.[field.key] !== undefined)
		.map((field) => `${field.label}: ${formatSpecValue(field, spec[field.key])}`);
	return [`Please confirm these details:`, "", ...lines, "", `Reply "yes" to confirm, or tell me what to change.`].join(
		"\n",
	);
};

export const validationMessage = (errors) =>
	(errors || []).map((error) => `${error.field ? `${error.field}: ` : ""}${error.message}`).join("; ");

export default {
	applySpecPatch,
	buildIntakeResponseSchema,
	buildSpecJsonSchema,
	fieldToJsonSchema,
	formatSpecSummary,
	formatSpecValue,
	normalizeSpecPatch,
	validateSpec,
	validationMessage,
};
