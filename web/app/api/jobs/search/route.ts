import { NextResponse } from "next/server";
import { getVerifiedUserForApi } from "@/lib/auth";
import { searchAllJobs } from "@/lib/jobs/search";
import { rateLimit, clientKey, rateLimitHeaders } from "@/lib/security/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/jobs/search?q=...&location=...&limit=...
 *
 * Fans out to every configured free jobs provider (Remotive, Adzuna,
 * USAJobs) plus optional Apify, merges the results, and caches the
 * merged payload for ~8h in DynamoDB.
 *
 *   - Remotive runs without any API key.
 *   - Adzuna / USAJobs / Apify each light up as you add their keys to
 *     web/.env.local. The platform degrades gracefully if any are missing.
 *   - Teens are blocked from job search — that UX lives on /dashboard.
 *   - Employers + schools get the detailed per-provider breakdown so
 *     they can see which integrations are live.
 */
export async function GET(req: Request) {
  const user = await getVerifiedUserForApi();
  if (user instanceof NextResponse) return user;
  if (user.role === "teen") {
    return NextResponse.json(
      { error: "Job search is not available on teen accounts." },
      { status: 403 },
    );
  }

  const limit = rateLimit(clientKey(req, `jobs:${user.id}`), 30, 60_000);
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Too many searches — slow down." },
      { status: 429, headers: rateLimitHeaders(limit) },
    );
  }

  const url = new URL(req.url);
  const q = (url.searchParams.get("q") ?? "").trim().slice(0, 120);
  const location = (url.searchParams.get("location") ?? "").trim().slice(0, 120);
  const country = (url.searchParams.get("country") ?? "").trim().toLowerCase().slice(0, 4);
  const lim = Math.min(Math.max(Number(url.searchParams.get("limit") || 20), 1), 40);

  if (!q) {
    return NextResponse.json({ jobs: [], note: "Provide a `q` parameter." }, { status: 400 });
  }

  const result = await searchAllJobs({
    query: q,
    location,
    country: country || undefined,
    limit: lim,
  });

  // Only expose the provider breakdown + raw error strings to roles that
  // manage configuration. Learners see a simple, friendly payload.
  const exposeDiagnostics = user.role === "employer" || user.role === "school" || user.role === "admin";

  return NextResponse.json(
    {
      jobs: result.jobs,
      query: q,
      location,
      note: result.note,
      ...(exposeDiagnostics ? { byProvider: result.byProvider } : {}),
    },
    {
      headers: { ...rateLimitHeaders(limit), "Cache-Control": "private, max-age=60" },
    },
  );
}
