import { NextResponse } from "next/server";
import {
  GITHUB_STATE_COOKIE,
  GITHUB_NEXT_COOKIE,
  isGitHubOAuthConfigured,
  newOAuthState,
  buildGitHubAuthUrl,
  safeOAuthNextPath,
  oauthCookieOptions,
} from "@/lib/auth/github-oauth";
import { rateLimit, clientKey, rateLimitHeaders } from "@/lib/security/rate-limit";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  if (!isGitHubOAuthConfigured()) {
    return NextResponse.json({ error: "GitHub sign-in is not configured." }, { status: 503 });
  }
  const limit = rateLimit(clientKey(req, "github-oauth-start"), 20, 15 * 60 * 1000);
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Too many attempts. Try again in a few minutes." },
      { status: 429, headers: rateLimitHeaders(limit) },
    );
  }
  const url = new URL(req.url);
  const nextRaw = url.searchParams.get("next");
  const isSignup = url.searchParams.get("source") === "signup";
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
  return res;
}
