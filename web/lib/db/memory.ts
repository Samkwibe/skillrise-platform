import { store, type User, type Session, type Enrollment, type Certificate, type Job, type Application, type AssistantMessage } from "@/lib/store";
import type { DbAdapter } from "./types";

export function createMemoryAdapter(): DbAdapter {
  return {
    kind: "memory",
    async ready() {
      // no-op
    },

    async findUserById(id) {
      return store.users.find((u) => u.id === id) ?? null;
    },
    async findUserByEmail(email) {
      const lower = email.toLowerCase();
      return store.users.find((u) => u.email.toLowerCase() === lower) ?? null;
    },
    async findUserByGoogleSub(googleSub) {
      return store.users.find((u) => u.googleSub === googleSub) ?? null;
    },
    async findUserByVerifiedPhoneE164(e164, excludeUserId) {
      return (
        store.users.find(
          (u) => u.id !== excludeUserId && u.phoneE164 === e164 && u.phoneVerifiedAt,
        ) ?? null
      );
    },
    async createUser(u) {
      store.users.push(u);
      return u;
    },
    async updateUser(id, patch) {
      const u = store.users.find((x) => x.id === id);
      if (!u) return null;
      const rec = u as Record<string, unknown>;
      for (const [k, v] of Object.entries(patch)) {
        if (v === undefined) delete rec[k];
        else rec[k] = v;
      }
      return u;
    },

    async createSession(s) {
      store.sessions.push(s);
      return s;
    },
    async getSession(token) {
      return store.sessions.find((s) => s.token === token) ?? null;
    },
    async listSessionsByUserId(userId) {
      return store.sessions.filter((s) => s.userId === userId).sort((a, b) => b.createdAt - a.createdAt);
    },
    async deleteSession(token) {
      const idx = store.sessions.findIndex((s) => s.token === token);
      if (idx >= 0) store.sessions.splice(idx, 1);
    },
    async deleteSessionsForUser(userId, exceptToken) {
      store.sessions = store.sessions.filter(
        (s) => s.userId !== userId || (exceptToken && s.token === exceptToken),
      );
    },

    async listEnrollments(userId) {
      return store.enrollments.filter((e) => e.userId === userId);
    },
    async getEnrollment(userId, trackSlug) {
      return (
        store.enrollments.find((e) => e.userId === userId && e.trackSlug === trackSlug) ?? null
      );
    },
    async upsertEnrollment(e) {
      const existing = store.enrollments.find(
        (x) => x.userId === e.userId && x.trackSlug === e.trackSlug,
      );
      if (existing) Object.assign(existing, e);
      else store.enrollments.push(e);
      return e;
    },

    async listCertificates(userId) {
      return store.certificates.filter((c) => c.userId === userId);
    },
    async getCertificate(id) {
      return store.certificates.find((c) => c.id === id) ?? null;
    },
    async createCertificate(c) {
      store.certificates.push(c);
      return c;
    },

    async listJobs(filter) {
      return filter?.status
        ? store.jobs.filter((j) => j.status === filter.status)
        : [...store.jobs];
    },
    async getJob(id) {
      return store.jobs.find((j) => j.id === id) ?? null;
    },
    async createJob(j) {
      store.jobs.push(j);
      return j;
    },
    async listApplications(filter) {
      return store.applications.filter((a) => {
        if (filter.userId && a.userId !== filter.userId) return false;
        if (filter.jobId && a.jobId !== filter.jobId) return false;
        return true;
      });
    },
    async createApplication(a) {
      store.applications.push(a);
      return a;
    },
    async updateApplication(id, patch) {
      const a = store.applications.find((x) => x.id === id);
      if (!a) return null;
      Object.assign(a, patch);
      return a;
    },

    async appendAssistantMessage(m) {
      store.assistantMessages.push(m);
      return m;
    },
    async listAssistantMessages(userId, limit = 40) {
      return store.assistantMessages
        .filter((m) => m.userId === userId)
        .slice(-limit);
    },
  } satisfies DbAdapter;
}
