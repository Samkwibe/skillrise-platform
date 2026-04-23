import Link from "next/link";
import { requireVerifiedUser } from "@/lib/auth";
import { CourseWorkspace } from "@/components/courses/course-workspace";
import type { CourseProviderId } from "@/lib/courses/types";
import { PageHeader } from "@/components/page-header";
import { stableCourseId } from "@/lib/courses/ids";

export const dynamic = "force-dynamic";

const allowed = new Set<CourseProviderId>(["coursera", "openlibrary", "mit", "khan", "youtube", "simplilearn", "udemy"]);

export default async function CourseLearnPage({
  searchParams,
}: {
  searchParams: Promise<{
    k?: string;
    url?: string;
    provider?: string;
    title?: string;
    v?: string;
    t?: string;
  }>;
}) {
  await requireVerifiedUser();
  const sp = await searchParams;
  const rawUrl = sp.url;
  if (!rawUrl) {
    return (
      <div className="section-pad-x py-10">
        <PageHeader title="Missing link" subtitle="Pick a course from search first." />
        <Link href="/courses/search" className="btn btn-primary mt-4">
          Search free courses
        </Link>
      </div>
    );
  }

  let url: string;
  try {
    url = decodeURIComponent(rawUrl);
  } catch {
    url = rawUrl;
  }
  if (!url.startsWith("http")) {
    return (
      <div className="section-pad-x py-10">
        <p className="text-t2">Invalid URL.</p>
        <Link href="/courses/search" className="btn btn-primary mt-4">
          Back
        </Link>
      </div>
    );
  }

  const p = (sp.provider as CourseProviderId) || "coursera";
  const provider = allowed.has(p) ? p : "coursera";
  const title = sp.title ? decodeURIComponent(sp.title) : "Course";
  const expectedKey = stableCourseId(provider, url);
  const courseKey = sp.k && sp.k === expectedKey ? sp.k : expectedKey;
  const initVideo = sp.v ? decodeURIComponent(sp.v) : undefined;
  const resumeAtSec = (() => {
    const t = sp.t?.trim();
    if (!t) return 0;
    const n = Number(t);
    return Number.isFinite(n) && n > 0 ? Math.min(Math.floor(n), 1_000_000) : 0;
  })();

  return (
    <div className="section-pad-x py-6 md:py-8 max-w-[1400px] mx-auto">
      <div className="mb-4">
        <Link href="/courses/search" className="text-[12.5px] text-t2 underline">
          ← Back to search
        </Link>
      </div>
      <PageHeader
        eyebrow="Learning workspace"
        title="One place to watch, take notes, and track progress"
        subtitle="The video is the main focus. Notes auto-save to your account. YouTube content gets the full player; other providers open in a new tab from the hero when embedding isn’t available."
      />
      <div className="mt-6">
        <CourseWorkspace
          courseKey={courseKey}
          url={url}
          provider={provider}
          title={title}
          initVideoId={initVideo}
          resumeAtSec={resumeAtSec}
        />
      </div>
    </div>
  );
}
