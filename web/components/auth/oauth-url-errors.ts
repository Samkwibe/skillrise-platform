import { googleSignInErrorMessages } from "@/components/auth/google-sign-in-cta";
import { githubSignInErrorMessages } from "@/components/auth/github-sign-in-cta";

/** Query `error` codes from OAuth callback routes or OAuth start when misconfigured. */
export const oauthUrlErrorMessages: Record<string, string> = {
  ...googleSignInErrorMessages,
  ...githubSignInErrorMessages,
  oauth_google_not_configured:
    "Google sign-in isn’t set up yet. Add GOOGLE_OAUTH_CLIENT_ID and GOOGLE_OAUTH_CLIENT_SECRET to .env.local, restart the dev server, and add this redirect URI in Google Cloud: http://localhost:3000/api/auth/google/callback (use your real app URL in production).",
  oauth_github_not_configured:
    "GitHub sign-in isn’t set up yet. Add GITHUB_OAUTH_CLIENT_ID and GITHUB_OAUTH_CLIENT_SECRET to .env.local and restart the dev server.",
};
