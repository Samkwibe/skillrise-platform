import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createSession } from "@/lib/auth";
import {
  getGoogleProfileFromCode,
  GOOGLE_NEXT_COOKIE,
  GOOGLE_STATE_COOKIE,
  getPublicOrigin,
  oauthCookieOptions,
} from "@/lib/auth/google-oauth";
import { getDb } from "@/lib/db";
import { appendSecurityNotification } from "@/lib/security/security-notifications";
import { id, type User } from "@/lib/store";
import { clientIp, clientUserAgent } from "@/lib/http/client-meta";

export const dynamic = "force-dynamic";

const GRADIENTS = [
  "0e7a4e:1fc87e",
  "b45309:f59e0b",
  "6d28d9:9b6cf5",
  "1d4ed8:4a8ef5",
  "c2410c:f97316",
];

function errRedirect(req: Request, code: string) {
  const u = new URL("/login", getPublicOrigin(req));
  u.searchParams.set("error", code);
  return NextResponse.redirect(u);
}

export async function GET(req: Request) {
  const jar = await cookies();
  const url = new URL(req.url);
  const oauthErr = url.searchParams.get("error");
  if (oauthErr) {
    jar.delete(GOOGLE_STATE_COOKIE);
    jar.delete(GOOGLE_NEXT_COOKIE);
    return errRedirect(req, oauthErr === "access_denied" ? "google_denied" : "google");
  }
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const expected = jar.get(GOOGLE_STATE_COOKIE)?.value;
  const nextPath = jar.get(GOOGLE_NEXT_COOKIE)?.value || "/dashboard";
  jar.delete(GOOGLE_STATE_COOKIE);
  jar.delete(GOOGLE_NEXT_COOKIE);
  if (!code || !state || !expected || state !== expected) {
    return errRedirect(req, "google_state");
  }

  let profile: Awaited<ReturnType<typeof getGoogleProfileFromCode>>;
  try {
    profile = await getGoogleProfileFromCode(req, code);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (msg === "email_not_verified") return errRedirect(req, "google_unverified");
    return errRedirect(req, "google_token");
  }

  const db = getDb();
  const bySub = await db.findUserByGoogleSub(profile.sub);
  if (bySub) {
    await appendSecurityNotification(bySub.id, {
      kind: "google_sign_in",
      title: "Signed in with Google",
      detail: "We completed sign-in using your Google account.",
    });
    await createSession(bySub.id, { userAgent: clientUserAgent(req), ip: clientIp(req) });
    return redirectToNext(req, nextPath);
  }

  const byEmail = await db.findUserByEmail(profile.email);
  if (byEmail) {
    if (byEmail.googleSub && byEmail.googleSub !== profile.sub) {
      return errRedirect(req, "google_conflict");
    }
    const updated = await db.updateUser(byEmail.id, {
      googleSub: profile.sub,
      emailVerifiedAt: byEmail.emailVerifiedAt || Date.now(),
      emailVerificationTokenHash: undefined,
      emailVerificationExpiresAt: undefined,
    });
    if (!updated) return errRedirect(req, "google_link");
    await appendSecurityNotification(updated.id, {
      kind: "google_account_linked",
      title: "Google sign-in linked",
      detail: "You can now use “Continue with Google” for this account.",
    });
    await createSession(updated.id, { userAgent: clientUserAgent(req), ip: clientIp(req) });
    return redirectToNext(req, nextPath);
  }

  const initials = profile.name
    .split(/\s+/)
    .slice(0, 2)
    .map((s) => s.charAt(0).toUpperCase())
    .join("");
  const grad = GRADIENTS[Math.floor(Math.random() * GRADIENTS.length)];
  const now = Date.now();
  const newUser: User = {
    id: `u_${id()}`,
    email: profile.email,
    googleSub: profile.sub,
    name: profile.name,
    role: "learner",
    neighborhood: "—",
    avatar: `${initials}|${grad}`,
    createdAt: now,
    emailVerifiedAt: now,
  };
  await db.createUser(newUser);
  await appendSecurityNotification(newUser.id, {
    kind: "google_sign_in",
    title: "Signed in with Google",
    detail: "Your new account was created with a verified email from Google.",
  });
  await createSession(newUser.id, { userAgent: clientUserAgent(req), ip: clientIp(req) });
  return redirectToNext(req, nextPath);
}

function redirectToNext(req: Request, nextPath: string) {
  const origin = getPublicOrigin(req);
  const dest = new URL(nextPath, origin);
  if (dest.origin !== new URL(origin).origin) {
    return NextResponse.redirect(new URL("/dashboard", origin));
  }
  const res = NextResponse.redirect(dest, 302);
  res.cookies.set(GOOGLE_STATE_COOKIE, "", { ...oauthCookieOptions(), maxAge: 0 });
  res.cookies.set(GOOGLE_NEXT_COOKIE, "", { ...oauthCookieOptions(), maxAge: 0 });
  return res;
}
