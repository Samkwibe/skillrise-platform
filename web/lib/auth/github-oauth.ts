import {
  getPublicOrigin,
  newOAuthState,
  oauthCookieOptions,
  safeOAuthNextPath,
} from "@/lib/auth/google-oauth";

export const GITHUB_STATE_COOKIE = "sr_gh_state";
export const GITHUB_NEXT_COOKIE = "sr_gh_next";
export const GITHUB_SOURCE_COOKIE = "sr_gh_src";

export { oauthCookieOptions, safeOAuthNextPath, newOAuthState };

export function isGitHubOAuthConfigured(): boolean {
  return Boolean(process.env.GITHUB_OAUTH_CLIENT_ID && process.env.GITHUB_OAUTH_CLIENT_SECRET);
}

export function getGitHubRedirectUri(req: Request): string {
  return `${getPublicOrigin(req)}/api/auth/github/callback`;
}

export function buildGitHubAuthUrl(req: Request, state: string): string {
  const u = new URL("https://github.com/login/oauth/authorize");
  u.searchParams.set("client_id", process.env.GITHUB_OAUTH_CLIENT_ID!);
  u.searchParams.set("redirect_uri", getGitHubRedirectUri(req));
  u.searchParams.set("state", state);
  u.searchParams.set("scope", "read:user user:email");
  return u.toString();
}

export type GitHubProfile = {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
};

export async function getGitHubProfileFromCode(req: Request, code: string): Promise<GitHubProfile> {
  const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: process.env.GITHUB_OAUTH_CLIENT_ID!,
      client_secret: process.env.GITHUB_OAUTH_CLIENT_SECRET!,
      code,
      redirect_uri: getGitHubRedirectUri(req),
    }),
  });
  const tokenJson = (await tokenRes.json()) as { access_token?: string; error?: string };
  if (!tokenRes.ok || !tokenJson.access_token) {
    throw new Error(tokenJson.error || "no_token");
  }
  const token = tokenJson.access_token;
  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: "application/json",
    "User-Agent": "SkillRise-OAuth",
  };
  const userRes = await fetch("https://api.github.com/user", { headers });
  const gh = (await userRes.json()) as {
    id?: number;
    login?: string;
    name?: string | null;
    email?: string | null;
    avatar_url?: string;
  };
  if (!gh?.id) throw new Error("invalid_user");

  let email = (gh.email && String(gh.email).toLowerCase()) || "";
  if (!email) {
    const emailsRes = await fetch("https://api.github.com/user/emails", { headers });
    const emails = (await emailsRes.json()) as Array<{ email: string; primary?: boolean; verified?: boolean }>;
    const verified = emails?.filter((e) => e.verified) ?? [];
    const primary = verified.find((e) => e.primary) ?? verified[0];
    email = primary?.email?.toLowerCase() ?? "";
  }
  if (!email) throw new Error("no_email");

  const name = (gh.name && gh.name.trim()) || gh.login || email.split("@")[0] || "Member";
  return {
    id: String(gh.id),
    email,
    name,
    avatarUrl: gh.avatar_url,
  };
}
