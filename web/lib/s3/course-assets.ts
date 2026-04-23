import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

function region() {
  return (process.env.AWS_S3_COURSE_REGION || process.env.AWS_REGION || "us-east-1").trim();
}

function bucket() {
  return (process.env.SKILLRISE_COURSE_BUCKET || process.env.AWS_S3_COURSE_BUCKET || "").trim();
}

/**
 * S3 is optional: when bucket is not set, teacher uploads are disabled
 * and courses can still use YouTube or pasted HTTPS URLs.
 */
export function isCourseS3Configured(): boolean {
  return Boolean(bucket());
}

/**
 * Create a private object key. Caller must ensure `teacherId` is authorized.
 */
export function makeCourseObjectKey(
  kind: "videos" | "materials" | "thumbnails",
  trackSlug: string,
  fileName: string,
): string {
  const safe = fileName.replace(/[^a-zA-Z0-9._-]+/g, "_").slice(0, 120) || "file";
  const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  return `courses/${trackSlug}/${kind}/${id}-${safe}`;
}

let _client: S3Client | null = null;
function s3(): S3Client {
  if (!_client) _client = new S3Client({ region: region() });
  return _client;
}

const VIDEO_TYPES = new Set([
  "video/mp4",
  "video/webm",
  "video/quicktime",
  "video/x-msvideo", // .avi (optional)
]);

const DOC_TYPES = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/vnd.ms-powerpoint",
]);

export function isAllowedVideoContentType(ct: string): boolean {
  return VIDEO_TYPES.has(ct.toLowerCase().trim());
}

export function isAllowedMaterialContentType(ct: string): boolean {
  const c = ct.toLowerCase().trim();
  return DOC_TYPES.has(c) || c === "text/plain" || c === "application/octet-stream";
}

type PresignPutArgs = {
  key: string;
  contentType: string;
};

export async function presignPutObject(args: PresignPutArgs): Promise<{ uploadUrl: string; key: string; bucket: string }> {
  const b = bucket();
  if (!b) throw new Error("course_s3_unconfigured");
  const cmd = new PutObjectCommand({
    Bucket: b,
    Key: args.key,
    ContentType: args.contentType,
  });
  const uploadUrl = await getSignedUrl(s3(), cmd, { expiresIn: 3600 });
  return { uploadUrl, key: args.key, bucket: b };
}

export async function presignGetObject(key: string, expiresInSec = 3600): Promise<string> {
  const b = bucket();
  if (!b) throw new Error("course_s3_unconfigured");
  const cmd = new GetObjectCommand({ Bucket: b, Key: key });
  return getSignedUrl(s3(), cmd, { expiresIn: expiresInSec });
}

/** Read full object into memory. Prefer short media for transcription (Whisper has size limits). */
export async function getObjectBuffer(key: string): Promise<Buffer> {
  const b = bucket();
  if (!b) throw new Error("course_s3_unconfigured");
  const out = await s3().send(new GetObjectCommand({ Bucket: b, Key: key }));
  const body = out.Body;
  if (!body) throw new Error("s3_empty_body");
  const chunks: Buffer[] = [];
  for await (const chunk of body as AsyncIterable<Uint8Array>) {
    chunks.push(Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

/** Public or CDN URL when objects are made world-readable; otherwise use presignGetObject. */
export function publicObjectUrl(key: string): string | null {
  const b = bucket();
  if (!b) return null;
  return `https://${b}.s3.${region()}.amazonaws.com/${key.split("/").map(encodeURIComponent).join("/")}`;
}
