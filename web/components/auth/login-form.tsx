"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { GoogleSignInCta, googleSignInErrorMessages } from "@/components/auth/google-sign-in-cta";

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
    admin: "admin@skillrise.app"
  };
  
  const currentDemoEmail = demoAccounts[portal] || demoAccounts.learner;

  const handleDemoLogin = () => {
    setEmail(currentDemoEmail);
    setPassword("demo1234");
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
        setBusy(true);
        setErr("");
        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });
        const body = (await res.json()) as {
          error?: string;
          user?: { emailVerified?: boolean };
        };
        setBusy(false);
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
      }}
      className="flex flex-col gap-4"
    >
      <div>
        <label className="label" htmlFor="email">Email</label>
        <input id="email" type="email" autoComplete="email" required className="input" value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      <div>
        <div className="flex items-center justify-between gap-2">
          <label className="label mb-0" htmlFor="password">Password</label>
          <Link href="/forgot-password" className="text-[12px] text-g underline">
            Forgot?
          </Link>
        </div>
        <input id="password" type="password" autoComplete="current-password" required className="input" value={password} onChange={(e) => setPassword(e.target.value)} />
      </div>
      {err && <div className="pill pill-red">{err}</div>}
      <button type="submit" disabled={busy} className="btn btn-primary btn-xl justify-center">
        {busy ? "Signing in…" : "Sign in"}
      </button>
      
      <div className="mt-4 pt-4 border-t border-border1 text-center">
        <button 
          type="button" 
          onClick={handleDemoLogin}
          className="text-[13px] font-medium text-[#1fc87e] hover:text-white transition-colors"
        >
          Auto-fill Demo Account
        </button>
        <p className="text-[11px] text-t3 mt-1">
          Fills in credentials for <span className="font-mono text-t2">{currentDemoEmail}</span>
        </p>
      </div>
    </form>
    </div>
  );
}
