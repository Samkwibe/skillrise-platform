import { NextResponse } from "next/server";
import { store } from "@/lib/store";

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const data = body as {
    company?: string;
    email?: string;
    role?: string;
    mode?: "post" | "talk";
  };
  if (!data.company || !data.email || !data.role) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }
  if (!/^\S+@\S+\.\S+$/.test(data.email)) {
    return NextResponse.json({ error: "Valid email required" }, { status: 400 });
  }
  store.employers.push({
    company: data.company.trim(),
    email: data.email.trim().toLowerCase(),
    role: data.role.trim(),
    mode: data.mode === "talk" ? "talk" : "post",
    at: Date.now(),
  });
  return NextResponse.json({ ok: true });
}
