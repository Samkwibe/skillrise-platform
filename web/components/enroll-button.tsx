"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function EnrollButton({ trackSlug, inviteToken }: { trackSlug: string; inviteToken?: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  return (
    <>
      <button
        type="button"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          setErr("");
          const res = await fetch("/api/enrollments", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ trackSlug, inviteToken: inviteToken || undefined }),
          });
          setBusy(false);
          if (!res.ok) {
            const b = await res.json().catch(() => ({}));
            setErr(b.error || "Could not enroll.");
            return;
          }
          router.push("/my-courses");
        }}
        className="btn btn-primary w-full justify-center"
      >
        {busy ? "Enrolling…" : "Enroll free"}
      </button>
      {err && <div className="pill pill-red mt-2">{err}</div>}
    </>
  );
}
