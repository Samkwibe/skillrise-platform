import { redirect } from "next/navigation";

/**
 * Legacy URL — the full learning workspace lives at `/courses/learn`.
 */
export default async function CourseViewPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const u = new URLSearchParams();
  for (const [k, v] of Object.entries(sp)) {
    if (v) u.set(k, v);
  }
  redirect(`/courses/learn?${u.toString()}`);
}
