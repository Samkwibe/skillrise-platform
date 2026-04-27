import { NextResponse } from "next/server";
import {
  GOOGLE_STATE_COOKIE,
  GOOGLE_NEXT_COOKIE,
  GOOGLE_SOURCE_COOKIE,
  isGoogleOAuthConfigured,
  newOAuthState,
  buildGoogleAuthUrl,
  safeOAuthNextPath,
  oauthCookieOptions,
  getPublicOrigin,
} from "@/lib/auth/google-oauth";
import { rateLimit, clientKey, rateLimitHeaders } from "@/lib/security/rate-limit";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const isSignup = url.searchParams.get("source") === "signup";
  if (!isGoogleOAuthConfigured()) {
    const u = new URL(isSignup ? "/signup" : "/login", getPublicOrigin(req));
    u.searchParams.set("error", "oauth_google_not_configured");
    return NextResponse.redirect(u, 302);
  }
  const limit = rateLimit(clientKey(req, "google-oauth-start"), 20, 15 * 60 * 1000);
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Too many attempts. Try again in a few minutes." },
      { status: 429, headers: rateLimitHeaders(limit) },
    );
  }
  const nextRaw = url.searchParams.get("next");
  const nextPath = safeOAuthNextPath(
    nextRaw,
    isSignup ? "/onboarding" : "/dashboard",
  );
  const state = newOAuthState();
  const authUrl = buildGoogleAuthUrl(req, state);
  const opts = oauthCookieOptions();
  const res = NextResponse.redirect(authUrl, 302);
  for (const [k, v] of Object.entries(rateLimitHeaders(limit))) {
    res.headers.set(k, v);
  }
  res.cookies.set(GOOGLE_STATE_COOKIE, state, opts);
  res.cookies.set(GOOGLE_NEXT_COOKIE, nextPath, opts);
  res.cookies.set(GOOGLE_SOURCE_COOKIE, isSignup ? "signup" : "login", opts);
  return res;
}
