import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getVerifiedUserForApi } from "@/lib/auth";
import { publicUser, type User } from "@/lib/store";
import { phoneVerifyActionSchema, formatZodError } from "@/lib/validators";
import { hashToken, timingSafeEqualHex } from "@/lib/security/tokens";
import { rateLimit, clientKey, rateLimitHeaders } from "@/lib/security/rate-limit";
import { sendVerificationSms, isSmsSendConfigured, willSmsActuallySend } from "@/lib/sms/transactional";
import { parseToE164 } from "@/lib/phone/e164";
import { validatePhoneWithNumverify } from "@/lib/validation/phone-external";
import { appendSecurityNotification } from "@/lib/security/security-notifications";
import { generateOtp6, OTP6_TTL_MS } from "@/lib/security/otp6";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  if (!isSmsSendConfigured()) {
    return NextResponse.json(
      { error: "Phone SMS is turned off in this environment (SMS_MODE=off)." },
      { status: 503 },
    );
  }
  const sessionUser = await getVerifiedUserForApi();
  if (sessionUser instanceof NextResponse) return sessionUser;
  const db = getDb();
  const u0 = await db.findUserById(sessionUser.id);
  if (!u0) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = phoneVerifyActionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: formatZodError(parsed.error) },
      { status: 400 },
    );
  }
  const data = parsed.data;
  if (data.action === "remove") {
    return handleRemove(u0, db, req);
  }
  if (data.action === "send") {
    return handleSend(u0, data.phone, sessionUser, db, req);
  }
  return handleVerify(u0, data.code, sessionUser, db, req);
}

async function handleSend(
  user: User,
  rawPhone: string,
  _session: User,
  db: ReturnType<typeof getDb>,
  req: Request,
) {
  const limit = rateLimit(clientKey(req, "phone-sms"), 5, 15 * 60 * 1000);
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
  if (user.phoneE164 && user.phoneVerifiedAt && user.phoneE164 !== e164) {
    return NextResponse.json(
      { error: "Remove your current number in SkillRise before adding a different one." },
      { status: 400, headers: rateLimitHeaders(limit) },
    );
  }
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
  });
  if (!updated) {
    return NextResponse.json(
      { error: "Update failed" },
      { status: 500, headers: rateLimitHeaders(limit) },
    );
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
      hint: willSmsActuallySend() ? undefined : "Check the server log for the code in dev mode.",
    },
    { headers: rateLimitHeaders(limit) },
  );
}

async function handleVerify(
  user: User,
  code: string,
  _session: User,
  db: ReturnType<typeof getDb>,
  req: Request,
) {
  const limit = rateLimit(clientKey(req, "phone-verify"), 20, 15 * 60 * 1000);
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Too many attempts. Try again shortly." },
      { status: 429, headers: rateLimitHeaders(limit) },
    );
  }
  if (!user.phonePendingE164 || !user.phoneVerificationCodeHash) {
    return NextResponse.json(
      { error: "No active code. Request a new one." },
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
  const taken = await db.findUserByVerifiedPhoneE164(e164, user.id);
  if (taken) {
    return NextResponse.json(
      { error: "That number was linked to another account. Request a new code after resolving." },
      { status: 409, headers: rateLimitHeaders(limit) },
    );
  }
  const now = Date.now();
  const updated = await db.updateUser(user.id, {
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
    kind: "phone_verified",
    title: "Phone number verified",
    detail: "Your number can be used for trusted account signals and (soon) learning reminders.",
  });
  return NextResponse.json(
    { ok: true, user: publicUser(updated) },
    { headers: rateLimitHeaders(limit) },
  );
}

async function handleRemove(user: User, db: ReturnType<typeof getDb>, req: Request) {
  const limit = rateLimit(clientKey(req, "phone-remove"), 8, 15 * 60 * 1000);
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Too many requests. Try again shortly." },
      { status: 429, headers: rateLimitHeaders(limit) },
    );
  }
  if (!user.phoneE164 && !user.phonePendingE164) {
    return NextResponse.json(
      { error: "No phone to remove." },
      { status: 400, headers: rateLimitHeaders(limit) },
    );
  }
  const hadVerified = Boolean(user.phoneVerifiedAt && user.phoneE164);
  const updated = await db.updateUser(user.id, {
    phoneE164: undefined,
    phoneVerifiedAt: undefined,
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
  if (hadVerified) {
    await appendSecurityNotification(user.id, {
      kind: "phone_removed",
      title: "Phone number removed",
      detail: "The mobile number on your account was cleared.",
    });
  }
  return NextResponse.json(
    { ok: true, user: publicUser(updated) },
    { headers: rateLimitHeaders(limit) },
  );
}
