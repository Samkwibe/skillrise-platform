import { getAuthEmailDispatch } from "@/lib/email/config";
import { appBaseUrl } from "@/lib/email/transactional";

/** Only in local `next dev` with log-only email — include full URL in JSON for the client. */
export function shouldExposeDevEmailLinkInApi(): boolean {
  return process.env.NODE_ENV === "development" && getAuthEmailDispatch() === "dev";
}

export function buildEmailVerificationUrl(email: string, rawToken: string): string {
  const q = new URLSearchParams({ email, token: rawToken });
  return `${appBaseUrl()}/verify-email?${q.toString()}`;
}

export function buildPasswordResetUrl(email: string, rawToken: string): string {
  const q = new URLSearchParams({ email, token: rawToken });
  return `${appBaseUrl()}/reset-password?${q.toString()}`;
}
