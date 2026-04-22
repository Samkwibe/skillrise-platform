import { NextResponse } from "next/server";
import { store, pledgeCounters } from "@/lib/store";

export async function GET() {
  return NextResponse.json(pledgeCounters());
}

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const data = body as {
    email?: string;
    commitments?: Record<string, boolean>;
  };
  if (!data.email || !/^\S+@\S+\.\S+$/.test(data.email)) {
    return NextResponse.json({ error: "Valid email required" }, { status: 400 });
  }
  store.pledges.push({
    email: data.email.trim().toLowerCase(),
    commitments: data.commitments ?? {},
    at: Date.now(),
  });
  return NextResponse.json({ ok: true, ...pledgeCounters() });
}
