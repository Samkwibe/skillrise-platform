import { NextResponse } from "next/server";
import {
  GITHUB_STATE_COOKIE,
  GITHUB_NEXT_COOKIE,
  GITHUB_SOURCE_COOKIE,
  isGitHubOAuthConfigured,
  newOAuthState,
  buildGitHubAuthUrl,
  safeOAuthNextPath,
  oauthCookieOptions,
} from "@/lib/auth/github-oauth";
import { getPublicOrigin } from "@/lib/auth/google-oauth";
import { rateLimit, clientKey, rateLimitHeaders } from "@/lib/security/rate-limit";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const isSignup = url.searchParams.get("source") === "signup";
  if (!isGitHubOAuthConfigured()) {
    const u = new URL(isSignup ? "/signup" : "/login", getPublicOrigin(req));
    u.searchParams.set("error", "oauth_github_not_configured");
    return NextResponse.redirect(u, 302);
  }
  const limit = rateLimit(clientKey(req, "github-oauth-start"), 20, 15 * 60 * 1000);
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Too many attempts. Try again in a few minutes." },
      { status: 429, headers: rateLimitHeaders(limit) },
    );
  }
  const nextRaw = url.searchParams.get("next");
  const nextPath = safeOAuthNextPath(nextRaw, isSignup ? "/onboarding" : "/dashboard");
  const state = newOAuthState();
  const authUrl = buildGitHubAuthUrl(req, state);
  const opts = oauthCookieOptions();
  const res = NextResponse.redirect(authUrl, 302);
  for (const [k, v] of Object.entries(rateLimitHeaders(limit))) {
    res.headers.set(k, v);
  }
  res.cookies.set(GITHUB_STATE_COOKIE, state, opts);
  res.cookies.set(GITHUB_NEXT_COOKIE, nextPath, opts);
  res.cookies.set(GITHUB_SOURCE_COOKIE, isSignup ? "signup" : "login", opts);
  return res;
}
