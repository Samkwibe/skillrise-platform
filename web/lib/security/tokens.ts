import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

/** URL-safe random token (opaque). */
export function randomUrlToken(bytes = 32): string {
  return randomBytes(bytes).toString("base64url");
}

export function hashToken(raw: string): string {
  return createHash("sha256").update(raw, "utf8").digest("hex");
}

export function timingSafeEqualHex(a: string, b: string): boolean {
  try {
    const ba = Buffer.from(a, "hex");
    const bb = Buffer.from(b, "hex");
    if (ba.length !== bb.length) return false;
    return timingSafeEqual(ba, bb);
  } catch {
    return false;
  }
}
