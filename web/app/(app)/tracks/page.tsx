import Link from "next/link";
import { store, findUserById, LIFE_CATEGORIES } from "@/lib/store";
import { requireVerifiedUser } from "@/lib/auth";
import { PageHeader } from "@/components/page-header";

export const dynamic = "force-dynamic";

// Built from LIFE_CATEGORIES so adding a new category in one place
// shows up here for free. "All" is prepended as a reset link.
const CATEGORIES = [
  { id: "all", label: "All" },
  ...LIFE_CATEGORIES.map((c) => ({ id: c.id, label: c.label })),
] as const;

export default async function TracksPage({ searchParams }: { searchParams: Promise<{ cat?: string; youth?: string }> }) {
  const sp = await searchParams;
  const user = await requireVerifiedUser();
  const cat = sp.cat || "all";
  const youthOnly = sp.youth === "1" || user.role === "teen";

  let tracks = [...store.tracks];
  if (cat !== "all") tracks = tracks.filter((t) => t.category === cat);
  if (youthOnly) tracks = tracks.filter((t) => t.youthFriendly);

  return (
    <div className="section-pad-x py-10">
      <PageHeader
        eyebrow="Skill Tracks"
        title={youthOnly ? "Youth Zone tracks" : "Learn a skill. Get hired."}
        subtitle="Free, verifiable tracks taught by working professionals. 3–8 weeks, start any time."
      />

      <div className="flex flex-wrap gap-2 mb-6">
        {CATEGORIES.map((c) => (
          <Link key={c.id} href={`/tracks?cat=${c.id}${youthOnly ? "&youth=1" : ""}`} className={`pill ${cat === c.id ? "pill-g" : ""}`}>
            {c.label}
          </Link>
        ))}
        {user.role !== "teen" && (
          <Link href={`/tracks?cat=${cat}${youthOnly ? "" : "&youth=1"}`} className={`pill ${youthOnly ? "pill-purple" : ""}`}>
            ★ Youth-friendly only
          </Link>
        )}
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tracks.map((t) => {
          const teacher = findUserById(t.teacherId);
          return (
            <Link key={t.slug} href={`/tracks/${t.slug}`} className="card card-hover p-5 flex flex-col">
              <div className="flex items-start justify-between mb-3">
                <div className="w-12 h-12 rounded-[12px] flex items-center justify-center text-[24px]" style={{ background: `rgba(${t.color},0.14)` }}>{t.heroEmoji}</div>
                <div className="flex flex-col items-end gap-1">
                  {t.youthFriendly && <span className="pill pill-purple">★ Youth</span>}
                  <span className="pill">{t.level}</span>
                </div>
              </div>
              <div className="font-display text-[18px] font-bold mb-1">{t.title}</div>
              <div className="text-[13px] text-t3 mb-4 flex-1">{t.summary}</div>
              <div className="flex items-center justify-between text-[12px] text-t3 mb-3">
                <span>{t.weeks} weeks · {t.modules.length} modules</span>
                <span className="text-g font-semibold">Hiring demand {"★".repeat(t.hiringDemand)}</span>
              </div>
              {teacher && (
                <div className="text-[12px] text-t2 border-t border-border1 pt-3">
                  Taught by <span className="font-semibold text-t1">{teacher.name}</span> · {teacher.credentials}
                </div>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
