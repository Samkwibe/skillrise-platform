"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useToast } from "@/components/ui/toast";


/** Shape sent down from the server — kept minimal so the drawer stays portable. */
export type CandidateData = {
  id: string;
  applicantName: string;
  applicantInitials: string;
  applicantAvatar: string;
  email: string;
  neighborhood: string;
  role: string;
  note: string;
  appliedAt: number;
  status: "submitted" | "reviewed" | "interview" | "offered" | "hired" | "rejected";
  certificates: Array<{ id: string; track: string; issuedAt: number }>;
  skills: string[];
  matchedSkills: string[];
};

export type KanbanCardBinding = {
  appId: string;
  data: CandidateData;
};

const STAGE_ORDER: CandidateData["status"][] = [
  "submitted",
  "reviewed",
  "interview",
  "offered",
  "hired",
  "rejected",
];

const STAGE_LABEL: Record<CandidateData["status"], string> = {
  submitted: "Applied",
  reviewed: "Shortlisted",
  interview: "Interview",
  offered: "Offered",
  hired: "Hired",
  rejected: "Rejected",
};

export function CandidateDrawerProvider({
  children,
  cards,
}: {
  children: React.ReactNode;
  cards: KanbanCardBinding[];
}) {
  const [openData, setOpenData] = useState<CandidateData | null>(null);
  const router = useRouter();
  const toast = useToast();

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ appId: string }>).detail;
      const found = cards.find((c) => c.appId === detail.appId);
      if (found) setOpenData(found.data);
    };
    window.addEventListener("candidate:open" as keyof WindowEventMap, handler as EventListener);
    return () =>
      window.removeEventListener("candidate:open" as keyof WindowEventMap, handler as EventListener);
  }, [cards]);

  useEffect(() => {
    if (!openData) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenData(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openData]);

  const setStatus = async (status: CandidateData["status"]) => {
    if (!openData) return;
    try {
      const res = await fetch(`/api/applications/${openData.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("patch failed");
      toast.push({
        kind: "success",
        title: `Moved to ${STAGE_LABEL[status]}`,
        description: `${openData.applicantName}'s application updated.`,
      });
      setOpenData({ ...openData, status });
      router.refresh();
    } catch {
      toast.push({
        kind: "error",
        title: "Couldn't update",
        description: "Try again in a moment.",
      });
    }
  };

  return (
    <>
      {children}
      {openData && (
        <div
          className="fixed inset-0 z-[80]"
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpenData(null);
          }}
          style={{ background: "rgba(15,23,42,0.45)", backdropFilter: "blur(3px)" }}
        >
          <aside
            role="dialog"
            aria-modal="true"
            className="absolute right-0 top-0 h-full w-full sm:w-[480px] overflow-y-auto animate-fade-in-up bg-slate-900/80 backdrop-blur-2xl text-white"
            style={{
              borderLeft: "1px solid rgba(255,255,255,0.1)",
              boxShadow: "-30px 0 80px rgba(0,0,0,0.5)",
            }}
          >
            <div className="flex items-center justify-between px-5 py-3 border-b border-white/10">
              <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-white/40">
                Candidate
              </div>
              <div className="flex items-center gap-2">
                <span
                  className="text-[11px] font-bold px-2 py-0.5 rounded-full"
                  style={{
                    background: "color-mix(in srgb, #34d399 12%, transparent)",
                    color: "#34d399",
                  }}
                >
                  {STAGE_LABEL[openData.status]}
                </span>
                <button
                  type="button"
                  aria-label="Close"
                  onClick={() => setOpenData(null)}
                  className="w-7 h-7 rounded-full flex items-center justify-center text-[18px] leading-none hover:bg-white/10 text-white/70"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="p-5">
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center font-bold text-[20px]"
                  style={{
                    background: `linear-gradient(135deg, #34d399, #60a5fa)`,
                    color: "#fff",
                  }}
                >
                  {openData.applicantInitials}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[17px] font-extrabold leading-tight">{openData.applicantName}</div>
                  <div className="text-[12.5px] text-white/70">
                    {openData.neighborhood}
                  </div>
                  <div className="text-[12px] mt-0.5 truncate text-white/40">
                    {openData.email}
                  </div>
                </div>
              </div>

              <div
                className="rounded-[10px] p-3 mb-4 bg-white/[0.03] border border-white/10"
              >
                <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-white/40">
                  Applying for
                </div>
                <div className="text-[14px] font-semibold mt-0.5">{openData.role}</div>
                <div className="text-[11.5px] mt-0.5 text-white/40">
                  Submitted {new Date(openData.appliedAt).toLocaleDateString()}
                </div>
              </div>

              <section className="mb-5">
                <div className="text-[11px] font-bold uppercase tracking-[0.12em] mb-2 text-white/40">
                  Match score
                </div>
                <MatchBar
                  matched={openData.matchedSkills.length}
                  total={Math.max(openData.skills.length, openData.matchedSkills.length, 1)}
                />
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {openData.skills.map((s) => {
                    const matched = openData.matchedSkills.includes(s);
                    return (
                      <span
                        key={s}
                        className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                        style={{
                          background: matched
                            ? "rgba(52,211,153,0.15)"
                            : "rgba(255,255,255,0.05)",
                          color: matched ? "#34d399" : "rgba(255,255,255,0.4)",
                          border: matched ? "1px solid rgba(52,211,153,0.3)" : "1px solid rgba(255,255,255,0.1)",
                        }}
                      >
                        {matched ? "✓ " : ""}
                        {s}
                      </span>
                    );
                  })}
                </div>
              </section>

              {openData.certificates.length > 0 && (
                <section className="mb-5">
                  <div className="text-[11px] font-bold uppercase tracking-[0.12em] mb-2 text-white/40">
                    Verified certificates
                  </div>
                  <div className="flex flex-col gap-1.5">
                    {openData.certificates.map((c) => (
                      <Link
                        key={c.id}
                        href={`/verify/${c.id}`}
                        className="flex items-center gap-2 p-2 rounded-[8px] bg-white/[0.03] border border-white/10"
                      >
                        <span className="text-[18px]">🏅</span>
                        <span className="flex-1 text-[13px] font-semibold">{c.track}</span>
                        <span className="text-[11px] text-white/40">
                          {new Date(c.issuedAt).toLocaleDateString()}
                        </span>
                      </Link>
                    ))}
                  </div>
                </section>
              )}

              <section className="mb-5">
                <div className="text-[11px] font-bold uppercase tracking-[0.12em] mb-2 text-white/40">
                  Candidate note
                </div>
                <div
                  className="text-[13px] leading-relaxed p-3 rounded-[8px] bg-white/[0.03] border border-white/10 text-white/70"
                >
                  {openData.note || <span className="text-white/40">No note left.</span>}
                </div>
              </section>

              <section>
                <div className="text-[11px] font-bold uppercase tracking-[0.12em] mb-2 text-white/40">
                  Move to stage
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {STAGE_ORDER.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setStatus(s)}
                      disabled={s === openData.status}
                      className="text-[12px] font-semibold px-3 py-1.5 rounded-full disabled:opacity-100 disabled:cursor-default"
                      style={{
                        background: s === openData.status ? "#34d399" : "rgba(255,255,255,0.05)",
                        color: s === openData.status ? "#000" : "rgba(255,255,255,0.7)",
                        border: s === openData.status ? "1px solid #34d399" : "1px solid rgba(255,255,255,0.1)",
                      }}
                    >
                      {STAGE_LABEL[s]}
                    </button>
                  ))}
                </div>
              </section>

              <div className="flex gap-2 mt-6">
                <a
                  href={`mailto:${openData.email}`}
                  className="btn btn-primary btn-sm flex-1 justify-center"
                >
                  Email candidate
                </a>
                <button
                  type="button"
                  onClick={() => setStatus("rejected")}
                  className="btn btn-ghost btn-sm text-red-400 border-red-500/40 hover:bg-red-500/10"
                >
                  Reject
                </button>
              </div>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}

function MatchBar({ matched, total }: { matched: number; total: number }) {
  const pct = Math.round((matched / total) * 100);
  return (
    <div>
      <div className="flex items-baseline justify-between mb-1">
        <div className="text-[22px] font-extrabold" style={{ color: pct > 60 ? "#34d399" : "#fbbf24" }}>
          {pct}%
        </div>
        <div className="text-[11.5px] text-white/40">
          {matched} of {total} skills matched
        </div>
      </div>
      <div className="h-2 rounded-full overflow-hidden bg-white/10">
        <div
          className="h-full rounded-full"
          style={{
            width: `${pct}%`,
            background: `linear-gradient(90deg, ${pct > 60 ? "#34d399" : "#fbbf24"}, ${pct > 60 ? "#60a5fa" : "#f87171"})`,
            transition: "width 0.6s ease",
          }}
        />
      </div>
    </div>
  );
}

/**
 * Button that opens the candidate drawer for a given application id. Designed
 * to wrap the kanban card content on the employer dashboard.
 */
export function CandidateCardButton({
  appId,
  children,
  className,
}: {
  appId: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={() =>
        window.dispatchEvent(new CustomEvent("candidate:open", { detail: { appId } }))
      }
      className={`text-left w-full ${className ?? ""}`}
    >
      {children}
    </button>
  );
}
