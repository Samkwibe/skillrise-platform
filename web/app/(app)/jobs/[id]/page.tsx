import { notFound } from "next/navigation";
import Link from "next/link";
import { requireVerifiedUser } from "@/lib/auth";
import { store, getTrack, userCertificates, findUserById } from "@/lib/store";
import { ApplyForm } from "@/components/apply-form";

export const dynamic = "force-dynamic";

export default async function JobDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireVerifiedUser();
  const job = store.jobs.find((j) => j.id === id);
  if (!job) return notFound();

  const track = job.requiredTrackSlug ? getTrack(job.requiredTrackSlug) : null;
  const employer = findUserById(job.employerId);
  const myCerts = userCertificates(user.id);
  const matchingCert = job.requiredTrackSlug ? myCerts.find((c) => c.trackSlug === job.requiredTrackSlug) : null;
  const existing = store.applications.find((a) => a.userId === user.id && a.jobId === job.id);

  return (
    <div className="section-pad-x py-10 grid lg:grid-cols-[1fr_380px] gap-8">
      <div>
        <Link href="/jobs" className="text-[13px] text-t3 underline">← All jobs</Link>
        <h1 className="font-display text-[30px] font-extrabold mt-2 mb-1">{job.title}</h1>
        <div className="text-t2 mb-4">{job.company} · {job.neighborhood} · Posted {new Date(job.postedAt).toLocaleDateString()}</div>

        <div className="flex flex-wrap gap-2 mb-6">
          <span className="pill pill-g">${job.wageFrom}–${job.wageTo}/{job.wageUnit}</span>
          <span className="pill">{job.type}</span>
          {track && <span className="pill pill-blue">Cert: {track.title}</span>}
          {job.hireGuarantee && <span className="pill pill-g">90-day hire guarantee</span>}
        </div>

        <h2 className="font-display text-[18px] font-bold mb-2">About the role</h2>
        <p className="text-t2 text-[14.5px] leading-relaxed mb-8">{job.description}</p>

        {employer && (
          <>
            <h2 className="font-display text-[18px] font-bold mb-2">About {job.company}</h2>
            <p className="text-t2 text-[14px] mb-2">Part of the SkillRise employer network. Hires recent graduates with verified SkillRise certificates.</p>
            <div className="text-[12px] text-t3">Contact: {employer.email}</div>
          </>
        )}
      </div>

      <aside className="lg:sticky lg:top-6 self-start">
        <div className="card p-5">
          {user.role === "employer" ? (
            <div className="text-[13px] text-t2">You're signed in as an employer. Switch to a learner account to apply.</div>
          ) : existing ? (
            <>
              <span className="pill pill-g mb-3">{existing.status === "hired" ? "🎉 Hired" : `Application ${existing.status}`}</span>
              <div className="font-display text-[18px] font-bold mb-1">You applied {new Date(existing.appliedAt).toLocaleDateString()}</div>
              <div className="text-[13px] text-t2">The employer will reach out directly via your email on file.</div>
            </>
          ) : (
            <>
              <div className="font-display text-[18px] font-bold mb-2">One-tap apply</div>
              {job.requiredTrackSlug && !matchingCert ? (
                <>
                  <p className="text-[13px] text-t2 mb-3">You need the <span className="font-semibold text-t1">{track?.title}</span> certificate to qualify.</p>
                  <Link href={`/tracks/${job.requiredTrackSlug}`} className="btn btn-primary w-full justify-center">Start the track</Link>
                </>
              ) : (
                <ApplyForm jobId={job.id} certificateIds={myCerts.map((c) => c.id)} />
              )}
            </>
          )}
        </div>
      </aside>
    </div>
  );
}
