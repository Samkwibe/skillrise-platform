export function securityHeaders(): Record<string, string> {
  const isProd = process.env.NODE_ENV === "production";
  const csp = [
    "default-src 'self'",
    "base-uri 'self'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data: https://fonts.gstatic.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    `script-src 'self'${isProd ? "" : " 'unsafe-eval' 'unsafe-inline'"} 'unsafe-inline' blob: https://www.youtube.com https://s.ytimg.com`,
    "connect-src 'self' https: wss:",
    // Educational embeds (skill search iframe + react-player: YouTube, Vimeo, etc.)
    "frame-src 'self' https://www.youtube.com https://www.youtube-nocookie.com https://player.vimeo.com https://www.dailymotion.com",
    "frame-ancestors 'none'",
    "form-action 'self'",
    "object-src 'none'",
  ].join("; ");

  return {
    "Content-Security-Policy": csp,
    "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=()",
    "X-DNS-Prefetch-Control": "on",
  };
}
