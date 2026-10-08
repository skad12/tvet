"use client";

import { useEffect, useState } from "react";

// The API's per-ticket SLA (main/sla.py): the clock starts when a ticket
// enters its category and runs for that category's hours.
export type Sla = {
  hours: number;
  started_at: string;
  due_at: string;
  status: "on_track" | "due_soon" | "overdue" | "met" | "missed";
  seconds_left: number | null;
} | null;

const DUE_SOON_SHARE = 0.25;

/** "#A1B2C3": the last 6 characters of the ticket id, for people to quote. */
export function ticketReference(t: any): string {
  const ref = t?.reference ?? t?.raw?.reference;
  if (ref) return `#${ref}`;
  const id = String(t?.id ?? t?.raw?.id ?? "").replace(/-/g, "");
  return id ? `#${id.slice(-6).toUpperCase()}` : "";
}

export function ticketSla(t: any): Sla {
  return (t?.sla ?? t?.raw?.sla ?? null) as Sla;
}

function span(seconds: number) {
  const s = Math.abs(seconds);
  const d = Math.floor(s / 86400), h = Math.floor((s % 86400) / 3600), m = Math.floor((s % 3600) / 60);
  if (d) return `${d}d ${h}h`;
  if (h) return `${h}h ${m}m`;
  return `${Math.max(m, 1)}m`;
}

/** Re-render every 30s so open tickets count down while the page is open. */
export function useNow(active: boolean) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!active) return;
    const t = window.setInterval(() => setNow(Date.now()), 30000);
    return () => window.clearInterval(t);
  }, [active]);
  return now;
}

export function slaView(sla: Sla, now: number) {
  if (!sla) return null;
  if (sla.status === "met") return { label: "SLA met", tone: "good" as const };
  if (sla.status === "missed") return { label: "SLA missed", tone: "bad" as const };
  const left = (new Date(sla.due_at).getTime() - now) / 1000;
  if (left <= 0) return { label: `Overdue · ${span(left)}`, tone: "bad" as const };
  if (left <= sla.hours * 3600 * DUE_SOON_SHARE) return { label: `Due soon · ${span(left)} left`, tone: "warn" as const };
  return { label: `SLA · ${span(left)} left`, tone: "neutral" as const };
}

const TONES = {
  good: "border-emerald-200 bg-emerald-50 text-emerald-700",
  bad: "border-red-200 bg-red-50 text-red-700",
  warn: "border-amber-200 bg-amber-50 text-amber-800",
  neutral: "border-slate-200 bg-slate-50 text-slate-700",
};

export default function SlaBadge({ ticket, className = "" }: { ticket: any; className?: string }) {
  const sla = ticketSla(ticket);
  const open = !!sla && sla.status !== "met" && sla.status !== "missed";
  const now = useNow(open);
  const view = slaView(sla, now);
  if (!view) return null;
  return (
    <span
      className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full border px-2 py-0.5 text-[10px] font-semibold tabular-nums sm:text-xs ${TONES[view.tone]} ${className}`}
      title={sla ? `SLA ${sla.hours}h · due ${new Date(sla.due_at).toLocaleString()}` : undefined}
    >
      {view.label}
    </span>
  );
}
