"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export type CourseAnalyticsChartPayload = {
  enrollCount: number;
  graduated: number;
  avgTrackCompletion: number;
  moduleCompletion: { moduleId: string; label: string; pct: number }[];
  quizAverages: { quizId: string; title: string; averagePct: number | null; studentsWithScore: number }[];
  atRiskCount: number;
};

const COLORS = {
  line: "var(--g, #1fc87e)",
  bar: "rgba(31, 200, 126, 0.75)",
  barMuted: "rgba(148, 163, 184, 0.5)",
  risk: "#f87171",
  ok: "rgba(31, 200, 126, 0.85)",
};

export function CourseAnalyticsCharts({ data }: { data: CourseAnalyticsChartPayload }) {
  const { enrollCount, avgTrackCompletion, moduleCompletion, quizAverages, atRiskCount } = data;
  const notAtRisk = Math.max(0, enrollCount - atRiskCount);
  const pieData =
    enrollCount > 0
      ? [
          { name: "On track", value: notAtRisk },
          { name: "Flagged at-risk", value: atRiskCount },
        ]
      : [];

  const lineData = moduleCompletion.map((m, i) => ({
    n: i + 1,
    label: m.label,
    "Completed this lesson (%)": m.pct,
  }));

  const barQuiz = quizAverages
    .filter((q) => q.averagePct != null)
    .map((q) => ({
      name: q.title.length > 24 ? q.title.slice(0, 22) + "…" : q.title,
      "Avg best score (%)": q.averagePct as number,
    }));

  return (
    <div className="space-y-10 mt-2">
      <section>
        <h3 className="font-bold text-base mb-2">Class progress through lessons</h3>
        <p className="text-t3 text-sm mb-3">
          Share of enrolled students who have completed each lesson (in order). Overall avg. completion:{" "}
          <strong>{avgTrackCompletion}%</strong>.
        </p>
        {lineData.length > 0 ? (
          <div className="h-[280px] w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={lineData} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
                <CartesianGrid stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="n" tick={{ fontSize: 11 }} label={{ value: "Lesson #", position: "bottom", offset: 0, fontSize: 11 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} unit="%" />
                <Tooltip
                  contentStyle={{ background: "var(--surface-1, #1a1a1a)", border: "1px solid rgba(255,255,255,0.1)" }}
                  labelFormatter={(_, p) => (p[0] ? `${p[0].payload.label}` : "")}
                />
                <Line type="monotone" dataKey="Completed this lesson (%)" stroke={COLORS.line} strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="text-t3 text-sm">No modules on this course.</p>
        )}
      </section>

      <section>
        <h3 className="font-bold text-base mb-2">Quiz performance</h3>
        <p className="text-t3 text-sm mb-3">Average of each learner’s best attempt per quiz (quizzes use course key {`track:<slug>`}).</p>
        {barQuiz.length > 0 ? (
          <div className="h-[280px] w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barQuiz} margin={{ top: 8, right: 8, left: 0, bottom: 64 }}>
                <CartesianGrid stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-25} textAnchor="end" height={70} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} unit="%" />
                <Tooltip contentStyle={{ background: "var(--surface-1, #1a1a1a)", border: "1px solid rgba(255,255,255,0.1)" }} />
                <Bar dataKey="Avg best score (%)" fill={COLORS.bar} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="text-t3 text-sm">No quiz scores for this course yet. Add quizzes linked to this course key.</p>
        )}
      </section>

      <section>
        <h3 className="font-bold text-base mb-2">At-risk vs on track</h3>
        <p className="text-t3 text-sm mb-3">Heuristic flags (inactivity, low scores, low progress). Enrolled: {enrollCount}.</p>
        {enrollCount > 0 && pieData.length > 0 ? (
          <div className="h-[220px] w-full max-w-md mx-auto">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={i === 0 ? COLORS.ok : COLORS.risk} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: "var(--surface-1, #1a1a1a)", border: "1px solid rgba(255,255,255,0.1)" }} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="text-t3 text-sm">No enrollments to chart.</p>
        )}
      </section>
    </div>
  );
}
