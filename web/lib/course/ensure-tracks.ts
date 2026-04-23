import { getDb } from "@/lib/db";
import { getTrack, store, type Track } from "@/lib/store";

let hydrationDone = false;
let hydrationPromise: Promise<void> | null = null;

/**
 * Merges persisted tracks from MongoDB/DynamoDB into the in-memory `store.tracks`
 * (seed runs first at module load; DB overwrites by `slug` when present).
 * No-op when DATA_STORE=memory. Idempotent and safe to call on every request.
 */
export async function ensureTracksFromDatabase(): Promise<void> {
  if (hydrationDone) return;
  if (hydrationPromise) return await hydrationPromise;

  const db = getDb();
  if (db.kind === "memory") {
    hydrationDone = true;
    return;
  }

  hydrationPromise = (async () => {
    try {
      await db.ready();
      const rows = await db.listTracks();
      mergeDbTracksIntoStore(rows);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error("[tracks] ensureTracksFromDatabase failed; using seed data only", e);
    } finally {
      hydrationDone = true;
      hydrationPromise = null;
    }
  })();

  return await hydrationPromise;
}

function mergeDbTracksIntoStore(rows: Track[]) {
  for (const t of rows) {
    if (!t?.slug) continue;
    const i = store.tracks.findIndex((x) => x.slug === t.slug);
    if (i >= 0) store.tracks[i] = t;
    else store.tracks.push(t);
  }
}

/**
 * After hydration, use this from server code instead of `getTrack` when you are unsure
 * layout/instrumentation already ran (e.g. some API routes).
 */
export async function getTrackLoaded(slug: string): Promise<Track | undefined> {
  await ensureTracksFromDatabase();
  return getTrack(slug);
}
