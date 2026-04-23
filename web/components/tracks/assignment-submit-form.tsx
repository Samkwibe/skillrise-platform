"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
  trackSlug: string;
  assignmentId: string;
  canEdit: boolean;
  initialText?: string;
  initialStatus?: string;
};

export function AssignmentSubmitForm({ trackSlug, assignmentId, canEdit, initialText, initialStatus }: Props) {
  const router = useRouter();
  const [text, setText] = useState(initialText ?? "");
  const [busy, setBusy] = useState<"" | "draft" | "submit">("");
  const [err, setErr] = useState("");

  if (!canEdit) {
    return null;
  }

  return (
    <div className="mt-3 space-y-2 border-t border-white/10 pt-3">
      <label className="text-[11px] text-t3 uppercase">Your work</label>
      <textarea
        className="w-full min-h-[120px] rounded-lg bg-[rgba(0,0,0,0.2)] border border-white/10 p-3 text-sm"
        placeholder="Type your answer. File uploads: use a link in text, or we can wire S3 in a follow-up."
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      {err && <p className="text-rose-300 text-sm">{err}</p>}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          disabled={!!busy}
          onClick={async () => {
            setBusy("draft");
            setErr("");
            const res = await fetch(
              `/api/course/${encodeURIComponent(trackSlug)}/assignments/${encodeURIComponent(assignmentId)}/submit`,
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ textBody: text, asDraft: true }),
              },
            );
            setBusy("");
            if (!res.ok) {
              const b = await res.json().catch(() => ({}));
              setErr(b.error || "Save failed");
              return;
            }
            router.refresh();
          }}
        >
          {busy === "draft" ? "Saving…" : "Save draft"}
        </button>
        <button
          type="button"
          className="btn btn-primary btn-sm"
          disabled={!!busy}
          onClick={async () => {
            setBusy("submit");
            setErr("");
            const res = await fetch(
              `/api/course/${encodeURIComponent(trackSlug)}/assignments/${encodeURIComponent(assignmentId)}/submit`,
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ textBody: text, asDraft: false }),
              },
            );
            setBusy("");
            if (!res.ok) {
              const b = await res.json().catch(() => ({}));
              setErr(b.error || "Submit failed");
              return;
            }
            router.refresh();
          }}
        >
          {busy === "submit" ? "Submitting…" : "Submit"}
        </button>
      </div>
      {initialStatus === "draft" && <p className="text-amber-200 text-[12px]">You have a saved draft. Submit when ready.</p>}
    </div>
  );
}
