"use client";

import { useSearchParams } from "next/navigation";

export const googleSignInErrorMessages: Record<string, string> = {
  google: "Google sign-in failed. Please try again.",
  google_state: "Sign-in took too long or this browser blocked cookies. Please try again.",
  google_token: "Could not complete Google sign-in. Check your app configuration.",
  google_unverified: "That Google account’s email is not verified with Google. Verify it with Google, then try again.",
  google_conflict: "This Google account could not be linked. Contact support if this continues.",
  google_link: "Could not link Google to this account. Try again.",
  google_denied: "Google sign-in was cancelled.",
};

type Props = {
  enabled: boolean;
  defaultNext: string;
  /** Sets OAuth cookie for default redirect after new Google signups (e.g. onboarding). */
  source?: "login" | "signup";
  label?: string;
};

/**
 * “Continue with Google” — `enabled` is false when OAuth env is not set (e.g. local demo).
 */
export function GoogleSignInCta({ enabled, defaultNext, source = "login", label = "Continue with Google" }: Props) {
  const params = useSearchParams();
  const next = params.get("next") || defaultNext;
  if (!enabled) return null;
  const q = new URLSearchParams({ next });
  if (source === "signup") q.set("source", "signup");
  const href = `/api/auth/google?${q.toString()}`;

  return (
    <div className="mb-6">
      <a
        href={href}
        className="btn btn-secondary btn-xl w-full justify-center flex items-center gap-2 no-underline"
      >
        <GoogleGlyph />
        {label}
      </a>
      <div className="flex items-center gap-3 my-4">
        <div className="h-px flex-1" style={{ background: "var(--border-1)" }} />
        <span className="text-[12px] text-t3">or with email</span>
        <div className="h-px flex-1" style={{ background: "var(--border-1)" }} />
      </div>
    </div>
  );
}

function GoogleGlyph() {
  return (
    <span className="inline-flex shrink-0" aria-hidden>
      <svg width="20" height="20" viewBox="0 0 48 48" className="shrink-0">
        <path
          fill="#FFC107"
          d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.047 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"
        />
        <path
          fill="#FF3D00"
          d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.047 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"
        />
        <path
          fill="#4CAF50"
          d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.86 11.86 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"
        />
        <path
          fill="#1976D2"
          d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.973 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"
        />
      </svg>
    </span>
  );
}

