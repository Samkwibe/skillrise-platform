/** LMS / university-style course features — storage via DbAdapter + in-memory store. */

export type AssignmentAttachment = { id: string; title: string; url: string };

export type CourseAssignment = {
  id: string;
  trackSlug: string;
  createdBy: string;
  title: string;
  description: string;
  dueAt: number;
  pointsPossible: number;
  /** Plain text or simple markdown for rubric */
  rubric?: string;
  attachments: AssignmentAttachment[];
  createdAt: number;
  updatedAt: number;
  sortOrder: number;
  /** When set, link to course module in UI */
  moduleId?: string;
};

export type SubmissionStatus = "draft" | "submitted" | "graded" | "returned";

export type AssignmentSubmission = {
  id: string;
  assignmentId: string;
  trackSlug: string;
  userId: string;
  textBody: string;
  fileS3Keys: string[];
  status: SubmissionStatus;
  submittedAt: number;
  /** Denormalized from assignment at grade time */
  pointsPossible?: number;
  score?: number;
  feedback?: string;
  gradedAt?: number;
  gradedBy?: string;
};

export type CourseAnnouncement = {
  id: string;
  trackSlug: string;
  createdBy: string;
  title: string;
  body: string;
  /** When true, send SES email to all enrolled (best-effort) */
  sendEmail: boolean;
  pinned: boolean;
  createdAt: number;
  attachmentUrl?: string;
};

export type AnnouncementRead = {
  announcementId: string;
  userId: string;
  readAt: number;
};

export type CourseForumThread = {
  id: string;
  trackSlug: string;
  title: string;
  createdBy: string;
  createdAt: number;
  moduleId?: string;
  pinned: boolean;
  closed: boolean;
  /** If true, student must start a post before reading others' replies */
  requirePostFirst: boolean;
  /** Optional participation points for graded discussions */
  maxPoints?: number;
  /** Soft-delete; hidden from students */
  deletedAt?: number;
};

export type CourseForumPost = {
  id: string;
  threadId: string;
  trackSlug: string;
  userId: string;
  body: string;
  at: number;
  parentPostId?: string;
  /** Simple like count; likedBy for idempotent toggle */
  likedBy: string[];
};

export type DmThread = {
  id: string;
  trackSlug: string;
  teacherId: string;
  studentId: string;
  createdAt: number;
  lastMessageAt: number;
};

export type DmMessage = {
  id: string;
  threadId: string;
  senderId: string;
  body: string;
  at: number;
  readByRecipientAt?: number;
};

export type EnrollmentInvite = {
  id: string;
  token: string;
  trackSlug: string;
  createdBy: string;
  createdAt: number;
  /** Optional cap time */
  expiresAt?: number;
  requireApproval: boolean;
  sectionId?: string;
  useCount: number;
};

export type CourseSection = {
  id: string;
  trackSlug: string;
  label: string;
  createdBy: string;
  createdAt: number;
};

export type CourseGradebookOverride = {
  id: string;
  trackSlug: string;
  userId: string;
  /** 0–100 final course override; wins over calculated */
  finalPercentOverride?: number;
  note?: string;
  updatedAt: number;
  updatedBy: string;
};
