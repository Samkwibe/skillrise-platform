import { requireVerifiedUser } from "@/lib/auth";
import { UnifiedCourseSearch } from "@/components/courses/unified-course-search";
import { PageHeader } from "@/components/page-header";

export const dynamic = "force-dynamic";

export default async function FreeCoursesSearchPage() {
  await requireVerifiedUser();

  return (
    <div className="section-pad-x py-8 md:py-10 max-w-6xl mx-auto">
      <PageHeader
        eyebrow="My Learning"
        title="Find free courses & books"
        subtitle="One search across major free providers. Start here, save what matters, and track progress on your dashboard."
      />
      <UnifiedCourseSearch variant="page" />
    </div>
  );
}
