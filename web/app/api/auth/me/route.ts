import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { publicUser } from "@/lib/store";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ user: null });
  return NextResponse.json({ user: publicUser(user) });
}
