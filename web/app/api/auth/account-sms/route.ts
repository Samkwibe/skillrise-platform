import { NextResponse } from "next/server";
import { getCurrentUser, isEmailVerified } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { publicUser, type User } from "@/lib/store";
import { accountSmsActionSchema, formatZodError } from "@/lib/validators";
import { hashToken, timingSafeEqualHex } from "@/lib/security/tokens";
import { generateOtp6, OTP6_TTL_MS } from "@/lib/security/otp6";
import { rateLimit, clientKey, rateLimitHeaders } from "@/lib/security/rate-limit";
import { sendVerificationSms, isSmsSendConfigured } from "@/lib/sms/transactional";
import { parseToE164 } from "@/lib/phone/e164";
import { validatePhoneWithNumverify } from "@/lib/validation/phone-external";
import { appendSecurityNotification } from "@/lib/security/security-notifications";
import { willSmsActuallySend } from "@/lib/sms/transactional";

export const dynamic = "force-dynamic";

/**
 * Unverified users only: send / confirm SMS code to complete account access (sets `emailVerifiedAt`
 * and verifies the phone). Does not require `getVerifiedUserForApi`.
 */
export async function POST(req: Request) {
  if (!isSmsSendConfigured()) {
    return NextResponse.json(
      { error: "SMS account verification is not available (SMS is disabled for this environment)." },
      { status: 503 },
    );
  }
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }
  if (isEmailVerified(user)) {
    return NextResponse.json({ error: "Your account is already verified." }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = accountSmsActionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: formatZodError(parsed.error) },
      { status: 400 },
    );
  }
  if (parsed.data.action === "start") {
    return handleStart(user, parsed.data.phone, req);
  }
  return handleConfirm(user, parsed.data.code, req);
}

async function handleStart(user: User, rawPhone: string, req: Request) {
  const limit = rateLimit(clientKey(req, "account-sms-start"), 5, 15 * 60 * 1000);
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Too many SMS requests. Try again in a few minutes." },
      { status: 429, headers: rateLimitHeaders(limit) },
    );
  }
  const e164 = parseToE164(rawPhone);
  if (!e164) {
    return NextResponse.json(
      { error: "Enter a valid mobile number (include country code, e.g. +1 for US)." },
      { status: 400, headers: rateLimitHeaders(limit) },
    );
  }
  const numverify = await validatePhoneWithNumverify(e164);
  if (!numverify.ok) {
    return NextResponse.json(
      { error: numverify.reason },
      { status: 400, headers: rateLimitHeaders(limit) },
    );
  }
  const db = getDb();
  const taken = await db.findUserByVerifiedPhoneE164(e164, user.id);
  if (taken) {
    return NextResponse.json(
      { error: "That number is already verified on another account." },
      { status: 409, headers: rateLimitHeaders(limit) },
    );
  }
  const code = generateOtp6();
  const now = Date.now();
  const updated = await db.updateUser(user.id, {
    phonePendingE164: e164,
    phoneVerificationCodeHash: hashToken(code),
    phoneVerificationExpiresAt: now + OTP6_TTL_MS,
    preferredVerificationChannel: "sms",
  });
  if (!updated) {
    return NextResponse.json({ error: "Update failed" }, { status: 500, headers: rateLimitHeaders(limit) });
  }
  try {
    await sendVerificationSms(e164, code);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Could not send SMS." },
      { status: 502, headers: rateLimitHeaders(limit) },
    );
  }
  return NextResponse.json(
    {
      ok: true,
      user: publicUser(updated),
      hint: willSmsActuallySend() ? undefined : "In dev, the code is printed to the server log.",
    },
    { headers: rateLimitHeaders(limit) },
  );
}

async function handleConfirm(user: User, code: string, req: Request) {
  const limit = rateLimit(clientKey(req, "account-sms-confirm"), 20, 15 * 60 * 1000);
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Too many attempts. Try again shortly." },
      { status: 429, headers: rateLimitHeaders(limit) },
    );
  }
  if (!user.phonePendingE164 || !user.phoneVerificationCodeHash) {
    return NextResponse.json(
      { error: "No active code. Request a new one from the SMS option." },
      { status: 400, headers: rateLimitHeaders(limit) },
    );
  }
  if (user.phoneVerificationExpiresAt && user.phoneVerificationExpiresAt < Date.now()) {
    return NextResponse.json(
      { error: "Code expired. Request a new one." },
      { status: 400, headers: rateLimitHeaders(limit) },
    );
  }
  if (!timingSafeEqualHex(user.phoneVerificationCodeHash, hashToken(code))) {
    return NextResponse.json(
      { error: "Invalid code." },
      { status: 400, headers: rateLimitHeaders(limit) },
    );
  }
  const e164 = user.phonePendingE164;
  const db = getDb();
  const taken = await db.findUserByVerifiedPhoneE164(e164, user.id);
  if (taken) {
    return NextResponse.json(
      { error: "That number is linked to another account." },
      { status: 409, headers: rateLimitHeaders(limit) },
    );
  }
  const now = Date.now();
  const updated = await db.updateUser(user.id, {
    emailVerifiedAt: now,
    emailVerificationTokenHash: undefined,
    emailVerificationExpiresAt: undefined,
    phoneE164: e164,
    phoneVerifiedAt: now,
    phonePendingE164: undefined,
    phoneVerificationCodeHash: undefined,
    phoneVerificationExpiresAt: undefined,
  });
  if (!updated) {
    return NextResponse.json(
      { error: "Update failed" },
      { status: 500, headers: rateLimitHeaders(limit) },
    );
  }
  await appendSecurityNotification(user.id, {
    kind: "account_verified_sms",
    title: "Account verified with SMS",
    detail: "You completed verification with a code sent to your mobile number. Email and SMS MFA may be available later in Security.",
  });
  return NextResponse.json(
    { ok: true, user: publicUser(updated) },
    { status: 200, headers: rateLimitHeaders(limit) },
  );
}
