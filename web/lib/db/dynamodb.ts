/**
 * DynamoDB adapter — single-table design.
 *
 *   Table:   ${DYNAMO_TABLE}  (default "skillrise")
 *   PK/SK:   (pk: string, sk: string)
 *   Indexes: GSI1 (gsi1pk, gsi1sk) — for email/token/secondary lookups.
 *
 * Item layout (entity | pk | sk | gsi1pk | gsi1sk):
 *   user           | USER#<id>          | PROFILE          | EMAIL#<email>       | USER
 *   session        | SESSION#<token>    | META             | USER#<userId>       | SESSION#<createdAt>
 *   enrollment     | USER#<userId>      | ENROLL#<slug>    | TRACK#<slug>        | USER#<userId>
 *   certificate    | USER#<userId>      | CERT#<id>        | CERT#<id>           | USER#<userId>
 *   job            | JOB#<id>           | META             | JOB#<status>        | POSTED#<ts>
 *   application    | JOB#<jobId>        | APP#<id>         | USER#<userId>       | APP#<ts>
 *   assistant-msg  | USER#<userId>      | CHAT#<id>        | CHAT                | TS#<at>
 *   track (course) | TRACK#<slug>       | META             | CATALOG#TRACKS      | SLUG#<slug>
 *   quiz           | QUIZ#<id>          | META             | COURSE#<courseKey>  | QUIZ#<ts>#<id>
 *   quiz-attempt   | QATTEMPT#<id>      | META             | UQ#<userId>#<quizId>| ATTEMPT#<ts>#<id>
 *
 * Required env:
 *   AWS_REGION, DYNAMO_TABLE, (and standard AWS credentials chain)
 */
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  QueryCommand,
  ScanCommand,
  UpdateCommand,
  DeleteCommand,
} from "@aws-sdk/lib-dynamodb";
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

type Item = Record<string, unknown> & { pk: string; sk: string };

declare global {
  // eslint-disable-next-line no-var
  var __skillrise_dynamo__: { doc: DynamoDBDocumentClient; table: string } | undefined;
}

function getClient() {
  if (globalThis.__skillrise_dynamo__) return globalThis.__skillrise_dynamo__;
  const region = process.env.AWS_REGION || "us-east-1";
  const table = process.env.DYNAMO_TABLE || "skillrise";
  const raw = new DynamoDBClient({ region });
  const doc = DynamoDBDocumentClient.from(raw, {
    marshallOptions: { removeUndefinedValues: true },
  });
  globalThis.__skillrise_dynamo__ = { doc, table };
  return globalThis.__skillrise_dynamo__;
}

function strip<T>(item: Record<string, unknown> | undefined): T | null {
  if (!item) return null;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { pk, sk, gsi1pk, gsi1sk, lmsType, ...rest } = item;
  return rest as T;
}

export function createDynamoAdapter(): DbAdapter {
  const { doc, table } = getClient();

  async function get(pk: string, sk: string) {
    const { Item } = await doc.send(new GetCommand({ TableName: table, Key: { pk, sk } }));
    return Item;
  }
  async function put(item: Item) {
    await doc.send(new PutCommand({ TableName: table, Item: item }));
  }
  async function del(pk: string, sk: string) {
    await doc.send(new DeleteCommand({ TableName: table, Key: { pk, sk } }));
  }
  async function queryByGsi(gsi1pk: string, gsi1sk?: string) {
    const { Items } = await doc.send(
      new QueryCommand({
        TableName: table,
        IndexName: "GSI1",
        KeyConditionExpression: gsi1sk
          ? "gsi1pk = :pk AND gsi1sk = :sk"
          : "gsi1pk = :pk",
        ExpressionAttributeValues: gsi1sk
          ? { ":pk": gsi1pk, ":sk": gsi1sk }
          : { ":pk": gsi1pk },
      }),
    );
    return Items ?? [];
  }
  async function queryPkBegins(pk: string, skPrefix: string) {
    const { Items } = await doc.send(
      new QueryCommand({
        TableName: table,
        KeyConditionExpression: "pk = :pk AND begins_with(sk, :p)",
        ExpressionAttributeValues: { ":pk": pk, ":p": skPrefix },
      }),
    );
    return Items ?? [];
  }

  async function queryGsi1PkAndSkBegins(gsi1pk: string, skPrefix: string) {
    const { Items } = await doc.send(
      new QueryCommand({
        TableName: table,
        IndexName: "GSI1",
        KeyConditionExpression: "gsi1pk = :pk AND begins_with(gsi1sk, :p)",
        ExpressionAttributeValues: { ":pk": gsi1pk, ":p": skPrefix },
      }),
    );
    return Items ?? [];
  }

  return {
    kind: "dynamodb",
    async ready() {
      // Table should exist via Terraform. A lightweight describe could be added if desired.
    },

    async findUserById(id) {
      return strip<User>(await get(`USER#${id}`, "PROFILE"));
    },
    async findUserByEmail(email) {
      const items = await queryByGsi(`EMAIL#${email.toLowerCase()}`, "USER");
      return strip<User>(items[0]);
    },
    /**
     * Table scan — OK for small tables; for large prod tables add a GSI on `googleSub`.
     */
    async findUserByGoogleSub(googleSub) {
      const { Items = [] } = await doc.send(
        new ScanCommand({
          TableName: table,
          FilterExpression: "#sk = :p AND #gs = :g",
          ExpressionAttributeNames: { "#sk": "sk", "#gs": "googleSub" },
          ExpressionAttributeValues: { ":p": "PROFILE", ":g": googleSub },
        }),
      );
      return strip<User>(Items[0]);
    },
    async findUserByGitHubId(githubId) {
      const { Items = [] } = await doc.send(
        new ScanCommand({
          TableName: table,
          FilterExpression: "#sk = :p AND #gh = :g",
          ExpressionAttributeNames: { "#sk": "sk", "#gh": "githubId" },
          ExpressionAttributeValues: { ":p": "PROFILE", ":g": githubId },
        }),
      );
      return strip<User>(Items[0]);
    },
    async findUserByVerifiedPhoneE164(e164, excludeUserId) {
      const { Items = [] } = await doc.send(
        new ScanCommand({
          TableName: table,
          FilterExpression:
            "#sk = :p AND #pe = :e AND attribute_exists(#pv) AND #id <> :xid",
          ExpressionAttributeNames: {
            "#sk": "sk",
            "#pe": "phoneE164",
            "#pv": "phoneVerifiedAt",
            "#id": "id",
          },
          ExpressionAttributeValues: {
            ":p": "PROFILE",
            ":e": e164,
            ":xid": excludeUserId,
          },
        }),
      );
      return strip<User>(Items[0]);
    },
    async createUser(u) {
      await put({
        pk: `USER#${u.id}`,
        sk: "PROFILE",
        gsi1pk: `EMAIL#${u.email.toLowerCase()}`,
        gsi1sk: "USER",
        ...u,
      });
      return u;
    },
    async updateUser(id, patch) {
      const entries = Object.entries(patch).filter(([, v]) => v !== undefined);
      const removes = Object.entries(patch)
        .filter(([, v]) => v === undefined)
        .map(([k]) => k);
      if (entries.length === 0 && removes.length === 0) {
        return (await this.findUserById(id)) as User | null;
      }
      const setParts: string[] = [];
      const nameMap: Record<string, string> = {};
      const valMap: Record<string, unknown> = {};
      entries.forEach(([k, v], i) => {
        const nk = `#s${i}`;
        const vk = `:s${i}`;
        nameMap[nk] = k;
        valMap[vk] = v;
        setParts.push(`${nk} = ${vk}`);
      });
      removes.forEach((k, i) => {
        nameMap[`#r${i}`] = k;
      });
      const setExpr = setParts.length ? `SET ${setParts.join(", ")}` : "";
      const removeExpr = removes.length
        ? `REMOVE ${removes.map((_, i) => `#r${i}`).join(", ")}`
        : "";
      const updateExpression = [setExpr, removeExpr].filter(Boolean).join(" ");
      const res = await doc.send(
        new UpdateCommand({
          TableName: table,
          Key: { pk: `USER#${id}`, sk: "PROFILE" },
          UpdateExpression: updateExpression,
          ExpressionAttributeNames: nameMap,
          ...(Object.keys(valMap).length ? { ExpressionAttributeValues: valMap } : {}),
          ReturnValues: "ALL_NEW",
        }),
      );
      return strip<User>(res.Attributes);
    },

    async createSession(s) {
      await put({
        pk: `SESSION#${s.token}`,
        sk: "META",
        gsi1pk: `USER#${s.userId}`,
        gsi1sk: `SESSION#${s.createdAt}`,
        ...s,
      });
      return s;
    },
    async getSession(token) {
      return strip<Session>(await get(`SESSION#${token}`, "META"));
    },
    async listSessionsByUserId(userId) {
      const items = await queryByGsi(`USER#${userId}`);
      return items
        .filter(
          (i) =>
            typeof (i as { pk?: string }).pk === "string" &&
            (i as { pk: string }).pk.startsWith("SESSION#"),
        )
        .map((i) => strip<Session>(i)!);
    },
    async deleteSession(token) {
      await del(`SESSION#${token}`, "META");
    },
    async deleteSessionsForUser(userId, exceptToken) {
      const items = await queryByGsi(`USER#${userId}`);
      const list = items
        .filter(
          (i) =>
            typeof (i as { pk?: string }).pk === "string" &&
            (i as { pk: string }).pk.startsWith("SESSION#"),
        )
        .map((i) => strip<Session>(i)!);
      for (const s of list) {
        if (exceptToken && s.token === exceptToken) continue;
        await del(`SESSION#${s.token}`, "META");
      }
    },

    async listEnrollments(userId) {
      const items = await queryPkBegins(`USER#${userId}`, "ENROLL#");
      return items.map((i) => strip<Enrollment>(i)!) ?? [];
    },
    async listEnrollmentsByTrack(trackSlug) {
      const items = await queryByGsi(`TRACK#${trackSlug}`);
      return items
        .filter((i) => typeof (i as { sk?: string }).sk === "string" && (i as { sk: string }).sk.startsWith("ENROLL#"))
        .map((i) => strip<Enrollment>(i)!) ?? [];
    },
    async getEnrollment(userId, trackSlug) {
      return strip<Enrollment>(await get(`USER#${userId}`, `ENROLL#${trackSlug}`));
    },
    async upsertEnrollment(e) {
      await put({
        pk: `USER#${e.userId}`,
        sk: `ENROLL#${e.trackSlug}`,
        gsi1pk: `TRACK#${e.trackSlug}`,
        gsi1sk: `USER#${e.userId}`,
        ...e,
      });
      return e;
    },

    async listCertificates(userId) {
      const items = await queryPkBegins(`USER#${userId}`, "CERT#");
      return items.map((i) => strip<Certificate>(i)!) ?? [];
    },
    async getCertificate(id) {
      const items = await queryByGsi(`CERT#${id}`);
      return strip<Certificate>(items[0]);
    },
    async createCertificate(c) {
      await put({
        pk: `USER#${c.userId}`,
        sk: `CERT#${c.id}`,
        gsi1pk: `CERT#${c.id}`,
        gsi1sk: `USER#${c.userId}`,
        ...c,
      });
      return c;
    },

    async listJobs(filter) {
      const status = filter?.status ?? "open";
      const items = await queryByGsi(`JOB#${status}`);
      return items.map((i) => strip<Job>(i)!) ?? [];
    },
    async getJob(id) {
      return strip<Job>(await get(`JOB#${id}`, "META"));
    },
    async createJob(j) {
      await put({
        pk: `JOB#${j.id}`,
        sk: "META",
        gsi1pk: `JOB#${j.status}`,
        gsi1sk: `POSTED#${j.postedAt}`,
        ...j,
      });
      return j;
    },
    async listApplications(filter) {
      if (filter.jobId) {
        const items = await queryPkBegins(`JOB#${filter.jobId}`, "APP#");
        return items.map((i) => strip<Application>(i)!) ?? [];
      }
      if (filter.userId) {
        const items = await queryByGsi(`USER#${filter.userId}`);
        return items
          .filter((i) => typeof i.sk === "string" && (i.sk as string).startsWith("APP#"))
          .map((i) => strip<Application>(i)!);
      }
      return [];
    },
    async createApplication(a) {
      await put({
        pk: `JOB#${a.jobId}`,
        sk: `APP#${a.id}`,
        gsi1pk: `USER#${a.userId}`,
        gsi1sk: `APP#${a.appliedAt}`,
        ...a,
      });
      return a;
    },
    async updateApplication(id, patch) {
      // We need jobId to locate item; `id` alone is not unique. Scan via GSI on APP#<id>.
      const { Items } = await doc.send(
        new QueryCommand({
          TableName: table,
          IndexName: "GSI1",
          KeyConditionExpression: "gsi1pk = :pk",
          FilterExpression: "id = :id",
          ExpressionAttributeValues: { ":pk": `APP#${id}`, ":id": id },
        }),
      );
      const existing = Items?.[0];
      if (!existing) return null;
      const merged = { ...existing, ...patch };
      await put(merged as Item);
      return strip<Application>(merged);
    },

    async appendAssistantMessage(m) {
      await put({
        pk: `USER#${m.userId}`,
        sk: `CHAT#${m.id}`,
        gsi1pk: "CHAT",
        gsi1sk: `TS#${m.at}`,
        ...m,
      });
      return m;
    },
    async listAssistantMessages(userId, limit = 40) {
      const { Items } = await doc.send(
        new QueryCommand({
          TableName: table,
          KeyConditionExpression: "pk = :pk AND begins_with(sk, :p)",
          ExpressionAttributeValues: { ":pk": `USER#${userId}`, ":p": "CHAT#" },
          Limit: limit,
          ScanIndexForward: false,
        }),
      );
      const items = (Items ?? []).reverse();
      return items.map((i) => strip<AssistantMessage>(i)!) ?? [];
    },

    async getTrack(slug) {
      return strip<Track>(await get(`TRACK#${slug}`, "META"));
    },
    async listTracks() {
      const { Items = [] } = await doc.send(
        new ScanCommand({
          TableName: table,
          FilterExpression: "sk = :m AND begins_with(#pk, :t)",
          ExpressionAttributeNames: { "#pk": "pk" },
          ExpressionAttributeValues: { ":m": "META", ":t": "TRACK#" },
        }),
      );
      return (Items.map((i) => strip<Track>(i)).filter(Boolean) as Track[]).sort((a, b) =>
        a.slug.localeCompare(b.slug),
      );
    },
    async putTrack(t) {
      await put({
        pk: `TRACK#${t.slug}`,
        sk: "META",
        gsi1pk: "CATALOG#TRACKS",
        gsi1sk: `SLUG#${t.slug}`,
        ...t,
      } as Item);
      return t;
    },

    async getQuiz(id) {
      return strip<Quiz>(await get(`QUIZ#${id}`, "META"));
    },
    async putQuiz(q) {
      await put({
        pk: `QUIZ#${q.id}`,
        sk: "META",
        gsi1pk: `COURSE#${q.courseKey}`,
        gsi1sk: `QUIZ#${q.createdAt}#${q.id}`,
        ...q,
      });
      return q;
    },
    async deleteQuiz(id) {
      await del(`QUIZ#${id}`, "META");
    },
    async listQuizzesByCourseKey(courseKey) {
      const items = await queryGsi1PkAndSkBegins(`COURSE#${courseKey}`, "QUIZ#");
      return items
        .map((i) => strip<Quiz>(i))
        .filter(Boolean)
        .sort((a, b) => a!.createdAt - b!.createdAt) as Quiz[];
    },
    async getQuizAttempt(id) {
      return strip<QuizAttempt>(await get(`QATTEMPT#${id}`, "META"));
    },
    async putQuizAttempt(a) {
      await put({
        pk: `QATTEMPT#${a.id}`,
        sk: "META",
        gsi1pk: `UQ#${a.userId}#${a.quizId}`,
        gsi1sk: `ATTEMPT#${a.startedAt}#${a.id}`,
        ...a,
      });
      return a;
    },
    async listQuizAttemptsForUserQuiz(userId, quizId) {
      const items = await queryGsi1PkAndSkBegins(`UQ#${userId}#${quizId}`, "ATTEMPT#");
      const out = (items.map((i) => strip<QuizAttempt>(i)).filter(Boolean) as QuizAttempt[]).sort(
        (x, y) => x.startedAt - y.startedAt,
      );
      return out;
    },
    async listQuizAttemptsByUserId(userId) {
      const { Items = [] } = await doc.send(
        new ScanCommand({
          TableName: table,
          FilterExpression: "userId = :u AND begins_with(#pk, :prefix)",
          ExpressionAttributeNames: { "#pk": "pk" },
          ExpressionAttributeValues: { ":u": userId, ":prefix": "QATTEMPT#" },
        }),
      );
      return (Items.map((i) => strip<QuizAttempt>(i)).filter(Boolean) as QuizAttempt[]).sort(
        (a, b) => a.startedAt - b.startedAt,
      );
    },

    /* LMS: pk = LMS#<typeAbbr>#<id>, sk = META, attrs include lmsType + entity fields. Lists use Scan (OK for small/medium tables). */
    async listAssignmentsByTrack(trackSlug) {
      const { Items = [] } = await doc.send(
        new ScanCommand({
          TableName: table,
          FilterExpression: "lmsType = :t AND trackSlug = :s",
          ExpressionAttributeValues: { ":t": "assignment", ":s": trackSlug },
        }),
      );
      return (Items.map((i) => strip<CourseAssignment>(i)).filter(Boolean) as CourseAssignment[]).sort(
        (a, b) => a.sortOrder - b.sortOrder,
      );
    },
    async getAssignment(id) {
      return strip<CourseAssignment>(await get(`LMS#A#${id}`, "META"));
    },
    async putAssignment(a) {
      await put({
        pk: `LMS#A#${a.id}`,
        sk: "META",
        lmsType: "assignment",
        ...a,
      } as Item);
      return a;
    },
    async deleteAssignment(id) {
      await del(`LMS#A#${id}`, "META");
    },
    async getSubmission(id) {
      return strip<AssignmentSubmission>(await get(`LMS#S#${id}`, "META"));
    },
    async getSubmissionByUserAssignment(userId, assignmentId) {
      const { Items = [] } = await doc.send(
        new ScanCommand({
          TableName: table,
          FilterExpression: "lmsType = :t AND userId = :u AND assignmentId = :a",
          ExpressionAttributeValues: { ":t": "submission", ":u": userId, ":a": assignmentId },
        }),
      );
      return strip<AssignmentSubmission>(Items[0]) ?? null;
    },
    async listSubmissionsByAssignment(assignmentId) {
      const { Items = [] } = await doc.send(
        new ScanCommand({
          TableName: table,
          FilterExpression: "lmsType = :t AND assignmentId = :a",
          ExpressionAttributeValues: { ":t": "submission", ":a": assignmentId },
        }),
      );
      return Items.map((i) => strip<AssignmentSubmission>(i)).filter(Boolean) as AssignmentSubmission[];
    },
    async listSubmissionsByUserTrack(userId, trackSlug) {
      const { Items = [] } = await doc.send(
        new ScanCommand({
          TableName: table,
          FilterExpression: "lmsType = :t AND userId = :u AND trackSlug = :s",
          ExpressionAttributeValues: { ":t": "submission", ":u": userId, ":s": trackSlug },
        }),
      );
      return Items.map((i) => strip<AssignmentSubmission>(i)).filter(Boolean) as AssignmentSubmission[];
    },
    async putSubmission(s) {
      await put({ pk: `LMS#S#${s.id}`, sk: "META", lmsType: "submission", ...s } as Item);
      return s;
    },
    async listAnnouncementsByTrack(trackSlug) {
      const { Items = [] } = await doc.send(
        new ScanCommand({
          TableName: table,
          FilterExpression: "lmsType = :t AND trackSlug = :s",
          ExpressionAttributeValues: { ":t": "announcement", ":s": trackSlug },
        }),
      );
      return (Items.map((i) => strip<CourseAnnouncement>(i)).filter(Boolean) as CourseAnnouncement[]).sort(
        (a, b) => b.createdAt - a.createdAt,
      );
    },
    async getAnnouncement(id) {
      return strip<CourseAnnouncement>(await get(`LMS#N#${id}`, "META"));
    },
    async putAnnouncement(a) {
      await put({ pk: `LMS#N#${a.id}`, sk: "META", lmsType: "announcement", ...a } as Item);
      return a;
    },
    async isAnnouncementRead(announcementId, userId) {
      const it = await get(`LMS#R#${announcementId}#${userId}`, "META");
      return Boolean(it);
    },
    async markAnnouncementRead(announcementId, userId, readAt) {
      await put({
        pk: `LMS#R#${announcementId}#${userId}`,
        sk: "META",
        lmsType: "announcementRead",
        announcementId,
        userId,
        readAt,
      } as Item);
    },
    async listForumThreadsByTrack(trackSlug) {
      const { Items = [] } = await doc.send(
        new ScanCommand({
          TableName: table,
          FilterExpression: "lmsType = :t AND trackSlug = :s",
          ExpressionAttributeValues: { ":t": "forumThread", ":s": trackSlug },
        }),
      );
      return (Items.map((i) => strip<CourseForumThread>(i)).filter(Boolean) as CourseForumThread[]).sort(
        (a, b) => b.createdAt - a.createdAt,
      );
    },
    async getForumThread(id) {
      return strip<CourseForumThread>(await get(`LMS#F#${id}`, "META"));
    },
    async putForumThread(t) {
      await put({ pk: `LMS#F#${t.id}`, sk: "META", lmsType: "forumThread", ...t } as Item);
      return t;
    },
    async listForumPostsByThread(threadId) {
      const { Items = [] } = await doc.send(
        new ScanCommand({
          TableName: table,
          FilterExpression: "lmsType = :t AND threadId = :th",
          ExpressionAttributeValues: { ":t": "forumPost", ":th": threadId },
        }),
      );
      return (Items.map((i) => strip<CourseForumPost>(i)).filter(Boolean) as CourseForumPost[]).sort(
        (a, b) => a.at - b.at,
      );
    },
    async putForumPost(p) {
      await put({ pk: `LMS#P#${p.id}`, sk: "META", lmsType: "forumPost", ...p } as Item);
      return p;
    },
    async listDmThreadsForUser(userId, trackSlug) {
      const { Items = [] } = await doc.send(
        new ScanCommand({
          TableName: table,
          FilterExpression: "lmsType = :t",
          ExpressionAttributeValues: { ":t": "dmThread" },
        }),
      );
      const rows = Items.map((i) => strip<DmThread>(i)).filter(Boolean) as DmThread[];
      return rows
        .filter(
          (t) =>
            (t.teacherId === userId || t.studentId === userId) && (trackSlug ? t.trackSlug === trackSlug : true),
        )
        .sort((a, b) => b.lastMessageAt - a.lastMessageAt);
    },
    async getDmThread(id) {
      return strip<DmThread>(await get(`LMS#D#${id}`, "META"));
    },
    async getDmThreadByPair(teacherId, studentId, trackSlug) {
      const { Items = [] } = await doc.send(
        new ScanCommand({
          TableName: table,
          FilterExpression:
            "lmsType = :t AND trackSlug = :s AND ((teacherId = :tid AND studentId = :sid) OR (teacherId = :sid AND studentId = :tid))",
          ExpressionAttributeValues: { ":t": "dmThread", ":s": trackSlug, ":tid": teacherId, ":sid": studentId },
        }),
      );
      return strip<DmThread>(Items[0]) ?? null;
    },
    async putDmThread(t) {
      await put({ pk: `LMS#D#${t.id}`, sk: "META", lmsType: "dmThread", ...t } as Item);
      return t;
    },
    async listDmMessages(threadId) {
      const { Items = [] } = await doc.send(
        new ScanCommand({
          TableName: table,
          FilterExpression: "lmsType = :t AND threadId = :th",
          ExpressionAttributeValues: { ":t": "dmMessage", ":th": threadId },
        }),
      );
      return (Items.map((i) => strip<DmMessage>(i)).filter(Boolean) as DmMessage[]).sort((a, b) => a.at - b.at);
    },
    async putDmMessage(m) {
      await put({ pk: `LMS#M#${m.id}`, sk: "META", lmsType: "dmMessage", ...m } as Item);
      return m;
    },
    async listInvitesByTrack(trackSlug) {
      const { Items = [] } = await doc.send(
        new ScanCommand({
          TableName: table,
          FilterExpression: "lmsType = :t AND trackSlug = :s",
          ExpressionAttributeValues: { ":t": "invite", ":s": trackSlug },
        }),
      );
      return Items.map((i) => strip<EnrollmentInvite>(i)).filter(Boolean) as EnrollmentInvite[];
    },
    async getInviteByToken(token) {
      const { Items = [] } = await doc.send(
        new ScanCommand({
          TableName: table,
          FilterExpression: "lmsType = :t AND #tok = :tok",
          ExpressionAttributeNames: { "#tok": "token" },
          ExpressionAttributeValues: { ":t": "invite", ":tok": token },
        }),
      );
      return strip<EnrollmentInvite>(Items[0]) ?? null;
    },
    async putInvite(i) {
      await put({ pk: `LMS#I#${i.id}`, sk: "META", lmsType: "invite", ...i } as Item);
      return i;
    },
    async incrementInviteUse(id) {
      const raw = await get(`LMS#I#${id}`, "META");
      if (!raw) return;
      const c = ((raw as { useCount?: number }).useCount ?? 0) + 1;
      await put({ ...(raw as Item), useCount: c });
    },
    async listSectionsByTrack(trackSlug) {
      const { Items = [] } = await doc.send(
        new ScanCommand({
          TableName: table,
          FilterExpression: "lmsType = :t AND trackSlug = :s",
          ExpressionAttributeValues: { ":t": "section", ":s": trackSlug },
        }),
      );
      return Items.map((i) => strip<CourseSection>(i)).filter(Boolean) as CourseSection[];
    },
    async putSection(s) {
      await put({ pk: `LMS#C#${s.id}`, sk: "META", lmsType: "section", ...s } as Item);
      return s;
    },
    async getGradebookOverride(trackSlug, userId) {
      const { Items = [] } = await doc.send(
        new ScanCommand({
          TableName: table,
          FilterExpression: "lmsType = :t AND trackSlug = :s AND userId = :u",
          ExpressionAttributeValues: { ":t": "gradeOverride", ":s": trackSlug, ":u": userId },
        }),
      );
      return strip<CourseGradebookOverride>(Items[0]) ?? null;
    },
    async putGradebookOverride(o) {
      await put({ pk: `LMS#G#${o.id}`, sk: "META", lmsType: "gradeOverride", ...o } as Item);
      return o;
    },

    async listReviewsByTrack(trackSlug) {
      const { Items = [] } = await doc.send(
        new ScanCommand({
          TableName: table,
          FilterExpression: "lmsType = :t AND trackSlug = :s",
          ExpressionAttributeValues: { ":t": "courseReview", ":s": trackSlug },
        }),
      );
      return (Items.map((i) => strip<CourseReviewRecord>(i)).filter(Boolean) as CourseReviewRecord[]).sort(
        (a, b) => b.createdAt - a.createdAt,
      );
    },
    async getReviewByUserTrack(userId, trackSlug) {
      const { Items = [] } = await doc.send(
        new ScanCommand({
          TableName: table,
          FilterExpression: "lmsType = :t AND userId = :u AND trackSlug = :s",
          ExpressionAttributeValues: { ":t": "courseReview", ":u": userId, ":s": trackSlug },
        }),
      );
      return strip<CourseReviewRecord>(Items[0]) ?? null;
    },
    async putReview(r) {
      await put({ pk: `LMS#REV#${r.id}`, sk: "META", lmsType: "courseReview", ...r } as Item);
      return r;
    },
    async addReviewHelpful(reviewId, voterUserId) {
      const raw = await get(`LMS#REV#${reviewId}`, "META");
      const r = strip<CourseReviewRecord>(raw) as CourseReviewRecord | null;
      if (!r) return false;
      const voters = r.helpfulVoterIds ?? [];
      if (voters.includes(voterUserId)) return false;
      voters.push(voterUserId);
      await put({
        pk: `LMS#REV#${reviewId}`,
        sk: "META",
        lmsType: "courseReview",
        ...r,
        helpfulVoterIds: voters,
        helpfulCount: (r.helpfulCount ?? 0) + 1,
      } as Item);
      return true;
    },
    async listWishlist(userId) {
      const { Items = [] } = await doc.send(
        new ScanCommand({
          TableName: table,
          FilterExpression: "lmsType = :t AND userId = :u",
          ExpressionAttributeValues: { ":t": "courseWish", ":u": userId },
        }),
      );
      return (Items.map((i) => strip<CourseWishlistEntry>(i)).filter(Boolean) as CourseWishlistEntry[]).sort(
        (a, b) => b.createdAt - a.createdAt,
      );
    },
    async isWishlisted(userId, trackSlug) {
      const { Items = [] } = await doc.send(
        new ScanCommand({
          TableName: table,
          FilterExpression: "lmsType = :t AND userId = :u AND trackSlug = :s",
          ExpressionAttributeValues: { ":t": "courseWish", ":u": userId, ":s": trackSlug },
        }),
      );
      return Items.length > 0;
    },
    async addWishlist(userId, trackSlug) {
      const now = Date.now();
      const pk = `LMS#WISH#${userId}#${trackSlug.replace(/[^a-zA-Z0-9-]/g, "_")}`;
      await put({
        pk,
        sk: "META",
        lmsType: "courseWish",
        userId,
        trackSlug,
        createdAt: now,
      } as Item);
    },
    async removeWishlist(userId, trackSlug) {
      const pk = `LMS#WISH#${userId}#${trackSlug.replace(/[^a-zA-Z0-9-]/g, "_")}`;
      await del(pk, "META");
    },

    async listFeedPosts() {
      const { Items = [] } = await doc.send(
        new ScanCommand({
          TableName: table,
          FilterExpression: "lmsType = :t",
          ExpressionAttributeValues: { ":t": "feedPost" },
        }),
      );
      return (Items.map((i) => strip<FeedPost>(i)).filter(Boolean) as FeedPost[]).sort(
        (a, b) => b.createdAt - a.createdAt,
      );
    },
    async putFeedPost(p) {
      await put({ pk: `LMS#FEED#${p.id}`, sk: "META", lmsType: "feedPost", ...p } as Item);
      return p;
    },
  } satisfies DbAdapter;
}
