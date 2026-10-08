"use client";

import { FiClock, FiTarget } from "react-icons/fi";

import { slaView, ticketSla, useNow } from "@/components/tickets/SlaBadge";
import TicketRef from "@/components/tickets/TicketRef";

const STEPS: { key: string; label: string }[] = [
  { key: "created_at", label: "Created" },
  { key: "first_ai_response_at", label: "First AI response" },
  { key: "agent_assigned_at", label: "Agent assigned" },
  { key: "escalated_at", label: "Escalated" },
  { key: "super_agent_first_response_at", label: "Super agent responded" },
  { key: "resolved_at", label: "Resolved" },
];

function pick(t: any, key: string) {
  return t?.[key] ?? t?.raw?.[key] ?? null;
}

function toDate(value: string | null) {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

const dayFmt: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", year: "numeric" };
const timeFmt: Intl.DateTimeFormatOptions = { hour: "2-digit", minute: "2-digit" };

function span(ms: number) {
  const s = Math.max(Math.round(ms / 1000), 0);
  const d = Math.floor(s / 86400), h = Math.floor((s % 86400) / 3600), m = Math.floor((s % 3600) / 60);
  if (d) return `${d}d ${h}h`;
  if (h) return `${h}h ${m}m`;
  return `${m}m`;
}

const SLA_TONE = {
  good: { bar: "bg-emerald-500", text: "text-emerald-700", chip: "bg-emerald-50 text-emerald-700 ring-emerald-200" },
  warn: { bar: "bg-amber-400", text: "text-amber-700", chip: "bg-amber-50 text-amber-800 ring-amber-200" },
  bad: { bar: "bg-red-500", text: "text-red-700", chip: "bg-red-50 text-red-700 ring-red-200" },
  neutral: { bar: "bg-blue-500", text: "text-slate-700", chip: "bg-slate-50 text-slate-700 ring-slate-200" },
};

function SlaCard({ ticket }: { ticket: any }) {
  const sla = ticketSla(ticket);
  const open = !!sla && sla.status !== "met" && sla.status !== "missed";
  const now = useNow(open);
  const view = slaView(sla, now);
  if (!sla || !view) return null;

  const start = new Date(sla.started_at).getTime();
  const due = new Date(sla.due_at).getTime();
  const used = open ? Math.min(Math.max((now - start) / (due - start), 0), 1) : 1;
  const tone = SLA_TONE[view.tone];
  const dueAt = new Date(sla.due_at);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500">
          <FiTarget className="h-3.5 w-3.5" aria-hidden /> SLA · {sla.hours}h
        </p>
        <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold tabular-nums ring-1 ${tone.chip}`}>{view.label}</span>
      </div>
      <div
        className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100"
        role="progressbar"
        aria-label="SLA time used"
        aria-valuenow={Math.round(used * 100)}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div className={`h-full rounded-full ${tone.bar}`} style={{ width: `${used * 100}%` }} />
      </div>
      <p className="mt-1.5 text-[11px] text-slate-500">
        {open ? "Due" : "Was due"}{" "}
        <span className="font-medium text-slate-700">
          {dueAt.toLocaleDateString(undefined, dayFmt)}, {dueAt.toLocaleTimeString(undefined, timeFmt)}
        </span>
      </p>
    </div>
  );
}

/**
 * When the ticket passed each milestone, with its SLA on top. Steps not yet
 * reached are greyed out; for tickets from before these were recorded, a step
 * may show "Not recorded".
 */
export default function TicketTimeline({ ticket }: { ticket: any }) {
  const created = toDate(pick(ticket, "created_at"));

  return (
    <section aria-label="Ticket timeline" className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3.5">
      <div className="mb-3 flex items-center justify-between gap-2">
        <p className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
          <FiClock className="h-3.5 w-3.5" aria-hidden /> Timeline
        </p>
        <TicketRef ticket={ticket} className="bg-white text-[11px] text-slate-700 ring-1 ring-slate-200" />
      </div>

      <SlaCard ticket={ticket} />

      <ol className="mt-3">
        {STEPS.map(({ key, label }, i) => {
          const at = toDate(pick(ticket, key));
          const last = i === STEPS.length - 1;
          const after = at && created && key !== "created_at" ? at.getTime() - created.getTime() : null;
          return (
            <li key={key} className="relative flex gap-3 pb-3 last:pb-0">
              {!last && (
                <span
                  aria-hidden
                  className={`absolute left-[5px] top-3.5 h-[calc(100%-0.5rem)] w-px ${at ? "bg-blue-200" : "bg-slate-200"}`}
                />
              )}
              <span
                aria-hidden
                className={`relative mt-1 h-[11px] w-[11px] shrink-0 rounded-full ${
                  at ? "bg-blue-600 ring-4 ring-blue-100" : "border-2 border-slate-300 bg-white"
                }`}
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <p className={`text-[13px] font-medium ${at ? "text-slate-800" : "text-slate-400"}`}>{label}</p>
                  {after != null && <span className="shrink-0 text-[11px] tabular-nums text-slate-400">+{span(after)}</span>}
                </div>
                <p className={`text-[11px] tabular-nums ${at ? "text-slate-500" : "text-slate-400"}`}>
                  {at ? `${at.toLocaleDateString(undefined, dayFmt)} · ${at.toLocaleTimeString(undefined, timeFmt)}` : "Not yet"}
                </p>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
