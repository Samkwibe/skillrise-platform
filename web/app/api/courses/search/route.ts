import { NextResponse } from "next/server";
import { getVerifiedUserForApi } from "@/lib/auth";
import { searchFreeCourses } from "@/lib/courses/search";
import type { CourseProviderId } from "@/lib/courses/types";
import { courseSearchSchema, formatZodError } from "@/lib/validators";
import { rateLimit, clientKey, rateLimitHeaders } from "@/lib/security/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function parseProviders(s: string | undefined): CourseProviderId[] | undefined {
  if (!s?.trim()) return undefined;
  const allowed = new Set<CourseProviderId>([
    "coursera",
    "openlibrary",
    "mit",
    "khan",
    "youtube",
    "simplilearn",
  ]);
  const parts = s
    .split(",")
    .map((p) => p.trim().toLowerCase())
    .filter(Boolean) as CourseProviderId[];
  const out = parts.filter((p) => allowed.has(p));
  return out.length ? out : undefined;
}

export async function GET(req: Request) {
  const user = await getVerifiedUserForApi();
  if (user instanceof NextResponse) return user;

  const url = new URL(req.url);
  const parsed = courseSearchSchema.safeParse({
    q: url.searchParams.get("q") ?? "",
    limit: url.searchParams.get("limit") ?? undefined,
    providers: url.searchParams.get("providers") ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: formatZodError(parsed.error) },
      { status: 400 },
    );
  }

  const limit = rateLimit(clientKey(req, `courses-search:${user.id}`), 30, 60_000);
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Too many searches — slow down." },
      { status: 429, headers: rateLimitHeaders(limit) },
    );
  }

  const result = await searchFreeCourses({
    query: parsed.data.q,
    limit: parsed.data.limit,
    providers: parseProviders(parsed.data.providers),
  });

  return NextResponse.json(result, {
    headers: {
      ...rateLimitHeaders(limit),
      "Cache-Control": "private, max-age=60",
    },
  });
}
