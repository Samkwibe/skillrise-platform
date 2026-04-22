import { NextResponse } from "next/server";
import { getVerifiedUserForApi } from "@/lib/auth";
import { findUserById, LIFE_CATEGORIES } from "@/lib/store";
import { searchFreeCourses } from "@/lib/courses/search";

export const dynamic = "force-dynamic";

/** One keyword from onboarding to drive a tiny “Recommended free courses” strip. */
export async function GET() {
  const session = await getVerifiedUserForApi();
  if (session instanceof NextResponse) return session;

  const user = findUserById(session.id);
  if (!user) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const ob = user.onboarding;
  let q = "communication skills";
  if (ob?.interests?.length) {
    const cat = LIFE_CATEGORIES.find((c) => c.id === ob.interests[0]);
    if (cat) q = `${cat.label.toLowerCase()} free course`;
  } else if (ob?.struggles?.length) {
    const map: Record<string, string> = {
      "finding-job": "interview skills",
      confidence: "confidence",
      communication: "public speaking",
      money: "personal finance",
      focus: "productivity",
      stress: "stress management",
    };
    q = map[ob.struggles[0]!] ?? q;
  }

  const { courses, note } = await searchFreeCourses({ query: q, limit: 3 });
  return NextResponse.json({ query: q, courses, note });
}
