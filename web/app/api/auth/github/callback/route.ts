import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createSession } from "@/lib/auth";
import { getGitHubProfileFromCode, GITHUB_NEXT_COOKIE, GITHUB_STATE_COOKIE, oauthCookieOptions } from "@/lib/auth/github-oauth";
import { getPublicOrigin } from "@/lib/auth/google-oauth";
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
    jar.delete(GITHUB_STATE_COOKIE);
    jar.delete(GITHUB_NEXT_COOKIE);
    return errRedirect(req, oauthErr === "access_denied" ? "github_denied" : "github");
  }
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const expected = jar.get(GITHUB_STATE_COOKIE)?.value;
  const nextPath = jar.get(GITHUB_NEXT_COOKIE)?.value || "/dashboard";
  jar.delete(GITHUB_STATE_COOKIE);
  jar.delete(GITHUB_NEXT_COOKIE);
  if (!code || !state || !expected || state !== expected) {
    return errRedirect(req, "github_state");
  }

  let profile: Awaited<ReturnType<typeof getGitHubProfileFromCode>>;
  try {
    profile = await getGitHubProfileFromCode(req, code);
  } catch {
    return errRedirect(req, "github_token");
  }

  const db = getDb();
  const byGh = await db.findUserByGitHubId(profile.id);
  if (byGh) {
    await appendSecurityNotification(byGh.id, {
      kind: "github_sign_in",
      title: "Signed in with GitHub",
      detail: "We completed sign-in using your GitHub account.",
    });
    await createSession(byGh.id, { userAgent: clientUserAgent(req), ip: clientIp(req) });
    return redirectToNext(req, nextPath);
  }

  const byEmail = await db.findUserByEmail(profile.email);
  if (byEmail) {
    if (byEmail.githubId && byEmail.githubId !== profile.id) {
      return errRedirect(req, "github_conflict");
    }
    const updated = await db.updateUser(byEmail.id, {
      githubId: profile.id,
      emailVerifiedAt: byEmail.emailVerifiedAt || Date.now(),
      emailVerificationTokenHash: undefined,
      emailVerificationExpiresAt: undefined,
      avatarUrl: profile.avatarUrl ?? byEmail.avatarUrl,
    });
    if (!updated) return errRedirect(req, "github_link");
    await appendSecurityNotification(updated.id, {
      kind: "github_account_linked",
      title: "GitHub sign-in linked",
      detail: "You can now use GitHub for this account.",
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
    githubId: profile.id,
    name: profile.name,
    role: "learner",
    neighborhood: "—",
    avatar: `${initials}|${grad}`,
    avatarUrl: profile.avatarUrl,
    createdAt: now,
    emailVerifiedAt: now,
  };
  await db.createUser(newUser);
  await appendSecurityNotification(newUser.id, {
    kind: "github_sign_in",
    title: "Signed in with GitHub",
    detail: "Your new account was created with a verified email from GitHub.",
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
  res.cookies.set(GITHUB_STATE_COOKIE, "", { ...oauthCookieOptions(), maxAge: 0 });
  res.cookies.set(GITHUB_NEXT_COOKIE, "", { ...oauthCookieOptions(), maxAge: 0 });
  return res;
}
