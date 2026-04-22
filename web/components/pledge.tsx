"use client";
import { useEffect, useState } from "react";
import { pledgeCommitments } from "@/lib/data";

export function Pledge() {
  const [email, setEmail] = useState("");
  const [checks, setChecks] = useState<Record<string, boolean>>(
    () => Object.fromEntries(pledgeCommitments.map((c) => [c.id, !!c.default])),
  );
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [counters, setCounters] = useState<{ total: number; today: number }>({
    total: 48213,
    today: 127,
  });

  useEffect(() => {
    // Live counter (optimistic initial values from data)
    fetch("/api/pledge")
      .then((r) => r.json())
      .then((d) => d && setCounters({ total: d.total, today: d.today }))
      .catch(() => {});
  }, []);

  const toggle = (id: string) => setChecks((s) => ({ ...s, [id]: !s[id] }));

  const sign = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    setError(null);
    try {
      const res = await fetch("/api/pledge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, commitments: checks }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || "Failed to sign pledge");
      }
      const d = await res.json();
      setCounters({ total: d.total, today: d.today });
      setStatus("done");
    } catch (err) {
      setError((err as Error).message);
      setStatus("error");
    }
  };

  return (
    <section
      id="pledge"
      className="section-pad border-t border-b"
      style={{
        background: "linear-gradient(135deg,#0e0620,#150935,#0e0620)",
        borderColor: "rgba(155,108,245,0.12)",
      }}
    >
      <div className="mx-wrap">
        <div className="grid gap-12 items-center pledge-grid" style={{ gridTemplateColumns: "1fr 1fr" }}>
          <div>
            <div className="stag">The pledge</div>
            <h2 className="sh text-white">
              Make the switch. <br />
              Your future self is worth 30 minutes.
            </h2>
            <p className="ss mb-6">
              Over {counters.total.toLocaleString()} people have taken the SkillRise
              pledge — to replace at least 30 minutes of social media time every day
              with purposeful learning. It takes 30 days to feel the difference. It
              takes 90 days to change your life.
            </p>
            <a href="#pledge-form">
              <button
                className="btn btn-xl"
                style={{
                  background: "#9b6cf5",
                  color: "white",
                  fontSize: 16,
                  fontWeight: 700,
                  borderRadius: 12,
                }}
              >
                Take the pledge →
              </button>
            </a>
          </div>

          <form
            id="pledge-form"
            onSubmit={sign}
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(155,108,245,0.15)",
              borderRadius: 20,
              padding: 24,
            }}
          >
            <div className="font-display font-bold text-purple text-[15px] mb-4">
              I pledge to...
            </div>
            <div className="flex flex-col gap-3 mb-4">
              {pledgeCommitments.map((c) => {
                const on = !!checks[c.id];
                return (
                  <button
                    type="button"
                    key={c.id}
                    onClick={() => toggle(c.id)}
                    aria-pressed={on}
                    className="flex items-center gap-3 w-full text-left"
                    style={{
                      background: "rgba(255,255,255,0.03)",
                      borderRadius: 10,
                      padding: "11px 14px",
                      border: "none",
                      color: "inherit",
                      cursor: "pointer",
                    }}
                  >
                    <span
                      aria-hidden
                      className="flex items-center justify-center flex-shrink-0"
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: 5,
                        background: on ? "#9b6cf5" : "transparent",
                        border: on ? "2px solid #9b6cf5" : "2px solid rgba(155,108,245,0.4)",
                        color: "white",
                        fontSize: 11,
                        fontWeight: 700,
                      }}
                    >
                      {on ? "✓" : ""}
                    </span>
                    <span className={`text-[13px] ${on ? "text-t1" : "text-t2"}`}>
                      {c.text}
                    </span>
                  </button>
                );
              })}
            </div>

            <label className="block text-[12px] text-t2 mb-[6px]" htmlFor="pledge-email">
              Your email (we'll send you the 30-day streak reminder)
            </label>
            <input
              id="pledge-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full mb-3"
              style={{
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(155,108,245,0.25)",
                color: "#edf2ff",
                padding: "10px 13px",
                borderRadius: 10,
                fontSize: 14,
              }}
            />
            <button
              type="submit"
              disabled={status === "loading" || status === "done"}
              className="btn w-full"
              style={{
                background: status === "done" ? "rgba(155,108,245,0.4)" : "#9b6cf5",
                color: "white",
                fontSize: 14,
                fontWeight: 700,
                padding: "12px 20px",
                borderRadius: 10,
              }}
            >
              {status === "loading"
                ? "Signing…"
                : status === "done"
                  ? "✓ Pledge signed — welcome."
                  : "Sign the pledge"}
            </button>
            {error && (
              <div className="text-[12px] text-red mt-2" role="alert">
                {error}
              </div>
            )}
            <div
              className="flex justify-between text-[12px] mt-4 pt-[14px]"
              style={{ borderTop: "1px solid rgba(155,108,245,0.15)", color: "rgba(255,255,255,0.35)" }}
            >
              <span>{counters.total.toLocaleString()} people have signed</span>
              <span className="text-purple">+{counters.today.toLocaleString()} today</span>
            </div>
          </form>
        </div>
      </div>
      <style>{`@media(max-width:768px){.pledge-grid{grid-template-columns:1fr !important;}}`}</style>
    </section>
  );
}
