"use client";

import { useRef, useState } from "react";
import { useToast } from "@/components/ui/toast";

/**
 * Studio drag-drop upload zone. UI-only for now — it simulates a multi-stage
 * upload and fires a toast when "complete". Swap the setTimeout chain for a
 * real tus/S3 multipart PUT when `POST /api/teach/upload/init` ships.
 */
export function UploadZone() {
  const [isOver, setIsOver] = useState(false);
  const [progress, setProgress] = useState<null | { name: string; pct: number; stage: string }>(null);
  const input = useRef<HTMLInputElement | null>(null);
  const toast = useToast();

  const start = (file: File) => {
    setProgress({ name: file.name, pct: 0, stage: "uploading" });
    let pct = 0;
    const tick = () => {
      pct = Math.min(100, pct + 6 + Math.random() * 8);
      const stage = pct < 60 ? "uploading" : pct < 95 ? "transcoding" : "publishing";
      setProgress({ name: file.name, pct, stage });
      if (pct >= 100) {
        setTimeout(() => {
          setProgress(null);
          toast.push({
            kind: "success",
            title: "Lesson uploaded",
            description: `${file.name} is transcoding. You'll be notified when it's ready to publish.`,
            actionLabel: "Open library",
            onAction: () => (window.location.href = "/teach"),
          });
        }, 500);
        return;
      }
      setTimeout(tick, 250 + Math.random() * 300);
    };
    setTimeout(tick, 200);
  };

  const accept = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const f = files[0];
    if (!/^(video|audio)\//.test(f.type) && !/\.(mp4|mov|webm|mp3|wav|m4a)$/i.test(f.name)) {
      toast.push({
        kind: "error",
        title: "Unsupported file",
        description: "Upload an mp4, mov, webm, mp3, wav, or m4a file.",
      });
      return;
    }
    start(f);
  };

  return (
    <div
      className="studio-panel studio-panel-strong overflow-hidden"
      onDragOver={(e) => {
        e.preventDefault();
        setIsOver(true);
      }}
      onDragLeave={() => setIsOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsOver(false);
        accept(e.dataTransfer.files);
      }}
      style={{
        background: isOver
          ? "color-mix(in srgb, var(--red) 10%, var(--surface-1))"
          : "var(--surface-1)",
        transition: "background 0.2s ease, border-color 0.2s ease",
        borderColor: isOver ? "var(--red)" : "var(--border-2)",
      }}
    >
      <div
        className="flex items-center justify-between px-4 h-[36px]"
        style={{ borderBottom: "1px solid var(--border-1)", background: "var(--surface-2)" }}
      >
        <div className="studio-label">UPLOAD · DRAG / DROP OR PICK</div>
        <div className="studio-label" style={{ color: "var(--text-3)" }}>
          MP4 · MOV · WEBM · MP3 · WAV
        </div>
      </div>

      {progress ? (
        <div className="p-5">
          <div className="studio-label mb-2">
            {progress.stage.toUpperCase()} — {progress.name}
          </div>
          <div
            className="h-3 rounded-[4px] overflow-hidden"
            style={{ background: "var(--surface-2)" }}
          >
            <div
              className="h-full transition-all"
              style={{
                width: `${progress.pct}%`,
                background:
                  progress.stage === "publishing"
                    ? "linear-gradient(90deg, var(--g), var(--g-hover))"
                    : progress.stage === "transcoding"
                      ? "linear-gradient(90deg, var(--amber), var(--red))"
                      : "linear-gradient(90deg, var(--red), var(--amber))",
              }}
            />
          </div>
          <div
            className="studio-metric text-[11px] mt-1.5 flex items-center justify-between"
            style={{ color: "var(--text-3)" }}
          >
            <span>{Math.round(progress.pct)}%</span>
            <span className="capitalize">{progress.stage}…</span>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => input.current?.click()}
          className="w-full p-8 text-center cursor-pointer focus:outline-none"
        >
          <div className="studio-metric text-[32px] mb-1" style={{ color: isOver ? "var(--red)" : "var(--text-3)" }}>
            {isOver ? "◉" : "⬆"}
          </div>
          <div className="text-[14px] font-semibold" style={{ color: "var(--text-1)" }}>
            {isOver ? "Release to upload" : "Drop a lesson file here"}
          </div>
          <div className="studio-label mt-1.5" style={{ color: "var(--text-3)" }}>
            OR CLICK TO BROWSE — MAX 2GB
          </div>
        </button>
      )}
      <input
        ref={input}
        type="file"
        accept="video/*,audio/*"
        className="hidden"
        onChange={(e) => accept(e.target.files)}
      />
    </div>
  );
}
