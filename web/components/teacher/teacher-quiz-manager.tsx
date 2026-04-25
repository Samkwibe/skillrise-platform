"use client";

import { useCallback, useState } from "react";
import type { Quiz, QuizKind } from "@/lib/quiz/types";
import { QuizLivePreview } from "./quiz-live-preview";

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
  const [generatingAI, setGeneratingAI] = useState(false);

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

  const handleAIGenerate = async () => {
    if (!youtubeVideoId && kind === "checkpoint") {
      setErr("Please enter a YouTube video ID first so AI can analyze the transcript.");
      return;
    }
    setGeneratingAI(true);
    setErr(null);
    
    try {
      const res = await fetch("/api/teacher/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          prompt: `You are generating a quiz. Generate 2 multiple choice questions for a quiz titled "${title || 'Knowledge Check'}". The quiz is a ${kind} quiz. Return EXACTLY AND ONLY a valid JSON array of objects, where each object has exactly these fields: "prompt" (string), "o0" (string), "o1" (string), "o2" (string), "o3" (string), "correctIndex" (number 0-3). Do not wrap the JSON in markdown code blocks. Do not include any explanations.`, 
          history: [], 
          stream: true 
        }),
      });

      if (!res.ok || !res.body) {
        throw new Error("Failed to connect to AI assistant.");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = "";
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
      }
      
      // Clean up markdown code blocks if the AI accidentally adds them
      let cleanJson = acc.trim();
      if (cleanJson.startsWith('```json')) cleanJson = cleanJson.substring(7);
      if (cleanJson.startsWith('```')) cleanJson = cleanJson.substring(3);
      if (cleanJson.endsWith('```')) cleanJson = cleanJson.substring(0, cleanJson.length - 3);
      cleanJson = cleanJson.trim();

      const parsedDrafts = JSON.parse(cleanJson);
      if (Array.isArray(parsedDrafts) && parsedDrafts.length > 0) {
        if (!title) setTitle("Auto-Generated Knowledge Check");
        setDrafts(parsedDrafts);
      } else {
        throw new Error("AI returned invalid format.");
      }
    } catch (e) {
      setErr("AI Generation failed: " + (e as Error).message);
    } finally {
      setGeneratingAI(false);
    }
  };

  return (
    <div className="flex flex-col xl:flex-row gap-8 w-full min-h-[calc(100vh-12rem)]">
      
      {/* LEFT PANE: Editor & Controls */}
      <div className="flex-1 max-w-3xl space-y-6">
        
        {/* Course Key Selection */}
        <section className="p-6 rounded-3xl bg-white/[0.03] border border-white/10 backdrop-blur-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl -mr-10 -mt-10 transition-transform group-hover:scale-150"></div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-indigo-400 mb-2">1. Connect Course</h2>
          <p className="text-sm text-t2 mb-4 leading-relaxed max-w-xl">
            Link this quiz to an existing course. Copy the <code className="text-[11px] font-mono bg-white/10 px-1.5 py-0.5 rounded">k</code> value from your course URL.
          </p>
          <div className="flex flex-wrap gap-3">
            <input
              className="flex-1 min-w-[200px] bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:ring-2 focus:ring-indigo-500/50 focus:outline-none transition-all"
              value={courseKey}
              onChange={(e) => setCourseKey(e.target.value.trim())}
              placeholder="e.g. a1b2c3d4e5f6g7h8"
              aria-label="Course key"
            />
            <button 
              type="button" 
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-indigo-600/20 disabled:opacity-50"
              disabled={loading} 
              onClick={() => void load()}
            >
              {loading ? "Loading…" : "Load Quizzes"}
            </button>
          </div>
        </section>

        {/* Existing Quizzes List */}
        {quizzes && (
          <section className="p-6 rounded-3xl bg-white/[0.03] border border-white/10 backdrop-blur-xl">
            <h2 className="text-sm font-bold uppercase tracking-wider text-white mb-4">Existing Quizzes</h2>
            {quizzes.length === 0 ? (
              <div className="text-sm text-t3 border border-dashed border-white/10 rounded-xl p-8 text-center bg-white/[0.01]">
                No quizzes yet. Create your first one below.
              </div>
            ) : (
              <ul className="space-y-3">
                {quizzes.map((q) => (
                  <li
                    key={q.id}
                    className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.05] transition-colors"
                  >
                    <div>
                      <div className="font-bold text-white mb-1">{q.title}</div>
                      <div className="text-[11px] font-medium text-t3 flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded ${q.kind === 'final' ? 'bg-purple-500/20 text-purple-300' : 'bg-indigo-500/20 text-indigo-300'}`}>
                          {q.kind}
                        </span>
                        <span>{q.questions.length} Qs</span>
                        {q.youtubeVideoId && <span>· YT: {q.youtubeVideoId}</span>}
                        {q.triggerAtSec != null && <span>· @ {Math.floor(q.triggerAtSec/60)}:{(q.triggerAtSec%60).toString().padStart(2, '0')}</span>}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button type="button" className="px-3 py-1.5 text-xs font-semibold bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors" onClick={() => startEdit(q)}>
                        Edit
                      </button>
                      <button type="button" className="px-3 py-1.5 text-xs font-semibold bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors" onClick={() => void remove(q.id)}>
                        Delete
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

        {/* Quiz Builder Editor */}
        <section className="p-6 rounded-3xl bg-white/[0.03] border border-white/10 backdrop-blur-xl relative">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/10">
            <h2 className="text-xl font-bold text-white">{editingId ? "Edit Quiz" : "Create New Quiz"}</h2>
            
            <button 
              onClick={handleAIGenerate}
              disabled={generatingAI}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600/20 to-indigo-600/20 hover:from-purple-600/40 hover:to-indigo-600/40 border border-purple-500/30 text-purple-300 text-xs font-bold transition-all"
            >
              <span className="text-sm">✨</span> 
              {generatingAI ? "Analyzing Video..." : "Auto-Generate with AI"}
            </button>
          </div>

          <div className="grid sm:grid-cols-2 gap-4 mb-8">
            <label className="block text-sm col-span-2 sm:col-span-1">
              <span className="text-t3 font-medium mb-1.5 block">Title</span>
              <input className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:ring-2 focus:ring-indigo-500/50 focus:outline-none transition-all" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Module 1 Knowledge Check" />
            </label>
            <label className="block text-sm col-span-2 sm:col-span-1">
              <span className="text-t3 font-medium mb-1.5 block">Quiz Type</span>
              <select
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:ring-2 focus:ring-indigo-500/50 focus:outline-none transition-all"
                value={kind}
                onChange={(e) => setKind(e.target.value as QuizKind)}
              >
                <option value="checkpoint">Checkpoint (Timed in video)</option>
                <option value="final">Final Exam (Standalone)</option>
              </select>
            </label>
            <label className="block text-sm col-span-2">
              <span className="text-t3 font-medium mb-1.5 block">YouTube Video ID <span className="text-indigo-400 text-xs">(Required for checkpoint & AI)</span></span>
              <input
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 font-mono text-white text-sm focus:ring-2 focus:ring-indigo-500/50 focus:outline-none transition-all"
                value={youtubeVideoId}
                onChange={(e) => setYoutubeVideoId(e.target.value.trim())}
                placeholder="e.g. dQw4w9WgXcQ"
              />
            </label>
            {kind === "checkpoint" && (
              <label className="block text-sm">
                <span className="text-t3 font-medium mb-1.5 block">Trigger At (Seconds)</span>
                <input
                  type="number"
                  min={1}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:ring-2 focus:ring-indigo-500/50 focus:outline-none transition-all"
                  value={triggerAtSec}
                  onChange={(e) => setTriggerAtSec(Number(e.target.value))}
                />
              </label>
            )}
            <div className={`grid grid-cols-2 gap-4 ${kind !== 'checkpoint' ? 'col-span-2' : ''}`}>
              <label className="block text-sm">
                <span className="text-t3 font-medium mb-1.5 block">Pass Percentage</span>
                <input
                  type="number"
                  min={0}
                  max={100}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:ring-2 focus:ring-indigo-500/50 focus:outline-none transition-all"
                  value={passPct}
                  onChange={(e) => setPassPct(Number(e.target.value))}
                />
              </label>
              <label className="block text-sm">
                <span className="text-t3 font-medium mb-1.5 block">Max Attempts</span>
                <input
                  type="number"
                  min={1}
                  max={10}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:ring-2 focus:ring-indigo-500/50 focus:outline-none transition-all"
                  value={maxAttempts}
                  onChange={(e) => setMaxAttempts(Number(e.target.value))}
                />
              </label>
            </div>
          </div>

          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Questions</h3>
            <span className="text-xs text-t3 font-medium">{drafts.length} total</span>
          </div>

          <div className="space-y-6">
            {drafts.map((d, i) => (
              <div key={i} className="bg-white/[0.02] border border-white/5 rounded-2xl p-5 relative group transition-all hover:border-white/20">
                <div className="absolute -left-3 top-5 w-6 h-6 rounded-full bg-indigo-500/20 border border-indigo-500/50 flex items-center justify-center text-[10px] font-bold text-indigo-300">
                  {i + 1}
                </div>
                
                <div className="flex justify-between items-start mb-4">
                  <input
                    className="flex-1 bg-transparent border-none text-white font-bold text-base focus:ring-0 placeholder:text-t3/50 px-0"
                    placeholder="Enter question prompt..."
                    value={d.prompt}
                    onChange={(e) => {
                      const v = e.target.value;
                      setDrafts((prev) => prev.map((x, j) => (j === i ? { ...x, prompt: v } : x)));
                    }}
                  />
                  {drafts.length > 1 && (
                    <button
                      type="button"
                      className="text-xs font-semibold text-red-400 opacity-0 group-hover:opacity-100 transition-opacity bg-red-400/10 px-2 py-1 rounded-md"
                      onClick={() => setDrafts((prev) => prev.filter((_, j) => j !== i))}
                    >
                      Delete
                    </button>
                  )}
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                  {(["o0", "o1", "o2", "o3"] as const).map((k, oi) => (
                    <div key={k} className="relative flex items-center">
                      <div className={`absolute left-3 w-4 h-4 rounded-full border flex items-center justify-center ${d.correctIndex === oi ? 'border-green-400 bg-green-500/20' : 'border-t3/30'}`}>
                        {d.correctIndex === oi && <div className="w-1.5 h-1.5 rounded-full bg-green-400"></div>}
                      </div>
                      <input
                        className={`w-full bg-black/30 border rounded-xl pl-10 pr-3 py-2 text-sm text-t2 focus:ring-2 focus:ring-indigo-500/50 focus:outline-none transition-all ${d.correctIndex === oi ? 'border-green-500/30 bg-green-500/5' : 'border-white/5'}`}
                        placeholder={`Option ${oi + 1}`}
                        value={d[k]}
                        onChange={(e) => {
                          const v = e.target.value;
                          setDrafts((prev) =>
                            prev.map((x, j) => {
                              if (j !== i) return x;
                              return { ...x, [k]: v };
                            }),
                          );
                        }}
                      />
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs text-t3 font-medium">Mark Correct Answer:</span>
                  <div className="flex gap-2">
                    {[0, 1, 2, 3].map((val) => (
                      <button
                        key={val}
                        onClick={() => setDrafts((prev) => prev.map((x, j) => (j === i ? { ...x, correctIndex: val } : x)))}
                        className={`w-7 h-7 rounded-md text-xs font-bold transition-all ${d.correctIndex === val ? 'bg-green-500 text-white' : 'bg-white/5 text-t3 hover:bg-white/10'}`}
                      >
                        {val + 1}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button 
            type="button" 
            className="w-full mt-6 py-4 rounded-xl border-2 border-dashed border-white/10 text-t2 font-bold text-sm hover:border-indigo-500/50 hover:bg-indigo-500/5 transition-all flex items-center justify-center gap-2" 
            onClick={() => setDrafts((p) => [...p, emptyQ()])}
          >
            <span>+</span> Add Another Question
          </button>

          {err && (
            <div className="mt-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium flex items-center gap-2">
              <span className="text-lg">⚠️</span> {err}
            </div>
          )}

          <div className="flex flex-wrap gap-3 mt-8 pt-6 border-t border-white/10">
            <button 
              type="button" 
              className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-indigo-500/25 disabled:opacity-50" 
              disabled={saving} 
              onClick={() => void save()}
            >
              {saving ? "Saving…" : editingId ? "Save Changes" : "Create Quiz"}
            </button>
            {editingId && (
              <button type="button" className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white text-sm font-bold rounded-xl transition-all" onClick={resetForm}>
                Cancel Edit
              </button>
            )}
          </div>
        </section>
      </div>

      {/* RIGHT PANE: Live Student Preview */}
      <div className="hidden xl:block flex-1 min-w-[400px] sticky top-6 h-[calc(100vh-6rem)]">
        <h2 className="text-sm font-bold uppercase tracking-wider text-t3 mb-4 flex items-center gap-2">
          <span>👀</span> Live Student Preview
        </h2>
        <QuizLivePreview
          title={title}
          kind={kind}
          youtubeVideoId={youtubeVideoId}
          triggerAtSec={triggerAtSec}
          drafts={drafts}
        />
      </div>

    </div>
  );
}
