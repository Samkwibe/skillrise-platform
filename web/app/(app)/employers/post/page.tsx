import { requireVerifiedUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { store } from "@/lib/store";
import { PageHeader } from "@/components/page-header";
import { PostJobForm } from "@/components/post-job-form";

export const dynamic = "force-dynamic";

export default async function PostJobPage() {
  const user = await requireVerifiedUser();
  if (user.role !== "employer" && user.role !== "admin") redirect("/dashboard");
  return (
    <div className="section-pad-x py-10">
      <PageHeader
        eyebrow="Post a job"
        title="Hire verified SkillRise graduates."
        subtitle="One-tap applicants with real certificates. 90-day hire-guarantee partners get featured."
      />
      <div className="max-w-[640px]">
        <PostJobForm tracks={store.tracks.map((t) => ({ slug: t.slug, title: t.title }))} />
      </div>
    </div>
  );
}
