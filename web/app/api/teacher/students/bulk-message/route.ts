import { NextResponse } from "next/server";
import { getVerifiedUserForApi } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { listAtRiskStudentsForTeacher } from "@/lib/services/at-risk-students";
import { sendTransactionalEmail } from "@/lib/email/transactional";
import { sendTransactionalSms } from "@/lib/sms/transactional";
import { formatZodError, teacherBulkOutreachSchema } from "@/lib/validators";
import { getTrack } from "@/lib/store";

export const dynamic = "force-dynamic";

const SMS_MAX = 480;

export async function POST(req: Request) {
  const user = await getVerifiedUserForApi();
  if (user instanceof NextResponse) return user;
  if (user.role !== "teacher" && user.role !== "admin") {
    return NextResponse.json({ error: "Teachers only." }, { status: 403 });
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = teacherBulkOutreachSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", details: formatZodError(parsed.error) }, { status: 400 });
  }

  const { channel, subject, body, targets } = parsed.data;
  const atRisk = await listAtRiskStudentsForTeacher(user.id);
  const allowed = new Set(atRisk.map((r) => `${r.userId}::${r.trackSlug}`));
  for (const t of targets) {
    if (!allowed.has(`${t.userId}::${t.trackSlug}`)) {
      return NextResponse.json(
        { error: "Each recipient must be a current at-risk match for you and that track." },
        { status: 400 },
      );
    }
  }

  const db = getDb();
  const teacherName = user.name;
  const subj = subject?.trim() ?? "Message from your instructor";
  const emailIntro = (trackTitle: string) =>
    `${body.trim()}\n\n— ${teacherName}\n(${trackTitle} on SkillRise)\n`;
  const smsText = (trackTitle: string) => {
    const base = `${teacherName} (${trackTitle} / SkillRise): ${body.trim()}`;
    return base.length > SMS_MAX ? `${base.slice(0, SMS_MAX - 1)}…` : base;
  };

  let emailsSent = 0;
  let smsSent = 0;
  const errors: string[] = [];

  for (const t of targets) {
    const recipient = await db.findUserById(t.userId);
    if (!recipient) {
      errors.push(`User ${t.userId} not found`);
      continue;
    }
    const tr = getTrack(t.trackSlug);
    const trackTitle = tr?.title ?? t.trackSlug;

    if (channel === "email" || channel === "both") {
      try {
        await sendTransactionalEmail({
          to: recipient.email,
          subject: subj,
          textBody: emailIntro(trackTitle),
        });
        emailsSent += 1;
      } catch (e) {
        errors.push(`Email to ${recipient.email}: ${e instanceof Error ? e.message : String(e)}`);
      }
    }
    if (channel === "sms" || channel === "both") {
      if (!recipient.phoneE164 || !recipient.phoneVerifiedAt) {
        errors.push(`SMS skipped for ${recipient.name}: no verified phone on file`);
        continue;
      }
      try {
        await sendTransactionalSms(recipient.phoneE164, smsText(trackTitle));
        smsSent += 1;
      } catch (e) {
        errors.push(
          `SMS to ${recipient.phoneE164.slice(0, 6)}…: ${e instanceof Error ? e.message : String(e)}`,
        );
      }
    }
  }

  // eslint-disable-next-line no-console
  console.info(
    "[teacher-bulk] teacherId=%s channel=%s targets=%d emails=%d sms=%d",
    user.id,
    channel,
    targets.length,
    emailsSent,
    smsSent,
  );

  return NextResponse.json({
    ok: errors.length === 0,
    emailsSent,
    smsSent,
    errors: errors.length ? errors : undefined,
  });
}
