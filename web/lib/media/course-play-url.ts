import { extractYoutubeVideoId } from "@/lib/courses/youtube-util";

/**
 * Decide if the learning workspace can use react-player, or only “open in new tab”.
 * Coursera / generic catalog pages are not stream URLs — those stay external.
 */
export function resolveCoursePlayTarget(
  courseUrl: string,
  initVideoId?: string | null,
):
  | { kind: "player"; playUrl: string }
  | { kind: "external" } {
  const yid = (initVideoId && initVideoId.trim()) || extractYoutubeVideoId(courseUrl);
  if (yid) {
    return { kind: "player", playUrl: `https://www.youtube.com/watch?v=${yid}` };
  }
  if (/vimeo\.com\//i.test(courseUrl) || /player\.vimeo\.com\//i.test(courseUrl)) {
    return { kind: "player", playUrl: courseUrl };
  }
  if (/(?:^https?:\/\/).*\.(mp4|webm|m3u8|ogg)(\?|$)/i.test(courseUrl)) {
    return { kind: "player", playUrl: courseUrl };
  }
  return { kind: "external" };
}
