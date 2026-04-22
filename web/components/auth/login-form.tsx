"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { GoogleSignInCta, googleSignInErrorMessages } from "@/components/auth/google-sign-in-cta";

export function LoginForm({ showGoogle = false }: { showGoogle?: boolean }) {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/dashboard";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

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
      <div className="text-[12px] text-t3 leading-relaxed">
        Try any demo account with password <code className="font-mono text-t2">demo1234</code>:<br />
        <span className="font-mono text-t2">tanya@skillrise.app</span> · learner ·{" "}
        <span className="font-mono text-t2">john@skillrise.app</span> · teacher ·{" "}
        <span className="font-mono text-t2">sofia@skillrise.app</span> · teen<br />
        <span className="font-mono text-t2">hiring@apexelectric.com</span> · employer ·{" "}
        <span className="font-mono text-t2">careers@centralhs.edu</span> · school ·{" "}
        <span className="font-mono text-t2">admin@skillrise.app</span> · admin
      </div>
    </form>
    </div>
  );
}
