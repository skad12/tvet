"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { endOfMonth, format, startOfMonth, startOfWeek, subDays, subMonths } from "date-fns";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  FiActivity,
  FiAlertTriangle,
  FiArrowRight,
  FiCheck,
  FiPlus,
  FiCheckCircle,
  FiChevronRight,
  FiClock,
  FiEdit2,
  FiInbox,
  FiLayers,
  FiRefreshCw,
  FiSearch,
  FiShield,
  FiUsers,
  FiX,
} from "react-icons/fi";
import { toast } from "sonner";

import api from "@/lib/axios";
import { apiErrorMessage } from "@/lib/apiError";
import SlaBadge from "@/components/tickets/SlaBadge";
import TrackTicket from "@/components/tickets/TrackTicket";
import ChatModal from "@/components/admin/tickets/ChatModal";
import { useAuth } from "@/context/AuthContext";
import TicketRef from "@/components/tickets/TicketRef";

// ---------------------------------------------------------------------------
// Data (GET /categories/overview/)
// ---------------------------------------------------------------------------
type Person = { id: string; name: string; email: string; status: string | null };
type Figures = {
  total: number;
  resolved: number;
  open: number;
  awaiting_reply: number;
  escalated: number;
  resolution_rate: number | null;
  avg_resolution_seconds: number | null;
};
type RecentTicket = {
  id: string;
  reference?: string;
  sla?: unknown;
  name: string;
  email: string;
  status: string | null;
  awaiting_reply: boolean;
  last_message_at: string | null;
};
type Category = {
  // The "Other category" row: tickets outside every category. Read-only.
  other?: boolean;
  id: string;
  title: string;
  sla_hours: number;
  sla: { overdue: number; due_soon: number; met: number; missed: number };
  super_agents: Person[];
  agents: Person[];
  tickets: Figures;
  recent: RecentTicket[];
};

type SortKey = "attention" | "title" | "open" | "overdue" | "rate";

// Open tickets split by SLA position. Every ticket counted here sits in a
// category, so each open one is on track, due soon or overdue.
function slaSplit(c: Category) {
  const overdue = c.sla.overdue;
  const dueSoon = c.sla.due_soon;
  const onTrack = Math.max(c.tickets.open - overdue - dueSoon, 0);
  return { onTrack, dueSoon, overdue };
}

function online(p: Person) {
  return (p.status ?? "").toLowerCase() === "available";
}

function formatDuration(seconds: number | null) {
  if (seconds == null) return "—";
  const h = Math.floor(seconds / 3600);
  const m = Math.round((seconds % 3600) / 60);
  if (h >= 24) return `${Math.floor(h / 24)}d ${h % 24}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function formatWhen(value: string | null) {
  if (!value) return "";
  const d = new Date(value);
  return Number.isNaN(d.getTime())
    ? ""
    : d.toLocaleString(undefined, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

// ---------------------------------------------------------------------------
// Small pieces
// ---------------------------------------------------------------------------
const AVATAR_TONES = [
  "bg-blue-100 text-blue-700",
  "bg-emerald-100 text-emerald-700",
  "bg-violet-100 text-violet-700",
  "bg-amber-100 text-amber-800",
  "bg-rose-100 text-rose-700",
  "bg-cyan-100 text-cyan-700",
];

function initials(name: string) {
  const words = name.replace(/^(mr|mrs|ms|dr)\.?\s+/i, "").split(/\s+/).filter(Boolean);
  return ((words[0]?.[0] ?? "") + (words[1]?.[0] ?? "")).toUpperCase() || "?";
}

function toneFor(id: string) {
  let h = 0;
  for (const ch of id) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return AVATAR_TONES[h % AVATAR_TONES.length];
}

export function Avatar({ person, size = 28 }: { person: Person; size?: number }) {
  return (
    <span className="relative inline-flex shrink-0" title={`${person.name} · ${person.status ?? "Offline"}`}>
      <span
        className={`inline-flex items-center justify-center rounded-full font-semibold ring-2 ring-white ${toneFor(person.id)}`}
        style={{ width: size, height: size, fontSize: size * 0.38 }}
      >
        {initials(person.name)}
      </span>
      <span
        className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full ring-2 ring-white ${
          online(person) ? "bg-emerald-500" : (person.status ?? "").toLowerCase() === "engaged" ? "bg-amber-500" : "bg-slate-300"
        }`}
      />
    </span>
  );
}

function AvatarStack({ people, max = 4 }: { people: Person[]; max?: number }) {
  if (!people.length) return <span className="text-xs font-medium text-amber-700">Nobody assigned</span>;
  const shown = people.slice(0, max);
  return (
    <span className="flex items-center">
      <span className="flex -space-x-2">
        {shown.map((p) => (
          <Avatar key={p.id} person={p} />
        ))}
      </span>
      {people.length > max && <span className="ml-1.5 text-xs font-medium text-muted">+{people.length - max}</span>}
    </span>
  );
}

// `scale` (0 to 1) sets how much of the track the bar fills, so in a chart of
// several categories the bar length shows how many open tickets each has.
function SlaBar({ c, height = 8, scale = 1 }: { c: Category; height?: number; scale?: number }) {
  const { onTrack, dueSoon, overdue } = slaSplit(c);
  const total = onTrack + dueSoon + overdue;
  if (!total) return <div className="w-full rounded-full bg-slate-100" style={{ height }} title="No open tickets" />;
  const seg = (n: number, cls: string, label: string) =>
    n ? <div className={cls} style={{ width: `${(n / total) * 100}%` }} title={`${n} ${label}`} /> : null;
  return (
    <div className="w-full rounded-full bg-slate-100" style={{ height }}>
      <div className="flex h-full overflow-hidden rounded-full" style={{ width: `${Math.max(scale, 0.06) * 100}%` }}>
        {seg(onTrack, "bg-emerald-500", "on track")}
        {seg(dueSoon, "bg-amber-400", "due soon")}
        {seg(overdue, "bg-rose-400", "overdue")}
      </div>
    </div>
  );
}

function RateBar({ rate }: { rate: number | null }) {
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-full max-w-[90px] overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full bg-blue-600" style={{ width: `${rate ?? 0}%` }} />
      </div>
      <span className="w-12 shrink-0 text-right text-xs font-semibold tabular-nums text-foreground">
        {rate == null ? "—" : `${rate}%`}
      </span>
    </div>
  );
}

function Kpi({
  icon,
  label,
  value,
  hint,
  tone = "blue",
  onClick,
  action,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint: string;
  tone?: "blue" | "amber" | "red" | "emerald" | "violet";
  onClick?: () => void;
  action?: string;
}) {
  const chip = {
    blue: "bg-blue-50 text-blue-600",
    amber: "bg-amber-50 text-amber-600",
    red: "bg-rose-50 text-rose-500",
    emerald: "bg-emerald-50 text-emerald-600",
    violet: "bg-violet-50 text-violet-600",
  }[tone];
  return (
    <button
      type="button"
      onClick={onClick}
      className="group rounded-2xl border border-border bg-card p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-300"
    >
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-muted">{label}</p>
        <span className={`inline-flex h-8 w-8 items-center justify-center rounded-xl ${chip}`}>{icon}</span>
      </div>
      <p className="mt-2 text-2xl font-semibold tabular-nums tracking-tight text-foreground">{value}</p>
      <p className="mt-0.5 text-xs text-muted">{hint}</p>
      {action && (
        <p className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-blue-600 opacity-70 transition group-hover:opacity-100">
          {action} <FiArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
        </p>
      )}
    </button>
  );
}

// ---------------------------------------------------------------------------
// SLA editor (in the detail panel)
// ---------------------------------------------------------------------------
function SlaEditor({ category, onSaved }: { category: Category; onSaved: (hours: number) => void }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(String(category.sla_hours));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const hours = Number(value);
    if (!Number.isInteger(hours) || hours < 1 || hours > 720) {
      setError("Whole hours, 1 to 720.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await api.patch(`/categories/${category.id}/sla/`, { sla_hours: hours });
      onSaved(hours);
      setEditing(false);
      toast.success(`SLA for ${category.title} set to ${hours}h`);
    } catch (err) {
      setError(apiErrorMessage(err, "Couldn't save the SLA."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-2xl border border-border bg-surface-muted/50 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted">
            <FiClock className="h-3.5 w-3.5" aria-hidden /> Service level
          </p>
          <p className="mt-1 text-sm text-foreground">
            Tickets must be resolved within <span className="font-semibold">{category.sla_hours} hours</span> of entering this
            category.
          </p>
        </div>
        {!editing && (
          <button
            type="button"
            onClick={() => {
              setValue(String(category.sla_hours));
              setEditing(true);
            }}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 py-1.5 text-xs font-semibold text-foreground hover:bg-slate-50"
            aria-label={`Edit SLA for ${category.title}`}
          >
            <FiEdit2 className="h-3.5 w-3.5" /> Edit
          </button>
        )}
      </div>
      {editing && (
        <form onSubmit={save} className="mt-3 flex flex-wrap items-center gap-2">
          <label className="sr-only" htmlFor={`sla-${category.id}`}>
            SLA hours
          </label>
          <input
            id={`sla-${category.id}`}
            type="number"
            min={1}
            max={720}
            step={1}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="w-24 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-sm tabular-nums"
            autoFocus
          />
          <span className="text-sm text-muted">hours</span>
          <button type="submit" disabled={saving} className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50">
            {saving ? "Saving…" : "Save"}
          </button>
          <button type="button" onClick={() => setEditing(false)} disabled={saving} className="rounded-lg px-2.5 py-1.5 text-xs text-muted hover:bg-slate-100">
            Cancel
          </button>
          {error && <p className="basis-full text-xs text-rose-600">{error}</p>}
        </form>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Detail panel
// ---------------------------------------------------------------------------
function DetailPanel({
  category,
  onClose,
  onSlaSaved,
  staff,
  onChanged,
}: {
  category: Category;
  onClose: () => void;
  onSlaSaved: (h: number) => void;
  staff: StaffUser[] | null;
  onChanged: () => void;
}) {
  const t = category.tickets;
  const split = slaSplit(category);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true" aria-label={category.title}>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-950/40" onClick={onClose} />
      <motion.aside
        initial={{ x: 40, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: 40, opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="relative flex h-full w-full max-w-xl flex-col bg-card shadow-2xl"
      >
        <header className="flex items-start justify-between gap-3 border-b border-border px-5 py-4">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">Category</p>
            <div className="mt-0.5">
              <TitleEditor category={category} onSaved={onChanged} />
            </div>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded-full p-2 text-muted hover:bg-slate-100">
            <FiX className="h-5 w-5" />
          </button>
        </header>

        <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {[
              ["Tickets", t.total],
              ["Open", t.open],
              ["Awaiting reply", t.awaiting_reply],
              ["Resolved", t.resolved],
            ].map(([label, value]) => (
              <div key={label as string} className="rounded-xl border border-border bg-surface-muted/50 px-3 py-2">
                <p className="text-[11px] text-muted">{label}</p>
                <p className="text-xl font-semibold tabular-nums text-foreground">{Number(value).toLocaleString()}</p>
              </div>
            ))}
          </div>

          <div className="rounded-2xl border border-border p-4">
            <div className="mb-2 flex items-center justify-between">
              <p className="inline-flex items-center gap-1.5 text-sm font-semibold text-foreground">
                <FiActivity className="h-4 w-4 text-blue-600" aria-hidden /> SLA health of open tickets
              </p>
              <p className="text-xs text-muted">Met {category.sla.met} · missed {category.sla.missed}</p>
            </div>
            <SlaBar c={category} height={10} />
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs">
              <span className="inline-flex items-center gap-1.5 text-muted"><i className="h-2 w-2 rounded-full bg-emerald-500" />{split.onTrack} on track</span>
              <span className="inline-flex items-center gap-1.5 text-muted"><i className="h-2 w-2 rounded-full bg-amber-400" />{split.dueSoon} due soon</span>
              <span className="inline-flex items-center gap-1.5 text-muted"><i className="h-2 w-2 rounded-full bg-rose-400" />{split.overdue} overdue</span>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3 border-t border-border pt-3 text-sm">
              <div>
                <p className="text-xs text-muted">Resolution rate</p>
                <div className="mt-1"><RateBar rate={t.resolution_rate} /></div>
              </div>
              <div>
                <p className="text-xs text-muted">Average time to resolve</p>
                <p className="mt-1 font-semibold tabular-nums text-foreground">{formatDuration(t.avg_resolution_seconds)}</p>
              </div>
            </div>
          </div>

          <SlaEditor category={category} onSaved={onSlaSaved} />

          <div className="grid gap-5 sm:grid-cols-2">
            <PeopleManager icon={<FiShield className="h-3.5 w-3.5" />} title="Super agents" kind="super_agent" category={category} people={category.super_agents} staff={staff} onChanged={onChanged} />
            <PeopleManager icon={<FiUsers className="h-3.5 w-3.5" />} title="Agents" kind="agent" category={category} people={category.agents} staff={staff} onChanged={onChanged} />
          </div>

          <div>
            <p className="mb-2 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted">
              <FiInbox className="h-3.5 w-3.5" aria-hidden /> Latest tickets
            </p>
            {category.recent.length === 0 ? (
              <p className="rounded-xl border border-dashed border-border px-3 py-4 text-center text-sm text-muted">No tickets in this category yet.</p>
            ) : (
              <ul className="divide-y divide-border rounded-2xl border border-border">
                {category.recent.map((r) => {
                  const resolved = (r.status ?? "").toLowerCase() === "resolved";
                  return (
                    <li key={r.id} className="flex items-center justify-between gap-3 px-3 py-2.5">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-foreground">
                          <TicketRef ticket={r} className="-ml-1 mr-1 text-xs text-muted" />
                          {r.name || r.email || "Trainee"}
                        </p>
                        <p className="text-[11px] text-muted">{formatWhen(r.last_message_at)}</p>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-1">
                        <SlaBadge ticket={r} />
                        <span
                          className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                            resolved ? "bg-emerald-50 text-emerald-700" : r.awaiting_reply ? "bg-blue-50 text-blue-700" : "bg-amber-50 text-amber-800"
                          }`}
                        >
                          {resolved ? "Resolved" : r.awaiting_reply ? "Awaiting reply" : "Pending"}
                        </span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </motion.aside>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Editing a category: its name, and who covers it
// ---------------------------------------------------------------------------
type StaffUser = { id: string; name: string; email: string; account_type: string; user_status: string | null };

function staffKind(u: { account_type?: string | null }) {
  return String(u.account_type ?? "").trim().toLowerCase();
}

function TitleEditor({ category, onSaved }: { category: Category; onSaved: () => void }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(category.title);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const title = value.trim();
    if (!title || title === category.title) {
      setEditing(false);
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await api.patch(`/categories/${category.id}/`, { title });
      toast.success("Category renamed");
      setEditing(false);
      onSaved();
    } catch (err) {
      setError(apiErrorMessage(err, "Couldn't rename the category."));
    } finally {
      setSaving(false);
    }
  }

  if (!editing) {
    return (
      <div className="flex min-w-0 items-start gap-2">
        <h2 className="min-w-0 text-lg font-semibold leading-snug text-foreground">{category.title}</h2>
        <button
          type="button"
          onClick={() => {
            setValue(category.title);
            setEditing(true);
          }}
          aria-label={`Rename ${category.title}`}
          className="mt-0.5 shrink-0 rounded-lg p-1.5 text-muted hover:bg-slate-100 hover:text-foreground"
        >
          <FiEdit2 className="h-4 w-4" />
        </button>
      </div>
    );
  }
  return (
    <form onSubmit={save} className="flex flex-wrap items-center gap-2">
      <label className="sr-only" htmlFor={`title-${category.id}`}>Category name</label>
      <input
        id={`title-${category.id}`}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        maxLength={150}
        autoFocus
        className="min-w-0 flex-1 basis-60 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-base font-semibold"
      />
      <button type="submit" disabled={saving} className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50">
        {saving ? "Saving…" : "Save"}
      </button>
      <button type="button" onClick={() => setEditing(false)} disabled={saving} className="rounded-lg px-2.5 py-1.5 text-xs text-muted hover:bg-slate-100">
        Cancel
      </button>
      {error && <p className="basis-full text-xs text-red-600">{error}</p>}
      <p className="basis-full text-[11px] text-muted">Tickets and FAQs filed under the old name are renamed with it.</p>
    </form>
  );
}

function PeopleManager({
  title,
  icon,
  kind,
  category,
  people,
  staff,
  onChanged,
}: {
  title: string;
  icon: React.ReactNode;
  kind: "super_agent" | "agent";
  category: Category;
  people: Person[];
  staff: StaffUser[] | null;
  onChanged: () => void;
}) {
  const [adding, setAdding] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const here = new Set(people.map((p) => p.id));
  const candidates = (staff ?? []).filter((u) => staffKind(u) === kind && !here.has(String(u.id)));
  const label = kind === "super_agent" ? "super agent" : "agent";

  async function add() {
    if (!adding) return;
    setBusy("add");
    try {
      await api.post("/assign-category/to-user/", { category_id: category.id, assigned_to_id: adding });
      toast.success(`Added to ${category.title}`);
      setAdding("");
      onChanged();
    } catch (err) {
      toast.error(apiErrorMessage(err, `Couldn't add the ${label}.`));
    } finally {
      setBusy(null);
    }
  }

  async function remove(p: Person) {
    if (!window.confirm(`Remove ${p.name} from ${category.title}?`)) return;
    setBusy(p.id);
    try {
      await api.post("/remove-user/from-category/", { category_id: category.id, assigned_to_id: p.id });
      toast.success(`${p.name} removed from ${category.title}`);
      onChanged();
    } catch (err) {
      toast.error(apiErrorMessage(err, `Couldn't remove the ${label}.`));
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="min-w-0">
      <p className="mb-2 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted">
        <span aria-hidden className="text-slate-400">{icon}</span>
        {title} <span className="font-normal normal-case">· {people.length}</span>
      </p>
      {people.length === 0 ? (
        <p className="mb-2 rounded-xl border border-dashed border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-800">Nobody assigned yet.</p>
      ) : (
        <ul className="mb-2 space-y-2">
          {people.map((p) => (
            <li key={p.id} className="flex items-center gap-3">
              <Avatar person={p} size={32} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">{p.name}</p>
                <p className="truncate text-xs text-muted">{p.email}</p>
              </div>
              <button
                type="button"
                onClick={() => remove(p)}
                disabled={busy === p.id}
                aria-label={`Remove ${p.name} from ${category.title}`}
                title="Remove from this category"
                className="shrink-0 rounded-lg p-1.5 text-muted hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50"
              >
                <FiX className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="flex items-center gap-2">
        <label className="sr-only" htmlFor={`add-${kind}-${category.id}`}>Add {label}</label>
        <select
          id={`add-${kind}-${category.id}`}
          value={adding}
          onChange={(e) => setAdding(e.target.value)}
          disabled={staff === null || busy === "add"}
          className="min-w-0 flex-1 rounded-lg border border-border bg-card px-2 py-1.5 text-sm text-foreground"
        >
          <option value="">{staff === null ? "Loading…" : candidates.length ? `Add a ${label}…` : `No other ${label}s`}</option>
          {candidates.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name && u.name !== "null" ? `${u.name} (${u.email})` : u.email}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={add}
          disabled={!adding || busy === "add"}
          className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-blue-600 px-2.5 py-1.5 text-xs font-semibold text-white disabled:opacity-40"
        >
          <FiPlus className="h-3.5 w-3.5" /> Add
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Popups behind the summary cards
// ---------------------------------------------------------------------------
function Popup({ title, subtitle, onClose, children }: { title: string; subtitle?: string; onClose: () => void; children: React.ReactNode }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6" role="dialog" aria-modal="true" aria-label={title}>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-950/50" onClick={onClose} />
      <motion.div
        initial={{ y: 16, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 8, opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="relative flex max-h-[88dvh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl"
      >
        <header className="flex items-start justify-between gap-3 border-b border-slate-200 px-5 py-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
            {subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded-full p-2 text-slate-500 hover:bg-slate-100">
            <FiX className="h-5 w-5" />
          </button>
        </header>
        <div className="flex-1 overflow-y-auto">{children}</div>
      </motion.div>
    </div>
  );
}

function AttentionList({ tickets, onOpen }: { tickets: any[]; onOpen: (t: any) => void }) {
  if (!tickets.length) {
    return (
      <p className="flex items-center justify-center gap-2 px-5 py-10 text-sm text-emerald-700">
        <FiCheck /> Every open ticket is on time.
      </p>
    );
  }
  return (
    <ul className="divide-y divide-slate-100">
      {tickets.map((t) => (
        <li key={t.id}>
          {/* Not a <button>: it holds the copyable reference, itself a button. */}
          <div
            role="button"
            tabIndex={0}
            onClick={() => onOpen(t)}
            onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), onOpen(t))}
            className="flex w-full cursor-pointer items-center justify-between gap-3 px-5 py-3 text-left hover:bg-slate-50 focus:outline-none focus-visible:bg-blue-50"
          >
            <div className="min-w-0">
              <p className="flex min-w-0 items-center gap-1.5 text-sm font-medium text-slate-800">
                <TicketRef ticket={t} className="-ml-1 text-xs text-slate-500" />
                <span className="truncate">{t.name || t.email || "Trainee"}</span>
              </p>
              <p className="truncate text-xs text-slate-500">
                {t.escalated_category || t.category || "—"}
                {t.assigned_to_name || t.assigned_to ? ` · ${t.assigned_to_name || t.assigned_to}` : " · unassigned"}
              </p>
            </div>
            <SlaBadge ticket={t} />
          </div>
        </li>
      ))}
    </ul>
  );
}

function StaffList({ categories }: { categories: Category[] }) {
  const people = new Map<string, Person & { kind: string; covers: string[] }>();
  categories.forEach((c) => {
    c.super_agents.forEach((p) => {
      const row = people.get(p.id) ?? { ...p, kind: "Super agent", covers: [] };
      row.covers.push(c.title);
      people.set(p.id, row);
    });
    c.agents.forEach((p) => {
      const row = people.get(p.id) ?? { ...p, kind: "Agent", covers: [] };
      row.covers.push(c.title);
      people.set(p.id, row);
    });
  });
  const order = (p: Person) => (online(p) ? 0 : (p.status ?? "").toLowerCase() === "engaged" ? 1 : 2);
  const rows = [...people.values()].sort((a, b) => order(a) - order(b) || a.name.localeCompare(b.name));
  if (!rows.length) return <p className="px-5 py-10 text-center text-sm text-slate-500">No staff are assigned to a category yet.</p>;
  return (
    <ul className="divide-y divide-slate-100">
      {rows.map((p) => (
        <li key={p.id} className="flex items-center gap-3 px-5 py-3">
          <Avatar person={p} size={34} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-slate-800">
              {p.name} <span className="font-normal text-slate-400">· {p.kind}</span>
            </p>
            <p className="truncate text-xs text-slate-500">{p.covers.join(" · ")}</p>
          </div>
          <span
            className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${
              online(p) ? "bg-emerald-50 text-emerald-700" : (p.status ?? "").toLowerCase() === "engaged" ? "bg-amber-50 text-amber-800" : "bg-slate-100 text-slate-600"
            }`}
          >
            {p.status ?? "Offline"}
          </span>
        </li>
      ))}
    </ul>
  );
}

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
}

function firstName(user: any) {
  const name = String(user?.name ?? "").trim();
  if (name && name !== "null") return name.split(/\s+/)[0];
  return String(user?.email ?? user?.username ?? "there").split("@")[0];
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
/**
 * Admin overview of every category: coverage, workload and SLA health at a
 * glance, with a detail panel per category. A ticket belongs to a category
 * once a trainee picks it, it is escalated there, or it is moved there.
 */
// The page's period. Figures cover tickets worked on in it (any activity);
// tickets at risk always show everything.
const ymd = (d: Date) => format(d, "yyyy-MM-dd");
function periodOptions() {
  const today = new Date();
  const lastMonth = subMonths(today, 1);
  return [
    { id: "today", label: "Today", from: ymd(today), to: ymd(today) },
    { id: "yesterday", label: "Yesterday", from: ymd(subDays(today, 1)), to: ymd(subDays(today, 1)) },
    { id: "week", label: "This week", from: ymd(startOfWeek(today, { weekStartsOn: 1 })), to: ymd(today) },
    { id: "7", label: "Last 7 days", from: ymd(subDays(today, 6)), to: ymd(today) },
    { id: "30", label: "Last 30 days", from: ymd(subDays(today, 29)), to: ymd(today) },
    { id: "month", label: "This month", from: ymd(startOfMonth(today)), to: ymd(today) },
    { id: "lastmonth", label: "Last month", from: ymd(startOfMonth(lastMonth)), to: ymd(endOfMonth(lastMonth)) },
    { id: "all", label: "All time", from: "", to: "" },
  ];
}

export default function CategoryOverview() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortKey>("attention");
  const [openId, setOpenId] = useState<string | null>(null);
  const [attention, setAttention] = useState<any[]>([]);
  const [popup, setPopup] = useState<"attention" | "staff" | null>(null);
  const [chatTicket, setChatTicket] = useState<any | null>(null);
  const [staff, setStaff] = useState<StaffUser[] | null>(null);
  const tableRef = useRef<HTMLElement | null>(null);
  const router = useRouter();
  const { user } = useAuth?.() ?? {};
  // Worked out in the browser after load, so "this week" is the user's week.
  const [periods, setPeriods] = useState<ReturnType<typeof periodOptions> | null>(null);
  const [periodId, setPeriodId] = useState("week");
  useEffect(() => setPeriods(periodOptions()), []);
  const period = periods?.find((p) => p.id === periodId) ?? null;
  const periodQuery = period && period.from ? `&from=${period.from}&to=${period.to}` : "";

  const load = useCallback(async () => {
    if (!period) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/categories/overview/", {
        params: period.from ? { from: period.from, to: period.to, date_field: "activity" } : {},
      });
      setCategories(Array.isArray(res?.data?.categories) ? res.data.categories : []);
      setAttention(Array.isArray(res?.data?.attention) ? res.data.attention : []);
    } catch (err) {
      setError(apiErrorMessage(err, "Couldn't load categories."));
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    load();
  }, [load]);

  // Agents and super agents who can be added to a category.
  useEffect(() => {
    api
      .get("/get-all-users/")
      .then((res) =>
        setStaff(
          (Array.isArray(res?.data) ? res.data : [])
            .filter((u: any) => ["agent", "super_agent"].includes(staffKind(u)))
            .map((u: any) => ({ id: String(u.id), name: u.name, email: u.email || u.username, account_type: u.account_type, user_status: u.user_status }))
        )
      )
      .catch(() => setStaff([]));
  }, []);

  const totals = useMemo(() => {
    const sum = (f: (c: Category) => number) => categories.reduce((s, c) => s + f(c), 0);
    const total = sum((c) => c.tickets.total);
    const resolved = sum((c) => c.tickets.resolved);
    const open = sum((c) => c.tickets.open);
    const overdue = sum((c) => c.sla.overdue);
    const people = new Map<string, Person>();
    categories.forEach((c) => [...c.super_agents, ...c.agents].forEach((p) => people.set(p.id, p)));
    const staff = [...people.values()];
    return {
      total,
      resolved,
      open,
      awaiting: sum((c) => c.tickets.awaiting_reply),
      overdue,
      dueSoon: sum((c) => c.sla.due_soon),
      // Only categories have a response-time target, so only their open tickets count here.
      health: (() => {
        const withTarget = categories.filter((c) => !c.other).reduce((s, c) => s + c.tickets.open, 0);
        return withTarget ? Math.round(((withTarget - overdue) / withTarget) * 1000) / 10 : null;
      })(),
      rate: total ? Math.round((resolved / total) * 1000) / 10 : null,
      staff: staff.length,
      online: staff.filter(online).length,
      uncovered: categories.filter((c) => !c.other && c.super_agents.length + c.agents.length === 0).length,
      real: categories.filter((c) => !c.other).length,
    };
  }, [categories]);

  const shown = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = q
      ? categories.filter((c) =>
          [c.title, ...c.super_agents.map((p) => p.name), ...c.agents.map((p) => p.name)].some((v) => (v ?? "").toLowerCase().includes(q))
        )
      : categories;
    const by: Record<SortKey, (a: Category, b: Category) => number> = {
      attention: (a, b) =>
        b.sla.overdue - a.sla.overdue || b.tickets.awaiting_reply - a.tickets.awaiting_reply || b.tickets.open - a.tickets.open,
      title: (a, b) => a.title.localeCompare(b.title),
      open: (a, b) => b.tickets.open - a.tickets.open,
      overdue: (a, b) => b.sla.overdue - a.sla.overdue,
      rate: (a, b) => (b.tickets.resolution_rate ?? -1) - (a.tickets.resolution_rate ?? -1),
    };
    return [...list].sort(by[sort]);
  }, [categories, search, sort]);

  const selected = categories.find((c) => c.id === openId) ?? null;
  const savedSla = (id: string) => (hours: number) => {
    setCategories((list) => list.map((x) => (x.id === id ? { ...x, sla_hours: hours } : x)));
    load();
  };

  return (
    <div className="space-y-6">
      {/* Header: this is the admin home */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-600 p-5 text-white shadow-lg sm:p-7">
        <div aria-hidden className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/10" />
        <div aria-hidden className="pointer-events-none absolute -bottom-20 right-24 h-44 w-44 rounded-full bg-white/5" />
        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-sm text-blue-100">
              {new Date().toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
            </p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
              {greeting()}, {firstName(user)}
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-blue-50 sm:text-base">
              {loading && !categories.length
                ? "Checking how every category stands…"
                : totals.overdue
                ? `${totals.overdue} ticket${totals.overdue === 1 ? " is" : "s are"} past due${totals.dueSoon ? ` and ${totals.dueSoon} due soon` : ""} across ${totals.real} categories.`
                : totals.dueSoon
                ? `Nothing is overdue. ${totals.dueSoon} ticket${totals.dueSoon === 1 ? " is" : "s are"} due soon.`
                : "Every open ticket is on time."}
              {totals.uncovered ? ` ${totals.uncovered} ${totals.uncovered === 1 ? "category has" : "categories have"} no staff.` : ""}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {totals.overdue + totals.dueSoon > 0 && (
              <button
                type="button"
                onClick={() => setPopup("attention")}
                className="inline-flex items-center gap-2 rounded-xl bg-white px-3.5 py-2 text-sm font-semibold text-blue-700 shadow-sm hover:bg-blue-50"
              >
                <FiAlertTriangle /> Needs attention · {totals.overdue + totals.dueSoon}
              </button>
            )}
            <button
              type="button"
              onClick={load}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl bg-white/15 px-3.5 py-2 text-sm font-medium text-white ring-1 ring-white/30 hover:bg-white/25 disabled:opacity-60"
            >
              <FiRefreshCw className={loading ? "animate-spin" : ""} /> Refresh
            </button>
          </div>
        </div>
        <div className="relative mt-5 flex flex-wrap gap-2 text-sm">
          {[
            ["All tickets", "/admin/dashboard/tickets"],
            ["Agents", "/admin/dashboard/agents"],
            ["FAQs", "/admin/dashboard/faqs"],
          ].map(([label, href]) => (
            <button
              key={href}
              type="button"
              onClick={() => router.push(href)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-1.5 font-medium text-white ring-1 ring-white/20 hover:bg-white/20"
            >
              {label} <FiArrowRight className="h-3.5 w-3.5" />
            </button>
          ))}
        </div>
      </div>

      {/* Wider screens have the tracker in the top bar. */}
      <div className="sm:hidden">
        <TrackTicket role="admin" />
      </div>

      {error ? (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <span>{error}</span>
          <button type="button" onClick={load} className="rounded-full border border-red-300 bg-white px-3 py-1 text-xs font-semibold">
            Try again
          </button>
        </div>
      ) : (
        <>
          {/* Period: what the figures below cover */}
          <div className="flex flex-col gap-1">
            <div role="radiogroup" aria-label="Period" className="flex min-w-0 gap-1.5 overflow-x-auto pb-1 [scrollbar-width:thin]">
              {(periods ?? []).map((p) => (
                <button
                  key={p.id}
                  type="button"
                  role="radio"
                  aria-checked={periodId === p.id}
                  onClick={() => setPeriodId(p.id)}
                  className={`shrink-0 whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-semibold transition sm:text-sm ${
                    periodId === p.id ? "border-blue-600 bg-blue-600 text-white" : "border-border bg-card text-foreground hover:border-blue-200"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
            <p className="text-xs text-muted">
              {period && period.from ? "Figures cover tickets worked on in this period" : "Figures cover all tickets"} · tickets at risk always show everything
            </p>
          </div>

          {/* KPIs */}
          <div className={`grid grid-cols-2 gap-3 transition-opacity lg:grid-cols-5 ${loading ? "opacity-60" : ""}`}>
            <Kpi
              icon={<FiLayers />}
              label="Categories"
              value={String(totals.real)}
              hint={totals.uncovered ? `${totals.uncovered} without staff` : "All covered"}
              action="See the breakdown"
              onClick={() => tableRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
            />
            <Kpi
              icon={<FiInbox />}
              tone="violet"
              label="Open tickets"
              value={totals.open.toLocaleString()}
              hint={`${totals.awaiting.toLocaleString()} awaiting a reply`}
              action="View open tickets"
              onClick={() => router.push(`/admin/dashboard/tickets?status=pending${periodQuery}`)}
            />
            <Kpi
              icon={<FiAlertTriangle />}
              tone={totals.overdue ? "red" : "emerald"}
              label="SLA health"
              value={totals.health == null ? "—" : `${totals.health}%`}
              hint={`${totals.overdue} overdue · ${totals.dueSoon} due soon`}
              action="See tickets at risk"
              onClick={() => setPopup("attention")}
            />
            <Kpi
              icon={<FiCheckCircle />}
              tone="emerald"
              label="Resolution rate"
              value={totals.rate == null ? "—" : `${totals.rate}%`}
              hint={`${totals.resolved.toLocaleString()} of ${totals.total.toLocaleString()} resolved`}
              action="View resolved tickets"
              onClick={() => router.push(`/admin/dashboard/tickets?status=resolved${periodQuery}`)}
            />
            <Kpi
              icon={<FiUsers />}
              tone="amber"
              label="Staff online"
              value={`${totals.online}/${totals.staff}`}
              hint="Agents and super agents"
              action="See who's available"
              onClick={() => setPopup("staff")}
            />
          </div>

          {/* SLA health by category */}
          <section className="rounded-2xl border border-border bg-card px-4 py-3.5 shadow-sm sm:px-5 sm:py-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="inline-flex items-center gap-1.5 text-sm font-semibold text-foreground">
                  <FiActivity className="h-4 w-4 text-blue-600" aria-hidden /> SLA health by category
                </h2>
                <p className="text-xs text-muted">Open tickets by how close they are to their deadline</p>
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
                <span className="inline-flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-emerald-500" />On track</span>
                <span className="inline-flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-amber-400" />Due soon</span>
                <span className="inline-flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-rose-400" />Overdue</span>
              </div>
            </div>
            {loading && !categories.length ? (
              <p className="text-sm text-muted">Loading…</p>
            ) : (
              <ul className="space-y-2">
                {categories
                  .filter((c) => !c.other)
                  .sort((a, b) => b.tickets.open - a.tickets.open)
                  .map((c, _i, list) => {
                    const s = slaSplit(c);
                    const most = Math.max(list[0]?.tickets.open ?? 0, 1);
                    return (
                      <li key={c.id}>
                        <button type="button" onClick={() => !c.other && setOpenId(c.id)} className="group grid w-full grid-cols-1 items-center gap-1 text-left sm:grid-cols-[minmax(0,15rem)_1fr_7.5rem] sm:gap-4">
                          <span className="truncate text-sm text-foreground group-hover:text-blue-700" title={c.title}>{c.title}</span>
                          <span className="block w-3/4">
                            <SlaBar c={c} height={8} scale={c.tickets.open / most} />
                          </span>
                          <span className="text-xs tabular-nums text-muted sm:text-right">
                            {c.tickets.open} open{s.overdue ? <span className="font-semibold text-rose-600"> · {s.overdue} late</span> : null}
                          </span>
                        </button>
                      </li>
                    );
                  })}
              </ul>
            )}
          </section>

          {/* Table */}
          <section ref={tableRef} className="scroll-mt-24 rounded-2xl border border-border bg-card shadow-sm">
            <div className="flex flex-wrap items-center gap-2 border-b border-border p-4">
              <div className="relative min-w-0 flex-1 basis-56">
                <FiSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search categories or people"
                  aria-label="Search categories or people"
                  className="w-full rounded-xl border border-border bg-surface-muted/50 py-2 pl-9 pr-3 text-sm outline-none focus:border-blue-300 focus:bg-card"
                />
              </div>
              <label className="flex items-center gap-2 text-xs text-muted">
                Sort by
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value as SortKey)}
                  className="rounded-xl border border-border bg-card px-2.5 py-2 text-sm text-foreground"
                >
                  <option value="attention">Needs attention</option>
                  <option value="open">Most open</option>
                  <option value="overdue">Most overdue</option>
                  <option value="rate">Resolution rate</option>
                  <option value="title">Name</option>
                </select>
              </label>
            </div>

            {shown.length === 0 ? (
              <p className="p-8 text-center text-sm text-muted">{categories.length ? "No categories match your search." : loading ? "Loading…" : "No categories set up yet."}</p>
            ) : (
              <>
                {/* Wide screens: a table */}
                <div className="hidden overflow-x-auto md:block">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border text-left text-xs font-medium uppercase tracking-wide text-muted">
                        <th className="px-4 py-3">Category</th>
                        <th className="px-4 py-3">Team</th>
                        <th className="px-4 py-3 text-right">Tickets</th>
                        <th className="px-4 py-3 text-right">Open</th>
                        <th className="px-4 py-3 text-right">Awaiting</th>
                        <th className="px-4 py-3 text-right">Overdue</th>
                        <th className="px-4 py-3">Resolution</th>
                        <th className="w-8 px-2 py-3" aria-hidden />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {shown.map((c) => (
                        <tr key={c.id} onClick={() => !c.other && setOpenId(c.id)} className="cursor-pointer transition-colors hover:bg-blue-50/40">
                          <td className="max-w-[18rem] px-4 py-3">
                            <p className="font-medium leading-snug text-foreground">{c.title}</p>
                            <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-700">
                              <FiClock className="h-3 w-3" /> SLA {c.sla_hours}h
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <AvatarStack people={[...c.super_agents, ...c.agents]} />
                            <p className="mt-1 text-[11px] text-muted">
                              {c.super_agents.length} super · {c.agents.length} agents
                            </p>
                          </td>
                          <td className="px-4 py-3 text-right tabular-nums">{c.tickets.total.toLocaleString()}</td>
                          <td className="px-4 py-3 text-right tabular-nums">{c.tickets.open.toLocaleString()}</td>
                          <td className={`px-4 py-3 text-right tabular-nums ${c.tickets.awaiting_reply ? "font-semibold text-blue-700" : ""}`}>
                            {c.tickets.awaiting_reply.toLocaleString()}
                          </td>
                          <td className={`px-4 py-3 text-right tabular-nums ${c.sla.overdue ? "font-semibold text-rose-600" : ""}`}>
                            {c.sla.overdue.toLocaleString()}
                          </td>
                          <td className="px-4 py-3">
                            <RateBar rate={c.tickets.resolution_rate} />
                          </td>
                          <td className="px-2 py-3 text-muted">
                            <FiChevronRight />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Phones: cards */}
                <ul className="divide-y divide-border md:hidden">
                  {shown.map((c) => (
                    <li key={c.id}>
                      <button type="button" onClick={() => !c.other && setOpenId(c.id)} className="w-full px-4 py-4 text-left">
                        <div className="flex items-start justify-between gap-3">
                          <p className="min-w-0 font-medium leading-snug text-foreground">{c.title}</p>
                          <span className="shrink-0 rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-700">SLA {c.sla_hours}h</span>
                        </div>
                        <div className="mt-3 grid grid-cols-4 gap-2 text-center">
                          {[
                            ["Tickets", c.tickets.total, ""],
                            ["Open", c.tickets.open, ""],
                            ["Awaiting", c.tickets.awaiting_reply, c.tickets.awaiting_reply ? "text-blue-700" : ""],
                            ["Overdue", c.sla.overdue, c.sla.overdue ? "text-rose-600" : ""],
                          ].map(([label, value, cls]) => (
                            <div key={label as string} className="rounded-lg bg-surface-muted/60 py-1.5">
                              <p className={`text-base font-semibold tabular-nums ${cls}`}>{Number(value).toLocaleString()}</p>
                              <p className="text-[10px] text-muted">{label}</p>
                            </div>
                          ))}
                        </div>
                        <div className="mt-3"><SlaBar c={c} /></div>
                        <div className="mt-3 flex items-center justify-between gap-3">
                          <AvatarStack people={[...c.super_agents, ...c.agents]} max={5} />
                          <RateBar rate={c.tickets.resolution_rate} />
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </section>
        </>
      )}

      {/* Rendered on <body>: inside the page it sat under the dashboard's top bar. */}
      {typeof document !== "undefined" &&
        createPortal(
          <AnimatePresence>
            {selected && (
              <DetailPanel
                key={selected.id}
                category={selected}
                onClose={() => setOpenId(null)}
                onSlaSaved={savedSla(selected.id)}
                staff={staff}
                onChanged={load}
              />
            )}
            {popup === "attention" && !chatTicket && (
              <Popup
                key="attention"
                title="Tickets at risk"
                subtitle={`${totals.overdue} overdue · ${totals.dueSoon} due soon, most urgent first`}
                onClose={() => setPopup(null)}
              >
                <AttentionList tickets={attention} onOpen={(t) => setChatTicket({ ...t, raw: t })} />
              </Popup>
            )}
            {popup === "staff" && (
              <Popup key="staff" title="Staff" subtitle={`${totals.online} of ${totals.staff} available now`} onClose={() => setPopup(null)}>
                <StaffList categories={categories} />
              </Popup>
            )}
          </AnimatePresence>,
          document.body
        )}

      <AnimatePresence>
        {chatTicket && <ChatModal key={chatTicket.id} ticket={chatTicket} open onClose={() => setChatTicket(null)} onMessageAdded={load} />}
      </AnimatePresence>
    </div>
  );
}
