/**
 * Runs once per Node server process. Loads persisted `Track` documents into `store` when using MongoDB/DynamoDB.
 * See `lib/course/ensure-tracks.ts`.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { ensureTracksFromDatabase } = await import("@/lib/course/ensure-tracks");
    await ensureTracksFromDatabase();
  }
}
