"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import dynamic from "next/dynamic";

const ReactPlayer = dynamic(() => import("react-player/lazy"), { ssr: false });

export type ModuleMaterialLink = { id: string; title: string; href: string; kind: string };

export function ModulePlayer({
  trackSlug,
  moduleId,
  title,
  done,
  nextHref,
  nextLabel,
  canMarkComplete,
  playUrl,
  youtubeVideoId,
  videoSource = "none",
  thumbnailUrl,
  materials = [],
}: {
  trackSlug: string;
  moduleId: string;
  title: string;
  done: boolean;
  nextHref: string;
  nextLabel: string;
  canMarkComplete: boolean;
  playUrl: string | null;
  youtubeVideoId?: string | null;
  videoSource?: "none" | "youtube" | "upload" | "placeholder";
  thumbnailUrl?: string | null;
  materials?: ModuleMaterialLink[];
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [marked, setMarked] = useState(done);
  const [cert, setCert] = useState<string | null>(null);

  let useYoutube = false;
  let useFile = false;
  if (videoSource === "upload" && playUrl) useFile = true;
  else if (videoSource === "youtube" && youtubeVideoId) useYoutube = true;
  else if (playUrl) useFile = true;
  else if (youtubeVideoId) useYoutube = true;

  return (
    <div className="rounded-3xl bg-white/[0.02] border border-white/10 backdrop-blur-xl relative overflow-hidden shadow-2xl">
      <div className="relative aspect-video bg-gradient-to-br from-[#0d2a1c] to-[#041209] overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-emerald-500/10 via-transparent to-transparent pointer-events-none"></div>
        {useYoutube && youtubeVideoId ? (
          <ReactPlayer
            url={`https://www.youtube.com/watch?v=${youtubeVideoId}`}
            width="100%"
            height="100%"
            style={{ position: "absolute", top: 0, left: 0 }}
            controls
            playing={false}
          />
        ) : useFile && playUrl ? (
          <video
            className="absolute inset-0 w-full h-full object-contain bg-black"
            src={playUrl}
            controls
            playsInline
            poster={thumbnailUrl || undefined}
            preload="metadata"
          />
        ) : (
          <>
            {thumbnailUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={thumbnailUrl} alt="" className="absolute inset-0 w-full h-full object-cover opacity-40" />
            ) : (
              <div
                className="absolute inset-0 opacity-20"
                style={{ background: "radial-gradient(circle at center, rgba(31,200,126,0.35), transparent 60%)" }}
              />
            )}
            <div className="absolute inset-0 flex items-center justify-center text-center px-6">
              <div>
                <div className="text-[48px] mb-2">▶</div>
                <div className="font-display text-[18px] font-bold">{title}</div>
                <div className="text-[12px] text-t3 mt-1 max-w-md mx-auto">
                  Set a YouTube ID, upload a video to S3 (when the bucket is configured), or add a public video URL in
                  the course builder.
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {materials.length > 0 && (
        <div className="px-6 pt-5 pb-4 border-t border-white/10 bg-black/20">
          <div className="text-[11px] font-bold uppercase tracking-wider text-white/50 mb-3">Materials</div>
          <ul className="flex flex-wrap gap-2">
            {materials.map((m) => (
              <li key={m.id}>
                <a
                  href={m.href}
                  target={m.href.startsWith("http") ? "_blank" : undefined}
                  rel={m.href.startsWith("http") ? "noreferrer" : undefined}
                  className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 transition-all text-white/80 hover:text-white text-[13px] flex items-center gap-1.5 font-medium"
                >
                  <span className="text-emerald-400">{m.kind === "link" || m.kind === "youtube" ? "↗" : "⬇"}</span>
                  {m.title}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="p-6 flex flex-col sm:flex-row items-center gap-4 justify-between bg-black/40 backdrop-blur-md border-t border-white/5">
        <div className="text-[13px] text-white/60">
          {!canMarkComplete
            ? "Preview — enroll in the full course to track progress and mark complete."
            : marked
              ? "Module complete."
              : "When you have finished the lesson, mark it done."}
        </div>
        <div className="flex gap-2">
          {canMarkComplete && (
            <button
              type="button"
              disabled={busy || marked}
              onClick={async () => {
                setBusy(true);
                const res = await fetch("/api/progress", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ trackSlug, moduleId }),
                });
                const body = await res.json();
                setBusy(false);
                if (res.ok) {
                  setMarked(true);
                  if (body.certificate) setCert(body.certificate.id);
                  router.refresh();
                }
              }}
              className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all shadow-lg flex items-center gap-2 ${
                marked 
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" 
                  : "bg-white/5 text-white/80 hover:text-white hover:bg-white/10 border border-white/10"
              }`}
            >
              {marked ? "✓ Done" : busy ? "Saving…" : "Mark complete"}
            </button>
          )}
          {canMarkComplete && (
            <Link href={cert ? `/cert/${cert}` : nextHref} className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-bold text-sm transition-colors shadow-[0_0_20px_rgba(16,185,129,0.2)]">
              {cert ? "See certificate →" : `${nextLabel} →`}
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
