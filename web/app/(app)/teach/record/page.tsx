import Link from "next/link";
import { requireVerifiedUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { store } from "@/lib/store";
import { PageHeader } from "@/components/page-header";
import { RecordLessonForm } from "@/components/record-lesson-form";

export const dynamic = "force-dynamic";

export default async function RecordLesson() {
  const user = await requireVerifiedUser();
  if (user.role !== "teacher" && user.role !== "admin") redirect("/dashboard");
  const myTracks = store.tracks.filter((t) => t.teacherId === user.id || user.role === "admin");

  return (
    <div className="section-pad-x py-10">
      <PageHeader
        eyebrow="Teach · record"
        title="Film a 30-second lesson on your phone."
        subtitle="Upload vertical video, we auto-caption, auto-translate, and publish. Your kitchen table is fine."
        right={<Link href="/teach" className="btn btn-ghost btn-sm">← Dashboard</Link>}
      />
      <div className="max-w-[640px]">
        <RecordLessonForm tracks={myTracks.map((t) => ({ slug: t.slug, title: t.title }))} />
      </div>
    </div>
  );
}
