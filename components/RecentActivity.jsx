import React from "react";

function getActionText(item) {
  if (item.action) return item.action;
  const status = (item.ticket_status || item.status || "").toLowerCase();
  if (status === "resolved") return "Ticket resolved";
  if (status === "pending") return "Ticket pending";
  if (status === "active") return "Active ticket";
  return "";
}

export default function RecentActivity({ activities = [] }) {
  return (
    <section className="lg:col-span-2 bg-white rounded-lg border border-slate-200 shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-medium text-slate-800">Recent Activity</h3>
      </div>

      {activities.length === 0 ? (
        <div className="py-8 text-center text-sm text-slate-500">
          No recent activity
        </div>
      ) : (
        <ul className="space-y-3">
          {activities.map((r, idx) => {
            const name = r.customer_name ?? r.name ?? "Unknown";
            const actionText = getActionText(r);
            const status = (r.ticket_status ?? r.status ?? "").toLowerCase();
            const time = r.how_long_ago ?? r.ago ?? "";

            // pill color (subtle)
            const pillClass =
              status === "resolved"
                ? "bg-white border border-emerald-200 text-emerald-700"
                : status === "waiting"
                ? "bg-white border border-amber-200 text-amber-700"
                : status === "pending"
                ? "bg-white border border-amber-200 text-amber-700"
                : status === "active"
                ? "bg-white border border-sky-200 text-sky-700"
                : "bg-white border border-slate-200 text-slate-600";

            return (
              <li
                key={idx}
                className="bg-white rounded-lg p-4 border border-slate-200 flex items-center justify-between shadow-sm"
              >
                <div>
                  <div className="font-medium text-slate-800">{name}</div>
                  {actionText && (
                    <div className="text-sm text-slate-500 mt-1">
                      {actionText}
                    </div>
                  )}
                </div>

                <div className="text-right flex flex-col items-end">
                  <span
                    className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-medium ${pillClass}`}
                  >
                    {(r.ticket_status ?? r.status) || "—"}
                  </span>

                  <div className="text-xs text-slate-400 mt-2">{time}</div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
