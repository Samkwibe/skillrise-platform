import { NextResponse } from "next/server";
import { findUserById, publicUser } from "@/lib/store";
import { getVerifiedUserForApi } from "@/lib/auth";
import { onboardingSchema, formatZodError } from "@/lib/validators";

export const dynamic = "force-dynamic";

/**
 * POST /api/me/onboarding — persist onboarding answers to the signed-in user.
 * The answers drive dashboard personalization. Everything here is optional
 * from the product's perspective: a user can always skip onboarding.
 */
export async function POST(req: Request) {
  const user = await getVerifiedUserForApi();
  if (user instanceof NextResponse) return user;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = onboardingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: formatZodError(parsed.error) },
      { status: 400 },
    );
  }

  const target = findUserById(user.id);
  if (!target) return NextResponse.json({ error: "Not found." }, { status: 404 });

  target.onboarding = {
    ...parsed.data,
    at: Date.now(),
  };

  return NextResponse.json({ user: publicUser(target) });
}
