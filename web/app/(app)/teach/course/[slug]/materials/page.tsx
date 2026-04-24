import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireVerifiedUser } from "@/lib/auth";
import { getTrack } from "@/lib/store";
import { canTeacherEditCourse } from "@/lib/services/teacher-course";
import { ensureTracksFromDatabase } from "@/lib/course/ensure-tracks";
import type { CourseMaterial, Module } from "@/lib/store";

export const dynamic = "force-dynamic";

function MaterialRow({ m }: { m: CourseMaterial }) {
  const label = m.kind === "link" || m.kind === "youtube" ? "Open" : "File";
  return (
    <li className="flex flex-wrap items-baseline justify-between gap-2 text-[13px] py-1.5" style={{ color: "var(--text-2)" }}>
      <span>{m.title}</span>
      <span className="text-[11px] uppercase tracking-wider" style={{ color: "var(--text-3)" }}>
        {m.kind} · {label}
      </span>
    </li>
  );
}

function ModuleMaterials({ mod }: { mod: Module }) {
  const list = mod.materials?.length ? mod.materials : [];
  return (
    <div className="card p-4 mb-3" style={{ border: "1px solid var(--border-1)" }}>
      <h3 className="font-semibold text-sm mb-2" style={{ color: "var(--text-1)" }}>
        {mod.title}
      </h3>
      {list.length === 0 ? (
        <p className="text-[13px]" style={{ color: "var(--text-3)" }}>
          No files or links in this lesson yet. Add them in the course builder.
        </p>
      ) : (
        <ul className="divide-y" style={{ borderColor: "var(--border-1)" }}>
          {list.map((m) => (
            <MaterialRow key={m.id} m={m} />
          ))}
        </ul>
      )}
    </div>
  );
}

export default async function TeacherCourseMaterialsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const user = await requireVerifiedUser();
  if (user.role !== "teacher" && user.role !== "admin") redirect("/dashboard");
  await ensureTracksFromDatabase();
  const track = getTrack(slug);
  if (!canTeacherEditCourse(user, track) || !track) notFound();
  const withMaterials = track.modules.filter((m) => (m.materials?.length ?? 0) > 0).length;

  return (
    <div>
      <p className="text-sm mb-4" style={{ color: "var(--text-2)" }}>
        Files and links attached to each lesson. Edit lessons in{" "}
        <Link href={`/teach/course/${encodeURIComponent(slug)}/builder`} className="underline font-medium">
          Content
        </Link>{" "}
        to add PDFs, uploads, and URLs.
      </p>
      {withMaterials === 0 && (
        <div className="card p-6 mb-6 text-center" style={{ border: "1px solid var(--border-1)" }}>
          <p className="text-sm mb-3" style={{ color: "var(--text-2)" }}>
            No lesson materials on file for this course yet.
          </p>
          <Link href={`/teach/course/${encodeURIComponent(slug)}/builder`} className="btn btn-primary btn-sm">
            Open course builder
          </Link>
        </div>
      )}
      {track.modules.map((mod) => (
        <ModuleMaterials key={mod.id} mod={mod} />
      ))}
    </div>
  );
}
