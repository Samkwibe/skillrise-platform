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
} from "@/lib/store";

type Collections = {
  users: Collection<User>;
  sessions: Collection<Session>;
  enrollments: Collection<Enrollment>;
  certificates: Collection<Certificate>;
  jobs: Collection<Job>;
  applications: Collection<Application>;
  assistantMessages: Collection<AssistantMessage>;
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
      db.collection("certificates").createIndex({ userId: 1 }),
      db.collection("certificates").createIndex({ id: 1 }, { unique: true }),
      db.collection("jobs").createIndex({ status: 1, postedAt: -1 }),
      db.collection("applications").createIndex({ jobId: 1 }),
      db.collection("applications").createIndex({ userId: 1 }),
      db.collection("assistantMessages").createIndex({ userId: 1, at: -1 }),
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
  } satisfies DbAdapter;
}
