"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import type { CourseProviderId } from "@/lib/courses/types";
import { ProviderMark, providerLabel } from "@/components/courses/provider-logo";

type FreeCourse = {
  id: string;
  title: string;
  description?: string;
  url: string;
  provider: CourseProviderId;
  imageUrl?: string;
  durationText?: string;
  byline?: string;
  freeCertificateHint?: boolean;
  format?: string;
  rating?: number;
  ratingCountLabel?: string;
  viewCount?: number;
  youtubeVideoId?: string;
};

const PROVIDERS: { id: CourseProviderId; label: string }[] = [
  { id: "coursera", label: "Coursera" },
  { id: "youtube", label: "YouTube" },
  { id: "openlibrary", label: "Open Library" },
  { id: "mit", label: "MIT OCW" },
  { id: "khan", label: "Khan Academy" },
  { id: "simplilearn", label: "Simplilearn" },
];

const PILL: Record<CourseProviderId, string> = {
  coursera: "Coursera",
  openlibrary: "Open Library",
  mit: "MIT OCW",
  khan: "Khan",
  youtube: "YouTube",
  simplilearn: "Simplilearn",
};

const SUGGEST = ["Communication skills", "Python basics", "Resume writing", "Algebra", "First aid", "Project management"];

function fmtViews(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M views`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K views`;
  return `${n} views`;
}

function courseLearnHref(c: FreeCourse) {
  const p = new URLSearchParams({
    k: c.id,
    url: c.url,
    provider: c.provider,
    title: c.title,
  });
  if (c.youtubeVideoId) p.set("v", c.youtubeVideoId);
  return `/courses/learn?${p.toString()}`;
}

type Props = {
  variant?: "page" | "compact";
  defaultQuery?: string;
};

export function UnifiedCourseSearch({ variant = "page", defaultQuery = "" }: Props) {
  const [q, setQ] = useState(defaultQuery);
  const [filter, setFilter] = useState<"all" | CourseProviderId>("all");
  const [loading, setLoading] = useState(false);
  const [courses, setCourses] = useState<FreeCourse[]>([]);
  const [note, setNote] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const run = useCallback(async (query: string, prov: "all" | CourseProviderId = filter) => {
    const t = query.trim();
    if (!t) return;
    setLoading(true);
    setErr(null);
    try {
      const params = new URLSearchParams({ q: t, limit: "20" });
      if (prov !== "all") params.set("providers", prov);
      const res = await fetch(`/api/courses/search?${params}`, { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Search failed");
      setCourses(data.courses || []);
      setNote(data.note || null);
    } catch (e) {
      setErr((e as Error).message);
      setCourses([]);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  return (
    <section className={variant === "compact" ? "" : "mb-10"}>
      {variant === "page" && (
        <div className="mb-4">
          <h1
            className="text-[24px] md:text-[32px] font-extrabold"
            style={{ fontFamily: "var(--role-font-display)" }}
          >
            Free course search
          </h1>
          <p className="text-[13.5px] text-t2 mt-1 max-w-2xl">
            One search across Coursera (catalog + your org API when it works), YouTube (with{" "}
            <code className="text-[12px]">YOUTUBE_API_KEY</code>), Open Library, MIT, Khan, and Simplilearn (via web
            search when Brave/Serper keys are set). Pick the course that fits — you’re in control.
          </p>
        </div>
      )}

      <div className="card p-4 md:p-5">
        <div className="text-[11px] font-bold uppercase tracking-[0.1em] text-t3 mb-2">Free courses & books</div>
        <form
          className="flex flex-col lg:flex-row gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            run(q);
          }}
        >
          <input
            className="input flex-1"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="e.g. communication skills, data science, personal finance"
            aria-label="Search free courses"
          />
          <button type="submit" className="btn btn-primary" disabled={loading || !q.trim()}>
            {loading ? "Searching…" : "Search"}
          </button>
        </form>

        <div className="flex flex-wrap gap-2 mt-3">
          {["all" as const, ...PROVIDERS.map((p) => p.id)].map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => {
                if (id === "all") {
                  setFilter("all");
                  if (q.trim()) void run(q, "all");
                } else {
                  setFilter(id);
                  if (q.trim()) void run(q, id);
                }
              }}
              className={`pill text-[12px] ${(id === "all" ? filter === "all" : filter === id) ? "pill-g" : ""}`}
            >
              {id === "all" ? "All sources" : PILL[id]}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-2 mt-3">
          {SUGGEST.map((s) => (
            <button
              type="button"
              key={s}
              onClick={() => {
                setQ(s);
                setTimeout(() => run(s), 0);
              }}
              className="pill text-[12px] micro-hover"
            >
              {s}
            </button>
          ))}
        </div>

        {note && !err && <p className="text-[12.5px] text-t3 mt-3">{note}</p>}
        {err && (
          <p className="text-[12.5px] mt-3" style={{ color: "var(--red)" }}>
            {err}
          </p>
        )}
      </div>

      {courses.length > 0 && (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4 mt-4">
          {courses.map((c) => (
            <article key={c.id} className="card card-hover overflow-hidden flex flex-col">
              <div className="h-[120px] relative bg-s2 flex items-center justify-center">
                {c.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={c.imageUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
                ) : (
                  <span className="text-[40px] opacity-40">📚</span>
                )}
                <div className="absolute top-2 left-2 flex items-center gap-1.5">
                  <ProviderMark id={c.provider} size="sm" />
                  <span className="pill text-[10px] bg-black/70 text-white border-0">{PILL[c.provider]}</span>
                </div>
                {c.freeCertificateHint && (
                  <span
                    className="absolute top-2 right-2 pill text-[10px] border-amber-200/50"
                    title="Certificate may be offered on the provider site."
                  >
                    Cert (on site)
                  </span>
                )}
              </div>
              <div className="p-4 flex-1 flex flex-col gap-1">
                <h2 className="font-bold text-[15px] leading-snug line-clamp-2">{c.title}</h2>
                {(c.rating != null || c.ratingCountLabel || c.viewCount != null) && (
                  <div className="text-[11px] text-t3">
                    {c.rating != null && <span>{c.rating.toFixed(1)}★</span>}
                    {c.ratingCountLabel && <span className="ml-1">· {c.ratingCountLabel}</span>}
                    {c.viewCount != null && !c.ratingCountLabel && (
                      <span className="ml-1">· {fmtViews(c.viewCount)}</span>
                    )}
                  </div>
                )}
                {c.format && <div className="text-[11px] text-t3">{c.format}</div>}
                {c.durationText && <div className="text-[11px] text-t3">⏱ {c.durationText}</div>}
                {c.byline && <div className="text-[11px] text-t3">{c.byline}</div>}
                {c.description && <p className="text-[12.5px] text-t2 line-clamp-3 flex-1">{c.description}</p>}
                <div className="flex flex-wrap gap-2 mt-2">
                  <Link href={courseLearnHref(c)} className="btn btn-primary btn-sm">
                    Select this course
                  </Link>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    disabled={saving === c.id}
                    onClick={async () => {
                      setSaving(c.id);
                      try {
                        const res = await fetch("/api/me/saved-courses", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            provider: c.provider,
                            title: c.title,
                            url: c.url,
                            imageUrl: c.imageUrl,
                            description: c.description,
                          }),
                        });
                        if (!res.ok) throw new Error("Could not save");
                      } catch {
                        setErr("Watch later failed. Try again.");
                      } finally {
                        setSaving(null);
                      }
                    }}
                  >
                    {saving === c.id ? "…" : "Watch later"}
                  </button>
                </div>
                <a href={c.url} target="_blank" rel="noreferrer noopener" className="text-[11px] text-t3 underline mt-1">
                  Open on {providerLabel(c.provider)} ↗
                </a>
              </div>
            </article>
          ))}
        </div>
      )}

      {variant === "page" && (
        <p className="text-[12px] text-t3 mt-4">
          Tip: changing the source filter re-runs the search. We return many rows from different providers so you
          can compare and choose.
        </p>
      )}
    </section>
  );
}
