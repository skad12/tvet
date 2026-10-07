"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { format, parseISO, startOfMonth, startOfWeek, subDays, subMonths, endOfMonth, subWeeks, endOfWeek } from "date-fns";
import {
  FiActivity,
  FiAlertTriangle,
  FiBarChart2,
  FiCheckCircle,
  FiClock,
  FiCpu,
  FiDownload,
  FiFileText,
  FiHelpCircle,
  FiInbox,
  FiRefreshCw,
  FiShield,
  FiTag,
  FiTrendingDown,
  FiTrendingUp,
  FiUsers,
  FiZap,
} from "react-icons/fi";
import { toast } from "sonner";

import api from "@/lib/axios";
import { apiErrorMessage } from "@/lib/apiError";

// ---------------------------------------------------------------------------
// Types (GET /reports/)
// ---------------------------------------------------------------------------
type Metrics = {
  total: number;
  open: number;
  resolved: number;
  escalated: number;
  escalated_open: number;
  awaiting_reply: number;
  ai_only: number;
  resolution_rate: number | null;
  escalation_rate: number | null;
  ai_only_rate: number | null;
  avg_resolution_seconds: number | null;
  median_resolution_seconds: number | null;
  avg_staff_first_response_seconds: number | null;
  avg_ai_first_response_seconds: number | null;
  sla: { on_track: number; due_soon: number; overdue: number; met: number; missed: number; compliance: number | null };
};
type Change = Partial<Record<"total" | "resolved" | "escalated" | "avg_resolution_seconds" | "avg_staff_first_response_seconds", number | null>>;
type Report = {
  summary: { current: Metrics; previous: Metrics | null; change: Change | null; period?: { from: string; to: string } };
  by_category: { id: string | null; title: string; total: number; open: number; resolved: number; escalated: number; overdue: number; sla_compliance: number | null; resolution_rate: number | null; avg_resolution_seconds: number | null }[];
  by_staff: { id: string; name: string; role: string; assigned: number; open: number; resolved: number; resolution_rate: number | null; avg_resolution_seconds: number | null; avg_first_response_seconds: number | null }[];
  trend: { bucket: "day" | "week"; points: { date: string; opened: number; resolved: number; escalated: number }[] };
  busiest: { by_weekday: { day: string; count: number }[]; by_hour: { hour: number; count: number }[]; peak_day: string | null; peak_hour: number | null };
  top_questions: { question: string; count: number; tickets: number; top_category: string | null }[];
};
type Option = { id: string; title: string };
type StaffOption = { id: string; name: string; role: string };

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const iso = (d: Date) => format(d, "yyyy-MM-dd");
const nice = (v: string) => format(parseISO(v), "d MMM yyyy");

function periods() {
  const today = new Date();
  const lastWeek = subWeeks(today, 1);
  const lastMonth = subMonths(today, 1);
  return [
    { id: "7", label: "Last 7 days", from: iso(subDays(today, 6)), to: iso(today) },
    { id: "week", label: "This week", from: iso(startOfWeek(today, { weekStartsOn: 1 })), to: iso(today) },
    { id: "lastweek", label: "Last week", from: iso(startOfWeek(lastWeek, { weekStartsOn: 1 })), to: iso(endOfWeek(lastWeek, { weekStartsOn: 1 })) },
    { id: "30", label: "Last 30 days", from: iso(subDays(today, 29)), to: iso(today) },
    { id: "month", label: "This month", from: iso(startOfMonth(today)), to: iso(today) },
    { id: "lastmonth", label: "Last month", from: iso(startOfMonth(lastMonth)), to: iso(endOfMonth(lastMonth)) },
    { id: "90", label: "Last 90 days", from: iso(subDays(today, 89)), to: iso(today) },
  ];
}

function duration(seconds: number | null | undefined) {
  if (seconds === null || seconds === undefined) return "—";
  if (seconds < 60) return `${seconds}s`;
  const m = Math.round(seconds / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 48) return `${h}h ${String(m % 60).padStart(2, "0")}m`;
  return `${Math.floor(h / 24)}d ${h % 24}h`;
}

const pct = (v: number | null | undefined) => (v === null || v === undefined ? "—" : `${v}%`);
const hourLabel = (h: number) => `${String(h).padStart(2, "0")}:00`;

// ---------------------------------------------------------------------------
// Pieces
// ---------------------------------------------------------------------------
function Section({ icon, title, hint, action, children }: { icon: React.ReactNode; title: string; hint?: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-border bg-card shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-2 border-b border-border px-4 py-3">
        <div className="min-w-0">
          <h2 className="inline-flex items-center gap-2 text-sm font-semibold text-foreground">
            <span className="text-blue-600" aria-hidden>{icon}</span> {title}
          </h2>
          {hint && <p className="mt-0.5 text-xs text-muted">{hint}</p>}
        </div>
        {action}
      </div>
      <div className="p-4">{children}</div>
    </section>
  );
}

function Delta({ value, goodWhenDown = false }: { value: number | null | undefined; goodWhenDown?: boolean }) {
  if (value === null || value === undefined) return null;
  if (value === 0) return <span className="text-xs text-muted">no change</span>;
  const up = value > 0;
  const good = goodWhenDown ? !up : up;
  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-semibold ${good ? "text-emerald-600" : "text-rose-600"}`}>
      {up ? <FiTrendingUp aria-hidden /> : <FiTrendingDown aria-hidden />}
      {up ? "+" : ""}
      {value}%
    </span>
  );
}

function Kpi({ icon, label, value, sub, delta }: { icon: React.ReactNode; label: string; value: React.ReactNode; sub?: React.ReactNode; delta?: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium text-muted">{label}</p>
        <span className="text-slate-400" aria-hidden>{icon}</span>
      </div>
      <p className="mt-1.5 text-2xl font-semibold tabular-nums text-foreground">{value}</p>
      <div className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-muted">
        {sub}
        {delta}
      </div>
    </div>
  );
}

function ExportButton({ kind, label = "CSV", onExport, busy }: { kind: string; label?: string; onExport: (kind: string) => void; busy: string | null }) {
  return (
    <button
      type="button"
      onClick={() => onExport(kind)}
      disabled={busy !== null}
      className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1 text-xs font-semibold text-foreground hover:bg-surface-muted disabled:opacity-50"
    >
      {busy === kind ? <FiRefreshCw className="h-3.5 w-3.5 animate-spin" /> : <FiDownload className="h-3.5 w-3.5" />} {label}
    </button>
  );
}

const SERIES = [
  { key: "opened", label: "Opened", color: "bg-blue-500" },
  { key: "resolved", label: "Resolved", color: "bg-emerald-500" },
  { key: "escalated", label: "Escalated", color: "bg-amber-400" },
] as const;

function TrendChart({ trend }: { trend: Report["trend"] }) {
  const points = trend.points;
  const max = Math.max(1, ...points.flatMap((p) => [p.opened, p.resolved, p.escalated]));
  const every = Math.max(1, Math.ceil(points.length / 10));
  if (!points.length) return <p className="text-sm text-muted">No tickets in this period.</p>;
  return (
    <div>
      <div className="mb-3 flex flex-wrap gap-3 text-xs text-muted">
        {SERIES.map((s) => (
          <span key={s.key} className="inline-flex items-center gap-1.5">
            <i className={`h-2.5 w-2.5 rounded-sm ${s.color}`} /> {s.label}
          </span>
        ))}
        <span className="ml-auto">Per {trend.bucket}</span>
      </div>
      <div className="flex h-48 items-end gap-1 border-b border-border sm:gap-1.5" role="img" aria-label="Tickets opened, resolved and escalated over time">
        {points.map((p) => (
          <div
            key={p.date}
            className="group relative flex h-full min-w-0 flex-1 items-end justify-center gap-px rounded-t hover:bg-surface-muted/60"
            title={`${trend.bucket === "week" ? "Week of " : ""}${nice(p.date)}: ${p.opened} opened, ${p.resolved} resolved, ${p.escalated} escalated`}
          >
            {SERIES.map((s) => (
              <span key={s.key} className={`w-full max-w-[10px] rounded-t-sm ${s.color}`} style={{ height: `${(p[s.key] / max) * 100}%`, minHeight: p[s.key] ? 2 : 0 }} />
            ))}
          </div>
        ))}
      </div>
      <div className="mt-1.5 flex gap-1 sm:gap-1.5">
        {points.map((p, i) => (
          <span key={p.date} className="min-w-0 flex-1 truncate text-center text-[10px] text-muted">
            {i % every === 0 ? format(parseISO(p.date), "d MMM") : ""}
          </span>
        ))}
      </div>
    </div>
  );
}

function HBar({ value, max, tone = "bg-blue-500" }: { value: number; max: number; tone?: string }) {
  return (
    <span className="block h-2 w-full overflow-hidden rounded-full bg-surface-muted">
      <span className={`block h-full rounded-full ${tone}`} style={{ width: `${max ? (value / max) * 100 : 0}%` }} />
    </span>
  );
}

/** The plain-language summary at the top: the numbers that matter, in a sentence or five. */
function Narrative({ report, from, to }: { report: Report; from: string; to: string }) {
  const m = report.summary.current;
  const ch = report.summary.change;
  const topCat = report.by_category.find((c) => c.total > 0);
  const topQ = report.top_questions[0];
  const span = from && to ? `Between ${nice(from)} and ${nice(to)}` : from ? `Since ${nice(from)}` : "Over all time";
  const trendWord = (v: number | null | undefined) =>
    v === null || v === undefined ? "" : v === 0 ? ", the same as the previous period" : `, ${v > 0 ? "up" : "down"} ${Math.abs(v)}% on the previous period`;

  if (!m.total) return <p className="text-sm text-muted">{span}, no tickets matched these filters.</p>;
  return (
    <div className="space-y-1.5 text-sm leading-relaxed text-foreground">
      <p>
        {span}, trainees opened <strong>{m.total}</strong> ticket{m.total === 1 ? "" : "s"}
        {trendWord(ch?.total)}. <strong>{m.resolved}</strong> {m.resolved === 1 ? "was" : "were"} resolved ({pct(m.resolution_rate)}), <strong>{m.open}</strong>{" "}
        {m.open === 1 ? "is" : "are"} still open and <strong>{m.escalated}</strong> {m.escalated === 1 ? "was" : "were"} escalated to a super agent.
      </p>
      <p>
        The AI handled <strong>{m.ai_only}</strong> on its own ({pct(m.ai_only_rate)}). Staff first replied after{" "}
        <strong>{duration(m.avg_staff_first_response_seconds)}</strong> on average, and tickets took <strong>{duration(m.avg_resolution_seconds)}</strong> to resolve
        (median {duration(m.median_resolution_seconds)}).
        {m.sla.compliance !== null && (
          <>
            {" "}
            <strong>{pct(m.sla.compliance)}</strong> of resolved tickets met their SLA
          </>
        )}
        {m.sla.overdue > 0 ? (
          <>
            , and <strong className="text-rose-600">{m.sla.overdue}</strong> open {m.sla.overdue === 1 ? "is" : "are"} overdue now.
          </>
        ) : (
          "."
        )}
      </p>
      <p>
        {topCat && (
          <>
            Most enquiries were about <strong>{topCat.title}</strong> ({topCat.total}).{" "}
          </>
        )}
        {report.busiest.peak_day && (
          <>
            The busiest day was <strong>{report.busiest.peak_day}</strong>
            {report.busiest.peak_hour !== null && (
              <>
                {" "}
                and the busiest hour <strong>{hourLabel(report.busiest.peak_hour)}</strong>
              </>
            )}
            .{" "}
          </>
        )}
        {topQ && (
          <>
            The most asked question was &ldquo;{topQ.question}&rdquo; ({topQ.count} time{topQ.count === 1 ? "" : "s"}).
          </>
        )}
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
const STATES = [
  { id: "", label: "All statuses" },
  { id: "pending", label: "Pending" },
  { id: "escalated", label: "Escalated" },
  { id: "resolved", label: "Resolved" },
];

/** Admin Reports: a filterable summary of the help desk's tickets, with CSV exports. */
export default function ReportsPage() {
  const presetList = useMemo(() => periods(), []);
  const [period, setPeriod] = useState("7");
  const [from, setFrom] = useState(presetList[0].from);
  const [to, setTo] = useState(presetList[0].to);
  const [dateField, setDateField] = useState<"created" | "activity">("created");
  const [category, setCategory] = useState("");
  const [state, setState] = useState("");
  const [staff, setStaff] = useState("");

  const [categories, setCategories] = useState<Option[]>([]);
  const [people, setPeople] = useState<StaffOption[]>([]);
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState<string | null>(null);
  const requestId = useRef(0);

  const params = useMemo(() => {
    const p: Record<string, string> = {};
    if (from) p.from = from;
    if (to) p.to = to;
    if (dateField === "activity") p.date_field = "activity";
    if (category) p.category = category;
    if (state) p.state = state;
    if (staff) p.staff = staff;
    return p;
  }, [from, to, dateField, category, state, staff]);

  useEffect(() => {
    api.get("/get-all-category/").then((r) => setCategories(Array.isArray(r?.data) ? r.data : [])).catch(() => {});
    api
      .get("/staff/overview/")
      .then((r) => setPeople(Array.isArray(r?.data?.staff) ? r.data.staff : []))
      .catch(() => {});
  }, []);

  const load = useCallback(async () => {
    const id = ++requestId.current;
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/reports/", { params });
      if (id === requestId.current) setReport(res.data);
    } catch (err) {
      if (id === requestId.current) setError(apiErrorMessage(err, "Couldn't build the report."));
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }, [params]);

  useEffect(() => {
    load();
  }, [load]);

  function pickPeriod(id: string) {
    setPeriod(id);
    const p = presetList.find((x) => x.id === id);
    if (p) {
      setFrom(p.from);
      setTo(p.to);
    } else if (id === "all") {
      setFrom("");
      setTo("");
    }
  }

  async function exportCsv(kind: string) {
    setExporting(kind);
    try {
      const res = await api.get("/reports/export/", { params: { ...params, kind }, responseType: "blob" });
      const disposition = String(res.headers?.["content-disposition"] ?? "");
      const name = /filename="([^"]+)"/.exec(disposition)?.[1] ?? `tvet-${kind}.csv`;
      const url = URL.createObjectURL(res.data);
      const a = document.createElement("a");
      a.href = url;
      a.download = name;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success(`Downloaded ${name}`);
    } catch (err) {
      toast.error(apiErrorMessage(err, "Couldn't export that."));
    } finally {
      setExporting(null);
    }
  }

  const m = report?.summary.current;
  const ch = report?.summary.change ?? null;
  const prevLabel = report?.summary.period ? `vs ${nice(report.summary.period.from)} – ${nice(report.summary.period.to)}` : null;
  const catMax = Math.max(1, ...(report?.by_category ?? []).map((c) => c.total));
  const dayMax = Math.max(1, ...(report?.busiest.by_weekday ?? []).map((d) => d.count));
  const hourMax = Math.max(1, ...(report?.busiest.by_hour ?? []).map((d) => d.count));
  const qMax = Math.max(1, ...(report?.top_questions ?? []).map((q) => q.count));
  const control = "rounded-xl border border-border bg-card px-2.5 py-2 text-sm text-foreground focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-600">Insights</p>
          <h1 className="mt-1 inline-flex items-center gap-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            <FiBarChart2 className="h-7 w-7 text-blue-600" aria-hidden /> Reports
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-muted">What trainees asked, how fast it was handled, and where the pressure is. Every figure follows the filters, and every section exports.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={load}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-sm font-medium text-foreground shadow-sm hover:bg-surface-muted disabled:opacity-60"
          >
            <FiRefreshCw className={loading ? "animate-spin" : ""} /> Refresh
          </button>
          <button
            type="button"
            onClick={() => exportCsv("summary")}
            disabled={exporting !== null || !report}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-3.5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-60"
          >
            <FiDownload /> Export summary
          </button>
          <button
            type="button"
            onClick={() => exportCsv("tickets")}
            disabled={exporting !== null || !report}
            className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-3.5 py-2 text-sm font-semibold text-blue-700 shadow-sm hover:bg-blue-100 disabled:opacity-60 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-300"
          >
            <FiFileText /> Export tickets
          </button>
        </div>
      </div>

      {/* Filters */}
      <section className="rounded-2xl border border-border bg-card p-4 shadow-sm">
        <div className="flex gap-1.5 overflow-x-auto pb-2 [scrollbar-width:thin]" role="radiogroup" aria-label="Period">
          {[...presetList, { id: "all", label: "All time" }, { id: "custom", label: "Custom" }].map((p) => (
            <button
              key={p.id}
              type="button"
              role="radio"
              aria-checked={period === p.id}
              onClick={() => pickPeriod(p.id)}
              className={`shrink-0 whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-semibold transition sm:text-sm ${
                period === p.id ? "border-blue-600 bg-blue-600 text-white" : "border-border bg-card text-foreground hover:border-blue-200"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
        <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-6">
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-muted">From</span>
            <input type="date" value={from} max={to || undefined} onChange={(e) => { setFrom(e.target.value); setPeriod("custom"); }} className={`${control} w-full`} />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-muted">To</span>
            <input type="date" value={to} min={from || undefined} onChange={(e) => { setTo(e.target.value); setPeriod("custom"); }} className={`${control} w-full`} />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-muted">Dates apply to</span>
            <select value={dateField} onChange={(e) => setDateField(e.target.value as "created" | "activity")} className={`${control} w-full`}>
              <option value="created">Date created</option>
              <option value="activity">Last activity</option>
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-muted">Category</span>
            <select value={category} onChange={(e) => setCategory(e.target.value)} className={`${control} w-full`}>
              <option value="">All categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-muted">Status</span>
            <select value={state} onChange={(e) => setState(e.target.value)} className={`${control} w-full`}>
              {STATES.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-muted">Handled by</span>
            <select value={staff} onChange={(e) => setStaff(e.target.value)} className={`${control} w-full`}>
              <option value="">Anyone</option>
              {people.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} {p.role === "super_agent" ? "(super agent)" : ""}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      {error ? (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
          <span>{error}</span>
          <button type="button" onClick={load} className="rounded-full border border-red-300 px-3 py-1 text-xs font-semibold">
            Try again
          </button>
        </div>
      ) : !report || !m ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-surface-muted" />
          ))}
        </div>
      ) : (
        <div className={`space-y-6 transition-opacity ${loading ? "opacity-60" : ""}`}>
          {/* Written summary */}
          <Section icon={<FiFileText />} title={period === "7" || period === "week" || period === "lastweek" ? "Weekly summary" : "Summary"} hint={prevLabel ?? undefined} action={<ExportButton kind="summary" onExport={exportCsv} busy={exporting} />}>
            <Narrative report={report} from={from} to={to} />
          </Section>

          {/* Headline figures */}
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Kpi icon={<FiInbox />} label="Tickets" value={m.total} sub={prevLabel ? "vs previous" : undefined} delta={<Delta value={ch?.total} />} />
            <Kpi icon={<FiCheckCircle />} label="Resolved" value={m.resolved} sub={`${pct(m.resolution_rate)} of tickets`} delta={<Delta value={ch?.resolved} />} />
            <Kpi icon={<FiActivity />} label="Still open" value={m.open} sub={`${m.awaiting_reply} awaiting a staff reply`} />
            <Kpi icon={<FiAlertTriangle />} label="Escalated" value={m.escalated} sub={`${pct(m.escalation_rate)} · ${m.escalated_open} open`} delta={<Delta value={ch?.escalated} goodWhenDown />} />
            <Kpi icon={<FiCpu />} label="Handled by AI alone" value={m.ai_only} sub={`${pct(m.ai_only_rate)} of tickets`} />
            <Kpi icon={<FiZap />} label="First staff reply" value={duration(m.avg_staff_first_response_seconds)} sub="average" delta={<Delta value={ch?.avg_staff_first_response_seconds} goodWhenDown />} />
            <Kpi icon={<FiClock />} label="Time to resolve" value={duration(m.avg_resolution_seconds)} sub={`median ${duration(m.median_resolution_seconds)}`} delta={<Delta value={ch?.avg_resolution_seconds} goodWhenDown />} />
            <Kpi icon={<FiShield />} label="SLA met" value={pct(m.sla.compliance)} sub={`${m.sla.met} met · ${m.sla.missed} missed`} />
          </div>

          {/* Trend */}
          <Section icon={<FiTrendingUp />} title="Over time" hint="Tickets opened, resolved and escalated">
            <TrendChart trend={report.trend} />
          </Section>

          <div className="grid gap-6 xl:grid-cols-2">
            {/* Categories */}
            <Section icon={<FiTag />} title="By category" hint="Where enquiries come from" action={<ExportButton kind="categories" onExport={exportCsv} busy={exporting} />}>
              {report.by_category.length === 0 ? (
                <p className="text-sm text-muted">No tickets in this period.</p>
              ) : (
                <ul className="space-y-3">
                  {report.by_category.map((c) => (
                    <li key={c.id ?? c.title}>
                      <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
                        <span className="min-w-0 truncate text-foreground" title={c.title}>{c.title}</span>
                        <span className="shrink-0 tabular-nums text-muted">
                          <strong className="text-foreground">{c.total}</strong> · {c.resolved} resolved
                          {c.overdue ? <span className="font-semibold text-rose-600"> · {c.overdue} overdue</span> : null}
                        </span>
                      </div>
                      <HBar value={c.total} max={catMax} />
                      <p className="mt-1 text-[11px] text-muted">
                        Resolution {pct(c.resolution_rate)} · SLA met {pct(c.sla_compliance)} · avg {duration(c.avg_resolution_seconds)}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </Section>

            {/* SLA */}
            <Section icon={<FiShield />} title="SLA" hint="Resolved tickets against their deadline, and where open ones stand">
              {(() => {
                const parts = [
                  { label: "Met", v: m.sla.met, tone: "bg-emerald-500" },
                  { label: "Missed", v: m.sla.missed, tone: "bg-rose-400" },
                  { label: "On track", v: m.sla.on_track, tone: "bg-blue-500" },
                  { label: "Due soon", v: m.sla.due_soon, tone: "bg-amber-400" },
                  { label: "Overdue", v: m.sla.overdue, tone: "bg-rose-600" },
                ];
                const sum = parts.reduce((a, p) => a + p.v, 0);
                return sum === 0 ? (
                  <p className="text-sm text-muted">No tickets with a category in this period.</p>
                ) : (
                  <div>
                    <div className="flex h-3 overflow-hidden rounded-full bg-surface-muted">
                      {parts.map((p) => (p.v ? <span key={p.label} className={p.tone} style={{ width: `${(p.v / sum) * 100}%` }} title={`${p.label}: ${p.v}`} /> : null))}
                    </div>
                    <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
                      {parts.map((p) => (
                        <div key={p.label}>
                          <dt className="inline-flex items-center gap-1.5 text-xs text-muted">
                            <i className={`h-2 w-2 rounded-full ${p.tone}`} /> {p.label}
                          </dt>
                          <dd className="text-lg font-semibold tabular-nums text-foreground">{p.v}</dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                );
              })()}
            </Section>
          </div>

          {/* Busiest times */}
          <Section icon={<FiClock />} title="Busiest times" hint="When tickets are opened, to plan cover">
            <div className="grid gap-6 lg:grid-cols-[1fr_2fr]">
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">By day</p>
                <ul className="space-y-1.5">
                  {report.busiest.by_weekday.map((d) => (
                    <li key={d.day} className="grid grid-cols-[2.5rem_1fr_2rem] items-center gap-2 text-sm">
                      <span className="text-muted">{d.day}</span>
                      <HBar value={d.count} max={dayMax} tone={d.day === report.busiest.peak_day ? "bg-blue-600" : "bg-blue-300"} />
                      <span className="text-right tabular-nums text-foreground">{d.count}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">By hour</p>
                <div className="grid grid-cols-12 gap-1">
                  {report.busiest.by_hour.map((h) => (
                    <div
                      key={h.hour}
                      title={`${hourLabel(h.hour)}: ${h.count}`}
                      className="flex aspect-square items-center justify-center rounded-md text-[10px] font-medium"
                      style={{
                        backgroundColor: h.count ? `rgba(37, 99, 235, ${0.12 + (h.count / hourMax) * 0.78})` : undefined,
                        color: h.count / hourMax > 0.5 ? "white" : undefined,
                      }}
                    >
                      <span className={h.count ? "" : "text-muted"}>{h.hour}</span>
                    </div>
                  ))}
                </div>
                <p className="mt-2 text-xs text-muted">Darker is busier. Hours are in the help desk&apos;s time zone.</p>
              </div>
            </div>
          </Section>

          {/* Questions */}
          <Section icon={<FiHelpCircle />} title="Top questions" hint="What trainees asked most, in their words" action={<ExportButton kind="questions" onExport={exportCsv} busy={exporting} />}>
            {report.top_questions.length === 0 ? (
              <p className="text-sm text-muted">No questions in this period.</p>
            ) : (
              <ol className="space-y-3">
                {report.top_questions.map((q, i) => (
                  <li key={q.question} className="grid grid-cols-[1.5rem_1fr] gap-2">
                    <span className="pt-0.5 text-xs font-semibold tabular-nums text-muted">{i + 1}.</span>
                    <div className="min-w-0">
                      <div className="flex items-baseline justify-between gap-3">
                        <p className="min-w-0 break-words text-sm text-foreground">{q.question}</p>
                        <span className="shrink-0 text-sm font-semibold tabular-nums text-foreground">{q.count}</span>
                      </div>
                      <div className="mt-1">
                        <HBar value={q.count} max={qMax} tone="bg-violet-400" />
                      </div>
                      <p className="mt-1 text-[11px] text-muted">
                        {q.tickets} ticket{q.tickets === 1 ? "" : "s"}
                        {q.top_category ? ` · mostly ${q.top_category}` : ""}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </Section>

          {/* Staff */}
          <Section icon={<FiUsers />} title="Staff" hint="Tickets assigned to each person in this period" action={<ExportButton kind="staff" onExport={exportCsv} busy={exporting} />}>
            {report.by_staff.length === 0 ? (
              <p className="text-sm text-muted">No tickets were assigned to staff in this period.</p>
            ) : (
              <div className="-mx-4 overflow-x-auto px-4">
                <table className="w-full min-w-[36rem] text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-xs font-medium uppercase tracking-wide text-muted">
                      <th className="py-2 pr-3">Person</th>
                      <th className="px-3 py-2 text-right">Assigned</th>
                      <th className="px-3 py-2 text-right">Open</th>
                      <th className="px-3 py-2 text-right">Resolved</th>
                      <th className="px-3 py-2 text-right">First reply</th>
                      <th className="py-2 pl-3 text-right">Time to resolve</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {report.by_staff.map((s) => (
                      <tr key={s.id}>
                        <td className="py-2 pr-3">
                          <p className="font-medium text-foreground">{s.name}</p>
                          <p className="text-xs capitalize text-muted">{s.role.replace("_", " ") || "—"}</p>
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums text-foreground">{s.assigned}</td>
                        <td className="px-3 py-2 text-right tabular-nums text-foreground">{s.open}</td>
                        <td className="px-3 py-2 text-right tabular-nums text-foreground">
                          {s.resolved} <span className="text-xs text-muted">({pct(s.resolution_rate)})</span>
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums text-foreground">{duration(s.avg_first_response_seconds)}</td>
                        <td className="py-2 pl-3 text-right tabular-nums text-foreground">{duration(s.avg_resolution_seconds)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Section>
        </div>
      )}
    </div>
  );
}
