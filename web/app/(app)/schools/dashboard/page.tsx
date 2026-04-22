import { requireVerifiedUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { store, getTrack, findUserById } from "@/lib/store";
import { PageHeader } from "@/components/page-header";
import { Avatar } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";

export const dynamic = "force-dynamic";

export default async function SchoolDashboard() {
  const user = await requireVerifiedUser();
  if (user.role !== "school" && user.role !== "admin") redirect("/dashboard");

  const classes = user.role === "admin"
    ? store.schoolClasses
    : store.schoolClasses.filter((c) => c.schoolId === user.id);

  const totalStudents = classes.reduce((s, c) => s + c.studentIds.length, 0);
  const totalCerts = classes.reduce((s, c) => {
    const ids = new Set(c.studentIds);
    return s + store.certificates.filter((cert) => ids.has(cert.userId) && cert.trackSlug === c.trackSlug).length;
  }, 0);

  return (
    <div className="section-pad-x py-10">
      <PageHeader
        eyebrow="Schools"
        title={user.company ?? user.name}
        subtitle="Assign a SkillRise track as career class homework. Track class-wide progress, certificates, and job offers."
      />
      <div className="grid md:grid-cols-4 gap-4 mb-10">
        <Stat label="Classes" value={classes.length} />
        <Stat label="Students" value={totalStudents} />
        <Stat label="Certificates earned" value={totalCerts} />
        <Stat label="Job interviews (30d)" value={store.applications.filter((a) => ["interview", "offered", "hired"].includes(a.status)).length} />
      </div>

      <div className="grid gap-6">
        {classes.map((c) => {
          const track = getTrack(c.trackSlug);
          if (!track) return null;
          return (
            <div key={c.id} className="card p-5">
              <div className="flex flex-wrap justify-between items-start gap-3 mb-4">
                <div>
                  <div className="font-display text-[18px] font-bold">{c.name}</div>
                  <div className="text-[13px] text-t3">{track.title} · {c.studentIds.length} students</div>
                </div>
                <span className="pill pill-g">Assigned track</span>
              </div>
              {c.studentIds.length === 0 ? (
                <div className="text-[13px] text-t3">No students assigned yet. Add student emails to start tracking.</div>
              ) : (
                <div className="flex flex-col gap-3">
                  {c.studentIds.map((sid) => {
                    const s = findUserById(sid);
                    const enrollment = store.enrollments.find((e) => e.userId === sid && e.trackSlug === c.trackSlug);
                    const cert = store.certificates.find((cert) => cert.userId === sid && cert.trackSlug === c.trackSlug);
                    const pct = enrollment ? Math.round((enrollment.completedModuleIds.length / track.modules.length) * 100) : 0;
                    if (!s) return null;
                    return (
                      <div key={sid} className="flex items-center gap-3">
                        <Avatar spec={s.avatar} size={36} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <div className="font-semibold text-[14px]">{s.name}</div>
                            {cert && <span className="pill pill-g">🏅 earned</span>}
                          </div>
                          <div className="mt-1"><Progress value={pct} /></div>
                        </div>
                        <div className="text-[12px] text-t3 w-[60px] text-right">{pct}%</div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
        {classes.length === 0 && <div className="card p-6 text-center text-t3">No classes yet.</div>}
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
