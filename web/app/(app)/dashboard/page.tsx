import { requireVerifiedUser } from "@/lib/auth";
import { LearnerDashboard } from "@/components/dashboards/learner-dashboard";
import { TeenDashboard } from "@/components/dashboards/teen-dashboard";
import { TeacherDashboard } from "@/components/dashboards/teacher-dashboard";
import { EmployerDashboard } from "@/components/dashboards/employer-dashboard";
import { SchoolDashboard } from "@/components/dashboards/school-dashboard";

export const dynamic = "force-dynamic";

/**
 * Dashboard dispatcher. Each role gets a visually distinct experience —
 * different layout, different widget vocabulary. See each component for
 * its design philosophy.
 */
export default async function Dashboard() {
  const user = await requireVerifiedUser();

  switch (user.role) {
    case "teen":
      return <TeenDashboard user={user} />;
    case "teacher":
      return <TeacherDashboard user={user} />;
    case "employer":
      return <EmployerDashboard user={user} />;
    case "school":
      return <SchoolDashboard user={user} />;
    case "admin":
    case "learner":
    default:
      return <LearnerDashboard user={user} />;
  }
}
