import { NextResponse } from "next/server";
import { store, id as newId } from "@/lib/store";
import { getVerifiedUserForApi } from "@/lib/auth";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getVerifiedUserForApi();
  if (user instanceof NextResponse) return user;
  if (user.role === "employer") {
    return NextResponse.json({ error: "Employer accounts can't apply." }, { status: 403 });
  }
  const { id } = await params;
  const job = store.jobs.find((j) => j.id === id);
  if (!job) return NextResponse.json({ error: "Job not found." }, { status: 404 });
  if (store.applications.some((a) => a.jobId === id && a.userId === user.id)) {
    return NextResponse.json({ error: "You already applied." }, { status: 409 });
  }
  const { note, certificateIds } = await req.json();
  const app = {
    id: `a_${newId()}`,
    jobId: id,
    userId: user.id,
    certificateIds: Array.isArray(certificateIds) ? certificateIds : [],
    note: String(note || "").slice(0, 1000),
    appliedAt: Date.now(),
    status: "submitted" as const,
  };
  store.applications.push(app);
  return NextResponse.json({ application: app }, { status: 201 });
}
