/**
 * Coursera for Business OAuth2 (dev.coursera.com) — org-scoped programs.
 * This is NOT a global public catalog: it returns courses tied to your org.
 * We merge these with HTML search so users still see the full public catalog.
 *
 * Token endpoint: https://api.coursera.com/oauth2/client_credentials/token
 * Basic auth: Base64(`{clientId}:{clientSecret}`) per official curl examples.
 *
 * If you see `invalid_client`, open dev.coursera.com → Apps → confirm the key
 * and that your app has the right API products enabled.
 */
import type { FreeCourse } from "./types";
import { stableCourseId } from "./ids";

const TOKEN = "https://api.coursera.com/oauth2/client_credentials/token";

export type CourseraTokenResult = { ok: true; token: string } | { ok: false; error: string; status: number };

export async function getCourseraAccessToken(): Promise<CourseraTokenResult> {
  const id = process.env.COURSERA_CLIENT_ID?.trim();
  const sec = process.env.COURSERA_CLIENT_SECRET?.trim();
  if (!id || !sec) {
    return { ok: false, error: "COURSERA_CLIENT_ID or COURSERA_CLIENT_SECRET not set", status: 0 };
  }

  const basic = Buffer.from(`${id}:${sec}`).toString("base64");
  try {
    const res = await fetch(TOKEN, {
      method: "POST",
      headers: {
        Authorization: `Basic ${basic}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({ grant_type: "client_credentials" }),
      cache: "no-store",
    });
    const text = await res.text();
    if (!res.ok) {
      return { ok: false, error: text.slice(0, 200), status: res.status };
    }
    const data = JSON.parse(text) as { access_token?: string };
    if (!data.access_token) {
      return { ok: false, error: "No access_token in response", status: res.status };
    }
    return { ok: true, token: data.access_token };
  } catch (e) {
    return { ok: false, error: (e as Error).message, status: 0 };
  }
}

/**
 * Fetches org programs and filters by query in the title. Shapes differ by API
 * version — we defensively read common field names.
 */
export async function searchCourseraOrgPrograms(query: string, limit: number): Promise<FreeCourse[]> {
  const bid =
    process.env.COURSERA_ORGANIZATION_ID?.trim() || process.env.COURSERA_BUSINESS_ID?.trim();
  if (!bid) {
    return [];
  }

  const t = await getCourseraAccessToken();
  if (!t.ok) {
    return [];
  }

  const url = `https://api.coursera.com/ent/api/businesses.v1/${encodeURIComponent(bid)}/programs`;
  try {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${t.token}`, Accept: "application/json" },
      cache: "no-store",
    });
    if (!res.ok) return [];
    const data = (await res.json()) as { elements?: unknown[]; data?: { elements?: unknown[] } };
    const raw = data.elements ?? data.data?.elements ?? [];
    const q = query.toLowerCase();
    const out: FreeCourse[] = [];

    for (const el of raw) {
      if (out.length >= limit) break;
      const row = el as Record<string, unknown>;
      const name =
        (row.name as string) ||
        (row.programName as string) ||
        (row.title as string) ||
        (row.courseName as string) ||
        "";
      if (
        q.length > 1 &&
        !name.toLowerCase().includes(q) &&
        !q.split(/\s+/).some((w) => w.length > 1 && name.toLowerCase().includes(w))
      ) {
        continue;
      }
      const slug = typeof row.slug === "string" ? row.slug : "";
      const link = slug ? `https://www.coursera.org/learn/${slug}` : "";
      const u =
        (row.url as string) ||
        (row.homeLink as string) ||
        (row.courseraUrl as string) ||
        link ||
        "";
      if (!u || !u.startsWith("http")) continue;
      out.push({
        id: stableCourseId("coursera", u),
        provider: "coursera",
        title: name || "Program",
        description: typeof row.description === "string" ? row.description.slice(0, 300) : undefined,
        url: u,
        imageUrl: typeof row.imageUrl === "string" ? row.imageUrl : undefined,
        freeCertificateHint: true,
        format: "Org program (Coursera API)",
        byline: "From your organization catalog",
      });
    }
    // If OAuth worked but the query didn’t match org rows, return first programs anyway.
    if (out.length === 0) {
      for (const el of raw.slice(0, limit)) {
        const row = el as Record<string, unknown>;
        const name = ((row.name as string) || (row.title as string) || "Program").trim();
        const slug = typeof row.slug === "string" ? row.slug : "";
        const link = slug ? `https://www.coursera.org/learn/${slug}` : "";
        const u = (row.url as string) || (row.courseraUrl as string) || link;
        if (!u || !String(u).startsWith("http")) continue;
        out.push({
          id: stableCourseId("coursera", u),
          provider: "coursera",
          title: name,
          description: typeof row.description === "string" ? row.description.slice(0, 300) : undefined,
          url: String(u),
          freeCertificateHint: true,
          format: "Org program (Coursera API)",
        });
        if (out.length >= limit) break;
      }
    }
    return out;
  } catch {
    return [];
  }
}
