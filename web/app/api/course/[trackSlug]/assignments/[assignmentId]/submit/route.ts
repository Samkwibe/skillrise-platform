import { NextResponse } from "next/server";
import { getVerifiedUserForApi } from "@/lib/auth";
import { getTrack, id } from "@/lib/store";
import { getDb } from "@/lib/db";
import { ensureTracksFromDatabase } from "@/lib/course/ensure-tracks";
import { assertEnrolledLearner } from "@/lib/services/lms-access";
import { formatZodError, lmsSubmissionSubmitSchema } from "@/lib/validators";
import type { AssignmentSubmission } from "@/lib/course/lms-types";

export const dynamic = "force-dynamic";

export async function POST(
  req: Request,
  ctx: { params: Promise<{ trackSlug: string; assignmentId: string }> },
) {
  const user = await getVerifiedUserForApi();
  if (user instanceof NextResponse) return user;
  const { trackSlug, assignmentId } = await ctx.params;
  await ensureTracksFromDatabase();
  const track = getTrack(trackSlug);
  const enr = await assertEnrolledLearner(user, track);
  if (enr) return enr;
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = lmsSubmissionSubmitSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid", details: formatZodError(parsed.error) }, { status: 400 });
  }
  const db = getDb();
  await db.ready();
  const a = await db.getAssignment(assignmentId);
  if (!a || a.trackSlug !== trackSlug) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (Date.now() > a.dueAt * 1 && parsed.data.textBody) {
    // allow late submission for now (soft) — or strict: 400. Spec: "by due date" display only, allow late
  }
  const prior = await db.getSubmissionByUserAssignment(user.id, assignmentId);
  const asDraft = parsed.data.asDraft;
  if (!asDraft) {
    const hasContent =
      (parsed.data.textBody?.trim().length ?? 0) > 0 || (parsed.data.fileS3Keys?.length ?? 0) > 0;
    if (!hasContent) {
      return NextResponse.json(
        { error: "Add written work or at least one file before submitting. Use Save draft to hold text." },
        { status: 400 },
      );
    }
  }
  if (!asDraft && (prior?.status === "graded" || prior?.status === "returned")) {
    return NextResponse.json({ error: "This submission is already graded. Ask your instructor to allow a redo." }, { status: 400 });
  }
  const now = Date.now();
  const sid = prior?.id ?? `sub_${id()}`;
  const s: AssignmentSubmission = {
    id: sid,
    assignmentId,
    trackSlug,
    userId: user.id,
    textBody: parsed.data.textBody,
    fileS3Keys: parsed.data.fileS3Keys ?? [],
    status: asDraft ? "draft" : "submitted",
    submittedAt: now,
  };
  await db.putSubmission(s);
  return NextResponse.json({ submission: s });
}
