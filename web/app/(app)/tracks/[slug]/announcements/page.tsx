import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireVerifiedUser } from "@/lib/auth";
import { getTrack } from "@/lib/store";
import { getDb } from "@/lib/db";
import { ensureTracksFromDatabase } from "@/lib/course/ensure-tracks";
import { AnnouncementReadForm } from "./read-form";

export const dynamic = "force-dynamic";

export default async function CourseAnnouncementsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const user = await requireVerifiedUser();
  await ensureTracksFromDatabase();
  const track = getTrack(slug);
  if (!track) return notFound();
  const db = getDb();
  await db.ready();
  const e = await db.getEnrollment(user.id, slug);
  if (!e) redirect(`/tracks/${slug}`);
  if (e.pendingApproval) redirect(`/tracks/${slug}?pending=1`);
  const list = (await db.listAnnouncementsByTrack(slug))
    .slice()
    .sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return b.createdAt - a.createdAt;
    });
  const withRead = await Promise.all(
    list.map(async (a) => ({
      ...a,
      read: await db.isAnnouncementRead(a.id, user.id),
    })),
  );
  return (
    <div className="section-pad-x py-10 max-w-3xl">
      <Link href={`/tracks/${slug}`} className="text-[13px] text-t3 underline">
        ← {track.title}
      </Link>
      <h1 className="font-display text-2xl font-extrabold mt-2 mb-6">Announcements</h1>
      <div className="flex flex-col gap-3">
        {withRead.length === 0 && <p className="text-t2 text-sm">No announcements yet.</p>}
        {withRead.map((a) => (
          <div key={a.id} className="card p-4">
            <div className="flex items-center gap-2">
              {a.pinned && <span className="pill pill-g text-[10px]">Pinned</span>}
              {a.read && <span className="text-[10px] text-t3">Read</span>}
            </div>
            <h2 className="font-bold mt-1">{a.title}</h2>
            <p className="text-t2 text-sm whitespace-pre-line mt-2">{a.body}</p>
            {!a.read && <AnnouncementReadForm trackSlug={slug} announcementId={a.id} />}
          </div>
        ))}
      </div>
    </div>
  );
}
