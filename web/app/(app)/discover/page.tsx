import Link from "next/link";
import { requireVerifiedUser } from "@/lib/auth";
import { store, findUserById, LIFE_CATEGORIES, type LifeCategory } from "@/lib/store";
import { EducationReels } from "@/components/learner/education-reels";

export const dynamic = "force-dynamic";

export default async function DiscoverPage({
  searchParams,
}: {
  searchParams: Promise<{ cat?: string }>;
}) {
  const user = await requireVerifiedUser();
  const sp = await searchParams;
  const cat = sp.cat || "all";
  const teen = user.role === "teen";
  let posts = [...store.feed].filter((p) => (teen ? p.youth : true));
  if (cat !== "all") posts = posts.filter((p) => p.category === (cat as LifeCategory));
  posts = posts.sort((a, b) => b.createdAt - a.createdAt);
  const visibleCats = LIFE_CATEGORIES.filter((c) => (teen ? c.forTeens : true));
  const canCreatePost =
    user.role === "learner" || user.role === "teen" || user.role === "teacher" || user.role === "admin";

  const items = posts
    .map((post) => {
      const author = findUserById(post.authorId);
      if (!author) return null;
      const category = LIFE_CATEGORIES.find((c) => c.id === post.category);
      return { post, author, label: category?.label ?? "Learning", emoji: category?.emoji ?? "📖" };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);

  return (
    <div className="min-h-screen bg-slate-950">
      <div className="sticky top-0 z-20 border-b border-white/10 bg-slate-900/90 backdrop-blur text-white">
        <div className="max-w-3xl mx-auto px-3 py-3 flex flex-wrap items-center gap-2">
          <Link href="/tracks" className="text-sm text-white/80 hover:text-white">
            ← Courses
          </Link>
          <span className="text-white/30">|</span>
          <span className="text-sm font-bold">Education reels</span>
          {canCreatePost && (
            <Link href="/feed" className="ml-auto text-sm font-semibold text-sky-400 hover:text-sky-300">
              + New post
            </Link>
          )}
        </div>
        <div className="max-w-3xl mx-auto px-2 pb-2 flex gap-1 overflow-x-auto">
          <Link
            href="/discover"
            className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${
              cat === "all" ? "bg-white text-slate-900" : "bg-white/10 text-white"
            }`}
          >
            All
          </Link>
          {visibleCats.map((c) => (
            <Link
              key={c.id}
              href={`/discover?cat=${c.id}`}
              className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${
                cat === c.id ? "bg-white text-slate-900" : "bg-white/10 text-white"
              }`}
            >
              {c.emoji} {c.label}
            </Link>
          ))}
        </div>
      </div>
      <EducationReels items={items} />
    </div>
  );
}
