"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";

function VerifyEmailInner() {
  const sp = useSearchParams();
  const email = sp.get("email") || "";
  const token = sp.get("token") || "";
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "err">("idle");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    if (!email || !token) {
      setStatus("err");
      setMsg("Missing email or token. Open the link from your verification email.");
      return;
    }
    let cancelled = false;
    setStatus("loading");
    (async () => {
      try {
        const res = await fetch("/api/auth/verify-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, token }),
        });
        const data = (await res.json()) as { error?: string };
        if (cancelled) return;
        if (!res.ok) {
          setStatus("err");
          setMsg(data.error || "Verification failed.");
          return;
        }
        setStatus("ok");
        setMsg("Your email is verified. You can close this tab.");
      } catch {
        if (!cancelled) {
          setStatus("err");
          setMsg("Network error. Try again.");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [email, token]);

  return (
    <div className="min-h-screen bg-ink text-t1">
      <header className="h-[66px] border-b border-border1 flex items-center justify-between px-6 md:px-12">
        <Link href="/" className="font-display text-[20px] font-extrabold text-g">
          Skill<span className="text-t1">Rise</span>
        </Link>
      </header>
      <main className="max-w-[560px] mx-auto px-6 py-16">
        <div className="stag">Account</div>
        <h1 className="font-display text-[clamp(26px,3vw,36px)] font-extrabold leading-tight mb-2">
          Email verification
        </h1>
        {status === "loading" && <p className="text-t2">Verifying…</p>}
        {status === "ok" && <p className="text-t2 text-g">{msg}</p>}
        {status === "err" && <p className="text-t2 text-red-400">{msg}</p>}
        <p className="mt-8">
          <Link href="/dashboard" className="text-g underline">
            Go to dashboard
          </Link>
        </p>
      </main>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-ink text-t1 flex items-center justify-center">
          Loading…
        </div>
      }
    >
      <VerifyEmailInner />
    </Suspense>
  );
}
