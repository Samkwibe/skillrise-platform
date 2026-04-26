"use client";
import { useState, useEffect } from "react";

export function TeacherAIInsights({ pendingGradesTotal }: { pendingGradesTotal: number }) {
  const [loading, setLoading] = useState(true);
  const [pregrading, setPregrading] = useState(false);
  const [pregraded, setPregraded] = useState(false);
  const [messaging, setMessaging] = useState(false);
  const [messaged, setMessaged] = useState(false);

  const handlePregrade = () => {
    setPregrading(true);
    setTimeout(() => {
      setPregrading(false);
      setPregraded(true);
    }, 2000);
  };

  const handleMessage = () => {
    setMessaging(true);
    setTimeout(() => {
      setMessaging(false);
      setMessaged(true);
    }, 1500);
  };

  useEffect(() => {
    // Simulate AI analysis delay for the dynamic professional feel
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="card p-6 bg-gradient-to-br from-indigo-900/30 to-purple-900/10 border border-indigo-500/20 backdrop-blur-md overflow-hidden relative shadow-lg shadow-indigo-900/5 transition-all duration-300 hover:border-indigo-500/40">
      <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
        <svg suppressHydrationWarning width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
          <path suppressHydrationWarning d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
        </svg>
      </div>

      <div className="flex items-center gap-3 mb-5">
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-400">
          <svg suppressHydrationWarning width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path suppressHydrationWarning d="M12 2a8 8 0 0 0-8 8c0 5.4 3.6 8 8 12 4.4-4 8-6.6 8-12a8 8 0 0 0-8-8z" />
            <circle suppressHydrationWarning cx="12" cy="10" r="3" />
          </svg>
        </div>
        <h3 className="text-[13px] font-extrabold uppercase tracking-[0.15em] text-indigo-300">AI Insights</h3>
      </div>

      {loading ? (
        <div className="space-y-4 animate-pulse pt-2">
          <div className="h-4 bg-white/5 rounded w-3/4"></div>
          <div className="h-4 bg-white/5 rounded w-full"></div>
          <div className="h-4 bg-white/5 rounded w-5/6"></div>
          <div className="h-4 bg-white/5 rounded w-2/3 mt-6"></div>
        </div>
      ) : (
        <div className="space-y-5 animate-in fade-in duration-500">
          <div className="flex gap-3 items-start">
            <div className="text-[#1fc87e] shrink-0 mt-0.5">
              <svg suppressHydrationWarning width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline suppressHydrationWarning points="22 12 18 12 15 21 9 3 6 12 2 12" />
              </svg>
            </div>
            <div>
              <p className="text-[13px] text-t2 leading-relaxed">
                Class engagement is <strong className="text-[#1fc87e] font-semibold">up 12%</strong> compared to last week. The recent live session drove significant activity.
              </p>
            </div>
          </div>

          {pendingGradesTotal > 0 && (
            <div className="flex gap-3 items-start">
              <div className="text-yellow-400 shrink-0 mt-0.5">
                <svg suppressHydrationWarning width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path suppressHydrationWarning d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                  <path suppressHydrationWarning d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                </svg>
              </div>
              <div>
                <p className="text-[13px] text-t2 leading-relaxed">
                  You have <strong className="text-yellow-400 font-semibold">{pendingGradesTotal} submissions</strong> pending. Want me to draft feedback for the standard sections?
                </p>
                <button 
                  onClick={handlePregrade}
                  disabled={pregrading || pregraded}
                  className={`mt-2 text-[11px] font-bold tracking-wide uppercase transition-colors px-3 py-1.5 rounded-md border flex items-center gap-2
                    ${pregraded ? 'bg-green-500/20 text-green-400 border-green-500/30' : 
                      'text-indigo-300 hover:text-white bg-indigo-500/20 border-indigo-500/30'}`}
                >
                  {pregrading && <span className="w-3 h-3 border-2 border-indigo-300 border-t-transparent rounded-full animate-spin"></span>}
                  {pregraded ? '✓ Pre-grading Complete' : 'Pre-grade submissions'}
                </button>
              </div>
            </div>
          )}

          <div className="flex gap-3 items-start">
            <div className="text-pink-400 shrink-0 mt-0.5">
              <svg suppressHydrationWarning width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle suppressHydrationWarning cx="12" cy="12" r="10" />
                <line suppressHydrationWarning x1="12" y1="8" x2="12" y2="12" />
                <line suppressHydrationWarning x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <div>
              <p className="text-[13px] text-t2 leading-relaxed">
                2 students in your latest course are falling behind on module milestones.
              </p>
              <button 
                onClick={handleMessage}
                disabled={messaging || messaged}
                className={`mt-2 text-[11px] font-bold tracking-wide uppercase transition-colors px-3 py-1.5 rounded-md border flex items-center gap-2
                  ${messaged ? 'bg-green-500/20 text-green-400 border-green-500/30' : 
                    'text-indigo-300 hover:text-white bg-indigo-500/20 border-indigo-500/30'}`}
              >
                {messaging && <span className="w-3 h-3 border-2 border-indigo-300 border-t-transparent rounded-full animate-spin"></span>}
                {messaged ? '✓ Check-in Sent' : 'Send check-in message'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
