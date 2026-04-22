import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { publicUser } from "@/lib/store";
import { randomUrlToken, hashToken } from "@/lib/security/tokens";
import { sendEmailVerificationEmail } from "@/lib/email/transactional";
import { rateLimit, clientKey, rateLimitHeaders } from "@/lib/security/rate-limit";

export const dynamic = "force-dynamic";

const VERIFY_TTL_MS = 48 * 60 * 60 * 1000;

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }
  if (user.emailVerifiedAt) {
    return NextResponse.json({ error: "Email is already verified." }, { status: 400 });
  }

  const limit = rateLimit(clientKey(req, "resend-verify"), 3, 60 * 60 * 1000);
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Too many resend requests. Try again in an hour." },
      { status: 429, headers: rateLimitHeaders(limit) },
    );
  }

  const db = getDb();
  const now = Date.now();
  const raw = randomUrlToken();
  const updated = await db.updateUser(user.id, {
    emailVerificationTokenHash: hashToken(raw),
    emailVerificationExpiresAt: now + VERIFY_TTL_MS,
  });
  if (!updated) {
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }

  try {
    await sendEmailVerificationEmail(user.email, user.email, raw);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error("[resend-verification] email", e);
    return NextResponse.json(
      {
        error:
          "We could not send the email. Check that AUTH_EMAIL_MODE=ses, AWS_SES_FROM, and SES permissions are set; see server logs for details.",
      },
      { status: 503, headers: rateLimitHeaders(limit) },
    );
  }

  return NextResponse.json(
    { ok: true, user: publicUser(updated) },
    { status: 200, headers: rateLimitHeaders(limit) },
  );
}
