/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * YouTube IFrame API loader + queue (API allows only one global onYouTubeIframeAPIReady).
 */
const queue: (() => void)[] = [];

function flush() {
  const copy = queue.splice(0, queue.length);
  copy.forEach((fn) => {
    try {
      fn();
    } catch {
      // ignore
    }
  });
}

function ensureOnReady() {
  if (typeof window === "undefined") return;
  const w = window as any;
  if (w.__srYtReadyChain) return;
  w.__srYtReadyChain = true;
  const prev = w.onYouTubeIframeAPIReady;
  w.onYouTubeIframeAPIReady = () => {
    prev?.();
    flush();
  };
}

export function loadYouTubeIframeApi(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  const w = window as any;
  if (w.YT?.Player) return Promise.resolve();
  ensureOnReady();
  return new Promise((resolve) => {
    const tick = () => {
      if (w.YT?.Player) resolve();
    };
    queue.push(tick);
    if (w.YT?.Player) {
      tick();
      return;
    }
    if (document.querySelector('script[data-sr-yt-iframe="1"]')) {
      const t = setInterval(() => {
        if (w.YT?.Player) {
          clearInterval(t);
          resolve();
        }
      }, 100);
      setTimeout(() => clearInterval(t), 15_000);
      return;
    }
    const tag = document.createElement("script");
    tag.setAttribute("data-sr-yt-iframe", "1");
    tag.src = "https://www.youtube.com/iframe_api";
    const first = document.getElementsByTagName("script")[0];
    first?.parentNode?.insertBefore(tag, first);
  });
}

export type YTPlayerInstance = {
  destroy: () => void;
  getCurrentTime: () => number;
  getDuration: () => number;
  seekTo: (s: number, a?: boolean) => void;
};

export async function createYTPlayer(
  el: HTMLElement,
  videoId: string,
  onReady: (p: YTPlayerInstance) => void,
  onError?: (e: unknown) => void,
) {
  await loadYouTubeIframeApi();
  const w = window as any;
  if (!w.YT?.Player) {
    onError?.(new Error("YouTube IFrame API unavailable"));
    return;
  }
  new w.YT.Player(el, {
    videoId,
    width: "100%",
    height: "100%",
    playerVars: {
      rel: 0,
      modestbranding: 1,
      playsinline: 1,
      enablejsapi: 1,
      origin: window.location.origin,
    },
    events: {
      onReady: (e: { target: YTPlayerInstance }) => {
        onReady(e.target);
      },
    },
  });
}
