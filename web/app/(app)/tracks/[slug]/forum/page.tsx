import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireVerifiedUser } from "@/lib/auth";
import { getTrack } from "@/lib/store";
import { getDb } from "@/lib/db";
import { ensureTracksFromDatabase } from "@/lib/course/ensure-tracks";

export const dynamic = "force-dynamic";

export default async function CourseForumListPage({ params }: { params: Promise<{ slug: string }> }) {
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
  const list = (await db.listForumThreadsByTrack(slug)).filter((t) => !t.deletedAt);
  return (
    <div className="section-pad-x py-10 max-w-3xl">
      <Link href={`/tracks/${slug}`} className="text-[13px] text-t3 underline">
        ← {track.title}
      </Link>
      <h1 className="font-display text-2xl font-extrabold mt-2 mb-6">Discussion</h1>
      <ul className="space-y-2">
        {list.length === 0 && <p className="text-t2 text-sm">No topics yet.</p>}
        {list.map((t) => (
          <li key={t.id}>
            <Link
              className="card card-hover p-3 block"
              href={`/tracks/${slug}/forum/${t.id}`}
            >
              {t.pinned && <span className="pill pill-g text-[10px] mr-2">Pinned</span>}
              {t.closed && <span className="text-t3 text-[11px] mr-2">Closed</span>}
              {t.title}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
