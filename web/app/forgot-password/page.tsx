"use client";

import Link from "next/link";
import { useState } from "react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      await res.json();
      setDone(true);
    } catch {
      setDone(true);
    }
    setBusy(false);
  }

  return (
    <div className="min-h-screen bg-ink text-t1">
      <header className="h-[66px] border-b border-border1 flex items-center justify-between px-6 md:px-12">
        <Link href="/" className="font-display text-[20px] font-extrabold text-g">
          Skill<span className="text-t1">Rise</span>
        </Link>
      </header>
      <main className="max-w-[480px] mx-auto px-6 py-16">
        <h1 className="font-display text-[clamp(26px,3vw,34px)] font-extrabold mb-2">Forgot password</h1>
        {done ? (
          <p className="text-t2">
            If an account exists for that email, we sent a link to reset your password. Check your inbox and spam
            folder.
          </p>
        ) : (
          <form onSubmit={submit} className="space-y-4 mt-4">
            <div>
              <label className="label" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                className="input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <button type="submit" disabled={busy} className="btn btn-primary btn-xl justify-center w-full sm:w-auto">
              {busy ? "Sending…" : "Send reset link"}
            </button>
          </form>
        )}
        <p className="mt-8 text-sm text-t2">
          <Link href="/login" className="text-g underline">
            Back to sign in
          </Link>
        </p>
      </main>
    </div>
  );
}
