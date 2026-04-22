import { randomBytes } from "node:crypto";
import { OAuth2Client } from "google-auth-library";

export const GOOGLE_STATE_COOKIE = "sr_go_state";
export const GOOGLE_NEXT_COOKIE = "sr_go_next";

const OAUTH_MAX_AGE_SEC = 600;

export function isGoogleOAuthConfigured(): boolean {
  return Boolean(process.env.GOOGLE_OAUTH_CLIENT_ID && process.env.GOOGLE_OAUTH_CLIENT_SECRET);
}

/**
 * Public URL of the app (no trailing slash). Used for a stable OAuth redirect (Google console must match).
 * Falls back to request Host when unset (local dev).
 */
export function getPublicOrigin(req: Request): string {
  const envBase = (process.env.NEXT_PUBLIC_APP_URL || "").replace(/\/$/, "");
  if (envBase) return envBase;
  const proto = req.headers.get("x-forwarded-proto") || "http";
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host") || "localhost:3000";
  return `${proto}://${host}`;
}

export function getGoogleRedirectUri(req: Request): string {
  return `${getPublicOrigin(req)}/api/auth/google/callback`;
}

function getOAuth2Client(req: Request): OAuth2Client {
  return new OAuth2Client(
    process.env.GOOGLE_OAUTH_CLIENT_ID!,
    process.env.GOOGLE_OAUTH_CLIENT_SECRET!,
    getGoogleRedirectUri(req),
  );
}

/**
 * After OAuth, send users here. Must be an app-relative path, same origin.
 */
export function safeOAuthNextPath(raw: string | null | undefined, fallback: string): string {
  if (!raw || typeof raw !== "string") return fallback;
  const t = raw.trim();
  if (!t.startsWith("/") || t.startsWith("//") || t.includes(":\\") || t.includes("\0")) return fallback;
  return t.length > 512 ? fallback : t;
}

export function newOAuthState(): string {
  return randomBytes(24).toString("hex");
}

export function buildGoogleAuthUrl(req: Request, state: string): string {
  const client = getOAuth2Client(req);
  return client.generateAuthUrl({
    access_type: "online",
    scope: [
      "openid",
      "https://www.googleapis.com/auth/userinfo.email",
      "https://www.googleapis.com/auth/userinfo.profile",
    ],
    state,
    prompt: "select_account",
  });
}

export function oauthCookieOptions(): { httpOnly: boolean; secure: boolean; sameSite: "lax"; path: string; maxAge: number } {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: OAUTH_MAX_AGE_SEC,
  };
}

export type GoogleIdTokenProfile = {
  sub: string;
  email: string;
  emailVerified: boolean;
  name: string;
  picture?: string;
};

/**
 * Exchanges the authorization `code` for tokens and returns verified OpenID fields.
 */
export async function getGoogleProfileFromCode(req: Request, code: string): Promise<GoogleIdTokenProfile> {
  const client = getOAuth2Client(req);
  const { tokens } = await client.getToken(code);
  const idToken = tokens.id_token;
  if (!idToken) {
    throw new Error("no_id_token");
  }
  const audience = process.env.GOOGLE_OAUTH_CLIENT_ID!;
  const ticket = await client.verifyIdToken({ idToken, audience });
  const p = ticket.getPayload();
  if (!p?.sub) throw new Error("invalid_token");
  const email = p.email;
  if (!email) throw new Error("no_email");
  if (!p.email_verified) throw new Error("email_not_verified");
  return {
    sub: p.sub,
    email: email.toLowerCase(),
    emailVerified: true,
    name: (p.name && p.name.trim()) || email.split("@")[0] || "Member",
    picture: p.picture,
  };
}
