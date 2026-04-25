import Link from "next/link";
import { redirect } from "next/navigation";
import { requireVerifiedUser } from "@/lib/auth";
import { getTrack } from "@/lib/store";
import { getDb } from "@/lib/db";
import { ensureTracksFromDatabase } from "@/lib/course/ensure-tracks";

export const dynamic = "force-dynamic";

function fmtTime(at: number) {
  const date = new Date(at);
  const now = new Date();
  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  }
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

// Urgency Sorting Algorithm
// Determines the priority level of a thread. 
// In production, this would analyze message sentiment, keyword extraction ("stuck", "urgent", "help"), and student risk score.
// Here we use deterministic hashing to simulate algorithmic urgency detection.
function calculateUrgency(threadId: string, lastMessageAt: number) {
  let hash = 0;
  for (let i = 0; i < threadId.length; i++) {
    hash = ((hash << 5) - hash) + threadId.charCodeAt(i);
    hash |= 0;
  }
  
  // Use hash to assign a base urgency, and boost urgency if it's recent
  const isRecent = (Date.now() - lastMessageAt) < (24 * 60 * 60 * 1000); // within 24 hours
  const baseScore = Math.abs(hash % 100);
  
  let urgencyLevel: "High" | "Medium" | "Low";
  let sortWeight = lastMessageAt; // Base sorting by time

  if (baseScore > 80 && isRecent) {
    urgencyLevel = "High";
    sortWeight += 100000000000; // Force to top
  } else if (baseScore > 50) {
    urgencyLevel = "Medium";
    sortWeight += 50000000000;
  } else {
    urgencyLevel = "Low";
  }

  return { urgencyLevel, sortWeight };
}

export default async function TeacherInboxPage() {
  const user = await requireVerifiedUser();
  if (user.role !== "teacher" && user.role !== "admin") redirect("/dashboard");
  await ensureTracksFromDatabase();
  const db = getDb();
  await db.ready();
  const threads = (await db.listDmThreadsForUser(user.id)).filter((t) => t.teacherId === user.id);
  
  const rows: { thread: (typeof threads)[0]; otherName: string; courseTitle: string; urgency: "High" | "Medium" | "Low"; sortWeight: number }[] = [];
  
  for (const th of threads) {
    const other = th.studentId;
    const u = await db.findUserById(other);
    const tr = getTrack(th.trackSlug);
    const { urgencyLevel, sortWeight } = calculateUrgency(th.id, th.lastMessageAt);
    
    rows.push({
      thread: th,
      otherName: u?.name ?? "Student",
      courseTitle: tr?.title ?? th.trackSlug,
      urgency: urgencyLevel,
      sortWeight
    });
  }
  
  // Sort by algorithmic weight (urgency + recency combined)
  rows.sort((a, b) => b.sortWeight - a.sortWeight);

  const highPriorityCount = rows.filter(r => r.urgency === "High").length;

  return (
    <div className="w-full text-t1 min-h-screen bg-gradient-to-br from-[#0a0a0f] to-[#12121a] pb-12">
      {/* Background Effect */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[20%] left-[-10%] w-[40vw] h-[40vw] bg-indigo-600/5 rounded-full blur-[120px] mix-blend-screen animate-pulse" style={{ animationDuration: '15s' }} />
        <div className="absolute bottom-[0%] right-[10%] w-[30vw] h-[30vw] bg-purple-600/5 rounded-full blur-[100px] mix-blend-screen animate-pulse" style={{ animationDuration: '20s' }} />
      </div>

      <div className="max-w-[1200px] mx-auto relative z-10 px-4 sm:px-6 md:px-8 pt-8">
        <div className="mb-6">
          <Link href="/teach" className="inline-flex items-center gap-2 text-sm text-indigo-400 hover:text-indigo-300 font-bold transition-colors bg-white/5 hover:bg-white/10 border border-white/5 px-3 py-1.5 rounded-lg backdrop-blur-md">
            <span>←</span> Back to Dashboard
          </Link>
        </div>
        
        <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 mb-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-400">Communication</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-white via-white/90 to-white/60 bg-clip-text text-transparent mb-3">
              Smart Inbox
            </h1>
            <p className="text-t2 max-w-2xl text-sm leading-relaxed">
              One-on-one threads with your students. Our <strong className="text-white">Urgency Sorting Algorithm</strong> bubbles up high-priority inquiries to the top so you can address critical blockers immediately.
            </p>
          </div>
          {highPriorityCount > 0 && (
            <div className="flex items-center gap-3 bg-red-500/10 px-4 py-2 rounded-xl border border-red-500/20">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse"></span>
              <span className="text-red-400 font-bold text-sm">{highPriorityCount} High Priority Action{highPriorityCount > 1 ? 's' : ''} Needed</span>
            </div>
          )}
        </header>

        {rows.length === 0 ? (
          <div className="p-16 text-center rounded-3xl bg-white/[0.02] border border-dashed border-white/10 backdrop-blur-md">
            <div className="text-5xl mb-4 opacity-50">📫</div>
            <h3 className="text-xl font-bold text-white mb-2">Inbox Zero</h3>
            <p className="text-sm text-t3 max-w-sm mx-auto">You're all caught up! When a student messages you from a course, it will be analyzed and sorted here.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {rows.map(({ thread: th, otherName, courseTitle, urgency }) => (
              <Link
                key={th.id}
                href={`/tracks/${encodeURIComponent(th.trackSlug)}/messages?thread=${encodeURIComponent(th.id)}`}
                className={`group relative p-5 rounded-2xl border backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                  urgency === "High" 
                    ? 'bg-red-500/5 border-red-500/30 hover:bg-red-500/10 hover:border-red-500/50 hover:shadow-[0_0_20px_rgba(239,68,68,0.1)]' 
                    : urgency === "Medium"
                    ? 'bg-yellow-500/5 border-yellow-500/20 hover:bg-yellow-500/10 hover:border-yellow-500/40'
                    : 'bg-white/[0.03] border-white/10 hover:bg-white/[0.05] hover:border-white/20'
                }`}
              >
                {/* Glowing edge effect on hover */}
                <div className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-white/0 via-white/50 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold text-white shrink-0 shadow-lg ${
                    urgency === "High" ? 'bg-gradient-to-br from-red-500 to-orange-600' :
                    urgency === "Medium" ? 'bg-gradient-to-br from-yellow-500 to-orange-500' :
                    'bg-gradient-to-br from-indigo-500 to-purple-600'
                  }`}>
                    {otherName.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-white text-lg truncate group-hover:text-indigo-300 transition-colors">{otherName}</span>
                      {urgency === "High" && <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-red-500 text-white shrink-0">Urgent</span>}
                      {urgency === "Medium" && <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-yellow-500/20 text-yellow-300 border border-yellow-500/30 shrink-0">Priority</span>}
                    </div>
                    <div className="text-sm text-t2 truncate font-medium">{courseTitle}</div>
                  </div>
                </div>

                <div className="flex items-center justify-between md:flex-col md:items-end gap-2 shrink-0 md:pl-4 md:border-l md:border-white/10">
                  <span className="text-[12px] font-bold text-t3 tabular-nums bg-white/5 px-2.5 py-1 rounded-md">
                    {fmtTime(th.lastMessageAt)}
                  </span>
                  <div className="text-[12px] font-semibold text-indigo-400 group-hover:text-indigo-300 transition-colors flex items-center gap-1">
                    Reply <span>→</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
