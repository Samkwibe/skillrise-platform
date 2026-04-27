import { NextResponse, type NextRequest } from "next/server";
import { securityHeaders } from "@/lib/security/headers";

export function proxy(req: NextRequest) {
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-skillrise-pathname", req.nextUrl.pathname);
  const res = NextResponse.next({ request: { headers: requestHeaders } });
  const headers = securityHeaders();
  for (const [key, value] of Object.entries(headers)) {
    res.headers.set(key, value);
  }
  // Pass client hints for rate-limit keying downstream.
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    req.headers.get("x-real-ip") ||
    "";
  if (ip) res.headers.set("x-client-ip", ip);
  return res;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|favicon.svg|public/).*)",
  ],
};
