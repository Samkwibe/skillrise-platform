const YT_ID = "([A-Za-z0-9_-]{6,})";

/**
 * Extract a YouTube video id from common URL shapes (watch, short, live, music, mobile).
 */
export function extractYoutubeVideoId(input: string): string | null {
  const u = input.trim();
  if (!u) return null;
  // youtu.be/ID
  let m = new RegExp(`^https?://(?:www\\.)?youtu\\.be/${YT_ID}`, "i").exec(u);
  if (m?.[1]) return m[1];

  // v= in query (watch, /watch/, music.youtube.com, m.youtube.com, shorts sometimes as path)
  m = new RegExp(`[?&]v=${YT_ID}`).exec(u);
  if (m?.[1] && /youtube\.com|youtube-nocookie\.com/i.test(u)) return m[1];

  // /embed/ID, /shorts/ID, /live/ID
  m = new RegExp(
    `youtube(?:-nocookie)?\\.com\\/(?:embed|shorts|live)/${YT_ID}`,
    "i",
  ).exec(u);
  if (m?.[1]) return m[1];

  m = new RegExp(`^https?://m\\.youtube\\.com/watch\\?v=${YT_ID}`, "i").exec(u);
  if (m?.[1]) return m[1];

  m = new RegExp(`^https?://music\\.youtube\\.com/watch\\?v=${YT_ID}`, "i").exec(u);
  if (m?.[1]) return m[1];

  // Legacy: single-line combined pattern
  const leg =
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube-nocookie\.com\/embed\/)([A-Za-z0-9_-]{6,})/.exec(
      u,
    );
  return leg?.[1] ?? null;
}
