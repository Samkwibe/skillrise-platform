import { NextResponse } from "next/server";
import { getVerifiedUserForApi } from "@/lib/auth";
import { getTrack, id } from "@/lib/store";
import { getDb } from "@/lib/db";
import { ensureTracksFromDatabase } from "@/lib/course/ensure-tracks";
import { assertTeacher, listStudentsForTrack } from "@/lib/services/lms-access";
import { formatZodError, lmsAnnouncementCreateSchema } from "@/lib/validators";
import { sendCourseAnnouncementEmail } from "@/lib/email/transactional";
import type { CourseAnnouncement } from "@/lib/course/lms-types";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, ctx: { params: Promise<{ trackSlug: string }> }) {
  const user = await getVerifiedUserForApi();
  if (user instanceof NextResponse) return user;
  if (user.role !== "teacher" && user.role !== "admin") {
    return NextResponse.json({ error: "Teachers only." }, { status: 403 });
  }
  const { trackSlug } = await ctx.params;
  await ensureTracksFromDatabase();
  const track = getTrack(trackSlug);
  const denied = assertTeacher(user, track);
  if (denied) return denied;
  const db = getDb();
  await db.ready();
  const list = await db.listAnnouncementsByTrack(trackSlug);
  return NextResponse.json({ announcements: list });
}

export async function POST(req: Request, ctx: { params: Promise<{ trackSlug: string }> }) {
  const user = await getVerifiedUserForApi();
  if (user instanceof NextResponse) return user;
  if (user.role !== "teacher" && user.role !== "admin") {
    return NextResponse.json({ error: "Teachers only." }, { status: 403 });
  }
  const { trackSlug } = await ctx.params;
  await ensureTracksFromDatabase();
  const track = getTrack(trackSlug);
  const denied = assertTeacher(user, track);
  if (denied) return denied;
  if (!track) return NextResponse.json({ error: "Not found" }, { status: 404 });
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = lmsAnnouncementCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid", details: formatZodError(parsed.error) }, { status: 400 });
  }
  const d = parsed.data;
  const a: CourseAnnouncement = {
    id: `ann_${id()}`,
    trackSlug,
    createdBy: user.id,
    title: d.title,
    body: d.body,
    sendEmail: d.sendEmail,
    pinned: d.pinned,
    createdAt: Date.now(),
    attachmentUrl: d.attachmentUrl,
  };
  const db = getDb();
  await db.ready();
  await db.putAnnouncement(a);
  if (d.sendEmail) {
    const students = await listStudentsForTrack(track);
    for (const { user: su } of students) {
      try {
        await sendCourseAnnouncementEmail({
          to: su.email,
          courseTitle: track.title,
          title: a.title,
          body: a.body,
          trackSlug,
        });
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error("[announcement email]", e);
      }
    }
  }
  return NextResponse.json({ announcement: a }, { status: 201 });
}
