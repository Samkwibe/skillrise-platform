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
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 md:px-8 py-8 grid lg:grid-cols-[1fr_340px] gap-8">
      <div className="min-w-0">
        <Link href={`/tracks/${slug}`} className="text-[13px] text-emerald-400 hover:text-emerald-300 underline transition-colors flex items-center gap-1.5 mb-3">
          <span>←</span> Back to {track.title}
        </Link>
        <h1 className="text-[28px] md:text-[36px] font-extrabold text-white leading-tight mb-2" style={{ fontFamily: "var(--role-font-display)", letterSpacing: "-0.01em" }}>
          {mod.title}
        </h1>
        <div className="flex flex-wrap items-center gap-3 text-[13px] text-white/60 mb-6 pb-6 border-b border-white/10">
          <span className="bg-white/5 px-2.5 py-1 rounded-md text-white/80 font-medium">Lesson {idx + 1} of {track.modules.length}</span>
          {mod.duration && <span className="flex items-center gap-1.5"><span className="w-1 h-1 rounded-full bg-white/30"></span> {mod.duration}</span>}
          {mod.isPreview && <span className="px-2.5 py-1 rounded-md bg-amber-500/20 text-amber-400 font-bold border border-amber-500/30">Preview</span>}
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

        <section className="mt-8 p-6 md:p-8 rounded-3xl bg-white/[0.02] border border-white/10 backdrop-blur-xl">
          <h2 className="text-[20px] font-extrabold mb-4 text-white flex items-center gap-2" style={{ fontFamily: "var(--role-font-display)" }}>
            <span className="text-emerald-400">📝</span> Summary
          </h2>
          {mod.descriptionHtml ? (
            <div
              className="text-white/70 text-[15px] leading-relaxed mb-8 prose prose-invert max-w-none prose-p:leading-relaxed prose-a:text-emerald-400 hover:prose-a:text-emerald-300"
              dangerouslySetInnerHTML={{ __html: mod.descriptionHtml }}
            />
          ) : (
            <p className="text-white/70 text-[15px] leading-relaxed mb-8">{mod.summary}</p>
          )}
          
          <h3 className="text-[18px] font-extrabold mb-3 text-white flex items-center gap-2" style={{ fontFamily: "var(--role-font-display)" }}>
            <span className="text-indigo-400">📜</span> Transcript
          </h3>
          <div className="p-5 rounded-2xl bg-black/30 border border-white/5 max-h-[400px] overflow-y-auto scroll-slim">
            <p className="text-white/60 text-[14px] leading-loose whitespace-pre-line font-medium">
              {mod.transcript || "No transcript available for this lesson."}
            </p>
          </div>
        </section>
      </div>

      <aside className="lg:sticky lg:top-8 self-start space-y-6">
        {enrollment && (
          <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/10 backdrop-blur-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none transition-colors group-hover:bg-emerald-500/20"></div>
            <div className="relative z-10">
              <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-white/50 mb-1">Track progress</div>
              <div className="text-[32px] font-extrabold mb-3 text-white" style={{ fontFamily: "var(--role-font-display)" }}>{pct}%</div>
              <div className="h-2 w-full bg-black/40 rounded-full overflow-hidden border border-white/5">
                <div className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(16,185,129,0.5)]" style={{ width: `${pct}%` }} />
              </div>
            </div>
          </div>
        )}
        <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/10 backdrop-blur-xl relative overflow-hidden">
          <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-white/50 mb-4 pb-3 border-b border-white/10">Lessons</div>
          <div className="flex flex-col gap-1.5">
            {track.modules.map((m, i) => {
              const d = enrollment && enrollment.completedModuleIds.includes(m.id);
              const active = m.id === moduleId;
              return (
                <Link
                  key={m.id}
                  href={`/learn/${slug}/${m.id}`}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all ${
                    active 
                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-inner" 
                      : "text-white/70 hover:text-white hover:bg-white/5 border border-transparent"
                  }`}
                >
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                    d ? "bg-emerald-500/20 text-emerald-400" : active ? "bg-emerald-500 text-white" : "bg-white/10 text-white/50"
                  }`}>
                    {d ? "✓" : i + 1}
                  </span>
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
