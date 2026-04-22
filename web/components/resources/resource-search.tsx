"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { LearningResource } from "@/lib/resources/types";
import { ResourceCard } from "./resource-card";
import { ResourcePlayerModal } from "./resource-player-modal";

type Props = {
  canSave: boolean;
  initialSavedIds: string[];
  defaultQuery?: string;
};

type ApiResponse = {
  items: LearningResource[];
  byProvider: Array<{
    provider: string;
    count: number;
    configured: boolean;
    error?: string;
  }>;
  note?: string;
};

const PROVIDER_LABELS: Record<string, string> = {
  youtube: "YouTube",
  "mit-ocw": "MIT OCW",
  openlibrary: "Open Library",
  wikipedia: "Wikipedia",
  openalex: "OpenAlex",
  googlebooks: "Google Books",
  internetarchive: "Internet Archive",
  semanticscholar: "Semantic Scholar",
  coursera: "Coursera",
  khan: "Khan Academy",
  edx: "edX",
  harvard: "Harvard",
  alison: "Alison",
  freecodecamp: "freeCodeCamp",
};

/**
 * Unified course search widget.
 *
 * Types a query → fans out to every provider via /api/resources/search
 * → shows merged cards with provider filter pills. Clicking a card
 * opens `<ResourcePlayerModal>` which embeds the video/book when the
 * provider supports it, or links out otherwise.
 */
export function ResourceSearch({
  canSave,
  initialSavedIds,
  defaultQuery = "",
}: Props) {
  const [q, setQ] = useState(defaultQuery);
  const [items, setItems] = useState<LearningResource[]>([]);
  const [byProvider, setByProvider] = useState<ApiResponse["byProvider"]>([]);
  const [loading, setLoading] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeProvider, setActiveProvider] = useState<string | "all">("all");
  const [active, setActive] = useState<LearningResource | null>(null);
  const ctrl = useRef<AbortController | null>(null);

  const savedIds = useMemo(() => new Set(initialSavedIds), [initialSavedIds]);

  const runSearch = useCallback(async (query: string) => {
    const trimmed = query.trim();
    if (!trimmed) {
      setItems([]);
      setByProvider([]);
      setNote(null);
      return;
    }
    ctrl.current?.abort();
    const ac = new AbortController();
    ctrl.current = ac;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/resources/search?q=${encodeURIComponent(trimmed)}&limit=10`,
        { signal: ac.signal, cache: "no-store" },
      );
      const body: ApiResponse & { error?: string } = await res.json();
      if (!res.ok) {
        setError(body.error ?? "Search failed.");
        setItems([]);
        setByProvider([]);
      } else {
        setItems(body.items ?? []);
        setByProvider(body.byProvider ?? []);
        setNote(body.note ?? null);
      }
    } catch (e) {
      if ((e as Error).name !== "AbortError") {
        setError("Couldn't reach the search right now.");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (defaultQuery) runSearch(defaultQuery);
  }, [defaultQuery, runSearch]);

  const visible = items.filter((r) =>
    activeProvider === "all" ? true : r.provider === activeProvider,
  );

  const pillSources = [
    { id: "all", label: "All", count: items.length },
    ...byProvider
      .filter((p) => p.count > 0)
      .map((p) => ({
        id: p.provider,
        label: PROVIDER_LABELS[p.provider] ?? p.provider,
        count: p.count,
      })),
  ];

  return (
    <section className="flex flex-col gap-5">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          runSearch(q);
        }}
        className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-2"
      >
        <input
          className="input"
          placeholder="Search any skill — e.g. communication, python, budgeting, first aid"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          aria-label="Search learning resources"
        />
        <button
          type="submit"
          className="btn btn-primary"
          disabled={loading || !q.trim()}
        >
          {loading ? "Searching…" : "Search"}
        </button>
      </form>

      {error && (
        <div
          className="card p-3 text-[13px]"
          style={{ color: "#ffb0b0", background: "rgba(227,75,75,0.08)" }}
          role="alert"
        >
          {error}
        </div>
      )}

      {items.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {pillSources.map((p) => {
            const active = activeProvider === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setActiveProvider(p.id)}
                className="px-3 py-1.5 rounded-full text-[12.5px] font-semibold transition-colors"
                style={{
                  background: active ? "var(--g)" : "var(--surface-2)",
                  color: active ? "var(--bg)" : "var(--text-1)",
                  border: `1px solid ${active ? "var(--g)" : "var(--border-1)"}`,
                }}
              >
                {p.label} · {p.count}
              </button>
            );
          })}
        </div>
      )}

      {note && items.length === 0 && !loading && (
        <div
          className="card p-4 text-[13.5px]"
          style={{ color: "var(--text-3)" }}
        >
          {note}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
        {visible.map((r) => (
          <ResourceCard
            key={r.id}
            resource={r}
            canSave={canSave}
            initialSaved={savedIds.has(r.id)}
            onOpen={setActive}
          />
        ))}
      </div>

      <ResourcePlayerModal resource={active} onClose={() => setActive(null)} />
    </section>
  );
}
