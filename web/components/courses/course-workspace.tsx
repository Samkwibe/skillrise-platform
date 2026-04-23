"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CourseProviderId } from "@/lib/courses/types";
import type { LearningHubCourseState, LearningHubNote } from "@/lib/store";
import { extractYoutubeVideoId } from "@/lib/courses/youtube-util";
import { resolveCoursePlayTarget } from "@/lib/media/course-play-url";
import { createYTPlayer, type YTPlayerInstance } from "@/lib/youtube/iframe-api";
import { ProviderMark, providerLabel } from "@/components/courses/provider-logo";

const ReactPlayer = dynamic(() => import("react-player/lazy"), { ssr: false });

type Props = {
  courseKey: string;
  url: string;
  provider: CourseProviderId;
  title: string;
  imageUrl?: string;
  initVideoId?: string;
  /** From URL: resume at this time (sec). Merged with saved hub state on load. */
  resumeAtSec?: number;
};

function fmtT(sec: number): string {
  const s = Math.floor(sec % 60);
  const m = Math.floor((sec / 60) % 60);
  const h = Math.floor(sec / 3600);
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function CourseWorkspace({ courseKey, url, provider, title, imageUrl, initVideoId, resumeAtSec = 0 }: Props) {
  const [hub, setHub] = useState<LearningHubCourseState | null>(null);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const playedRef = useRef(0);
  const durationRef = useRef(0);
  const hubRef = useRef<LearningHubCourseState | null>(null);
  const playerRef = useRef<{
    seekTo?: (a: number, t: "seconds" | "fraction" | "seconds") => void;
    getInternalPlayer?: () => { setPlaybackRate?: (n: number) => void };
  } | null>(null);
  const youtubeIframeRef = useRef<HTMLIFrameElement | null>(null);
  const youtubePlayerRef = useRef<YTPlayerInstance | null>(null);
  const [ytHostEl, setYtHostEl] = useState<HTMLDivElement | null>(null);
  const [useYtApi, setUseYtApi] = useState(true);
  const ytDidSeek = useRef(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [nowSec, setNowSec] = useState(0);
  const [related, setRelated] = useState<
    { id: string; title: string; url: string; provider: string; imageUrl?: string }[]
  >([]);

  const videoId = useMemo(
    () => (initVideoId?.trim() ? initVideoId.trim() : null) || extractYoutubeVideoId(url) || null,
    [url, initVideoId],
  );

  useEffect(() => {
    setUseYtApi(true);
  }, [videoId]);

  const play = useMemo(() => resolveCoursePlayTarget(url, initVideoId), [url, initVideoId]);

  /** Native iframe is reliable; react-player/lazy often shows an empty black area for YouTube. */
  const useYoutubeIframe = play.kind === "player" && Boolean(videoId);
  const useFileOrVimeoPlayer = play.kind === "player" && !videoId;

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

  useEffect(() => {
    hubRef.current = hub;
  }, [hub]);

  /** YouTube IFrame API — accurate time + 10s progress sync. Falls back to basic iframe if the SDK errors. */
  useEffect(() => {
    if (!useYoutubeIframe || !videoId || !useYtApi || !ytHostEl) return;
    const el = ytHostEl;
    let dead = false;
    ytDidSeek.current = false;
    void (async () => {
      try {
        await createYTPlayer(
          el,
          videoId,
          (p) => {
            if (dead) return;
            youtubePlayerRef.current = p;
            try {
              const d = p.getDuration();
              if (d > 0) durationRef.current = d;
            } catch {
              // ignore
            }
            if (!ytDidSeek.current) {
              const start = Math.max(resumeAtSec, hubRef.current?.lastPositionSec ?? 0);
              if (start > 0) p.seekTo(start, true);
              ytDidSeek.current = true;
            }
            try {
              setNowSec(p.getCurrentTime());
            } catch {
              // ignore
            }
          },
          () => {
            setUseYtApi(false);
          },
        );
      } catch {
        setUseYtApi(false);
      }
    })();
    return () => {
      dead = true;
      try {
        youtubePlayerRef.current?.destroy();
      } catch {
        // ignore
      }
      youtubePlayerRef.current = null;
    };
  }, [useYoutubeIframe, videoId, useYtApi, resumeAtSec, ytHostEl]);

  /** Tick "current time" for notes UI + background position. */
  useEffect(() => {
    if (!useYoutubeIframe && !useFileOrVimeoPlayer) return;
    const iv = window.setInterval(() => {
      try {
        if (youtubePlayerRef.current) {
          const t = youtubePlayerRef.current.getCurrentTime();
          setNowSec(t);
          playedRef.current = t;
        }
      } catch {
        // ignore
      }
    }, 1_000);
    return () => window.clearInterval(iv);
  }, [useYoutubeIframe, useFileOrVimeoPlayer, videoId, useYtApi]);

  /** Auto-persist every 10s for embeddable players (YouTube IFrame, Vimeo, file). YouTube iframe fallback has no time API. */
  useEffect(() => {
    if (!useYoutubeIframe && !useFileOrVimeoPlayer) return;
    if (useYoutubeIframe && !useYtApi) return;
    const tick = () => {
      const base = hubRef.current;
      if (!base) return;
      let pos = 0;
      let dur = durationRef.current;
      try {
        if (youtubePlayerRef.current) {
          pos = youtubePlayerRef.current.getCurrentTime();
          const d2 = youtubePlayerRef.current.getDuration();
          if (d2 > 0) {
            durationRef.current = d2;
            dur = d2;
          }
        } else {
          pos = playedRef.current;
        }
      } catch {
        return;
      }
      const posFloor = Math.max(0, Math.floor(pos));
      const nextPct = dur > 0 ? Math.min(100, Math.round((100 * pos) / dur)) : base.progressPct;
      void (async () => {
        setHub((h) =>
          h
            ? {
                ...h,
                lastPositionSec: posFloor,
                videoDurationSec: dur > 0 ? dur : h.videoDurationSec,
                progressPct: dur > 0 ? nextPct : h.progressPct,
                updatedAt: Date.now(),
              }
            : h,
        );
        const merged = {
          ...base,
          lastPositionSec: posFloor,
          videoDurationSec: dur > 0 ? dur : base.videoDurationSec,
          progressPct: dur > 0 ? nextPct : base.progressPct,
          updatedAt: Date.now(),
        };
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
            lastPositionSec: merged.lastPositionSec,
            videoDurationSec: merged.videoDurationSec,
            progressPct: merged.progressPct,
            completed: merged.completed,
            notes: merged.notes,
          }),
        });
        if (res.ok) {
          const data = (await res.json()) as { state: LearningHubCourseState };
          if (data.state) {
            setHub(data.state);
            hubRef.current = data.state;
          }
        }
      })();
    };
    const id = window.setInterval(tick, 10_000);
    return () => window.clearInterval(id);
  }, [courseKey, useYoutubeIframe, useFileOrVimeoPlayer, useYtApi, provider, title, url, imageUrl, videoId]);

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
            lastPositionSec: merged.lastPositionSec,
            videoDurationSec: merged.videoDurationSec,
            progressPct: merged.progressPct,
            completed: merged.completed,
            notes: merged.notes,
          }),
        });
        if (res.ok) {
          const data = (await res.json()) as { state: LearningHubCourseState };
          if (data.state) {
            setHub(data.state);
            hubRef.current = data.state;
          }
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

  const seekTo = useCallback(
    (sec: number) => {
      if (useYoutubeIframe && videoId) {
        const start = Math.max(0, Math.floor(sec));
        if (youtubePlayerRef.current) {
          try {
            youtubePlayerRef.current.seekTo(start, true);
            setNowSec(start);
            playedRef.current = start;
            return;
          } catch {
            // fall through
          }
        }
        const q = new URLSearchParams({
          rel: "0",
          modestbranding: "1",
          playsinline: "1",
          start: String(start),
          autoplay: "1",
        });
        const el = youtubeIframeRef.current;
        if (el) {
          el.src = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(videoId)}?${q.toString()}`;
        }
        return;
      }
      playerRef.current?.seekTo?.(sec, "seconds");
    },
    [useYoutubeIframe, videoId],
  );

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

        {/* Main player — use absolute fill so react-player always gets a real box (percent heights + aspect-ratio). */}
        <div
          className="relative w-full aspect-video max-h-[80vh] rounded-[12px] overflow-hidden bg-black border border-border1"
        >
          {useYoutubeIframe && videoId && useYtApi ? (
            <div ref={setYtHostEl} className="absolute top-0 left-0 h-full w-full" />
          ) : useYoutubeIframe && videoId && !useYtApi ? (
            <iframe
              ref={youtubeIframeRef}
              className="absolute top-0 left-0 h-full w-full border-0"
              title={title}
              src={`https://www.youtube-nocookie.com/embed/${encodeURIComponent(videoId)}?rel=0&modestbranding=1&playsinline=1`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
              allowFullScreen
              referrerPolicy="strict-origin-when-cross-origin"
            />
          ) : useFileOrVimeoPlayer ? (
            <ReactPlayer
              ref={playerRef as never}
              className="absolute top-0 left-0 w-full h-full"
              style={{ position: "absolute", top: 0, left: 0 }}
              url={play.playUrl}
              width="100%"
              height="100%"
              controls
              playing={false}
              playbackRate={playbackRate}
              onProgress={(e) => {
                playedRef.current = e.playedSeconds;
                setNowSec(e.playedSeconds);
              }}
              onDuration={(d) => {
                if (d > 0) durationRef.current = d;
              }}
              onReady={() => {
                setRate(playbackRate);
              }}
              config={{
                vimeo: { playerOptions: { responsive: true } },
              }}
            />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-4 text-center text-white/90 text-[14px]">
              <p>
                This course link opens on the provider site (Coursera, Open Library, etc. don’t expose an embeddable
                video URL from search).
              </p>
              <a
                href={url}
                target="_blank"
                rel="noreferrer"
                className="btn btn-primary"
                style={{ background: "var(--g)", color: "var(--bg)" }}
              >
                Watch on {providerLabel(provider)} ↗
              </a>
            </div>
          )}
        </div>

        {play.kind === "player" && useFileOrVimeoPlayer && (
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
              {play.kind === "player" && videoId
                ? "We’ll import chapter lists automatically when a provider gives them. For YouTube, use notes with timestamps to build your own outline."
                : "Follow along on the provider site. Use notes on the right to track what matters."}
            </p>
            {play.kind === "player" && videoId && (
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
            <p className="text-[0.7rem] text-t3 mb-1">
              {useYoutubeIframe && !useYtApi
                ? "Basic embed: use +10% or mark complete. For automatic time, allow the IFrame player."
                : "Watched time and percent save to your account about every 10s."}
            </p>
            <div className="progress-bar w-full sm:w-[200px]">
              <span style={{ width: `${hub?.progressPct ?? 0}%` }} />
            </div>
            {hub?.lastPositionSec != null && hub.lastPositionSec > 0 && (
              <p className="text-xs text-t2 mt-1">Resuming near {fmtT(hub.lastPositionSec)}</p>
            )}
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
            {related.map((r) => {
              const vid = extractYoutubeVideoId(r.url);
              const qs = new URLSearchParams({
                k: r.id,
                url: r.url,
                provider: r.provider,
                title: r.title,
              });
              if (vid) qs.set("v", vid);
              return (
                <Link
                  key={r.id}
                  href={`/courses/learn?${qs.toString()}`}
                  className="card p-3 card-hover text-[12.5px] font-medium line-clamp-2"
                >
                  {r.title}
                </Link>
              );
            })}
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
                {play.kind === "player" && videoId && (
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
