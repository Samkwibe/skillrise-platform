"use client";

import { useCallback, useEffect, useState } from "react";
import type { CoursePreview } from "@/lib/courses/types";
import type { CourseProviderId } from "@/lib/courses/types";

type Props = {
  url: string;
  provider: CourseProviderId;
  title: string;
};

const PILL: Record<CourseProviderId, string> = {
  coursera: "Coursera",
  openlibrary: "Open Library",
  mit: "MIT OCW",
  khan: "Khan Academy",
  youtube: "YouTube",
  simplilearn: "Simplilearn",
};

export function CourseViewClient({ url, provider, title }: Props) {
  const [preview, setPreview] = useState<CoursePreview | null>(null);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [progress, setProgress] = useState(0);
  const [courseId, setCourseId] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/courses/preview?url=${encodeURIComponent(url)}`, { cache: "no-store" });
        const data = await res.json();
        if (!cancelled && res.ok) setPreview(data);
      } catch {
        // ignore
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [url]);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/me/saved-courses", { cache: "no-store" });
        const data = await res.json();
        if (!res.ok) return;
        const list = data.courses as Array<{ id: string; url: string; progressPct: number }>;
        const row = list.find((c) => c.url === url);
        if (row) {
          setSaved(true);
          setProgress(row.progressPct);
          setCourseId(row.id);
        }
      } catch {
        // ignore
      }
    })();
  }, [url]);

  const save = useCallback(async () => {
    setErr(null);
    try {
      const res = await fetch("/api/me/saved-courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider,
          title: preview?.title || title,
          url,
          imageUrl: preview?.imageUrl,
          description: preview?.description,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");
      setSaved(true);
      const row = (data.courses as Array<{ id: string; url: string }>).find((c) => c.url === url);
      if (row) setCourseId(row.id);
    } catch (e) {
      setErr((e as Error).message);
    }
  }, [provider, preview?.title, preview?.imageUrl, preview?.description, title, url]);

  const setPct = useCallback(
    async (pct: number) => {
      if (!courseId) return;
      setProgress(pct);
      try {
        await fetch("/api/me/saved-courses", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: courseId, progressPct: pct }),
        });
      } catch {
        // ignore
      }
    },
    [courseId],
  );

  const displayTitle = preview?.title || title;
  const desc = preview?.description;

  return (
    <div className="grid lg:grid-cols-[1fr_360px] gap-6">
      <div>
        <div className="flex flex-wrap gap-2 mb-3">
          <span className="pill text-[11px]">{PILL[provider]}</span>
          {preview?.siteName && <span className="pill text-[11px] text-t3">{preview.siteName}</span>}
        </div>
        <h1
          className="text-[26px] md:text-[34px] font-extrabold leading-tight mb-3"
          style={{ fontFamily: "var(--role-font-display)" }}
        >
          {displayTitle}
        </h1>
        {loading && <p className="text-[13px] text-t3">Loading preview…</p>}
        {desc && <p className="text-[14.5px] text-t2 leading-relaxed mb-6">{desc}</p>}

        {preview && preview.videoIds.length > 0 && (
          <section className="mb-8">
            <h2 className="text-[18px] font-bold mb-3" style={{ fontFamily: "var(--role-font-display)" }}>
              Videos on this page
            </h2>
            <p className="text-[12.5px] text-t3 mb-3">
              We surface public YouTube clips linked from the provider page. For the full experience (quizzes,
              readings, assignments), use “Open on site”.
            </p>
            <div className="grid gap-4">
              {preview.videoIds.map((id) => (
                <div key={id} className="card overflow-hidden">
                  <div className="relative w-full" style={{ aspectRatio: "16/9" }}>
                    <iframe
                      title={displayTitle}
                      className="absolute inset-0 w-full h-full"
                      src={`https://www.youtube-nocookie.com/embed/${id}?rel=0`}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {preview?.imageUrl && (
          <div className="mb-6">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview.imageUrl} alt="" className="rounded-[12px] max-h-[280px] object-cover w-full" />
          </div>
        )}

        <a
          href={url}
          target="_blank"
          rel="noreferrer noopener"
          className="btn btn-primary inline-flex"
        >
          Open full course on {PILL[provider]} ↗
        </a>
      </div>

      <aside className="card p-5 h-fit lg:sticky lg:top-24">
        <div className="text-[12px] font-bold uppercase tracking-[0.1em] text-t3 mb-2">My learning</div>
        {err && <p className="text-[12px] text-red mb-2">{err}</p>}
        {!saved ? (
          <button type="button" className="btn btn-primary w-full mb-3" onClick={save}>
            Save to My Learning
          </button>
        ) : (
          <>
            <p className="text-[13px] text-t2 mb-2">Saved — adjust your progress:</p>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {[0, 25, 50, 75, 100].map((p) => (
                <button
                  key={p}
                  type="button"
                  className={`pill text-[11px] ${progress === p ? "pill-g" : ""}`}
                  onClick={() => void setPct(p)}
                >
                  {p}%
                </button>
              ))}
            </div>
            <div className="progress-bar w-full mb-1">
              <span style={{ width: `${progress}%` }} />
            </div>
            <p className="text-[11px] text-t3">{progress}% complete (self-reported)</p>
          </>
        )}
      </aside>
    </div>
  );
}
