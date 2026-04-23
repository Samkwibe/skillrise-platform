import { NextResponse } from "next/server";
import { getVerifiedUserForApi } from "@/lib/auth";
import { getCommunityImpactForTeacher } from "@/lib/services/teacher-impact";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getVerifiedUserForApi();
  if (user instanceof NextResponse) return user;
  if (user.role !== "teacher" && user.role !== "admin") {
    return NextResponse.json({ error: "Teachers only." }, { status: 403 });
  }

  const impact = await getCommunityImpactForTeacher(user.id);
  return NextResponse.json({ impact });
}
