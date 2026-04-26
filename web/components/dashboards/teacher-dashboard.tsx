import Link from "next/link";
import type { User } from "@/lib/store";
import { store, findUserById } from "@/lib/store";
import { UploadZone } from "./upload-zone";
import { Avatar } from "@/components/ui/avatar";

/**
 * Teacher dashboard — "Instructor studio".
 * Broadcast-dark workspace: big preview panel, video thumbnail grid with
 * view-count overlays, live-pulse, student analytics table, scheduled queue.
 * Metadata in monospace. No emoji-heavy noise.
 */

function fmtNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function fmtTime(ts: number): string {
  const d = new Date(ts);
  return d.toISOString().replace("T", " ").slice(0, 16);
}

export function TeacherDashboard({ user }: { user: User }) {
  const myLessons = store.feed
    .filter((p) => p.authorId === user.id)
    .sort((a, b) => b.createdAt - a.createdAt);
  const myTracks = store.tracks.filter((t) => t.teacherId === user.id);
  const mySessions = store.liveSessions
    .filter((l) => l.teacherId === user.id)
    .sort((a, b) => a.startsAt - b.startsAt);
  const myEnrolls = store.enrollments.filter((e) =>
    myTracks.some((t) => t.slug === e.trackSlug),
  );
  const myStudents = Array.from(new Set(myEnrolls.map((e) => e.userId)));

  const engagementTotal = myLessons.reduce((s, l) => s + l.likes + l.comments.length, 0);
  const liveNow = mySessions.find((l) => l.status === "live") ?? null;
  const topLesson = myLessons[0];

  const studentProfiles = myStudents
    .map((id) => findUserById(id))
    .filter((u): u is NonNullable<typeof u> => Boolean(u))
    .slice(0, 24);

  const recentEnrolls = myEnrolls
    .slice()
    .sort((a, b) => b.startedAt - a.startedAt)
    .slice(0, 6);

  return (
    <div className="px-4 sm:px-5 md:px-6 py-4 sm:py-5 md:py-6 space-y-4 md:space-y-5">
      {/* Top metric strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 3xl:grid-cols-6 4k:grid-cols-8 gap-2.5 sm:gap-3">
        {[
          { label: "ENGAGEMENT", value: engagementTotal > 0 ? fmtNumber(engagementTotal) : "—", accent: "var(--red)" },
          { label: "STUDENTS", value: String(myStudents.length || 0), accent: "var(--amber)" },
          { label: "LESSONS", value: String(myLessons.length), accent: "var(--blue)" },
          { label: "LIVE NEXT", value: mySessions.filter((s) => s.status === "scheduled").length ? "1" : "0", accent: "var(--purple)" },
        ].map((s) => (
          <div key={s.label} className="studio-panel p-3 flex flex-col gap-1">
            <div className="studio-label">{s.label}</div>
            <div className="studio-metric text-[26px]" style={{ color: s.accent }}>
              {s.value}
            </div>
          </div>
        ))}
      </div>

      {studentProfiles.length > 0 ? (
        <div className="studio-panel p-4">
          <div className="studio-label mb-3">YOUR STUDENTS (FROM ENROLLMENTS)</div>
          <div className="flex flex-wrap gap-2">
            {studentProfiles.map((u) => (
              <div key={u.id} className="flex items-center gap-2 rounded-md border border-[var(--border-1)] px-2 py-1.5 bg-[var(--surface-2)]">
                <Avatar spec={u.avatar} photoUrl={u.avatarUrl} name={u.name} size={36} />
                <span className="studio-metric text-[12px] truncate max-w-[120px]">{u.name}</span>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {/* Upload zone + Top-lesson insight */}
      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-3 md:gap-4">
        <UploadZone />
        <div className="studio-panel p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="studio-label">TOP LESSON · LAST 7D</div>
            {topLesson && (
              <span
                className="studio-metric text-[10px] px-1.5 py-0.5 rounded"
                style={{ background: "color-mix(in srgb, var(--g) 12%, transparent)", color: "var(--g)" }}
              >
                {topLesson.likes} likes
              </span>
            )}
          </div>
          {topLesson ? (
            <>
              <div className="flex items-start gap-3">
                <div
                  className="w-14 h-14 rounded-[6px] flex items-center justify-center text-[24px] shrink-0"
                  style={{ background: `linear-gradient(135deg, rgba(239,68,68,0.35), rgba(10,10,10,1))` }}
                >
                  {topLesson.emoji}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[14px] font-semibold leading-tight line-clamp-2">{topLesson.title}</div>
                  <div className="studio-label mt-1">
                    {topLesson.duration} · {topLesson.likes} likes · {topLesson.comments.length} comments
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 mt-1">
                <MetricCell label="LIKES" value={String(topLesson.likes)} accent="var(--g)" />
                <MetricCell label="COMMENTS" value={String(topLesson.comments.length)} accent="var(--amber)" />
                <MetricCell
                  label="SAVED"
                  value={String(topLesson.savedBy?.length ?? 0)}
                  accent="var(--blue)"
                />
              </div>
              <Link
                href="/teach"
                className="studio-label text-center py-1.5 mt-1 hover:underline"
                style={{ borderTop: "1px solid var(--border-1)" }}
              >
                FULL ANALYTICS →
              </Link>
            </>
          ) : (
            <div className="text-[13px] py-6 text-center" style={{ color: "var(--text-3)" }}>
              Publish your first lesson to see performance insights here.
            </div>
          )}
        </div>
      </div>

      {/* Studio preview + Live queue. On ultrawide, queue + analytics sit as a
          right rail with 2 cells so the preview keeps its cinematic 16:9. */}
      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] 3xl:grid-cols-[3fr_1fr] gap-3 md:gap-4">
        <div className="studio-panel studio-panel-strong overflow-hidden">
          <div
            className="flex items-center justify-between px-4 h-[38px]"
            style={{ borderBottom: "1px solid var(--border-1)", background: "var(--surface-2)" }}
          >
            <div className="flex items-center gap-2">
              <span className="live-dot" />
              <div className="studio-label" style={{ color: liveNow ? "var(--red)" : "var(--text-3)" }}>
                {liveNow ? "● ON AIR" : "○ STANDBY"}
              </div>
            </div>
            <div className="studio-label">PREVIEW</div>
            <div className="studio-metric text-[11px]" style={{ color: "var(--text-3)" }}>
              {fmtTime(Date.now())}
            </div>
          </div>
          <div
            className="relative aspect-video flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #1a1a1a, #0a0a0a)" }}
          >
            {topLesson ? (
              <>
                <div className="absolute inset-0 grid grid-cols-12 grid-rows-6">
                  {Array.from({ length: 72 }).map((_, i) => (
                    <div
                      key={i}
                      style={{
                        borderRight: "1px solid rgba(255,255,255,0.02)",
                        borderBottom: "1px solid rgba(255,255,255,0.02)",
                      }}
                    />
                  ))}
                </div>
                <div className="relative text-center px-6">
                  <div className="text-[46px] mb-2">{topLesson.emoji}</div>
                  <div className="studio-metric text-[16px]" style={{ color: "var(--text-1)" }}>
                    {topLesson.title}
                  </div>
                  <div className="studio-label mt-1">
                    {topLesson.duration} · {topLesson.likes} likes · {topLesson.comments.length} comments
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center">
                <div className="studio-label mb-2">NO SOURCE</div>
                <Link
                  href="/teach/record"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-[6px] studio-metric text-[12px]"
                  style={{ background: "var(--red)", color: "#fff" }}
                >
                  ● REC — Upload first lesson
                </Link>
              </div>
            )}
          </div>
          <div className="flex items-center justify-between px-4 py-2" style={{ borderTop: "1px solid var(--border-1)" }}>
            <div className="flex items-center gap-4">
              <Link href="/teach/record" className="studio-label hover:underline" style={{ color: "var(--text-2)" }}>
                ● NEW TAKE
              </Link>
              <Link href="/teach" className="studio-label hover:underline" style={{ color: "var(--text-2)" }}>
                ▦ LIBRARY
              </Link>
            </div>
            <Link
              href="/teach/live"
              className="studio-metric text-[12px] px-3 py-1.5 rounded-[6px]"
              style={{ background: "var(--red)", color: "#fff" }}
            >
              GO LIVE
            </Link>
          </div>
        </div>

        <div className="studio-panel p-4 flex flex-col gap-3">
          <div className="studio-label">UPCOMING QUEUE</div>
          {mySessions.length === 0 ? (
            <div className="text-[13px]" style={{ color: "var(--text-3)" }}>
              Nothing scheduled. Open the live scheduler to queue one.
            </div>
          ) : (
            mySessions.slice(0, 4).map((l) => (
              <div
                key={l.id}
                className="studio-panel p-3 flex items-start gap-3"
                style={{ background: "var(--surface-2)" }}
              >
                <div
                  className="w-10 h-10 rounded-[4px] flex items-center justify-center studio-metric text-[12px]"
                  style={{
                    background: l.status === "live" ? "var(--red)" : "var(--surface-3)",
                    color: l.status === "live" ? "#fff" : "var(--text-2)",
                  }}
                >
                  {l.status === "live" ? "ON" : "Q"}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[13.5px] font-semibold truncate">{l.title}</div>
                  <div className="studio-label mt-0.5">
                    {fmtTime(l.startsAt)} · {l.durationMin}m · RSVP {l.attendees.length}
                  </div>
                </div>
              </div>
            ))
          )}
          <Link href="/teach/live" className="studio-label text-center py-2 hover:underline">
            + SCHEDULE
          </Link>
        </div>
      </div>

      {/* Lesson grid (video thumbnails with overlays) */}
      <section>
        <div className="flex items-baseline justify-between mb-3">
          <div className="flex items-baseline gap-3">
            <h2 className="studio-metric text-[14px] uppercase tracking-[0.1em]">CONTENT LIBRARY</h2>
            <span className="studio-label">{myLessons.length} ITEMS</span>
          </div>
          <Link href="/teach/record" className="studio-label hover:underline" style={{ color: "var(--red)" }}>
            + UPLOAD
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 3xl:grid-cols-6 4k:grid-cols-8 gap-2.5 sm:gap-3">
          {myLessons.length === 0 ? (
            <div className="col-span-full studio-panel p-6 text-center">
              <div className="studio-label mb-2">EMPTY</div>
              <div className="text-[13px]" style={{ color: "var(--text-2)" }}>
                Record your first lesson to populate the library.
              </div>
            </div>
          ) : (
            myLessons.slice(0, 8).map((p) => (
              <div key={p.id} className="studio-panel overflow-hidden group cursor-pointer">
                <div
                  className="aspect-video relative flex items-center justify-center"
                  style={{ background: `linear-gradient(135deg, rgba(${getHex(p.id)},0.35), #0a0a0a)` }}
                >
                  <div className="text-[42px]">{p.emoji}</div>
                  <div
                    className="absolute bottom-1.5 right-1.5 studio-metric text-[10px] px-1.5 py-0.5 rounded"
                    style={{ background: "rgba(0,0,0,0.7)", color: "#fff" }}
                  >
                    {p.duration}
                  </div>
                  <div
                    className="absolute bottom-1.5 left-1.5 studio-metric text-[10px] px-1.5 py-0.5 rounded flex items-center gap-1"
                    style={{ background: "rgba(0,0,0,0.7)", color: "#fff" }}
                  >
                    ♡ {p.likes}
                  </div>
                </div>
                <div className="p-2">
                  <div className="text-[12.5px] font-semibold leading-tight line-clamp-2">{p.title}</div>
                  <div className="studio-label mt-1">
                    ♡ {p.likes} · 💬 {p.comments.length}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Student analytics table */}
      <section className="studio-panel overflow-hidden">
        <div
          className="flex items-center justify-between px-4 py-2"
          style={{ borderBottom: "1px solid var(--border-1)", background: "var(--surface-2)" }}
        >
          <div className="flex items-center gap-3">
            <div className="studio-label">ENROLLMENT TELEMETRY</div>
            <span className="studio-label" style={{ color: "var(--text-2)" }}>
              LAST {recentEnrolls.length}
            </span>
          </div>
          <Link href="/teach" className="studio-label hover:underline">
            OPEN →
          </Link>
        </div>
        <div className="overflow-x-auto">
        <table className="w-full min-w-[560px]">
          <thead>
            <tr>
              {["student", "track", "progress", "enrolled"].map((h) => (
                <th key={h} className="studio-label text-left px-4 py-2" style={{ borderBottom: "1px solid var(--border-1)" }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {recentEnrolls.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-[13px] text-center py-6" style={{ color: "var(--text-3)" }}>
                  No enrollments yet.
                </td>
              </tr>
            ) : (
              recentEnrolls.map((e) => {
                const s = findUserById(e.userId);
                const t = getTrack(e.trackSlug);
                const pct = t ? Math.round((e.completedModuleIds.length / t.modules.length) * 100) : 0;
                return (
                  <tr key={e.id} className="hover:bg-[var(--surface-2)]">
                    <td className="px-4 py-2 text-[13px]" style={{ borderBottom: "1px solid var(--border-1)" }}>
                      {s?.name ?? "—"}
                    </td>
                    <td className="px-4 py-2 text-[13px] studio-metric" style={{ borderBottom: "1px solid var(--border-1)", color: "var(--text-2)" }}>
                      {t?.title ?? e.trackSlug}
                    </td>
                    <td className="px-4 py-2" style={{ borderBottom: "1px solid var(--border-1)" }}>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "var(--surface-3)" }}>
                          <div className="h-full" style={{ width: `${pct}%`, background: "var(--red)" }} />
                        </div>
                        <span className="studio-metric text-[11px]" style={{ color: "var(--text-2)" }}>
                          {pct}%
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-2 studio-metric text-[11px]" style={{ borderBottom: "1px solid var(--border-1)", color: "var(--text-3)" }}>
                      {fmtTime(e.startedAt)}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
        </div>
      </section>
    </div>
  );
}

function MetricCell({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div
      className="rounded-[6px] p-2 text-center"
      style={{ background: "var(--surface-2)", border: "1px solid var(--border-1)" }}
    >
      <div className="studio-label">{label}</div>
      <div className="studio-metric text-[16px]" style={{ color: accent }}>
        {value}
      </div>
    </div>
  );
}

// Pick an rgb-ish accent per lesson id so gradients feel varied.
function getHex(id: string): string {
  const h = [...id].reduce((a, c) => a + c.charCodeAt(0), 0);
  const palette = ["239,68,68", "245,158,11", "59,130,246", "139,92,246", "236,72,153"];
  return palette[h % palette.length];
}

function getTrack(slug: string) {
  return store.tracks.find((t) => t.slug === slug) ?? null;
}
