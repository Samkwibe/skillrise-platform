"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { stableCourseId } from "@/lib/courses/ids";
import type { CourseProviderId } from "@/lib/courses/types";
import { extractYoutubeVideoId } from "@/lib/courses/youtube-util";

type Saved = {
  id: string;
  title: string;
  url: string;
  provider: string;
  imageUrl?: string;
  progressPct: number;
  lastPositionSec?: number;
};

const P: Record<string, string> = {
  coursera: "Coursera",
  openlibrary: "Open Library",
  mit: "MIT",
  khan: "Khan",
  youtube: "YouTube",
  simplilearn: "Simplilearn",
  udemy: "Udemy",
};

function enc(u: string, p: string, t: string, atSec?: number) {
  const provider = (p as CourseProviderId) || "coursera";
  const k = stableCourseId(provider, u);
  const q = new URLSearchParams({ k, url: u, provider: p, title: t });
  if (provider === "youtube") {
    const v = extractYoutubeVideoId(u);
    if (v) q.set("v", v);
  }
  if (atSec != null && atSec > 0) q.set("t", String(Math.floor(atSec)));
  return `/courses/learn?${q.toString()}`;
}

function fmtResume(sec: number): string {
  const s = Math.floor(sec % 60);
  const m = Math.floor((sec / 60) % 60);
  const h = Math.floor(sec / 3600);
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function LearnerCoursesDock() {
  const [saved, setSaved] = useState<Saved[] | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/me/saved-courses", { cache: "no-store" });
        const data = await res.json();
        if (res.ok) setSaved(data.courses || []);
      } catch {
        setSaved([]);
      }
    })();
  }, []);

  if (!saved) return <div className="cover-card p-4 text-base text-t3 leading-relaxed">Loading your saved courses…</div>;
  if (saved.length === 0) {
    return (
      <div className="cover-card p-4 sm:p-5">
        <div className="text-sm font-bold uppercase text-t3 mb-1.5">Saved courses</div>
        <p className="text-base text-t2 leading-relaxed">Nothing saved yet. Search free courses and tap “Watch later”.</p>
        <Link href="/courses/search" className="btn btn-ghost btn-sm mt-2">
          Browse free courses
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {saved.map((c) => (
        <Link
          key={c.id}
          href={enc(c.url, c.provider, c.title, c.lastPositionSec)}
          className="block cover-card p-3 card-hover"
        >
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-[10px] bg-s2 shrink-0 overflow-hidden flex items-center justify-center text-lg">
              {c.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={c.imageUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                "📘"
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs sm:text-sm text-t3 mb-1">{P[c.provider] ?? c.provider}</div>
              <div className="font-semibold text-[1.0625rem] leading-snug line-clamp-2">{c.title}</div>
              <div className="progress-bar w-full max-w-[220px] mt-2">
                <span style={{ width: `${c.progressPct}%` }} />
              </div>
              <div className="text-xs sm:text-sm text-t3 mt-1">{c.progressPct}%</div>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}

export function ContinueExternalCourses() {
  const [saved, setSaved] = useState<Saved[] | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/me/saved-courses", { cache: "no-store" });
        const data = await res.json();
        if (res.ok) setSaved(data.courses || []);
      } catch {
        setSaved([]);
      }
    })();
  }, []);

  if (!saved) return null;
  const active = saved.filter((c) => c.progressPct > 0 && c.progressPct < 100);
  if (active.length === 0) return null;

  return (
    <section className="cover-card p-5 md:p-6 mb-6">
      <div className="flex items-end justify-between gap-2 mb-3">
        <div>
          <div className="text-sm font-bold uppercase tracking-[0.08em] text-t3">Continue learning</div>
          <h2
            className="text-xl md:text-2xl font-extrabold leading-tight"
            style={{ fontFamily: "var(--role-font-display)" }}
          >
            Free courses you started
          </h2>
        </div>
        <Link href="/courses/search" className="text-sm sm:text-base underline text-t2">
          Find more
        </Link>
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        {active.slice(0, 4).map((c) => (
          <div key={c.id} className="cover-card flex flex-col gap-2 p-3">
            <div className="line-clamp-2 text-base font-semibold leading-snug">{c.title}</div>
            <div className="text-xs sm:text-sm text-t3">{P[c.provider] ?? c.provider}</div>
            <div className="progress-bar w-full">
              <span style={{ width: `${c.progressPct}%` }} />
            </div>
            <div className="text-sm text-t2">{c.progressPct}%</div>
            <Link
              href={enc(
                c.url,
                c.provider,
                c.title,
                c.lastPositionSec && c.lastPositionSec > 0 ? c.lastPositionSec : undefined,
              )}
              className="btn btn-primary btn-sm w-fit"
            >
              {c.lastPositionSec && c.lastPositionSec > 0
                ? `Continue from ${fmtResume(c.lastPositionSec)}`
                : "Continue course"}
            </Link>
          </div>
        ))}
      </div>
    </section>
  );
}

export function RecommendedFreeCourses() {
  const [items, setItems] = useState<{ title: string; url: string; provider: string; id: string; imageUrl?: string }[]>(
    [],
  );
  const [q, setQ] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/courses/recommend", { cache: "no-store" });
        const data = await res.json();
        if (res.ok) {
          setQ(data.query || "");
          setItems((data.courses || []).map((c: { id: string; title: string; url: string; provider: string; imageUrl?: string }) => c));
        }
      } catch {
        // ignore
      }
    })();
  }, []);

  if (items.length === 0) return null;

  return (
    <section className="cover-card p-5 md:p-6 mb-6" style={{ background: "color-mix(in srgb, var(--g) 5%, var(--surface-1))" }}>
      <div className="mb-3">
        <div className="text-xs font-bold uppercase tracking-wide text-g">Recommended for you</div>
        <h2
          className="text-[1.125rem] font-extrabold leading-tight sm:text-[1.25rem]"
          style={{ fontFamily: "var(--role-font-display)" }}
        >
          Free picks from the web{q ? ` — “${q}”` : ""}
        </h2>
        <p className="mt-1 text-sm leading-relaxed text-t2">Based on your onboarding. Same unified search, fewer tabs.</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        {items.map((c) => (
          <Link
            key={c.id}
            href={enc(c.url, c.provider, c.title)}
            className="cover-card p-3 card-hover"
          >
            {c.imageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={c.imageUrl} alt="" className="mb-2 h-[88px] w-full rounded-[8px] object-cover" />
            )}
            <div className="line-clamp-2 text-[1.0625rem] font-bold leading-snug">{c.title}</div>
            <div className="mt-1 text-xs text-t3">{P[c.provider] ?? c.provider}</div>
          </Link>
        ))}
      </div>
    </section>
  );
}
