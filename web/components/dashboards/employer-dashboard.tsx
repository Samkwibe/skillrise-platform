import Link from "next/link";
import type { User, Application, Job } from "@/lib/store";
import { store, findUserById, userCertificates } from "@/lib/store";
import { Avatar } from "@/components/ui/avatar";
import {
  CandidateDrawerProvider,
  CandidateCardButton,
  type CandidateData,
  type KanbanCardBinding,
} from "./candidate-drawer";

/**
 * Employer dashboard — "HR / recruiting dashboard".
 * Kanban pipeline as the hero (Submitted → Reviewed → Interview → Offered → Hired).
 * Plus: time-to-hire gauge, funnel bars, role-health list.
 * Light mode only. No learning content at all.
 */
const STAGES: Array<{ key: Application["status"]; label: string; accent: string }> = [
  { key: "submitted", label: "Applied", accent: "var(--blue)" },
  { key: "reviewed", label: "Shortlisted", accent: "var(--amber)" },
  { key: "interview", label: "Interview", accent: "var(--purple)" },
  { key: "offered", label: "Offered", accent: "var(--g)" },
  { key: "hired", label: "Hired", accent: "var(--g)" },
];

function daysAgo(ts: number): string {
  const d = Math.max(0, Math.floor((Date.now() - ts) / 86_400_000));
  if (d === 0) return "today";
  if (d === 1) return "1d ago";
  return `${d}d ago`;
}

export function EmployerDashboard({ user }: { user: User }) {
  const myJobs: Job[] = store.jobs.filter((j) => j.employerId === user.id);
  const myApps: Application[] = store.applications.filter((a) =>
    myJobs.some((j) => j.id === a.jobId),
  );
  const groupedByStage = STAGES.reduce<Record<Application["status"], Application[]>>(
    (acc, s) => {
      acc[s.key] = myApps.filter((a) => a.status === s.key);
      return acc;
    },
    {} as Record<Application["status"], Application[]>,
  );
  groupedByStage.rejected = myApps.filter((a) => a.status === "rejected");

  const hired = myApps.filter((a) => a.status === "hired");
  const avgTtH =
    hired.length > 0
      ? Math.round(
          hired.reduce((s, a) => s + (Date.now() - a.appliedAt), 0) /
            hired.length /
            86_400_000,
        )
      : null;

  const funnelTotal = Math.max(myApps.length, 1);
  const openJobs = myJobs.filter((j) => j.status === "open");

  const applicantUsers: NonNullable<ReturnType<typeof findUserById>>[] = [];
  const seenApplicant = new Set<string>();
  for (const a of myApps) {
    const u = findUserById(a.userId);
    if (u && !seenApplicant.has(u.id)) {
      seenApplicant.add(u.id);
      applicantUsers.push(u);
      if (applicantUsers.length >= 16) break;
    }
  }

  const bindings: KanbanCardBinding[] = myApps.map((a) => {
    const applicant = findUserById(a.userId);
    const job = myJobs.find((j) => j.id === a.jobId);
    const jobTrack = job?.requiredTrackSlug
      ? store.tracks.find((t) => t.slug === job.requiredTrackSlug)
      : undefined;
    const applicantCerts = applicant ? userCertificates(applicant.id) : [];
    const applicantTracks = applicant
      ? store.enrollments
          .filter((e) => e.userId === applicant.id)
          .map((e) => store.tracks.find((t) => t.slug === e.trackSlug))
          .filter((t): t is NonNullable<typeof t> => Boolean(t))
      : [];
    const applicantSkillSet = new Set<string>();
    applicantTracks.forEach((t) => t.skills.forEach((s) => applicantSkillSet.add(s)));
    applicantCerts.forEach((c) => {
      const t = store.tracks.find((t) => t.slug === c.trackSlug);
      t?.skills.forEach((s) => applicantSkillSet.add(s));
    });
    const jobSkills = jobTrack?.skills ?? [];
    const applicantSkills = Array.from(applicantSkillSet);
    const matched = applicantSkills.filter((s) => jobSkills.includes(s));
    const unionSkills = Array.from(new Set([...jobSkills, ...applicantSkills])).slice(0, 10);
    return {
      appId: a.id,
      data: {
        id: a.id,
        applicantName: applicant?.name ?? "Applicant",
        applicantInitials: (applicant?.name ?? "?")
          .split(" ")
          .map((p) => p[0])
          .slice(0, 2)
          .join(""),
        applicantAvatar: applicant?.avatar ?? "",
        email: applicant?.email ?? "",
        neighborhood: applicant?.neighborhood ?? "",
        role: job?.title ?? "Role",
        note: a.note,
        appliedAt: a.appliedAt,
        status: a.status,
        certificates: applicantCerts.map((c) => {
          const t = store.tracks.find((t) => t.slug === c.trackSlug);
          return { id: c.id, track: t?.title ?? c.trackSlug, issuedAt: c.issuedAt };
        }),
        skills: unionSkills.length > 0 ? unionSkills : applicantSkills.slice(0, 8),
        matchedSkills: matched,
      } satisfies CandidateData,
    };
  });

  return (
    <CandidateDrawerProvider cards={bindings}>
    <div className="px-4 sm:px-5 md:px-7 py-5 md:py-6">
      {/* Page title + meta */}
      <div className="flex items-end justify-between mb-5 flex-wrap gap-3">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-[0.14em]" style={{ color: "var(--g)" }}>
            Recruiting dashboard
          </div>
          <h1 className="text-[26px] font-extrabold mt-1" style={{ letterSpacing: "-0.015em" }}>
            {user.company || user.name}
          </h1>
          <div className="text-[13.5px] mt-0.5" style={{ color: "var(--text-2)" }}>
            {myJobs.length} roles · {myApps.length} applicants · {openJobs.length} open
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/employers/post"
            className="inline-flex items-center gap-1 px-3 py-2 rounded-[8px] text-[13px] font-semibold"
            style={{ background: "var(--g)", color: "#fff" }}
          >
            + New role
          </Link>
        </div>
      </div>

      {applicantUsers.length > 0 ? (
        <section
          className="mb-5 md:mb-6 p-4 rounded-[10px]"
          style={{ background: "var(--surface-1)", border: "1px solid var(--border-1)" }}
        >
          <div className="text-[11px] font-bold uppercase tracking-[0.12em] mb-2" style={{ color: "var(--text-3)" }}>
            People in your pipeline
          </div>
          <p className="text-[12.5px] mb-3" style={{ color: "var(--text-2)" }}>
            Real applicants who applied to your open roles.
          </p>
          <div className="flex flex-wrap gap-2">
            {applicantUsers.map((u) => (
              <div
                key={u.id}
                className="flex items-center gap-2 rounded-lg px-2 py-1.5"
                style={{ background: "var(--surface-2)", border: "1px solid var(--border-1)" }}
              >
                <Avatar spec={u.avatar} photoUrl={u.avatarUrl} name={u.name} size={36} />
                <span className="text-[13px] font-semibold truncate max-w-[120px]">{u.name}</span>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {/* Metric row */}
      <div className="grid grid-cols-2 md:grid-cols-4 3xl:grid-cols-6 4k:grid-cols-8 gap-2.5 sm:gap-3 mb-5 md:mb-6">
        {[
          { label: "Total applicants", value: myApps.length, sub: "this month" },
          { label: "In pipeline", value: myApps.length - (groupedByStage.hired?.length ?? 0) - (groupedByStage.rejected?.length ?? 0), sub: "active" },
          { label: "Hires", value: hired.length, sub: "ytd", accent: "var(--g)" },
          { label: "Avg time to hire", value: avgTtH !== null ? `${avgTtH}d` : "—", sub: "rolling" },
        ].map((m) => (
          <div
            key={m.label}
            className="p-4 rounded-[10px]"
            style={{ background: "var(--surface-1)", border: "1px solid var(--border-1)" }}
          >
            <div className="text-[11px] font-bold uppercase tracking-[0.12em]" style={{ color: "var(--text-3)" }}>
              {m.label}
            </div>
            <div
              className="text-[28px] font-extrabold mt-1 leading-none"
              style={{ color: m.accent ?? "var(--text-1)", letterSpacing: "-0.02em" }}
            >
              {m.value}
            </div>
            <div className="text-[11.5px] mt-1" style={{ color: "var(--text-3)" }}>
              {m.sub}
            </div>
          </div>
        ))}
      </div>

      {/* Kanban pipeline */}
      <section className="mb-8">
        <div className="flex items-baseline justify-between mb-3">
          <h2 className="text-[16px] font-bold">Applicant pipeline</h2>
          <Link href="/employers/dashboard" className="text-[12.5px] underline" style={{ color: "var(--text-2)" }}>
            Open full board →
          </Link>
        </div>
        {/* Mobile: horizontal scroll-snap rail (swipe between stages).
            md+: 5-column grid.
            3xl+: slightly denser gap. */}
        <div className="-mx-4 sm:mx-0 px-4 sm:px-0 overflow-x-auto md:overflow-visible no-scrollbar scroll-snap-x">
        <div className="flex gap-3 3xl:gap-4 md:grid md:grid-cols-5 min-w-max md:min-w-0">
          {STAGES.map((s) => {
            const cards = groupedByStage[s.key] ?? [];
            return (
              <div key={s.key} className="kanban-col w-[260px] shrink-0 md:w-auto md:shrink">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full" style={{ background: s.accent }} />
                    <span className="text-[11.5px] font-bold uppercase tracking-wider" style={{ color: "var(--text-2)" }}>
                      {s.label}
                    </span>
                  </div>
                  <span
                    className="text-[11px] font-bold px-1.5 py-0.5 rounded"
                    style={{ background: "var(--surface-1)", color: "var(--text-2)" }}
                  >
                    {cards.length}
                  </span>
                </div>
                {cards.length === 0 ? (
                  <div className="text-[12px] py-4 text-center" style={{ color: "var(--text-3)" }}>
                    —
                  </div>
                ) : (
                  cards.slice(0, 4).map((a) => {
                    const applicant = findUserById(a.userId);
                    const job = myJobs.find((j) => j.id === a.jobId);
                    const applicantCerts = applicant ? userCertificates(applicant.id) : [];
                    const binding = bindings.find((b) => b.appId === a.id);
                    const matched = binding?.data.matchedSkills.length ?? 0;
                    const total = Math.max(binding?.data.skills.length ?? 0, 1);
                    const matchPct = Math.round((matched / total) * 100);
                    return (
                      <CandidateCardButton
                        key={a.id}
                        appId={a.id}
                        className="kanban-card"
                      >
                        {applicant && (
                          <Avatar spec={applicant.avatar} photoUrl={applicant.avatarUrl} name={applicant.name} size={34} />
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <div className="text-[13px] font-semibold truncate">
                              {applicant?.name ?? "Applicant"}
                            </div>
                            {matched > 0 && (
                              <span
                                className="text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0"
                                style={{
                                  background: matchPct > 60 ? "color-mix(in srgb, var(--g) 14%, transparent)" : "color-mix(in srgb, var(--amber) 14%, transparent)",
                                  color: matchPct > 60 ? "var(--g)" : "var(--amber)",
                                }}
                              >
                                {matchPct}% match
                              </span>
                            )}
                          </div>
                          <div className="text-[11.5px] truncate mt-0.5" style={{ color: "var(--text-3)" }}>
                            {job?.title ?? "Role"}
                          </div>
                          <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                            {applicantCerts.slice(0, 2).map((c) => (
                              <span
                                key={c.id}
                                className="text-[10px] px-1.5 py-0.5 rounded"
                                style={{ background: "color-mix(in srgb, var(--g) 14%, transparent)", color: "var(--g)" }}
                              >
                                🏅 cert
                              </span>
                            ))}
                            <span
                              className="text-[10px] ml-auto"
                              style={{ color: "var(--text-3)" }}
                            >
                              {daysAgo(a.appliedAt)}
                            </span>
                          </div>
                        </div>
                      </CandidateCardButton>
                    );
                  })
                )}
                {cards.length > 4 && (
                  <div className="text-[11px] text-center pt-1" style={{ color: "var(--text-3)" }}>
                    +{cards.length - 4} more
                  </div>
                )}
              </div>
            );
          })}
        </div>
        </div>
      </section>

      {/* Funnel + Roles */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-5">
        <section
          className="p-5 rounded-[10px]"
          style={{ background: "var(--surface-1)", border: "1px solid var(--border-1)" }}
        >
          <div className="text-[11px] font-bold uppercase tracking-[0.12em] mb-3" style={{ color: "var(--text-3)" }}>
            Funnel (applicants this cycle)
          </div>
          <div className="flex flex-col gap-2">
            {STAGES.concat([{ key: "rejected", label: "Rejected", accent: "var(--red)" } as (typeof STAGES)[number]]).map(
              (s) => {
                const count = groupedByStage[s.key]?.length ?? 0;
                const pct = Math.round((count / funnelTotal) * 100);
                return (
                  <div key={s.key} className="flex items-center gap-3">
                    <div className="w-[90px] text-[12px] font-semibold" style={{ color: "var(--text-2)" }}>
                      {s.label}
                    </div>
                    <div
                      className="flex-1 h-7 rounded-[6px] overflow-hidden"
                      style={{ background: "var(--surface-2)" }}
                    >
                      <div
                        className="h-full flex items-center px-2 text-[11px] font-bold"
                        style={{
                          width: `${Math.max(pct, 3)}%`,
                          background: s.accent,
                          color: "#fff",
                          transition: "width 0.5s ease",
                        }}
                      >
                        {count} · {pct}%
                      </div>
                    </div>
                  </div>
                );
              },
            )}
          </div>
        </section>

        <section
          className="p-5 rounded-[10px]"
          style={{ background: "var(--surface-1)", border: "1px solid var(--border-1)" }}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="text-[11px] font-bold uppercase tracking-[0.12em]" style={{ color: "var(--text-3)" }}>
              Open roles
            </div>
            <Link href="/employers/post" className="text-[12px] underline" style={{ color: "var(--text-2)" }}>
              + Post
            </Link>
          </div>
          {myJobs.length === 0 ? (
            <div className="text-[13px] py-4 text-center" style={{ color: "var(--text-3)" }}>
              No roles yet.{" "}
              <Link href="/employers/post" className="underline" style={{ color: "var(--g)" }}>
                Post your first
              </Link>
              .
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {myJobs.slice(0, 6).map((j) => {
                const apps = myApps.filter((a) => a.jobId === j.id);
                return (
                  <Link
                    key={j.id}
                    href={`/jobs/${j.id}`}
                    className="flex items-center justify-between gap-3 p-3 rounded-[8px] hover:bg-[var(--surface-2)] transition-colors"
                    style={{ border: "1px solid var(--border-1)" }}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="text-[13.5px] font-semibold truncate">{j.title}</div>
                      <div className="text-[11.5px] truncate" style={{ color: "var(--text-3)" }}>
                        {j.neighborhood} · ${j.wageFrom}–${j.wageTo}/{j.wageUnit} · {j.type}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-[11.5px] font-semibold" style={{ color: "var(--text-2)" }}>
                        {apps.length} apps
                      </span>
                      <span
                        className="text-[11px] px-2 py-0.5 rounded-full font-bold"
                        style={{
                          background:
                            j.status === "open"
                              ? "color-mix(in srgb, var(--g) 15%, transparent)"
                              : "var(--surface-3)",
                          color: j.status === "open" ? "var(--g)" : "var(--text-3)",
                        }}
                      >
                        {j.status}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
    </CandidateDrawerProvider>
  );
}
