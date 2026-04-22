import { NextResponse } from "next/server";
import { store } from "@/lib/store";

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    body = {};
  }
  const data = (body ?? {}) as { kind?: string };
  store.challenges.push({
    kind: data.kind ?? "30-day-social-swap",
    at: Date.now(),
  });
  return NextResponse.json({ ok: true, count: store.challenges.length });
}
