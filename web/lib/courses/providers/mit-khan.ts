import type { FreeCourse } from "../types";
import { stableCourseId } from "../ids";
import { searchSiteCourses } from "../web-search";

export async function searchMIT(q: string, limit: number) {
  const r = await searchSiteCourses("mit", "ocw.mit.edu", q, limit, "/courses/");
  if (r.courses.length > 0) return r;
  // Graceful: still send users to the official search.
  return {
    courses: [
      {
        id: stableCourseId("mit", `https://ocw.mit.edu/search/?q=${encodeURIComponent(q)}`),
        provider: "mit" as const,
        title: `Search “${q}” on MIT OpenCourseWare`,
        description: "OCW is fully client-rendered in the browser. We opened the official search for you. Add Brave or Serper API keys in .env to pull inline results from Google/Bing here.",
        url: `https://ocw.mit.edu/search/?q=${encodeURIComponent(q)}`,
        format: "MIT OCW (browse)",
      },
    ],
    skipped: r.skipped,
  };
}

export async function searchKhan(q: string, limit: number) {
  const r = await searchSiteCourses("khan", "khanacademy.org", q, limit);
  if (r.courses.length > 0) return r;
  return {
    courses: [
      {
        id: stableCourseId("khan", `https://www.khanacademy.org/search?page_search_query=${encodeURIComponent(q)}`),
        provider: "khan" as const,
        title: `Search “${q}” on Khan Academy`,
        description: "Khan’s public catalog is browse-first. This opens a search page. Add Brave or Serper for inline links here — same stack as the skill video search.",
        url: `https://www.khanacademy.org/search?page_search_query=${encodeURIComponent(q)}`,
        format: "Khan Academy (browse)",
      },
    ],
    skipped: r.skipped,
  };
}
