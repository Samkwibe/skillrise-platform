import { NextResponse } from "next/server";
import { getVerifiedUserForApi } from "@/lib/auth";
import { searchFreeVideos } from "@/lib/services/search-service";
import { skillSearchSchema, formatZodError } from "@/lib/validators";
import { rateLimit, clientKey, rateLimitHeaders } from "@/lib/security/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const user = await getVerifiedUserForApi();
  if (user instanceof NextResponse) return user;

  const url = new URL(req.url);
  const parsed = skillSearchSchema.safeParse({
    q: url.searchParams.get("q") ?? "",
    max: url.searchParams.get("max") ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: formatZodError(parsed.error) },
      { status: 400 },
    );
  }

  const limit = rateLimit(clientKey(req, `search:${user.id}`), 40, 60_000);
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Too many searches — slow down." },
      { status: 429, headers: rateLimitHeaders(limit) },
    );
  }

  const result = await searchFreeVideos(parsed.data.q, parsed.data.max);

  return NextResponse.json(result, {
    headers: {
      ...rateLimitHeaders(limit),
      "Cache-Control": "private, max-age=30",
    },
  });
}
