import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getTrack, store } from "@/lib/store";
import { requireVerifiedUser } from "@/lib/auth";
import { ModulePlayer } from "@/components/module-player";
import { Progress } from "@/components/ui/progress";

export const dynamic = "force-dynamic";

export default async function LearnPage({ params }: { params: Promise<{ slug: string; moduleId: string }> }) {
  const { slug, moduleId } = await params;
  const user = await requireVerifiedUser();
  const track = getTrack(slug);
  if (!track) return notFound();
  const mod = track.modules.find((m) => m.id === moduleId);
  if (!mod) return notFound();

  const enrollment = store.enrollments.find((e) => e.userId === user.id && e.trackSlug === slug);
  if (!enrollment) redirect(`/tracks/${slug}`);

  const idx = track.modules.findIndex((m) => m.id === moduleId);
  const next = track.modules[idx + 1];
  const done = enrollment.completedModuleIds.includes(moduleId);
  const pct = Math.round((enrollment.completedModuleIds.length / track.modules.length) * 100);

  return (
    <div className="section-pad-x py-10 grid lg:grid-cols-[1fr_320px] gap-8">
      <div className="min-w-0">
        <Link href={`/tracks/${slug}`} className="text-[13px] text-t3 underline">← {track.title}</Link>
        <h1 className="font-display text-[26px] font-extrabold mt-2 mb-1">{mod.title}</h1>
        <div className="text-[13px] text-t3 mb-6">Module {idx + 1} of {track.modules.length} · {mod.duration}</div>

        <ModulePlayer
          trackSlug={track.slug}
          moduleId={mod.id}
          title={mod.title}
          transcript={mod.transcript}
          done={done}
          nextHref={next ? `/learn/${slug}/${next.id}` : `/cert`}
          nextLabel={next ? `Next: ${next.title}` : "See your certificate"}
        />

        <section className="mt-8">
          <h2 className="font-display text-[18px] font-bold mb-2">Summary</h2>
          <p className="text-t2 text-[14px] mb-4">{mod.summary}</p>
          <h3 className="font-display text-[15px] font-bold mb-2">Transcript</h3>
          <p className="text-t2 text-[14px] whitespace-pre-line">{mod.transcript}</p>
        </section>
      </div>

      <aside className="lg:sticky lg:top-6 self-start">
        <div className="card p-5 mb-4">
          <div className="text-[12px] text-t3 mb-1">Track progress</div>
          <div className="font-display text-[28px] font-extrabold mb-2">{pct}%</div>
          <Progress value={pct} />
        </div>
        <div className="card p-4">
          <div className="text-[12px] uppercase tracking-wider text-t3 mb-2">Modules</div>
          <div className="flex flex-col gap-1">
            {track.modules.map((m, i) => {
              const d = enrollment.completedModuleIds.includes(m.id);
              const active = m.id === moduleId;
              return (
                <Link key={m.id} href={`/learn/${slug}/${m.id}`} className={`flex items-center gap-2 px-2 py-[6px] rounded-[8px] text-[13px] ${active ? "bg-[rgba(31,200,126,0.1)] text-g" : "text-t2 hover:bg-[rgba(255,255,255,0.04)]"}`}>
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
