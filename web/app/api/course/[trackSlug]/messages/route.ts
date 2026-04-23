import { NextResponse } from "next/server";
import { getVerifiedUserForApi } from "@/lib/auth";
import { getTrack, id } from "@/lib/store";
import { getDb } from "@/lib/db";
import { ensureTracksFromDatabase } from "@/lib/course/ensure-tracks";
import { assertEnrolledLearner, listStudentsForTrack } from "@/lib/services/lms-access";
import { canTeacherEditCourse } from "@/lib/services/teacher-course";
import { formatZodError, lmsDmMessageSchema } from "@/lib/validators";
import { sendDirectMessageEmail } from "@/lib/email/transactional";
import type { DmThread, DmMessage } from "@/lib/course/lms-types";
import type { User, Track } from "@/lib/store";

export const dynamic = "force-dynamic";

function canAccessThread(user: User, track: Track, th: DmThread) {
  if (user.id === th.teacherId || user.id === th.studentId) return true;
  if (user.role === "admin") return true;
  return false;
}

export async function GET(_req: Request, ctx: { params: Promise<{ trackSlug: string }> }) {
  const user = await getVerifiedUserForApi();
  if (user instanceof NextResponse) return user;
  const { trackSlug } = await ctx.params;
  await ensureTracksFromDatabase();
  const track = getTrack(trackSlug);
  if (!track) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!canTeacherEditCourse(user, track)) {
    const enr = await assertEnrolledLearner(user, track);
    if (enr) return enr;
  }
  const db = getDb();
  await db.ready();
  const threads = (await db.listDmThreadsForUser(user.id, trackSlug)).filter((t) => canAccessThread(user, track, t));
  return NextResponse.json({ threads });
}

export async function POST(req: Request, ctx: { params: Promise<{ trackSlug: string }> }) {
  const user = await getVerifiedUserForApi();
  if (user instanceof NextResponse) return user;
  const { trackSlug } = await ctx.params;
  await ensureTracksFromDatabase();
  const track = getTrack(trackSlug);
  if (!track) return NextResponse.json({ error: "Not found" }, { status: 404 });
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = lmsDmMessageSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid", details: formatZodError(parsed.error) }, { status: 400 });
  }
  const isTeach = canTeacherEditCourse(user, track);
  const db = getDb();
  await db.ready();
  const now = Date.now();
  const text = parsed.data.body;
  const sectionId = parsed.data.sectionId;

  const sendToRecipient = async (th: DmThread, email: string, recipientName: string) => {
    const msg: DmMessage = {
      id: `dmm_${id()}`,
      threadId: th.id,
      senderId: user.id,
      body: text,
      at: now,
    };
    const saved = await db.putDmMessage(msg);
    try {
      await sendDirectMessageEmail({
        to: email,
        fromName: user.name,
        courseTitle: track.title,
        preview: text,
        trackSlug,
        threadId: th.id,
      });
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error("[dm email]", e);
    }
    return { message: saved, thread: th };
  };

  if (isTeach) {
    if (sectionId) {
      const students = await listStudentsForTrack(track);
      const filterSec =
        sectionId === "all" ? students : students.filter((s) => s.enrollment.sectionId === sectionId);
      const messages: DmMessage[] = [];
      for (const s of filterSec) {
        const tchr = await db.findUserById(track.teacherId);
        if (tchr?.mutedUserIds?.includes(s.user.id)) continue;
        const th =
          (await db.getDmThreadByPair(track.teacherId, s.user.id, trackSlug)) ??
          (await db.putDmThread({
            id: `dmt_${id()}`,
            trackSlug,
            teacherId: track.teacherId,
            studentId: s.user.id,
            createdAt: now,
            lastMessageAt: now,
          }));
        const out = await sendToRecipient(th, s.user.email, s.user.name);
        messages.push(out.message);
      }
      return NextResponse.json({ ok: true, count: messages.length, messages });
    }
    const studId = (body as { studentId?: string }).studentId;
    if (!studId) {
      return NextResponse.json({ error: "Use studentId, or set sectionId to a section or \"all\"." }, { status: 400 });
    }
    const su = await db.findUserById(studId);
    if (!su) return NextResponse.json({ error: "Unknown student" }, { status: 400 });
    const tchr = await db.findUserById(track.teacherId);
    if (tchr?.mutedUserIds?.includes(su.id)) {
      return NextResponse.json({ error: "Cannot message this user." }, { status: 403 });
    }
    const th =
      (await db.getDmThreadByPair(track.teacherId, studId, trackSlug)) ??
      (await db.putDmThread({
        id: `dmt_${id()}`,
        trackSlug,
        teacherId: track.teacherId,
        studentId: studId,
        createdAt: now,
        lastMessageAt: now,
      }));
    const out = await sendToRecipient(th, su.email, su.name);
    return NextResponse.json(out);
  }

  // Learner → instructor only
  const enr = await assertEnrolledLearner(user, track);
  if (enr) return enr;
  if ((await db.getEnrollment(user.id, trackSlug))?.pendingApproval) {
    return NextResponse.json({ error: "Enrollment pending" }, { status: 403 });
  }
  const teacher = await db.findUserById(track.teacherId);
  if (!teacher) return NextResponse.json({ error: "No teacher" }, { status: 400 });
  if (teacher.mutedUserIds?.includes(user.id)) {
    return NextResponse.json({ error: "Cannot send at this time." }, { status: 403 });
  }
  const th =
    (await db.getDmThreadByPair(track.teacherId, user.id, trackSlug)) ??
    (await db.putDmThread({
      id: `dmt_${id()}`,
      trackSlug,
      teacherId: track.teacherId,
      studentId: user.id,
      createdAt: now,
      lastMessageAt: now,
    }));
  const msg: DmMessage = {
    id: `dmm_${id()}`,
    threadId: th.id,
    senderId: user.id,
    body: text,
    at: now,
  };
  const saved = await db.putDmMessage(msg);
  if (!user.mutedUserIds?.includes(teacher.id)) {
    try {
      await sendDirectMessageEmail({
        to: teacher.email,
        fromName: user.name,
        courseTitle: track.title,
        preview: text,
        trackSlug,
        threadId: th.id,
      });
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error("[dm email]", e);
    }
  }
  return NextResponse.json({ message: saved, thread: th });
}
