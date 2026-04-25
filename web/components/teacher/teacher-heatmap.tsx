"use client";

import React from "react";

export function TeacherHeatmap({ data }: { data: number[][] }) {
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const getColor = (val: number) => {
    if (!val || val === 0) return "bg-white/5";
    if (val <= 1) return "bg-indigo-500/20";
    if (val <= 3) return "bg-indigo-500/50";
    if (val <= 5) return "bg-indigo-400";
    return "bg-indigo-300 shadow-[0_0_8px_rgba(129,140,248,0.8)]";
  };

  return (
    <div className="flex flex-col h-full w-full">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-sm font-bold text-t1 flex items-center gap-2">
          <span className="text-indigo-400">🔥</span> Student Engagement Heatmap
        </h3>
        <span className="text-[10px] uppercase tracking-wider text-t3 font-bold bg-white/5 px-2 py-1 rounded">Past 7 Days</span>
      </div>

      <div className="flex-1 overflow-x-auto scroll-slim pb-2">
        <div className="min-w-[500px]">
          <div className="flex mb-2">
            <div className="w-8 shrink-0"></div>
            {hours.filter(h => h % 3 === 0).map((h) => (
              <div key={h} className="flex-1 text-center text-[10px] text-t3">
                {h === 0 ? "12A" : h < 12 ? `${h}A` : h === 12 ? "12P" : `${h - 12}P`}
              </div>
            ))}
          </div>
          
          <div className="space-y-1">
            {days.map((day, d) => (
              <div key={day} className="flex items-center gap-1">
                <div className="w-8 shrink-0 text-[10px] font-medium text-t3 text-right pr-2">{day}</div>
                <div className="flex flex-1 gap-1">
                  {data[d].map((val, h) => (
                    <div 
                      key={h} 
                      className={`flex-1 aspect-square rounded-[2px] transition-colors hover:ring-1 hover:ring-white/50 cursor-crosshair ${getColor(val)}`}
                      title={`${day} at ${h}:00 - ${val} active students`}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      <div className="mt-4 flex items-center justify-end gap-2 text-[10px] text-t3">
        <span>Less</span>
        <div className="flex gap-1">
          <div className="w-3 h-3 rounded-[2px] bg-white/5"></div>
          <div className="w-3 h-3 rounded-[2px] bg-indigo-500/20"></div>
          <div className="w-3 h-3 rounded-[2px] bg-indigo-500/50"></div>
          <div className="w-3 h-3 rounded-[2px] bg-indigo-400"></div>
          <div className="w-3 h-3 rounded-[2px] bg-indigo-300"></div>
        </div>
        <span>More</span>
      </div>
    </div>
  );
}
