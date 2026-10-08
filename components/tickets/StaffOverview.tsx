"use client";

import { useMemo } from "react";
import { FiAlertTriangle, FiCheckCircle, FiClock, FiInbox, FiMessageCircle } from "react-icons/fi";

import { needsReply } from "@/lib/ticketActivity";
import { slaView, ticketSla } from "@/components/tickets/SlaBadge";
import TrackTicket from "@/components/tickets/TrackTicket";

function isResolved(t: any) {
  const s = String(t?.ticket_status ?? t?.raw?.ticket_status ?? t?.status ?? "").toLowerCase();
  return s === "resolved";
}

function Tile({ label, value, tone, icon }: { label: string; value: number; tone?: "warn" | "bad" | "good"; icon: React.ReactNode }) {
  const colour =
    tone === "bad" && value ? "text-red-600" : tone === "warn" && value ? "text-amber-600" : tone === "good" && value ? "text-emerald-600" : "text-foreground";
  return (
    <div className="rounded-2xl border border-border bg-card px-3 py-2.5 shadow-sm sm:px-4 sm:py-3">
      <p className="flex items-center justify-between gap-2 text-[11px] font-medium text-muted sm:text-xs">
        {label}
        <span className="text-slate-400" aria-hidden>{icon}</span>
      </p>
      <p className={`mt-0.5 text-xl font-semibold tabular-nums sm:text-2xl ${colour}`}>{value.toLocaleString()}</p>
    </div>
  );
}

/**
 * Top of the agent and super agent dashboards: the categories the signed-in
 * person covers, and where their tickets stand.
 */
export default function StaffOverview({ tickets, role }: { tickets: any[]; role: "agent" | "super_agent" }) {

  const stats = useMemo(() => {
    const list = Array.isArray(tickets) ? tickets : [];
    const now = Date.now();
    let dueSoon = 0, overdue = 0;
    list.forEach((t) => {
      const v = slaView(ticketSla(t), now);
      if (v?.tone === "warn") dueSoon += 1;
      if (v?.label.startsWith("Overdue")) overdue += 1;
    });
    return {
      total: list.length,
      awaiting: list.filter((t) => needsReply(t)).length,
      dueSoon,
      overdue,
      resolved: list.filter(isResolved).length,
    };
  }, [tickets]);

  return (
    <section aria-label="Overview" className="mb-3 space-y-3 sm:mb-4">
      {/* Wider screens have the tracker in the top bar. */}
      <div className="sm:hidden">
        <TrackTicket role={role} />
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-5 sm:gap-3">
        <Tile icon={<FiInbox />} label={role === "super_agent" ? "Escalated to you" : "My tickets"} value={stats.total} />
        <Tile icon={<FiMessageCircle />} label="Awaiting reply" value={stats.awaiting} tone="warn" />
        <Tile icon={<FiClock />} label="SLA due soon" value={stats.dueSoon} tone="warn" />
        <Tile icon={<FiAlertTriangle />} label="SLA overdue" value={stats.overdue} tone="bad" />
        <Tile icon={<FiCheckCircle />} label="Resolved" value={stats.resolved} tone="good" />
      </div>
    </section>
  );
}
