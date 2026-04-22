"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LIFE_CATEGORIES, STRUGGLE_OPTIONS, type LifeCategory, type OnboardingAnswers } from "@/lib/store";

type Props = {
  user: { id: string; name: string; role: string };
  existing: OnboardingAnswers | null;
};

/**
 * Four-step onboarding. Not a quiz — a conversation. Every step is skippable.
 * The copy is deliberately warm: we are not interrogating the user, we are
 * asking how we can help. The default for every field is "skip" and still works.
 */
function humanField(path: string): string {
  switch (path) {
    case "struggles":
      return "Struggles";
    case "interests":
      return "Interests";
    case "hasDiploma":
      return "Diploma";
    case "timePerDay":
      return "Time per day";
    case "freeText":
      return "Note";
    default:
      return path;
  }
}

export function OnboardingFlow({ user, existing }: Props) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [struggles, setStruggles] = useState<string[]>(existing?.struggles ?? []);
  const [interests, setInterests] = useState<LifeCategory[]>(existing?.interests ?? []);
  const [hasDiploma, setHasDiploma] = useState<boolean | null>(existing?.hasDiploma ?? null);
  const [timePerDay, setTimePerDay] = useState<5 | 15 | 30 | 60>(existing?.timePerDay ?? 15);
  const [freeText, setFreeText] = useState(existing?.freeText ?? "");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const forTeens = user.role === "teen";
  const categoryOptions = LIFE_CATEGORIES.filter((c) => (forTeens ? c.forTeens : true));

  function toggle<T>(arr: T[], setArr: (v: T[]) => void, v: T) {
    setArr(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);
  }

  async function save(skip = false) {
    setSaving(true);
    setErr("");
    const res = await fetch("/api/me/onboarding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(
        skip
          ? { struggles: [], interests: [], hasDiploma: null, timePerDay: 15 }
          : { struggles, interests, hasDiploma, timePerDay, freeText: freeText.trim() || undefined },
      ),
    });
    setSaving(false);
    if (!res.ok) {
      const body: {
        error?: string;
        issues?: { field?: string; message: string }[];
      } = await res.json().catch(() => ({}));
      // Surface the first field-level issue if the server sent one — that
      // is almost always more useful than the generic "Validation failed".
      const issue = body.issues?.[0];
      if (issue?.message) {
        const label = issue.field ? `${humanField(issue.field)}: ` : "";
        setErr(`${label}${issue.message}`);
      } else {
        setErr(body.error ?? "Could not save. Try again?");
      }
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  const steps = [
    {
      title: "What's one thing you're struggling with right now?",
      subtitle: "Pick as many as you want. Nothing you choose is wrong.",
      body: (
        <div className="flex flex-wrap gap-2">
          {STRUGGLE_OPTIONS.map((s) => {
            const active = struggles.includes(s.id);
            return (
              <button
                type="button"
                key={s.id}
                onClick={() => toggle(struggles, setStruggles, s.id)}
                className="px-4 py-2.5 rounded-full text-[14px] font-semibold transition-all"
                style={{
                  background: active ? "var(--g)" : "var(--surface-2)",
                  color: active ? "var(--bg)" : "var(--text-1)",
                  border: `1px solid ${active ? "var(--g)" : "var(--border-1)"}`,
                }}
              >
                {s.label}
              </button>
            );
          })}
        </div>
      ),
    },
    {
      title: "What do you want to learn?",
      subtitle: "Pick whatever sparks interest. You can add or change these any time.",
      body: (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {categoryOptions.map((c) => {
            const active = interests.includes(c.id);
            return (
              <button
                type="button"
                key={c.id}
                onClick={() => toggle(interests, setInterests, c.id)}
                className="text-left p-4 rounded-[14px] transition-all"
                style={{
                  background: active ? "color-mix(in srgb, var(--g) 14%, var(--surface-1))" : "var(--surface-1)",
                  border: `1px solid ${active ? "var(--g)" : "var(--border-1)"}`,
                }}
              >
                <div className="text-[22px] mb-1">{c.emoji}</div>
                <div className="font-bold text-[14px]">{c.label}</div>
                <div className="text-[12px] mt-0.5" style={{ color: "var(--text-3)" }}>
                  {c.blurb}
                </div>
              </button>
            );
          })}
        </div>
      ),
    },
    {
      title: "Do you have a high school diploma or GED?",
      subtitle: "This just helps us show the right jobs. It doesn't affect what you can learn — everything on SkillRise is open to you.",
      body: (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-[560px]">
          {[
            { value: true as const, label: "Yes", sub: "Diploma, GED, or equivalent" },
            { value: false as const, label: "Not yet", sub: "We'll focus on jobs that don't need one" },
            { value: null, label: "Prefer not to say", sub: "Totally fine" },
          ].map((o) => {
            const active = hasDiploma === o.value;
            return (
              <button
                type="button"
                key={String(o.value)}
                onClick={() => setHasDiploma(o.value)}
                className="text-left p-4 rounded-[14px]"
                style={{
                  background: active ? "color-mix(in srgb, var(--g) 14%, var(--surface-1))" : "var(--surface-1)",
                  border: `1px solid ${active ? "var(--g)" : "var(--border-1)"}`,
                }}
              >
                <div className="font-bold text-[14px]">{o.label}</div>
                <div className="text-[12px]" style={{ color: "var(--text-3)" }}>{o.sub}</div>
              </button>
            );
          })}
        </div>
      ),
    },
    {
      title: "How much time can you give it a day?",
      subtitle: "Be honest — small + consistent beats big + never.",
      body: (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-[560px]">
          {([5, 15, 30, 60] as const).map((m) => {
            const active = timePerDay === m;
            return (
              <button
                type="button"
                key={m}
                onClick={() => setTimePerDay(m)}
                className="p-4 rounded-[14px] text-center"
                style={{
                  background: active ? "color-mix(in srgb, var(--g) 14%, var(--surface-1))" : "var(--surface-1)",
                  border: `1px solid ${active ? "var(--g)" : "var(--border-1)"}`,
                }}
              >
                <div className="font-extrabold text-[22px]" style={{ color: active ? "var(--g)" : "var(--text-1)" }}>
                  {m}
                </div>
                <div className="text-[12px]" style={{ color: "var(--text-3)" }}>min / day</div>
              </button>
            );
          })}
        </div>
      ),
    },
  ];

  const current = steps[step];
  const isLast = step === steps.length - 1;

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "var(--bg, #0a0f14)", color: "var(--text-1, #f7f7f8)" }}
    >
      <header className="px-5 md:px-10 py-5 flex items-center justify-between">
        <Link href="/" className="font-extrabold text-[18px] tracking-tight">
          Skill<span style={{ color: "var(--g, #1fc87e)" }}>Rise</span>
        </Link>
        <button
          type="button"
          onClick={() => save(true)}
          className="text-[13px] underline"
          style={{ color: "var(--text-3, #98a1ae)" }}
        >
          Skip for now
        </button>
      </header>

      <main className="flex-1 flex items-start md:items-center justify-center px-5 md:px-8 py-4 md:py-8">
        <div className="w-full max-w-[880px]">
          {/* progress dots */}
          <div className="flex items-center gap-2 mb-6">
            {steps.map((_, i) => (
              <div
                key={i}
                className="h-1.5 rounded-full flex-1 transition-colors"
                style={{ background: i <= step ? "var(--g, #1fc87e)" : "var(--surface-2, #17202b)" }}
              />
            ))}
          </div>

          <div className="mb-2 text-[12px] uppercase tracking-[0.14em] font-bold" style={{ color: "var(--text-3, #98a1ae)" }}>
            Welcome, {user.name.split(" ")[0]} · Step {step + 1} of {steps.length}
          </div>
          <h1 className="font-extrabold text-[26px] md:text-[34px] leading-tight mb-2">
            {current.title}
          </h1>
          <p className="text-[14.5px] mb-6" style={{ color: "var(--text-2, #b5bdc8)" }}>
            {current.subtitle}
          </p>

          <div className="mb-8">{current.body}</div>

          {isLast && (
            <div className="mb-6">
              <label className="block text-[13px] font-semibold mb-1.5" style={{ color: "var(--text-2)" }}>
                Anything you want us to know? (optional)
              </label>
              <textarea
                value={freeText}
                onChange={(e) => setFreeText(e.target.value)}
                rows={3}
                maxLength={400}
                placeholder="e.g. I'm looking for a job that doesn't need a diploma."
                className="w-full rounded-[12px] p-3 text-[14px]"
                style={{
                  background: "var(--surface-1)",
                  border: "1px solid var(--border-1)",
                  color: "var(--text-1)",
                }}
              />
            </div>
          )}

          {err && (
            <div
              className="mb-4 px-3 py-2 rounded-[10px] text-[13px]"
              style={{ background: "rgba(227,75,75,0.12)", color: "#ffb0b0", border: "1px solid rgba(227,75,75,0.25)" }}
            >
              {err}
            </div>
          )}

          <div className="flex items-center gap-3 flex-wrap">
            <button
              type="button"
              disabled={step === 0 || saving}
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              className="px-4 py-2.5 rounded-full text-[14px] font-semibold disabled:opacity-40"
              style={{ background: "var(--surface-2)", color: "var(--text-1)", border: "1px solid var(--border-1)" }}
            >
              ← Back
            </button>
            {!isLast ? (
              <button
                type="button"
                onClick={() => setStep((s) => Math.min(steps.length - 1, s + 1))}
                className="px-6 py-2.5 rounded-full text-[14px] font-bold"
                style={{ background: "var(--g, #1fc87e)", color: "var(--bg, #0a0f14)" }}
              >
                Continue →
              </button>
            ) : (
              <button
                type="button"
                disabled={saving}
                onClick={() => save(false)}
                className="px-6 py-2.5 rounded-full text-[14px] font-bold"
                style={{ background: "var(--g, #1fc87e)", color: "var(--bg, #0a0f14)" }}
              >
                {saving ? "Saving…" : "See my dashboard →"}
              </button>
            )}
          </div>

          <div className="mt-8 text-[12px]" style={{ color: "var(--text-3)" }}>
            This stays private. You can edit these answers any time from your profile.
          </div>
        </div>
      </main>
    </div>
  );
}
