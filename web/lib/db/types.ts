import type {
  User,
  Session,
  Enrollment,
  Certificate,
  Job,
  Application,
  AssistantMessage,
} from "@/lib/store";

export type DbStoreKind = "memory" | "mongodb" | "dynamodb";

export type DbAdapter = {
  kind: DbStoreKind;
  ready: () => Promise<void>;

  // Users
  findUserById: (id: string) => Promise<User | null>;
  findUserByEmail: (email: string) => Promise<User | null>;
  findUserByGoogleSub: (googleSub: string) => Promise<User | null>;
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
};
