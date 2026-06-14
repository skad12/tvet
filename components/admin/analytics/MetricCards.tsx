import React from "react";

export default function MetricCard({
  title,
  value,
  badge,
  badgeColor = "blue",
  Icon = null, // pass an icon component e.g. FiUsers
}) {
  const colorMap = {
    blue: "bg-blue-50 text-blue-700 border-blue-100",
    green: "bg-emerald-50 text-emerald-700 border-emerald-100",
    cyan: "bg-cyan-50 text-cyan-700 border-cyan-100",
    yellow: "bg-yellow-50 text-yellow-700 border-yellow-100",
    slate: "bg-slate-100 text-slate-700 border-slate-200",
    white: "bg-white text-slate-700 border-slate-200",
  };

  const bgColor = colorMap[badgeColor] || colorMap.blue;

  return (
    <div className="group overflow-hidden rounded-3xl border border-white/70 bg-white/90 p-5 shadow-xl shadow-slate-950/5 transition hover:-translate-y-1 hover:shadow-blue-950/10">
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-3">
          {Icon && (
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/20">
              <Icon className="h-5 w-5" aria-hidden />
            </span>
          )}
          <div className="text-sm font-medium text-slate-500">{title}</div>
        </div>
      </div>

      <div className="mt-5 text-3xl font-bold tracking-tight text-slate-950">
        {value ?? "—"}
      </div>

      <div
        className={`mt-4 inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${bgColor}`}
      >
        {badge}
      </div>
    </div>
  );
}
