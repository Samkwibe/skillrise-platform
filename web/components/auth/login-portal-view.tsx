"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { LoginForm } from "@/components/auth/login-form";

export type PortalType = "learner" | "teacher" | "employer" | "school" | "teen" | "admin";

const portals: Record<PortalType, { title: string; desc: string; gradient: string; tabLabel: string }> = {
  learner: {
    title: "Sign in and get back to rising.",
    desc: "Pick up where you left off — your modules, cohort, certificates, jobs, and study assistant are waiting.",
    gradient: "from-[#071a10] to-[#0d2a1c]",
    tabLabel: "Learner",
  },
  teacher: {
    title: "Inspire the next generation.",
    desc: "Track your impact. See how your students are mastering the skills you shared.",
    gradient: "from-[#0a1526] to-[#050b14]",
    tabLabel: "Teacher",
  },
  employer: {
    title: "Find your next great hire.",
    desc: "Access pre-screened graduates ready to work and grow your business.",
    gradient: "from-[#26150a] to-[#140b05]",
    tabLabel: "Employer",
  },
  school: {
    title: "Manage your classrooms.",
    desc: "Review analytics, track student progress, and organize your curriculums.",
    gradient: "from-[#1a0a26] to-[#0d0514]",
    tabLabel: "School",
  },
  teen: {
    title: "Your space to learn.",
    desc: "Explore skills safely. Build your future with age-appropriate tracks and mentorship.",
    gradient: "from-[#0a2626] to-[#051414]",
    tabLabel: "Teen",
  },
  admin: {
    title: "Platform administration.",
    desc: "Manage users, content, and system configurations securely.",
    gradient: "from-[#1a1a1a] to-[#0a0a0a]",
    tabLabel: "Admin",
  },
};

const PORTAL_KEYS = Object.keys(portals) as PortalType[];

function isPortalType(v: string | null): v is PortalType {
  return v !== null && PORTAL_KEYS.includes(v as PortalType);
}

export function LoginPortalView({
  showGoogle,
  showGitHub,
}: {
  showGoogle: boolean;
  showGitHub: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const qPortal = searchParams.get("portal");
  const [portal, setPortal] = useState<PortalType>(() => (isPortalType(qPortal) ? qPortal : "learner"));

  useEffect(() => {
    if (isPortalType(qPortal)) {
      setPortal(qPortal);
    }
  }, [qPortal]);

  const syncPortalToUrl = useCallback(
    (next: PortalType) => {
      const q = new URLSearchParams(searchParams.toString());
      q.set("portal", next);
      router.replace(`${pathname}?${q}`, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  const selectPortal = (key: PortalType) => {
    setPortal(key);
    syncPortalToUrl(key);
  };

  const p = portals[portal];

  return (
    <div className="min-h-screen grid md:grid-cols-2 bg-ink text-t1 transition-colors duration-500">
      <div
        className={`relative hidden md:flex flex-col justify-between p-12 bg-gradient-to-br ${p.gradient} border-r border-border1 transition-all duration-700 ease-in-out overflow-hidden`}
      >
        <div className="pointer-events-none absolute inset-0 auth-hero-grid opacity-[0.35]" aria-hidden />
        <div className="pointer-events-none absolute -right-20 top-1/3 h-64 w-64 rounded-full bg-g/10 blur-3xl" aria-hidden />
        <Link href="/" className="relative font-display text-[22px] font-extrabold text-g">
          Skill<span className="text-t1">Rise</span>
        </Link>

        <div className="relative animate-in fade-in slide-in-from-bottom-4 duration-500" key={portal}>
          <div className="mb-4 inline-block px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[11px] font-bold tracking-[0.15em] uppercase text-t2 backdrop-blur-sm">
            {p.tabLabel} portal
          </div>
          <h2 className="font-display text-[36px] font-extrabold leading-tight mb-3">{p.title}</h2>
          <p className="text-t2 max-w-[440px] leading-relaxed text-[15px]">{p.desc}</p>
        </div>

        <div className="relative text-[12px] text-t3">
          {portal === "learner" ? "100% free for learners. Always." : "Secure portal access."}
        </div>
      </div>

      <div className="relative p-6 md:p-12 flex items-center">
        <div
          className={`md:hidden absolute inset-x-0 top-0 h-36 bg-gradient-to-br ${p.gradient} opacity-90 pointer-events-none`}
          aria-hidden
        />
        <div className="w-full max-w-[440px] mx-auto relative z-[1]">
          <Link href="/" className="md:hidden font-display text-[22px] font-extrabold text-g block mb-6 drop-shadow-sm">
            Skill<span className="text-t1">Rise</span>
          </Link>

          <h1 className="font-display text-[28px] font-extrabold mb-1">Welcome back</h1>
          <p className="text-t2 text-[14px] mb-6">
            New here?{" "}
            <Link href="/signup" className="text-g font-semibold hover:text-t1 transition-colors underline-offset-2 hover:underline">
              Create a free account
            </Link>
          </p>

          <div className="mb-6">
            <div className="text-[11px] font-bold text-t3 uppercase tracking-[0.12em] mb-2">Portal</div>
            <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1 -mx-1 px-1 sm:flex-wrap sm:overflow-visible">
              {PORTAL_KEYS.map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => selectPortal(key)}
                  className={`shrink-0 px-3 py-2 rounded-xl text-[12px] font-semibold transition-all duration-200 border ${
                    portal === key
                      ? "bg-g/15 text-g border-g/30 shadow-float"
                      : "bg-s2/80 text-t3 border-border1 hover:text-t1 hover:border-border2"
                  }`}
                >
                  {portals[key].tabLabel}
                </button>
              ))}
            </div>
          </div>

          <div className="auth-form-shell" key={portal}>
            <LoginForm showGoogle={showGoogle} showGitHub={showGitHub} portal={portal} />
          </div>
        </div>
      </div>
    </div>
  );
}
