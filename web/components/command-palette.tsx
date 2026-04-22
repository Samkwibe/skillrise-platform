"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

export type CommandItem = {
  id: string;
  label: string;
  href: string;
  kind: "nav" | "track" | "job" | "person" | "action";
  subtitle?: string;
  hint?: string;
  emoji?: string;
};

const KIND_LABEL: Record<CommandItem["kind"], string> = {
  nav: "Navigate",
  track: "Tracks",
  job: "Jobs",
  person: "People",
  action: "Actions",
};

const KIND_ORDER: CommandItem["kind"][] = ["nav", "action", "track", "job", "person"];

/** Basic fuzzy score — subsequence match preferring contiguous runs near the start. */
function fuzzyScore(query: string, text: string): number {
  if (!query) return 1;
  const q = query.toLowerCase();
  const t = text.toLowerCase();
  if (t.includes(q)) return 100 + (t.startsWith(q) ? 50 : 0);
  let score = 0;
  let qi = 0;
  let lastHit = -2;
  for (let i = 0; i < t.length && qi < q.length; i++) {
    if (t[i] === q[qi]) {
      score += i - lastHit === 1 ? 3 : 1;
      lastHit = i;
      qi++;
    }
  }
  return qi === q.length ? score : 0;
}

/**
 * Global ⌘K command palette. Mounted once per shell. Fully keyboard-navigable
 * (↑ ↓ to move, ↵ to go, Esc to close). Dataset is supplied by the shell so
 * each role sees a context-appropriate set of commands.
 */
export function CommandPalette({ items }: { items: CommandItem[] }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [cursor, setCursor] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const router = useRouter();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const cmd = (e.metaKey || e.ctrlKey) && (e.key === "k" || e.key === "K");
      if (cmd) {
        e.preventDefault();
        setOpen((o) => !o);
        return;
      }
      if (e.key === "Escape" && open) {
        setOpen(false);
      }
      if (!open && e.key === "/" && document.activeElement?.tagName !== "INPUT" && document.activeElement?.tagName !== "TEXTAREA") {
        e.preventDefault();
        setOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    if (open) {
      setQuery("");
      setCursor(0);
      setTimeout(() => inputRef.current?.focus(), 30);
    }
  }, [open]);

  const filtered = useMemo(() => {
    const ranked = items
      .map((it) => ({
        it,
        score: Math.max(
          fuzzyScore(query, it.label),
          fuzzyScore(query, it.subtitle ?? ""),
          fuzzyScore(query, it.hint ?? ""),
        ),
      }))
      .filter((r) => (query ? r.score > 0 : true))
      .sort((a, b) => b.score - a.score)
      .map((r) => r.it);
    return ranked.slice(0, 40);
  }, [items, query]);

  const grouped = useMemo(() => {
    const map = new Map<CommandItem["kind"], CommandItem[]>();
    for (const it of filtered) {
      if (!map.has(it.kind)) map.set(it.kind, []);
      map.get(it.kind)!.push(it);
    }
    return KIND_ORDER.filter((k) => map.has(k)).map((k) => [k, map.get(k)!] as const);
  }, [filtered]);

  useEffect(() => {
    if (cursor >= filtered.length) setCursor(Math.max(0, filtered.length - 1));
  }, [cursor, filtered.length]);

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setCursor((c) => Math.min(filtered.length - 1, c + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setCursor((c) => Math.max(0, c - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const chosen = filtered[cursor];
      if (chosen) {
        setOpen(false);
        router.push(chosen.href);
      }
    }
  };

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[90] flex items-start justify-center pt-[12vh] px-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) setOpen(false);
      }}
      style={{ background: "rgba(5,10,20,0.55)", backdropFilter: "blur(4px)" }}
    >
      <div
        className="w-full max-w-[560px] rounded-[14px] overflow-hidden animate-scale-in"
        style={{
          background: "var(--surface-1)",
          border: "1px solid var(--border-2)",
          boxShadow: "0 30px 80px rgba(0,0,0,0.45)",
        }}
      >
        <div
          className="flex items-center gap-2 px-4"
          style={{ borderBottom: "1px solid var(--border-1)" }}
        >
          <span style={{ color: "var(--text-3)" }}>⌕</span>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setCursor(0);
            }}
            onKeyDown={onKeyDown}
            placeholder="Search pages, tracks, jobs, people…"
            className="flex-1 py-3 bg-transparent outline-none text-[15px]"
            style={{ color: "var(--text-1)" }}
            aria-label="Command palette search"
          />
          <span
            className="text-[10.5px] font-mono px-1.5 py-0.5 rounded"
            style={{ background: "var(--surface-2)", color: "var(--text-3)" }}
          >
            Esc
          </span>
        </div>

        <div className="max-h-[52vh] overflow-y-auto py-2">
          {filtered.length === 0 ? (
            <div className="px-5 py-10 text-center text-[13px]" style={{ color: "var(--text-3)" }}>
              No matches for "{query}".
            </div>
          ) : (
            grouped.map(([kind, list]) => (
              <div key={kind}>
                <div
                  className="px-4 pt-2 pb-1 text-[10.5px] font-bold uppercase tracking-[0.1em]"
                  style={{ color: "var(--text-3)" }}
                >
                  {KIND_LABEL[kind]}
                </div>
                {list.map((it) => {
                  const globalIndex = filtered.indexOf(it);
                  const isActive = globalIndex === cursor;
                  return (
                    <Link
                      key={it.id}
                      href={it.href}
                      onClick={() => setOpen(false)}
                      onMouseEnter={() => setCursor(globalIndex)}
                      className="flex items-center gap-3 px-4 py-2.5 mx-1.5 rounded-[10px] transition-colors"
                      style={{
                        background: isActive ? "color-mix(in srgb, var(--g) 14%, transparent)" : "transparent",
                      }}
                    >
                      <div
                        className="w-8 h-8 rounded-[8px] flex items-center justify-center text-[16px] shrink-0"
                        style={{
                          background: isActive
                            ? "var(--g)"
                            : "var(--surface-2)",
                          color: isActive ? "var(--bg)" : "var(--text-2)",
                        }}
                      >
                        {it.emoji ?? (it.kind === "nav" ? "→" : it.kind === "track" ? "◉" : it.kind === "job" ? "◆" : it.kind === "person" ? "◯" : "✦")}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-[13.5px] font-semibold truncate" style={{ color: "var(--text-1)" }}>
                          {it.label}
                        </div>
                        {it.subtitle && (
                          <div className="text-[11.5px] truncate" style={{ color: "var(--text-3)" }}>
                            {it.subtitle}
                          </div>
                        )}
                      </div>
                      {it.hint && (
                        <span
                          className="text-[10.5px] font-mono px-1.5 py-0.5 rounded shrink-0"
                          style={{ background: "var(--surface-2)", color: "var(--text-3)" }}
                        >
                          {it.hint}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            ))
          )}
        </div>

        <div
          className="flex items-center justify-between gap-3 px-4 py-2 text-[11px]"
          style={{ borderTop: "1px solid var(--border-1)", color: "var(--text-3)" }}
        >
          <div className="flex items-center gap-3">
            <span>
              <span className="kbd">↑</span> <span className="kbd">↓</span> move
            </span>
            <span>
              <span className="kbd">↵</span> open
            </span>
          </div>
          <span>
            <span className="kbd">⌘</span> <span className="kbd">K</span> to open anywhere
          </span>
        </div>
      </div>
    </div>
  );
}
