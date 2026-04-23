import { NextResponse } from "next/server";
import { getVerifiedUserForApi } from "@/lib/auth";
import { getTrack } from "@/lib/store";
import { getDb } from "@/lib/db";
import { ensureTracksFromDatabase } from "@/lib/course/ensure-tracks";
import { presignGetObject, isCourseS3Configured } from "@/lib/s3/course-assets";

export const dynamic = "force-dynamic";

/**
 * Short-lived redirect to a private S3 object for enrolled learners (or preview lessons).
 * Use: <a href> for downloads, or pass video URL to the player.
 */
export async function GET(req: Request) {
  const user = await getVerifiedUserForApi();
  if (user instanceof NextResponse) return user;
  await ensureTracksFromDatabase();

  const { searchParams } = new URL(req.url);
  const trackSlug = searchParams.get("trackSlug");
  const moduleId = searchParams.get("moduleId");
  const materialId = searchParams.get("materialId");

  if (!trackSlug || !moduleId) {
    return NextResponse.json({ error: "trackSlug and moduleId required" }, { status: 400 });
  }

  const track = getTrack(trackSlug);
  if (!track) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const mod = track.modules.find((m) => m.id === moduleId);
  if (!mod) return NextResponse.json({ error: "Lesson not found" }, { status: 404 });

  const db = getDb();
  await db.ready();
  const enrollment = await db.getEnrollment(user.id, trackSlug);
  if (!enrollment && !mod.isPreview) {
    return NextResponse.json({ error: "Enroll to access this content." }, { status: 403 });
  }
  if (enrollment?.pendingApproval && !mod.isPreview) {
    return NextResponse.json({ error: "Enrollment pending approval." }, { status: 403 });
  }

  if (!materialId) {
    if (mod.s3Key && isCourseS3Configured()) {
      try {
        const url = await presignGetObject(mod.s3Key, 3600);
        return NextResponse.redirect(url, 302);
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error("[course asset video]", e);
        return NextResponse.json({ error: "Could not sign video URL." }, { status: 500 });
      }
    }
    if (mod.videoUrl) return NextResponse.redirect(mod.videoUrl, 302);
    return NextResponse.json({ error: "No video on file" }, { status: 404 });
  }

  const mat = mod.materials?.find((m) => m.id === materialId);
  if (!mat) return NextResponse.json({ error: "Material not found" }, { status: 404 });
  if (mat.url) return NextResponse.redirect(mat.url, 302);
  if (mat.s3Key && isCourseS3Configured()) {
    try {
      const url = await presignGetObject(mat.s3Key, 3600);
      return NextResponse.redirect(url, 302);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error("[course asset material]", e);
      return NextResponse.json({ error: "Could not sign download URL." }, { status: 500 });
    }
  }
  return NextResponse.json({ error: "No file URL" }, { status: 404 });
}
