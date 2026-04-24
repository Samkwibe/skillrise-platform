import Link from "next/link";
import { requireVerifiedUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { store } from "@/lib/store";
import { PageHeader } from "@/components/page-header";

export const dynamic = "force-dynamic";

export default async function TeacherCoursesPage() {
  const user = await requireVerifiedUser();
  if (user.role !== "teacher" && user.role !== "admin") redirect("/dashboard");

  const myTracks = store.tracks.filter((t) => t.teacherId === user.id);

  return (
    <div className="section-pad-x py-8 max-w-[900px] mx-auto">
      <div className="mb-4">
        <Link href="/teach" className="text-sm text-t2 underline">
          ← Dashboard
        </Link>
      </div>
      <PageHeader
        eyebrow="Teach"
        title="Your courses"
        subtitle="Build modules and lessons, upload videos to S3 when configured, attach materials, and set preview access. This is the foundation for a full university-style course experience; assignments, gradebook, and discussions come next."
      />

      {myTracks.length === 0 && (
        <p className="text-sm text-t2">You don’t have any tracks on file yet. Contact the team to have a course shell created, then return here to edit the curriculum.</p>
      )}

      <ul className="space-y-3">
        {myTracks.map((t) => {
          const nMod = t.modules.length;
          const nUnit = new Set(t.modules.map((m) => m.unitId || "_def")).size;
          return (
            <li key={t.slug} className="card p-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="font-display font-bold">{t.title}</div>
                <div className="text-xs text-t3 mt-1">
                  {nMod} lessons · {nUnit} {nUnit === 1 ? "module" : "modules"} · {t.level}
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link href={`/teach/course/${encodeURIComponent(t.slug)}`} className="btn btn-primary btn-sm">
                  Open course
                </Link>
                <Link href={`/teach/course/${encodeURIComponent(t.slug)}/builder`} className="btn btn-ghost btn-sm">
                  Content
                </Link>
                <Link href={`/tracks/${t.slug}`} className="btn btn-ghost btn-sm">
                  Preview
                </Link>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
