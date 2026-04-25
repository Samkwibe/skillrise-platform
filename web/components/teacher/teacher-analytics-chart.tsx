"use client";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

export function TeacherAnalyticsChart({ data }: { data: { name: string; active: number; submissions: number; }[] }) {
  return (
    <div className="card p-6 border border-border1 bg-ink2/50 backdrop-blur-sm relative overflow-hidden">
      <div className="flex justify-between items-end mb-6">
        <div>
          <h3 className="text-[14px] font-bold text-t1 mb-1">Engagement & Submissions</h3>
          <p className="text-[12px] text-t3">Past 7 days performance metrics</p>
        </div>
        <div className="flex gap-4">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-[#1fc87e]"></div>
            <span className="text-[11px] text-t2 font-medium">Active Students</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-[#6366f1]"></div>
            <span className="text-[11px] text-t2 font-medium">Submissions</span>
          </div>
        </div>
      </div>
      
      <div className="h-[240px] w-full mt-4">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorActive" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#1fc87e" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#1fc87e" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorSub" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="name" stroke="#4b5563" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="#4b5563" fontSize={12} tickLine={false} axisLine={false} />
            <Tooltip 
              contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', backdropFilter: 'blur(4px)' }}
              itemStyle={{ color: '#e2e8f0', fontSize: '13px' }}
              labelStyle={{ color: '#94a3b8', fontSize: '12px', marginBottom: '4px' }}
            />
            <Area type="monotone" dataKey="active" stroke="#1fc87e" strokeWidth={2} fillOpacity={1} fill="url(#colorActive)" />
            <Area type="monotone" dataKey="submissions" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorSub)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
