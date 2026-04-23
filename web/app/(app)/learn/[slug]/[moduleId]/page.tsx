import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getTrack } from "@/lib/store";
import { requireVerifiedUser } from "@/lib/auth";
import { ModulePlayer } from "@/components/module-player";
import { Progress } from "@/components/ui/progress";
import { isCourseS3Configured, presignGetObject } from "@/lib/s3/course-assets";
import { buildMaterialLinks } from "@/lib/course/lesson-asset-links";
import { ensureTracksFromDatabase } from "@/lib/course/ensure-tracks";
import { getDb } from "@/lib/db";
import { getMissingPrerequisites } from "@/lib/services/prerequisites";

export const dynamic = "force-dynamic";

export default async function LearnPage({ params }: { params: Promise<{ slug: string; moduleId: string }> }) {
  const { slug, moduleId } = await params;
  const user = await requireVerifiedUser();
  await ensureTracksFromDatabase();
  const track = getTrack(slug);
  if (!track) return notFound();
  const mod = track.modules.find((m) => m.id === moduleId);
  if (!mod) return notFound();

  const db = getDb();
  await db.ready();
  const enrollment = await db.getEnrollment(user.id, slug);
  if (!enrollment && !mod.isPreview) redirect(`/tracks/${slug}`);
  if (enrollment?.pendingApproval && !mod.isPreview) redirect(`/tracks/${slug}?pending=1`);
  if (enrollment && !mod.isPreview) {
    const miss = await getMissingPrerequisites(user.id, track);
    if (miss.length) redirect(`/tracks/${slug}?prereq=1`);
  }

  const canMarkComplete = Boolean(enrollment);

  let playUrl: string | null = null;
  if (mod.s3Key && isCourseS3Configured()) {
    try {
      playUrl = await presignGetObject(mod.s3Key, 3600);
    } catch {
      playUrl = null;
    }
  } else if (mod.videoUrl) {
    playUrl = mod.videoUrl;
  }

  const materials = buildMaterialLinks(slug, mod);
  const videoSource = mod.videoSource || (mod.youtubeVideoId ? "youtube" : playUrl ? "upload" : "none");

  const idx = track.modules.findIndex((m) => m.id === moduleId);
  const next = track.modules[idx + 1];
  const done = enrollment ? enrollment.completedModuleIds.includes(moduleId) : false;
  const pct = enrollment
    ? Math.round((enrollment.completedModuleIds.length / track.modules.length) * 100)
    : 0;

  return (
    <div className="section-pad-x py-10 grid lg:grid-cols-[1fr_320px] gap-8">
      <div className="min-w-0">
        <Link href={`/tracks/${slug}`} className="text-[13px] text-t3 underline">← {track.title}</Link>
        <h1 className="font-display text-[26px] font-extrabold mt-2 mb-1">{mod.title}</h1>
        <div className="text-[13px] text-t3 mb-6">
          Lesson {idx + 1} of {track.modules.length}
          {mod.duration ? ` · ${mod.duration}` : ""}
          {mod.isPreview && <span className="ml-2 pill pill-g">Preview</span>}
        </div>

        <ModulePlayer
          trackSlug={track.slug}
          moduleId={mod.id}
          title={mod.title}
          done={done}
          canMarkComplete={canMarkComplete}
          nextHref={next ? `/learn/${slug}/${next.id}` : `/cert`}
          nextLabel={next ? `Next: ${next.title}` : "See your certificate"}
          playUrl={playUrl}
          youtubeVideoId={mod.youtubeVideoId}
          videoSource={videoSource === "none" && !mod.youtubeVideoId && !playUrl ? "placeholder" : videoSource}
          thumbnailUrl={mod.thumbnailUrl}
          materials={materials}
        />

        <section className="mt-8">
          <h2 className="font-display text-[18px] font-bold mb-2">Summary</h2>
          {mod.descriptionHtml ? (
            <div
              className="text-t2 text-[14px] mb-4 prose prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: mod.descriptionHtml }}
            />
          ) : (
            <p className="text-t2 text-[14px] mb-4">{mod.summary}</p>
          )}
          <h3 className="font-display text-[15px] font-bold mb-2">Transcript</h3>
          <p className="text-t2 text-[14px] whitespace-pre-line">{mod.transcript || "—"}</p>
        </section>
      </div>

      <aside className="lg:sticky lg:top-6 self-start">
        {enrollment && (
          <div className="card p-5 mb-4">
            <div className="text-[12px] text-t3 mb-1">Track progress</div>
            <div className="font-display text-[28px] font-extrabold mb-2">{pct}%</div>
            <Progress value={pct} />
          </div>
        )}
        <div className="card p-4">
          <div className="text-[12px] uppercase tracking-wider text-t3 mb-2">Lessons</div>
          <div className="flex flex-col gap-1">
            {track.modules.map((m, i) => {
              const d = enrollment && enrollment.completedModuleIds.includes(m.id);
              const active = m.id === moduleId;
              return (
                <Link
                  key={m.id}
                  href={`/learn/${slug}/${m.id}`}
                  className={`flex items-center gap-2 px-2 py-[6px] rounded-[8px] text-[13px] ${active ? "bg-[rgba(31,200,126,0.1)] text-g" : "text-t2 hover:bg-[rgba(255,255,255,0.04)]"}`}
                >
                  <span className="w-5 text-center">{d ? "✓" : i + 1}</span>
                  <span className="truncate">{m.title}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </aside>
    </div>
  );
}
