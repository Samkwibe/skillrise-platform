"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { GoogleSignInCta, googleSignInErrorMessages } from "@/components/auth/google-sign-in-cta";
import { AuthPasswordInput } from "@/components/auth/auth-password-input";

export function LoginForm({ showGoogle = false, portal = "learner" }: { showGoogle?: boolean; portal?: string }) {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/dashboard";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const demoAccounts: Record<string, string> = {
    learner: "tanya@skillrise.app",
    teacher: "john@skillrise.app",
    teen: "sofia@skillrise.app",
    employer: "hiring@apexelectric.com",
    school: "careers@centralhs.edu",
    admin: "admin@skillrise.app",
  };

  const currentDemoEmail = demoAccounts[portal] || demoAccounts.learner;

  const handleDemoLogin = () => {
    setEmail(currentDemoEmail);
    setPassword("demo1234");
    setErr("");
  };

  useEffect(() => {
    const code = params.get("error");
    if (!code) return;
    const msg = googleSignInErrorMessages[code];
    setErr(msg || "Sign-in could not be completed. Try again.");
    const path = new URLSearchParams(params.toString());
    path.delete("error");
    const q = path.toString();
    if (typeof window === "undefined") return;
    const base = window.location.pathname;
    router.replace(q ? `${base}?${q}` : base, { scroll: false });
  }, [params, router]);

  return (
    <div>
      <GoogleSignInCta enabled={showGoogle} defaultNext={next} source="login" />
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setErr("");
          setBusy(true);
          try {
            const res = await fetch("/api/auth/login", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ email, password }),
            });
            const body = (await res.json()) as {
              error?: string;
              user?: { emailVerified?: boolean };
            };
            if (!res.ok) {
              setErr(body.error || "Sign-in failed.");
              return;
            }
            if (body.user && body.user.emailVerified === false) {
              router.push("/verify-email/required");
              router.refresh();
              return;
            }
            router.push(next);
            router.refresh();
          } finally {
            setBusy(false);
          }
        }}
        className="flex flex-col gap-4"
      >
        <div>
          <label className="label" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            inputMode="email"
            required
            className="input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <AuthPasswordInput
          id="password"
          label="Password"
          value={password}
          onChange={setPassword}
          autoComplete="current-password"
          labelRight={
            <Link href="/forgot-password" className="text-[12px] text-g font-semibold hover:text-t1 transition-colors no-underline hover:underline">
              Forgot password
            </Link>
          }
        />
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 -mt-1">
          <button type="button" onClick={handleDemoLogin} className="text-[12px] text-t3 hover:text-g transition-colors font-medium">
            Fill demo credentials
          </button>
          <span className="text-[11px] text-t3 hidden sm:inline">·</span>
          <span className="text-[11px] text-t3">Demo password: <span className="font-mono text-t2">demo1234</span></span>
        </div>
        {err ? (
          <div className="pill pill-red w-full justify-center text-center" role="alert" aria-live="polite">
            {err}
          </div>
        ) : null}
        <button type="submit" disabled={busy} className="btn btn-primary btn-xl justify-center w-full">
          {busy ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </div>
  );
}
