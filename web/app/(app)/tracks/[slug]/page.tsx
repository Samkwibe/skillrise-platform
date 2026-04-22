import { notFound } from "next/navigation";
import Link from "next/link";
import { getTrack, store, findUserById } from "@/lib/store";
import { requireVerifiedUser } from "@/lib/auth";
import { Avatar } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { EnrollButton } from "@/components/enroll-button";

export const dynamic = "force-dynamic";

export default async function TrackDetail({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const user = await requireVerifiedUser();
  const track = getTrack(slug);
  if (!track) return notFound();

  const teacher = findUserById(track.teacherId);
  const enrollment = store.enrollments.find((e) => e.userId === user.id && e.trackSlug === track.slug);
  const pct = enrollment ? Math.round((enrollment.completedModuleIds.length / track.modules.length) * 100) : 0;
  const jobs = store.jobs.filter((j) => j.requiredTrackSlug === track.slug && j.status === "open");

  return (
    <div className="section-pad-x py-10">
      <div className="grid lg:grid-cols-[1fr_360px] gap-8">
        <div>
          <Link href="/tracks" className="text-[13px] text-t3 underline">← All tracks</Link>
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
          <div className="flex flex-col gap-2 mb-10">
            {track.modules.map((m, i) => {
              const done = enrollment?.completedModuleIds.includes(m.id);
              return (
                <div key={m.id} className={`card p-4 flex items-center gap-4 ${done ? "border-g" : ""}`} style={done ? { borderColor: "rgba(31,200,126,0.4)" } : {}}>
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-[13px] shrink-0 ${done ? "bg-g text-ink" : "bg-[rgba(255,255,255,0.08)] text-t2"}`}>
                    {done ? "✓" : i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-[14px]">{m.title}</div>
                    <div className="text-[12px] text-t3 truncate">{m.summary}</div>
                  </div>
                  <div className="text-[12px] text-t3 hidden sm:block">{m.duration}</div>
                  {enrollment && (
                    <Link href={`/learn/${track.slug}/${m.id}`} className="btn btn-ghost btn-sm">
                      {done ? "Review" : "Open"}
                    </Link>
                  )}
                </div>
              );
            })}
          </div>

          {jobs.length > 0 && (
            <>
              <h2 className="font-display text-[20px] font-bold mb-3">Local jobs waiting for graduates</h2>
              <div className="grid gap-3 mb-6">
                {jobs.map((j) => (
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
                <Link href={`/learn/${track.slug}/${track.modules.find((m) => !enrollment.completedModuleIds.includes(m.id))?.id ?? track.modules[0].id}`} className="btn btn-primary w-full mt-4 justify-center">
                  {pct === 100 ? "Review" : "Continue learning"}
                </Link>
              </>
            ) : (
              <>
                <div className="font-display text-[22px] font-extrabold mb-1">Free. Forever.</div>
                <div className="text-[13px] text-t3 mb-4">Start now. Stop any time. Keep what you learned.</div>
                <EnrollButton trackSlug={track.slug} />
              </>
            )}
          </div>

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
