import { NextResponse } from "next/server";
import { forgotPasswordSchema, formatZodError } from "@/lib/validators";
import { getDb } from "@/lib/db";
import { randomUrlToken, hashToken } from "@/lib/security/tokens";
import { sendPasswordResetEmail } from "@/lib/email/transactional";
import { buildPasswordResetUrl, shouldExposeDevEmailLinkInApi } from "@/lib/email/dev-link";
import { rateLimit, clientKey, rateLimitHeaders } from "@/lib/security/rate-limit";
import { passwordResetTtlMs } from "@/lib/auth/security-policy";

export const dynamic = "force-dynamic";

const GENERIC = { ok: true as const, message: "If an account exists for that email, we sent a reset link." };

export async function POST(req: Request) {
  const limit = rateLimit(clientKey(req, "forgot-password"), 5, 60 * 60 * 1000);
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Too many requests. Try again in an hour." },
      { status: 429, headers: rateLimitHeaders(limit) },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = forgotPasswordSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: formatZodError(parsed.error) },
      { status: 400, headers: rateLimitHeaders(limit) },
    );
  }

  const { email } = parsed.data;
  const db = getDb();
  const user = await db.findUserByEmail(email);
  let rawToken: string | undefined;
  if (user) {
    rawToken = randomUrlToken();
    const now = Date.now();
    await db.updateUser(user.id, {
      passwordResetTokenHash: hashToken(rawToken),
      passwordResetExpiresAt: now + passwordResetTtlMs(),
    });
    try {
      await sendPasswordResetEmail(user.email, user.email, rawToken);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error("[forgot-password] email (user still received generic response)", e);
    }
  }

  const payload: { ok: true; message: string; devPasswordResetLink?: string } = { ...GENERIC };
  if (user && rawToken && shouldExposeDevEmailLinkInApi()) {
    payload.devPasswordResetLink = buildPasswordResetUrl(user.email, rawToken);
  }
  return NextResponse.json(payload, { headers: rateLimitHeaders(limit) });
}
