import { NextResponse } from "next/server";
import { store, id, getTrack } from "@/lib/store";
import { getVerifiedUserForApi } from "@/lib/auth";
import { ensureTracksFromDatabase } from "@/lib/course/ensure-tracks";

export async function GET() {
  return NextResponse.json({ jobs: store.jobs.filter((j) => j.status === "open") });
}

export async function POST(req: Request) {
  const user = await getVerifiedUserForApi();
  if (user instanceof NextResponse) return user;
  if (user.role !== "employer" && user.role !== "admin") {
    return NextResponse.json({ error: "Only employers can post jobs." }, { status: 403 });
  }
  await ensureTracksFromDatabase();
  const body = await req.json();
  if (!body.title || !body.description) {
    return NextResponse.json({ error: "Title and description are required." }, { status: 400 });
  }
  if (body.requiredTrackSlug && !getTrack(body.requiredTrackSlug)) {
    return NextResponse.json({ error: "Unknown required track." }, { status: 400 });
  }
  const job = {
    id: `j_${id()}`,
    employerId: user.id,
    company: user.company || user.name,
    title: String(body.title),
    description: String(body.description),
    neighborhood: body.neighborhood || user.neighborhood,
    wageFrom: Number(body.wageFrom) || 0,
    wageTo: Number(body.wageTo) || 0,
    wageUnit: (body.wageUnit === "yr" ? "yr" : "hr") as "hr" | "yr",
    type: (["Full time", "Part time", "Apprentice"] as const).includes(body.type) ? body.type : "Full time",
    requiredTrackSlug: body.requiredTrackSlug || undefined,
    postedAt: Date.now(),
    hireGuarantee: Boolean(body.hireGuarantee),
    status: "open" as const,
  };
  store.jobs.push(job);
  return NextResponse.json({ job }, { status: 201 });
}
