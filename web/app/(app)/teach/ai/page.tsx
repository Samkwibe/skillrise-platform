import Link from "next/link";
import { requireVerifiedUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { TeacherAiChat } from "@/components/teacher/teacher-ai-chat";

export const dynamic = "force-dynamic";

export default async function TeacherAiPage() {
  const user = await requireVerifiedUser();
  if (user.role !== "teacher" && user.role !== "admin") redirect("/dashboard");

  return (
    <div className="section-pad-x py-8 max-w-[800px] mx-auto">
      <div className="mb-4">
        <Link href="/teach" className="text-sm text-t2 underline">
          ← Dashboard
        </Link>
      </div>
      <PageHeader
        eyebrow="Teach · AI"
        title="AI Teaching Assistant"
        subtitle="Drafts and ideas for your teaching — lesson plans, announcements, and quiz prompts. You stay in control; review before anything goes to learners."
      />
      <TeacherAiChat />
    </div>
  );
}
