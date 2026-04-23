"use client";

import { useCallback, useState } from "react";
import type { Quiz, QuizKind } from "@/lib/quiz/types";

type QDraft = { prompt: string; o0: string; o1: string; o2: string; o3: string; correctIndex: number };

const emptyQ = (): QDraft => ({
  prompt: "",
  o0: "",
  o1: "",
  o2: "",
  o3: "",
  correctIndex: 0,
});

function draftToQuestions(drafts: QDraft[]): { prompt: string; options: string[]; correctIndex: number }[] {
  return drafts.map((d) => {
    const opts = [d.o0, d.o1, d.o2, d.o3].map((s) => s.trim()).filter(Boolean);
    if (opts.length < 2) throw new Error("Each question needs at least 2 options.");
    let ci = d.correctIndex;
    if (ci >= opts.length) ci = 0;
    return { prompt: d.prompt.trim(), options: opts, correctIndex: ci };
  });
}

function quizToDrafts(quiz: Quiz): QDraft[] {
  return quiz.questions.map((q) => {
    const o = [...q.options, "", "", "", ""].slice(0, 4);
    return {
      prompt: q.prompt,
      o0: o[0] ?? "",
      o1: o[1] ?? "",
      o2: o[2] ?? "",
      o3: o[3] ?? "",
      correctIndex: q.correctIndex,
    };
  });
}

export function TeacherQuizManager() {
  const [courseKey, setCourseKey] = useState("");
  const [quizzes, setQuizzes] = useState<Quiz[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [kind, setKind] = useState<QuizKind>("checkpoint");
  const [youtubeVideoId, setYoutubeVideoId] = useState("");
  const [triggerAtSec, setTriggerAtSec] = useState(600);
  const [passPct, setPassPct] = useState(70);
  const [maxAttempts, setMaxAttempts] = useState(3);
  const [drafts, setDrafts] = useState<QDraft[]>([emptyQ(), emptyQ()]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const ck = courseKey.trim();
    if (!ck) {
      setErr("Enter a course key first.");
      return;
    }
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch(`/api/teacher/quizzes?courseKey=${encodeURIComponent(ck)}`, { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Load failed");
      setQuizzes(data.quizzes || []);
    } catch (e) {
      setErr((e as Error).message);
      setQuizzes([]);
    } finally {
      setLoading(false);
    }
  }, [courseKey]);

  const resetForm = () => {
    setEditingId(null);
    setTitle("");
    setKind("checkpoint");
    setYoutubeVideoId("");
    setTriggerAtSec(600);
    setPassPct(70);
    setMaxAttempts(3);
    setDrafts([emptyQ(), emptyQ()]);
  };

  const startEdit = (q: Quiz) => {
    setEditingId(q.id);
    setTitle(q.title);
    setKind(q.kind);
    setYoutubeVideoId(q.youtubeVideoId ?? "");
    setTriggerAtSec(q.triggerAtSec ?? 600);
    setPassPct(q.passPct);
    setMaxAttempts(q.maxAttempts);
    setDrafts(q.questions.length ? quizToDrafts(q) : [emptyQ()]);
  };

  const save = async () => {
    const ck = courseKey.trim();
    if (!ck) {
      setErr("Course key is required.");
      return;
    }
    let questions;
    try {
      questions = draftToQuestions(drafts);
    } catch (e) {
      setErr((e as Error).message);
      return;
    }
    for (const q of questions) {
      if (!q.prompt) {
        setErr("Each question needs a prompt.");
        return;
      }
    }

    setSaving(true);
    setErr(null);
    try {
      const body = {
        courseKey: ck,
        youtubeVideoId: youtubeVideoId.trim() || undefined,
        title: title.trim(),
        kind,
        triggerAtSec: kind === "checkpoint" ? triggerAtSec : undefined,
        passPct,
        maxAttempts,
        questions,
      };
      const url = editingId ? `/api/teacher/quizzes/${editingId}` : "/api/teacher/quizzes";
      const res = await fetch(url, {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingId ? { ...body, courseKey: ck } : body),
      });
      const data = await res.json();
      if (!res.ok) {
        const iss = data.issues as { message?: string }[] | undefined;
        const msg = iss?.length
          ? iss.map((i) => i.message).filter(Boolean).join(" · ")
          : (data.error as string) || "Save failed";
        throw new Error(msg);
      }
      resetForm();
      await load();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (quizId: string) => {
    if (!confirm("Delete this quiz?")) return;
    setErr(null);
    try {
      const res = await fetch(`/api/teacher/quizzes/${quizId}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Delete failed");
      if (editingId === quizId) resetForm();
      await load();
    } catch (e) {
      setErr((e as Error).message);
    }
  };

  return (
    <div className="space-y-8">
      <section className="card p-5">
        <h2 className="font-display text-lg font-bold mb-2">1. Course key</h2>
        <p className="text-sm text-t2 mb-3 leading-relaxed">
          Use the same key as the learner URL: from <code className="text-xs font-mono">/courses/learn?k=…</code> copy
          the <code className="text-xs font-mono">k</code> value (16-char id). It identifies the saved course + video
          context.
        </p>
        <div className="flex flex-wrap gap-2">
          <input
            className="input flex-1 min-w-[200px]"
            value={courseKey}
            onChange={(e) => setCourseKey(e.target.value.trim())}
            placeholder="e.g. a1b2c3d4e5f6g7h8"
            aria-label="Course key"
          />
          <button type="button" className="btn btn-primary" disabled={loading} onClick={() => void load()}>
            {loading ? "Loading…" : "Load quizzes"}
          </button>
        </div>
      </section>

      {quizzes && (
        <section className="card p-5">
          <h2 className="font-display text-lg font-bold mb-3">Quizzes for this course</h2>
          {quizzes.length === 0 ? (
            <p className="text-sm text-t3">No quizzes yet. Create one below.</p>
          ) : (
            <ul className="space-y-2">
              {quizzes.map((q) => (
                <li
                  key={q.id}
                  className="flex flex-wrap items-center justify-between gap-2 border-b border-border1 pb-2 last:border-0"
                >
                  <div>
                    <div className="font-medium">{q.title}</div>
                    <div className="text-xs text-t3">
                      {q.kind} · {q.questions.length} Q
                      {q.youtubeVideoId ? ` · YT ${q.youtubeVideoId}` : ""}
                      {q.triggerAtSec != null ? ` · @ ${q.triggerAtSec}s` : ""}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => startEdit(q)}>
                      Edit
                    </button>
                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => void remove(q.id)}>
                      Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      <section className="card p-5">
        <h2 className="font-display text-lg font-bold mb-2">{editingId ? "Edit quiz" : "Create quiz"}</h2>
        <div className="grid sm:grid-cols-2 gap-3 mb-4">
          <label className="block text-sm">
            <span className="text-t3">Title</span>
            <input className="input w-full mt-1" value={title} onChange={(e) => setTitle(e.target.value)} />
          </label>
          <label className="block text-sm">
            <span className="text-t3">Kind</span>
            <select
              className="input w-full mt-1"
              value={kind}
              onChange={(e) => setKind(e.target.value as QuizKind)}
            >
              <option value="checkpoint">Checkpoint (timed in video)</option>
              <option value="final">Final exam</option>
            </select>
          </label>
          <label className="block text-sm sm:col-span-2">
            <span className="text-t3">YouTube video id (required for checkpoint)</span>
            <input
              className="input w-full mt-1 font-mono text-sm"
              value={youtubeVideoId}
              onChange={(e) => setYoutubeVideoId(e.target.value.trim())}
              placeholder="e.g. dQw4w9WgXcQ"
            />
          </label>
          {kind === "checkpoint" && (
            <label className="block text-sm">
              <span className="text-t3">Trigger at (seconds)</span>
              <input
                type="number"
                min={1}
                className="input w-full mt-1"
                value={triggerAtSec}
                onChange={(e) => setTriggerAtSec(Number(e.target.value))}
              />
            </label>
          )}
          <label className="block text-sm">
            <span className="text-t3">Pass % (e.g. 70)</span>
            <input
              type="number"
              min={0}
              max={100}
              className="input w-full mt-1"
              value={passPct}
              onChange={(e) => setPassPct(Number(e.target.value))}
            />
          </label>
          <label className="block text-sm">
            <span className="text-t3">Max attempts</span>
            <input
              type="number"
              min={1}
              max={10}
              className="input w-full mt-1"
              value={maxAttempts}
              onChange={(e) => setMaxAttempts(Number(e.target.value))}
            />
          </label>
        </div>

        <div className="text-sm font-bold text-t3 mb-2">Questions (2–4 options each)</div>
        <div className="space-y-4">
          {drafts.map((d, i) => (
            <div key={i} className="border border-border1 rounded-[10px] p-3 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-t3">Question {i + 1}</span>
                {drafts.length > 1 && (
                  <button
                    type="button"
                    className="text-xs text-red-400 underline"
                    onClick={() => setDrafts((prev) => prev.filter((_, j) => j !== i))}
                  >
                    Remove
                  </button>
                )}
              </div>
              <input
                className="input w-full text-sm"
                placeholder="Prompt"
                value={d.prompt}
                onChange={(e) => {
                  const v = e.target.value;
                  setDrafts((prev) => prev.map((x, j) => (j === i ? { ...x, prompt: v } : x)));
                }}
              />
              {(["o0", "o1", "o2", "o3"] as const).map((k, oi) => (
                <input
                  key={k}
                  className="input w-full text-sm"
                  placeholder={`Option ${oi + 1}`}
                  value={d[k]}
                  onChange={(e) => {
                    const v = e.target.value;
                    setDrafts((prev) =>
                      prev.map((x, j) => {
                        if (j !== i) return x;
                        if (k === "o0") return { ...x, o0: v };
                        if (k === "o1") return { ...x, o1: v };
                        if (k === "o2") return { ...x, o2: v };
                        return { ...x, o3: v };
                      }),
                    );
                  }}
                />
              ))}
              <label className="text-xs text-t3 flex items-center gap-2">
                Correct:
                <select
                  className="input py-1 text-sm"
                  value={d.correctIndex}
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    setDrafts((prev) => prev.map((x, j) => (j === i ? { ...x, correctIndex: v } : x)));
                  }}
                >
                  <option value={0}>1</option>
                  <option value={1}>2</option>
                  <option value={2}>3</option>
                  <option value={3}>4</option>
                </select>
              </label>
            </div>
          ))}
        </div>
        <button type="button" className="btn btn-ghost btn-sm mt-2" onClick={() => setDrafts((p) => [...p, emptyQ()])}>
          + Add question
        </button>

        {err && <p className="text-sm text-red-400 mt-3">{err}</p>}

        <div className="flex flex-wrap gap-2 mt-4">
          <button type="button" className="btn btn-primary" disabled={saving} onClick={() => void save()}>
            {saving ? "Saving…" : editingId ? "Update quiz" : "Create quiz"}
          </button>
          {editingId && (
            <button type="button" className="btn btn-ghost" onClick={resetForm}>
              Cancel edit
            </button>
          )}
        </div>
      </section>
    </div>
  );
}
