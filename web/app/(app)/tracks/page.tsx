import Link from "next/link";
import { store, LIFE_CATEGORIES } from "@/lib/store";
import { requireVerifiedUser } from "@/lib/auth";
import { TracksBrowseSections } from "@/components/learner/tracks-browse-sections";

export const dynamic = "force-dynamic";

const CATEGORIES = [
  { id: "all", label: "All" },
  ...LIFE_CATEGORIES.map((c) => ({ id: c.id, label: c.label })),
] as const;

export default async function TracksPage({ searchParams }: { searchParams: Promise<{ cat?: string; youth?: string }> }) {
  const sp = await searchParams;
  const user = await requireVerifiedUser();
  const cat = sp.cat || "all";
  const youthOnly = sp.youth === "1" || user.role === "teen";

  let baseTracks = [...store.tracks];
  if (cat !== "all") baseTracks = baseTracks.filter((t) => t.category === cat);
  if (youthOnly) baseTracks = baseTracks.filter((t) => t.youthFriendly);

  return (
    <div className="min-h-screen bg-slate-50 pb-16">
      <div className="bg-gradient-to-b from-blue-50 to-slate-50 border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 md:py-12">
          <p className="text-sm font-bold uppercase tracking-widest text-blue-800 mb-2">Free courses</p>
          <h1
            className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-2"
            style={{ fontFamily: "var(--role-font-display), system-ui, sans-serif" }}
          >
            {youthOnly ? "Youth Zone courses" : "Learn skills that get you hired"}
          </h1>
          <p className="text-slate-600 text-base max-w-2xl">
            Browse like Udemy or Coursera: ratings, save for later, and clear paths. All courses listed here are free
            to start.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6">
        <div className="flex flex-wrap gap-2 mb-2 overflow-x-auto pb-1 scrollbar-thin">
          {CATEGORIES.map((c) => (
            <Link
              key={c.id}
              href={`/tracks?cat=${c.id}${youthOnly ? "&youth=1" : ""}`}
              className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold border transition-colors ${
                cat === c.id
                  ? "bg-blue-600 text-white border-blue-600 shadow"
                  : "bg-white text-slate-700 border-slate-200 hover:border-blue-300"
              }`}
            >
              {c.label}
            </Link>
          ))}
          {user.role !== "teen" && (
            <Link
              href={`/tracks?cat=${cat}${youthOnly ? "" : "&youth=1"}`}
              className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold border ${
                youthOnly ? "bg-violet-600 text-white border-violet-600" : "bg-white text-slate-700 border-slate-200"
              }`}
            >
              ★ Youth-friendly only
            </Link>
          )}
        </div>
        <p className="text-sm text-slate-500 mb-8">
          <Link href="/discover" className="font-semibold text-blue-700 hover:underline">
            Education reels
          </Link>
          <span className="mx-2">·</span>
          Short lessons in a full-screen, LinkedIn-style scroll — only learning content.
        </p>
      </div>

      <TracksBrowseSections user={user} baseTracks={baseTracks} allTracks={store.tracks} youthOnly={youthOnly} />
    </div>
  );
}
