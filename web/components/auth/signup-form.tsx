"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { GoogleSignInCta } from "@/components/auth/google-sign-in-cta";
import { PasswordStrength } from "@/components/auth/password-strength";
import { AuthPasswordInput } from "@/components/auth/auth-password-input";

type Role = "learner" | "teacher" | "teen" | "employer" | "school";

const ROLES: { id: Role; label: string; sub: string }[] = [
  { id: "learner", label: "Learner", sub: "Learn a skill and get hired" },
  { id: "teacher", label: "Volunteer teacher", sub: "Share something useful — no degree required" },
  { id: "teen", label: "Teen (13–18)", sub: "Youth Zone: age-appropriate tracks" },
  { id: "employer", label: "Employer", sub: "Hire verified graduates" },
  { id: "school", label: "School", sub: "Bring SkillRise to your classes" },
];

export function SignupForm({
  showGoogle = false,
  role,
  onRoleChange,
}: {
  showGoogle?: boolean;
  role: Role;
  onRoleChange: (r: Role) => void;
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [age, setAge] = useState("");
  const [company, setCompany] = useState("");
  const [canTeach, setCanTeach] = useState("");
  const [whyHelp, setWhyHelp] = useState("");
  const [introVideoUrl, setIntroVideoUrl] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  return (
    <div>
      <GoogleSignInCta enabled={showGoogle} defaultNext="/onboarding" source="signup" label="Sign up with Google" />
      <p className="text-[13px] text-t2 leading-relaxed mb-5 pl-3 border-l-2 border-g/40">
        With Google you start as a <span className="text-t1 font-semibold">learner</span> with a verified email. Use the form
        below to join as a teacher, employer, teen, or school.
      </p>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setErr("");
          try {
            const res = await fetch("/api/auth/signup", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                role,
                name,
                email,
                password,
                neighborhood,
                age,
                company,
                teacherIntro:
                  role === "teacher"
                    ? {
                        canTeach: canTeach.trim(),
                        whyHelp: whyHelp.trim(),
                        introVideoUrl: introVideoUrl.trim() || undefined,
                      }
                    : undefined,
              }),
            });
            const body = await res.json();
            if (!res.ok) {
              setErr(body.error || "Could not create account.");
              return;
            }
            const dev = (body as { devVerificationLink?: string }).devVerificationLink;
            if (typeof dev === "string" && dev.length > 0) {
              try {
                sessionStorage.setItem("skillrise:devEmailVerificationLink", dev);
              } catch {
                // ignore
              }
            }
            router.push("/verify-email/required");
            router.refresh();
          } finally {
            setBusy(false);
          }
        }}
        className="flex flex-col gap-5"
      >
        <div>
          <div className="label">I&apos;m signing up as</div>
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1 -mx-1 px-1 sm:grid sm:grid-cols-2 sm:overflow-visible sm:gap-2">
            {ROLES.map((r) => (
              <button
                type="button"
                key={r.id}
                onClick={() => onRoleChange(r.id)}
                className={`card card-hover text-left p-3 min-w-[200px] sm:min-w-0 transition-all ${
                  role === r.id ? "ring-2 ring-g/50 border-g/40 shadow-float" : ""
                }`}
              >
                <div className="font-semibold text-[14px] text-t1">{r.label}</div>
                <div className="text-[12px] text-t3 mt-1 leading-snug">{r.sub}</div>
              </button>
            ))}
          </div>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="label" htmlFor="name">
              Full name
            </label>
            <input id="name" required autoComplete="name" className="input" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <label className="label" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              inputMode="email"
              required
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="sm:col-span-2">
            <AuthPasswordInput
              id="password"
              label="Password"
              value={password}
              onChange={setPassword}
              autoComplete="new-password"
              minLength={12}
              footer={
                <>
                  <p className="text-[11px] text-t3 leading-relaxed">
                    At least 12 characters with uppercase, lowercase, a number, and a symbol (for example ! @ # *).
                  </p>
                  <PasswordStrength password={password} />
                </>
              }
            />
          </div>
          <div>
            <label className="label" htmlFor="neighborhood">
              Neighborhood
            </label>
            <input
              id="neighborhood"
              required
              autoComplete="address-level2"
              placeholder="City, state"
              className="input"
              value={neighborhood}
              onChange={(e) => setNeighborhood(e.target.value)}
            />
          </div>
          {role === "teen" && (
            <div>
              <label className="label" htmlFor="age">
                Age (13–18 only)
              </label>
              <input id="age" type="number" min={13} max={18} required className="input" value={age} onChange={(e) => setAge(e.target.value)} />
            </div>
          )}
          {(role === "employer" || role === "school") && (
            <div>
              <label className="label" htmlFor="company">
                {role === "school" ? "School name" : "Company"}
              </label>
              <input id="company" required className="input" value={company} onChange={(e) => setCompany(e.target.value)} />
            </div>
          )}
        </div>

        {role === "teacher" && (
          <div
            className="p-4 rounded-[14px] flex flex-col gap-4"
            style={{
              background: "color-mix(in srgb, var(--g, #1fc87e) 8%, transparent)",
              border: "1px solid color-mix(in srgb, var(--g, #1fc87e) 25%, transparent)",
            }}
          >
            <div>
              <div className="text-[12px] font-bold uppercase tracking-[0.14em] mb-1" style={{ color: "var(--g, #1fc87e)" }}>
                Teaching as a volunteer
              </div>
              <div className="text-[13px]" style={{ color: "var(--text-2, #b5bdc8)" }}>
                No degree required. No formal qualifications. Just something useful you can share in a short video. A plumber can
                teach plumbing. A parent can teach budgeting. A nurse can teach first aid. Your experience counts.
              </div>
            </div>
            <div>
              <label className="label" htmlFor="canTeach">
                What&apos;s one thing you can teach?
              </label>
              <input
                id="canTeach"
                required
                className="input"
                placeholder="e.g. Fixing a running toilet, resume writing, first aid"
                maxLength={200}
                value={canTeach}
                onChange={(e) => setCanTeach(e.target.value)}
              />
            </div>
            <div>
              <label className="label" htmlFor="whyHelp">
                Why do you want to help?
              </label>
              <textarea
                id="whyHelp"
                required
                className="input"
                rows={3}
                placeholder="e.g. Someone showed me this once and it changed things. I want to pass it on."
                maxLength={400}
                value={whyHelp}
                onChange={(e) => setWhyHelp(e.target.value)}
              />
            </div>
            <div>
              <label className="label" htmlFor="introVideoUrl">
                Intro video URL <span className="text-t3 font-normal normal-case">(optional)</span>
              </label>
              <input
                id="introVideoUrl"
                type="url"
                className="input"
                placeholder="https://… (YouTube, Loom, or a short upload)"
                value={introVideoUrl}
                onChange={(e) => setIntroVideoUrl(e.target.value)}
              />
            </div>
          </div>
        )}
        {err ? (
          <div className="pill pill-red w-full justify-center text-center" role="alert" aria-live="polite">
            {err}
          </div>
        ) : null}
        <button type="submit" disabled={busy} className="btn btn-primary btn-xl justify-center w-full">
          {busy ? "Creating your account…" : "Create account — free forever"}
        </button>
        <p className="text-[12px] text-t3 leading-relaxed">
          By signing up you accept our{" "}
          <a href="/privacy" className="text-g font-medium hover:underline underline-offset-2">
            Privacy policy
          </a>
          . Youth accounts are moderated and default to private.
        </p>
      </form>
    </div>
  );
}
