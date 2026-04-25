import { MongoClient, type Db, type Collection, type Document, type UpdateFilter } from "mongodb";
import type { DbAdapter } from "./types";
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

type Collections = {
  users: Collection<User>;
  sessions: Collection<Session>;
  enrollments: Collection<Enrollment>;
  certificates: Collection<Certificate>;
  jobs: Collection<Job>;
  applications: Collection<Application>;
  assistantMessages: Collection<AssistantMessage>;
  quizzes: Collection<Quiz>;
  quizAttempts: Collection<QuizAttempt>;
  tracks: Collection<Track>;
  courseAssignments: Collection<CourseAssignment>;
  assignmentSubmissions: Collection<AssignmentSubmission>;
  courseAnnouncements: Collection<CourseAnnouncement>;
  announcementReads: Collection<{ announcementId: string; userId: string; readAt: number; id: string }>;
  courseForumThreads: Collection<CourseForumThread>;
  courseForumPosts: Collection<CourseForumPost>;
  dmThreads: Collection<DmThread>;
  dmMessages: Collection<DmMessage>;
  enrollmentInvites: Collection<EnrollmentInvite>;
  courseSections: Collection<CourseSection>;
  courseGradebookOverrides: Collection<CourseGradebookOverride>;
  courseReviews: Collection<CourseReviewRecord>;
  courseWishlist: Collection<CourseWishlistEntry>;
  feedPosts: Collection<FeedPost>;
};

declare global {
  // eslint-disable-next-line no-var
  var __skillrise_mongo__:
    | { client: MongoClient; db: Db; cols: Collections; ready: Promise<void> }
    | undefined;
}

async function getConnection() {
  if (globalThis.__skillrise_mongo__) return globalThis.__skillrise_mongo__;

  const uri = process.env.MONGODB_URI;
  const dbName = process.env.MONGODB_DB || "skillrise";
  if (!uri) throw new Error("MONGODB_URI is required for the MongoDB adapter");

  const client = new MongoClient(uri, {
    retryWrites: true,
    maxPoolSize: 20,
    serverSelectionTimeoutMS: 5000,
  });

  const ready = (async () => {
    await client.connect();
    const db = client.db(dbName);
      await Promise.all([
        db.collection("users").createIndex({ email: 1 }, { unique: true }),
        db.collection("users").createIndex({ id: 1 }, { unique: true }),
        db.collection("users").createIndex({ googleSub: 1 }, { unique: true, sparse: true }),
      db.collection("sessions").createIndex({ token: 1 }, { unique: true }),
      db.collection("sessions").createIndex({ userId: 1 }),
      db.collection("sessions").createIndex({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 30 }),
      db.collection("enrollments").createIndex({ userId: 1, trackSlug: 1 }, { unique: true }),
      db.collection("enrollments").createIndex({ trackSlug: 1 }),
      db.collection("certificates").createIndex({ userId: 1 }),
      db.collection("certificates").createIndex({ id: 1 }, { unique: true }),
      db.collection("jobs").createIndex({ status: 1, postedAt: -1 }),
      db.collection("applications").createIndex({ jobId: 1 }),
      db.collection("applications").createIndex({ userId: 1 }),
      db.collection("assistantMessages").createIndex({ userId: 1, at: -1 }),
      db.collection("quizzes").createIndex({ id: 1 }, { unique: true }),
      db.collection("quizzes").createIndex({ courseKey: 1 }),
      db.collection("quizAttempts").createIndex({ id: 1 }, { unique: true }),
      db.collection("quizAttempts").createIndex({ userId: 1, quizId: 1 }),
      db.collection("quizAttempts").createIndex({ userId: 1 }),
      db.collection("tracks").createIndex({ slug: 1 }, { unique: true }),
      db.collection("courseAssignments").createIndex({ id: 1 }, { unique: true }),
      db.collection("courseAssignments").createIndex({ trackSlug: 1 }),
      db.collection("assignmentSubmissions").createIndex({ id: 1 }, { unique: true }),
      db.collection("assignmentSubmissions").createIndex({ assignmentId: 1, userId: 1 }, { unique: true }),
      db.collection("assignmentSubmissions").createIndex({ userId: 1, trackSlug: 1 }),
      db.collection("courseAnnouncements").createIndex({ id: 1 }, { unique: true }),
      db.collection("courseAnnouncements").createIndex({ trackSlug: 1 }),
      db.collection("announcementReads").createIndex({ id: 1 }, { unique: true }),
      db.collection("announcementReads").createIndex({ announcementId: 1, userId: 1 }, { unique: true }),
      db.collection("courseForumThreads").createIndex({ id: 1 }, { unique: true }),
      db.collection("courseForumThreads").createIndex({ trackSlug: 1 }),
      db.collection("courseForumPosts").createIndex({ id: 1 }, { unique: true }),
      db.collection("courseForumPosts").createIndex({ threadId: 1 }),
      db.collection("dmThreads").createIndex({ id: 1 }, { unique: true }),
      db.collection("dmThreads").createIndex({ teacherId: 1, studentId: 1, trackSlug: 1 }, { unique: true }),
      db.collection("dmMessages").createIndex({ id: 1 }, { unique: true }),
      db.collection("dmMessages").createIndex({ threadId: 1 }),
      db.collection("enrollmentInvites").createIndex({ id: 1 }, { unique: true }),
      db.collection("enrollmentInvites").createIndex({ token: 1 }, { unique: true }),
      db.collection("enrollmentInvites").createIndex({ trackSlug: 1 }),
      db.collection("courseSections").createIndex({ id: 1 }, { unique: true }),
      db.collection("courseSections").createIndex({ trackSlug: 1 }),
      db.collection("courseGradebookOverrides").createIndex({ id: 1 }, { unique: true }),
      db.collection("courseGradebookOverrides").createIndex({ trackSlug: 1, userId: 1 }, { unique: true }),
      db.collection("courseReviews").createIndex({ id: 1 }, { unique: true }),
      db.collection("courseReviews").createIndex({ trackSlug: 1 }),
      db.collection("courseReviews").createIndex({ userId: 1, trackSlug: 1 }, { unique: true }),
      db.collection("courseWishlist").createIndex({ userId: 1, trackSlug: 1 }, { unique: true }),
      db.collection("courseWishlist").createIndex({ userId: 1 }),
      db.collection("feedPosts").createIndex({ id: 1 }, { unique: true }),
      db.collection("feedPosts").createIndex({ createdAt: -1 }),
    ]);
  })();

  const db = client.db(dbName);
  const cols: Collections = {
    users: db.collection<User>("users"),
    sessions: db.collection<Session>("sessions"),
    enrollments: db.collection<Enrollment>("enrollments"),
    certificates: db.collection<Certificate>("certificates"),
    jobs: db.collection<Job>("jobs"),
    applications: db.collection<Application>("applications"),
    assistantMessages: db.collection<AssistantMessage>("assistantMessages"),
    quizzes: db.collection<Quiz>("quizzes"),
    quizAttempts: db.collection<QuizAttempt>("quizAttempts"),
    tracks: db.collection<Track>("tracks"),
    courseAssignments: db.collection<CourseAssignment>("courseAssignments"),
    assignmentSubmissions: db.collection<AssignmentSubmission>("assignmentSubmissions"),
    courseAnnouncements: db.collection<CourseAnnouncement>("courseAnnouncements"),
    announcementReads: db.collection("announcementReads"),
    courseForumThreads: db.collection<CourseForumThread>("courseForumThreads"),
    courseForumPosts: db.collection<CourseForumPost>("courseForumPosts"),
    dmThreads: db.collection<DmThread>("dmThreads"),
    dmMessages: db.collection<DmMessage>("dmMessages"),
    enrollmentInvites: db.collection<EnrollmentInvite>("enrollmentInvites"),
    courseSections: db.collection<CourseSection>("courseSections"),
    courseGradebookOverrides: db.collection<CourseGradebookOverride>("courseGradebookOverrides"),
    courseReviews: db.collection<CourseReviewRecord>("courseReviews"),
    courseWishlist: db.collection<CourseWishlistEntry>("courseWishlist"),
    feedPosts: db.collection<FeedPost>("feedPosts"),
  };
  globalThis.__skillrise_mongo__ = { client, db, cols, ready };
  return globalThis.__skillrise_mongo__;
}

function strip<T extends Document>(doc: T | null): T | null {
  if (!doc) return null;
  const { _id, ...rest } = doc as T & { _id?: unknown };
  return rest as T;
}

export function createMongoAdapter(): DbAdapter {
  return {
    kind: "mongodb",
    async ready() {
      const { ready } = await getConnection();
      await ready;
    },

    async findUserById(id) {
      const { cols } = await getConnection();
      return strip(await cols.users.findOne({ id }));
    },
    async findUserByEmail(email) {
      const { cols } = await getConnection();
      return strip(await cols.users.findOne({ email: email.toLowerCase() }));
    },
    async findUserByGoogleSub(googleSub) {
      const { cols } = await getConnection();
      return strip(await cols.users.findOne({ googleSub }));
    },
    async findUserByVerifiedPhoneE164(e164, excludeUserId) {
      const { cols } = await getConnection();
      return strip(
        await cols.users.findOne({
          phoneE164: e164,
          phoneVerifiedAt: { $gt: 0 },
          id: { $ne: excludeUserId },
        }),
      );
    },
    async createUser(u) {
      const { cols } = await getConnection();
      await cols.users.insertOne({ ...u });
      return u;
    },
    async updateUser(id, patch) {
      const { cols } = await getConnection();
      const $set: Record<string, unknown> = {};
      const $unset: Record<string, true> = {};
      for (const [k, v] of Object.entries(patch)) {
        if (v === undefined) $unset[k] = true;
        else $set[k] = v;
      }
      const update: UpdateFilter<User> = {};
      if (Object.keys($set).length) update.$set = $set as UpdateFilter<User>["$set"];
      if (Object.keys($unset).length) update.$unset = $unset as UpdateFilter<User>["$unset"];
      if (!update.$set && !update.$unset) {
        return strip(await cols.users.findOne({ id }));
      }
      const res = await cols.users.findOneAndUpdate({ id }, update, { returnDocument: "after" });
      return strip(res);
    },

    async createSession(s) {
      const { cols } = await getConnection();
      await cols.sessions.insertOne({ ...s });
      return s;
    },
    async getSession(token) {
      const { cols } = await getConnection();
      return strip(await cols.sessions.findOne({ token }));
    },
    async listSessionsByUserId(userId) {
      const { cols } = await getConnection();
      const arr = await cols.sessions.find({ userId }).sort({ createdAt: -1 }).toArray();
      return arr.map((a) => strip(a)!) as Session[];
    },
    async deleteSession(token) {
      const { cols } = await getConnection();
      await cols.sessions.deleteOne({ token });
    },
    async deleteSessionsForUser(userId, exceptToken) {
      const { cols } = await getConnection();
      const q =
        exceptToken === undefined
          ? { userId }
          : { userId, token: { $ne: exceptToken } };
      await cols.sessions.deleteMany(q);
    },

    async listEnrollments(userId) {
      const { cols } = await getConnection();
      const arr = await cols.enrollments.find({ userId }).toArray();
      return arr.map((a) => strip(a)!) as Enrollment[];
    },
    async listEnrollmentsByTrack(trackSlug) {
      const { cols } = await getConnection();
      const arr = await cols.enrollments.find({ trackSlug }).toArray();
      return arr.map((a) => strip(a)!) as Enrollment[];
    },
    async getEnrollment(userId, trackSlug) {
      const { cols } = await getConnection();
      return strip(await cols.enrollments.findOne({ userId, trackSlug }));
    },
    async upsertEnrollment(e) {
      const { cols } = await getConnection();
      await cols.enrollments.updateOne(
        { userId: e.userId, trackSlug: e.trackSlug },
        { $set: e },
        { upsert: true },
      );
      return e;
    },

    async listCertificates(userId) {
      const { cols } = await getConnection();
      const arr = await cols.certificates.find({ userId }).toArray();
      return arr.map((a) => strip(a)!) as Certificate[];
    },
    async getCertificate(id) {
      const { cols } = await getConnection();
      return strip(await cols.certificates.findOne({ id }));
    },
    async createCertificate(c) {
      const { cols } = await getConnection();
      await cols.certificates.insertOne({ ...c });
      return c;
    },

    async listJobs(filter) {
      const { cols } = await getConnection();
      const q = filter?.status ? { status: filter.status } : {};
      const arr = await cols.jobs.find(q).sort({ postedAt: -1 }).toArray();
      return arr.map((a) => strip(a)!) as Job[];
    },
    async getJob(id) {
      const { cols } = await getConnection();
      return strip(await cols.jobs.findOne({ id }));
    },
    async createJob(j) {
      const { cols } = await getConnection();
      await cols.jobs.insertOne({ ...j });
      return j;
    },
    async listApplications(filter) {
      const { cols } = await getConnection();
      const arr = await cols.applications.find(filter).toArray();
      return arr.map((a) => strip(a)!) as Application[];
    },
    async createApplication(a) {
      const { cols } = await getConnection();
      await cols.applications.insertOne({ ...a });
      return a;
    },
    async updateApplication(id, patch) {
      const { cols } = await getConnection();
      const res = await cols.applications.findOneAndUpdate(
        { id },
        { $set: patch },
        { returnDocument: "after" },
      );
      return strip(res);
    },

    async appendAssistantMessage(m) {
      const { cols } = await getConnection();
      await cols.assistantMessages.insertOne({ ...m });
      return m;
    },
    async listAssistantMessages(userId, limit = 40) {
      const { cols } = await getConnection();
      const arr = await cols.assistantMessages
        .find({ userId })
        .sort({ at: -1 })
        .limit(limit)
        .toArray();
      return arr.reverse().map((a) => strip(a)!) as AssistantMessage[];
    },

    async getTrack(slug) {
      const { cols } = await getConnection();
      return strip(await cols.tracks.findOne({ slug })) as Track | null;
    },
    async listTracks() {
      const { cols } = await getConnection();
      const arr = await cols.tracks.find({}).toArray();
      return arr.map((a) => strip(a)!) as Track[];
    },
    async putTrack(t) {
      const { cols } = await getConnection();
      await cols.tracks.replaceOne({ slug: t.slug }, { ...t } as Track, { upsert: true });
      return t;
    },

    async listAssignmentsByTrack(slug) {
      const { cols } = await getConnection();
      const arr = await cols.courseAssignments.find({ trackSlug: slug }).sort({ sortOrder: 1 }).toArray();
      return arr.map((a) => strip(a)!) as CourseAssignment[];
    },
    async getAssignment(id) {
      const { cols } = await getConnection();
      return strip(await cols.courseAssignments.findOne({ id })) as CourseAssignment | null;
    },
    async putAssignment(a) {
      const { cols } = await getConnection();
      const setDoc = { ...a } as Record<string, unknown>;
      for (const k of Object.keys(setDoc)) {
        if (setDoc[k] === undefined) delete setDoc[k];
      }
      await cols.courseAssignments.updateOne({ id: a.id }, { $set: setDoc }, { upsert: true });
      return a;
    },
    async deleteAssignment(id) {
      const { cols } = await getConnection();
      await cols.courseAssignments.deleteOne({ id });
    },
    async getSubmission(id) {
      const { cols } = await getConnection();
      return strip(await cols.assignmentSubmissions.findOne({ id })) as AssignmentSubmission | null;
    },
    async getSubmissionByUserAssignment(userId, assignmentId) {
      const { cols } = await getConnection();
      return strip(
        await cols.assignmentSubmissions.findOne({ userId, assignmentId }),
      ) as AssignmentSubmission | null;
    },
    async listSubmissionsByAssignment(assignmentId) {
      const { cols } = await getConnection();
      const arr = await cols.assignmentSubmissions.find({ assignmentId }).toArray();
      return arr.map((a) => strip(a)!) as AssignmentSubmission[];
    },
    async listSubmissionsByUserTrack(userId, trackSlug) {
      const { cols } = await getConnection();
      const arr = await cols.assignmentSubmissions.find({ userId, trackSlug }).toArray();
      return arr.map((a) => strip(a)!) as AssignmentSubmission[];
    },
    async putSubmission(s) {
      const { cols } = await getConnection();
      await cols.assignmentSubmissions.updateOne({ id: s.id }, { $set: s }, { upsert: true });
      return s;
    },
    async listAnnouncementsByTrack(slug) {
      const { cols } = await getConnection();
      const arr = await cols.courseAnnouncements.find({ trackSlug: slug }).sort({ createdAt: -1 }).toArray();
      return arr.map((a) => strip(a)!) as CourseAnnouncement[];
    },
    async getAnnouncement(id) {
      const { cols } = await getConnection();
      return strip(await cols.courseAnnouncements.findOne({ id })) as CourseAnnouncement | null;
    },
    async putAnnouncement(a) {
      const { cols } = await getConnection();
      await cols.courseAnnouncements.updateOne({ id: a.id }, { $set: a }, { upsert: true });
      return a;
    },
    async isAnnouncementRead(announcementId, userId) {
      const { cols } = await getConnection();
      return Boolean(await cols.announcementReads.findOne({ announcementId, userId }));
    },
    async markAnnouncementRead(announcementId, userId, readAt) {
      const { cols } = await getConnection();
      const id = `ar_${announcementId}_${userId}`.replace(/[^a-zA-Z0-9_]/g, "_");
      await cols.announcementReads.updateOne(
        { announcementId, userId },
        { $set: { id, announcementId, userId, readAt } },
        { upsert: true },
      );
    },
    async listForumThreadsByTrack(slug) {
      const { cols } = await getConnection();
      const arr = await cols.courseForumThreads.find({ trackSlug: slug }).sort({ createdAt: -1 }).toArray();
      return arr.map((a) => strip(a)!) as CourseForumThread[];
    },
    async getForumThread(id) {
      const { cols } = await getConnection();
      return strip(await cols.courseForumThreads.findOne({ id })) as CourseForumThread | null;
    },
    async putForumThread(t) {
      const { cols } = await getConnection();
      await cols.courseForumThreads.updateOne({ id: t.id }, { $set: t }, { upsert: true });
      return t;
    },
    async listForumPostsByThread(threadId) {
      const { cols } = await getConnection();
      const arr = await cols.courseForumPosts.find({ threadId }).sort({ at: 1 }).toArray();
      return arr.map((a) => strip(a)!) as CourseForumPost[];
    },
    async putForumPost(p) {
      const { cols } = await getConnection();
      await cols.courseForumPosts.updateOne({ id: p.id }, { $set: p }, { upsert: true });
      return p;
    },
    async listDmThreadsForUser(userId, trackSlug) {
      const { cols } = await getConnection();
      const q = trackSlug
        ? {
            $or: [
              { teacherId: userId, trackSlug },
              { studentId: userId, trackSlug },
            ],
          }
        : { $or: [{ teacherId: userId }, { studentId: userId }] };
      const arr = await cols.dmThreads.find(q).sort({ lastMessageAt: -1 }).toArray();
      return arr.map((a) => strip(a)!) as DmThread[];
    },
    async getDmThread(id) {
      const { cols } = await getConnection();
      return strip(await cols.dmThreads.findOne({ id })) as DmThread | null;
    },
    async getDmThreadByPair(teacherId, studentId, trackSlug) {
      const { cols } = await getConnection();
      return strip(
        await cols.dmThreads.findOne({ teacherId, studentId, trackSlug }),
      ) as DmThread | null;
    },
    async putDmThread(t) {
      const { cols } = await getConnection();
      await cols.dmThreads.updateOne({ id: t.id }, { $set: t }, { upsert: true });
      return t;
    },
    async listDmMessages(threadId) {
      const { cols } = await getConnection();
      const arr = await cols.dmMessages.find({ threadId }).sort({ at: 1 }).toArray();
      return arr.map((a) => strip(a)!) as DmMessage[];
    },
    async putDmMessage(m) {
      const { cols } = await getConnection();
      await cols.dmMessages.updateOne({ id: m.id }, { $set: m }, { upsert: true });
      if (m.threadId) {
        await cols.dmThreads.updateOne({ id: m.threadId }, { $set: { lastMessageAt: m.at } });
      }
      return m;
    },
    async listInvitesByTrack(slug) {
      const { cols } = await getConnection();
      const arr = await cols.enrollmentInvites.find({ trackSlug: slug }).toArray();
      return arr.map((a) => strip(a)!) as EnrollmentInvite[];
    },
    async getInviteByToken(token) {
      const { cols } = await getConnection();
      return strip(await cols.enrollmentInvites.findOne({ token })) as EnrollmentInvite | null;
    },
    async putInvite(i) {
      const { cols } = await getConnection();
      await cols.enrollmentInvites.updateOne({ id: i.id }, { $set: i }, { upsert: true });
      return i;
    },
    async incrementInviteUse(id) {
      const { cols } = await getConnection();
      await cols.enrollmentInvites.updateOne({ id }, { $inc: { useCount: 1 } });
    },
    async listSectionsByTrack(slug) {
      const { cols } = await getConnection();
      const arr = await cols.courseSections.find({ trackSlug: slug }).toArray();
      return arr.map((a) => strip(a)!) as CourseSection[];
    },
    async putSection(s) {
      const { cols } = await getConnection();
      await cols.courseSections.updateOne({ id: s.id }, { $set: s }, { upsert: true });
      return s;
    },
    async getGradebookOverride(trackSlug, userId) {
      const { cols } = await getConnection();
      return strip(
        await cols.courseGradebookOverrides.findOne({ trackSlug, userId }),
      ) as CourseGradebookOverride | null;
    },
    async putGradebookOverride(o) {
      const { cols } = await getConnection();
      await cols.courseGradebookOverrides.updateOne(
        { trackSlug: o.trackSlug, userId: o.userId },
        { $set: o },
        { upsert: true },
      );
      return o;
    },

    async listReviewsByTrack(slug) {
      const { cols } = await getConnection();
      const arr = await cols.courseReviews.find({ trackSlug: slug }).sort({ createdAt: -1 }).toArray();
      return arr.map((a) => strip(a)!) as CourseReviewRecord[];
    },
    async getReviewByUserTrack(userId, trackSlug) {
      const { cols } = await getConnection();
      return strip(
        await cols.courseReviews.findOne({ userId, trackSlug }),
      ) as CourseReviewRecord | null;
    },
    async putReview(r) {
      const { cols } = await getConnection();
      const setDoc = { ...r } as Record<string, unknown>;
      for (const k of Object.keys(setDoc)) {
        if (setDoc[k] === undefined) delete setDoc[k];
      }
      await cols.courseReviews.updateOne({ id: r.id }, { $set: setDoc }, { upsert: true });
      return r;
    },
    async addReviewHelpful(reviewId, voterUserId) {
      const { cols } = await getConnection();
      const r = strip(await cols.courseReviews.findOne({ id: reviewId })) as CourseReviewRecord | null;
      if (!r) return false;
      const voters = r.helpfulVoterIds ?? [];
      if (voters.includes(voterUserId)) return false;
      voters.push(voterUserId);
      await cols.courseReviews.updateOne(
        { id: reviewId },
        { $set: { helpfulVoterIds: voters, helpfulCount: (r.helpfulCount ?? 0) + 1 } },
      );
      return true;
    },
    async listWishlist(userId) {
      const { cols } = await getConnection();
      const arr = await cols.courseWishlist.find({ userId }).sort({ createdAt: -1 }).toArray();
      return arr.map((a) => strip(a)!) as CourseWishlistEntry[];
    },
    async isWishlisted(userId, trackSlug) {
      const { cols } = await getConnection();
      return Boolean(await cols.courseWishlist.findOne({ userId, trackSlug }));
    },
    async addWishlist(userId, trackSlug) {
      const { cols } = await getConnection();
      const now = Date.now();
      await cols.courseWishlist.updateOne(
        { userId, trackSlug },
        { $setOnInsert: { userId, trackSlug, createdAt: now } },
        { upsert: true },
      );
    },
    async removeWishlist(userId, trackSlug) {
      const { cols } = await getConnection();
      await cols.courseWishlist.deleteOne({ userId, trackSlug });
    },

    async listFeedPosts() {
      const { db } = await getConnection();
      // Use db.collection, not cached `cols`, so this works after HMR when `cols` predates `feedPosts`.
      const c = db.collection<FeedPost>("feedPosts");
      const arr = await c.find({}).sort({ createdAt: -1 }).toArray();
      return arr.map((a) => strip(a)!) as FeedPost[];
    },
    async putFeedPost(p) {
      const { db } = await getConnection();
      const c = db.collection<FeedPost>("feedPosts");
      await c.updateOne({ id: p.id }, { $set: p }, { upsert: true });
      return p;
    },

    async getQuiz(id) {
      const { cols } = await getConnection();
      return strip(await cols.quizzes.findOne({ id }));
    },
    async putQuiz(q) {
      const { cols } = await getConnection();
      await cols.quizzes.updateOne({ id: q.id }, { $set: q }, { upsert: true });
      return q;
    },
    async deleteQuiz(id) {
      const { cols } = await getConnection();
      await cols.quizzes.deleteOne({ id });
    },
    async listQuizzesByCourseKey(courseKey) {
      const { cols } = await getConnection();
      const arr = await cols.quizzes.find({ courseKey }).sort({ createdAt: 1 }).toArray();
      return arr.map((a) => strip(a)!) as Quiz[];
    },
    async getQuizAttempt(id) {
      const { cols } = await getConnection();
      return strip(await cols.quizAttempts.findOne({ id }));
    },
    async putQuizAttempt(a) {
      const { cols } = await getConnection();
      await cols.quizAttempts.updateOne({ id: a.id }, { $set: a }, { upsert: true });
      return a;
    },
    async listQuizAttemptsForUserQuiz(userId, quizId) {
      const { cols } = await getConnection();
      const arr = await cols.quizAttempts.find({ userId, quizId }).sort({ startedAt: 1 }).toArray();
      return arr.map((x) => strip(x)!) as QuizAttempt[];
    },
    async listQuizAttemptsByUserId(userId) {
      const { cols } = await getConnection();
      const arr = await cols.quizAttempts.find({ userId }).sort({ startedAt: 1 }).toArray();
      return arr.map((x) => strip(x)!) as QuizAttempt[];
    },
  } satisfies DbAdapter;
}
