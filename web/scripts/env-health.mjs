/**
 * Run: node --env-file=.env.local scripts/env-health.mjs
 * Prints OK/FAIL per integration — never prints secret values.
 */
import "node:process";

const out = (name, status, detail = "") => {
  console.log(`${status === "OK" ? "✓" : "✗"} ${name}: ${status}${detail ? " — " + detail : ""}`);
};

async function main() {
  const oa = process.env.OPENAI_API_KEY?.trim();
  if (oa) {
    try {
      const r = await fetch("https://api.openai.com/v1/models?limit=1", {
        headers: { Authorization: `Bearer ${oa}` },
      });
      out("OPENAI", r.ok ? "OK" : "FAIL", r.ok ? "" : `HTTP ${r.status}`);
    } catch (e) {
      out("OPENAI", "FAIL", (e).message);
    }
  } else out("OPENAI", "SKIP", "no key");

  const yt = process.env.YOUTUBE_API_KEY?.trim();
  if (yt) {
    try {
      const u = new URL("https://www.googleapis.com/youtube/v3/search");
      u.searchParams.set("part", "snippet");
      u.searchParams.set("q", "test");
      u.searchParams.set("maxResults", "1");
      u.searchParams.set("key", yt);
      const r = await fetch(u);
      const j = await r.json();
      out("YOUTUBE", r.ok && !j.error ? "OK" : "FAIL", j.error?.message || (r.ok ? "" : `HTTP ${r.status}`));
    } catch (e) {
      out("YOUTUBE", "FAIL", e.message);
    }
  } else out("YOUTUBE", "SKIP", "no key");

  const gk = process.env.GEMINI_API_KEY?.trim() || process.env.GOOGLE_API_KEY?.trim();
  const gemModel = (process.env.GEMINI_API_MODEL || "gemini-2.5-flash").trim();
  if (gk) {
    try {
      const r = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(gemModel)}:generateContent?key=${encodeURIComponent(gk)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contents: [{ parts: [{ text: "ping" }] }] }),
        },
      );
      const j = await r.json();
      out(
        "Gemini API (GOOGLE_API_KEY or GEMINI_API_KEY)",
        r.ok && !j.error ? "OK" : "FAIL",
        j.error?.message || (r.ok ? "" : `HTTP ${r.status}`),
      );
    } catch (e) {
      out("Gemini API", "FAIL", e.message);
    }
  } else out("Gemini API", "SKIP", "no GOOGLE_API_KEY or GEMINI_API_KEY");

  const b = process.env.BRAVE_SEARCH_API_KEY?.trim();
  if (b) {
    try {
      const r = await fetch("https://api.search.brave.com/res/v1/web/search?q=test&count=1", {
        headers: { "X-Subscription-Token": b, Accept: "application/json" },
      });
      out("BRAVE", r.ok ? "OK" : "FAIL", r.ok ? "" : `HTTP ${r.status}`);
    } catch (e) {
      out("BRAVE", "FAIL", e.message);
    }
  } else out("BRAVE", "SKIP", "no key");

  const s = process.env.SERPER_API_KEY?.trim();
  if (s) {
    try {
      const r = await fetch("https://google.serper.dev/search", {
        method: "POST",
        headers: { "X-API-KEY": s, "Content-Type": "application/json" },
        body: JSON.stringify({ q: "test", num: 1 }),
      });
      out("SERPER", r.ok ? "OK" : "FAIL", r.ok ? "" : `HTTP ${r.status}`);
    } catch (e) {
      out("SERPER", "FAIL", e.message);
    }
  } else out("SERPER", "SKIP", "no key");

  const cid = process.env.COURSERA_CLIENT_ID?.trim();
  const csec = process.env.COURSERA_CLIENT_SECRET?.trim();
  if (cid && csec) {
    try {
      const basic = Buffer.from(`${cid}:${csec}`).toString("base64");
      const r = await fetch("https://api.coursera.com/oauth2/client_credentials/token", {
        method: "POST",
        headers: {
          Authorization: `Basic ${basic}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: "grant_type=client_credentials",
      });
      const t = await r.text();
      out("Coursera OAuth", r.ok ? "OK" : "FAIL", r.ok ? "" : t.slice(0, 60));
    } catch (e) {
      out("Coursera OAuth", "FAIL", e.message);
    }
  } else out("Coursera OAuth", "SKIP", "id/secret");

  const aid = process.env.ADZUNA_APP_ID;
  const akey = process.env.ADZUNA_APP_KEY;
  const adzC = (process.env.ADZUNA_COUNTRY || "us").toLowerCase().slice(0, 2);
  if (aid && akey) {
    try {
      const r = await fetch(
        `https://api.adzuna.com/v1/api/jobs/${adzC}/search/1?app_id=${encodeURIComponent(aid)}&app_key=${encodeURIComponent(akey)}&what=developer&results_per_page=1`,
      );
      out("ADZUNA", r.ok ? "OK" : "FAIL", r.ok ? "" : `HTTP ${r.status}`);
    } catch (e) {
      out("ADZUNA", "FAIL", e.message);
    }
  } else out("ADZUNA", "SKIP", "id/key");

  const uem = process.env.USAJOBS_EMAIL;
  const uak = process.env.USAJOBS_API_KEY?.trim();
  if (uem && uak) {
    try {
      const r = await fetch("https://data.usajobs.gov/api/search?Keyword=engineer&ResultsPerPage=1", {
        headers: {
          Host: "data.usajobs.gov",
          "User-Agent": uem,
          "Authorization-Key": uak,
          Accept: "application/json",
        },
      });
      out("USAJobs", r.ok ? "OK" : "FAIL", r.ok ? "" : `HTTP ${r.status}`);
    } catch (e) {
      out("USAJobs", "FAIL", e.message);
    }
  } else out("USAJobs", "SKIP", "email/key");

  const ap = process.env.APIFY_API_TOKEN?.trim();
  if (ap) {
    try {
      const r = await fetch(`https://api.apify.com/v2/users/me?token=${encodeURIComponent(ap)}`);
      out("Apify", r.ok ? "OK" : "FAIL", r.ok ? "" : `HTTP ${r.status}`);
    } catch (e) {
      out("Apify", "FAIL", e.message);
    }
  } else out("Apify", "SKIP", "no token");

  const p = process.env.GOOGLE_CLOUD_PROJECT?.trim();
  if (p) {
    out("Vertex AI (project set)", "NOTE", "validate with gcloud/ADC; not probed from this script");
  } else {
    out("Vertex AI", "SKIP", "GOOGLE_CLOUD_PROJECT empty");
  }

  if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY && process.env.AWS_REGION) {
    out(
      "AWS credentials",
      "NOTE",
      "Dynamo not auto-tested here; use AWS CLI or app with DATA_STORE=dynamodb",
    );
  } else {
    out("AWS", "SKIP", "incomplete or using memory store only");
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
