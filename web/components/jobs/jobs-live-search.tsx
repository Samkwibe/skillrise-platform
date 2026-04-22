"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type JobSource =
  | "adzuna"
  | "remotive"
  | "usajobs"
  | "apify"
  | "google"
  | "other";

type Job = {
  id: string;
  title: string;
  company: string;
  location: string;
  description: string;
  applyUrl?: string;
  salary?: string;
  employmentType?: string;
  postedAt?: number;
  source: JobSource;
  tags?: string[];
};

const SOURCE_LABEL: Record<JobSource, string> = {
  adzuna: "Adzuna",
  remotive: "Remotive",
  usajobs: "USAJobs",
  apify: "LinkedIn / Indeed",
  google: "Google Jobs",
  other: "Web",
};

/**
 * Live-jobs search widget for the /jobs page.
 *
 * Learners and employers can type any query ("plumbing near Kansas City",
 * "warehouse no experience") and the Apify-backed scraper will return
 * live results. Results are cached server-side, so repeat queries are
 * free and fast.
 *
 * The widget complements — not replaces — the curated job board below
 * it. Partner jobs with the 90-day guarantee still live in the main
 * grid; this lets users explore the open market when nothing there fits.
 */
export function JobsLiveSearch({ defaultQuery = "" }: { defaultQuery?: string }) {
  const [q, setQ] = useState(defaultQuery);
  const [location, setLocation] = useState("");
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const ctrl = useRef<AbortController | null>(null);

  const runSearch = useCallback(
    async (query: string, loc: string) => {
      const trimmed = query.trim();
      if (!trimmed) {
        setJobs([]);
        setNote(null);
        return;
      }
      ctrl.current?.abort();
      const ac = new AbortController();
      ctrl.current = ac;
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({ q: trimmed, limit: "20" });
        if (loc.trim()) params.set("location", loc.trim());
        const res = await fetch(`/api/jobs/search?${params.toString()}`, {
          signal: ac.signal,
          cache: "no-store",
        });
        const body = await res.json();
        if (!res.ok) {
          setError(body?.error ?? "Search failed.");
          setJobs([]);
        } else {
          setJobs(body.jobs || []);
          setNote(body.note || null);
        }
      } catch (e) {
        if ((e as Error).name !== "AbortError") {
          setError("Couldn't reach the job search right now.");
        }
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    if (defaultQuery) runSearch(defaultQuery, "");
  }, [defaultQuery, runSearch]);

  return (
    <section
      className="card p-5 md:p-6"
      style={{ background: "color-mix(in srgb, var(--g) 5%, var(--surface-1))" }}
    >
      <div className="flex items-baseline gap-2 flex-wrap mb-3">
        <h2
          className="font-extrabold text-[18px] md:text-[20px]"
          style={{ fontFamily: "var(--role-font-display)" }}
        >
          Search the open market
        </h2>
        <p className="text-[12.5px]" style={{ color: "var(--text-3)" }}>
          Live results from Google Jobs, LinkedIn, Indeed, Adzuna, Remotive
          and USAJobs. Cached for 8h to stay fast.
        </p>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          runSearch(q, location);
        }}
        className="grid grid-cols-1 md:grid-cols-[1fr_240px_auto] gap-2"
      >
        <input
          className="input"
          placeholder="e.g. warehouse, plumbing apprentice, receptionist"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          aria-label="Job keyword"
        />
        <input
          className="input"
          placeholder="Location (optional)"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          aria-label="Location"
        />
        <button
          className="btn btn-primary"
          type="submit"
          disabled={loading || !q.trim()}
        >
          {loading ? "Searching…" : "Search jobs"}
        </button>
      </form>

      {error && (
        <div className="mt-3 text-[13px]" role="alert" style={{ color: "var(--danger, #c33)" }}>
          {error}
        </div>
      )}
      {note && !error && (
        <div className="mt-3 text-[12.5px]" style={{ color: "var(--text-3)" }}>
          {note}
        </div>
      )}

      {jobs.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
          {jobs.map((j) => (
            <a
              key={j.id}
              href={j.applyUrl || "#"}
              target={j.applyUrl ? "_blank" : undefined}
              rel="noreferrer noopener"
              className="card card-hover p-4"
            >
              <div className="flex justify-between items-start gap-2 mb-1">
                <div className="min-w-0">
                  <div className="font-bold text-[15px] truncate">{j.title}</div>
                  <div className="text-[12.5px] text-t3 truncate">
                    {j.company} · {j.location}
                  </div>
                </div>
                <span className="pill text-[10.5px]" title={j.tags?.join(" · ")}>
                  {SOURCE_LABEL[j.source] ?? j.source}
                </span>
              </div>
              {j.description && (
                <p className="text-[12.5px] text-t2 line-clamp-2 mb-2">{j.description}</p>
              )}
              <div className="flex flex-wrap gap-1.5 text-[11px]">
                {j.employmentType && <span className="pill">{j.employmentType}</span>}
                {j.salary && <span className="pill pill-g">{j.salary}</span>}
                {j.postedAt && (
                  <span className="pill" title={new Date(j.postedAt).toLocaleString()}>
                    {relative(j.postedAt)}
                  </span>
                )}
              </div>
            </a>
          ))}
        </div>
      )}

      {!loading && jobs.length === 0 && q.trim() && !error && (
        <div className="mt-4 text-[13px] text-t3">
          No live results for that query. Try a broader term, or browse the partner jobs below.
        </div>
      )}
    </section>
  );
}

function relative(ts: number): string {
  const diff = Date.now() - ts;
  const days = Math.floor(diff / 86_400_000);
  if (days >= 1) return `${days}d ago`;
  const hrs = Math.floor(diff / 3_600_000);
  if (hrs >= 1) return `${hrs}h ago`;
  const mins = Math.max(1, Math.floor(diff / 60_000));
  return `${mins}m ago`;
}
