"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function MessageComposer({ trackSlug, isTeacher }: { trackSlug: string; isTeacher: boolean }) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [studentId, setStudentId] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  return (
    <div className="space-y-2">
      {isTeacher && (
        <input
          className="w-full rounded-lg bg-[rgba(0,0,0,0.2)] border border-white/10 p-2 text-sm"
          placeholder="Learner user id (for direct message)"
          value={studentId}
          onChange={(e) => setStudentId(e.target.value)}
        />
      )}
      <textarea
        className="w-full min-h-[80px] rounded-lg bg-[rgba(0,0,0,0.2)] border border-white/10 p-3 text-sm"
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Type a message…"
      />
      {err && <p className="text-rose-300 text-sm">{err}</p>}
      <button
        type="button"
        className="btn btn-primary"
        disabled={busy || !body.trim() || (isTeacher && !studentId.trim())}
        onClick={async () => {
          setBusy(true);
          setErr("");
          const res = await fetch(`/api/course/${encodeURIComponent(trackSlug)}/messages`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(
              isTeacher
                ? { body: body.trim(), studentId: studentId.trim() }
                : { body: body.trim() },
            ),
          });
          setBusy(false);
          if (!res.ok) {
            const b = await res.json().catch(() => ({}));
            setErr(b.error || "Failed");
            return;
          }
          setBody("");
          router.refresh();
        }}
      >
        Send
      </button>
    </div>
  );
}
