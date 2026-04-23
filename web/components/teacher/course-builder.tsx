"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Module, CourseMaterial } from "@/lib/store";
import type { CourseUnitOutline } from "@/lib/course/outline";

function newId(p: string) {
  return `${p}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

const emptyLesson = (unitId: string, unitTitle: string): Module => ({
  id: newId("m"),
  title: "New lesson",
  duration: "15 min",
  durationMin: 15,
  summary: "",
  transcript: "",
  unitId,
  unitTitle,
  isPreview: false,
  videoSource: "none",
  materials: [],
  transcribeStatus: "none",
});

export function CourseBuilder({ trackSlug }: { trackSlug: string }) {
  const router = useRouter();
  const [units, setUnits] = useState<CourseUnitOutline[] | null>(null);
  const [s3Configured, setS3Configured] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [loadState, setLoadState] = useState<"loading" | "ready">("loading");

  const load = useCallback(async () => {
    setLoadState("loading");
    setErr(null);
    try {
      const res = await fetch(`/api/teacher/course/${encodeURIComponent(trackSlug)}`, { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load");
      let u = (data.units || []) as CourseUnitOutline[];
      if (u.length === 0) {
        const uid = newId("unit");
        u = [{ id: uid, title: "Module 1", lessons: [emptyLesson(uid, "Module 1")] }];
      }
      setUnits(u);
      setS3Configured(Boolean(data.s3Configured));
    } catch (e) {
      setErr((e as Error).message);
      setUnits(null);
    } finally {
      setLoadState("ready");
    }
  }, [trackSlug]);

  useEffect(() => {
    void load();
  }, [load]);

  const save = async () => {
    if (!units?.length) return;
    setSaving(true);
    setErr(null);
    try {
      const res = await fetch(`/api/teacher/course/${encodeURIComponent(trackSlug)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ units }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");
      setUnits(data.units || units);
      router.refresh();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const addUnit = () => {
    setUnits((u) => {
      const list = u ?? [];
      const id = newId("unit");
      return [...list, { id, title: `Module ${list.length + 1}`, lessons: [emptyLesson(id, `Module ${list.length + 1}`)] }];
    });
  };

  const addLesson = (unitIdx: number) => {
    setUnits((prev) => {
      if (!prev) return prev;
      const u = prev[unitIdx];
      if (!u) return prev;
      const next = structuredClone(prev) as CourseUnitOutline[];
      const lesson = emptyLesson(u.id, u.title);
      next[unitIdx].lessons = [...next[unitIdx].lessons, lesson];
      return next;
    });
  };

  const updateLesson = (unitIdx: number, lessonIdx: number, patch: Partial<Module>) => {
    setUnits((prev) => {
      if (!prev) return prev;
      const next = structuredClone(prev) as CourseUnitOutline[];
      next[unitIdx].lessons[lessonIdx] = { ...next[unitIdx].lessons[lessonIdx], ...patch };
      return next;
    });
  };

  const updateUnitTitle = (unitIdx: number, title: string) => {
    setUnits((prev) => {
      if (!prev) return prev;
      const next = structuredClone(prev) as CourseUnitOutline[];
      next[unitIdx].title = title;
      for (const l of next[unitIdx].lessons) l.unitTitle = title;
      return next;
    });
  };

  const removeLesson = (unitIdx: number, lessonIdx: number) => {
    setUnits((prev) => {
      if (!prev) return prev;
      const next = structuredClone(prev) as CourseUnitOutline[];
      next[unitIdx].lessons = next[unitIdx].lessons.filter((_, i) => i !== lessonIdx);
      if (next[unitIdx].lessons.length === 0) {
        next[unitIdx].lessons = [emptyLesson(next[unitIdx].id, next[unitIdx].title)];
      }
      return next;
    });
  };

  const onUploadVideo = async (unitIdx: number, lessonIdx: number, file: File) => {
    if (!s3Configured) {
      setErr("Configure SKILLRISE_COURSE_BUCKET to enable uploads, or paste a public HTTPS video URL below.");
      return;
    }
    setErr(null);
    try {
      const pres = await fetch("/api/teacher/course/presign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trackSlug,
          fileName: file.name,
          contentType: file.type || "video/mp4",
          kind: "video",
        }),
      });
      const data = await pres.json();
      if (!pres.ok) throw new Error(data.error || data.hint || "Presign failed");
      const put = await fetch(data.uploadUrl, { method: "PUT", body: file, headers: { "Content-Type": file.type || "video/mp4" } });
      if (!put.ok) throw new Error("Upload to storage failed");
      updateLesson(unitIdx, lessonIdx, {
        s3Key: data.key,
        videoSource: "upload",
        youtubeVideoId: undefined,
        videoUrl: undefined,
        transcribeStatus: "none",
      });
    } catch (e) {
      setErr((e as Error).message);
    }
  };

  const requestTranscribe = async (moduleId: string) => {
    setErr(null);
    try {
      const res = await fetch("/api/teacher/course/transcribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trackSlug, moduleId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Request failed");
      const idxU = units?.findIndex((u) => u.lessons.some((l) => l.id === moduleId)) ?? -1;
      if (idxU < 0 || !units) return;
      const idxL = units[idxU].lessons.findIndex((l) => l.id === moduleId);
      if (idxL < 0) return;
      updateLesson(idxU, idxL, { transcribeStatus: "pending" });
    } catch (e) {
      setErr((e as Error).message);
    }
  };

  const addLinkMaterial = (unitIdx: number, lessonIdx: number) => {
    const m: CourseMaterial = {
      id: newId("mat"),
      kind: "link",
      title: "Resource",
      url: "https://",
      createdAt: Date.now(),
    };
    setUnits((prev) => {
      if (!prev) return prev;
      const next = structuredClone(prev) as CourseUnitOutline[];
      const L = next[unitIdx].lessons[lessonIdx];
      L.materials = [...(L.materials || []), m];
      return next;
    });
  };

  if (loadState === "loading" || !units) {
    return <p className="text-sm text-t3 py-8">{loadState === "loading" ? "Loading course…" : err || "No data"}</p>;
  }

  return (
    <div className="space-y-6">
      {err && <p className="text-sm text-red-400">{err}</p>}

      <div className="flex flex-wrap gap-2">
        <button type="button" className="btn btn-primary btn-sm" onClick={() => void save()} disabled={saving}>
          {saving ? "Saving…" : "Save course structure"}
        </button>
        <button type="button" className="btn btn-ghost btn-sm" onClick={addUnit}>
          + Add module
        </button>
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => void load()}>
          Revert
        </button>
      </div>

      <p className="text-sm text-t2">
        Drag modules/lessons with the handle, or use ↑ ↓. Upload requires{" "}
        <code className="text-xs">SKILLRISE_COURSE_BUCKET</code>. You can always add YouTube IDs or public MP4 links.
        Auto-transcribe is stubbed (sets status to pending) until a worker is connected.
      </p>

      <div className="space-y-8">
        {units.map((unit, ui) => (
          <div key={unit.id} className="card p-4 border border-border1">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="text-t3 cursor-grab" title="Drag handle (or use buttons)">⠿</span>
              <input
                className="flex-1 min-w-[200px] bg-s2 border border-border1 rounded-[8px] px-2 py-1 text-sm font-bold"
                value={unit.title}
                onChange={(e) => updateUnitTitle(ui, e.target.value)}
              />
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => addLesson(ui)}>
                + Lesson
              </button>
            </div>

            <ol className="space-y-4">
              {unit.lessons.map((lesson, li) => (
                <li key={lesson.id} className="bg-s2/60 rounded-[10px] p-3 border border-border1" draggable onDragStart={(e) => { e.dataTransfer.setData("text/skillrise", JSON.stringify({ ui, li, type: "lesson" })); e.dataTransfer.effectAllowed = "move"; }}>
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="font-semibold text-t3 text-xs uppercase tracking-wider">Lesson {li + 1}</div>
                    <div className="flex flex-wrap gap-1">
                      <button type="button" className="btn btn-ghost btn-sm text-xs" onClick={() => { if (li > 0) { setUnits((prev) => { if (!prev) return prev; const n = structuredClone(prev) as CourseUnitOutline[]; const t = n[ui].lessons[li]; n[ui].lessons[li] = n[ui].lessons[li - 1]; n[ui].lessons[li - 1] = t; return n; }); } }}>↑</button>
                      <button type="button" className="btn btn-ghost btn-sm text-xs" onClick={() => { if (li < unit.lessons.length - 1) { setUnits((prev) => { if (!prev) return prev; const n = structuredClone(prev) as CourseUnitOutline[]; const t = n[ui].lessons[li]; n[ui].lessons[li] = n[ui].lessons[li + 1]; n[ui].lessons[li + 1] = t; return n; }); } }}>↓</button>
                      <button type="button" className="text-xs text-red-400 underline" onClick={() => removeLesson(ui, li)}>Remove</button>
                    </div>
                  </div>
                  <input
                    className="w-full mt-2 bg-transparent border-b border-border1 py-1 text-sm font-semibold"
                    value={lesson.title}
                    onChange={(e) => updateLesson(ui, li, { title: e.target.value })}
                  />
                  <div className="grid md:grid-cols-2 gap-2 mt-2">
                    <label className="text-xs text-t3 block">Summary</label>
                    <label className="text-xs text-t3 block">Est. minutes</label>
                    <textarea
                      className="bg-ink border border-border1 rounded-[8px] p-2 text-sm min-h-[60px] md:col-span-1"
                      value={lesson.summary}
                      onChange={(e) => updateLesson(ui, li, { summary: e.target.value })}
                    />
                    <input
                      type="number"
                      min={1}
                      max={600}
                      className="bg-ink border border-border1 rounded-[8px] p-2 text-sm h-10"
                      value={lesson.durationMin ?? 15}
                      onChange={(e) => {
                        const n = Math.max(1, Math.min(600, parseInt(e.target.value, 10) || 15));
                        updateLesson(ui, li, { durationMin: n, duration: `${n} min` });
                      }}
                    />
                  </div>
                  <label className="flex items-center gap-2 mt-2 text-sm">
                    <input
                      type="checkbox"
                      checked={Boolean(lesson.isPreview)}
                      onChange={(e) => updateLesson(ui, li, { isPreview: e.target.checked })}
                    />
                    Preview (watch before enroll)
                  </label>

                  <div className="mt-3 space-y-2">
                    <div className="text-xs text-t3 font-bold">Video</div>
                    <div className="flex flex-wrap gap-2">
                      <select
                        className="bg-ink border border-border1 rounded-[8px] px-2 py-1 text-sm"
                        value={lesson.videoSource || "none"}
                        onChange={(e) =>
                          updateLesson(ui, li, { videoSource: e.target.value as Module["videoSource"] })
                        }
                      >
                        <option value="none">None (placeholder card)</option>
                        <option value="youtube">YouTube</option>
                        <option value="upload">Uploaded file (S3)</option>
                      </select>
                    </div>
                    {(lesson.videoSource === "youtube" || (!lesson.videoSource && lesson.youtubeVideoId)) && (
                      <input
                        className="w-full bg-ink border border-border1 rounded-[8px] px-2 py-1 text-sm"
                        placeholder="YouTube video id"
                        value={lesson.youtubeVideoId || ""}
                        onChange={(e) => updateLesson(ui, li, { youtubeVideoId: e.target.value || undefined, videoSource: "youtube" })}
                      />
                    )}
                    {lesson.videoSource === "upload" && (
                      <div className="text-sm">
                        {lesson.s3Key ? (
                          <span className="text-g text-xs break-all">Stored: {lesson.s3Key}</span>
                        ) : null}
                        <input
                          type="file"
                          accept="video/mp4,video/webm,video/quicktime"
                          className="text-xs mt-1"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) void onUploadVideo(ui, li, f);
                            e.target.value = "";
                          }}
                        />
                      </div>
                    )}
                    {lesson.s3Key && (
                      <button type="button" className="text-xs text-g underline" onClick={() => void requestTranscribe(lesson.id)}>
                        Request auto-transcribe (stub) {lesson.transcribeStatus === "pending" ? "…pending" : ""}
                      </button>
                    )}
                    <input
                      className="w-full bg-ink border border-border1 rounded-[8px] px-2 py-1 text-sm"
                      placeholder="Or public / CDN MP4 URL (https://...)"
                      value={lesson.videoUrl || ""}
                      onChange={(e) => updateLesson(ui, li, { videoUrl: e.target.value || undefined })}
                    />
                    <input
                      className="w-full bg-ink border border-border1 rounded-[8px] px-2 py-1 text-sm"
                      placeholder="Thumbnail URL (optional)"
                      value={lesson.thumbnailUrl || ""}
                      onChange={(e) => updateLesson(ui, li, { thumbnailUrl: e.target.value || undefined })}
                    />
                    <textarea
                      className="w-full bg-ink border border-border1 rounded-[8px] p-2 text-sm min-h-[80px] mt-1"
                      placeholder="Transcript (or wait for auto-transcribe in production)"
                      value={lesson.transcript}
                      onChange={(e) => updateLesson(ui, li, { transcript: e.target.value })}
                    />
                  </div>

                  <div className="mt-3">
                    <div className="text-xs text-t3 font-bold mb-1">Supplementary materials (links; file upload can use presign + paste URL in dev)</div>
                    {(lesson.materials || []).map((mat, mi) => (
                      <div key={mat.id} className="flex flex-wrap gap-1 mb-1">
                        <input
                          className="flex-1 min-w-[120px] bg-ink border border-border1 rounded px-1 text-xs"
                          value={mat.title}
                          onChange={(e) => {
                            setUnits((prev) => {
                              if (!prev) return prev;
                              const n = structuredClone(prev) as CourseUnitOutline[];
                              n[ui].lessons[li].materials![mi].title = e.target.value;
                              return n;
                            });
                          }}
                        />
                        <input
                          className="flex-[2] min-w-[180px] bg-ink border border-border1 rounded px-1 text-xs"
                          value={mat.url || ""}
                          onChange={(e) => {
                            setUnits((prev) => {
                              if (!prev) return prev;
                              const n = structuredClone(prev) as CourseUnitOutline[];
                              n[ui].lessons[li].materials![mi].url = e.target.value;
                              return n;
                            });
                          }}
                        />
                        <button type="button" className="text-xs text-red-400" onClick={() => { setUnits((prev) => { if (!prev) return prev; const n = structuredClone(prev) as CourseUnitOutline[]; n[ui].lessons[li].materials = n[ui].lessons[li].materials!.filter((_, i) => i !== mi); return n; }); }}>✕</button>
                      </div>
                    ))}
                    <button type="button" className="text-xs text-g underline mt-1" onClick={() => addLinkMaterial(ui, li)}>+ Add link</button>
                  </div>

                  <div className="mt-2">
                    <div className="text-xs text-t3 mb-1">Rich description HTML (optional)</div>
                    <textarea
                      className="w-full bg-ink border border-border1 rounded-[8px] p-2 text-sm font-mono min-h-[50px]"
                      placeholder="<p>…</p>"
                      value={lesson.descriptionHtml || ""}
                      onChange={(e) => updateLesson(ui, li, { descriptionHtml: e.target.value || undefined })}
                    />
                  </div>
                </li>
              ))}
            </ol>

            <div
              className="mt-3 p-2 border border-dashed border-border1 rounded-[8px] text-xs text-t3 text-center"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const raw = e.dataTransfer.getData("text/skillrise");
                if (!raw) return;
                try {
                  const d = JSON.parse(raw) as { ui: number; li: number; type: string };
                  if (d.type !== "lesson" || d.ui === undefined) return;
                  if (d.ui === ui) return;
                  setUnits((prev) => {
                    if (!prev) return prev;
                    const n = structuredClone(prev) as CourseUnitOutline[];
                    const [moved] = n[d.ui].lessons.splice(d.li, 1);
                    moved!.unitId = n[ui].id;
                    moved!.unitTitle = n[ui].title;
                    n[ui].lessons.push(moved!);
                    return n;
                  });
                } catch { /* */ }
              }}
            >
              Drop lesson here to move to this module
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2 pt-4 border-t border-border1">
        <button type="button" className="btn btn-primary btn-sm" onClick={() => void save()} disabled={saving}>
          {saving ? "Saving…" : "Save course structure"}
        </button>
        <Link href="/teach/courses" className="text-sm text-t2 underline self-center">← All courses</Link>
        <Link href={`/tracks/${trackSlug}`} className="text-sm text-t2 underline self-center">View public track</Link>
      </div>
    </div>
  );
}
