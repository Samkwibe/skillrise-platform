import Link from "next/link";
import { requireVerifiedUser } from "@/lib/auth";
import { store, getTrack, userCertificates } from "@/lib/store";
import { PageHeader } from "@/components/page-header";
import { JobsLiveSearch } from "@/components/jobs/jobs-live-search";

export const dynamic = "force-dynamic";

export default async function JobsPage() {
  const user = await requireVerifiedUser();
  // Teens don't get the job board; the rest of the redirect logic lives
  // in the role shell, but we guard here too for belt-and-suspenders.
  const showLiveSearch = user.role !== "teen";
  const myCerts = userCertificates(user.id);
  const myTracks = new Set(myCerts.map((c) => c.trackSlug));
  const jobs = store.jobs
    .filter((j) => j.status === "open")
    .map((j) => ({
      ...j,
      match: j.requiredTrackSlug ? (myTracks.has(j.requiredTrackSlug) ? "ready" : "need-cert") : "any",
    }))
    .sort((a, b) => {
      const order: Record<string, number> = { ready: 0, any: 1, "need-cert": 2 };
      return (order[a.match] ?? 9) - (order[b.match] ?? 9);
    });

  return (
    <div className="section-pad-x py-10 flex flex-col gap-6">
      <PageHeader
        eyebrow="Local jobs"
        title="Matched to your certificates — and your neighborhood."
        subtitle="Every employer here has signed the SkillRise hire-guarantee pledge. One-tap apply with your verified credentials."
      />
      {showLiveSearch && <JobsLiveSearch />}
      <div>
        <h2
          className="font-extrabold text-[18px] md:text-[20px] mb-3"
          style={{ fontFamily: "var(--role-font-display)" }}
        >
          Partner jobs with the 90-day hire guarantee
        </h2>
      <div className="grid lg:grid-cols-2 gap-4">
        {jobs.map((j) => {
          const track = j.requiredTrackSlug ? getTrack(j.requiredTrackSlug) : null;
          return (
            <Link key={j.id} href={`/jobs/${j.id}`} className="card card-hover p-5">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <div className="font-display text-[18px] font-bold">{j.title}</div>
                  <div className="text-[13px] text-t3">{j.company} · {j.neighborhood}</div>
                </div>
                {j.match === "ready" && <span className="pill pill-g">✓ Ready to apply</span>}
                {j.match === "need-cert" && <span className="pill pill-amber">Need cert</span>}
                {j.match === "any" && <span className="pill">Open to all</span>}
              </div>
              <div className="text-[14px] text-t2 mb-4 line-clamp-2">{j.description}</div>
              <div className="flex flex-wrap items-center gap-2 text-[12px]">
                <span className="pill">${j.wageFrom}–${j.wageTo}/{j.wageUnit}</span>
                <span className="pill">{j.type}</span>
                {track && <span className="pill pill-blue">{track.title}</span>}
                {j.hireGuarantee && <span className="pill pill-g">90-day guarantee</span>}
              </div>
            </Link>
          );
        })}
      </div>
      </div>
    </div>
  );
}
