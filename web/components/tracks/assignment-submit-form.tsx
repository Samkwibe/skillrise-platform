"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const MAX_FILES = 10;
const MAX_BYTES = 12 * 1024 * 1024;

type Props = {
  trackSlug: string;
  assignmentId: string;
  canEdit: boolean;
  initialText?: string;
  initialStatus?: string;
  initialFileKeys?: string[];
};

export function AssignmentSubmitForm({
  trackSlug,
  assignmentId,
  canEdit,
  initialText,
  initialStatus,
  initialFileKeys,
}: Props) {
  const router = useRouter();
  const [text, setText] = useState(initialText ?? "");
  const [fileS3Keys, setFileS3Keys] = useState<string[]>(initialFileKeys ?? []);
  const [busy, setBusy] = useState<"" | "draft" | "submit" | "upload">("");
  const [err, setErr] = useState("");

  if (!canEdit) {
    return null;
  }

  async function uploadOne(file: File) {
    setErr("");
    if (file.size > MAX_BYTES) {
      setErr(`Each file must be under ${Math.floor(MAX_BYTES / 1024 / 1024)} MB.`);
      return;
    }
    if (fileS3Keys.length >= MAX_FILES) {
      setErr(`At most ${MAX_FILES} files.`);
      return;
    }
    setBusy("upload");
    const pres = await fetch(`/api/course/${encodeURIComponent(trackSlug)}/assignments/presign`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fileName: file.name,
        contentType: file.type || "application/octet-stream",
      }),
    });
    const raw = await pres.json().catch(() => ({}));
    setBusy("");
    if (!pres.ok) {
      setErr(raw.error || raw.hint || "Upload URL failed");
      return;
    }
    const { uploadUrl, key } = raw as { uploadUrl: string; key: string };
    const put = await fetch(uploadUrl, {
      method: "PUT",
      body: file,
      headers: { "Content-Type": file.type || "application/octet-stream" },
    });
    if (!put.ok) {
      setErr("Upload to storage failed. Try a smaller file or check your connection.");
      return;
    }
    setFileS3Keys((prev) => [...prev, key]);
  }

  async function save(asDraft: boolean) {
    setBusy(asDraft ? "draft" : "submit");
    setErr("");
    const res = await fetch(
      `/api/course/${encodeURIComponent(trackSlug)}/assignments/${encodeURIComponent(assignmentId)}/submit`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ textBody: text, fileS3Keys, asDraft }),
      },
    );
    setBusy("");
    if (!res.ok) {
      const b = await res.json().catch(() => ({}));
      setErr(b.error || "Request failed");
      return;
    }
    router.refresh();
  }

  return (
    <div className="mt-3 space-y-2 border-t border-white/10 pt-3">
      <label className="text-[11px] text-t3 uppercase">Your work</label>
      <textarea
        className="w-full min-h-[120px] rounded-lg bg-[rgba(0,0,0,0.2)] border border-white/10 p-3 text-sm"
        placeholder="Type your answer. You can also attach PDF, Office documents, or images (up to 10 files, 12 MB each)."
        value={text}
        onChange={(e) => setText(e.target.value)}
      />

      <div className="text-[12px] text-t2">
        <span className="text-t3 text-[11px] uppercase block mb-1">Attachments</span>
        {fileS3Keys.length > 0 && (
          <ul className="list-disc pl-4 mb-2 space-y-0.5">
            {fileS3Keys.map((k) => (
              <li key={k} className="flex items-center gap-2 flex-wrap">
                <span className="truncate max-w-[280px] text-t2" title={k}>
                  {k.split("/").pop() ?? k}
                </span>
                <button
                  type="button"
                  className="text-rose-300 text-[11px] underline"
                  onClick={() => setFileS3Keys((p) => p.filter((x) => x !== k))}
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
        <label className="inline-flex items-center gap-2 cursor-pointer">
          <span className="btn btn-ghost btn-sm pointer-events-none">
            {busy === "upload" ? "Uploading…" : "Add file"}
          </span>
          <input
            type="file"
            className="sr-only"
            disabled={busy !== ""}
            onChange={async (e) => {
              const f = e.target.files?.[0];
              e.target.value = "";
              if (f) await uploadOne(f);
            }}
          />
        </label>
      </div>

      {err && <p className="text-rose-300 text-sm">{err}</p>}
      <div className="flex flex-wrap gap-2">
        <button type="button" className="btn btn-ghost btn-sm" disabled={!!busy} onClick={() => save(true)}>
          {busy === "draft" ? "Saving…" : "Save draft"}
        </button>
        <button type="button" className="btn btn-primary btn-sm" disabled={!!busy} onClick={() => save(false)}>
          {busy === "submit" ? "Submitting…" : "Submit"}
        </button>
      </div>
      {initialStatus === "draft" && (
        <p className="text-amber-200 text-[12px]">You have a saved draft. Submit when ready.</p>
      )}
    </div>
  );
}
