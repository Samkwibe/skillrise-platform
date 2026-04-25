import { notFound } from "next/navigation";
import Link from "next/link";
import { getTrack, findUserById, store, type Job } from "@/lib/store";
import { requireVerifiedUser } from "@/lib/auth";
import { Avatar } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { EnrollButton } from "@/components/enroll-button";
import { groupModulesIntoUnits } from "@/lib/course/outline";
import { ensureTracksFromDatabase } from "@/lib/course/ensure-tracks";
import { getDb } from "@/lib/db";
import { getMissingPrerequisites } from "@/lib/services/prerequisites";
import { getReviewStatsForTrack } from "@/lib/services/course-discovery-stats";
import { CourseReviewsSection, type ReviewRow } from "@/components/learner/course-reviews-section";
import { WishlistHeartButton } from "@/components/learner/wishlist-heart-button";

export const dynamic = "force-dynamic";

export default async function TrackDetail({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { slug } = await params;
  const sp = await searchParams;
  const user = await requireVerifiedUser();
  await ensureTracksFromDatabase();
  const track = getTrack(slug);
  if (!track) return notFound();

  const teacher = findUserById(track.teacherId);
  const db = getDb();
  await db.ready();
  const enrollment = await db.getEnrollment(user.id, track.slug);
  const prereqMissing = enrollment
    ? await getMissingPrerequisites(user.id, track)
    : [];
  const showPending =
    (typeof sp?.pending === "string" && sp.pending === "1") || Boolean(enrollment?.pendingApproval);
  const showPrereq = typeof sp?.prereq === "string" && sp.prereq === "1";
  const pct = enrollment ? Math.round((enrollment.completedModuleIds.length / track.modules.length) * 100) : 0;
  const jobs = store.jobs.filter((j: Job) => j.requiredTrackSlug === track.slug && j.status === "open");
  const units = groupModulesIntoUnits(track.modules);
  const [reviewStats, reviewRows, wishlisted] = await Promise.all([
    getReviewStatsForTrack(track.slug),
    (async (): Promise<ReviewRow[]> => {
      const raw = await db.listReviewsByTrack(track.slug);
      const rows: ReviewRow[] = await Promise.all(
        raw.map(async (r) => {
          const u = await db.findUserById(r.userId);
          return {
            id: r.id,
            rating: r.rating,
            body: r.body,
            helpfulCount: r.helpfulCount,
            createdAt: r.createdAt,
            instructorReply: r.instructorReply,
            instructorRepliedAt: r.instructorRepliedAt,
            author: u ? { name: u.name, avatar: u.avatar } : { name: "Learner", avatar: "" },
            isOwnReview: r.userId === user.id,
            helpfulVotedByMe: r.helpfulVoterIds.includes(user.id),
          };
        }),
      );
      return rows.sort((a, b) => b.createdAt - a.createdAt);
    })(),
    db.isWishlisted(user.id, track.slug),
  ]);
  const userReview = reviewRows.find((r) => r.isOwnReview);
  const hasAlreadyReviewed = Boolean(userReview);
  const prereqTitles = (track.prerequisiteSlugs ?? [])
    .map((s) => getTrack(s)?.title ?? s)
    .filter(Boolean);

  return (
    <div className="section-pad-x py-10">
      <div className="grid lg:grid-cols-[1fr_360px] gap-8">
        <div>
          <Link href="/tracks" className="text-[13px] text-t3 underline">← All tracks</Link>
          {showPending && (
            <div className="mt-3 text-[13px] rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-amber-100">
              Your enrollment is waiting for instructor approval. You can browse the course outline; lesson access
              starts after approval.
            </div>
          )}
          {showPrereq && enrollment && prereqMissing.length > 0 && (
            <div className="mt-3 text-[13px] rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-rose-100">
              Complete these courses first: {prereqMissing.map((s) => getTrack(s)?.title ?? s).join(", ")}. Then
              you can open lessons here.
            </div>
          )}
          {prereqTitles.length > 0 && !enrollment && (
            <div className="mt-3 text-[12px] text-t3">
              Requires: {prereqTitles.join(" · ")}
            </div>
          )}
          <div className="flex items-center gap-3 mt-3 mb-2">
            <div className="w-14 h-14 rounded-[12px] flex items-center justify-center text-[28px]" style={{ background: `rgba(${track.color},0.14)` }}>{track.heroEmoji}</div>
            <div>
              <div className="flex gap-2 mb-1">
                {track.youthFriendly && <span className="pill pill-purple">★ Youth Zone</span>}
                <span className="pill">{track.level}</span>
                <span className="pill pill-g">Free forever</span>
              </div>
              <h1 className="font-display text-[28px] font-extrabold leading-tight">{track.title}</h1>
            </div>
          </div>
          <p className="text-t2 text-[15px] mb-6 max-w-[680px]">{track.summary}</p>

          <div className="grid sm:grid-cols-3 gap-3 mb-8">
            <Mini label="Duration" value={`${track.weeks} weeks`} />
            <Mini label="Modules" value={`${track.modules.length}`} />
            <Mini label="Outcome" value={track.averageWageUplift} />
          </div>

          <h2 className="font-display text-[20px] font-bold mb-3">What you'll learn</h2>
          <div className="flex flex-wrap gap-2 mb-8">
            {track.skills.map((s) => <span key={s} className="pill pill-g">{s}</span>)}
          </div>

          <h2 className="font-display text-[20px] font-bold mb-3">Curriculum</h2>
          <div className="flex flex-col gap-6 mb-10">
            {(() => {
              let globalIndex = 0;
              return units.map((unit) => (
                <div key={unit.id}>
                  {units.length > 1 && <h3 className="text-[15px] font-bold text-t2 mb-2">{unit.title}</h3>}
                  <div className="flex flex-col gap-2">
                    {unit.lessons.map((m) => {
                      globalIndex += 1;
                      const i = globalIndex - 1;
                      const done = enrollment?.completedModuleIds.includes(m.id);
                      return (
                        <div key={m.id} className={`card p-4 flex items-center gap-4 ${done ? "border-g" : ""}`} style={done ? { borderColor: "rgba(31,200,126,0.4)" } : {}}>
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-[13px] shrink-0 ${done ? "bg-g text-ink" : "bg-[rgba(255,255,255,0.08)] text-t2"}`}>
                            {done ? "✓" : i + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-[14px] flex flex-wrap items-center gap-2">
                              {m.title}
                              {m.isPreview && <span className="pill pill-g text-[10px]">Preview</span>}
                            </div>
                            <div className="text-[12px] text-t3 truncate">{m.summary}</div>
                          </div>
                          <div className="text-[12px] text-t3 hidden sm:block shrink-0">{m.duration}</div>
                          {enrollment && (
                            <Link href={`/learn/${track.slug}/${m.id}`} className="btn btn-ghost btn-sm">
                              {done ? "Review" : "Open"}
                            </Link>
                          )}
                          {!enrollment && m.isPreview && (
                            <Link href={`/learn/${track.slug}/${m.id}`} className="btn btn-ghost btn-sm">Preview</Link>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ));
            })()}
          </div>

          <CourseReviewsSection
            trackSlug={track.slug}
            canPost={Boolean(enrollment)}
            hasAlreadyReviewed={hasAlreadyReviewed}
            initialReviews={reviewRows}
          />

          {jobs.length > 0 && (
            <>
              <h2 className="font-display text-[20px] font-bold mb-3">Local jobs waiting for graduates</h2>
              <div className="grid gap-3 mb-6">
                {jobs.map((j: Job) => (
                  <Link key={j.id} href={`/jobs/${j.id}`} className="card card-hover p-4 flex items-center justify-between">
                    <div>
                      <div className="font-semibold">{j.title} · {j.company}</div>
                      <div className="text-[12px] text-t3">${j.wageFrom}–${j.wageTo}/{j.wageUnit} · {j.neighborhood}</div>
                    </div>
                    {j.hireGuarantee && <span className="pill pill-g">90-day hire guarantee</span>}
                  </Link>
                ))}
              </div>
            </>
          )}
        </div>

        <aside className="lg:sticky lg:top-6 self-start flex flex-col gap-4">
          <div className="card p-5">
            {enrollment ? (
              <>
                <div className="text-[13px] text-t3 mb-1">You're enrolled</div>
                <div className="font-display text-[28px] font-extrabold mb-2">{pct}%</div>
                <Progress value={pct} />
                <div className="flex flex-col gap-2 mt-2">
                  <Link
                    href={`/learn/${track.slug}/${track.modules.find((m) => !enrollment.completedModuleIds.includes(m.id))?.id ?? track.modules[0].id}`}
                    className="btn btn-primary w-full justify-center"
                  >
                    {pct === 100 ? "Review" : "Continue learning"}
                  </Link>
                  <Link href={`/tracks/${track.slug}/assignments`} className="btn btn-ghost w-full justify-center text-[13px]">
                    Assignments
                  </Link>
                  <Link href={`/tracks/${track.slug}/announcements`} className="btn btn-ghost w-full justify-center text-[13px]">
                    Announcements
                  </Link>
                  <Link href={`/tracks/${track.slug}/forum`} className="btn btn-ghost w-full justify-center text-[13px]">
                    Discussion
                  </Link>
                  <Link href={`/tracks/${track.slug}/messages`} className="btn btn-ghost w-full justify-center text-[13px]">
                    Messages
                  </Link>
                  {user.role !== "employer" && user.role !== "school" && (
                    <WishlistHeartButton trackSlug={track.slug} initialSaved={wishlisted} />
                  )}
                </div>
              </>
            ) : (
              <>
                <div className="font-display text-[22px] font-extrabold mb-1">Free. Forever.</div>
                <div className="text-[13px] text-t3 mb-4">Start now. Stop any time. Keep what you learned.</div>
                <div className="flex flex-col gap-2">
                  <EnrollButton trackSlug={track.slug} />
                  {user.role !== "employer" && user.role !== "school" && (
                    <WishlistHeartButton trackSlug={track.slug} initialSaved={wishlisted} />
                  )}
                </div>
              </>
            )}
          </div>

          {(user.id === track.teacherId || user.role === "admin") && (
            <div className="card p-4">
              <div className="text-[11px] uppercase tracking-wider text-t3 mb-2">Instructor tools</div>
              <div className="flex flex-col gap-1 text-[13px]">
                <Link href={`/teach/course/${encodeURIComponent(track.slug)}`} className="underline text-t2">
                  Open instructor dashboard
                </Link>
                <Link href={`/teach/course/${encodeURIComponent(track.slug)}/assignments`} className="underline text-t2">
                  Assignments
                </Link>
              </div>
            </div>
          )}

          {teacher && (
            <div className="card p-5">
              <div className="flex items-center gap-3 mb-3">
                <Avatar spec={teacher.avatar} size={44} />
                <div>
                  <div className="font-semibold text-[14px]">{teacher.name}</div>
                  <div className="text-[11px] text-t3">{teacher.credentials}</div>
                </div>
              </div>
              <p className="text-[12.5px] text-t2">{teacher.bio}</p>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="card p-4">
      <div className="text-[11px] uppercase tracking-wider text-t3">{label}</div>
      <div className="font-semibold text-[16px] mt-1">{value}</div>
    </div>
  );
}
