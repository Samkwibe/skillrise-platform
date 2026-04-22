// In-memory store for the full SkillRise platform demo.
// Replace each collection with a Postgres table (see TECHNICAL_REQUIREMENTS.md §6) before production.
// The store is persisted on `globalThis` so Next.js HMR does not wipe it between requests.

import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";

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
  provider: "coursera" | "openlibrary" | "mit" | "khan" | "youtube" | "simplilearn";
  title: string;
  url: string;
  imageUrl?: string;
  primaryVideoId?: string;
  progressPct: number;
  completed: boolean;
  notes: LearningHubNote[];
  updatedAt: number;
};

/** Saved free-course links from `/courses` search — not the same as SkillFeed saves. */
export type SavedExternalCourse = {
  id: string;
  provider: "coursera" | "openlibrary" | "mit" | "khan" | "youtube" | "simplilearn";
  title: string;
  url: string;
  imageUrl?: string;
  description?: string;
  progressPct: number;
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

export type Module = {
  id: string;
  title: string;
  duration: string; // e.g. "12 min"
  summary: string;
  transcript: string;
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
};

export type Enrollment = {
  id: string;
  userId: string;
  trackSlug: string;
  startedAt: number;
  completedModuleIds: string[];
  completedAt?: number;
  cohortId?: string;
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

  const users: User[] = [
    {
      id: "u_john",
      email: "john@skillrise.app",
      password: DEMO_PASSWORD_HASH,
      name: "John Martinez",
      role: "teacher",
      neighborhood: "Manchester, NH",
      bio: "Master Electrician. 22 years on the tools. I teach what I wish someone taught me.",
      credentials: "Master Electrician, NH License #E-12845",
      avatar: "JM|0e7a4e:1fc87e",
      createdAt: now - 420 * day,
      emailVerifiedAt: now - 400 * day,
    },
    {
      id: "u_maya",
      email: "maya@skillrise.app",
      password: DEMO_PASSWORD_HASH,
      name: "Maya Lawson",
      role: "teacher",
      neighborhood: "Manchester, NH",
      bio: "Financial coach. I help working families build real budgets.",
      credentials: "AFC® Accredited Financial Counselor",
      avatar: "ML|b45309:f59e0b",
      createdAt: now - 360 * day,
      emailVerifiedAt: now - 350 * day,
    },
    {
      id: "u_sarah",
      email: "sarah@skillrise.app",
      password: DEMO_PASSWORD_HASH,
      name: "Sarah Chen",
      role: "teacher",
      neighborhood: "Manchester, NH",
      bio: "Web developer, teen-track specialist. I make code feel doable.",
      credentials: "Senior FE Engineer, 9 yrs",
      avatar: "SC|6d28d9:9b6cf5",
      createdAt: now - 300 * day,
      emailVerifiedAt: now - 290 * day,
    },
    {
      id: "u_tanya",
      email: "tanya@skillrise.app",
      password: DEMO_PASSWORD_HASH,
      name: "Tanya Williams",
      role: "learner",
      neighborhood: "Manchester, NH",
      bio: "Retail → Apprentice Electrician. $14/hr → $27/hr in 6 weeks.",
      avatar: "TW|0e7a4e:1fc87e",
      createdAt: now - 140 * day,
      emailVerifiedAt: now - 130 * day,
    },
    {
      id: "u_sofia",
      email: "sofia@skillrise.app",
      password: DEMO_PASSWORD_HASH,
      name: "Sofia P.",
      role: "teen",
      age: 16,
      neighborhood: "Manchester, NH",
      bio: "Replaced TikTok with code. First freelance client at 16.",
      avatar: "SP|6d28d9:9b6cf5",
      createdAt: now - 90 * day,
      emailVerifiedAt: now - 80 * day,
    },
    {
      id: "u_rico",
      email: "rico@skillrise.app",
      password: DEMO_PASSWORD_HASH,
      name: "Rico James",
      role: "learner",
      neighborhood: "Manchester, NH",
      bio: "Single dad. Studied on phone at night. Caregiver hire in 4 weeks.",
      avatar: "RJ|1d4ed8:4a8ef5",
      createdAt: now - 200 * day,
      emailVerifiedAt: now - 190 * day,
    },
    {
      id: "u_apex",
      email: "hiring@apexelectric.com",
      password: DEMO_PASSWORD_HASH,
      name: "Apex Electric HR",
      role: "employer",
      company: "Apex Electric",
      neighborhood: "Manchester, NH",
      avatar: "AE|f59e0b:f5a623",
      createdAt: now - 250 * day,
      emailVerifiedAt: now - 240 * day,
    },
    {
      id: "u_citymed",
      email: "hr@citymed.org",
      password: DEMO_PASSWORD_HASH,
      name: "City Medical HR",
      role: "employer",
      company: "City Medical",
      neighborhood: "Manchester, NH",
      avatar: "CM|1d4ed8:4a8ef5",
      createdAt: now - 280 * day,
      emailVerifiedAt: now - 270 * day,
    },
    {
      id: "u_school",
      email: "careers@centralhs.edu",
      password: DEMO_PASSWORD_HASH,
      name: "Central HS Careers Office",
      role: "school",
      company: "Central High School",
      neighborhood: "Manchester, NH",
      avatar: "CH|6d28d9:9b6cf5",
      createdAt: now - 150 * day,
      emailVerifiedAt: now - 140 * day,
    },
    {
      id: "u_admin",
      email: "admin@skillrise.app",
      password: DEMO_PASSWORD_HASH,
      name: "Platform Admin",
      role: "admin",
      neighborhood: "Remote",
      avatar: "SR|0c6b44:1fc87e",
      createdAt: now - 500 * day,
      emailVerifiedAt: now - 490 * day,
    },
  ];

  const tracks: Track[] = [
    {
      slug: "electrical-basics",
      title: "Electrical Basics",
      category: "trades",
      tags: ["hands-on", "apprenticeship", "no-degree", "high-pay-quick"],
      jobPaths: ["Apprentice Electrician", "Residential Helper"],
      summary:
        "Residential wiring fundamentals, safety, and your first apprenticeship job. Taught by working electricians.",
      heroEmoji: "⚡",
      color: "245,166,35",
      weeks: 6,
      level: "Beginner",
      teacherId: "u_john",
      youthFriendly: false,
      hiringDemand: 5,
      averageWageUplift: "+$13/hr avg after hire",
      skills: ["Safety", "Panels", "Breakers", "Wiring", "Code reading", "Apprenticeship prep"],
      modules: [
        { id: "m1", title: "Tools, PPE & staying alive", duration: "12 min", summary: "The 9 safety rules every apprentice must know.", transcript: "Let's start with what keeps you breathing..." },
        { id: "m2", title: "Reading a residential panel", duration: "18 min", summary: "How a panel is organized, neutral vs ground, what each breaker feeds.", transcript: "Pop the cover..." },
        { id: "m3", title: "Testing a breaker safely", duration: "14 min", summary: "Multimeter basics and the sequence that never fails.", transcript: "Meter on volts AC..." },
        { id: "m4", title: "Rough-in: running wire in new framing", duration: "22 min", summary: "Staples, notching, fire-stop basics, box fill.", transcript: "Snap a line..." },
        { id: "m5", title: "Making connections the inspector passes", duration: "16 min", summary: "Wire nuts, Wagos, torque, stripping lengths.", transcript: "Wire nut or Wago..." },
        { id: "m6", title: "Getting the job: apprentice interviews", duration: "10 min", summary: "What shop owners actually ask, and how to answer.", transcript: "Show up with boots..." },
      ],
    },
    {
      slug: "first-budget",
      title: "Your First Real Budget",
      category: "financial-literacy",
      tags: ["money", "budget", "paycheck", "no-degree"],
      jobPaths: [],
      summary:
        "A working budget for people earning $15–25/hr. Zero theory. Worksheets you actually fill in.",
      heroEmoji: "💰",
      color: "245,166,35",
      weeks: 3,
      level: "Beginner",
      teacherId: "u_maya",
      youthFriendly: true,
      hiringDemand: 3,
      averageWageUplift: "Save $200–400/mo on average",
      skills: ["Budgeting", "Saving", "Debt", "Emergency fund"],
      modules: [
        { id: "m1", title: "What you actually earn", duration: "9 min", summary: "Take-home vs gross, taxes, paycheck math.", transcript: "Your net is what matters..." },
        { id: "m2", title: "What actually leaves your account", duration: "11 min", summary: "Fixed vs flexible, the sneaky subscriptions.", transcript: "Pull 60 days of statements..." },
        { id: "m3", title: "The envelope method — digital version", duration: "14 min", summary: "Buckets for rent, food, transport, fun.", transcript: "Ten minutes, once a week..." },
        { id: "m4", title: "Your first $500 emergency fund", duration: "8 min", summary: "Why $500 changes your life more than a raise.", transcript: "It is the difference..." },
        { id: "m5", title: "Debt: pay smallest first, always", duration: "10 min", summary: "The snowball method, and why it works.", transcript: "Smallest balance first..." },
      ],
    },
    {
      slug: "web-dev-starter",
      title: "Build Your First Website",
      category: "tech",
      tags: ["portfolio", "freelance", "beginner", "youth"],
      jobPaths: ["Freelance web builder", "Junior site maintainer"],
      summary: "HTML, CSS, and one published site. Designed for total beginners — especially teens.",
      heroEmoji: "💻",
      color: "155,108,245",
      weeks: 4,
      level: "Beginner",
      teacherId: "u_sarah",
      youthFriendly: true,
      hiringDemand: 4,
      averageWageUplift: "Freelance from week 4",
      skills: ["HTML", "CSS", "Publishing", "Freelance basics"],
      modules: [
        { id: "m1", title: "What a website actually is", duration: "7 min", summary: "Files, a browser, the internet — demystified.", transcript: "A website is just files..." },
        { id: "m2", title: "Your first HTML page", duration: "12 min", summary: "Headings, paragraphs, links, images.", transcript: "Open a text editor..." },
        { id: "m3", title: "Making it look good with CSS", duration: "15 min", summary: "Colors, spacing, fonts, one hero section.", transcript: "CSS is styling..." },
        { id: "m4", title: "Publishing for free", duration: "10 min", summary: "Netlify drop, custom domain tour.", transcript: "Drag a folder..." },
        { id: "m5", title: "Your first paid freelance site", duration: "13 min", summary: "Pitch a local business, scope it, price it.", transcript: "Walk into the pizza place..." },
      ],
    },
    {
      slug: "caregiver-entry",
      title: "Caregiver Entry Track",
      category: "care",
      tags: ["care", "no-degree", "high-demand", "overnight-ok"],
      jobPaths: ["Entry Caregiver", "Home Health Aide"],
      summary: "Four weeks to certified. A pipeline shops desperately need filled.",
      heroEmoji: "🏥",
      color: "74,142,245",
      weeks: 4,
      level: "Beginner",
      teacherId: "u_john",
      youthFriendly: false,
      hiringDemand: 5,
      averageWageUplift: "Avg $22/hr starting",
      skills: ["Hygiene", "Transfers", "Medication support", "Compassionate communication"],
      modules: [
        { id: "m1", title: "Dignity comes first", duration: "10 min", summary: "Principles that separate a good caregiver from a great one.", transcript: "Dignity is everything..." },
        { id: "m2", title: "Safe transfers", duration: "13 min", summary: "Bed → chair without hurting your back or theirs.", transcript: "Feet first, knees bent..." },
        { id: "m3", title: "Meds, hygiene, nutrition basics", duration: "16 min", summary: "What's in your scope, what isn't.", transcript: "Assist, do not administer..." },
        { id: "m4", title: "Documenting shifts like a pro", duration: "9 min", summary: "Notes that protect clients and you.", transcript: "Time, action, response..." },
      ],
    },
    {
      slug: "public-speaking-teens",
      title: "Speak so People Listen (Teens)",
      category: "communication",
      tags: ["teens", "confidence", "speaking"],
      jobPaths: ["College apps", "Group interviews"],
      summary: "Confidence, clarity, and a killer 3-minute talk. Age 13+.",
      heroEmoji: "🗣️",
      color: "74,142,245",
      weeks: 3,
      level: "Beginner",
      teacherId: "u_sarah",
      youthFriendly: true,
      hiringDemand: 2,
      averageWageUplift: "College app boost",
      skills: ["Clarity", "Storytelling", "Stage presence", "Q&A"],
      modules: [
        { id: "m1", title: "The 1-sentence promise", duration: "8 min", summary: "The single line every talk needs.", transcript: "If you only remember one thing..." },
        { id: "m2", title: "Story beats statistic", duration: "10 min", summary: "Open with a moment, not a number.", transcript: "Imagine a room..." },
        { id: "m3", title: "Breath, posture, eye-line", duration: "9 min", summary: "Three knobs that kill nerves.", transcript: "Feet hip-width..." },
        { id: "m4", title: "Record, review, retry", duration: "7 min", summary: "How to watch yourself without cringing.", transcript: "Phone on a book..." },
      ],
    },

    // ─────────── Life-skill expansion tracks (v2) ───────────
    // Built for people without a degree. No jargon. Every module is usable same day.

    {
      slug: "job-interview-basics",
      title: "Ace the interview (no experience needed)",
      category: "job-readiness",
      summary: "The 7 questions every interviewer asks. Real answers, practiced in the mirror.",
      heroEmoji: "💼",
      color: "31,200,126",
      weeks: 2,
      level: "Beginner",
      teacherId: "u_sarah",
      youthFriendly: true,
      hiringDemand: 5,
      averageWageUplift: "First callback inside 2 weeks",
      skills: ["Interviewing", "Self-advocacy", "Follow-up", "Handshake & eye contact"],
      tags: ["interview", "nervous", "confidence", "job-hunt", "no-degree"],
      jobPaths: ["Any entry role", "Retail", "Warehouse", "Caregiving"],
      modules: [
        { id: "m1", title: "How to answer 'Tell me about yourself'", duration: "5 min", summary: "The 30-second opener that actually works.", transcript: "Start with what you're doing now..." },
        { id: "m2", title: "The weakness trap", duration: "4 min", summary: "Stop saying 'I work too hard.'", transcript: "Name one real thing..." },
        { id: "m3", title: "Why you? (even without a degree)", duration: "6 min", summary: "Real life counts. Here's how to say it.", transcript: "Raising kids is management..." },
        { id: "m4", title: "Questions YOU should ask them", duration: "4 min", summary: "The one question that gets you hired.", transcript: "Ask what a great first 90 days looks like..." },
        { id: "m5", title: "The thank-you email that closes it", duration: "3 min", summary: "Send within 24 hours. Template included.", transcript: "Short, specific, hand-written feel..." },
      ],
    },
    {
      slug: "resume-without-degree",
      title: "Write a resume — even without a degree",
      category: "job-readiness",
      summary: "A one-page resume that gets read. Life experience counts. We'll prove it.",
      heroEmoji: "📄",
      color: "31,200,126",
      weeks: 1,
      level: "Beginner",
      teacherId: "u_sarah",
      youthFriendly: true,
      hiringDemand: 5,
      averageWageUplift: "3× more callbacks on average",
      skills: ["Writing", "Formatting", "Self-editing"],
      tags: ["resume", "no-degree", "job-hunt", "writing"],
      jobPaths: ["Any entry role"],
      modules: [
        { id: "m1", title: "Your first resume from zero", duration: "8 min", summary: "Header, one summary line, one skills line.", transcript: "Open a blank doc..." },
        { id: "m2", title: "Turning life into work experience", duration: "7 min", summary: "Caring for a parent IS leadership.", transcript: "Write action + result..." },
        { id: "m3", title: "Skills that don't need a diploma", duration: "6 min", summary: "Punctuality, teamwork, attention — how to show them.", transcript: "Name the moment you did it..." },
        { id: "m4", title: "Free templates that pass ATS", duration: "4 min", summary: "Three free, safe templates + what NOT to use.", transcript: "Plain fonts win..." },
      ],
    },
    {
      slug: "stress-and-focus",
      title: "Stress, focus, and calming your mind",
      category: "mental-health",
      summary: "Five small tools you can use on the bus, at work, or before you fall asleep.",
      heroEmoji: "🧠",
      color: "155,108,245",
      weeks: 2,
      level: "Beginner",
      teacherId: "u_maya",
      youthFriendly: true,
      hiringDemand: 0,
      averageWageUplift: "Sleep better. Think clearer.",
      skills: ["Breathing", "Grounding", "Reframing", "Sleep hygiene"],
      tags: ["stress", "anxiety", "focus", "confidence", "mental-health"],
      jobPaths: [],
      modules: [
        { id: "m1", title: "The 4-7-8 breath (2 minutes)", duration: "3 min", summary: "The fastest way to calm a racing mind.", transcript: "In four. Hold seven..." },
        { id: "m2", title: "Grounding when everything feels too much", duration: "4 min", summary: "5 things you see. 4 you hear. 3 you touch.", transcript: "Look down. Name five..." },
        { id: "m3", title: "Reframing a bad thought", duration: "5 min", summary: "A simple way to question your worst thoughts.", transcript: "Would you say that to a friend?" },
        { id: "m4", title: "A sleep routine that actually works", duration: "6 min", summary: "Phone, light, same time — three knobs.", transcript: "Phone leaves the bed..." },
        { id: "m5", title: "When to ask for help (and where, free)", duration: "4 min", summary: "The free hotlines and sliding-scale options.", transcript: "988 is free..." },
      ],
    },
    {
      slug: "everyday-communication",
      title: "Everyday communication (listen, email, resolve)",
      category: "communication",
      summary: "Listening like a human, writing emails that get replies, and handling a tough conversation.",
      heroEmoji: "🗣️",
      color: "74,142,245",
      weeks: 2,
      level: "Beginner",
      teacherId: "u_sarah",
      youthFriendly: true,
      hiringDemand: 4,
      averageWageUplift: "Promotion-readiness",
      skills: ["Listening", "Email", "Conflict resolution", "Clarifying questions"],
      tags: ["listening", "email", "conflict", "communication", "workplace"],
      jobPaths: [],
      modules: [
        { id: "m1", title: "Listen first, then reply", duration: "5 min", summary: "Repeat what you heard before answering.", transcript: "So what I hear you saying..." },
        { id: "m2", title: "The 3-line email", duration: "4 min", summary: "Subject, ask, thanks — a template that works.", transcript: "Subject = verb + result..." },
        { id: "m3", title: "Saying no without guilt", duration: "5 min", summary: "Short scripts for work, family, and strangers.", transcript: "Thanks for thinking of me..." },
        { id: "m4", title: "Handling a conflict calmly", duration: "6 min", summary: "The 'I felt X when Y' script.", transcript: "Not you made me..." },
      ],
    },
    {
      slug: "first-job-confidence",
      title: "Your first 90 days on any job",
      category: "job-readiness",
      summary: "Show up, ask the right questions, get a second check. A playbook for day-one nerves.",
      heroEmoji: "🪜",
      color: "31,200,126",
      weeks: 3,
      level: "Beginner",
      teacherId: "u_john",
      youthFriendly: false,
      hiringDemand: 4,
      averageWageUplift: "Keep the job past probation",
      skills: ["Workplace etiquette", "Timeliness", "Teamwork", "Asking for help"],
      tags: ["first-job", "workplace", "confidence", "keep-the-job"],
      jobPaths: [],
      modules: [
        { id: "m1", title: "What your boss actually cares about", duration: "5 min", summary: "Three things — everything else is noise.", transcript: "On time. Try. Tell the truth..." },
        { id: "m2", title: "Asking questions without looking dumb", duration: "4 min", summary: "The phrasing that makes asking easy.", transcript: "Can I walk through what I think you said..." },
        { id: "m3", title: "When you mess up, do this", duration: "5 min", summary: "Own it. Fix it. Move on. 3 sentences.", transcript: "I did X. It caused Y..." },
      ],
    },
    {
      slug: "plumbing-basics",
      title: "Plumbing for homeowners & helpers",
      category: "trades",
      summary: "Stop a leak. Clear a drain. Work safely. A first step toward a paid helper role.",
      heroEmoji: "🔧",
      color: "74,142,245",
      weeks: 3,
      level: "Beginner",
      teacherId: "u_john",
      youthFriendly: false,
      hiringDemand: 4,
      averageWageUplift: "Helper roles start $18–22/hr",
      skills: ["Shutoffs", "Fittings", "Drain snaking", "Leak diagnosis"],
      tags: ["hands-on", "trade", "no-degree"],
      jobPaths: ["Plumber's helper", "Maintenance assistant"],
      modules: [
        { id: "m1", title: "Shut it off — the house master valve", duration: "4 min", summary: "Before anything else, know where your shutoff is.", transcript: "Find the main..." },
        { id: "m2", title: "A running toilet, fixed in 10 minutes", duration: "8 min", summary: "Flapper, fill valve, chain — which one is it?", transcript: "Lift the lid..." },
        { id: "m3", title: "Clearing a drain without chemicals", duration: "7 min", summary: "Snake, plunger, and when to stop and call a pro.", transcript: "Hair is the usual culprit..." },
        { id: "m4", title: "Compression vs. sweat fittings", duration: "10 min", summary: "The safe beginner choice and when.", transcript: "No flame? Compression..." },
      ],
    },
    {
      slug: "warehouse-safety",
      title: "Warehouse safety & getting hired",
      category: "trades",
      summary: "OSHA basics, lifting, forklift awareness — and the interview that gets you on the floor.",
      heroEmoji: "📦",
      color: "245,166,35",
      weeks: 1,
      level: "Beginner",
      teacherId: "u_john",
      youthFriendly: false,
      hiringDemand: 5,
      averageWageUplift: "Many shops hire within 48 hours",
      skills: ["Safe lifting", "PPE", "Forklift awareness", "Team handoffs"],
      tags: ["warehouse", "no-degree", "hire-fast"],
      jobPaths: ["Warehouse associate", "Pick-pack", "Receiving"],
      modules: [
        { id: "m1", title: "The 5 rules that prevent 90% of injuries", duration: "5 min", summary: "Posture, pace, PPE, pathways, people.", transcript: "Bend the knees..." },
        { id: "m2", title: "Team lifting and pallet moves", duration: "5 min", summary: "Count, lift, pace.", transcript: "One, two, lift on three..." },
        { id: "m3", title: "How warehouse interviews work", duration: "4 min", summary: "They want reliable. Show it.", transcript: "Tell them you can start Monday..." },
      ],
    },
    {
      slug: "home-cooking-basics",
      title: "Cooking for one (or four) on $50 a week",
      category: "home-life",
      summary: "Five meals you can actually make, a shopping list that works, and zero waste.",
      heroEmoji: "🍳",
      color: "245,158,11",
      weeks: 2,
      level: "Beginner",
      teacherId: "u_maya",
      youthFriendly: true,
      hiringDemand: 0,
      averageWageUplift: "Eat well on ~$50/wk",
      skills: ["Meal planning", "Knife safety", "Batch cooking", "Substitutions"],
      tags: ["home", "cooking", "budget", "parenting"],
      jobPaths: [],
      modules: [
        { id: "m1", title: "The $50 shopping list", duration: "6 min", summary: "One cart. Five dinners. Here's how.", transcript: "Rice, beans, eggs, oil..." },
        { id: "m2", title: "Knife safety — your hand comes first", duration: "5 min", summary: "The claw grip and never cut toward yourself.", transcript: "Curl the fingers..." },
        { id: "m3", title: "One-pan rice and beans that slap", duration: "7 min", summary: "Twenty minutes, one pan, under $3 a serving.", transcript: "Onion first..." },
        { id: "m4", title: "Leftovers ≠ sad lunch", duration: "6 min", summary: "Reheat rules + one sauce that saves everything.", transcript: "Add acid..." },
      ],
    },
    {
      slug: "first-aid-home",
      title: "First aid at home (for parents & neighbors)",
      category: "home-life",
      summary: "What to do in the first 90 seconds — burns, cuts, choking, CPR basics.",
      heroEmoji: "🩹",
      color: "227,75,75",
      weeks: 1,
      level: "Beginner",
      teacherId: "u_john",
      youthFriendly: true,
      hiringDemand: 2,
      averageWageUplift: "Could save a life",
      skills: ["Bleeding control", "Choking response", "CPR basics", "Burn care"],
      tags: ["parenting", "emergency", "home"],
      jobPaths: [],
      modules: [
        { id: "m1", title: "Stop the bleed", duration: "4 min", summary: "Pressure, pressure, then pressure.", transcript: "Direct pressure first..." },
        { id: "m2", title: "Choking — adult and kid", duration: "5 min", summary: "Where to hit, how hard, how many times.", transcript: "Five back blows..." },
        { id: "m3", title: "CPR — the hands-only version", duration: "6 min", summary: "100 beats a minute. Staying Alive beat.", transcript: "Push hard and fast..." },
      ],
    },
    {
      slug: "digital-basics",
      title: "Digital basics — email, spreadsheets, safety",
      category: "digital-basics",
      summary: "Send an email, use a spreadsheet, stay safe online. For anyone new to tech.",
      heroEmoji: "💻",
      color: "74,142,245",
      weeks: 2,
      level: "Beginner",
      teacherId: "u_sarah",
      youthFriendly: true,
      hiringDemand: 4,
      averageWageUplift: "Qualifies you for office/admin roles",
      skills: ["Email", "Sheets", "Passwords", "Scam detection"],
      tags: ["computer", "email", "no-degree", "digital"],
      jobPaths: ["Admin assistant", "Data entry"],
      modules: [
        { id: "m1", title: "Your first professional email", duration: "5 min", summary: "firstname.lastname + the 3-line template.", transcript: "Keep it under 5 sentences..." },
        { id: "m2", title: "A spreadsheet that adds itself", duration: "8 min", summary: "Rows, columns, =SUM. That's it.", transcript: "Type equals..." },
        { id: "m3", title: "Spot a scam in 5 seconds", duration: "4 min", summary: "Urgency, bad URL, asks for money.", transcript: "Slow down. Verify..." },
        { id: "m4", title: "Password hygiene in real life", duration: "5 min", summary: "A manager, not your memory.", transcript: "One password app..." },
      ],
    },
  ];

  const enrollments: Enrollment[] = [
    { id: "e1", userId: "u_tanya", trackSlug: "electrical-basics", startedAt: now - 50 * day, completedModuleIds: ["m1", "m2", "m3", "m4", "m5", "m6"], completedAt: now - 10 * day, cohortId: "c1" },
    { id: "e2", userId: "u_rico", trackSlug: "caregiver-entry", startedAt: now - 35 * day, completedModuleIds: ["m1", "m2", "m3", "m4"], completedAt: now - 5 * day },
    { id: "e3", userId: "u_sofia", trackSlug: "web-dev-starter", startedAt: now - 22 * day, completedModuleIds: ["m1", "m2", "m3"] },
  ];

  const cohorts: Cohort[] = [
    { id: "c1", trackSlug: "electrical-basics", neighborhood: "Manchester, NH", startDate: now - 50 * day, members: ["u_tanya"] },
    { id: "c2", trackSlug: "web-dev-starter", neighborhood: "Manchester, NH", startDate: now - 22 * day, members: ["u_sofia"] },
  ];

  const cohortMessages: CohortMessage[] = [
    { id: "cm1", cohortId: "c1", userId: "u_john", text: "Welcome crew. Post your panel photos this week — we'll review on Friday live.", at: now - 49 * day },
    { id: "cm2", cohortId: "c1", userId: "u_tanya", text: "Made it through m3. Meter still intimidates me but feels less scary.", at: now - 30 * day },
    { id: "cm3", cohortId: "c2", userId: "u_sarah", text: "Remember: your first site does not have to be pretty. It has to be published.", at: now - 20 * day },
  ];

  // Educational-only feed. Every post declares a LifeCategory + takeaway.
  // If a post has no teachable idea, it does not belong here.
  const feed: FeedPost[] = [
    { id: "f1",  authorId: "u_john",  title: "How to test a circuit breaker safely",           description: "Step-by-step for beginners. Everything you need before touching a panel.", emoji: "⚡", duration: "3 min", likes: 847,  comments: [{ id: "fc1", userId: "u_tanya", text: "Watched this 4 times before my first day. Nailed it.", at: now - 6 * day }], youth: false, trackSlug: "electrical-basics",      category: "trades",             takeaway: "Meter on volts AC, then confirm dead before touching.",                     createdAt: now - 7 * day },
    { id: "f2",  authorId: "u_maya",  title: "Build your first real budget — for $15–25/hr",   description: "Not theory. A real budget that actually works for people starting out.",    emoji: "💰", duration: "5 min", likes: 2104, comments: [],                                                                                                                        youth: false, trackSlug: "first-budget",            category: "financial-literacy", takeaway: "Your take-home pay minus rent minus groceries = what you really have.",    createdAt: now - 5 * day },
    { id: "f3",  authorId: "u_sarah", title: "Build a website in 10 minutes — no experience",  description: "Perfect for high schoolers. Have something real to show colleges and employers.", emoji: "💻", duration: "4 min", likes: 1340, comments: [],                                                                                                                    youth: true,  trackSlug: "web-dev-starter",         category: "tech",               takeaway: "Your first site doesn't need to be pretty. It needs to be published.",      createdAt: now - 3 * day },
    { id: "f4",  authorId: "u_john",  title: "Wire nuts vs Wagos — the real answer",           description: "Inspector-passing connections and when to use which.",                      emoji: "🔌", duration: "4 min", likes: 602,  comments: [],                                                                                                                        youth: false, trackSlug: "electrical-basics",      category: "trades",             takeaway: "If you're new: Wago lever nuts are harder to mess up.",                     createdAt: now - 2 * day },
    { id: "f5",  authorId: "u_sarah", title: "The 3-second portfolio rule",                    description: "What colleges and clients look for in your first 3 seconds on a site.",   emoji: "🎨", duration: "3 min", likes: 481,  comments: [],                                                                                                                        youth: true,  trackSlug: "web-dev-starter",         category: "tech",               takeaway: "Name, one line about you, one thing you built. That's above-the-fold.",     createdAt: now - 1 * day },

    // ─── Life-skill feed posts (v2) ───
    { id: "f6",  authorId: "u_sarah", title: "How to answer 'Tell me about yourself'",          description: "The 30-second opener that actually works — no essays, no lies.",          emoji: "💼", duration: "3 min", likes: 1542, comments: [],                                                                                                                        youth: true,  trackSlug: "job-interview-basics",   category: "job-readiness",      takeaway: "Present, past, why-here — in that order, in under 30 seconds.",             createdAt: now - 12 * 60 * 60 * 1000 },
    { id: "f7",  authorId: "u_maya",  title: "The 4-7-8 breath — calm down in 90 seconds",      description: "Before a call, before a hard text, before you fall asleep.",              emoji: "🧠", duration: "2 min", likes: 892,  comments: [],                                                                                                                        youth: true,  trackSlug: "stress-and-focus",       category: "mental-health",      takeaway: "Inhale 4. Hold 7. Exhale 8. Three rounds beats most panic spikes.",         createdAt: now - 4 * 60 * 60 * 1000 },
    { id: "f8",  authorId: "u_sarah", title: "Turn life experience into resume bullets",        description: "Raised kids? Took care of a parent? Worked a register? It counts.",       emoji: "📄", duration: "4 min", likes: 1120, comments: [],                                                                                                                        youth: true,  trackSlug: "resume-without-degree",  category: "job-readiness",      takeaway: "Action verb + result + number. 'Coordinated 3 kids' schedules, on time.'",  createdAt: now - 18 * 60 * 60 * 1000 },
    { id: "f9",  authorId: "u_sarah", title: "The 3-line email that gets replies",              description: "Subject, ask, thanks. Stop overexplaining.",                               emoji: "✉️", duration: "2 min", likes: 734,  comments: [],                                                                                                                        youth: true,  trackSlug: "everyday-communication", category: "communication",      takeaway: "If it's longer than three lines, cut until it's not.",                      createdAt: now - 6 * 60 * 60 * 1000 },
    { id: "f10", authorId: "u_maya",  title: "Saying no without guilt — 4 scripts",             description: "For your boss, your family, and strangers on the phone.",                   emoji: "🗣️", duration: "3 min", likes: 611,  comments: [],                                                                                                                        youth: true,  trackSlug: "everyday-communication", category: "communication",      takeaway: "\"Thanks for thinking of me — I can't this time.\" That's enough.",          createdAt: now - 22 * 60 * 60 * 1000 },
    { id: "f11", authorId: "u_john",  title: "Stop a running toilet in 10 minutes",             description: "Flapper, fill valve, or chain. Which one is it? (Usually the flapper.)",  emoji: "🔧", duration: "4 min", likes: 556,  comments: [],                                                                                                                        youth: false, trackSlug: "plumbing-basics",        category: "trades",             takeaway: "Dye test tells you instantly which part is leaking.",                       createdAt: now - 2 * day },
    { id: "f12", authorId: "u_john",  title: "The $50 weekly shopping list",                    description: "Five dinners. Real food. No cans of mystery soup.",                       emoji: "🛒", duration: "5 min", likes: 984,  comments: [],                                                                                                                        youth: true,  trackSlug: "home-cooking-basics",    category: "home-life",          takeaway: "Rice + beans + eggs + a protein + produce = a working week.",               createdAt: now - 14 * 60 * 60 * 1000 },
    { id: "f13", authorId: "u_john",  title: "How to stop severe bleeding",                     description: "The first 90 seconds matter most. Pressure, pressure, pressure.",          emoji: "🩹", duration: "3 min", likes: 420,  comments: [],                                                                                                                        youth: true,  trackSlug: "first-aid-home",         category: "home-life",          takeaway: "Direct pressure with both hands. Don't peek. Call 911.",                    createdAt: now - 1.5 * day },
    { id: "f14", authorId: "u_sarah", title: "Spot a phishing scam in 5 seconds",               description: "Three signs, every time. Don't tap 'verify.'",                              emoji: "🛡️", duration: "3 min", likes: 702,  comments: [],                                                                                                                        youth: true,  trackSlug: "digital-basics",         category: "digital-basics",     takeaway: "Urgency + link + asks for money = delete it.",                              createdAt: now - 9 * 60 * 60 * 1000 },
    { id: "f15", authorId: "u_sarah", title: "The one interview question you should ask",       description: "It flips the conversation and makes you look sharp.",                      emoji: "❓", duration: "2 min", likes: 1198, comments: [],                                                                                                                        youth: true,  trackSlug: "job-interview-basics",   category: "job-readiness",      takeaway: "\"What does a great first 90 days look like in this role?\"",              createdAt: now - 3 * 60 * 60 * 1000 },
  ];

  const liveSessions: LiveSession[] = [
    { id: "l1", teacherId: "u_john", title: "Panel walkthrough — live Q&A", topic: "Electrical Basics", startsAt: now + 2 * day, durationMin: 45, attendees: ["u_tanya"], status: "scheduled", youth: false },
    { id: "l2", teacherId: "u_sarah", title: "Publish your site tonight", topic: "Web Dev Starter", startsAt: now + 1 * day, durationMin: 30, attendees: ["u_sofia"], status: "scheduled", youth: true },
    { id: "l3", teacherId: "u_maya", title: "Open office hours: budgets", topic: "First Budget", startsAt: now - 1 * day, durationMin: 60, attendees: [], status: "ended", youth: false },
  ];

  const certificates: Certificate[] = [
    { id: "cert_tanya_elec", userId: "u_tanya", trackSlug: "electrical-basics", issuedAt: now - 10 * day, score: 94, verifiable: true },
    { id: "cert_rico_care", userId: "u_rico", trackSlug: "caregiver-entry", issuedAt: now - 5 * day, score: 91, verifiable: true },
  ];

  const jobs: Job[] = [
    { id: "j1", employerId: "u_apex", company: "Apex Electric", title: "Apprentice Electrician", description: "Residential new-construction. Ride-along 3 weeks, then your own runs.", neighborhood: "Manchester, NH", wageFrom: 24, wageTo: 30, wageUnit: "hr", type: "Full time", requiredTrackSlug: "electrical-basics", postedAt: now - 12 * day, hireGuarantee: true, status: "open" },
    { id: "j2", employerId: "u_citymed", company: "City Medical", title: "Senior Caregiver — nights", description: "Supporting elderly clients at home. Paid training for Caregiver Entry grads.", neighborhood: "Manchester, NH", wageFrom: 21, wageTo: 25, wageUnit: "hr", type: "Full time", requiredTrackSlug: "caregiver-entry", postedAt: now - 6 * day, hireGuarantee: true, status: "open" },
    { id: "j3", employerId: "u_apex", company: "Apex Electric", title: "Journeyman Electrician", description: "License required. Crew lead path within 18 months.", neighborhood: "Manchester, NH", wageFrom: 34, wageTo: 42, wageUnit: "hr", type: "Full time", postedAt: now - 3 * day, hireGuarantee: false, status: "open" },
  ];

  const applications: Application[] = [
    { id: "a1", jobId: "j1", userId: "u_tanya", certificateIds: ["cert_tanya_elec"], note: "Ready to start Monday. Top marks on panel walkthrough.", appliedAt: now - 8 * day, status: "hired" },
    { id: "a2", jobId: "j2", userId: "u_rico", certificateIds: ["cert_rico_care"], note: "Available nights and weekends.", appliedAt: now - 4 * day, status: "interview" },
  ];

  const schoolClasses: SchoolClass[] = [
    { id: "sc1", schoolId: "u_school", name: "Career Lab — Period 4", trackSlug: "web-dev-starter", studentIds: ["u_sofia"] },
    { id: "sc2", schoolId: "u_school", name: "Life After HS — Period 6", trackSlug: "first-budget", studentIds: [] },
  ];

  const communityRooms: CommunityRoom[] = [
    { id: "r_welcome", slug: "welcome",               name: "Welcome — say hi",              description: "New here? Drop a hello. Tell us what brought you.",                 category: null,                  teenSafe: true,  kind: "public",       memberCount: 2184, createdAt: now - 60 * day },
    { id: "r_jobs",    slug: "job-hunt-support",      name: "Job hunt support",              description: "Interview prep, resume feedback, moral support. No judgment here.", category: "job-readiness",       teenSafe: true,  kind: "public",       memberCount: 1422, createdAt: now - 50 * day },
    { id: "r_mh",      slug: "calm-corner",           name: "Calm Corner",                   description: "Stress, focus, sleep, hard days. Kindness required.",               category: "mental-health",       teenSafe: true,  kind: "public",       memberCount: 967,  createdAt: now - 44 * day },
    { id: "r_money",   slug: "money-talk",            name: "Money Talk",                    description: "Budgeting wins, taxes questions, saving tactics for real incomes.", category: "financial-literacy",  teenSafe: false, kind: "public",       memberCount: 822,  createdAt: now - 40 * day },
    { id: "r_comm",    slug: "communication-circle",  name: "Communication Circle",          description: "Practice hard conversations in a safe space.",                     category: "communication",       teenSafe: true,  kind: "public",       memberCount: 610,  createdAt: now - 30 * day },
    { id: "r_trades",  slug: "trades-floor",          name: "Trades Floor",                  description: "Plumbers, electricians, warehouse crew — trading tips and callouts.", category: "trades",             teenSafe: false, kind: "public",       memberCount: 518,  createdAt: now - 25 * day },
    { id: "r_home",    slug: "home-and-parenting",    name: "Home & Parenting",              description: "Meals on a budget, kid stuff, time management.",                   category: "home-life",           teenSafe: true,  kind: "public",       memberCount: 704,  createdAt: now - 22 * day },
    { id: "r_sarah",   slug: "office-hours-sarah",    name: "Office Hours with Sarah (Web)", description: "Weekly help for Build Your First Website. Drop questions anytime.", category: "tech",                teenSafe: true,  kind: "office-hours", hostUserId: "u_sarah", trackSlug: "web-dev-starter",  memberCount: 188, createdAt: now - 18 * day },
    { id: "r_maya",    slug: "office-hours-maya",     name: "Office Hours with Maya (Money)",description: "Budget reviews and tax-season questions, no shame allowed.",      category: "financial-literacy",  teenSafe: false, kind: "office-hours", hostUserId: "u_maya",  trackSlug: "first-budget",     memberCount: 142, createdAt: now - 15 * day },
    { id: "r_teen",    slug: "teen-study-hall",       name: "Teen Study Hall",               description: "Moderated. Teens helping teens with school and skills.",           category: null,                  teenSafe: true,  kind: "teen-safe",    memberCount: 1050, createdAt: now - 35 * day },
  ];

  const communityMessages: CommunityMessage[] = [
    { id: "cmm1",  roomId: "r_welcome", userId: "u_tanya", text: "First day on the job today. Terrified. Thanks y'all.", at: now - 3 * day },
    { id: "cmm2",  roomId: "r_welcome", userId: "u_rico",  text: "You got this. Show up on time and the rest figures itself out.", at: now - 3 * day + 10 * 60 * 1000 },
    { id: "cmm3",  roomId: "r_welcome", userId: "u_maya",  text: "Welcome Tanya. Post how it went later!", at: now - 3 * day + 20 * 60 * 1000 },
    { id: "cmm4",  roomId: "r_jobs",    userId: "u_rico",  text: "How do you answer 'Why did you leave your last job?' when it was complicated?", at: now - 2 * day },
    { id: "cmm5",  roomId: "r_jobs",    userId: "u_sarah", text: "Short, neutral, forward. \"I was looking for more growth\" — and leave it there.", at: now - 2 * day + 30 * 60 * 1000 },
    { id: "cmm6",  roomId: "r_mh",      userId: "u_maya",  text: "Try the 4-7-8 breath before the interview. 3 rounds. You'll feel it.", at: now - 1 * day },
    { id: "cmm7",  roomId: "r_mh",      userId: "u_sofia", text: "Did this before my speech yesterday. It worked.", at: now - 22 * 60 * 60 * 1000 },
    { id: "cmm8",  roomId: "r_money",   userId: "u_rico",  text: "First $500 emergency fund hit this week. First time ever. Quiet win.", at: now - 1.2 * day },
    { id: "cmm9",  roomId: "r_money",   userId: "u_maya",  text: "Huge. That's the hardest $500.", at: now - 1.1 * day },
    { id: "cmm10", roomId: "r_trades",  userId: "u_john",  text: "If your panel door is hot, do not open it. Call 911. Rare but real.", at: now - 4 * day },
    { id: "cmm11", roomId: "r_home",    userId: "u_tanya", text: "Anyone have a fast dinner for 2 kids that isn't pasta again?", at: now - 16 * 60 * 60 * 1000 },
    { id: "cmm12", roomId: "r_home",    userId: "u_john",  text: "Rice + frozen peas + eggs + soy sauce. 10 min. They'll eat it.", at: now - 15 * 60 * 60 * 1000 },
    { id: "cmm13", roomId: "r_sarah",   userId: "u_sofia", text: "My CSS is broken, flexbox is ignoring me. Help?", at: now - 3 * 60 * 60 * 1000 },
    { id: "cmm14", roomId: "r_sarah",   userId: "u_sarah", text: "Post a screenshot, I'll walk through it in the next live.", at: now - 2 * 60 * 60 * 1000 },
    { id: "cmm15", roomId: "r_teen",    userId: "u_sofia", text: "Anyone here also applying to programs without loans? I'm nervous.", at: now - 2 * day },
    { id: "cmm16", roomId: "r_teen",    userId: "u_tanya", text: "SkillRise certs count. Tell them what you built, not what you didn't.", at: now - 1.9 * day },
  ];

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
