"use client";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { GoogleSignInCta } from "@/components/auth/google-sign-in-cta";

type Role = "learner" | "teacher" | "teen" | "employer" | "school";

const ROLES: { id: Role; label: string; sub: string }[] = [
  { id: "learner", label: "Learner", sub: "I want to learn a skill and get hired" },
  { id: "teacher", label: "Volunteer teacher", sub: "No degree required — just something useful to share" },
  { id: "teen", label: "Teen (13–18)", sub: "Youth Zone: age-gated tracks built for you" },
  { id: "employer", label: "Employer", sub: "I want to hire graduates" },
  { id: "school", label: "School", sub: "I want classes using SkillRise" },
];

export function SignupForm({ showGoogle = false }: { showGoogle?: boolean }) {
  const router = useRouter();
  const params = useSearchParams();
  const queryRole = (params.get("role") as Role | null) ?? null;
  const validRoles: Role[] = ["learner", "teacher", "teen", "employer", "school"];
  const initialRole: Role = queryRole && validRoles.includes(queryRole) ? queryRole : "learner";
  const [role, setRole] = useState<Role>(initialRole);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [age, setAge] = useState("");
  const [company, setCompany] = useState("");
  // Teacher onboarding — deliberately simple. No credentials gate.
  const [canTeach, setCanTeach] = useState("");
  const [whyHelp, setWhyHelp] = useState("");
  const [introVideoUrl, setIntroVideoUrl] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  return (
    <div>
      <GoogleSignInCta
        enabled={showGoogle}
        defaultNext="/onboarding"
        source="signup"
        label="Sign up with Google"
      />
      <p className="text-[12px] text-t3 mb-5">
        With Google, you start as a <span className="text-t1 font-medium">learner</span> with a verified email. Use
        the form below to join as a teacher, employer, teen, or school.
      </p>
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setErr("");
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
        setBusy(false);
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
        // Email must be verified before the full app; same flow for every role.
        router.push("/verify-email/required");
        router.refresh();
      }}
      className="flex flex-col gap-5"
    >
      <div>
        <div className="label">I'm signing up as</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {ROLES.map((r) => (
            <button
              type="button"
              key={r.id}
              onClick={() => setRole(r.id)}
              className={`card card-hover text-left p-3 ${role === r.id ? "border-g" : ""}`}
              style={role === r.id ? { borderColor: "#1fc87e" } : {}}
            >
              <div className="font-semibold text-[14px]">{r.label}</div>
              <div className="text-[12px] text-t3 mt-[2px]">{r.sub}</div>
            </button>
          ))}
        </div>
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="label" htmlFor="name">Full name</label>
          <input id="name" required className="input" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <label className="label" htmlFor="email">Email</label>
          <input id="email" type="email" autoComplete="email" required className="input" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div>
          <label className="label" htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            minLength={12}
            autoComplete="new-password"
            required
            className="input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <p className="text-[11px] text-t3 leading-relaxed">
            At least 12 characters with uppercase, lowercase, a number, and a symbol (e.g. !@#*).
          </p>
        </div>
        <div>
          <label className="label" htmlFor="neighborhood">Neighborhood</label>
          <input id="neighborhood" required placeholder="City, state" className="input" value={neighborhood} onChange={(e) => setNeighborhood(e.target.value)} />
        </div>
        {role === "teen" && (
          <div>
            <label className="label" htmlFor="age">Age (13–18 only)</label>
            <input id="age" type="number" min={13} max={18} required className="input" value={age} onChange={(e) => setAge(e.target.value)} />
          </div>
        )}
        {(role === "employer" || role === "school") && (
          <div>
            <label className="label" htmlFor="company">{role === "school" ? "School name" : "Company"}</label>
            <input id="company" required className="input" value={company} onChange={(e) => setCompany(e.target.value)} />
          </div>
        )}
      </div>

      {/* Teacher: a welcoming, 3-field intro. No credentials gate. */}
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
              No degree required. No formal qualifications. Just something useful you can share
              in a 5-minute video. A plumber can teach plumbing. A parent can teach budgeting.
              A nurse can teach first aid. Your experience counts.
            </div>
          </div>
          <div>
            <label className="label" htmlFor="canTeach">What's one thing you can teach?</label>
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
            <label className="label" htmlFor="whyHelp">Why do you want to help?</label>
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
              Intro video URL <span className="text-t3">(optional)</span>
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
      {err && <div className="pill pill-red">{err}</div>}
      <button type="submit" disabled={busy} className="btn btn-primary btn-xl justify-center">
        {busy ? "Creating your account…" : "Create account (free forever)"}
      </button>
      <p className="text-[12px] text-t3">
        By signing up you accept our <a href="/privacy" className="underline">Privacy policy</a>. Youth accounts are moderated and default to private.
      </p>
    </form>
    </div>
  );
}
