import Link from "next/link";
import { notFound } from "next/navigation";
import { getDb } from "@/lib/db";
import { getTrack } from "@/lib/store";
import { EnrollButton } from "@/components/enroll-button";
import { requireVerifiedUser } from "@/lib/auth";
import { ensureTracksFromDatabase } from "@/lib/course/ensure-tracks";

export const dynamic = "force-dynamic";

export default async function EnrollByLink({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  await requireVerifiedUser();
  const db = getDb();
  await db.ready();
  const inv = await db.getInviteByToken(token);
  if (!inv) return notFound();
  await ensureTracksFromDatabase();
  const track = getTrack(inv.trackSlug);
  if (!track) return notFound();
  if (inv.expiresAt && inv.expiresAt < Date.now()) {
    return (
      <div className="section-pad-x py-16 max-w-md mx-auto">
        <h1 className="font-display text-2xl font-bold mb-2">Link expired</h1>
        <p className="text-t2 text-sm mb-6">Ask your instructor for a new enrollment link.</p>
        <Link href="/tracks" className="btn btn-ghost">
          Browse tracks
        </Link>
      </div>
    );
  }

  return (
    <div className="section-pad-x py-16 max-w-md mx-auto">
      <h1 className="font-display text-2xl font-bold mb-2">Join course</h1>
      <p className="text-t2 text-sm mb-6">
        You&apos;re enrolling in <span className="text-t1 font-semibold">{track.title}</span>
        {inv.requireApproval && " (instructor approval required)."}
      </p>
      <EnrollButton trackSlug={track.slug} inviteToken={token} />
      <p className="text-[12px] text-t3 mt-4">
        Source link counts toward analytics when enrollment completes (if approval not required, or after approval).
      </p>
    </div>
  );
}
