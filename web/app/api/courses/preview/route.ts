import { NextResponse } from "next/server";
import { getVerifiedUserForApi } from "@/lib/auth";
import { fetchCoursePagePreview } from "@/lib/courses/preview";
import { z } from "zod";
import { formatZodError } from "@/lib/validators";
import { rateLimit, clientKey, rateLimitHeaders } from "@/lib/security/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  url: z.string().url().max(2000),
});

export async function GET(req: Request) {
  const user = await getVerifiedUserForApi();
  if (user instanceof NextResponse) return user;

  const url = new URL(req.url);
  const parsed = schema.safeParse({ url: url.searchParams.get("url") ?? "" });
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: formatZodError(parsed.error) },
      { status: 400 },
    );
  }

  const lim = rateLimit(clientKey(req, `course-preview:${user.id}`), 25, 60_000);
  if (!lim.ok) {
    return NextResponse.json(
      { error: "Too many previews — slow down." },
      { status: 429, headers: rateLimitHeaders(lim) },
    );
  }

  const preview = await fetchCoursePagePreview(parsed.data.url);
  return NextResponse.json(preview, { headers: rateLimitHeaders(lim) });
}
