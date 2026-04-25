"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
import type { FeedPost, User } from "@/lib/store";
import { classifyVideoUrl } from "@/lib/feed/video-embed";

type Card = { post: FeedPost; author: User; label: string; emoji: string };

/**
 * Full-viewport, vertical scroll (TikTok / LinkedIn Reels style) for **education-only** feed posts.
 * Plays YouTube, Vimeo, or direct video URLs when `post.videoUrl` is set; otherwise shows the emoji hero.
 */
export function EducationReels({ items }: { items: Card[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  if (items.length === 0) {
    return (
      <p className="text-center text-slate-300 py-20 px-4">
        No learning posts yet.{" "}
        <Link href="/feed" className="font-semibold text-sky-400 underline">
          Post on SkillFeed
        </Link>{" "}
        — text or a YouTube / video link — then check back here.
      </p>
    );
  }

  return (
    <div
      ref={ref}
      className="h-[calc(100vh-4rem)] overflow-y-auto snap-y snap-mandatory"
      onScroll={() => {
        const el = ref.current;
        if (!el) return;
        const h = el.clientHeight;
        setActiveIndex(Math.round(el.scrollTop / h));
      }}
    >
      {items.map(({ post, author, label, emoji }, i) => {
        const v = classifyVideoUrl(post.videoUrl);
        return (
          <article
            key={post.id}
            className="h-[calc(100vh-4rem)] snap-start flex flex-col bg-slate-950 text-white relative"
          >
            <div className="absolute inset-0 z-0 bg-black">
              {v.type === "youtube" || v.type === "vimeo" ? (
                <iframe
                  title={post.title}
                  src={v.embedUrl!}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
                  allowFullScreen
                />
              ) : v.type === "direct" && v.srcUrl ? (
                <video
                  className="w-full h-full object-contain"
                  controls
                  playsInline
                  src={v.srcUrl}
                  preload="metadata"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[min(32vw,180px)] opacity-25 select-none bg-gradient-to-b from-slate-900 to-slate-950">
                  {post.emoji}
                </div>
              )}
            </div>
            <div className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-b from-slate-950/30 via-transparent to-slate-950" />
            <div className="relative z-10 flex-1 flex flex-col justify-end p-6 max-w-lg mx-auto w-full pointer-events-auto">
              <div className="flex items-center gap-3 mb-3">
                <Avatar spec={author.avatar} size={48} />
                <div>
                  <div className="font-bold">{author.name}</div>
                  <div className="text-xs text-white/70">
                    {label} · {post.duration}
                  </div>
                </div>
              </div>
              <h2 className="text-2xl font-extrabold leading-tight mb-2 drop-shadow-md">{post.title}</h2>
              <p className="text-white/95 text-sm mb-3 line-clamp-5 drop-shadow-md">{post.description}</p>
              {post.takeaway && (
                <div className="rounded-lg bg-emerald-500/25 border border-emerald-400/40 px-3 py-2 text-sm mb-3 backdrop-blur-sm">
                  <span className="font-bold text-emerald-200">Takeaway · </span>
                  {post.takeaway}
                </div>
              )}
              <div className="flex flex-wrap gap-2 text-xs">
                <span className="px-2 py-1 rounded-full bg-white/15">{emoji}</span>
                <Link
                  href={post.trackSlug ? `/tracks/${post.trackSlug}` : "/tracks"}
                  className="btn btn-sm bg-white text-slate-900"
                >
                  Open course
                </Link>
                <Link
                  href="/feed"
                  className="btn btn-ghost btn-sm text-white border border-white/40 bg-black/20"
                >
                  Open feed
                </Link>
              </div>
            </div>
            {i < items.length - 1 && i === activeIndex && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-xs text-white/50 z-20">Scroll</div>
            )}
          </article>
        );
      })}
    </div>
  );
}
