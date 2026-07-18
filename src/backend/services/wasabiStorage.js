// Wasabi (S3-compatible) storage for call recordings and uploaded documents.
// Trimmed ESM port of viraloop's wasabiUploadService. We store object KEYS in
// Mongo and serve via presigned redirects, so private buckets work too.

import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

let client = null;

export const wasabiConfigured = () =>
	Boolean(
		process.env.WASABI_ACCESS_KEY_ID &&
			process.env.WASABI_SECRET_ACCESS_KEY &&
			process.env.WASABI_BUCKET_NAME,
	);

const getClient = () => {
	if (client) return client;
	const region = process.env.WASABI_REGION || "us-east-1";
	client = new S3Client({
		region,
		endpoint: `https://s3.${region}.wasabisys.com`,
		credentials: {
			accessKeyId: process.env.WASABI_ACCESS_KEY_ID,
			secretAccessKey: process.env.WASABI_SECRET_ACCESS_KEY,
		},
		maxAttempts: 3,
	});
	return client;
};

export const uploadBuffer = async (buffer, key, contentType) => {
	await getClient().send(
		new PutObjectCommand({
			Bucket: process.env.WASABI_BUCKET_NAME,
			Key: key,
			Body: buffer,
			ContentType: contentType,
		}),
	);
	return key;
};

// Presigned GET URL (1h default). Works whether or not the bucket is public.
export const presignedUrl = (key, expiresIn = 3600) =>
	getSignedUrl(
		getClient(),
		new GetObjectCommand({ Bucket: process.env.WASABI_BUCKET_NAME, Key: key }),
		{ expiresIn },
	);

export default { wasabiConfigured, uploadBuffer, presignedUrl };
