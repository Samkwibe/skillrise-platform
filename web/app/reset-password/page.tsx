"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";

function ResetPasswordInner() {
  const sp = useSearchParams();
  const qEmail = sp.get("email") || "";
  const qToken = sp.get("token") || "";
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    if (!qEmail || !qToken) {
      setErr("Open this page from the link in your password reset email.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: qEmail, token: qToken, password }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setErr(data.error || "Reset failed.");
        setBusy(false);
        return;
      }
      setOk(true);
    } catch {
      setErr("Network error.");
    }
    setBusy(false);
  }

  if (ok) {
    return (
      <div className="min-h-screen bg-ink text-t1">
        <header className="h-[66px] border-b border-border1 flex items-center justify-between px-6 md:px-12">
          <Link href="/" className="font-display text-[20px] font-extrabold text-g">
            Skill<span className="text-t1">Rise</span>
          </Link>
        </header>
        <main className="max-w-[480px] mx-auto px-6 py-16">
          <h1 className="font-display text-2xl font-extrabold mb-2">Password updated</h1>
          <p className="text-t2 mb-6">You&apos;re signed in on this device. Other sessions were signed out.</p>
          <Link href="/dashboard" className="text-g underline">
            Continue to dashboard
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ink text-t1">
      <header className="h-[66px] border-b border-border1 flex items-center justify-between px-6 md:px-12">
        <Link href="/" className="font-display text-[20px] font-extrabold text-g">
          Skill<span className="text-t1">Rise</span>
        </Link>
      </header>
      <main className="max-w-[480px] mx-auto px-6 py-16">
        <h1 className="font-display text-[clamp(26px,3vw,34px)] font-extrabold mb-2">Set a new password</h1>
        <p className="text-t2 mb-6">
          {qEmail ? (
            <>
              For <span className="text-t1 font-mono text-sm">{qEmail}</span>
            </>
          ) : (
            "Use the link from your email."
          )}
        </p>
        <p className="text-[11px] text-t3 mb-4">
          At least 12 characters with uppercase, lowercase, a number, and a symbol. Reset links expire in one hour and work once.
        </p>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-sm text-t2 mb-1">New password</label>
            <input
              type="password"
              autoComplete="new-password"
              required
              minLength={12}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-border1 bg-surface1 px-3 py-2 text-t1"
            />
          </div>
          {err && <p className="text-sm text-red-400">{err}</p>}
          <button
            type="submit"
            disabled={busy || !qToken}
            className="rounded-full bg-g px-6 py-2.5 font-semibold text-ink disabled:opacity-50"
          >
            {busy ? "Saving…" : "Update password"}
          </button>
        </form>
        <p className="mt-8 text-sm text-t2">
          <Link href="/login" className="text-g underline">
            Back to sign in
          </Link>
        </p>
      </main>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-ink text-t1 flex items-center justify-center">
          Loading…
        </div>
      }
    >
      <ResetPasswordInner />
    </Suspense>
  );
}
