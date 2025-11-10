import React from "react";

export default function AiPerformance() {
  return (
    <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm text-slate-500">AI Resolution Rate</div>
          <div className="text-2xl font-bold text-slate-800 mt-1">67%</div>
        </div>
        <div className="text-sm text-emerald-600 font-medium">+5%</div>
      </div>

      <div className="mt-4 text-sm text-slate-600">
        <div>
          Auto-resolved: <strong>8 tickets</strong>
        </div>
        <div className="mt-1">
          Escalated to agents: <strong>4 tickets</strong>
        </div>
        <div className="mt-1">
          Avg AI response time: <strong>1.2s</strong>
        </div>
      </div>
    </div>
  );
}
