/** Extract a YouTube watch id from common URL shapes. */
export function extractYoutubeVideoId(input: string): string | null {
  const u = input.trim();
  const m =
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube-nocookie\.com\/embed\/)([A-Za-z0-9_-]{6,})/.exec(
      u,
    );
  return m?.[1] ?? null;
}
