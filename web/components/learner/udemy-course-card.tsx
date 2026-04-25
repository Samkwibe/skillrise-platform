import Link from "next/link";
import type { Track, User } from "@/lib/store";
import { WishlistHeartButton } from "./wishlist-heart-button";

export type CourseCardModel = {
  track: Track;
  teacher: User | null;
  enrollmentCount: number;
  averageRating: number;
  reviewCount: number;
  durationLabel: string;
  /** Display badges e.g. Bestseller, Top rated, Free */
  badges: string[];
  wishlisted: boolean;
  showWishlist: boolean;
};

function Stars({ value }: { value: number }) {
  const full = Math.round(value);
  return (
    <div className="flex items-center gap-0.5 text-amber-500" aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} className="text-[14px]">
          {i <= full ? "★" : "☆"}
        </span>
      ))}
    </div>
  );
}

export function UdemyCourseCard(m: CourseCardModel) {
  const { track, teacher, enrollmentCount, averageRating, reviewCount, durationLabel, badges, wishlisted, showWishlist } = m;
  const href = `/tracks/${encodeURIComponent(track.slug)}`;

  return (
    <div
      className="group flex h-full flex-col overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
    >
      <Link href={href} className="block shrink-0">
        <div
          className="relative aspect-[16/9] w-full overflow-hidden bg-slate-100"
          style={{
            background: `linear-gradient(135deg, rgba(${track.color},0.35), rgba(${track.color},0.08) 55%, #f8fafc)`,
          }}
        >
          <div className="absolute inset-0 flex items-center justify-center text-6xl drop-shadow-sm transition-transform duration-200 group-hover:scale-105">
            {track.heroEmoji}
          </div>
          <div className="absolute bottom-2 left-2 right-2 flex flex-wrap gap-1">
            {badges.map((b) => (
              <span
                key={b}
                className="rounded bg-white/90 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-800 shadow"
              >
                {b}
              </span>
            ))}
          </div>
        </div>
      </Link>

      <div className="flex flex-1 flex-col p-4">
        <div className="mb-2 flex items-start justify-between gap-2">
          <div className="min-w-0">
            {averageRating > 0 && reviewCount > 0 ? (
              <div className="mb-1 flex items-center gap-2 text-[13px] text-slate-700">
                <Stars value={averageRating} />
                <span className="font-semibold">{averageRating.toFixed(1)}</span>
                <span className="text-slate-500">({reviewCount.toLocaleString()})</span>
              </div>
            ) : (
              <div className="mb-1 text-[12px] text-slate-500">New course</div>
            )}
            <Link href={href} className="line-clamp-2 text-base font-bold leading-snug text-slate-900 hover:text-blue-700">
              {track.title}
            </Link>
            {teacher && (
              <div className="mt-1 text-[13px] text-slate-600">
                By <span className="font-medium text-slate-800">{teacher.name}</span>
              </div>
            )}
          </div>
        </div>

        <p className="mb-3 line-clamp-2 flex-1 text-[13px] text-slate-600">{track.summary}</p>

        <div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-slate-500">
          <span>🕐 {durationLabel}</span>
          <span>📚 {track.modules.length} lessons</span>
          <span>👤 {enrollmentCount.toLocaleString()} enrolled</span>
        </div>

        <div className="mt-auto flex items-center justify-between gap-2 border-t border-slate-100 pt-3">
          <span className="text-lg font-bold text-emerald-600">Free</span>
          {showWishlist ? (
            <WishlistHeartButton trackSlug={track.slug} initialSaved={wishlisted} />
          ) : (
            <Link href={href} className="text-[13px] font-semibold text-blue-700 hover:underline">
              View course →
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
