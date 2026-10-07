"use client";

import { useEffect, useState } from "react";
import { FiAlertTriangle, FiCheckCircle, FiClock, FiCpu, FiInbox, FiMessageCircle, FiShield, FiZap } from "react-icons/fi";

import api from "@/lib/axios";

type Metrics = {
  total: number;
  open: number;
  resolved: number;
  escalated: number;
  awaiting_reply: number;
  ai_only: number;
  resolution_rate: number | null;
  ai_only_rate: number | null;
  avg_resolution_seconds: number | null;
  avg_staff_first_response_seconds: number | null;
  sla: { overdue: number; due_soon: number; compliance: number | null };
};

function duration(seconds: number | null | undefined) {
  if (seconds === null || seconds === undefined) return "—";
  const m = Math.round(seconds / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  return h < 48 ? `${h}h ${String(m % 60).padStart(2, "0")}m` : `${Math.floor(h / 24)}d ${h % 24}h`;
}

/**
 * Figures for exactly the tickets the list is filtered to (category, status
 * and dates), computed on the server so they cover every page, not only the
 * rows loaded so far.
 */
export default function TicketInsights({ params }: { params: Record<string, string> }) {
  const [m, setM] = useState<Metrics | null>(null);
  const key = JSON.stringify(params);

  useEffect(() => {
    let alive = true;
    const load = () =>
      api
        .get("/reports/summary/", { params: JSON.parse(key) })
        .then((r) => alive && setM(r?.data?.current ?? null))
        .catch(() => alive && setM(null));
    load();
    const timer = window.setInterval(() => document.visibilityState === "visible" && load(), 60000);
    return () => {
      alive = false;
      window.clearInterval(timer);
    };
  }, [key]);

  if (!m) return null;
  const items = [
    { icon: <FiInbox />, label: "Open", value: m.open },
    { icon: <FiCheckCircle />, label: "Resolved", value: `${m.resolved}${m.resolution_rate !== null ? ` · ${m.resolution_rate}%` : ""}` },
    { icon: <FiAlertTriangle />, label: "Escalated", value: m.escalated },
    { icon: <FiMessageCircle />, label: "Awaiting reply", value: m.awaiting_reply, tone: m.awaiting_reply ? "text-blue-700 dark:text-blue-300" : "" },
    { icon: <FiShield />, label: "Overdue", value: m.sla.overdue, tone: m.sla.overdue ? "text-rose-600" : "" },
    { icon: <FiCpu />, label: "AI alone", value: `${m.ai_only}${m.ai_only_rate !== null ? ` · ${m.ai_only_rate}%` : ""}` },
    { icon: <FiZap />, label: "First reply", value: duration(m.avg_staff_first_response_seconds) },
    { icon: <FiClock />, label: "Time to resolve", value: duration(m.avg_resolution_seconds) },
  ];
  return (
    <dl className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4 xl:grid-cols-8" aria-label="Insights for these tickets">
      {items.map((it) => (
        <div key={it.label} className="min-w-0 rounded-xl border border-border bg-surface-muted/40 px-2.5 py-2">
          <dt className="flex items-center gap-1.5 truncate text-[11px] text-muted">
            <span aria-hidden>{it.icon}</span> {it.label}
          </dt>
          <dd className={`mt-0.5 truncate text-sm font-semibold tabular-nums text-foreground ${it.tone ?? ""}`}>{it.value}</dd>
        </div>
      ))}
    </dl>
  );
}
