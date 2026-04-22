import type { FreeCourse } from "../types";
import { stableCourseId } from "../ids";
import { searchSiteCourses } from "../web-search";

export async function searchSimplilearn(q: string, limit: number) {
  // No path filter — Simplilearn uses many URL patterns; org search ranks them.
  return searchSiteCourses("simplilearn", "simplilearn.com", q, limit);
}