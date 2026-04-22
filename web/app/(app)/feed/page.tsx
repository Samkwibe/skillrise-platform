import { requireVerifiedUser } from "@/lib/auth";
import { store, findUserById, LIFE_CATEGORIES } from "@/lib/store";
import { PageHeader } from "@/components/page-header";
import { FeedItem } from "@/components/feed-item";
import { FeedCategoryPills } from "@/components/feed-category-pills";

export const dynamic = "force-dynamic";

/**
 * /feed — the "every swipe teaches something" surface.
 * Every post has a LifeCategory and (ideally) a one-line takeaway.
 * Teens see only teen-safe posts. Non-teens can filter by category pills.
 */
export default async function FeedPage({
  searchParams,
}: {
  searchParams: Promise<{ cat?: string }>;
}) {
  const user = await requireVerifiedUser();
  const sp = await searchParams;
  const cat = sp.cat || "all";

  const teen = user.role === "teen";
  const canSave = user.role === "learner" || user.role === "teen";
  let posts = [...store.feed]
    .filter((p) => (teen ? p.youth : true))
    .sort((a, b) => b.createdAt - a.createdAt);
  if (cat !== "all") posts = posts.filter((p) => p.category === cat);

  const visibleCats = LIFE_CATEGORIES.filter((c) => (teen ? c.forTeens : true));

  return (
    <div className="section-pad-x py-8 md:py-10">
      <PageHeader
        eyebrow="SkillFeed"
        title="30-second lessons. Every scroll teaches something."
        subtitle="Replace the endless scroll with something you can actually use. Filter to what you need."
      />
      <div className="max-w-[720px] mx-auto">
        <FeedCategoryPills current={cat} categories={visibleCats} />
        <div className="flex flex-col gap-4">
          {posts.length === 0 ? (
            <div className="cover-card p-6 text-center text-[14px]" style={{ color: "var(--text-2)" }}>
              Nothing here yet in this category. Try another.
            </div>
          ) : (
            posts.map((p) => {
              const author = findUserById(p.authorId);
              if (!author) return null;
              const category = LIFE_CATEGORIES.find((c) => c.id === p.category);
              const initialSaved = canSave && Boolean(p.savedBy?.includes(user.id));
              return (
                <FeedItem
                  key={p.id}
                  post={p}
                  author={author}
                  category={category ?? null}
                  canSave={canSave}
                  initialSaved={initialSaved}
                />
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
