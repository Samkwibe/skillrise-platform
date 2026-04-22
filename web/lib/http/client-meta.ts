export function clientIp(req: Request): string | undefined {
  const h = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip");
  if (h) return h.split(",")[0]?.trim() || undefined;
  return undefined;
}

export function clientUserAgent(req: Request): string | undefined {
  return req.headers.get("user-agent") || undefined;
}
