import type { CourseProviderId } from "@/lib/courses/types";

const EMOJI: Record<CourseProviderId, string> = {
  coursera: "🎓",
  openlibrary: "📖",
  mit: "🧪",
  khan: "🧮",
  youtube: "▶️",
  simplilearn: "✨",
  udemy: "🦉",
};

const LABEL: Record<CourseProviderId, string> = {
  coursera: "Coursera",
  openlibrary: "Open Library",
  mit: "MIT OCW",
  khan: "Khan",
  youtube: "YouTube",
  simplilearn: "Simplilearn",
  udemy: "Udemy",
};

export function ProviderMark({
  id,
  size = "md",
}: {
  id: CourseProviderId;
  size?: "sm" | "md";
}) {
  const s = EMOJI[id];
  return (
    <span
      className={`inline-flex items-center justify-center rounded-[10px] font-bold bg-s2 border border-border1 ${
        size === "sm" ? "w-7 h-7" : "w-9 h-9"
      } text-[16px] leading-none`}
      title={LABEL[id]}
      aria-label={LABEL[id]}
    >
      {s}
    </span>
  );
}

export function providerLabel(id: CourseProviderId): string {
  return LABEL[id] ?? id;
}
