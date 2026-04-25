import { getDb } from "@/lib/db";
import { store } from "@/lib/store";

/**
 * Merges persisted SkillFeed posts from MongoDB/DynamoDB into `store.feed` (after seed).
 * Idempotent. No-op when DATA_STORE=memory.
 */
export async function ensureFeedFromDatabase(): Promise<void> {
  const db = getDb();
  if (db.kind === "memory") return;
  try {
    await db.ready();
    const rows = await db.listFeedPosts();
    for (const p of rows) {
      if (!store.feed.some((x) => x.id === p.id)) {
        store.feed.push(p);
      }
    }
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error("[feed] ensureFeedFromDatabase failed; using seed + in-process posts only", e);
  }
}
