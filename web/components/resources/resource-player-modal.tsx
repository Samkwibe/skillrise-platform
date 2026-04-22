"use client";

import { useEffect } from "react";
import type { LearningResource } from "@/lib/resources/types";

/**
 * Modal that embeds a resource when the provider supports it:
 *   - YouTube / MIT OCW (YouTube playlist)  → `<iframe>` video player
 *   - Open Library readable book            → `<iframe>` archive.org reader
 *   - Everything else                       → "Open on <site>" button
 *
 * Closing: backdrop click, ESC, or the × button. Body scroll is locked
 * while the modal is open so the underlying page doesn't jump.
 */
export function ResourcePlayerModal({
  resource,
  onClose,
}: {
  resource: LearningResource | null;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!resource) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [resource, onClose]);

  if (!resource) return null;

  const canEmbed = Boolean(resource.embedUrl);

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center p-3 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={resource.title}
      onClick={onClose}
      style={{ background: "rgba(3,6,10,0.78)", backdropFilter: "blur(6px)" }}
    >
      <div
        className="card w-full max-w-[1040px] max-h-[92vh] overflow-hidden flex flex-col"
        style={{ background: "var(--surface-1)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <header
          className="flex items-start gap-3 px-4 md:px-5 py-3 md:py-3.5"
          style={{ borderBottom: "1px solid var(--border-1)" }}
        >
          <div className="flex-1 min-w-0">
            <div
              className="text-[11px] uppercase tracking-wider font-bold"
              style={{ color: "var(--text-3)" }}
            >
              {resource.provider} · {resource.kind}
            </div>
            <h2 className="font-extrabold text-[17px] md:text-[19px] leading-snug truncate">
              {resource.title}
            </h2>
            {resource.author && (
              <div
                className="text-[12.5px] mt-0.5"
                style={{ color: "var(--text-2)" }}
              >
                {resource.author}
                {resource.duration ? ` · ${resource.duration}` : ""}
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 w-9 h-9 rounded-full text-[18px] hover:bg-[var(--surface-2)]"
            aria-label="Close"
          >
            ×
          </button>
        </header>

        <div className="flex-1 overflow-auto">
          {canEmbed ? (
            <div className="relative w-full" style={{ aspectRatio: "16 / 9" }}>
              <iframe
                src={resource.embedUrl}
                title={resource.title}
                className="absolute inset-0 w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                allowFullScreen
                loading="lazy"
                referrerPolicy="strict-origin-when-cross-origin"
              />
            </div>
          ) : (
            <div className="p-5 md:p-6">
              {resource.thumbnail && (
                <div
                  className="rounded-[12px] mb-4 w-full bg-cover bg-center"
                  style={{
                    aspectRatio: "16 / 9",
                    backgroundImage: `url(${resource.thumbnail})`,
                  }}
                  aria-hidden
                />
              )}
              {resource.description && (
                <p className="text-[14px] leading-relaxed mb-4" style={{ color: "var(--text-2)" }}>
                  {resource.description}
                </p>
              )}
              <p className="text-[13px] mb-4" style={{ color: "var(--text-3)" }}>
                {resource.isDeepLink
                  ? "This platform doesn't let us embed their content. Click below to open the search on their site."
                  : "This resource doesn't support inline playback. Click below to open it on the original site."}
              </p>
            </div>
          )}
        </div>

        <footer
          className="flex items-center gap-2 px-4 md:px-5 py-3 flex-wrap"
          style={{ borderTop: "1px solid var(--border-1)" }}
        >
          <a
            href={resource.url}
            target="_blank"
            rel="noreferrer noopener"
            className="btn btn-primary"
          >
            Open on {resource.provider}
          </a>
          {resource.freeCertificate && (
            <span className="pill pill-g text-[11.5px]">Free certificate</span>
          )}
          {resource.tags && resource.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 ml-auto max-w-[60%] justify-end">
              {resource.tags.slice(0, 4).map((t) => (
                <span
                  key={t}
                  className="pill text-[11px]"
                  style={{ color: "var(--text-2)" }}
                >
                  {t}
                </span>
              ))}
            </div>
          )}
        </footer>
      </div>
    </div>
  );
}
