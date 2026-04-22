import { NextResponse } from "next/server";
import { store } from "@/lib/store";
import { getVerifiedUserForApi } from "@/lib/auth";

export async function GET() {
  const user = await getVerifiedUserForApi();
  if (user instanceof NextResponse) return user;
  const p = store.challengeProgress.find((x) => x.userId === user.id);
  return NextResponse.json({ day: p?.day ?? 0 });
}

export async function POST() {
  const user = await getVerifiedUserForApi();
  if (user instanceof NextResponse) return user;
  let p = store.challengeProgress.find((x) => x.userId === user.id);
  if (!p) {
    p = { userId: user.id, day: 0, updatedAt: 0 };
    store.challengeProgress.push(p);
  }
  if (p.day < 30) {
    p.day += 1;
    p.updatedAt = Date.now();
  }
  return NextResponse.json({ day: p.day });
}
