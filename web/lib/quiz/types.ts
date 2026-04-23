/**
 * Quiz + attempt models (Phase 1).
 * Primary use: checkpoints during external video (e.g. YouTube) and end-of-course exams.
 * Storage: pluggable — see DbAdapter quiz methods; Dynamo keys documented in `lib/db/dynamodb.ts`.
 */

export type QuizKind = "checkpoint" | "final";

/** Multiple choice, single correct option */
export type QuizQuestion = {
  id: string;
  prompt: string;
  options: string[];
  /** 0-based index into `options` */
  correctIndex: number;
};

/**
 * A quiz attached to a learning context. `courseKey` matches `stableCourseId(provider, url)` for external courses.
 */
export type Quiz = {
  id: string;
  courseKey: string;
  /** When set, quiz is scoped to this YouTube video (watch page / embed). */
  youtubeVideoId?: string;
  title: string;
  kind: QuizKind;
  /**
   * For `checkpoint` + YouTube: pause and show after this many seconds of watch time.
   * Omitted for `final` or when not time-based.
   */
  triggerAtSec?: number;
  questions: QuizQuestion[];
  /** 0–100; e.g. 70 for a final */
  passPct: number;
  maxAttempts: number;
  createdByUserId: string;
  createdAt: number;
  updatedAt: number;
};

/**
 * One submission for a quiz. `answers[questionId] = selectedOptionIndex`.
 * Attempts are ordered by time; use `listQuizAttemptsForUserQuiz` to enforce maxAttempts.
 */
export type QuizAttempt = {
  id: string;
  quizId: string;
  userId: string;
  courseKey: string;
  startedAt: number;
  completedAt?: number;
  answers: Record<string, number>;
  /** Set when completed */
  scorePct?: number;
  passed?: boolean;
};
