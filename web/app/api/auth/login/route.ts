import { NextResponse } from "next/server";
import { loginSchema, formatZodError } from "@/lib/validators";
import { publicUser } from "@/lib/store";
import { createSession, isEmailVerified } from "@/lib/auth";
import { verifyPassword } from "@/lib/security/password";
import { rateLimit, clientKey, rateLimitHeaders } from "@/lib/security/rate-limit";
import { getDb } from "@/lib/db";
import { clientIp, clientUserAgent } from "@/lib/http/client-meta";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const limit = rateLimit(clientKey(req, "login"), 10, 15 * 60 * 1000);
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Too many login attempts. Try again in 15 minutes." },
      { status: 429, headers: rateLimitHeaders(limit) },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: formatZodError(parsed.error) },
      { status: 400, headers: rateLimitHeaders(limit) },
    );
  }

  const { email, password } = parsed.data;
  const db = getDb();
  const user = await db.findUserByEmail(email);
  const ok =
    user && user.password ? await verifyPassword(password, user.password) : false;

  // Constant-ish response shape avoids user enumeration timing.
  if (!user || !ok) {
    const errorMsg =
      user && !user.password
        ? "This account uses Google sign-in. Use “Continue with Google” below."
        : "Incorrect email or password.";
    return NextResponse.json(
      { error: errorMsg },
      { status: 401, headers: rateLimitHeaders(limit) },
    );
  }

  await createSession(user.id, { userAgent: clientUserAgent(req), ip: clientIp(req) });
  const pu = publicUser(user);
  return NextResponse.json(
    { user: { ...pu, emailVerified: isEmailVerified(user) } },
    { headers: rateLimitHeaders(limit) },
  );
}
