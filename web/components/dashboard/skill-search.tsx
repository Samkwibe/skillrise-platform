"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type SearchVideo = {
  id: string;
  title: string;
  channel: string;
  thumbnail: string;
  url: string;
  embedUrl: string;
  durationText: string;
  publishedAt?: string;
  views?: number;
  source: "youtube" | "curated";
};

type SearchResponse = {
  provider: "youtube" | "curated";
  query: string;
  videos: SearchVideo[];
  note?: string;
};

const SUGGESTIONS = [
  "Electrical basics",
  "Python for beginners",
  "Personal finance",
  "Public speaking",
  "JavaScript fundamentals",
  "UI design",
  "Resume & interviews",
];

function formatViews(n?: number): string | null {
  if (!n || !Number.isFinite(n)) return null;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M views`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K views`;
  return `${n} views`;
}

export function SkillSearch() {
  const [q, setQ] = useState("");
  const [videos, setVideos] = useState<SearchVideo[]>([]);
  const [provider, setProvider] = useState<"youtube" | "curated" | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [playing, setPlaying] = useState<SearchVideo | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const runSearch = useCallback(async (query: string) => {
    const clean = query.trim();
    if (!clean) return;
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(clean)}&max=12`, {
        signal: ac.signal,
        cache: "no-store",
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error || `Search failed (${res.status})`);
      }
      const data: SearchResponse = await res.json();
      setVideos(data.videos);
      setProvider(data.provider);
      setNote(data.note ?? null);
    } catch (err) {
      if ((err as Error).name === "AbortError") return;
      setError((err as Error).message || "Search failed.");
      setVideos([]);
      setProvider(null);
      setNote(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    return () => abortRef.current?.abort();
  }, []);

  // Close modal on Escape
  useEffect(() => {
    if (!playing) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPlaying(null);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [playing]);

  return (
    <section className="mb-8">
      <div className="card p-5 md:p-6 relative overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none opacity-60"
          style={{
            background:
              "radial-gradient(600px 200px at 10% 0%, rgba(var(--g-rgb,16,185,129),0.10), transparent 60%), radial-gradient(400px 180px at 90% 100%, rgba(99,102,241,0.08), transparent 60%)",
          }}
          aria-hidden
        />
        <div className="relative">
          <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.1em] text-t3 mb-2">
            <span>◎ Skill search</span>
            {provider && (
              <span
                className={`pill ${provider === "youtube" ? "pill-red" : "pill-g"}`}
                title={provider === "youtube" ? "Live YouTube results" : "Curated starting points"}
              >
                {provider === "youtube" ? "Live YouTube" : "Curated"}
              </span>
            )}
          </div>
          <h2 className="font-display text-[20px] md:text-[22px] font-bold mb-1">
            What do you want to learn today?
          </h2>
          <p className="text-t3 text-[13px] mb-4">
            Type any skill, job, or topic. We'll pull free videos from across the web so you can
            start learning now.
          </p>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              runSearch(q);
            }}
            className="flex flex-col sm:flex-row gap-2"
          >
            <div className="relative flex-1">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 text-t3 pointer-events-none"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <circle cx="11" cy="11" r="7" />
                <path d="m21 21-4.3-4.3" />
              </svg>
              <input
                type="search"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="e.g. electrical wiring, Python, resume writing"
                className="w-full input pl-10"
                aria-label="Search free videos by skill"
              />
            </div>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading || !q.trim()}
              aria-busy={loading}
            >
              {loading ? "Searching…" : "Find videos"}
            </button>
          </form>

          <div className="flex flex-wrap gap-2 mt-3">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => {
                  setQ(s);
                  runSearch(s);
                }}
                className="pill micro-hover"
                style={{ cursor: "pointer" }}
              >
                {s}
              </button>
            ))}
          </div>

          {note && !error && (
            <div className="mt-3 text-[12px] text-t3">{note}</div>
          )}
          {error && (
            <div className="mt-3 text-[12px] text-red" style={{ color: "var(--red)" }}>
              {error}
            </div>
          )}
        </div>
      </div>

      {videos.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-4">
          {videos.map((v) => (
            <VideoCard key={v.id} video={v} onPlay={() => v.embedUrl && setPlaying(v)} />
          ))}
        </div>
      )}

      {playing && (
        <VideoModal video={playing} onClose={() => setPlaying(null)} />
      )}
    </section>
  );
}

function VideoCard({ video, onPlay }: { video: SearchVideo; onPlay: () => void }) {
  const [imgFailed, setImgFailed] = useState(false);
  const views = formatViews(video.views);
  const canEmbed = Boolean(video.embedUrl);

  return (
    <article className="card card-hover overflow-hidden flex flex-col">
      <button
        type="button"
        onClick={canEmbed ? onPlay : undefined}
        className="relative aspect-video w-full block group"
        style={{
          background: "var(--surface-2)",
          cursor: canEmbed ? "pointer" : "default",
        }}
        aria-label={`Play ${video.title}`}
      >
        {!imgFailed ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={video.thumbnail}
            alt=""
            loading="lazy"
            className="w-full h-full object-cover"
            onError={() => setImgFailed(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-t3 text-[13px]">
            {video.channel}
          </div>
        )}
        {canEmbed && (
          <span
            className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
            style={{ background: "rgba(0,0,0,0.35)" }}
          >
            <span
              className="w-12 h-12 rounded-full flex items-center justify-center"
              style={{ background: "rgba(255,255,255,0.95)", color: "#0b0b0b" }}
              aria-hidden
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z" />
              </svg>
            </span>
          </span>
        )}
        <span
          className="absolute bottom-2 right-2 text-[11px] px-1.5 py-0.5 rounded"
          style={{ background: "rgba(0,0,0,0.75)", color: "#fff" }}
        >
          {video.durationText}
        </span>
      </button>
      <div className="p-3 flex-1 flex flex-col gap-1">
        <div className="font-semibold text-[14px] leading-tight line-clamp-2">{video.title}</div>
        <div className="text-[12px] text-t3 truncate">{video.channel}</div>
        {views && <div className="text-[11px] text-t3">{views}</div>}
        <div className="mt-auto pt-2 flex gap-2">
          {canEmbed && (
            <button type="button" onClick={onPlay} className="btn btn-ghost btn-sm">
              Watch here
            </button>
          )}
          <a
            href={video.url}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-ghost btn-sm"
          >
            Open ↗
          </a>
        </div>
      </div>
    </article>
  );
}

function VideoModal({ video, onClose }: { video: SearchVideo; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fade-in"
      style={{ background: "rgba(0,0,0,0.72)" }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={video.title}
    >
      <div
        className="card overflow-hidden w-full max-w-4xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="flex items-center justify-between p-3 gap-3 border-b"
          style={{ borderColor: "var(--border-1)" }}
        >
          <div className="min-w-0">
            <div className="font-semibold text-[14px] truncate">{video.title}</div>
            <div className="text-[12px] text-t3 truncate">{video.channel}</div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="btn btn-ghost btn-sm"
            aria-label="Close video"
          >
            Close ✕
          </button>
        </div>
        <div className="relative w-full" style={{ aspectRatio: "16 / 9" }}>
          <iframe
            src={`${video.embedUrl}${video.embedUrl.includes("?") ? "&" : "?"}autoplay=1`}
            title={video.title}
            className="absolute inset-0 w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
          />
        </div>
        <div className="p-3 flex items-center justify-between gap-2">
          <a
            href={video.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[12px] text-t2 underline"
          >
            Open on YouTube ↗
          </a>
          <span className="pill">{video.durationText}</span>
        </div>
      </div>
    </div>
  );
}
