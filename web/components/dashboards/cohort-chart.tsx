import type { SchoolClass } from "@/lib/store";
import { store, getTrack } from "@/lib/store";

/**
 * Cohort completion chart — per-class horizontal bar chart broken down into
 * "Certified / In-progress / Missed" segments. Tabular numerals, printer-safe.
 */
export function CohortChart({ classes }: { classes: SchoolClass[] }) {
  if (classes.length === 0) {
    return (
      <div
        className="p-5 rounded-[6px] text-center text-[13px]"
        style={{ background: "var(--surface-1)", border: "1px solid var(--border-1)", color: "var(--text-3)" }}
      >
        No classes yet — create one to see cohort completion.
      </div>
    );
  }

  const rows = classes.map((c) => {
    const track = getTrack(c.trackSlug);
    const total = c.studentIds.length || 1;
    let certified = 0;
    let inProgress = 0;
    for (const sid of c.studentIds) {
      const enr = store.enrollments.find((e) => e.userId === sid && e.trackSlug === c.trackSlug);
      const hasCert = store.certificates.some((k) => k.userId === sid && k.trackSlug === c.trackSlug);
      if (hasCert) certified++;
      else if (enr && enr.completedModuleIds.length > 0) inProgress++;
    }
    const missed = Math.max(total - certified - inProgress, 0);
    return {
      id: c.id,
      name: c.name,
      track: track?.title ?? c.trackSlug,
      total,
      certified,
      inProgress,
      missed,
    };
  });

  const overall = rows.reduce(
    (acc, r) => {
      acc.cert += r.certified;
      acc.ip += r.inProgress;
      acc.miss += r.missed;
      acc.total += r.total;
      return acc;
    },
    { cert: 0, ip: 0, miss: 0, total: 0 },
  );
  const overallPct = overall.total > 0 ? Math.round((overall.cert / overall.total) * 100) : 0;

  return (
    <section
      className="rounded-[6px] overflow-hidden mb-5"
      style={{ background: "var(--surface-1)", border: "1px solid var(--border-1)" }}
      id="cohort-chart"
    >
      <div
        className="flex items-center justify-between px-4 py-2.5"
        style={{ borderBottom: "1px solid var(--border-1)", background: "var(--surface-2)" }}
      >
        <div className="flex items-center gap-3">
          <div className="text-[12.5px] font-bold" style={{ color: "var(--text-2)" }}>
            Cohort completion
          </div>
          <span
            className="text-[11px] font-bold px-2 py-0.5 rounded-full tabular-nums"
            style={{ background: "color-mix(in srgb, var(--g) 14%, transparent)", color: "var(--g)" }}
          >
            {overallPct}% overall
          </span>
        </div>
        <div className="flex items-center gap-3 text-[11px]" style={{ color: "var(--text-3)" }}>
          <LegendDot color="var(--g)" label={`Certified (${overall.cert})`} />
          <LegendDot color="var(--blue)" label={`In progress (${overall.ip})`} />
          <LegendDot color="var(--surface-3)" label={`Missed (${overall.miss})`} />
        </div>
      </div>

      <div className="divide-y" style={{ borderColor: "var(--border-1)" }}>
        {rows.map((r) => {
          const certPct = (r.certified / r.total) * 100;
          const ipPct = (r.inProgress / r.total) * 100;
          const missPct = (r.missed / r.total) * 100;
          return (
            <div
              key={r.id}
              className="grid grid-cols-[180px_1fr_auto] items-center gap-3 px-4 py-2.5"
              style={{ borderTop: "1px solid var(--border-1)" }}
            >
              <div className="min-w-0">
                <div className="text-[13px] font-semibold truncate">{r.name}</div>
                <div className="text-[11px] truncate" style={{ color: "var(--text-3)" }}>
                  {r.track}
                </div>
              </div>

              <div
                className="h-6 rounded-[3px] overflow-hidden flex"
                style={{ background: "var(--surface-2)", border: "1px solid var(--border-1)" }}
                title={`${r.certified} certified · ${r.inProgress} in progress · ${r.missed} missed`}
              >
                {r.certified > 0 && (
                  <div
                    className="h-full flex items-center justify-center text-[10.5px] font-bold tabular-nums text-white"
                    style={{ width: `${certPct}%`, background: "var(--g)" }}
                  >
                    {certPct > 8 ? r.certified : ""}
                  </div>
                )}
                {r.inProgress > 0 && (
                  <div
                    className="h-full flex items-center justify-center text-[10.5px] font-bold tabular-nums text-white"
                    style={{ width: `${ipPct}%`, background: "var(--blue)" }}
                  >
                    {ipPct > 8 ? r.inProgress : ""}
                  </div>
                )}
                {r.missed > 0 && (
                  <div
                    className="h-full flex items-center justify-center text-[10.5px] font-bold tabular-nums"
                    style={{
                      width: `${missPct}%`,
                      background: "var(--surface-3)",
                      color: "var(--text-2)",
                    }}
                  >
                    {missPct > 8 ? r.missed : ""}
                  </div>
                )}
              </div>

              <div
                className="text-[12.5px] font-bold tabular-nums text-right w-[60px]"
                style={{ color: "var(--text-2)" }}
              >
                {Math.round(certPct)}%
              </div>
            </div>
          );
        })}
      </div>

      <div
        className="flex items-center justify-between px-4 py-2 text-[11px]"
        style={{ borderTop: "1px solid var(--border-1)", background: "var(--surface-2)", color: "var(--text-3)" }}
      >
        <span>{rows.length} classes · {overall.total} students</span>
        <span className="tabular-nums">
          {overall.cert}/{overall.total} certified
        </span>
      </div>
    </section>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className="w-2.5 h-2.5 rounded-sm" style={{ background: color, border: "1px solid var(--border-1)" }} />
      <span>{label}</span>
    </span>
  );
}
