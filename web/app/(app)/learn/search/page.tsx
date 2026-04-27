import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser, isEmailVerified } from "@/lib/auth";
import { findUserById } from "@/lib/store";
import { ResourceSearch } from "@/components/resources/resource-search";
import { FEATURED_PLATFORMS } from "@/lib/resources/providers/deeplink";

export const dynamic = "force-dynamic";

export default async function LearnSearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const session = await getCurrentUser();
  if (!session) redirect("/login?redirect=/learn/search");
  if (!isEmailVerified(session)) redirect("/verify-email/required");
  // Employers and schools have no reason to search the learner catalog.
  if (session.role === "employer" || session.role === "school") {
    redirect("/dashboard");
  }

  const user = findUserById(session.id);
  const savedIds = (user?.savedResources ?? []).map((r) => r.id);

  const { q } = await searchParams;
  const initialQuery = (q ?? "").toString().slice(0, 120);

  const canSave = session.role === "learner" || session.role === "teen";

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <div
          className="text-[11px] uppercase tracking-[0.16em] font-bold"
          style={{ color: "var(--text-3)" }}
        >
          Explore
        </div>
        <h1
          className="font-extrabold text-[28px] md:text-[34px] leading-tight"
          style={{ fontFamily: "var(--role-font-display)" }}
        >
          Find a free course, video, or book.
        </h1>
        <p className="text-[14px]" style={{ color: "var(--text-2)" }}>
          One search fans out to YouTube, MIT OpenCourseWare, Open Library, Wikipedia,
          OpenAlex, Semantic Scholar, the Internet Archive, Google Books (with your
          Google API key), plus quick links to Coursera, Khan, edX, Harvard, Alison,
          and freeCodeCamp. All free to browse; keys are only for optional quotas.
        </p>
      </header>

      <ResourceSearch
        canSave={canSave}
        initialSavedIds={savedIds}
        defaultQuery={initialQuery}
      />

      <section className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between">
          <h2
            className="font-extrabold text-[18px] md:text-[20px]"
            style={{ fontFamily: "var(--role-font-display)" }}
          >
            From the open web
          </h2>
          <span className="text-[12.5px]" style={{ color: "var(--text-3)" }}>
            Platforms without an API — still free, still great.
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {FEATURED_PLATFORMS.map((p) => (
            <a
              key={p.id}
              href={p.url}
              target="_blank"
              rel="noreferrer noopener"
              className="card card-hover p-4 flex flex-col gap-2"
            >
              <div className="text-[24px]" aria-hidden>
                {p.emoji}
              </div>
              <div className="font-bold text-[14px] leading-snug">
                {p.label}
              </div>
              <div
                className="text-[12.5px] line-clamp-2"
                style={{ color: "var(--text-3)" }}
              >
                {p.tagline}
              </div>
            </a>
          ))}
        </div>
      </section>

      <div className="text-[12.5px]" style={{ color: "var(--text-3)" }}>
        Looking for a specific provider? We'll add real integrations for edX,
        Harvard, and Inokufu as soon as their keys are available. In the
        meantime, those search pills open the platform's own search page.
        <br />
        <Link href="/tracks" className="underline">
          Browse SkillRise tracks instead →
        </Link>
      </div>
    </div>
  );
}
