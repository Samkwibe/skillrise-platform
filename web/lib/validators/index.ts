import { z } from "zod";

export const roleSchema = z.enum([
  "learner",
  "teacher",
  "teen",
  "employer",
  "school",
  "admin",
]);

/** Sign-up, password reset, and any new-password field — 12+ chars, mixed case, digit, symbol. */
export const strongPasswordSchema = z
  .string()
  .min(12, "Password must be at least 12 characters")
  .max(128)
  .regex(/[A-Z]/, "Include at least one uppercase letter")
  .regex(/[a-z]/, "Include at least one lowercase letter")
  .regex(/[0-9]/, "Include at least one number")
  .regex(/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>\/?`~]/, "Include at least one symbol (e.g. !@#*)");

export const verificationChannelSchema = z.enum(["email", "sms"]);

export const signupSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(80),
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
  password: strongPasswordSchema,
  role: roleSchema.default("learner"),
  neighborhood: z.string().trim().max(120).optional().default(""),
  /** Default `email`. `sms` is stored only if SMS is enabled server-side (else coerced to email on signup). */
  preferredVerificationChannel: verificationChannelSchema.optional(),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1).max(128),
});

export const confirmEmailSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  token: z.string().min(10).max(512),
});

export const forgotPasswordSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
});

export const resetPasswordSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  token: z.string().min(10).max(512),
  password: strongPasswordSchema,
});

export const profileUpdateSchema = z.object({
  name: z.string().trim().min(2).max(80).optional(),
  neighborhood: z.string().trim().max(120).optional(),
  bio: z.string().trim().max(500).optional(),
  avatarEmoji: z.string().trim().max(8).optional(),
  preferredTheme: z.enum(["dark", "light", "system"]).optional(),
});

export const enrollSchema = z.object({
  trackSlug: z.string().min(1).max(100),
});

export const progressSchema = z.object({
  trackSlug: z.string().min(1).max(100),
  moduleId: z.string().min(1).max(100),
});

export const feedPostSchema = z.object({
  trackSlug: z.string().optional().default(""),
  caption: z.string().trim().min(1).max(600),
  durationSec: z.number().int().min(5).max(300).default(45),
});

export const feedCommentSchema = z.object({
  body: z.string().trim().min(1).max(500),
});

export const liveScheduleSchema = z.object({
  title: z.string().trim().min(3).max(120),
  description: z.string().trim().max(600).default(""),
  startsAt: z.string().refine((v) => !isNaN(Date.parse(v)), "Invalid ISO date"),
  durationMin: z.number().int().min(10).max(240).default(60),
  trackSlug: z.string().optional().default(""),
});

export const jobPostSchema = z.object({
  title: z.string().trim().min(3).max(120),
  neighborhood: z.string().trim().min(2).max(120),
  payRange: z.string().trim().max(80).default(""),
  description: z.string().trim().min(10).max(2000),
  requiredCerts: z.array(z.string()).max(10).default([]),
  tags: z.array(z.string()).max(10).default([]),
});

export const applicationSchema = z.object({
  coverNote: z.string().trim().max(800).default(""),
});

export const applicationStatusSchema = z.object({
  status: z.enum(["applied", "shortlisted", "interview", "hired", "rejected"]),
});

export const cohortMessageSchema = z.object({
  body: z.string().trim().min(1).max(1000),
});

export const assistantAskSchema = z.object({
  prompt: z.string().trim().min(1).max(2000),
  trackSlug: z.string().optional(),
  stream: z.boolean().optional().default(true),
  history: z
    .array(
      z.object({
        role: z.enum(["user", "assistant", "system"]),
        content: z.string().max(4000),
      }),
    )
    .max(20)
    .optional()
    .default([]),
});

export const challengeSchema = z.object({
  day: z.number().int().min(1).max(30),
  completed: z.boolean(),
});

export const skillSearchSchema = z.object({
  q: z.string().trim().min(1, "Type what you want to learn").max(120),
  max: z.coerce.number().int().min(1).max(20).optional().default(12),
});

export const lifeCategorySchema = z.enum([
  "communication",
  "mental-health",
  "financial-literacy",
  "job-readiness",
  "trades",
  "home-life",
  "digital-basics",
  "tech",
  "care",
  "youth",
]);

export const onboardingSchema = z.object({
  // Caps are intentionally generous — the UI lists 11 struggle chips and
  // 9 categories today, and we don't want a user who taps "all that apply"
  // to hit an invisible wall. The real guardrail is the UI (chip count).
  struggles: z.array(z.string().min(1).max(40)).max(20).default([]),
  interests: z.array(lifeCategorySchema).max(20).default([]),
  hasDiploma: z.union([z.boolean(), z.null()]).default(null),
  timePerDay: z.union([z.literal(5), z.literal(15), z.literal(30), z.literal(60)]).default(15),
  freeText: z.string().trim().max(400).optional(),
});

export const teacherIntroSchema = z.object({
  canTeach: z.string().trim().min(2, "Tell us one thing you can teach").max(200),
  whyHelp: z.string().trim().min(2, "Tell us why").max(400),
  introVideoUrl: z.string().trim().url().optional().or(z.literal("")).transform((v) => v || undefined),
});

export const communityMessageSchema = z.object({
  text: z.string().trim().min(1, "Say something.").max(1200),
});

const courseProviderEnum = z.enum([
  "coursera",
  "openlibrary",
  "mit",
  "khan",
  "youtube",
  "simplilearn",
]);

export const courseSearchSchema = z.object({
  q: z.string().trim().min(1, "Type what you want to learn").max(120),
  limit: z.coerce.number().int().min(1).max(36).optional().default(18),
  /** Comma-separated provider ids, e.g. "coursera,openlibrary" */
  providers: z.string().max(80).optional(),
});

export const savedExternalCourseBodySchema = z.object({
  provider: courseProviderEnum,
  title: z.string().trim().min(1).max(200),
  url: z.string().url().max(2000),
  imageUrl: z.string().url().max(2000).optional(),
  description: z.string().trim().max(800).optional(),
});

export const savedExternalProgressSchema = z.object({
  id: z.string().min(8).max(40),
  progressPct: z.number().int().min(0).max(100),
});

const learningHubNoteSchema = z.object({
  id: z.string().min(4).max(40),
  text: z.string().max(8000),
  tSec: z.number().min(0).max(86400),
  createdAt: z.number(),
  updatedAt: z.number(),
});

export const learningHubPatchSchema = z.object({
  key: z.string().min(8).max(40),
  provider: courseProviderEnum,
  title: z.string().min(1).max(240),
  url: z.string().url().max(2000),
  imageUrl: z.string().url().max(2000).optional(),
  primaryVideoId: z.string().max(32).optional(),
  progressPct: z.number().int().min(0).max(100).optional(),
  completed: z.boolean().optional(),
  notes: z.array(learningHubNoteSchema).max(200).optional(),
});

export const accountSmsActionSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("start"), phone: z.string().min(6).max(32) }),
  z.object({ action: z.literal("confirm"), code: z.string().regex(/^\d{6}$/, "Use the 6-digit code") }),
]);

export const phoneVerifyActionSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("send"), phone: z.string().min(6).max(32) }),
  z.object({ action: z.literal("verify"), code: z.string().regex(/^\d{6}$/, "Use the 6-digit code") }),
  z.object({ action: z.literal("remove") }),
]);

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type AssistantAskInput = z.infer<typeof assistantAskSchema>;

export function formatZodError(err: z.ZodError): { field?: string; message: string }[] {
  return err.issues.map((i) => ({
    field: i.path.join("."),
    message: i.message,
  }));
}
