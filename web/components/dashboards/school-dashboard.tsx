import Link from "next/link";
import type { User } from "@/lib/store";
import { store, findUserById, getTrack } from "@/lib/store";
import { CohortChart } from "./cohort-chart";
import { Avatar } from "@/components/ui/avatar";

/**
 * School dashboard — "Admin portal".
 * Forced light, table-first. Data tables with checkboxes (visual only),
 * cohort completion reports, and an audit log. No video feed, no cards-first.
 */

function fmt(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "2-digit" });
}

export function SchoolDashboard({ user }: { user: User }) {
  const classes = store.schoolClasses.filter((c) => c.schoolId === user.id);
  const allStudentIds = Array.from(new Set(classes.flatMap((c) => c.studentIds)));
  const studentRows = allStudentIds.map((id) => {
    const u = findUserById(id);
    const cls = classes.find((c) => c.studentIds.includes(id));
    const track = cls ? getTrack(cls.trackSlug) : null;
    const enr = store.enrollments.find((e) => e.userId === id && (!cls || e.trackSlug === cls.trackSlug));
    const hasCert = cls ? store.certificates.some((c) => c.userId === id && c.trackSlug === cls.trackSlug) : false;
    const pct = enr && track ? Math.round((enr.completedModuleIds.length / track.modules.length) * 100) : 0;
    return { u, cls, track, pct, hasCert };
  });

  const totalCerts = classes.reduce(
    (s, c) => s + c.studentIds.filter((id) => store.certificates.some((cert) => cert.userId === id && cert.trackSlug === c.trackSlug)).length,
    0,
  );

  const auditEvents: Array<{ id: string; at: number; who: string; action: string; target: string }> = [
    ...store.certificates
      .filter((c) => allStudentIds.includes(c.userId))
      .slice(-6)
      .map((c) => ({
        id: `cert-${c.id}`,
        at: c.issuedAt,
        who: findUserById(c.userId)?.name ?? "student",
        action: "earned certificate",
        target: getTrack(c.trackSlug)?.title ?? c.trackSlug,
      })),
    ...store.enrollments
      .filter((e) => allStudentIds.includes(e.userId))
      .slice(-4)
      .map((e) => ({
        id: `enr-${e.id}`,
        at: e.startedAt,
        who: findUserById(e.userId)?.name ?? "student",
        action: "enrolled in",
        target: getTrack(e.trackSlug)?.title ?? e.trackSlug,
      })),
  ]
    .sort((a, b) => b.at - a.at)
    .slice(0, 8);

  return (
    <div className="px-4 sm:px-5 md:px-7 py-4 md:py-5">
      {/* Header band */}
      <div className="flex items-end justify-between flex-wrap gap-3 mb-4">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-[0.14em]" style={{ color: "var(--text-3)" }}>
            Administration · Overview
          </div>
          <h1 className="text-[24px] font-bold mt-1" style={{ letterSpacing: "-0.01em" }}>
            {user.company || "School"}
          </h1>
        </div>
      </div>

      {studentRows.some((r) => r.u) ? (
        <section
          className="mb-4 md:mb-5 p-4 rounded-[6px] flex flex-wrap items-center gap-3"
          style={{ background: "var(--surface-1)", border: "1px solid var(--border-1)" }}
        >
          <div className="text-[11px] font-bold uppercase tracking-[0.1em] w-full sm:w-auto" style={{ color: "var(--text-3)" }}>
            Students on roster
          </div>
          <div className="flex flex-wrap gap-2">
            {studentRows
              .map((r) => r.u)
              .filter((u): u is NonNullable<typeof u> => Boolean(u))
              .slice(0, 20)
              .map((u) => (
                <div key={u.id} className="flex items-center gap-2" title={u.name}>
                  <Avatar spec={u.avatar} photoUrl={u.avatarUrl} name={u.name} size={40} />
                  <span className="text-[12px] font-semibold truncate max-w-[100px] hidden md:inline">{u.name}</span>
                </div>
              ))}
          </div>
        </section>
      ) : null}

      {/* KPI strip — expands to 6/8 cols on wide so 4K doesn't look empty. */}
      <div className="grid grid-cols-2 md:grid-cols-4 3xl:grid-cols-6 4k:grid-cols-8 gap-2.5 sm:gap-3 mb-4 md:mb-5">
        {[
          { label: "Classes", value: classes.length },
          { label: "Students", value: allStudentIds.length },
          { label: "Certificates", value: totalCerts, accent: "var(--g)" },
          {
            label: "Completion rate",
            value:
              allStudentIds.length === 0
                ? "—"
                : `${Math.round((totalCerts / Math.max(allStudentIds.length, 1)) * 100)}%`,
          },
        ].map((k) => (
          <div
            key={k.label}
            className="p-4 rounded-[6px]"
            style={{ background: "var(--surface-1)", border: "1px solid var(--border-1)" }}
          >
            <div className="text-[11px] font-bold uppercase tracking-[0.1em]" style={{ color: "var(--text-3)" }}>
              {k.label}
            </div>
            <div className="text-[26px] font-bold mt-1 leading-none" style={{ color: k.accent ?? "var(--text-1)" }}>
              {k.value}
            </div>
          </div>
        ))}
      </div>

      {/* Cohort completion chart */}
      <CohortChart classes={classes} />

      {/* Bulk action bar */}
      <div className="admin-action-bar mb-3 flex-wrap" id="students">
        <div className="text-[12.5px] font-bold" style={{ color: "var(--text-2)" }}>
          Students · {studentRows.length} records
        </div>
        <div className="flex-1 hidden sm:block" />
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <button type="button" className="text-[12px] px-3 py-1.5 rounded-[4px]" style={{ border: "1px solid var(--border-2)", color: "var(--text-2)" }}>
            Filter
          </button>
          <button type="button" className="hidden sm:inline-flex text-[12px] px-3 py-1.5 rounded-[4px]" style={{ border: "1px solid var(--border-2)", color: "var(--text-2)" }}>
            Bulk enroll
          </button>
          <button type="button" className="hidden md:inline-flex text-[12px] px-3 py-1.5 rounded-[4px]" style={{ border: "1px solid var(--border-2)", color: "var(--text-2)" }}>
            Export CSV
          </button>
          <button type="button" className="text-[12px] px-3 py-1.5 rounded-[4px] font-semibold whitespace-nowrap ml-auto sm:ml-0" style={{ background: "var(--g)", color: "#fff" }}>
            + Add student
          </button>
        </div>
      </div>

      {/* Student roster table */}
      <div className="overflow-x-auto mb-6 -mx-4 sm:mx-0 px-4 sm:px-0">
        <table className="admin-table min-w-[720px]">
          <thead>
            <tr>
              <th style={{ width: 32 }}>
                <input type="checkbox" aria-label="Select all" />
              </th>
              <th>Name</th>
              <th>Class</th>
              <th>Track</th>
              <th style={{ width: 180 }}>Progress</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {studentRows.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center" style={{ color: "var(--text-3)" }}>
                  No students yet.
                </td>
              </tr>
            ) : (
              studentRows.map(({ u, cls, track, pct, hasCert }, i) => (
                <tr key={u?.id ?? i}>
                  <td>
                    <input type="checkbox" aria-label={`Select ${u?.name ?? ""}`} />
                  </td>
                  <td className="font-semibold">{u?.name ?? "—"}</td>
                  <td style={{ color: "var(--text-2)" }}>{cls?.name ?? "—"}</td>
                  <td style={{ color: "var(--text-2)" }}>{track?.title ?? "—"}</td>
                  <td>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "var(--surface-3)" }}>
                        <div className="h-full" style={{ width: `${pct}%`, background: "var(--g)" }} />
                      </div>
                      <span className="text-[11.5px] w-[34px] text-right" style={{ color: "var(--text-2)" }}>
                        {pct}%
                      </span>
                    </div>
                  </td>
                  <td>
                    <span
                      className="text-[11px] px-2 py-0.5 rounded-full font-semibold"
                      style={{
                        background: hasCert
                          ? "color-mix(in srgb, var(--g) 15%, transparent)"
                          : "var(--surface-2)",
                        color: hasCert ? "var(--g)" : "var(--text-3)",
                      }}
                    >
                      {hasCert ? "Certified" : pct === 100 ? "Awaiting cert" : "In progress"}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Classes + audit two-column */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_1fr] gap-4 md:gap-5" id="reports">
        <section>
          <div className="admin-action-bar mb-3">
            <div className="text-[12.5px] font-bold" style={{ color: "var(--text-2)" }}>
              Classes · {classes.length}
            </div>
            <div className="flex-1" />
            <button type="button" className="text-[12px] px-3 py-1.5 rounded-[4px] font-semibold" style={{ background: "var(--g)", color: "#fff" }}>
              + Add class
            </button>
          </div>
          <div className="overflow-x-auto">
          <table className="admin-table min-w-[480px]">
            <thead>
              <tr>
                <th>Class</th>
                <th>Track</th>
                <th>Students</th>
                <th>Certified</th>
              </tr>
            </thead>
            <tbody>
              {classes.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center" style={{ color: "var(--text-3)" }}>
                    No classes yet.
                  </td>
                </tr>
              ) : (
                classes.map((c) => {
                  const t = getTrack(c.trackSlug);
                  const certCount = c.studentIds.filter((id) =>
                    store.certificates.some((cert) => cert.userId === id && cert.trackSlug === c.trackSlug),
                  ).length;
                  return (
                    <tr key={c.id}>
                      <td className="font-semibold">{c.name}</td>
                      <td style={{ color: "var(--text-2)" }}>{t?.title ?? c.trackSlug}</td>
                      <td>{c.studentIds.length}</td>
                      <td>
                        <div className="flex items-center gap-2">
                          <span style={{ color: "var(--g)", fontWeight: 600 }}>{certCount}</span>
                          <span style={{ color: "var(--text-3)" }}>/ {c.studentIds.length}</span>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
          </div>
        </section>

        <section id="audit">
          <div className="admin-action-bar mb-3">
            <div className="text-[12.5px] font-bold" style={{ color: "var(--text-2)" }}>
              Audit log · last {auditEvents.length}
            </div>
            <div className="flex-1" />
            <Link href="#audit" className="text-[12px] underline" style={{ color: "var(--text-2)" }}>
              Full log
            </Link>
          </div>
          <div
            className="rounded-[6px]"
            style={{ background: "var(--surface-1)", border: "1px solid var(--border-1)" }}
          >
            {auditEvents.length === 0 ? (
              <div className="text-[13px] py-5 text-center" style={{ color: "var(--text-3)" }}>
                No activity yet.
              </div>
            ) : (
              auditEvents.map((e, i) => (
                <div
                  key={e.id}
                  className="flex items-center gap-3 px-4 py-2.5 text-[13px]"
                  style={{
                    borderBottom: i === auditEvents.length - 1 ? "none" : "1px solid var(--border-1)",
                  }}
                >
                  <span
                    className="text-[11px] font-mono w-[80px] shrink-0"
                    style={{ color: "var(--text-3)" }}
                  >
                    {fmt(e.at)}
                  </span>
                  <span className="font-semibold">{e.who}</span>
                  <span style={{ color: "var(--text-2)" }}>{e.action}</span>
                  <span style={{ color: "var(--g)", fontWeight: 600 }}>{e.target}</span>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
