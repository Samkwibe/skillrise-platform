import { NextResponse } from "next/server";
import { findUserById, publicUser } from "@/lib/store";
import { getVerifiedUserForApi } from "@/lib/auth";

export async function PATCH(req: Request) {
  const user = await getVerifiedUserForApi();
  if (user instanceof NextResponse) return user;
  const { name, neighborhood, bio, credentials } = await req.json();
  const target = findUserById(user.id);
  if (!target) return NextResponse.json({ error: "Not found." }, { status: 404 });
  if (name) target.name = String(name).slice(0, 80);
  if (neighborhood) target.neighborhood = String(neighborhood).slice(0, 80);
  if (typeof bio === "string") target.bio = bio.slice(0, 500);
  if (typeof credentials === "string") target.credentials = credentials.slice(0, 200);
  return NextResponse.json({ user: publicUser(target) });
}
