import { NextResponse } from "next/server";
import { store, publicUser, userEnrollments, userCertificates } from "@/lib/store";
import { getVerifiedUserForApi } from "@/lib/auth";

export async function GET() {
  const user = await getVerifiedUserForApi();
  if (user instanceof NextResponse) return user;
  const payload = {
    user: {
      ...publicUser(user),
      phoneE164: user.phoneE164 ?? null,
      phoneVerifiedAt: user.phoneVerifiedAt ?? null,
    },
    enrollments: userEnrollments(user.id),
    certificates: userCertificates(user.id),
    applications: store.applications.filter((a) => a.userId === user.id),
    challengeProgress: store.challengeProgress.find((p) => p.userId === user.id) ?? null,
    assistantMessages: store.assistantMessages.filter((m) => m.userId === user.id),
    cohorts: store.cohorts.filter((c) => c.members.includes(user.id)),
    exportedAt: new Date().toISOString(),
  };
  return new NextResponse(JSON.stringify(payload, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="skillrise-export-${user.id}.json"`,
    },
  });
}
