import {
  store,
  type User,
  type Session,
  type Enrollment,
  type Certificate,
  type Job,
  type Application,
  type AssistantMessage,
  type Track,
  type FeedPost,
} from "@/lib/store";
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
    async findUserByGitHubId(githubId) {
      return store.users.find((u) => u.githubId === githubId) ?? null;
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
    async listEnrollmentsByTrack(trackSlug) {
      return store.enrollments.filter((e) => e.trackSlug === trackSlug);
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

    async getQuiz(id) {
      return store.quizzes.find((q) => q.id === id) ?? null;
    },
    async putQuiz(q) {
      const i = store.quizzes.findIndex((x) => x.id === q.id);
      if (i >= 0) store.quizzes[i] = q;
      else store.quizzes.push(q);
      return q;
    },
    async deleteQuiz(id) {
      const i = store.quizzes.findIndex((q) => q.id === id);
      if (i >= 0) store.quizzes.splice(i, 1);
    },
    async listQuizzesByCourseKey(courseKey) {
      return store.quizzes.filter((q) => q.courseKey === courseKey).sort((a, b) => a.createdAt - b.createdAt);
    },
    async getQuizAttempt(id) {
      return store.quizAttempts.find((a) => a.id === id) ?? null;
    },
    async putQuizAttempt(a) {
      const i = store.quizAttempts.findIndex((x) => x.id === a.id);
      if (i >= 0) store.quizAttempts[i] = a;
      else store.quizAttempts.push(a);
      return a;
    },
    async listQuizAttemptsForUserQuiz(userId, quizId) {
      return store.quizAttempts
        .filter((a) => a.userId === userId && a.quizId === quizId)
        .sort((a, b) => a.startedAt - b.startedAt);
    },
    async listQuizAttemptsByUserId(userId) {
      return store.quizAttempts.filter((a) => a.userId === userId).sort((a, b) => a.startedAt - b.startedAt);
    },

    async getTrack(slug) {
      return store.tracks.find((t) => t.slug === slug) ?? null;
    },
    async listTracks() {
      return [...store.tracks];
    },
    async putTrack(t: Track) {
      const i = store.tracks.findIndex((x) => x.slug === t.slug);
      if (i >= 0) store.tracks[i] = t;
      else store.tracks.push(t);
      return t;
    },

    async listAssignmentsByTrack(slug) {
      return store.courseAssignments.filter((a) => a.trackSlug === slug).sort((a, b) => a.sortOrder - b.sortOrder);
    },
    async getAssignment(id) {
      return store.courseAssignments.find((a) => a.id === id) ?? null;
    },
    async putAssignment(a) {
      const i = store.courseAssignments.findIndex((x) => x.id === a.id);
      if (i >= 0) store.courseAssignments[i] = a;
      else store.courseAssignments.push(a);
      return a;
    },
    async deleteAssignment(id) {
      const i = store.courseAssignments.findIndex((x) => x.id === id);
      if (i >= 0) store.courseAssignments.splice(i, 1);
    },

    async getSubmission(id) {
      return store.assignmentSubmissions.find((s) => s.id === id) ?? null;
    },
    async getSubmissionByUserAssignment(userId, assignmentId) {
      return store.assignmentSubmissions.find((s) => s.userId === userId && s.assignmentId === assignmentId) ?? null;
    },
    async listSubmissionsByAssignment(assignmentId) {
      return store.assignmentSubmissions.filter((s) => s.assignmentId === assignmentId);
    },
    async listSubmissionsByUserTrack(userId, trackSlug) {
      return store.assignmentSubmissions.filter((s) => s.userId === userId && s.trackSlug === trackSlug);
    },
    async putSubmission(s) {
      const i = store.assignmentSubmissions.findIndex((x) => x.id === s.id);
      if (i >= 0) store.assignmentSubmissions[i] = s;
      else store.assignmentSubmissions.push(s);
      return s;
    },

    async listAnnouncementsByTrack(slug) {
      return store.courseAnnouncements
        .filter((a) => a.trackSlug === slug)
        .sort((a, b) => b.createdAt - a.createdAt);
    },
    async getAnnouncement(id) {
      return store.courseAnnouncements.find((a) => a.id === id) ?? null;
    },
    async putAnnouncement(a) {
      const i = store.courseAnnouncements.findIndex((x) => x.id === a.id);
      if (i >= 0) store.courseAnnouncements[i] = a;
      else store.courseAnnouncements.push(a);
      return a;
    },
    async isAnnouncementRead(announcementId, userId) {
      return store.announcementReads.some((r) => r.announcementId === announcementId && r.userId === userId);
    },
    async markAnnouncementRead(announcementId, userId, readAt) {
      if (store.announcementReads.some((r) => r.announcementId === announcementId && r.userId === userId)) return;
      store.announcementReads.push({ announcementId, userId, readAt });
    },

    async listForumThreadsByTrack(slug) {
      return store.courseForumThreads.filter((t) => t.trackSlug === slug).sort((a, b) => b.createdAt - a.createdAt);
    },
    async getForumThread(id) {
      return store.courseForumThreads.find((t) => t.id === id) ?? null;
    },
    async putForumThread(t) {
      const i = store.courseForumThreads.findIndex((x) => x.id === t.id);
      if (i >= 0) store.courseForumThreads[i] = t;
      else store.courseForumThreads.push(t);
      return t;
    },
    async listForumPostsByThread(threadId) {
      return store.courseForumPosts
        .filter((p) => p.threadId === threadId)
        .sort((a, b) => a.at - b.at);
    },
    async putForumPost(p) {
      const i = store.courseForumPosts.findIndex((x) => x.id === p.id);
      if (i >= 0) store.courseForumPosts[i] = p;
      else store.courseForumPosts.push(p);
      return p;
    },

    async listDmThreadsForUser(userId, trackSlug) {
      return store.dmThreads
        .filter(
          (t) =>
            (t.studentId === userId || t.teacherId === userId) && (trackSlug ? t.trackSlug === trackSlug : true),
        )
        .sort((a, b) => b.lastMessageAt - a.lastMessageAt);
    },
    async getDmThread(id) {
      return store.dmThreads.find((t) => t.id === id) ?? null;
    },
    async getDmThreadByPair(teacherId, studentId, trackSlug) {
      return (
        store.dmThreads.find(
          (t) =>
            t.trackSlug === trackSlug &&
            ((t.teacherId === teacherId && t.studentId === studentId) ||
              (t.teacherId === studentId && t.studentId === teacherId)),
        ) ?? null
      );
    },
    async putDmThread(t) {
      const i = store.dmThreads.findIndex((x) => x.id === t.id);
      if (i >= 0) store.dmThreads[i] = t;
      else store.dmThreads.push(t);
      return t;
    },
    async listDmMessages(threadId) {
      return store.dmMessages.filter((m) => m.threadId === threadId).sort((a, b) => a.at - b.at);
    },
    async putDmMessage(m) {
      const i = store.dmMessages.findIndex((x) => x.id === m.id);
      if (i >= 0) store.dmMessages[i] = m;
      else store.dmMessages.push(m);
      const th = store.dmThreads.find((t) => t.id === m.threadId);
      if (th) th.lastMessageAt = m.at;
      return m;
    },

    async listInvitesByTrack(slug) {
      return store.enrollmentInvites.filter((i) => i.trackSlug === slug);
    },
    async getInviteByToken(token) {
      return store.enrollmentInvites.find((i) => i.token === token) ?? null;
    },
    async putInvite(i) {
      const idx = store.enrollmentInvites.findIndex((x) => x.id === i.id);
      if (idx >= 0) store.enrollmentInvites[idx] = i;
      else store.enrollmentInvites.push(i);
      return i;
    },
    async incrementInviteUse(id) {
      const i = store.enrollmentInvites.find((x) => x.id === id);
      if (i) i.useCount += 1;
    },

    async listSectionsByTrack(slug) {
      return store.courseSections.filter((s) => s.trackSlug === slug);
    },
    async putSection(s) {
      const i = store.courseSections.findIndex((x) => x.id === s.id);
      if (i >= 0) store.courseSections[i] = s;
      else store.courseSections.push(s);
      return s;
    },

    async getGradebookOverride(trackSlug, userId) {
      return store.courseGradebookOverrides.find((o) => o.trackSlug === trackSlug && o.userId === userId) ?? null;
    },
    async putGradebookOverride(o) {
      const i = store.courseGradebookOverrides.findIndex(
        (x) => x.trackSlug === o.trackSlug && x.userId === o.userId,
      );
      if (i >= 0) store.courseGradebookOverrides[i] = o;
      else store.courseGradebookOverrides.push(o);
      return o;
    },

    async listReviewsByTrack(slug) {
      return store.courseReviews.filter((r) => r.trackSlug === slug).sort((a, b) => b.createdAt - a.createdAt);
    },
    async getReviewByUserTrack(userId, trackSlug) {
      return store.courseReviews.find((r) => r.userId === userId && r.trackSlug === trackSlug) ?? null;
    },
    async putReview(r) {
      const i = store.courseReviews.findIndex((x) => x.id === r.id);
      if (i >= 0) store.courseReviews[i] = r;
      else store.courseReviews.push(r);
      return r;
    },
    async addReviewHelpful(reviewId, voterUserId) {
      const r = store.courseReviews.find((x) => x.id === reviewId);
      if (!r) return false;
      if (r.helpfulVoterIds.includes(voterUserId)) return false;
      r.helpfulVoterIds.push(voterUserId);
      r.helpfulCount = (r.helpfulCount ?? 0) + 1;
      return true;
    },
    async listWishlist(userId) {
      return store.courseWishlist
        .filter((w) => w.userId === userId)
        .sort((a, b) => b.createdAt - a.createdAt);
    },
    async isWishlisted(userId, trackSlug) {
      return store.courseWishlist.some((w) => w.userId === userId && w.trackSlug === trackSlug);
    },
    async addWishlist(userId, trackSlug) {
      if (store.courseWishlist.some((w) => w.userId === userId && w.trackSlug === trackSlug)) return;
      store.courseWishlist.push({ userId, trackSlug, createdAt: Date.now() });
    },
    async removeWishlist(userId, trackSlug) {
      const i = store.courseWishlist.findIndex((w) => w.userId === userId && w.trackSlug === trackSlug);
      if (i >= 0) store.courseWishlist.splice(i, 1);
    },

    async listFeedPosts() {
      return [] as FeedPost[];
    },
    async putFeedPost(p) {
      const i = store.feed.findIndex((x) => x.id === p.id);
      if (i >= 0) store.feed[i] = p;
      else store.feed.unshift(p);
      return p;
    },
  } satisfies DbAdapter;
}
