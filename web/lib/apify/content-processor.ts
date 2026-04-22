/**
 * AI Content Processor (Apify: valid_headlamp/ai-content-processor).
 *
 * Uses GPT-4o-mini under the hood. We use it for two things in SkillRise:
 *
 *  1. Soft community moderation — flag sentiment + category so we can
 *     surface a support card next to crisis-adjacent messages (without
 *     deleting them, because shaming people in pain is the opposite of
 *     what this platform stands for).
 *
 *  2. Onboarding personalization — classify free-text struggles so
 *     `recommendTracksFor` can map them to the right LifeCategory.
 *
 * The actor requires an OpenAI key in its input (not env). We forward
 * `OPENAI_API_KEY` so nothing extra has to be configured.
 */
import { runActorSync, ACTORS } from "./client";
import { cached } from "@/lib/cache/tiered-cache";

export type Sentiment = "positive" | "neutral" | "negative" | "unknown";

export type ContentAnalysis = {
  sentiment: Sentiment;
  categories: string[];
  primaryCategory?: string;
  confidence: number;
  summary?: string;
};

type ActorRow = {
  sentiment?: string;
  category?: string | string[];
  categories?: string[];
  primary_category?: string;
  primaryCategory?: string;
  confidence?: number;
  summary?: string;
};

const DEFAULT_CATEGORIES = [
  "anxiety",
  "depression",
  "confidence",
  "communication",
  "job stress",
  "money stress",
  "loneliness",
  "crisis",
  "general",
];

export async function analyzeContent(
  text: string,
  opts: { categories?: string[]; tasks?: Array<"sentiment" | "classification" | "summary"> } = {},
): Promise<ContentAnalysis | null> {
  const input = text.trim();
  if (!input) return null;

  const key = process.env.OPENAI_API_KEY;
  if (!key) return null;

  const tasks = opts.tasks ?? ["sentiment", "classification"];
  const categories = opts.categories ?? DEFAULT_CATEGORIES;

  return cached<ContentAnalysis | null>(
    "apify:analyze",
    `${tasks.join(",")}|${input.slice(0, 240)}`,
    async () => {
      const res = await runActorSync<ActorRow>(
        ACTORS.contentProcessor,
        {
          openai_api_key: key,
          input_text: input,
          tasks,
          categories,
        },
        { timeoutSec: 40, limit: 1 },
      );
      const rows = res.ok ? res.rows : null;
      if (!rows || rows.length === 0) return null;

      const r = rows[0];
      const cats =
        (Array.isArray(r.categories) && r.categories) ||
        (Array.isArray(r.category) && r.category) ||
        (typeof r.category === "string" ? [r.category] : []);

      return {
        sentiment: normalizeSentiment(r.sentiment),
        categories: cats,
        primaryCategory: r.primary_category || r.primaryCategory || cats[0],
        confidence: typeof r.confidence === "number" ? r.confidence : 0,
        summary: r.summary,
      };
    },
    { ttlHours: 24 },
  );
}

function normalizeSentiment(raw: string | undefined): Sentiment {
  if (!raw) return "unknown";
  const v = raw.toLowerCase();
  if (v.startsWith("pos")) return "positive";
  if (v.startsWith("neg")) return "negative";
  if (v.startsWith("neu")) return "neutral";
  return "unknown";
}

/**
 * Quick "does this need a gentle check-in?" predicate used by the
 * community chat moderator. Returns true if sentiment is negative AND
 * the topic falls in a crisis-adjacent bucket.
 */
export function needsSupportNudge(a: ContentAnalysis | null): boolean {
  if (!a) return false;
  if (a.sentiment !== "negative") return false;
  const crisis = new Set(["crisis", "depression", "anxiety", "loneliness"]);
  return a.categories.some((c) => crisis.has(c.toLowerCase()));
}
