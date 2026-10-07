"use client";

import { format, parseISO, startOfMonth, startOfWeek, subDays, subMonths, endOfMonth } from "date-fns";

export type DateField = "created" | "activity";
export type DateRange = { from: string; to: string; field: DateField };

export const EMPTY_RANGE: DateRange = { from: "", to: "", field: "created" };

const iso = (d: Date) => format(d, "yyyy-MM-dd");

function presets(): { id: string; label: string; from: string; to: string }[] {
  const today = new Date();
  const lastMonth = subMonths(today, 1);
  return [
    { id: "today", label: "Today", from: iso(today), to: iso(today) },
    { id: "yesterday", label: "Yesterday", from: iso(subDays(today, 1)), to: iso(subDays(today, 1)) },
    { id: "week", label: "This week", from: iso(startOfWeek(today, { weekStartsOn: 1 })), to: iso(today) },
    { id: "7", label: "Last 7 days", from: iso(subDays(today, 6)), to: iso(today) },
    { id: "30", label: "Last 30 days", from: iso(subDays(today, 29)), to: iso(today) },
    { id: "month", label: "This month", from: iso(startOfMonth(today)), to: iso(today) },
    { id: "lastmonth", label: "Last month", from: iso(startOfMonth(lastMonth)), to: iso(endOfMonth(lastMonth)) },
  ];
}

const short = (v: string) => format(parseISO(v), "d MMM yyyy");

/** "Created 1 Oct 2026 – 7 Oct 2026", for the chip that shows an active range. */
export function describeRange(r: DateRange) {
  const what = r.field === "activity" ? "Active" : "Created";
  if (r.from && r.to) return r.from === r.to ? `${what} ${short(r.from)}` : `${what} ${short(r.from)} – ${short(r.to)}`;
  if (r.from) return `${what} from ${short(r.from)}`;
  if (r.to) return `${what} up to ${short(r.to)}`;
  return "Any date";
}

/**
 * Advanced ticket filter: which date to filter on (created or last activity),
 * quick presets, and a custom from/to (both inclusive).
 */
export default function DateRangePanel({ value, onChange }: { value: DateRange; onChange: (r: DateRange) => void }) {
  const today = iso(new Date());
  const list = presets();
  const activePreset = list.find((p) => p.from === value.from && p.to === value.to)?.id;

  const input =
    "w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100";

  return (
    <div className="mt-3 space-y-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-3 sm:p-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Filter on</span>
        <div role="radiogroup" aria-label="Date to filter on" className="flex rounded-xl bg-white p-1 ring-1 ring-slate-200">
          {(
            [
              ["created", "Date created"],
              ["activity", "Last activity"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              role="radio"
              aria-checked={value.field === id}
              onClick={() => onChange({ ...value, field: id })}
              className={`rounded-lg px-3 py-1 text-xs font-semibold transition sm:text-sm ${
                value.field === id ? "bg-blue-600 text-white" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5" aria-label="Quick ranges">
        {list.map((p) => (
          <button
            key={p.id}
            type="button"
            aria-pressed={activePreset === p.id}
            onClick={() => onChange({ ...value, from: p.from, to: p.to })}
            className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
              activePreset === p.id ? "border-blue-600 bg-blue-600 text-white" : "border-slate-200 bg-white text-slate-700 hover:border-blue-200 hover:bg-blue-50"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-slate-600">From</span>
          <input
            type="date"
            value={value.from}
            max={value.to || today}
            onChange={(e) => onChange({ ...value, from: e.target.value })}
            className={input}
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-slate-600">To</span>
          <input
            type="date"
            value={value.to}
            min={value.from || undefined}
            max={today}
            onChange={(e) => onChange({ ...value, to: e.target.value })}
            className={input}
          />
        </label>
        <button
          type="button"
          onClick={() => onChange({ ...value, from: "", to: "" })}
          disabled={!value.from && !value.to}
          className="rounded-xl px-3 py-2 text-sm font-medium text-blue-700 hover:bg-blue-50 disabled:opacity-40"
        >
          Clear dates
        </button>
      </div>
      {value.from && value.to && value.from > value.to && (
        <p className="text-xs text-amber-700">The start date is after the end date, so nothing will match.</p>
      )}
    </div>
  );
}
