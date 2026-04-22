/**
 * Check whether each configured Apify actor ID actually exists.
 *
 * Usage:
 *   npx tsx scripts/apify-health.ts
 *   or: node --loader tsx scripts/apify-health.ts
 *
 * Calls GET /v2/acts/{actorId} for every ACTOR in env — metadata reads
 * do not consume compute credits, so this is safe to run any time.
 */
import { ACTORS } from "../lib/apify/client";

async function main() {
  const token = process.env.APIFY_API_TOKEN;
  if (!token) {
    console.error("APIFY_API_TOKEN is missing. Check web/.env.local.");
    process.exit(1);
  }

  const rows = Object.entries(ACTORS).map(([label, id]) => ({ label, id }));
  console.log("Checking", rows.length, "actor IDs …\n");

  const results = await Promise.all(
    rows.map(async ({ label, id }) => {
      const path = encodeURIComponent(id.replace("/", "~"));
      const res = await fetch(
        `https://api.apify.com/v2/acts/${path}?token=${token}`,
      );
      if (res.ok) {
        const body = (await res.json()) as { data?: { name?: string; username?: string; title?: string } };
        return {
          label,
          id,
          ok: true as const,
          name: body.data?.name,
          username: body.data?.username,
          title: body.data?.title,
        };
      }
      const text = await res.text();
      return { label, id, ok: false as const, status: res.status, detail: text.slice(0, 200) };
    }),
  );

  const pad = (s: string, n: number) => s + " ".repeat(Math.max(0, n - s.length));
  for (const r of results) {
    if (r.ok) {
      console.log(
        `✓ ${pad(r.label, 20)} ${pad(r.id, 52)} -> ${r.username}/${r.name}${r.title ? `  (“${r.title}”)` : ""}`,
      );
    } else {
      console.log(
        `✗ ${pad(r.label, 20)} ${pad(r.id, 52)} -> HTTP ${r.status}: ${r.detail.replace(/\s+/g, " ")}`,
      );
    }
  }

  const bad = results.filter((r) => !r.ok);
  if (bad.length > 0) {
    console.log("\nFix the IDs above by setting the matching env var in web/.env.local:");
    for (const r of bad) {
      const envVar =
        r.label === "mediaExtractor" ? "APIFY_ACTOR_MEDIA_EXTRACTOR" :
        r.label === "jobScraper" ? "APIFY_ACTOR_JOB_SCRAPER" :
        r.label === "contentProcessor" ? "APIFY_ACTOR_CONTENT_PROCESSOR" :
        r.label === "videoTranscript" ? "APIFY_ACTOR_VIDEO_TRANSCRIPT" :
        r.label === "ragBrowser" ? "APIFY_ACTOR_RAG_BROWSER" :
        "APIFY_ACTOR_" + r.label.toUpperCase();
      console.log(`  ${envVar}=<username>~<actor-name>`);
    }
    process.exit(2);
  }

  console.log("\nAll actor IDs resolve. You're good.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
