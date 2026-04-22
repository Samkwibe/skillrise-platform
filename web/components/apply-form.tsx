"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function ApplyForm({ jobId, certificateIds }: { jobId: string; certificateIds: string[] }) {
  const router = useRouter();
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setErr("");
        const res = await fetch(`/api/jobs/${jobId}/apply`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ note, certificateIds }),
        });
        setBusy(false);
        if (!res.ok) {
          const b = await res.json().catch(() => ({}));
          setErr(b.error || "Could not apply.");
          return;
        }
        router.refresh();
      }}
      className="flex flex-col gap-3"
    >
      <div>
        <label className="label" htmlFor="note">Add a short note (optional)</label>
        <textarea id="note" className="input" rows={4} placeholder="Why this role, when you can start." value={note} onChange={(e) => setNote(e.target.value)} />
      </div>
      <div className="text-[12px] text-t3">
        Your verified SkillRise credentials ({certificateIds.length} cert{certificateIds.length === 1 ? "" : "s"}) will be attached automatically.
      </div>
      {err && <div className="pill pill-red">{err}</div>}
      <button disabled={busy} className="btn btn-primary justify-center">{busy ? "Submitting…" : "Apply now"}</button>
    </form>
  );
}
