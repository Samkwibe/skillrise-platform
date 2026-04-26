// In-memory store for the full SkillRise platform demo.
// Replace each collection with a Postgres table (see TECHNICAL_REQUIREMENTS.md §6) before production.
// The store is persisted on `globalThis` so Next.js HMR does not wipe it between requests.

import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import type { Quiz, QuizAttempt } from "@/lib/quiz/types";
import type {
  CourseAssignment,
  AssignmentSubmission,
  CourseAnnouncement,
  AnnouncementRead,
  CourseForumThread,
  CourseForumPost,
  DmThread,
  DmMessage,
  EnrollmentInvite,
  CourseSection,
  CourseGradebookOverride,
} from "@/lib/course/lms-types";
import type { CourseReviewRecord, CourseWishlistEntry } from "@/lib/course/discovery-types";

// Hash the shared demo password once at module load so seeded users are bcrypt-hashed too.
const DEMO_PASSWORD_HASH = bcrypt.hashSync("demo1234", 10);

export type Role = "learner" | "teacher" | "teen" | "employer" | "school" | "admin";

/**
 * Life-skill categories — the real reason SkillRise exists.
 * These power: track browsing, feed filtering, onboarding match,
 * and community room scopes. Every learner-facing piece of content
 * belongs to exactly one of these.
 */
export type LifeCategory =
  | "communication"
  | "mental-health"
  | "financial-literacy"
  | "job-readiness"
  | "trades"
  | "home-life"
  | "digital-basics"
  | "tech"
  | "care"
  | "youth";

export const LIFE_CATEGORIES: Array<{
  id: LifeCategory;
  label: string;
  emoji: string;
  blurb: string;
  forTeens: boolean;
}> = [
  { id: "communication",      label: "Communication",       emoji: "🗣️", blurb: "Listen better, speak clearly, write emails that land.",        forTeens: true  },
  { id: "mental-health",      label: "Mental health",       emoji: "🧠", blurb: "Stress, confidence, focus. Small tools, real difference.",     forTeens: true  },
  { id: "financial-literacy", label: "Money & budgeting",   emoji: "💰", blurb: "Budgeting, saving, taxes — for people earning real money.",    forTeens: true  },
  { id: "job-readiness",      label: "Job readiness",       emoji: "💼", blurb: "Resumes, interviews, the first 90 days on any job.",           forTeens: true  },
  { id: "trades",             label: "Trades & hands-on",   emoji: "🛠️", blurb: "Plumbing, cleaning, landscaping, warehouse safety.",           forTeens: false },
  { id: "home-life",          label: "Home & life",         emoji: "🏠", blurb: "Cooking, parenting, time, first aid.",                        forTeens: true  },
  { id: "digital-basics",     label: "Digital basics",      emoji: "💻", blurb: "Email, online safety, typing, spreadsheets.",                 forTeens: true  },
  { id: "tech",               label: "Tech & building",     emoji: "🚀", blurb: "Real websites, tools, and portfolios.",                       forTeens: true  },
  { id: "care",               label: "Caregiving",          emoji: "🩺", blurb: "Dignified, paid work supporting elderly and families.",       forTeens: false },
];

/**
 * Answers captured by the first-login onboarding.
 * Every field is optional so pre-existing accounts still render fine.
 * The dashboard adapts to whatever is filled in.
 */
export type OnboardingAnswers = {
  struggles: string[];      // e.g. ["finding-job", "confidence", "money"]
  interests: LifeCategory[];
  hasDiploma: boolean | null;
  timePerDay: 5 | 15 | 30 | 60;
  freeText?: string;        // "what's one thing you're struggling with right now"
  at: number;
};

export type SecurityNotificationKind =
  | "email_verified"
  | "password_changed"
  | "sessions_revoked"
  | "sessions_signed_out_everywhere"
  | "google_sign_in"
  | "google_account_linked"
  | "github_sign_in"
  | "github_account_linked"
  | "phone_verified"
  | "phone_removed"
  | "account_verified_sms";

export type SecurityNotification = {
  id: string;
  kind: SecurityNotificationKind;
  title: string;
  detail?: string;
  at: number;
  read: boolean;
};

export type User = {
  id: string;
  email: string;
  /** Bcrypt hash for password sign-in. Omitted for Google-only users until they set a password. */
  password?: string;
  /** Set when the user signs in (or links) with Google; stable OpenID `sub` from Google. */
  googleSub?: string;
  /** GitHub numeric user id as string (OAuth). */
  githubId?: string;
  /** Optional profile photo (e.g. Google/GitHub). */
  avatarUrl?: string;
  name: string;
  role: Role;
  neighborhood: string;
  age?: number;
  bio?: string;
  avatar: string; // initials + gradient key
  createdAt: number;
  /** Set when the user completes email verification (server truth for `publicUser.emailVerified`). */
  emailVerifiedAt?: number;
  /** SHA-256 hex of one-time verification token; cleared after verify or replace. */
  emailVerificationTokenHash?: string;
  emailVerificationExpiresAt?: number;
  /** Password reset (hashed token + expiry); cleared after successful reset. */
  passwordResetTokenHash?: string;
  passwordResetExpiresAt?: number;
  /** In-app security alerts (max ~50); not included in `publicUser`. */
  securityNotifications?: SecurityNotification[];
  /** E.164 phone (e.g. +15551234567) after successful SMS verification; optional account signal. */
  phoneE164?: string;
  /** When `phoneE164` was confirmed via SMS OTP. */
  phoneVerifiedAt?: number;
  /** Number we’re confirming; cleared after verify or remove. */
  phonePendingE164?: string;
  /** SHA-256 hex of the 6-digit SMS code; cleared after verify. */
  phoneVerificationCodeHash?: string;
  phoneVerificationExpiresAt?: number;
  /**
   * How the user wants to complete first-time account verification (email link vs SMS code).
   * Does not apply after `emailVerifiedAt` is set; Google sign-in users skip this.
   */
  preferredVerificationChannel?: "email" | "sms";
  /**
   * Optional MFA (not enforced at login yet — see `lib/auth/mfa.ts`).
   * Phase 1: email/SMS second step. Phase 2: TOTP.
   */
  mfaEnabled?: boolean;
  mfaEmailOtpEnabled?: boolean;
  mfaSmsOtpEnabled?: boolean;
  mfaTotpEnabled?: boolean;
  /** Users this account does not want to receive DMs from (learner safety). */
  mutedUserIds?: string[];
  // employer-specific
  company?: string;
  // teacher-specific
  credentials?: string;
  teacherIntro?: {
    canTeach: string;       // "Plumbing basics", "First aid", etc.
    whyHelp: string;
    introVideoUrl?: string;
  };
  // onboarding answers (learner/teen only)
  onboarding?: OnboardingAnswers;
  /**
   * External free courses (Coursera, Open Library, etc.) the learner saved from
   * unified course search. Progress is a simple 0–100 for “Udemy-style” resume.
   */
  savedExternalCourses?: SavedExternalCourse[];
  /** Unified resource search saves (`/api/resources/save`) */
  savedResources?: SavedResource[];
  /**
   * Rich course player state: notes with timestamps, progress — keyed by
   * `stableCourseId(provider,url)` to match `SavedExternalCourse.id`.
   */
  learningHubByCourse?: Record<string, LearningHubCourseState>;
};

export type LearningHubNote = {
  id: string;
  text: string;
  /** Seconds in the primary video (YouTube) */
  tSec: number;
  createdAt: number;
  updatedAt: number;
};

export type LearningHubCourseState = {
  provider: "coursera" | "openlibrary" | "mit" | "khan" | "youtube" | "simplilearn" | "udemy";
  title: string;
  url: string;
  imageUrl?: string;
  primaryVideoId?: string;
  /** When known (e.g. YouTube player), for auto % and resume. */
  lastPositionSec?: number;
  videoDurationSec?: number;
  progressPct: number;
  completed: boolean;
  notes: LearningHubNote[];
  updatedAt: number;
};

/** Saved free-course links from `/courses` search — not the same as SkillFeed saves. */
export type SavedExternalCourse = {
  id: string;
  provider: "coursera" | "openlibrary" | "mit" | "khan" | "youtube" | "simplilearn" | "udemy";
  title: string;
  url: string;
  imageUrl?: string;
  description?: string;
  progressPct: number;
  /** Mirrors learning hub for dashboard “continue from” links */
  lastPositionSec?: number;
  savedAt: number;
};

/**
 * Broader "learning resource" save used by `/learn/search` + `ResourceSearch`.
 * Kept separate from `savedExternalCourses` until we unify the UIs.
 */
export type SavedResource = {
  id: string;
  title: string;
  url: string;
  description?: string;
  thumbnail?: string;
  author?: string;
  duration?: string;
  provider: string;
  kind: string;
  embedUrl?: string;
  freeCertificate: boolean;
  savedAt: number;
};

export type Session = {
  token: string;
  userId: string;
  createdAt: number;
  /** Last activity (optional; set on creation, can be refreshed later). */
  lastUsedAt?: number;
  userAgent?: string;
  ip?: string;
};

/** Files or links attached to a lesson (download in player or open external). */
export type CourseMaterial = {
  id: string;
  kind: "pdf" | "doc" | "sheet" | "slide" | "link" | "youtube" | "other";
  title: string;
  /** Public HTTPS URL, or set `s3Key` for private bucket + signed GET at view time. */
  url?: string;
  s3Key?: string;
  createdAt: number;
};

export type Module = {
  id: string;
  title: string;
  duration: string; // e.g. "12 min" (display; can mirror durationMin)
  summary: string;
  transcript: string;
  /** Group lessons under a unit in the course builder and track page. */
  unitId?: string;
  unitTitle?: string;
  /** Estimated minutes (course builder + analytics). */
  durationMin?: number;
  /** When true, learners can open this lesson before enrolling. */
  isPreview?: boolean;
  videoSource?: "none" | "youtube" | "upload";
  /** Direct play URL (public object or long-lived CDN URL). */
  videoUrl?: string;
  /** S3 object key for private uploads; combined with presigned GET in the learn UI. */
  s3Key?: string;
  youtubeVideoId?: string;
  thumbnailUrl?: string;
  materials?: CourseMaterial[];
  /** AWS Transcribe (or similar) — pending until transcript text is backfilled. */
  transcribeStatus?: "none" | "pending" | "ready";
  /** Rich HTML for lesson body (optional; summary stays plain for cards). */
  descriptionHtml?: string;
};

/**
 * Track.category uses LifeCategory as of v2. Legacy values are aliased below
 * via `legacyToLife()` so existing seed data keeps working.
 */
export type Track = {
  slug: string;
  title: string;
  category: LifeCategory;
  summary: string;
  heroEmoji: string;
  color: string; // rgb triplet
  weeks: number;
  level: "Beginner" | "Intermediate" | "Advanced";
  teacherId: string;
  youthFriendly: boolean;
  modules: Module[];
  skills: string[];
  /** Onboarding-match tags (free-form). Used to pair tracks to struggles. */
  tags?: string[];
  /** Jobs that realistically open up after this track. Kept short. */
  jobPaths?: string[];
  hiringDemand: number; // 1–5
  averageWageUplift: string;
  /** Slugs of tracks that must be completed before starting this one */
  prerequisiteSlugs?: string[];
  /** Weights 0–100, should sum to 100; used by gradebook final calculation */
  gradebookWeights?: { assignment: number; quiz: number };
};

export type Enrollment = {
  id: string;
  userId: string;
  trackSlug: string;
  startedAt: number;
  completedModuleIds: string[];
  completedAt?: number;
  cohortId?: string;
  /** Cohort/section for LMS features */
  sectionId?: string;
  /** e.g. invite token id */
  source?: string;
  /** Set when join used an invite with requireApproval — teacher must clear */
  pendingApproval?: boolean;
};

export type Cohort = {
  id: string;
  trackSlug: string;
  neighborhood: string;
  startDate: number;
  members: string[]; // user ids
};

export type CohortMessage = {
  id: string;
  cohortId: string;
  userId: string;
  text: string;
  at: number;
};

export type FeedPost = {
  id: string;
  authorId: string;
  title: string;
  description: string;
  emoji: string;
  duration: string;
  likes: number;
  comments: Comment[];
  youth: boolean;
  trackSlug?: string;
  /** Educational-only feed. Every post MUST declare a life-skill category. */
  category: LifeCategory;
  /** The one-sentence takeaway the viewer should walk away with. */
  takeaway?: string;
  /** Optional public video: HTTPS URL to .mp4/.webm or a page YouTube/Vimeo can embed. */
  videoUrl?: string;
  /** Users who have saved this post for later. */
  savedBy?: string[];
  createdAt: number;
};

export type Comment = {
  id: string;
  userId: string;
  text: string;
  at: number;
};

export type LiveSession = {
  id: string;
  teacherId: string;
  title: string;
  topic: string;
  startsAt: number;
  durationMin: number;
  attendees: string[];
  status: "scheduled" | "live" | "ended";
  youth: boolean;
};

export type Certificate = {
  id: string;
  userId: string;
  trackSlug: string;
  issuedAt: number;
  score: number;
  verifiable: boolean;
};

export type Job = {
  id: string;
  employerId: string;
  company: string;
  title: string;
  description: string;
  neighborhood: string;
  wageFrom: number;
  wageTo: number;
  wageUnit: "hr" | "yr";
  type: "Full time" | "Part time" | "Apprentice";
  requiredTrackSlug?: string;
  postedAt: number;
  hireGuarantee: boolean;
  status: "open" | "filled" | "closed";
};

export type Application = {
  id: string;
  jobId: string;
  userId: string;
  certificateIds: string[];
  note: string;
  appliedAt: number;
  status: "submitted" | "reviewed" | "interview" | "offered" | "hired" | "rejected";
};

export type PledgeEntry = {
  email: string;
  commitments: Record<string, boolean>;
  at: number;
};

export type EmployerEntry = {
  company: string;
  email: string;
  role: string;
  mode: "post" | "talk";
  at: number;
};

export type ChallengeEntry = {
  userId?: string;
  kind: string;
  at: number;
};

export type ChallengeProgress = {
  userId: string;
  day: number; // 1..30
  updatedAt: number;
};

export type AssistantMessage = {
  id: string;
  userId: string;
  role: "user" | "assistant";
  text: string;
  at: number;
};

export type SchoolClass = {
  id: string;
  schoolId: string;
  name: string;
  trackSlug: string;
  studentIds: string[];
};

export type Report = {
  id: string;
  targetType: "feedPost" | "comment" | "lesson";
  targetId: string;
  reason: string;
  at: number;
  resolved: boolean;
};

/**
 * Community chat — low-ceremony public rooms so learners can ask for help
 * and help each other. Teen-safe rooms are flagged so teens never see
 * adult-general channels.
 */
export type CommunityRoom = {
  id: string;
  slug: string;
  name: string;
  description: string;
  /** Which life-skill this room is scoped to. `null` = general. */
  category: LifeCategory | null;
  /** Visible/available to teens? If false, teens never see it. */
  teenSafe: boolean;
  /** "Office hours" / study group variants get a host user. */
  hostUserId?: string;
  /** Optional track pairing (e.g. "Web Dev Starter" cohort chat). */
  trackSlug?: string;
  /** Kind of room — drives the label + icon. */
  kind: "public" | "office-hours" | "study-group" | "teen-safe";
  memberCount: number; // cosmetic; seeded
  createdAt: number;
};

export type CommunityMessage = {
  id: string;
  roomId: string;
  userId: string;
  text: string;
  at: number;
  /** Soft-moderation flag. Hidden messages are not returned to clients. */
  hidden?: boolean;
};

/** Learner-submitted thanks shown on the teacher Community Impact dashboard (demo + future API). */
export type TeacherThankYou = {
  id: string;
  teacherId: string;
  fromUserId: string;
  message: string;
  at: number;
  trackSlug?: string;
};

type StoreShape = {
  users: User[];
  sessions: Session[];
  tracks: Track[];
  enrollments: Enrollment[];
  cohorts: Cohort[];
  cohortMessages: CohortMessage[];
  feed: FeedPost[];
  liveSessions: LiveSession[];
  certificates: Certificate[];
  jobs: Job[];
  applications: Application[];
  pledges: PledgeEntry[];
  employers: EmployerEntry[];
  challenges: ChallengeEntry[];
  challengeProgress: ChallengeProgress[];
  assistantMessages: AssistantMessage[];
  schoolClasses: SchoolClass[];
  reports: Report[];
  communityRooms: CommunityRoom[];
  communityMessages: CommunityMessage[];
  quizzes: Quiz[];
  quizAttempts: QuizAttempt[];
  teacherThankYous: TeacherThankYou[];
  courseAssignments: CourseAssignment[];
  assignmentSubmissions: AssignmentSubmission[];
  courseAnnouncements: CourseAnnouncement[];
  announcementReads: AnnouncementRead[];
  courseForumThreads: CourseForumThread[];
  courseForumPosts: CourseForumPost[];
  dmThreads: DmThread[];
  dmMessages: DmMessage[];
  enrollmentInvites: EnrollmentInvite[];
  courseSections: CourseSection[];
  courseGradebookOverrides: CourseGradebookOverride[];
  courseReviews: CourseReviewRecord[];
  courseWishlist: CourseWishlistEntry[];
  seededTotal: number;
};

declare global {
  // eslint-disable-next-line no-var
  var __skillrise_store: StoreShape | undefined;
}

export const id = () => randomBytes(8).toString("hex");

function seed(): StoreShape {
  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;

  const users: User[] = [];

  const tracks: Track[] = [];
  const enrollments: Enrollment[] = [];
  const cohorts: Cohort[] = [];
  const cohortMessages: CohortMessage[] = [];
  const feed: FeedPost[] = [];
  const liveSessions: LiveSession[] = [];
  const certificates: Certificate[] = [];
  const jobs: Job[] = [];
  const applications: Application[] = [];
  const schoolClasses: SchoolClass[] = [];
  const communityRooms: CommunityRoom[] = [];
  const communityMessages: CommunityMessage[] = [];
  const teacherThankYous: TeacherThankYou[] = [];
  return {
    users,
    sessions: [],
    tracks,
    enrollments,
    cohorts,
    cohortMessages,
    feed,
    liveSessions,
    certificates,
    jobs,
    applications,
    pledges: [],
    employers: [],
    challenges: [],
    challengeProgress: [],
    assistantMessages: [],
    schoolClasses,
    communityRooms,
    communityMessages,
    reports: [],
    quizzes: [],
    quizAttempts: [],
    teacherThankYous,
    courseAssignments: [],
    assignmentSubmissions: [],
    courseAnnouncements: [],
    announcementReads: [],
    courseForumThreads: [],
    courseForumPosts: [],
    dmThreads: [],
    dmMessages: [],
    enrollmentInvites: [],
    courseSections: [],
    courseGradebookOverrides: [],
    courseReviews: [],
    courseWishlist: [] as CourseWishlistEntry[],
    seededTotal: 48213,
  };
}

export const store: StoreShape = globalThis.__skillrise_store ?? (globalThis.__skillrise_store = seed());

export function pledgeCounters() {
  const now = Date.now();
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayCount = store.pledges.filter((p) => p.at >= todayStart.getTime()).length;
  const total = store.seededTotal + store.pledges.length;
  const cosmeticToday = 127 + todayCount;
  return { total, today: cosmeticToday, now };
}

export function findUserByEmail(email: string) {
  return store.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
}

export function findUserById(userId: string) {
  return store.users.find((u) => u.id === userId);
}

/** Client-safe user — no secrets or one-time token fields. */
export function publicUser(u: User) {
  const {
    password: _pw,
    googleSub: _gs,
    githubId: _gh,
    emailVerificationTokenHash: _evh,
    emailVerificationExpiresAt: _eve,
    passwordResetTokenHash: _prh,
    passwordResetExpiresAt: _pre,
    emailVerifiedAt,
    securityNotifications: _sec,
    phoneE164: _pe,
    phonePendingE164: _pp,
    phoneVerificationCodeHash: _pvh,
    phoneVerificationExpiresAt: _pve,
    mfaEnabled: _mfaE,
    mfaEmailOtpEnabled: _mfaEo,
    mfaSmsOtpEnabled: _mfaSo,
    mfaTotpEnabled: _mfaTo,
    ...rest
  } = u;
  const phoneVerified = Boolean(_pe && u.phoneVerifiedAt);
  return {
    ...rest,
    emailVerified: Boolean(emailVerifiedAt),
    hasPassword: Boolean(_pw),
    authGoogle: Boolean(_gs),
    authGitHub: Boolean(_gh),
    phoneVerified,
    phoneMasked: _pe && phoneVerified ? _maskE164ForPublic(_pe) : undefined,
    phonePendingMasked: _pp && !phoneVerified ? _maskE164ForPublic(_pp) : undefined,
    preferredVerificationChannel: (u.preferredVerificationChannel === "sms" ? "sms" : "email") as "email" | "sms",
    mfaEnabled: Boolean(_mfaE),
    mfaEmailOtp: Boolean(_mfaEo),
    mfaSmsOtp: Boolean(_mfaSo),
    mfaTotp: Boolean(_mfaTo),
  };
}

function _maskE164ForPublic(e164: string): string {
  const d = e164.replace(/\D/g, "");
  if (d.length < 4) return "••••";
  return `(•••) •••-${d.slice(-4)}`;
}

export function getTrack(slug: string) {
  return store.tracks.find((t) => t.slug === slug);
}

export function userEnrollments(userId: string) {
  return store.enrollments.filter((e) => e.userId === userId);
}

/** Other learners/teens in the same neighborhood (real accounts only). */
export function neighborhoodPeers(user: User, limit = 12): User[] {
  const n = user.neighborhood?.trim();
  if (!n || n === "—") return [];
  return store.users
    .filter(
      (u) =>
        u.id !== user.id &&
        u.neighborhood === n &&
        (u.role === "learner" || u.role === "teen"),
    )
    .slice(0, limit);
}

export function userCertificates(userId: string) {
  return store.certificates.filter((c) => c.userId === userId);
}

export function employerJobs(employerId: string) {
  return store.jobs.filter((j) => j.employerId === employerId);
}

export function jobApplications(jobId: string) {
  return store.applications.filter((a) => a.jobId === jobId);
}

/* ───────────────── Feed helpers ───────────────── */

/**
 * Return feed posts the user has saved, newest-saved first. We don't
 * currently track saved-at timestamps, so we fall back to post creation
 * time. Teen accounts only ever see teen-safe posts, even if they
 * somehow saved one that later lost the flag.
 */
export function userSavedFeed(user: User): FeedPost[] {
  const teen = user.role === "teen";
  return store.feed
    .filter((p) => p.savedBy?.includes(user.id))
    .filter((p) => (teen ? p.youth : true))
    .sort((a, b) => b.createdAt - a.createdAt);
}

/* ───────────────── Community helpers ───────────────── */

export function listCommunityRoomsFor(user: User) {
  const isTeen = user.role === "teen";
  return store.communityRooms.filter((r) => (isTeen ? r.teenSafe : true));
}

export function getCommunityRoom(idOrSlug: string) {
  return (
    store.communityRooms.find((r) => r.id === idOrSlug) ||
    store.communityRooms.find((r) => r.slug === idOrSlug) ||
    null
  );
}

export function listCommunityMessages(roomId: string, limit = 100) {
  return store.communityMessages
    .filter((m) => m.roomId === roomId && !m.hidden)
    .sort((a, b) => a.at - b.at)
    .slice(-limit);
}

export function appendCommunityMessage(msg: CommunityMessage) {
  store.communityMessages.push(msg);
  const room = store.communityRooms.find((r) => r.id === msg.roomId);
  if (room) room.memberCount = room.memberCount; // no-op, kept for future activity tracking
  return msg;
}

/* ───────────── Onboarding → personalization ───────────── */

/**
 * Maps an onboarding "struggle" tag to life-skill categories that address it.
 * This is the brain behind "Because you said X, here's Y."
 */
export const STRUGGLE_TO_CATEGORIES: Record<string, LifeCategory[]> = {
  "finding-job":  ["job-readiness", "communication", "digital-basics"],
  "confidence":   ["mental-health", "communication", "job-readiness"],
  "communication":["communication", "mental-health"],
  "money":        ["financial-literacy", "job-readiness"],
  "focus":        ["mental-health"],
  "stress":       ["mental-health", "home-life"],
  "parenting":    ["home-life", "mental-health"],
  "first-job":    ["job-readiness", "communication"],
  "housing":      ["financial-literacy", "job-readiness"],
  "tech":         ["digital-basics", "tech"],
  "trade":        ["trades", "job-readiness"],
};

export const STRUGGLE_OPTIONS: Array<{ id: string; label: string }> = [
  { id: "finding-job",   label: "Finding a job" },
  { id: "confidence",    label: "Confidence / self-doubt" },
  { id: "communication", label: "Talking to people" },
  { id: "money",         label: "Money / budgeting" },
  { id: "focus",         label: "Focus / concentration" },
  { id: "stress",        label: "Stress / anxiety" },
  { id: "parenting",     label: "Parenting / home life" },
  { id: "first-job",     label: "Keeping my first job" },
  { id: "housing",       label: "Paying rent / housing" },
  { id: "tech",          label: "Using a computer / phone" },
  { id: "trade",         label: "Learning a trade" },
];

/**
 * Given a user's onboarding answers, return ranked tracks that match
 * their stated needs. Used by the learner dashboard "Because you said…" block.
 */
export function recommendTracksFor(user: User): Track[] {
  const ob = user.onboarding;
  if (!ob || (ob.struggles.length === 0 && ob.interests.length === 0)) return [];
  const catScore = new Map<LifeCategory, number>();
  for (const s of ob.struggles) {
    for (const c of STRUGGLE_TO_CATEGORIES[s] ?? []) {
      catScore.set(c, (catScore.get(c) ?? 0) + 2);
    }
  }
  for (const c of ob.interests) {
    catScore.set(c, (catScore.get(c) ?? 0) + 1);
  }
  const teen = user.role === "teen";
  return store.tracks
    .filter((t) => (teen ? t.youthFriendly : true))
    .map((t) => ({ t, score: catScore.get(t.category) ?? 0 }))
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 6)
    .map((r) => r.t);
}
