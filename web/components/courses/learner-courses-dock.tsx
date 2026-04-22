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
};

const P: Record<string, string> = {
  coursera: "Coursera",
  openlibrary: "Open Library",
  mit: "MIT",
  khan: "Khan",
  youtube: "YouTube",
  simplilearn: "Simplilearn",
};

function enc(u: string, p: string, t: string) {
  const provider = (p as CourseProviderId) || "coursera";
  const k = stableCourseId(provider, u);
  const q = new URLSearchParams({ k, url: u, provider: p, title: t });
  if (provider === "youtube") {
    const v = extractYoutubeVideoId(u);
    if (v) q.set("v", v);
  }
  return `/courses/learn?${q.toString()}`;
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

  if (!saved) return <div className="cover-card p-4 text-[13px] text-t3">Loading your saved courses…</div>;
  if (saved.length === 0) {
    return (
      <div className="cover-card p-4">
        <div className="text-[12px] font-bold uppercase text-t3 mb-1">Saved courses</div>
        <p className="text-[13px] text-t2">Nothing saved yet. Search free courses and tap “Watch later”.</p>
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
          href={enc(c.url, c.provider, c.title)}
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
              <div className="text-[11px] text-t3 mb-0.5">{P[c.provider] ?? c.provider}</div>
              <div className="font-semibold text-[13.5px] line-clamp-2">{c.title}</div>
              <div className="progress-bar w-full max-w-[220px] mt-2">
                <span style={{ width: `${c.progressPct}%` }} />
              </div>
              <div className="text-[10.5px] text-t3 mt-1">{c.progressPct}%</div>
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
          <div className="text-[11px] font-bold uppercase tracking-[0.1em] text-t3">Continue learning</div>
          <h2
            className="text-[18px] md:text-[20px] font-extrabold"
            style={{ fontFamily: "var(--role-font-display)" }}
          >
            Free courses you started
          </h2>
        </div>
        <Link href="/courses/search" className="text-[12.5px] underline text-t2">
          Find more
        </Link>
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        {active.slice(0, 4).map((c) => (
          <Link
            key={c.id}
            href={enc(c.url, c.provider, c.title)}
            className="cover-card p-3 flex flex-col gap-2"
          >
            <div className="text-[12px] font-semibold line-clamp-2">{c.title}</div>
            <div className="text-[10px] text-t3">{P[c.provider] ?? c.provider}</div>
            <div className="progress-bar w-full">
              <span style={{ width: `${c.progressPct}%` }} />
            </div>
            <div className="text-[11px] text-t2">{c.progressPct}%</div>
          </Link>
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
        <div className="text-[11px] font-bold uppercase text-g">Recommended for you</div>
        <h2
          className="text-[18px] font-extrabold"
          style={{ fontFamily: "var(--role-font-display)" }}
        >
          Free picks from the web{q ? ` — “${q}”` : ""}
        </h2>
        <p className="text-[12.5px] text-t2 mt-1">Based on your onboarding. Same unified search, fewer tabs.</p>
      </div>
      <div className="grid sm:grid-cols-3 gap-3">
        {items.map((c) => (
          <Link
            key={c.id}
            href={enc(c.url, c.provider, c.title)}
            className="cover-card p-3 card-hover"
          >
            {c.imageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={c.imageUrl} alt="" className="w-full h-[88px] object-cover rounded-[8px] mb-2" />
            )}
            <div className="text-[12px] font-bold line-clamp-2 leading-snug">{c.title}</div>
            <div className="text-[10px] text-t3 mt-1">{P[c.provider] ?? c.provider}</div>
          </Link>
        ))}
      </div>
    </section>
  );
}
