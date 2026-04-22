import { RoleShell } from "@/components/shells";

export default function AuthedLayout({ children }: { children: React.ReactNode }) {
  return <RoleShell>{children}</RoleShell>;
}
