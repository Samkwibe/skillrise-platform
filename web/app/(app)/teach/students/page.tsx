import Link from "next/link";
import { requireVerifiedUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { AtRiskStudentPanel } from "@/components/teacher/at-risk-student-panel";

export const dynamic = "force-dynamic";

export default async function TeacherStudentsPage() {
  const user = await requireVerifiedUser();
  if (user.role !== "teacher" && user.role !== "admin") redirect("/dashboard");

  return (
    <div className="section-pad-x py-8 max-w-[900px] mx-auto">
      <div className="mb-4">
        <Link href="/teach" className="text-sm text-t2 underline">
          ← Dashboard
        </Link>
      </div>
      <PageHeader
        eyebrow="Teach · Success"
        title="Student success & interventions"
        subtitle="Spot learners who may need a nudge — based on progress, activity, and quiz performance. Send email and/or SMS to selected at-risk students when your environment is configured, or copy templates for your own tools."
      />
      <AtRiskStudentPanel />
    </div>
  );
}
