/**
 * Tiered cache.
 *
 * Primary: DynamoDB (single-table, auto-expires via TTL attribute)
 * Fallback: in-process Map (used when AWS creds aren't configured OR a
 *           DynamoDB call fails — the cache is best-effort and must
 *           never break the request path).
 *
 * Usage:
 *   const hit = await cacheGet<T>("search:brave:react basics");
 *   if (hit) return hit;
 *   const fresh = await expensiveFetch();
 *   await cacheSet("search:brave:react basics", fresh, { ttlHours: 36 });
 *
 * Table layout (reuses the existing single-table design):
 *   pk:  "CACHE"
 *   sk:  "<namespace>#<sha1(input)>"
 *   ttl: <epoch seconds>  ← DynamoDB TTL attribute (must be enabled on table)
 *   value: <JSON-serializable payload>
 */
import { createHash } from "node:crypto";
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
} from "@aws-sdk/lib-dynamodb";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";

type CacheEntry<T> = { value: T; expiresAt: number };

const memStore = new Map<string, CacheEntry<unknown>>();

function awsCredsPresent(): boolean {
  return Boolean(
    process.env.AWS_ACCESS_KEY_ID &&
      process.env.AWS_SECRET_ACCESS_KEY &&
      (process.env.DYNAMO_TABLE || process.env.DYNAMO_CACHE_TABLE),
  );
}

declare global {
  // eslint-disable-next-line no-var
  var __skillrise_cache_doc__: DynamoDBDocumentClient | undefined;
}

function getDoc(): DynamoDBDocumentClient | null {
  if (!awsCredsPresent()) return null;
  if (globalThis.__skillrise_cache_doc__) return globalThis.__skillrise_cache_doc__;
  const region = process.env.AWS_REGION || "us-east-1";
  const raw = new DynamoDBClient({ region });
  const doc = DynamoDBDocumentClient.from(raw, {
    marshallOptions: { removeUndefinedValues: true },
  });
  globalThis.__skillrise_cache_doc__ = doc;
  return doc;
}

function tableName(): string {
  return (
    process.env.DYNAMO_CACHE_TABLE ||
    process.env.DYNAMO_TABLE ||
    "skillrise"
  );
}

function hashKey(raw: string): string {
  return createHash("sha1").update(raw).digest("hex").slice(0, 40);
}

function cacheSk(namespace: string, input: string): string {
  // Using a hash keeps the SK short and bounded even when the input is
  // a long query string. Including a snippet up front aids debugging
  // from the AWS console.
  const preview = input.trim().toLowerCase().slice(0, 32).replace(/[^a-z0-9]+/g, "-");
  return `${namespace}#${preview}#${hashKey(input)}`;
}

export type CacheOpts = {
  /** Default: 24 hours. Per-namespace tuning is encouraged. */
  ttlHours?: number;
};

export async function cacheGet<T>(
  namespace: string,
  input: string,
): Promise<T | null> {
  const now = Math.floor(Date.now() / 1000);
  const sk = cacheSk(namespace, input);

  // Try memory first — it's the hot path.
  const mem = memStore.get(sk) as CacheEntry<T> | undefined;
  if (mem) {
    if (mem.expiresAt > now) return mem.value;
    memStore.delete(sk);
  }

  const doc = getDoc();
  if (!doc) return null;

  try {
    const { Item } = await doc.send(
      new GetCommand({ TableName: tableName(), Key: { pk: "CACHE", sk } }),
    );
    if (!Item) return null;
    const ttl = typeof Item.ttl === "number" ? Item.ttl : 0;
    if (ttl > 0 && ttl <= now) return null;
    const value = Item.value as T;
    // Warm the mem cache so the next call is fast.
    memStore.set(sk, { value, expiresAt: ttl || now + 60 });
    return value;
  } catch {
    // Network / permissions issue — degrade silently. Cache is best-effort.
    return null;
  }
}

export async function cacheSet<T>(
  namespace: string,
  input: string,
  value: T,
  opts: CacheOpts = {},
): Promise<void> {
  const hours = Math.max(1, opts.ttlHours ?? 24);
  const expiresAt = Math.floor(Date.now() / 1000) + hours * 3600;
  const sk = cacheSk(namespace, input);

  memStore.set(sk, { value, expiresAt });

  const doc = getDoc();
  if (!doc) return;

  try {
    await doc.send(
      new PutCommand({
        TableName: tableName(),
        Item: {
          pk: "CACHE",
          sk,
          namespace,
          inputPreview: input.slice(0, 140),
          value,
          ttl: expiresAt,
          updatedAt: Math.floor(Date.now() / 1000),
        },
      }),
    );
  } catch {
    // Swallow: a failed cache write should never break user-facing flow.
  }
}

/**
 * For cache-aside with a single call:
 *
 *   const result = await cached(
 *     "search:brave", q,
 *     () => braveFetch(q),
 *     { ttlHours: 36 },
 *   );
 */
export async function cached<T>(
  namespace: string,
  input: string,
  loader: () => Promise<T>,
  opts?: CacheOpts,
): Promise<T> {
  const hit = await cacheGet<T>(namespace, input);
  if (hit !== null) return hit;
  const fresh = await loader();
  await cacheSet(namespace, input, fresh, opts);
  return fresh;
}
