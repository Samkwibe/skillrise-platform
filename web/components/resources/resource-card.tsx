"use client";

import { useState } from "react";
import type { LearningResource } from "@/lib/resources/types";

const PROVIDER_BADGE: Record<string, string> = {
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
  other: "Web",
};

const KIND_EMOJI: Record<string, string> = {
  video: "▶",
  course: "🎓",
  book: "📖",
  article: "📰",
  podcast: "🎧",
  link: "🔗",
};

/**
 * Unified card for any learning resource — video, course, book, article,
 * or deep-link. Click opens the embed modal when `embedUrl` is set,
 * otherwise falls back to opening the original URL in a new tab. Save
 * posts to `/api/resources/save` optimistically.
 */
export function ResourceCard({
  resource,
  canSave,
  initialSaved,
  onOpen,
}: {
  resource: LearningResource;
  canSave: boolean;
  initialSaved: boolean;
  onOpen: (r: LearningResource) => void;
}) {
  const [saved, setSaved] = useState(initialSaved);
  const [saving, setSaving] = useState(false);

  async function toggleSave(e: React.MouseEvent) {
    e.stopPropagation();
    e.preventDefault();
    if (!canSave || saving) return;
    const next = !saved;
    setSaved(next);
    setSaving(true);
    try {
      const res = await fetch("/api/resources/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          saved: next,
          resource: {
            id: resource.id,
            title: resource.title,
            url: resource.url,
            description: resource.description,
            thumbnail: resource.thumbnail,
            author: resource.author,
            duration: resource.duration,
            provider: resource.provider,
            kind: resource.kind,
            embedUrl: resource.embedUrl,
            freeCertificate: resource.freeCertificate,
          },
        }),
      });
      if (!res.ok) setSaved(!next);
      else {
        const body = await res.json();
        setSaved(Boolean(body.saved));
      }
    } catch {
      setSaved(!next);
    } finally {
      setSaving(false);
    }
  }

  const isDeepLink = resource.isDeepLink;
  const badge = PROVIDER_BADGE[resource.provider] ?? resource.provider;

  return (
    <article
      className="card card-hover p-0 overflow-hidden cursor-pointer flex flex-col"
      onClick={() => onOpen(resource)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen(resource);
        }
      }}
    >
      {resource.thumbnail ? (
        <div
          className="aspect-video w-full bg-[var(--surface-2)] bg-cover bg-center"
          style={{ backgroundImage: `url(${resource.thumbnail})` }}
          aria-hidden
        />
      ) : (
        <div
          className="aspect-video w-full flex items-center justify-center text-[48px]"
          style={{ background: "var(--surface-2)", color: "var(--text-3)" }}
          aria-hidden
        >
          {KIND_EMOJI[resource.kind] ?? "🔗"}
        </div>
      )}
      <div className="p-3.5 flex-1 flex flex-col gap-2">
        <div className="flex items-center gap-2 text-[11px]">
          <span className="pill" title={badge}>
            {badge}
          </span>
          <span
            className="uppercase tracking-wider font-bold"
            style={{ color: "var(--text-3)" }}
          >
            {isDeepLink ? "Search" : resource.kind}
          </span>
          {resource.freeCertificate && (
            <span className="pill pill-g" title="Free certificate on completion">
              Free cert
            </span>
          )}
        </div>
        <h3 className="font-bold text-[14.5px] leading-snug line-clamp-2">
          {resource.title}
        </h3>
        {resource.description && (
          <p
            className="text-[12.5px] line-clamp-2"
            style={{ color: "var(--text-3)" }}
          >
            {resource.description}
          </p>
        )}
        <div className="flex items-center gap-2 mt-auto pt-1 text-[11.5px]" style={{ color: "var(--text-3)" }}>
          {resource.author && (
            <span className="truncate max-w-[160px]" title={resource.author}>
              {resource.author}
            </span>
          )}
          {resource.duration && <span>· {resource.duration}</span>}
          {canSave && !isDeepLink && (
            <button
              type="button"
              onClick={toggleSave}
              disabled={saving}
              aria-pressed={saved}
              className="ml-auto px-2.5 py-1 rounded-full text-[11.5px] font-semibold transition-colors"
              style={{
                background: saved ? "var(--g)" : "var(--surface-2)",
                color: saved ? "var(--bg)" : "var(--text-1)",
                border: `1px solid ${saved ? "var(--g)" : "var(--border-1)"}`,
              }}
            >
              {saved ? "Saved" : "Save"}
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
