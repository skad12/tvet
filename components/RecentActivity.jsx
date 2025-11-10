import React from "react";

export default function RecentActivity({ activities }) {
  return (
    <section className="lg:col-span-2 bg-white rounded-lg border shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-medium text-slate-800">Recent Activity</h3>
      </div>
      <ul className="space-y-3">
        {activities.map((r, idx) => (
          <li
            key={idx}
            className="flex items-center justify-between bg-slate-50 rounded p-3 border"
          >
            <div>
              <div className="font-medium text-slate-800">{r.name}</div>
              <div className="text-sm text-slate-500">{r.action}</div>
            </div>
            <div className="text-right">
              <div className="text-xs text-slate-400">{r.ago}</div>
              <div
                className={`mt-2 text-xs px-2 py-1 rounded ${
                  r.status === "resolved"
                    ? "bg-green-50 text-green-700"
                    : r.status === "waiting"
                    ? "bg-yellow-50 text-yellow-700"
                    : "bg-blue-50 text-blue-700"
                }`}
              >
                {r.status}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
