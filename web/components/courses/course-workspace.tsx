"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CourseProviderId } from "@/lib/courses/types";
import type { LearningHubCourseState, LearningHubNote } from "@/lib/store";
import { extractYoutubeVideoId } from "@/lib/courses/youtube-util";
import { ProviderMark, providerLabel } from "@/components/courses/provider-logo";

const ReactPlayer = dynamic(() => import("react-player/lazy"), { ssr: false });

type Props = {
  courseKey: string;
  url: string;
  provider: CourseProviderId;
  title: string;
  imageUrl?: string;
  initVideoId?: string;
};

function fmtT(sec: number): string {
  const s = Math.floor(sec % 60);
  const m = Math.floor((sec / 60) % 60);
  const h = Math.floor(sec / 3600);
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function CourseWorkspace({ courseKey, url, provider, title, imageUrl, initVideoId }: Props) {
  const [hub, setHub] = useState<LearningHubCourseState | null>(null);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const playedRef = useRef(0);
  const playerRef = useRef<{
    seekTo?: (a: number, t: "seconds" | "fraction" | "seconds") => void;
    getInternalPlayer?: () => { setPlaybackRate?: (n: number) => void };
  } | null>(null);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [nowSec, setNowSec] = useState(0);
  const [related, setRelated] = useState<
    { id: string; title: string; url: string; provider: string; imageUrl?: string }[]
  >([]);

  const videoId = useMemo(() => {
    if (initVideoId) return initVideoId;
    if (provider === "youtube") return extractYoutubeVideoId(url);
    return extractYoutubeVideoId(url);
  }, [url, provider, initVideoId]);

  const playUrl = videoId
    ? `https://www.youtube.com/watch?v=${videoId}`
    : url;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/me/learning-hub?key=${encodeURIComponent(courseKey)}`, { cache: "no-store" });
      const data = (await res.json()) as { state: LearningHubCourseState | null };
      if (res.ok && data.state) setHub(data.state);
      else
        setHub({
          provider,
          title,
          url,
          imageUrl,
          primaryVideoId: videoId || undefined,
          progressPct: 0,
          completed: false,
          notes: [],
          updatedAt: Date.now(),
        });
    } finally {
      setLoading(false);
    }
  }, [courseKey, provider, title, url, imageUrl, videoId]);

  useEffect(() => {
    void load();
  }, [load]);

  const persist = useCallback(
    async (next: Partial<LearningHubCourseState> & { notes?: LearningHubNote[] }) => {
      setSaving(true);
      try {
        const base = hub ?? {
          provider,
          title,
          url,
          imageUrl,
          primaryVideoId: videoId || undefined,
          progressPct: 0,
          completed: false,
          notes: [],
          updatedAt: Date.now(),
        };
        const merged: LearningHubCourseState = {
          ...base,
          ...next,
          notes: next.notes ?? base.notes,
          updatedAt: Date.now(),
        };
        setHub(merged);
        const res = await fetch("/api/me/learning-hub", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            key: courseKey,
            provider: merged.provider,
            title: merged.title,
            url: merged.url,
            imageUrl: merged.imageUrl,
            primaryVideoId: merged.primaryVideoId,
            progressPct: merged.progressPct,
            completed: merged.completed,
            notes: merged.notes,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.state) setHub(data.state);
        }
      } finally {
        setSaving(false);
      }
    },
    [hub, courseKey, provider, title, url, imageUrl, videoId],
  );

  // Debounce notes
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scheduleSaveNotes = useCallback(
    (notes: LearningHubNote[]) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        void persist({ notes });
      }, 700);
    },
    [persist],
  );

  const addNoteAtTime = useCallback(() => {
    const t = nowSec;
    const n: LearningHubNote = {
      id: crypto.randomUUID(),
      text: draft.trim() || "Note",
      tSec: t,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setDraft("");
    const notes = [...(hub?.notes ?? []), n];
    setHub((h) => (h ? { ...h, notes } : h));
    void persist({ notes });
  }, [draft, hub?.notes, persist, nowSec]);

  const updateNote = useCallback(
    (id: string, text: string) => {
      const notes = (hub?.notes ?? []).map((n) =>
        n.id === id ? { ...n, text, updatedAt: Date.now() } : n,
      );
      setHub((h) => (h ? { ...h, notes } : h));
      scheduleSaveNotes(notes);
    },
    [hub?.notes, scheduleSaveNotes],
  );

  const seekTo = useCallback((sec: number) => {
    playerRef.current?.seekTo?.(sec, "seconds");
  }, []);

  const setRate = useCallback((r: number) => {
    setPlaybackRate(r);
    const root = playerRef.current as { getInternalPlayer?: () => { setPlaybackRate?: (n: number) => void } } | null;
    const y = root?.getInternalPlayer?.();
    y?.setPlaybackRate?.(r);
  }, []);

  useEffect(() => {
    if (!title) return;
    const q = title.split(/\s+/).slice(0, 4).join(" ");
    void (async () => {
      const res = await fetch(`/api/courses/search?q=${encodeURIComponent(q)}&limit=4`, { cache: "no-store" });
      const data = await res.json();
      if (res.ok && data.courses) {
        setRelated(
          data.courses
            .filter((c: { id: string }) => c.id !== courseKey)
            .slice(0, 4)
            .map((c: { id: string; title: string; url: string; provider: string; imageUrl?: string }) => ({
              id: c.id,
              title: c.title,
              url: c.url,
              provider: c.provider,
              imageUrl: c.imageUrl,
            })),
        );
      }
    })();
  }, [title, courseKey]);

  if (loading && !hub) {
    return <div className="p-6 text-t3">Loading your workspace…</div>;
  }

  return (
    <div className="grid xl:grid-cols-[1fr_380px] gap-6 items-start">
      <div className="space-y-5 min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <ProviderMark id={provider} />
          <span className="text-[12px] text-t3">{providerLabel(provider)}</span>
          {hub?.progressPct != null && (
            <span className="text-[12px] text-t3">· {hub.progressPct}% progress</span>
          )}
        </div>
        <h1 className="text-[24px] md:text-[32px] font-extrabold leading-tight" style={{ fontFamily: "var(--role-font-display)" }}>
          {title}
        </h1>

        {/* Main player */}
        <div
          className="relative w-full rounded-[12px] overflow-hidden bg-black border border-border1"
          style={{ aspectRatio: "16/9" }}
        >
          {videoId ? (
            <ReactPlayer
              ref={playerRef as never}
              url={playUrl}
              width="100%"
              height="100%"
              controls
              playing={false}
              playbackRate={playbackRate}
              onProgress={(e) => {
                playedRef.current = e.playedSeconds;
                setNowSec(e.playedSeconds);
              }}
              onReady={() => {
                setRate(playbackRate);
              }}
              config={{
                youtube: {
                  playerVars: { rel: 0, modestbranding: 1, playsinline: 1 },
                },
              }}
            />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-4 text-center text-white/90 text-[14px]">
              <p>This source opens on the provider site (many don’t allow embedding in an iframe).</p>
              <a
                href={url}
                target="_blank"
                rel="noreferrer"
                className="btn btn-primary"
                style={{ background: "var(--g)", color: "var(--bg)" }}
              >
                Open on {providerLabel(provider)} ↗
              </a>
            </div>
          )}
        </div>

        {videoId && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] text-t3 uppercase">Speed</span>
            {[0.5, 0.75, 1, 1.25, 1.5, 2].map((r) => (
              <button
                key={r}
                type="button"
                className={`pill text-[11px] ${playbackRate === r ? "pill-g" : ""}`}
                onClick={() => setRate(r)}
              >
                {r}x
              </button>
            ))}
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-4">
          <section className="card p-4">
            <h2 className="text-[15px] font-bold mb-2" style={{ fontFamily: "var(--role-font-display)" }}>
              Course outline
            </h2>
            <p className="text-[12.5px] text-t2">
              {videoId
                ? "We’ll import chapter lists automatically when a provider gives them. For YouTube, use notes with timestamps to build your own outline."
                : "Follow along on the provider site. Use notes on the right to track what matters."}
            </p>
            {videoId && (
              <ul className="mt-2 text-[12.5px] text-t2 space-y-1">
                <li>• Primary video (this page)</li>
                <li>• Use “Jump to” in notes for your own milestones</li>
              </ul>
            )}
          </section>
          <section className="card p-4">
            <h2 className="text-[15px] font-bold mb-2" style={{ fontFamily: "var(--role-font-display)" }}>
              Transcript
            </h2>
            <p className="text-[12.5px] text-t2">
              Auto-transcripts need caption tracks from the provider. On YouTube, open the video and turn on captions, or copy key lines
              into your notes.
            </p>
          </section>
        </div>

        <div className="card p-4 flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
          <div>
            <div className="text-[12px] font-bold mb-1" style={{ fontFamily: "var(--role-font-display)" }}>
              Progress
            </div>
            <div className="progress-bar w-full sm:w-[200px]">
              <span style={{ width: `${hub?.progressPct ?? 0}%` }} />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => {
                const p = Math.min(100, (hub?.progressPct ?? 0) + 10);
                void persist({ progressPct: p });
              }}
            >
              +10%
            </button>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => void persist({ progressPct: 100, completed: true })}
            >
              Mark complete
            </button>
            <Link
              href={`/assistant?q=${encodeURIComponent(`Help me understand: ${title}`)}`}
              className="btn btn-ghost btn-sm"
            >
              AI Tutor
            </Link>
          </div>
        </div>

        <section>
          <h2 className="text-[16px] font-bold mb-2" style={{ fontFamily: "var(--role-font-display)" }}>
            Related picks
          </h2>
          <div className="grid sm:grid-cols-2 gap-2">
            {related.length === 0 && <p className="text-[12.5px] text-t3">Run a course search to see more.</p>}
            {related.map((r) => (
              <Link
                key={r.id}
                href={`/courses/learn?k=${r.id}&url=${encodeURIComponent(r.url)}&provider=${r.provider}&title=${encodeURIComponent(r.title)}`}
                className="card p-3 card-hover text-[12.5px] font-medium line-clamp-2"
              >
                {r.title}
              </Link>
            ))}
          </div>
        </section>
      </div>

      <aside className="card p-4 xl:sticky xl:top-20 space-y-3 max-h-[calc(100vh-100px)] overflow-y-auto">
        <div className="text-[12px] font-bold uppercase text-t3">My notes {saving ? "· saving…" : "· auto-save"}</div>
        <textarea
          className="input w-full min-h-[88px] text-[13px]"
          placeholder="Type a note, then add it with the current time…"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
        />
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn btn-primary btn-sm" onClick={addNoteAtTime}>
            Add note @ {fmtT(nowSec)}
          </button>
        </div>
        <ul className="space-y-3">
          {(hub?.notes ?? [])
            .slice()
            .sort((a, b) => a.tSec - b.tSec)
            .map((n) => (
              <li key={n.id} className="border-b border-border1 pb-3 last:border-0">
                {videoId && (
                  <button
                    type="button"
                    className="text-[11px] text-g font-mono mb-1 underline"
                    onClick={() => seekTo(n.tSec)}
                  >
                    Jump to {fmtT(n.tSec)}
                  </button>
                )}
                <textarea
                  className="w-full bg-transparent border-0 p-0 text-[13px] text-t1 resize-none"
                  value={n.text}
                  onChange={(e) => updateNote(n.id, e.target.value)}
                  rows={Math.min(6, 2 + Math.ceil(n.text.length / 50))}
                />
              </li>
            ))}
        </ul>
      </aside>
    </div>
  );
}
