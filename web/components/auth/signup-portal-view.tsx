"use client";
import { useCallback, useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { SignupForm } from "@/components/auth/signup-form";

type Role = "learner" | "teacher" | "teen" | "employer" | "school";

const portals: Record<Role, { title: string; desc: string[]; gradient: string; tag: string }> = {
  learner: {
    title: "Stop scrolling. Start rising.",
    desc: [
      "✓ Free, verified skill tracks — trade, tech, money, care",
      "✓ Local jobs with 90-day hire guarantees",
      "✓ Live sessions, cohorts, AI study assistant",
    ],
    gradient: "from-[#170e00] to-[#2a1a00]",
    tag: "100% free for learners",
  },
  teacher: {
    title: "Share your craft.",
    desc: [
      "✓ Teach what you know in bite-sized modules",
      "✓ Reach eager learners ready to upskill",
      "✓ Build a following and change lives",
    ],
    gradient: "from-[#0a1526] to-[#050b14]",
    tag: "Inspire the next generation",
  },
  teen: {
    title: "Your future, your rules.",
    desc: [
      "✓ Safe, moderated learning tracks",
      "✓ Build skills before you even graduate",
      "✓ Mentorship and real-world advice",
    ],
    gradient: "from-[#0a2626] to-[#051414]",
    tag: "Ages 13–18 only",
  },
  employer: {
    title: "Hire verified talent.",
    desc: [
      "✓ Access graduates with proven, real-world skills",
      "✓ Filter by neighborhood, certifications, and readiness",
      "✓ Skip the noise. Hire the best.",
    ],
    gradient: "from-[#26150a] to-[#140b05]",
    tag: "Build your workforce",
  },
  school: {
    title: "Empower your classrooms.",
    desc: [
      "✓ Seamlessly integrate real-world skills",
      "✓ Advanced analytics and gradebook-friendly workflows",
      "✓ Prepare students for day one on the job",
    ],
    gradient: "from-[#1a0a26] to-[#0d0514]",
    tag: "Partner with us",
  },
};

const ROLE_KEYS: Role[] = ["learner", "teacher", "teen", "employer", "school"];

function isRole(v: string | null): v is Role {
  return v !== null && ROLE_KEYS.includes(v as Role);
}

export function SignupPortalView({
  showGoogle,
  showGitHub,
}: {
  showGoogle: boolean;
  showGitHub: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const queryRole = params.get("role");
  const initialRole: Role = isRole(queryRole) ? queryRole : "learner";

  const [role, setRoleState] = useState<Role>(initialRole);

  useEffect(() => {
    if (isRole(queryRole)) {
      setRoleState(queryRole);
    }
  }, [queryRole]);

  const setRole = useCallback(
    (r: Role) => {
      setRoleState(r);
      const q = new URLSearchParams(params.toString());
      q.set("role", r);
      router.replace(`${pathname}?${q}`, { scroll: false });
    },
    [params, pathname, router],
  );

  const p = portals[role];

  return (
    <div className="min-h-screen grid md:grid-cols-2 bg-ink text-t1 transition-colors duration-500">
      <div
        className={`relative hidden md:flex flex-col justify-between p-12 bg-gradient-to-br ${p.gradient} border-r border-border1 transition-all duration-700 ease-in-out overflow-hidden`}
      >
        <div className="pointer-events-none absolute inset-0 auth-hero-grid opacity-[0.35]" aria-hidden />
        <div className="pointer-events-none absolute -left-16 bottom-1/4 h-72 w-72 rounded-full bg-g/10 blur-3xl" aria-hidden />
        <Link href="/" className="relative font-display text-[22px] font-extrabold text-g">
          Skill<span className="text-t1">Rise</span>
        </Link>
        <div className="relative animate-in fade-in slide-in-from-bottom-4 duration-500" key={role}>
          <div className="mb-4 inline-block px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[11px] font-bold tracking-[0.15em] uppercase text-t2 backdrop-blur-sm">
            {p.tag}
          </div>
          <h2 className="font-display text-[36px] font-extrabold leading-tight mb-4">{p.title}</h2>
          <ul className="text-t2 space-y-3 max-w-[440px] text-[15px] leading-snug">
            {p.desc.map((d, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-g mt-0.5 shrink-0">✓</span>
                <span>{d.replace("✓ ", "")}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="relative text-[12px] text-t3">Join a growing community of rising professionals.</div>
      </div>

      <div className="relative p-6 md:p-12 flex items-center">
        <div
          className={`md:hidden absolute inset-x-0 top-0 h-36 bg-gradient-to-br ${p.gradient} opacity-90 pointer-events-none`}
          aria-hidden
        />
        <div className="w-full max-w-[520px] mx-auto relative z-[1]">
          <Link href="/" className="md:hidden font-display text-[22px] font-extrabold text-g block mb-6 drop-shadow-sm">
            Skill<span className="text-t1">Rise</span>
          </Link>
          <h1 className="font-display text-[28px] font-extrabold mb-1">Create your free account</h1>
          <p className="text-t2 text-[14px] mb-6">
            Already have one?{" "}
            <Link href="/login" className="text-g font-semibold hover:text-t1 transition-colors underline-offset-2 hover:underline">
              Sign in
            </Link>
          </p>

          <div className="auth-form-shell">
            <div className="animate-in fade-in duration-500" key={role}>
              <SignupForm showGoogle={showGoogle} showGitHub={showGitHub} role={role} onRoleChange={setRole} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
