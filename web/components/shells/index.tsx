import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getCurrentUser, isEmailVerified } from "@/lib/auth";
import { ensureEnrollmentStoreFromDatabase } from "@/lib/course/ensure-enrollments";
import { buildCommandItems } from "@/lib/command-items";
import { UnverifiedShell } from "@/components/shells/unverified-shell";
import { CommandPalette } from "@/components/command-palette";
import { LearnerShell } from "./learner-shell";
import { TeenShell } from "./teen-shell";
import { TeacherShell } from "./teacher-shell";
import { EmployerShell } from "./employer-shell";
import { SchoolShell } from "./school-shell";

/**
 * Role-aware shell dispatcher. Each role gets a visually distinct shell —
 * different nav placement, chrome, palette, typography. Admin reuses the
 * learner shell since admins inspect everything from the platform's main
 * viewpoint.
 */
const VERIFY_REQUIRED_PATH = "/verify-email/required";

export async function RoleShell({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const pathname = (await headers()).get("x-skillrise-pathname") || "";
  const onVerifyGate = pathname === VERIFY_REQUIRED_PATH || pathname === `${VERIFY_REQUIRED_PATH}/`;

  if (!isEmailVerified(user)) {
    if (!onVerifyGate) {
      redirect(VERIFY_REQUIRED_PATH);
    }
    return <UnverifiedShell user={user}>{children}</UnverifiedShell>;
  }

  await ensureEnrollmentStoreFromDatabase(user);

  const commandItems = buildCommandItems(user);
  const wrapped = (
    <>
      {children}
      <CommandPalette items={commandItems} />
    </>
  );

  switch (user.role) {
    case "teen":
      return <TeenShell user={user}>{wrapped}</TeenShell>;
    case "teacher":
      return <TeacherShell user={user}>{wrapped}</TeacherShell>;
    case "employer":
      return <EmployerShell user={user}>{wrapped}</EmployerShell>;
    case "school":
      return <SchoolShell user={user}>{wrapped}</SchoolShell>;
    case "admin":
    case "learner":
    default:
      return <LearnerShell user={user}>{wrapped}</LearnerShell>;
  }
}
