"use client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";

export function ModulePlayer({
  trackSlug,
  moduleId,
  title,
  done,
  nextHref,
  nextLabel,
}: {
  trackSlug: string;
  moduleId: string;
  title: string;
  transcript: string;
  done: boolean;
  nextHref: string;
  nextLabel: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [marked, setMarked] = useState(done);
  const [cert, setCert] = useState<string | null>(null);

  return (
    <div className="card overflow-hidden">
      <div className="relative aspect-video bg-gradient-to-br from-[#0d2a1c] to-[#071a10] flex items-center justify-center">
        <div className="absolute inset-0 opacity-20" style={{ background: "radial-gradient(circle at center, rgba(31,200,126,0.35), transparent 60%)" }} />
        <div className="relative text-center px-6">
          <div className="text-[48px] mb-2">▶</div>
          <div className="font-display text-[18px] font-bold">{title}</div>
          <div className="text-[12px] text-t3 mt-1">Demo player — plug in Cloudflare Stream in production</div>
        </div>
      </div>
      <div className="p-5 flex flex-wrap items-center gap-3 justify-between">
        <div className="text-[13px] text-t2">
          {marked ? "Module complete." : "When you've watched the whole thing, mark it done."}
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            disabled={busy || marked}
            onClick={async () => {
              setBusy(true);
              const res = await fetch("/api/progress", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ trackSlug, moduleId }),
              });
              const body = await res.json();
              setBusy(false);
              if (res.ok) {
                setMarked(true);
                if (body.certificate) setCert(body.certificate.id);
                router.refresh();
              }
            }}
            className="btn btn-ghost btn-sm"
          >
            {marked ? "✓ Done" : busy ? "Saving…" : "Mark complete"}
          </button>
          <Link href={cert ? `/cert/${cert}` : nextHref} className="btn btn-primary btn-sm">
            {cert ? "See certificate →" : `${nextLabel} →`}
          </Link>
        </div>
      </div>
    </div>
  );
}
