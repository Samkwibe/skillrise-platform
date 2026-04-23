import { NextResponse } from "next/server";
import { getVerifiedUserForApi } from "@/lib/auth";
import { getTrack } from "@/lib/store";
import { getDb } from "@/lib/db";
import { ensureTracksFromDatabase } from "@/lib/course/ensure-tracks";
import { assertTeacher } from "@/lib/services/lms-access";
import { formatZodError, lmsGradeSubmissionSchema } from "@/lib/validators";
import { sendAssignmentGradedEmail } from "@/lib/email/transactional";
import type { AssignmentSubmission } from "@/lib/course/lms-types";

export const dynamic = "force-dynamic";

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ trackSlug: string; assignmentId: string; submissionId: string }> },
) {
  const user = await getVerifiedUserForApi();
  if (user instanceof NextResponse) return user;
  if (user.role !== "teacher" && user.role !== "admin") {
    return NextResponse.json({ error: "Teachers only." }, { status: 403 });
  }
  const { trackSlug, assignmentId, submissionId } = await ctx.params;
  await ensureTracksFromDatabase();
  const track = getTrack(trackSlug);
  const denied = assertTeacher(user, track);
  if (denied) return denied;
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = lmsGradeSubmissionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid", details: formatZodError(parsed.error) }, { status: 400 });
  }
  const db = getDb();
  await db.ready();
  const a = await db.getAssignment(assignmentId);
  if (!a || a.trackSlug !== trackSlug) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const s = await db.getSubmission(submissionId);
  if (!s || s.assignmentId !== assignmentId) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (parsed.data.score > a.pointsPossible) {
    return NextResponse.json({ error: "Score above points possible." }, { status: 400 });
  }
  const next: AssignmentSubmission = {
    ...s,
    score: parsed.data.score,
    feedback: parsed.data.feedback,
    status: parsed.data.status,
    pointsPossible: a.pointsPossible,
    gradedAt: Date.now(),
    gradedBy: user.id,
  };
  await db.putSubmission(next);
  const u = await db.findUserById(s.userId);
  if (u) {
    try {
      await sendAssignmentGradedEmail({
        to: u.email,
        courseTitle: track?.title ?? trackSlug,
        assignmentTitle: a.title,
        score: next.score!,
        points: a.pointsPossible,
        feedback: next.feedback,
      });
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error("[email assignment graded]", e);
    }
  }
  return NextResponse.json({ submission: next });
}
