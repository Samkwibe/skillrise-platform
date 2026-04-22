import { NextResponse } from "next/server";
import { getVerifiedUserForApi } from "@/lib/auth";
import { searchAllResources } from "@/lib/resources/search";
import { rateLimit } from "@/lib/security/rate-limit";

export const dynamic = "force-dynamic";

/**
 * GET /api/resources/search?q=...&limit=...&language=en
 *
 * Unified learning-resource search across every configured provider.
 * Returns the flat merged list plus a per-provider breakdown so the UI
 * can show filter pill counts and — for admin/employer — any provider
 * errors for diagnostics.
 */
export async function GET(req: Request) {
  const user = await getVerifiedUserForApi();
  if (user instanceof NextResponse) return user;

  // Gentle rate limit — these calls fan out to several upstreams, so we
  // never want a tight refetch loop from the client.
  const ip = req.headers.get("x-client-ip") || "anon";
  const rl = rateLimit(`resources:search:${user.id}:${ip}`, 30, 60_000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Too many searches. Slow down a touch." },
      { status: 429 },
    );
  }

  const url = new URL(req.url);
  const q = (url.searchParams.get("q") || "").trim();
  if (!q) return NextResponse.json({ items: [], byProvider: [] });
  const limit = Math.min(
    Math.max(Number(url.searchParams.get("limit") || 8), 1),
    16,
  );
  const language = (url.searchParams.get("language") || "en").slice(0, 5);

  const result = await searchAllResources({ query: q, limit, language });

  // Only surface error details to admin-ish roles. Regular learners see
  // the merged items + count, nothing about why a provider failed.
  const seeDiagnostics =
    user.role === "admin" || user.role === "employer" || user.role === "school";
  return NextResponse.json({
    items: result.items,
    byProvider: seeDiagnostics
      ? result.byProvider
      : result.byProvider.map(({ provider, count, configured }) => ({
          provider,
          count,
          configured,
        })),
    note: result.note,
  });
}
