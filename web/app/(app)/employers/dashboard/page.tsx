import Link from "next/link";
import { requireVerifiedUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { store, findUserById, employerJobs, jobApplications } from "@/lib/store";
import { PageHeader } from "@/components/page-header";
import { Avatar } from "@/components/ui/avatar";
import { ApplicantStatusSelect } from "@/components/applicant-status-select";

export const dynamic = "force-dynamic";

export default async function EmployerDashboard() {
  const user = await requireVerifiedUser();
  if (user.role !== "employer" && user.role !== "admin") redirect("/dashboard");

  const jobs = user.role === "admin" ? store.jobs : employerJobs(user.id);
  const allApps = jobs.flatMap((j) => jobApplications(j.id));
  const hired = allApps.filter((a) => a.status === "hired").length;

  return (
    <div className="section-pad-x py-10">
      <PageHeader
        eyebrow="Employer hub"
        title={user.role === "admin" ? "All employer activity" : `${user.company ?? user.name}`}
        subtitle="Post roles, review verified applicants, track time-to-hire, redeem your 90-day guarantee."
        right={<Link href="/employers/post" className="btn btn-primary btn-sm">+ Post a job</Link>}
      />

      <div className="grid md:grid-cols-4 gap-4 mb-8">
        <Stat label="Open roles" value={jobs.filter((j) => j.status === "open").length} />
        <Stat label="Applications" value={allApps.length} />
        <Stat label="Hired" value={hired} />
        <Stat label="Avg time-to-hire" value={hired === 0 ? "—" : "11 days"} />
      </div>

      <h2 className="font-display text-[20px] font-bold mb-3">Roles</h2>
      <div className="grid gap-4 mb-10">
        {jobs.map((j) => {
          const apps = jobApplications(j.id);
          return (
            <div key={j.id} className="card p-5">
              <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                <div>
                  <div className="font-display text-[17px] font-bold">{j.title}</div>
                  <div className="text-[12px] text-t3">${j.wageFrom}–${j.wageTo}/{j.wageUnit} · {j.type} · {j.neighborhood}</div>
                </div>
                <span className={`pill ${j.status === "open" ? "pill-g" : "pill-amber"}`}>{j.status}</span>
              </div>

              {apps.length === 0 ? (
                <div className="text-[13px] text-t3">No applicants yet. Expect 3–7 matched applicants per day after 48 hours.</div>
              ) : (
                <div className="flex flex-col divide-y divide-border1">
                  {apps.map((a) => {
                    const applicant = findUserById(a.userId);
                    if (!applicant) return null;
                    const certs = a.certificateIds.map((id) => store.certificates.find((c) => c.id === id)).filter(Boolean);
                    return (
                      <div key={a.id} className="py-3 flex items-start gap-3">
                        <Avatar spec={applicant.avatar} size={40} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <div className="font-semibold">{applicant.name}</div>
                            {certs.map((c) => c && <Link key={c.id} href={`/cert/${c.id}`} className="pill pill-g">🏅 verified</Link>)}
                          </div>
                          <div className="text-[12px] text-t3">{applicant.neighborhood} · Applied {new Date(a.appliedAt).toLocaleDateString()}</div>
                          {a.note && <div className="text-[13px] text-t2 mt-1">"{a.note}"</div>}
                        </div>
                        <ApplicantStatusSelect appId={a.id} current={a.status} />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
        {jobs.length === 0 && <div className="card p-6 text-center text-t3">You haven't posted any jobs yet.</div>}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="card p-5">
      <div className="text-[12px] uppercase tracking-wider text-t3">{label}</div>
      <div className="font-display text-[28px] font-extrabold mt-1">{value}</div>
    </div>
  );
}
