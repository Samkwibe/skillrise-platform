import { NextResponse } from "next/server";
import { signupSchema, teacherIntroSchema, formatZodError } from "@/lib/validators";
import { publicUser, id, type User } from "@/lib/store";
import { createSession } from "@/lib/auth";
import { hashPassword } from "@/lib/security/password";
import { randomUrlToken, hashToken } from "@/lib/security/tokens";
import { sendEmailVerificationEmail } from "@/lib/email/transactional";
import { getAuthEmailDispatch } from "@/lib/email/config";
import { buildEmailVerificationUrl, shouldExposeDevEmailLinkInApi } from "@/lib/email/dev-link";
import { clientIp, clientUserAgent } from "@/lib/http/client-meta";
import { rateLimit, clientKey, rateLimitHeaders } from "@/lib/security/rate-limit";
import { getDb } from "@/lib/db";
import { isSmsSendConfigured } from "@/lib/sms/transactional";
import { validateEmailForSignup } from "@/lib/validation/email-external";

export const dynamic = "force-dynamic";

const GRADIENTS = [
  "0e7a4e:1fc87e",
  "b45309:f59e0b",
  "6d28d9:9b6cf5",
  "1d4ed8:4a8ef5",
  "c2410c:f97316",
];

export async function POST(req: Request) {
  const limit = rateLimit(clientKey(req, "signup"), 8, 60 * 60 * 1000);
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Too many signup attempts. Try again in an hour." },
      { status: 429, headers: rateLimitHeaders(limit) },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = signupSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: formatZodError(parsed.error) },
      { status: 400, headers: rateLimitHeaders(limit) },
    );
  }

  const { email, password, name, role, neighborhood, preferredVerificationChannel: prefIn } = parsed.data;
  const emailCheck = await validateEmailForSignup(email);
  if (!emailCheck.ok) {
    return NextResponse.json(
      { error: emailCheck.reason },
      { status: 400, headers: rateLimitHeaders(limit) },
    );
  }
  const preferredVerificationChannel =
    prefIn === "sms" && isSmsSendConfigured() ? "sms" : "email";
  const db = getDb();
  if (await db.findUserByEmail(email)) {
    return NextResponse.json(
      { error: "An account with that email already exists." },
      { status: 409, headers: rateLimitHeaders(limit) },
    );
  }

  // Teacher "welcome intro" — optional for non-teachers, validated when present.
  let teacherIntro: User["teacherIntro"] | undefined;
  if (role === "teacher") {
    const rawIntro = (body as { teacherIntro?: unknown })?.teacherIntro;
    if (rawIntro) {
      const introParsed = teacherIntroSchema.safeParse(rawIntro);
      if (introParsed.success) {
        teacherIntro = introParsed.data;
      }
    }
  }

  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map((s) => s.charAt(0).toUpperCase())
    .join("");
  const grad = GRADIENTS[Math.floor(Math.random() * GRADIENTS.length)];

  const hash = await hashPassword(password);
  const now = Date.now();
  const rawVerify = randomUrlToken();
  const verifyTtl = 48 * 60 * 60 * 1000;
  const user: User = {
    id: `u_${id()}`,
    email,
    password: hash,
    name,
    role,
    neighborhood: neighborhood || "",
    avatar: `${initials}|${grad}`,
    createdAt: now,
    preferredVerificationChannel,
    emailVerificationTokenHash: hashToken(rawVerify),
    emailVerificationExpiresAt: now + verifyTtl,
    ...(teacherIntro
      ? {
          teacherIntro,
          // Surface "what I can teach" in the shared `credentials` field so
          // existing avatar/byline components pick it up automatically.
          credentials: teacherIntro.canTeach.slice(0, 120),
          bio: teacherIntro.whyHelp.slice(0, 400),
        }
      : {}),
  };
  await db.createUser(user);
  await createSession(user.id, { userAgent: clientUserAgent(req), ip: clientIp(req) });

  let emailDelivery: "ses" | "console" | "unknown" | "failed" = "unknown";
  try {
    await sendEmailVerificationEmail(user.email, user.email, rawVerify);
    const d = getAuthEmailDispatch();
    emailDelivery = d === "ses" ? "ses" : d === "dev" ? "console" : "unknown";
  } catch (err) {
    emailDelivery = "failed";
    // eslint-disable-next-line no-console
    console.error("[signup] verification email", err);
  }

  const signupPayload: {
    user: ReturnType<typeof publicUser>;
    emailDelivery: typeof emailDelivery;
    devVerificationLink?: string;
  } = { user: publicUser(user), emailDelivery };
  if (shouldExposeDevEmailLinkInApi() && emailDelivery !== "failed") {
    signupPayload.devVerificationLink = buildEmailVerificationUrl(user.email, rawVerify);
  }
  return NextResponse.json(signupPayload, { status: 201, headers: rateLimitHeaders(limit) });
}
