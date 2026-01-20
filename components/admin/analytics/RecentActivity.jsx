import React, { useMemo, useState } from "react";
import { calculateResolutionTime } from "@/lib/resolutionTime";

function getActionText(item) {
  if (item.action) return item.action;
  const status = (item.ticket_status || item.status || "").toLowerCase();
  if (status === "resolved") return "Ticket resolved";
  if (status === "pending") return "Ticket pending";
  if (status === "active") return "Active ticket";
  return "";
}

export default function RecentActivity({ activities = [] }) {
  const [activeTab, setActiveTab] = useState("all");

  const TABS = [
    { id: "all", label: "All" },
    { id: "active", label: "Active" },
    { id: "pending", label: "Pending" },
    { id: "resolved", label: "Resolved" },
  ];

  // derive counts (optional) and filtered list
  const counts = useMemo(() => {
    const map = { all: activities.length, active: 0, pending: 0, resolved: 0 };
    activities.forEach((a) => {
      const s = (a.ticket_status ?? a.status ?? "").toLowerCase();
      if (s === "active") map.active++;
      else if (s === "pending" || s === "waiting") map.pending++;
      else if (s === "resolved") map.resolved++;
    });
    return map;
  }, [activities]);

  const filtered = useMemo(() => {
    if (!activeTab || activeTab === "all") return activities;
    return activities.filter((a) => {
      const s = (a.ticket_status ?? a.status ?? "").toLowerCase();
      if (activeTab === "pending") return s === "pending" || s === "waiting";
      return s === activeTab;
    });
  }, [activities, activeTab]);

  return (
    <section className="lg:col-span-2 bg-white rounded-lg border border-slate-200 shadow-sm">
      {/* scroll container: header + tabs are sticky within this container */}
      <div className="h-[520px] md:h-[420px] overflow-auto">
        {/* Sticky header */}
        <div className="sticky top-0 z-30 bg-white border-b border-slate-200">
          <div className="flex items-center justify-between p-4">
            <h3 className="text-xl font-medium text-slate-800">
              Recent Activity
            </h3>
            <div className="text-sm text-slate-500">
              {activities.length === 0
                ? "No activity"
                : `${activities.length} items`}
            </div>
          </div>

          {/* Tabs bar (horizontally scrollable on small screens) */}
          <div className="px-4 pb-3">
            <div
              role="tablist"
              aria-label="Recent activity filters"
              className="flex gap-2 overflow-x-auto whitespace-nowrap px-1 py-1"
            >
              {TABS.map((t) => {
                const active = activeTab === t.id;
                return (
                  <button
                    key={t.id}
                    role="tab"
                    aria-selected={active}
                    onClick={() => setActiveTab(t.id)}
                    className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition ${
                      active
                        ? "bg-slate-900 text-white shadow"
                        : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <span>{t.label}</span>
                    <span className="inline-flex items-center justify-center px-2 py-0.5 text-xs rounded-full bg-slate-100 text-slate-700">
                      {counts[t.id] ?? (t.id === "all" ? activities.length : 0)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Content area (scrollable) */}
        <div className="p-4">
          {filtered.length === 0 ? (
            <div className="py-8 text-center text-sm text-slate-500">
              No recent activity
            </div>
          ) : (
            <ul className="space-y-3">
              {filtered.map((r, idx) => {
                const name = r.customer_name ?? r.name ?? "Unknown";
                const actionText = getActionText(r);
                const status = (
                  r.ticket_status ??
                  r.status ??
                  ""
                ).toLowerCase();
                const time = r.how_long_ago ?? r.ago ?? "";

                const resolutionTime = calculateResolutionTime(
                  r.created_at ?? r.createdAt ?? r.raw?.created_at,
                  r.resolved_at ?? r.resolvedAt ?? r.raw?.resolved_at,
                  status
                );

                const pillClass =
                  status === "resolved"
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                    : status === "waiting"
                    ? "bg-amber-50 text-amber-700 border border-amber-100"
                    : status === "pending"
                    ? "bg-amber-50 text-amber-700 border border-amber-100"
                    : status === "active"
                    ? "bg-sky-50 text-sky-700 border border-sky-100"
                    : "bg-slate-50 text-slate-700 border border-slate-100";

                return (
                  <li
                    key={r.id ?? idx}
                    className="bg-white rounded-lg p-4 border border-slate-200 flex items-center justify-between shadow-sm"
                  >
                    <div className="min-w-0">
                      <div className="font-medium text-slate-800 truncate">
                        {name}
                      </div>
                      {actionText && (
                        <div className="text-sm text-slate-500 mt-1 truncate">
                          {actionText}
                        </div>
                      )}
                      {r.preview && (
                        <div className="text-xs text-slate-400 mt-1 truncate">
                          {r.preview}
                        </div>
                      )}
                    </div>

                    <div className="text-right flex-shrink-0 flex flex-col items-end ml-4">
                      <span
                        className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-medium ${pillClass}`}
                      >
                        {(r.ticket_status ?? r.status) || "—"}
                      </span>
                      <div className="text-xs text-slate-400 mt-2">{time}</div>
                      {status === "resolved" && resolutionTime && (
                        <div className="text-xs text-emerald-600 mt-1">
                          Resolved in {resolutionTime}
                        </div>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
