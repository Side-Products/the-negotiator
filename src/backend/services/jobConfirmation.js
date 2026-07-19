import Job from "@/backend/models/job";
import { validateSpec, validationMessage } from "@/backend/services/jobSpec";

export class SpecValidationError extends Error {
	constructor(errors) {
		super(validationMessage(errors) || "Job specification is invalid");
		this.name = "SpecValidationError";
		this.statusCode = 422;
		this.errors = errors;
	}
}

export const confirmJob = async (jobOrId) => {
	const job =
		typeof jobOrId === "string" || jobOrId?._bsontype === "ObjectId"
			? await Job.findById(jobOrId)
			: jobOrId;
	if (!job) {
		const error = new Error("Job not found");
		error.statusCode = 404;
		throw error;
	}
	if (job.confirmed) return job;

	const result = validateSpec(job.vertical, job.spec, { requireComplete: true });
	if (!result.valid) throw new SpecValidationError(result.errors);

	job.spec = result.spec;
	job.markModified("spec");
	job.confirmed = true;
	job.confirmedAt = new Date();
	job.status = "confirmed";
	await job.save();
	return job;
};

export default confirmJob;
