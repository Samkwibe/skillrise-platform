import type {
  User,
  Session,
  Enrollment,
  Certificate,
  Job,
  Application,
  AssistantMessage,
  Track,
} from "@/lib/store";
import type { Quiz, QuizAttempt } from "@/lib/quiz/types";
import type {
  CourseAssignment,
  AssignmentSubmission,
  CourseAnnouncement,
  CourseForumThread,
  CourseForumPost,
  DmThread,
  DmMessage,
  EnrollmentInvite,
  CourseSection,
  CourseGradebookOverride,
} from "@/lib/course/lms-types";
import type { CourseReviewRecord, CourseWishlistEntry } from "@/lib/course/discovery-types";
import type { FeedPost } from "@/lib/store";

export type DbStoreKind = "memory" | "mongodb" | "dynamodb";

export type DbAdapter = {
  kind: DbStoreKind;
  ready: () => Promise<void>;

  // Users
  findUserById: (id: string) => Promise<User | null>;
  findUserByEmail: (email: string) => Promise<User | null>;
  findUserByGoogleSub: (googleSub: string) => Promise<User | null>;
  findUserByGitHubId: (githubId: string) => Promise<User | null>;
  /** Another account that already verified this E.164 (excludeUserId to skip self). */
  findUserByVerifiedPhoneE164: (e164: string, excludeUserId: string) => Promise<User | null>;
  createUser: (u: User) => Promise<User>;
  updateUser: (id: string, patch: Partial<User>) => Promise<User | null>;

  // Sessions
  createSession: (s: Session) => Promise<Session>;
  getSession: (token: string) => Promise<Session | null>;
  listSessionsByUserId: (userId: string) => Promise<Session[]>;
  deleteSession: (token: string) => Promise<void>;
  /** Delete all sessions for a user, optionally keeping one token (e.g. current device). */
  deleteSessionsForUser: (userId: string, exceptToken?: string) => Promise<void>;

  // Enrollments
  listEnrollments: (userId: string) => Promise<Enrollment[]>;
  /** All learners enrolled in a track (teacher dashboards, at-risk). */
  listEnrollmentsByTrack: (trackSlug: string) => Promise<Enrollment[]>;
  getEnrollment: (userId: string, trackSlug: string) => Promise<Enrollment | null>;
  upsertEnrollment: (e: Enrollment) => Promise<Enrollment>;

  // Certificates
  listCertificates: (userId: string) => Promise<Certificate[]>;
  getCertificate: (id: string) => Promise<Certificate | null>;
  createCertificate: (c: Certificate) => Promise<Certificate>;

  // Jobs + applications
  listJobs: (filter?: { status?: Job["status"] }) => Promise<Job[]>;
  getJob: (id: string) => Promise<Job | null>;
  createJob: (j: Job) => Promise<Job>;
  listApplications: (filter: { userId?: string; jobId?: string }) => Promise<Application[]>;
  createApplication: (a: Application) => Promise<Application>;
  updateApplication: (id: string, patch: Partial<Application>) => Promise<Application | null>;

  // Assistant transcript
  appendAssistantMessage: (m: AssistantMessage) => Promise<AssistantMessage>;
  listAssistantMessages: (userId: string, limit?: number) => Promise<AssistantMessage[]>;

  /** Full course document (modules, materials, video refs). Used when DATA_STORE is MongoDB or DynamoDB. */
  getTrack: (slug: string) => Promise<Track | null>;
  listTracks: () => Promise<Track[]>;
  putTrack: (t: Track) => Promise<Track>;

  // Quizzes (SkillRise courses + external video)
  getQuiz: (id: string) => Promise<Quiz | null>;
  putQuiz: (q: Quiz) => Promise<Quiz>;
  deleteQuiz: (id: string) => Promise<void>;
  listQuizzesByCourseKey: (courseKey: string) => Promise<Quiz[]>;
  getQuizAttempt: (id: string) => Promise<QuizAttempt | null>;
  putQuizAttempt: (a: QuizAttempt) => Promise<QuizAttempt>;
  /** All attempts for this user on this quiz (any state), newest last. */
  listQuizAttemptsForUserQuiz: (userId: string, quizId: string) => Promise<QuizAttempt[]>;
  /** All quiz attempts for a learner (intervention / progress). */
  listQuizAttemptsByUserId: (userId: string) => Promise<QuizAttempt[]>;

  // LMS — assignments, announcements, forums, DM, invites, gradebook overrides
  listAssignmentsByTrack: (trackSlug: string) => Promise<CourseAssignment[]>;
  getAssignment: (id: string) => Promise<CourseAssignment | null>;
  putAssignment: (a: CourseAssignment) => Promise<CourseAssignment>;
  deleteAssignment: (id: string) => Promise<void>;

  getSubmission: (id: string) => Promise<AssignmentSubmission | null>;
  getSubmissionByUserAssignment: (userId: string, assignmentId: string) => Promise<AssignmentSubmission | null>;
  listSubmissionsByAssignment: (assignmentId: string) => Promise<AssignmentSubmission[]>;
  listSubmissionsByUserTrack: (userId: string, trackSlug: string) => Promise<AssignmentSubmission[]>;
  putSubmission: (s: AssignmentSubmission) => Promise<AssignmentSubmission>;

  listAnnouncementsByTrack: (trackSlug: string) => Promise<CourseAnnouncement[]>;
  getAnnouncement: (id: string) => Promise<CourseAnnouncement | null>;
  putAnnouncement: (a: CourseAnnouncement) => Promise<CourseAnnouncement>;
  isAnnouncementRead: (announcementId: string, userId: string) => Promise<boolean>;
  markAnnouncementRead: (announcementId: string, userId: string, readAt: number) => Promise<void>;

  listForumThreadsByTrack: (trackSlug: string) => Promise<CourseForumThread[]>;
  getForumThread: (id: string) => Promise<CourseForumThread | null>;
  putForumThread: (t: CourseForumThread) => Promise<CourseForumThread>;
  listForumPostsByThread: (threadId: string) => Promise<CourseForumPost[]>;
  putForumPost: (p: CourseForumPost) => Promise<CourseForumPost>;

  listDmThreadsForUser: (userId: string, trackSlug?: string) => Promise<DmThread[]>;
  getDmThread: (id: string) => Promise<DmThread | null>;
  getDmThreadByPair: (teacherId: string, studentId: string, trackSlug: string) => Promise<DmThread | null>;
  putDmThread: (t: DmThread) => Promise<DmThread>;
  listDmMessages: (threadId: string) => Promise<DmMessage[]>;
  putDmMessage: (m: DmMessage) => Promise<DmMessage>;

  listInvitesByTrack: (trackSlug: string) => Promise<EnrollmentInvite[]>;
  getInviteByToken: (token: string) => Promise<EnrollmentInvite | null>;
  putInvite: (i: EnrollmentInvite) => Promise<EnrollmentInvite>;
  incrementInviteUse: (id: string) => Promise<void>;

  listSectionsByTrack: (trackSlug: string) => Promise<CourseSection[]>;
  putSection: (s: CourseSection) => Promise<CourseSection>;

  getGradebookOverride: (trackSlug: string, userId: string) => Promise<CourseGradebookOverride | null>;
  putGradebookOverride: (o: CourseGradebookOverride) => Promise<CourseGradebookOverride>;

  listReviewsByTrack: (trackSlug: string) => Promise<CourseReviewRecord[]>;
  getReviewByUserTrack: (userId: string, trackSlug: string) => Promise<CourseReviewRecord | null>;
  putReview: (r: CourseReviewRecord) => Promise<CourseReviewRecord>;
  /** Returns true if the vote was recorded (false if user already voted). */
  addReviewHelpful: (reviewId: string, voterUserId: string) => Promise<boolean>;

  listWishlist: (userId: string) => Promise<CourseWishlistEntry[]>;
  isWishlisted: (userId: string, trackSlug: string) => Promise<boolean>;
  addWishlist: (userId: string, trackSlug: string) => Promise<void>;
  removeWishlist: (userId: string, trackSlug: string) => Promise<void>;

  /** SkillFeed posts (learner + teacher); merged with seed posts in `store.feed`. */
  listFeedPosts: () => Promise<FeedPost[]>;
  putFeedPost: (p: FeedPost) => Promise<FeedPost>;
};
