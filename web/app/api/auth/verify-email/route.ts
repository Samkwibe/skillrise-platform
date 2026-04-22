import { NextResponse } from "next/server";
import { confirmEmailSchema, formatZodError } from "@/lib/validators";
import { getDb } from "@/lib/db";
import { publicUser } from "@/lib/store";
import { hashToken, timingSafeEqualHex } from "@/lib/security/tokens";
import { appendSecurityNotification } from "@/lib/security/security-notifications";
import { rateLimit, clientKey, rateLimitHeaders } from "@/lib/security/rate-limit";

export const dynamic = "force-dynamic";

/** Confirms email in one step; verification token is single-use (cleared in the same update as `emailVerifiedAt`). */
export async function POST(req: Request) {
  const limit = rateLimit(clientKey(req, "verify-email"), 10, 15 * 60 * 1000);
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Too many attempts. Try again later." },
      { status: 429, headers: rateLimitHeaders(limit) },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = confirmEmailSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: formatZodError(parsed.error) },
      { status: 400, headers: rateLimitHeaders(limit) },
    );
  }
  const { email, token } = parsed.data;
  const db = getDb();
  const user = await db.findUserByEmail(email);
  if (!user?.emailVerificationTokenHash) {
    return NextResponse.json(
      { error: "Invalid or expired link." },
      { status: 400, headers: rateLimitHeaders(limit) },
    );
  }
  if (user.emailVerificationExpiresAt && user.emailVerificationExpiresAt < Date.now()) {
    return NextResponse.json(
      { error: "This link has expired. Request a new one from your account." },
      { status: 400, headers: rateLimitHeaders(limit) },
    );
  }
  if (!timingSafeEqualHex(user.emailVerificationTokenHash, hashToken(token))) {
    return NextResponse.json(
      { error: "Invalid or expired link." },
      { status: 400, headers: rateLimitHeaders(limit) },
    );
  }

  const updated = await db.updateUser(user.id, {
    emailVerifiedAt: Date.now(),
    emailVerificationTokenHash: undefined,
    emailVerificationExpiresAt: undefined,
    phonePendingE164: undefined,
    phoneVerificationCodeHash: undefined,
    phoneVerificationExpiresAt: undefined,
  });
  if (!updated) {
    return NextResponse.json({ error: "Update failed" }, { status: 500, headers: rateLimitHeaders(limit) });
  }
  await appendSecurityNotification(user.id, {
    kind: "email_verified",
    title: "Email verified",
    detail: "You can use all account features that require a verified address.",
  });
  return NextResponse.json(
    { ok: true, user: publicUser(updated) },
    { headers: rateLimitHeaders(limit) },
  );
}
