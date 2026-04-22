import { NextResponse } from "next/server";
import { resetPasswordSchema, formatZodError } from "@/lib/validators";
import { getDb } from "@/lib/db";
import { publicUser } from "@/lib/store";
import { createSession } from "@/lib/auth";
import { hashPassword, verifyPassword } from "@/lib/security/password";
import { hashToken, timingSafeEqualHex } from "@/lib/security/tokens";
import { appendSecurityNotification } from "@/lib/security/security-notifications";
import { clientIp, clientUserAgent } from "@/lib/http/client-meta";
import { rateLimit, clientKey, rateLimitHeaders } from "@/lib/security/rate-limit";

export const dynamic = "force-dynamic";

/**
 * Token is single-use: a successful reset clears `passwordResetTokenHash` in the same
 * `updateUser` that sets the new password, so a replayed request sees no valid token.
 */
export async function POST(req: Request) {
  const limit = rateLimit(clientKey(req, "reset-password"), 8, 15 * 60 * 1000);
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
  const parsed = resetPasswordSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: formatZodError(parsed.error) },
      { status: 400, headers: rateLimitHeaders(limit) },
    );
  }
  const { email, token, password } = parsed.data;
  const db = getDb();
  const user = await db.findUserByEmail(email);
  if (!user?.passwordResetTokenHash) {
    return NextResponse.json(
      { error: "Invalid or expired reset link. Request a new one." },
      { status: 400, headers: rateLimitHeaders(limit) },
    );
  }
  if (!user.passwordResetExpiresAt || user.passwordResetExpiresAt < Date.now()) {
    return NextResponse.json(
      { error: "This reset link has expired. Request a new one." },
      { status: 400, headers: rateLimitHeaders(limit) },
    );
  }
  if (!timingSafeEqualHex(user.passwordResetTokenHash, hashToken(token))) {
    return NextResponse.json(
      { error: "Invalid or expired reset link." },
      { status: 400, headers: rateLimitHeaders(limit) },
    );
  }

  if (user.password && (await verifyPassword(password, user.password))) {
    return NextResponse.json(
      { error: "Choose a new password you haven’t used here before." },
      { status: 400, headers: rateLimitHeaders(limit) },
    );
  }

  const hash = await hashPassword(password);
  const updated = await db.updateUser(user.id, {
    password: hash,
    passwordResetTokenHash: undefined,
    passwordResetExpiresAt: undefined,
  });
  if (!updated) {
    return NextResponse.json({ error: "Update failed" }, { status: 500, headers: rateLimitHeaders(limit) });
  }

  await appendSecurityNotification(user.id, {
    kind: "password_changed",
    title: "Password changed",
    detail: "Your password was reset. If this wasn’t you, change it again and contact support.",
  });

  await db.deleteSessionsForUser(user.id);
  await createSession(user.id, { userAgent: clientUserAgent(req), ip: clientIp(req) });

  return NextResponse.json(
    { ok: true, user: publicUser(updated) },
    { headers: rateLimitHeaders(limit) },
  );
}
