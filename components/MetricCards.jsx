import React from "react";

export default function MetricCard({ title, value, badge }) {
  return (
    <div className="bg-white rounded-lg p-5 border border-slate-200 shadow-sm">
      <div className="flex justify-between items-start">
        <div className="text-sm text-slate-500">{title}</div>
      </div>
      <div className="mt-3 text-2xl font-bold text-slate-800">{value}</div>
      <div className="mt-3 inline-block text-xs bg-blue-600 text-white px-2 py-1 rounded-full">
        {badge}
      </div>
    </div>
  );
}
