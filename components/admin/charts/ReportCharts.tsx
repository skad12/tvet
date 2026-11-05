"use client";

/**
 * Charts of a report's figures (GET /reports/), each with a labelled scale and
 * its value printed on every bar, so they can be read without hovering.
 * Shared by the Analytics page; the Excel export draws the same charts.
 */

type Item = { label: string; value: number; tone?: string; note?: string };

export type ChartReport = {
  summary: { current: { sla: { on_track: number; overdue: number; met: number; missed: number } } };
  by_category: { id: string | null; title: string; total: number; open: number }[];
  by_source: { id: string; title: string; total: number }[];
  busiest: { by_weekday: { day: string; count: number }[]; by_hour: { hour: number; count: number }[] };
};

/** A round top for the scale: 0 … nice max, in up to 4 steps. */
function scale(max: number) {
  if (max <= 4) return { top: Math.max(1, max), ticks: Array.from({ length: Math.max(1, max) + 1 }, (_, i) => i) };
  const raw = max / 4;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= raw) ?? raw;
  const top = Math.ceil(max / step) * step;
  return { top, ticks: Array.from({ length: Math.round(top / step) + 1 }, (_, i) => Math.round(i * step)) };
}

const fmt = (n: number) => n.toLocaleString();

function Frame({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <figure className="min-w-0 rounded-2xl border border-border bg-card p-4 shadow-sm">
      <figcaption className="mb-3">
        <p className="text-sm font-semibold text-foreground">{title}</p>
        {hint && <p className="text-xs text-muted">{hint}</p>}
      </figcaption>
      {children}
    </figure>
  );
}

/** Horizontal bars: one row per item, value (and share) at the end of each bar. */
export function HorizontalBars({ items, unit, share = false }: { items: Item[]; unit: string; share?: boolean }) {
  const total = items.reduce((a, i) => a + i.value, 0);
  const { top, ticks } = scale(Math.max(0, ...items.map((i) => i.value)));
  if (!items.length || !total) return <p className="text-sm text-muted">Nothing to show for this period.</p>;
  return (
    <div role="img" aria-label={items.map((i) => `${i.label}: ${i.value} ${unit}`).join(", ")}>
      <div className="grid grid-cols-[minmax(6rem,38%)_1fr] gap-x-3 gap-y-2.5">
        {items.map((i) => (
          <div key={i.label} className="contents">
            <span className="min-w-0 self-center truncate text-xs text-foreground sm:text-sm" title={i.label}>
              {i.label}
            </span>
            <div className="relative flex h-6 items-center">
              <div className="pointer-events-none absolute inset-0 flex justify-between">
                {ticks.map((t) => (
                  <span key={t} className="h-full w-px bg-border/70" />
                ))}
              </div>
              <span
                className={`relative h-full rounded-r-md ${i.tone ?? "bg-blue-500"}`}
                style={{ width: `${(i.value / top) * 100}%`, minWidth: i.value ? 3 : 0 }}
              />
              <span className="relative ml-1.5 whitespace-nowrap text-xs font-semibold tabular-nums text-foreground">
                {fmt(i.value)}
                {share && <span className="font-normal text-muted"> ({Math.round((i.value / total) * 1000) / 10}%)</span>}
                {i.note && <span className="font-normal text-muted"> · {i.note}</span>}
              </span>
            </div>
          </div>
        ))}
        <span className="text-[10px] text-muted">{unit}</span>
        <div className="flex justify-between text-[10px] tabular-nums text-muted">
          {ticks.map((t) => (
            <span key={t}>{fmt(t)}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

/** Vertical columns with the value above each one and a labelled scale on the left. */
export function Columns({ items, unit, highlight }: { items: Item[]; unit: string; highlight?: string | null }) {
  const { top, ticks } = scale(Math.max(0, ...items.map((i) => i.value)));
  const dense = items.length > 12;
  if (!items.some((i) => i.value)) return <p className="text-sm text-muted">Nothing to show for this period.</p>;
  return (
    <div role="img" aria-label={items.map((i) => `${i.label}: ${i.value} ${unit}`).join(", ")}>
      <div className="flex gap-2">
        <div className="flex h-44 w-6 shrink-0 flex-col-reverse justify-between text-right text-[10px] tabular-nums text-muted">
          {ticks.map((t) => (
            <span key={t} className="leading-none">
              {fmt(t)}
            </span>
          ))}
        </div>
        <div className="relative h-44 min-w-0 flex-1 border-b border-l border-border">
          <div className="pointer-events-none absolute inset-0 flex flex-col-reverse justify-between">
            {ticks.map((t) => (
              <span key={t} className="h-px w-full bg-border/70" />
            ))}
          </div>
          <div className={`relative flex h-full items-end ${dense ? "gap-px" : "gap-1.5 sm:gap-2"} px-1`}>
            {items.map((i) => (
              <div key={i.label} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end" title={`${i.label}: ${fmt(i.value)}`}>
                <span className={`mb-0.5 tabular-nums text-foreground ${dense ? "text-[8px] sm:text-[9px]" : "text-[11px] font-semibold"}`}>
                  {i.value ? fmt(i.value) : ""}
                </span>
                <span
                  className={`w-full rounded-t ${i.tone ?? (highlight === i.label ? "bg-blue-600" : "bg-blue-400")}`}
                  style={{ height: `${(i.value / top) * 100}%`, minHeight: i.value ? 2 : 0 }}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className={`ml-8 mt-1 flex ${dense ? "gap-px" : "gap-1.5 sm:gap-2"} px-1`}>
        {items.map((i, n) => (
          <span key={i.label} className="min-w-0 flex-1 truncate text-center text-[10px] text-muted">
            {dense ? (n % 3 === 0 ? i.label : "") : i.label}
          </span>
        ))}
      </div>
      <p className="ml-8 mt-1 text-[10px] text-muted">{unit}</p>
    </div>
  );
}

const SOURCE_TONE: Record<string, string> = { trainee: "bg-sky-500", centre: "bg-violet-500" };

/** The report's charts, laid out in a responsive grid. */
export default function ReportCharts({ report }: { report: ChartReport }) {
  const sla = report.summary.current.sla;
  const peak = (xs: { label: string; value: number }[]) =>
    xs.reduce<{ label: string; value: number } | null>((a, x) => (!a || x.value > a.value ? x : a), null)?.label ?? null;
  const days = report.busiest.by_weekday.map((d) => ({ label: d.day, value: d.count }));
  const hours = report.busiest.by_hour.map((h) => ({ label: `${String(h.hour).padStart(2, "0")}:00`, value: h.count }));
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="lg:col-span-2">
        <Frame title="Ticket volume by category" hint="Tickets in each category">
          <HorizontalBars
            unit="Tickets"
            items={report.by_category.map((c) => ({
              label: c.title,
              value: c.total,
              tone: "bg-blue-500",
            }))}
          />
        </Frame>
      </div>
      <Frame title="Who is asking" hint="Tickets, and share of all tickets">
        <HorizontalBars
          unit="Tickets"
          share
          items={report.by_source.map((s) => ({ label: s.title, value: s.total, tone: SOURCE_TONE[s.id] }))}
        />
      </Frame>
      <Frame title="SLA" hint="Tickets with a deadline: resolved (met, missed) and open (on track, overdue)">
        <Columns
          unit="Tickets"
          items={[
            { label: "Met", value: sla.met, tone: "bg-emerald-500" },
            { label: "Missed", value: sla.missed, tone: "bg-rose-400" },
            { label: "On track", value: sla.on_track, tone: "bg-blue-500" },
            { label: "Overdue", value: sla.overdue, tone: "bg-rose-600" },
          ]}
        />
      </Frame>
      <Frame title="Busiest days" hint="Conversations started on each weekday">
        <Columns unit="Conversations started" items={days} highlight={peak(days)} />
      </Frame>
      <Frame title="Busiest hours" hint="Conversations started in each hour (help desk time)">
        <Columns unit="Conversations started" items={hours} highlight={peak(hours)} />
      </Frame>
    </div>
  );
}
