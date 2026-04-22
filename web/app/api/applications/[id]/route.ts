import { NextResponse } from "next/server";
import { store } from "@/lib/store";
import { getVerifiedUserForApi } from "@/lib/auth";

const ALLOWED = ["submitted", "reviewed", "interview", "offered", "hired", "rejected"] as const;

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getVerifiedUserForApi();
  if (user instanceof NextResponse) return user;
  const { id } = await params;
  const app = store.applications.find((a) => a.id === id);
  if (!app) return NextResponse.json({ error: "Not found." }, { status: 404 });
  const job = store.jobs.find((j) => j.id === app.jobId);
  if (!job) return NextResponse.json({ error: "Job missing." }, { status: 404 });
  if (job.employerId !== user.id && user.role !== "admin") {
    return NextResponse.json({ error: "Not your role." }, { status: 403 });
  }
  const { status } = await req.json();
  if (!ALLOWED.includes(status)) return NextResponse.json({ error: "Invalid status." }, { status: 400 });
  app.status = status;
  if (status === "hired") {
    job.status = "filled";
  }
  return NextResponse.json({ application: app });
}
