"use client";
import { useState } from "react";

export function Employers() {
  const [form, setForm] = useState({
    company: "",
    email: "",
    role: "",
  });
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<"post" | "talk">("post");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    setError(null);
    try {
      const res = await fetch("/api/contact-employer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, mode }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || "Failed");
      }
      setStatus("done");
    } catch (err) {
      setError((err as Error).message);
      setStatus("error");
    }
  };

  return (
    <section id="employers" className="section-pad">
      <div className="mx-wrap">
        <div
          className="flex items-center justify-between gap-8 flex-wrap emp-card"
          style={{
            background: "#121820",
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 20,
            padding: "clamp(28px,4vw,52px)",
          }}
        >
          <div style={{ flex: 1, minWidth: 240 }}>
            <div className="stag">For employers</div>
            <h2 className="sh" style={{ fontSize: "clamp(22px,3vw,32px)" }}>
              Stop sorting resumes.
              <br />
              Hire people who are ready.
            </h2>
            <p
              className="text-t3 text-[14px] mt-[9px] leading-[1.65]"
              style={{ maxWidth: 420 }}
            >
              Join 340+ local businesses using SkillRise to find pre-certified,
              community-invested candidates. Every hire comes with a 90-day guarantee.
            </p>

            {status !== "done" ? (
              <form onSubmit={submit} className="mt-5 flex flex-col gap-2" style={{ maxWidth: 480 }}>
                <div className="flex gap-2 flex-wrap mb-1">
                  <button
                    type="button"
                    onClick={() => setMode("post")}
                    className="btn btn-sm"
                    style={{
                      background: mode === "post" ? "#1fc87e" : "transparent",
                      color: mode === "post" ? "#06080d" : "#edf2ff",
                      border: "1px solid rgba(255,255,255,0.13)",
                    }}
                  >
                    Post your first job free
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode("talk")}
                    className="btn btn-sm"
                    style={{
                      background: mode === "talk" ? "#1fc87e" : "transparent",
                      color: mode === "talk" ? "#06080d" : "#edf2ff",
                      border: "1px solid rgba(255,255,255,0.13)",
                    }}
                  >
                    Talk to our team
                  </button>
                </div>
                <input
                  required
                  value={form.company}
                  onChange={(e) => setForm((f) => ({ ...f, company: e.target.value }))}
                  placeholder="Company"
                  className="emp-input"
                />
                <input
                  required
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  placeholder="Work email"
                  className="emp-input"
                />
                <input
                  required
                  value={form.role}
                  onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
                  placeholder={mode === "post" ? "Role you want to hire for" : "What do you want to discuss?"}
                  className="emp-input"
                />
                <button
                  disabled={status === "loading"}
                  className="btn btn-primary"
                  style={{ alignSelf: "flex-start" }}
                >
                  {status === "loading" ? "Sending…" : mode === "post" ? "Post your first job free" : "Request a callback"}
                </button>
                {error && (
                  <div className="text-[12px] text-red" role="alert">
                    {error}
                  </div>
                )}
              </form>
            ) : (
              <div
                className="mt-5 p-4 text-[14px] text-g"
                style={{
                  background: "rgba(31,200,126,0.08)",
                  border: "1px solid rgba(31,200,126,0.2)",
                  borderRadius: 12,
                }}
                role="status"
              >
                ✓ Got it. Our team will reach out within 24 business hours.
              </div>
            )}
          </div>
          <div className="text-center flex-shrink-0">
            <div className="text-[60px] mb-[10px]">🏗️</div>
            <div className="text-t3 text-[13px] mb-[3px]">Average time to hire</div>
            <div className="font-display font-extrabold text-g text-[34px]">11 days</div>
            <div className="text-t3 text-[12px]">vs. 42 day industry average</div>
          </div>
        </div>
      </div>

      <style>{`
        .emp-input{
          background:rgba(255,255,255,0.06);
          border:1px solid rgba(255,255,255,0.13);
          color:#edf2ff;
          padding:10px 13px;
          border-radius:10px;
          font-size:14px;
          font-family:inherit;
        }
        .emp-input::placeholder{color:#465070;}
        .emp-input:focus{outline:2px solid #1fc87e;outline-offset:1px;}
      `}</style>
    </section>
  );
}
