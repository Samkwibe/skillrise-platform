import { getDb } from "@/lib/db";
import type { FeedPost } from "@/lib/store";

/** Writes a full post to the DB (Mongo/Dynamo) so likes/comments survive cold starts. */
export async function persistFeedPost(post: FeedPost): Promise<void> {
  const db = getDb();
  if (db.kind === "memory") return;
  await db.ready();
  await db.putFeedPost(post);
}
