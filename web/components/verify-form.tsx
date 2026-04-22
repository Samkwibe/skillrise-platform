"use client";
import { useState } from "react";

export function VerifyForm() {
  const [id, setId] = useState("");
  const [result, setResult] = useState<{ ok: boolean; message: string; cert?: unknown } | null>(null);
  const [busy, setBusy] = useState(false);
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setResult(null);
        const res = await fetch(`/api/verify/${encodeURIComponent(id.trim())}`);
        const body = await res.json();
        setBusy(false);
        if (!res.ok) {
          setResult({ ok: false, message: body.error || "Credential not found." });
        } else {
          setResult({ ok: true, message: "Credential is valid.", cert: body.certificate });
        }
      }}
      className="flex flex-col gap-3"
    >
      <input className="input" placeholder="cert_…" value={id} onChange={(e) => setId(e.target.value)} />
      <button className="btn btn-primary justify-center" disabled={busy || !id}>{busy ? "Verifying…" : "Verify"}</button>
      {result && (
        <div className={`card p-4 ${result.ok ? "border-g" : ""}`} style={result.ok ? { borderColor: "rgba(31,200,126,0.4)" } : {}}>
          <div className={`pill ${result.ok ? "pill-g" : "pill-red"} mb-2`}>{result.ok ? "✓ Valid" : "Not valid"}</div>
          <div className="text-[13px] text-t2">{result.message}</div>
          {result.ok && (
            <a href={`/cert/${id.trim()}`} className="btn btn-ghost btn-sm mt-3">Open certificate →</a>
          )}
        </div>
      )}
    </form>
  );
}
