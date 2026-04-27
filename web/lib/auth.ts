import { cookies } from "next/headers";
import { randomBytes } from "node:crypto";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";
import type { User } from "./store";
import { getDb } from "./db";

export const SESSION_COOKIE = "sr_session";
const SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

export async function createSession(
  userId: string,
  meta?: { userAgent?: string; ip?: string },
): Promise<string> {
  const token = randomBytes(24).toString("hex");
  const db = getDb();
  const now = Date.now();
  await db.createSession({
    token,
    userId,
    createdAt: now,
    lastUsedAt: now,
    userAgent: meta?.userAgent,
    ip: meta?.ip,
  });
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
  return token;
}

export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) {
    const db = getDb();
    await db.deleteSession(token);
  }
  jar.delete(SESSION_COOKIE);
}

export async function getCurrentUser(): Promise<User | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const db = getDb();
  const session = await db.getSession(token);
  if (!session) return null;
  return db.findUserById(session.userId);
}

export async function requireUser(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) throw new Error("UNAUTHENTICATED");
  return user;
}

/**
 * When `SKILLRISE_SKIP_EMAIL_VERIFICATION=1`, all signed-in users are treated as verified
 * (for local/staging testing). Remove before production.
 */
export function isEmailVerificationSkipped(): boolean {
  return process.env.SKILLRISE_SKIP_EMAIL_VERIFICATION === "1";
}

export function isEmailVerified(user: User): boolean {
  if (isEmailVerificationSkipped()) return true;
  return Boolean(user.emailVerifiedAt);
}

/** Use for all logged-in app surfaces except `/verify-email/required` (email completion). */
export async function requireVerifiedUser(): Promise<User> {
  const user = await requireUser();
  if (!isEmailVerified(user)) {
    redirect("/verify-email/required");
  }
  return user;
}

/**
 * For API routes: returns the signed-in, email-verified user, or a JSON NextResponse (401/403).
 * Auth-only endpoints (e.g. resend verification) should keep using getCurrentUser instead.
 */
export async function getVerifiedUserForApi(): Promise<User | NextResponse> {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }
  if (!isEmailVerified(user)) {
    return NextResponse.json(
      {
        error: "Confirm your email address to use SkillRise.",
        code: "EMAIL_NOT_VERIFIED",
      },
      { status: 403 },
    );
  }
  return user;
}
