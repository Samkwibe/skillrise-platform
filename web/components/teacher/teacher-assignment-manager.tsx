"use client";

import { useCallback, useEffect, useState } from "react";
import type { CourseAssignment, AssignmentSubmission } from "@/lib/course/lms-types";

type Enriched = AssignmentSubmission & { studentName?: string; studentEmail?: string };

export function TeacherAssignmentManager({ trackSlug }: { trackSlug: string }) {
  const [list, setList] = useState<CourseAssignment[]>([]);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState<string | null>(null);
  const [subs, setSubs] = useState<Enriched[]>([]);
  const [subLoading, setSubLoading] = useState(false);
  const [title, setTitle] = useState("Homework");
  const [description, setDescription] = useState("");
  const [points, setPoints] = useState(100);
  const [due, setDue] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().slice(0, 16);
  });
  const [rubric, setRubric] = useState("");
  const [saving, setSaving] = useState(false);

  const base = `/api/teacher/course/${encodeURIComponent(trackSlug)}`;

  const load = useCallback(async () => {
    setErr("");
    const res = await fetch(`${base}/assignments`, { cache: "no-store" });
    if (!res.ok) {
      const b = await res.json().catch(() => ({}));
      setErr(b.error || "Could not load assignments");
      setList([]);
    } else {
      const j = await res.json();
      setList(j.assignments ?? []);
    }
    setLoading(false);
  }, [base]);

  useEffect(() => {
    load();
  }, [load]);

  async function loadSubs(assignmentId: string) {
    setSubLoading(true);
    setErr("");
    const res = await fetch(
      `${base}/assignments/${encodeURIComponent(assignmentId)}/submissions`,
      { cache: "no-store" },
    );
    setSubLoading(false);
    if (!res.ok) {
      const b = await res.json().catch(() => ({}));
      setErr(b.error || "Could not load submissions");
      setSubs([]);
      return;
    }
    const j = await res.json();
    setSubs(j.submissions ?? []);
  }

  return (
    <div className="space-y-6">
      {err && <div className="text-rose-300 text-sm">{err}</div>}

      <section className="card p-4">
        <h2 className="font-bold text-lg mb-3">Create assignment</h2>
        <p className="text-t2 text-sm mb-4">
          Students see it on the course <strong>Assignments</strong> page. Due time uses your browser’s local time zone.
        </p>
        <div className="grid gap-3 max-w-xl">
          <label className="block text-sm">
            <span className="text-t3 text-[11px] uppercase">Title</span>
            <input
              className="mt-1 w-full rounded-lg bg-[rgba(0,0,0,0.2)] border border-white/10 p-2 text-sm"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </label>
          <label className="block text-sm">
            <span className="text-t3 text-[11px] uppercase">Description / instructions</span>
            <textarea
              className="mt-1 w-full min-h-[80px] rounded-lg bg-[rgba(0,0,0,0.2)] border border-white/10 p-2 text-sm"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </label>
          <div className="grid sm:grid-cols-2 gap-3">
            <label className="block text-sm">
              <span className="text-t3 text-[11px] uppercase">Due (local)</span>
              <input
                type="datetime-local"
                className="mt-1 w-full rounded-lg bg-[rgba(0,0,0,0.2)] border border-white/10 p-2 text-sm"
                value={due}
                onChange={(e) => setDue(e.target.value)}
              />
            </label>
            <label className="block text-sm">
              <span className="text-t3 text-[11px] uppercase">Points</span>
              <input
                type="number"
                min={0}
                className="mt-1 w-full rounded-lg bg-[rgba(0,0,0,0.2)] border border-white/10 p-2 text-sm"
                value={points}
                onChange={(e) => setPoints(Number(e.target.value))}
              />
            </label>
          </div>
          <label className="block text-sm">
            <span className="text-t3 text-[11px] uppercase">Rubric (optional)</span>
            <textarea
              className="mt-1 w-full min-h-[60px] rounded-lg bg-[rgba(0,0,0,0.2)] border border-white/10 p-2 text-sm"
              value={rubric}
              onChange={(e) => setRubric(e.target.value)}
            />
          </label>
        </div>
        <button
          type="button"
          className="btn btn-primary mt-4"
          disabled={saving || !title.trim()}
          onClick={async () => {
            setSaving(true);
            setErr("");
            const dueAt = new Date(due).getTime();
            const res = await fetch(`${base}/assignments`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                title: title.trim(),
                description,
                dueAt: Number.isFinite(dueAt) ? dueAt : Date.now() + 7 * 24 * 60 * 60 * 1000,
                pointsPossible: points,
                rubric: rubric.trim() || undefined,
                attachments: [],
              }),
            });
            setSaving(false);
            if (!res.ok) {
              const b = await res.json().catch(() => ({}));
              setErr(b.error || b.details?.[0]?.message || "Create failed");
              return;
            }
            await load();
            setDescription("");
            setRubric("");
          }}
        >
          {saving ? "Saving…" : "Create assignment"}
        </button>
      </section>

      <section>
        <h2 className="font-bold text-lg mb-2">Your assignments</h2>
        {loading && <p className="text-t3 text-sm">Loading…</p>}
        {!loading && list.length === 0 && <p className="text-t2 text-sm">No assignments yet.</p>}
        <ul className="space-y-2">
          {list.map((a) => (
            <li key={a.id} className="card p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <div className="font-semibold">{a.title}</div>
                  <div className="text-[12px] text-t3">
                    Due {new Date(a.dueAt).toLocaleString()} · {a.pointsPossible} pts
                  </div>
                </div>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={async () => {
                    if (openId === a.id) {
                      setOpenId(null);
                    } else {
                      setOpenId(a.id);
                      await loadSubs(a.id);
                    }
                  }}
                >
                  {openId === a.id ? "Hide submissions" : "View submissions"}
                </button>
              </div>
              {a.description && <p className="text-t2 text-sm mt-2 whitespace-pre-wrap">{a.description}</p>}

              {openId === a.id && (
                <div className="mt-4 border-t border-white/10 pt-4">
                  {subLoading && <p className="text-t3 text-sm">Loading…</p>}
                  {!subLoading && subs.length === 0 && (
                    <p className="text-t2 text-sm">No submissions yet.</p>
                  )}
                  {subs.map((s) => (
                    <div key={s.id} className="mb-4 rounded-lg border border-white/10 p-3 text-sm">
                      <div className="font-medium text-t1">
                        {s.studentName} <span className="text-t3 text-[11px]">{s.studentEmail}</span>
                      </div>
                      <div className="text-t2 mt-2 whitespace-pre-wrap">{s.textBody || "— no text —"}</div>
                      {s.fileS3Keys && s.fileS3Keys.length > 0 && (
                        <ul className="text-[12px] mt-2 space-y-1">
                          {s.fileS3Keys.map((k) => (
                            <li key={k}>
                              <a
                                href={`/api/teacher/course/${encodeURIComponent(trackSlug)}/assignment-file?key=${encodeURIComponent(k)}`}
                                target="_blank"
                                rel="noreferrer"
                                className="underline text-g"
                              >
                                {k.split("/").pop() ?? "Download file"}
                              </a>
                            </li>
                          ))}
                        </ul>
                      )}
                      <div className="text-[11px] text-t3 mt-1">Status: {s.status}</div>
                      {s.status === "submitted" && (
                        <GradeForm
                          trackSlug={trackSlug}
                          assignmentId={a.id}
                          submissionId={s.id}
                          maxPoints={a.pointsPossible}
                          onDone={async () => {
                            await loadSubs(a.id);
                            await load();
                          }}
                        />
                      )}
                      {s.status === "graded" || s.status === "returned" ? (
                        <div className="text-t2 mt-2 text-[13px]">
                          {s.score != null && (
                            <span>
                              Scored: {s.score} / {a.pointsPossible}
                            </span>
                          )}
                          {s.feedback && <p className="text-t3 mt-1">Feedback: {s.feedback}</p>}
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              )}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function GradeForm({
  trackSlug,
  assignmentId,
  submissionId,
  maxPoints,
  onDone,
}: {
  trackSlug: string;
  assignmentId: string;
  submissionId: string;
  maxPoints: number;
  onDone: () => void;
}) {
  const [score, setScore] = useState("");
  const [feedback, setFeedback] = useState("");
  const [busy, setBusy] = useState(false);
  const [localErr, setLocalErr] = useState("");

  return (
    <div className="mt-3 space-y-2 max-w-sm">
      <div className="grid grid-cols-2 gap-2">
        <input
          type="number"
          min={0}
          max={maxPoints}
          placeholder="Score"
          className="rounded-lg bg-[rgba(0,0,0,0.2)] border border-white/10 p-2 text-sm"
          value={score}
          onChange={(e) => setScore(e.target.value)}
        />
        <span className="text-t3 text-sm self-center">/ {maxPoints}</span>
      </div>
      <textarea
        placeholder="Feedback"
        className="w-full min-h-[60px] rounded-lg bg-[rgba(0,0,0,0.2)] border border-white/10 p-2 text-sm"
        value={feedback}
        onChange={(e) => setFeedback(e.target.value)}
      />
      {localErr && <p className="text-rose-300 text-xs">{localErr}</p>}
      <button
        type="button"
        className="btn btn-primary btn-sm"
        disabled={busy}
        onClick={async () => {
          const n = Number(score);
          if (Number.isNaN(n) || n < 0) {
            setLocalErr("Enter a valid score");
            return;
          }
          setBusy(true);
          setLocalErr("");
          const res = await fetch(
            `/api/teacher/course/${encodeURIComponent(trackSlug)}/assignments/${encodeURIComponent(assignmentId)}/submissions/${encodeURIComponent(submissionId)}`,
            {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ score: n, feedback: feedback.trim(), status: "returned" }),
            },
          );
          setBusy(false);
          if (!res.ok) {
            const b = await res.json().catch(() => ({}));
            setLocalErr(b.error || "Grade failed");
            return;
          }
          setScore("");
          setFeedback("");
          onDone();
        }}
      >
        {busy ? "Saving…" : "Save grade & notify"}
      </button>
    </div>
  );
}
