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
} from "@/lib/store";

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
  const { pk, sk, gsi1pk, gsi1sk, ...rest } = item;
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
  } satisfies DbAdapter;
}
