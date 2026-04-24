import { test, expect, type APIRequestContext, type APIResponse } from "@playwright/test";

/**
 * API integration flow (same cookie/session as browser would use, two isolated contexts):
 * teacher creates assignment → learner enrolls → submits → teacher grades.
 * Requires default seed users (e.g. DATA_STORE=memory) and track `electrical-basics` (John’s course).
 */
test.describe("LMS assignment flow", () => {
  test("enroll → submit assignment → grade (API)", async ({ playwright, baseURL }) => {
    const base = baseURL || "http://127.0.0.1:3000";
    const trackSlug = "electrical-basics";
    const teacher = await playwright.request.newContext({ baseURL: base });
    const learner = await playwright.request.newContext({ baseURL: base });

    const login = async (ctx: APIRequestContext, email: string) => {
      const r: APIResponse = await ctx.post("/api/auth/login", {
        data: { email, password: "demo1234" },
      });
      expect(r.ok(), `Login ${email} failed: ${r.status()}`).toBeTruthy();
    };

    try {
      await login(teacher, "john@skillrise.app");
      const due = Date.now() + 7 * 24 * 60 * 60 * 1000;
      const create = await teacher.post(`/api/teacher/course/${trackSlug}/assignments`, {
        data: JSON.stringify({
          title: `E2E ${Date.now()}`,
          description: "E2E flow",
          dueAt: due,
          pointsPossible: 10,
          attachments: [],
        }),
        headers: { "Content-Type": "application/json" },
      });
      expect(create.ok(), `Create assignment: ${create.status()}`).toBeTruthy();
      const { assignment } = (await create.json()) as { assignment: { id: string } };
      const aid = assignment.id;

      await login(learner, "tanya@skillrise.app");
      const enr = await learner.post("/api/enrollments", {
        data: JSON.stringify({ trackSlug }),
        headers: { "Content-Type": "application/json" },
      });
      if (!enr.ok()) {
        const j = await enr.json().catch(() => ({}));
        if (j?.enrollment) {
          // already enrolled
        } else {
          expect(enr.ok(), `Enroll: ${enr.status()} ${JSON.stringify(j)}`).toBeTruthy();
        }
      }

      const sub = await learner.post(`/api/course/${trackSlug}/assignments/${aid}/submit`, {
        data: JSON.stringify({ textBody: "E2E submission body.", asDraft: false }),
        headers: { "Content-Type": "application/json" },
      });
      expect(sub.ok(), `Submit: ${sub.status()}`).toBeTruthy();

      const list = await teacher.get(`/api/teacher/course/${trackSlug}/assignments/${aid}/submissions`);
      expect(list.ok()).toBeTruthy();
      const { submissions } = (await list.json()) as { submissions: { id: string }[] };
      expect(submissions.length, "at least one submission").toBeGreaterThan(0);
      const sid = submissions[0].id;

      const gr = await teacher.patch(
        `/api/teacher/course/${trackSlug}/assignments/${aid}/submissions/${sid}`,
        {
          data: JSON.stringify({ score: 8, feedback: "E2E feedback", status: "returned" }),
          headers: { "Content-Type": "application/json" },
        },
      );
      expect(gr.ok(), `Grade: ${gr.status()}`).toBeTruthy();
      const out = (await gr.json()) as { submission: { status: string; score: number } };
      expect(out.submission.status).toBe("returned");
      expect(out.submission.score).toBe(8);
    } finally {
      await teacher.dispose();
      await learner.dispose();
    }
  });
});
