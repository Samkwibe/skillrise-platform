"use client";
import { useState } from "react";
import Link from "next/link";
import { Suspense } from "react";
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
    title: "Platform Administration.",
    desc: "Manage users, content, and system configurations securely.",
    gradient: "from-[#1a1a1a] to-[#0a0a0a]",
    tabLabel: "Admin",
  }
};

export function LoginPortalView({ showGoogle }: { showGoogle: boolean }) {
  const [portal, setPortal] = useState<PortalType>("learner");

  const p = portals[portal];

  return (
    <div className="min-h-screen grid md:grid-cols-2 bg-ink text-t1 transition-colors duration-500">
      {/* Left Pane */}
      <div 
        className={`hidden md:flex flex-col justify-between p-12 bg-gradient-to-br ${p.gradient} border-r border-border1 transition-all duration-700 ease-in-out`}
      >
        <Link href="/" className="font-display text-[22px] font-extrabold text-g">
          Skill<span className="text-t1">Rise</span>
        </Link>
        
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500" key={portal}>
          <div className="mb-4 inline-block px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[11px] font-bold tracking-[0.15em] uppercase text-t2 backdrop-blur-sm">
            {p.tabLabel} Portal
          </div>
          <h2 className="font-display text-[36px] font-extrabold leading-tight mb-3">
            {p.title}
          </h2>
          <p className="text-t2 max-w-[440px] leading-relaxed">
            {p.desc}
          </p>
        </div>

        <div className="text-[12px] text-t3">
          {portal === "learner" ? "100% free for learners. Always." : "Secure portal access."}
        </div>
      </div>

      {/* Right Pane */}
      <div className="p-6 md:p-12 flex items-center">
        <div className="w-full max-w-[420px] mx-auto">
          <Link href="/" className="md:hidden font-display text-[22px] font-extrabold text-g block mb-6">
            Skill<span className="text-t1">Rise</span>
          </Link>
          
          <h1 className="font-display text-[28px] font-extrabold mb-1">Welcome back.</h1>
          <p className="text-t2 text-[14px] mb-6">
            New here?{" "}
            <Link href="/signup" className="text-g underline hover:text-white transition-colors">Create a free account</Link>
          </p>

          {/* Portal Selector */}
          <div className="mb-8">
            <div className="text-[11px] font-bold text-t3 uppercase tracking-[0.1em] mb-3">Select your portal</div>
            <div className="flex flex-wrap gap-1.5 bg-ink2 p-1.5 rounded-lg border border-border1">
              {(Object.keys(portals) as PortalType[]).map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setPortal(key)}
                  className={`flex-1 min-w-[30%] px-3 py-2 rounded-md text-[13px] font-medium transition-all duration-200 ${
                    portal === key 
                      ? "bg-[#1fc87e]/10 text-[#1fc87e] border border-[#1fc87e]/20 shadow-sm" 
                      : "bg-transparent text-t3 border border-transparent hover:text-t1 hover:bg-white/5"
                  }`}
                >
                  {portals[key].tabLabel}
                </button>
              ))}
            </div>
          </div>

          <div key={portal} className="animate-in fade-in duration-500">
            <Suspense fallback={null}>
              <LoginForm showGoogle={showGoogle} portal={portal} />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  );
}
