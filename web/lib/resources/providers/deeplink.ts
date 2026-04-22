/**
 * Deep-link provider — honest search shortcuts for platforms that don't
 * expose a usable API (Coursera, Khan Academy, edX, Harvard Online,
 * Alison, freeCodeCamp). Each card invites the user to "Search X for
 * <query>" and opens the platform's own search page in a new tab.
 *
 * Rationale: the user asked for Coursera and Khan to appear in the
 * unified search. Their APIs have been discontinued. Showing a
 * clearly-labelled deep-link card is the only honest way to represent
 * those catalogs without mocking data.
 */
import {
  hashish,
  type LearningResource,
  type ResourceProvider,
  type ResourceProviderId,
  type ResourceProviderResult,
  type ResourceSearchOpts,
} from "../types";

type DeepLinkPlatform = {
  id: ResourceProviderId;
  label: string;
  tagline: string;
  /** Given the user's query, produce the external search URL. */
  build(q: string): string;
  thumbnail?: string;
  freeCertificate?: boolean;
};

const PLATFORMS: DeepLinkPlatform[] = [
  {
    id: "coursera",
    label: "Coursera",
    tagline: "University-level courses — audit for free, pay for the cert.",
    build: (q) => `https://www.coursera.org/search?query=${encodeURIComponent(q)}`,
  },
  {
    id: "khan",
    label: "Khan Academy",
    tagline: "K–12 + college basics. Completely free, no account required.",
    build: (q) =>
      `https://www.khanacademy.org/search?page_search_query=${encodeURIComponent(
        q,
      )}`,
  },
  {
    id: "edx",
    label: "edX",
    tagline: "Harvard / MIT / Berkeley courses — audit tracks are free.",
    build: (q) => `https://www.edx.org/search?q=${encodeURIComponent(q)}`,
  },
  {
    id: "harvard",
    label: "Harvard Online",
    tagline: "Free Harvard Online Learning courses.",
    build: (q) =>
      `https://pll.harvard.edu/catalog?keywords=${encodeURIComponent(
        q,
      )}&free_or_paid%5B0%5D=free`,
    freeCertificate: false,
  },
  {
    id: "alison",
    label: "Alison",
    tagline: "6,000+ CPD-accredited courses with free certificates on completion.",
    build: (q) => `https://alison.com/courses?query=${encodeURIComponent(q)}`,
    freeCertificate: true,
  },
  {
    id: "freecodecamp",
    label: "freeCodeCamp",
    tagline: "Coding projects + certifications, 100% free.",
    build: (q) => `https://www.freecodecamp.org/news/search/?query=${encodeURIComponent(q)}`,
    freeCertificate: true,
  },
];

function makeCard(p: DeepLinkPlatform, q: string): LearningResource {
  return {
    id: `${p.id}:deeplink-${hashish(q)}`,
    title: `Search ${p.label} for "${q}"`,
    description: p.tagline,
    url: p.build(q),
    author: p.label,
    provider: p.id,
    kind: "link",
    isDeepLink: true,
    freeCertificate: p.freeCertificate,
  };
}

/**
 * Build a deep-link-only provider for a specific platform. Keeping one
 * provider per platform means the UI can toggle them individually from
 * the filter pills, and later swap any of them to a real API without
 * touching the orchestrator.
 */
function makeProvider(p: DeepLinkPlatform): ResourceProvider {
  return {
    id: p.id,
    label: p.label,
    isConfigured() {
      return true;
    },
    async search(opts: ResourceSearchOpts): Promise<ResourceProviderResult> {
      return {
        provider: p.id,
        items: opts.query.trim() ? [makeCard(p, opts.query.trim())] : [],
      };
    },
  };
}

export const deepLinkProviders: ResourceProvider[] = PLATFORMS.map(makeProvider);

/**
 * Curated directory for the "From the open web" row on the learner
 * dashboard. These are platforms the user wanted surfaced but that
 * don't fit in the main search because they have no API at all.
 */
export const FEATURED_PLATFORMS: Array<{
  id: string;
  label: string;
  tagline: string;
  url: string;
  emoji: string;
}> = [
  {
    id: "eon-reality",
    label: "EON Reality — Global Virtual Campus",
    tagline: "9,000 free university-level courses across 17 industries.",
    url: "https://eonreality.com/global-virtual-campus/",
    emoji: "🌍",
  },
  {
    id: "claude-academy",
    label: "Claude Academy (Anthropic)",
    tagline: "13 free AI courses with certificates — Claude API, MCP, Agents.",
    url: "https://anthropic.skilljar.com/",
    emoji: "🤖",
  },
  {
    id: "openai-academy",
    label: "OpenAI Academy",
    tagline: "Free AI fundamentals + ChatGPT literacy.",
    url: "https://academy.openai.com/",
    emoji: "🧠",
  },
  {
    id: "grow-with-google",
    label: "Grow with Google",
    tagline: "Digital marketing, data analytics, IT support — certificates.",
    url: "https://grow.google/certificates/",
    emoji: "📈",
  },
  {
    id: "ibm-skillsbuild",
    label: "IBM SkillsBuild",
    tagline: "Free AI, blockchain, cybersecurity courses with badges.",
    url: "https://skillsbuild.org/",
    emoji: "🔐",
  },
  {
    id: "aws-educate",
    label: "AWS Educate",
    tagline: "Free cloud-computing learning paths and labs.",
    url: "https://aws.amazon.com/education/awseducate/",
    emoji: "☁️",
  },
  {
    id: "stanford-online",
    label: "Stanford Online",
    tagline: "Free AI / ML / CS lectures from Stanford.",
    url: "https://online.stanford.edu/free-courses",
    emoji: "🎓",
  },
  {
    id: "class-central",
    label: "Class Central",
    tagline: "Aggregator — find the best free courses anywhere.",
    url: "https://www.classcentral.com/",
    emoji: "🗂️",
  },
];
