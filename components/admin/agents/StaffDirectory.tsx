"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  FiAlertCircle,
  FiCheck,
  FiEdit2,
  FiInbox,
  FiMail,
  FiPhone,
  FiPlus,
  FiRefreshCw,
  FiSearch,
  FiShield,
  FiTag,
  FiTrash2,
  FiUser,
  FiUserCheck,
  FiUsers,
  FiX,
} from "react-icons/fi";
import { toast } from "sonner";

import api from "@/lib/axios";
import { apiErrorMessage } from "@/lib/apiError";
import AddAgentModal from "@/components/admin/agents/AddAgentModal";
import { Avatar } from "@/components/admin/categories/CategoryOverview";

// GET /staff/overview/
type Staff = {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: "agent" | "super_agent";
  status: string | null;
  categories: { id: string; title: string }[];
  tickets: { open: number; awaiting_reply: number };
  joined: string | null;
};
type CategoryOption = { id: string; title: string };

const ROLE_LABEL = { agent: "Agent", super_agent: "Super agent" };

function statusKey(s: string | null) {
  const v = (s ?? "").toLowerCase();
  return v === "available" ? "available" : v === "engaged" ? "engaged" : "offline";
}

const STATUS_STYLE = {
  available: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  engaged: "bg-amber-50 text-amber-800 ring-amber-200",
  offline: "bg-slate-100 text-slate-600 ring-slate-200",
};

function StatusPill({ status }: { status: string | null }) {
  const k = statusKey(status);
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium capitalize ring-1 ${STATUS_STYLE[k]}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${k === "available" ? "bg-emerald-500" : k === "engaged" ? "bg-amber-500" : "bg-slate-400"}`} />
      {k}
    </span>
  );
}

function RoleBadge({ role }: { role: Staff["role"] }) {
  return role === "super_agent" ? (
    <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-md bg-violet-50 px-2 py-0.5 text-xs font-semibold text-violet-700 ring-1 ring-violet-200">
      <FiShield className="h-3 w-3" /> Super agent
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-md bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700 ring-1 ring-blue-200">
      <FiUser className="h-3 w-3" /> Agent
    </span>
  );
}

function CategoryChips({ categories }: { categories: Staff["categories"] }) {
  if (!categories.length) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700">
        <FiAlertCircle className="h-3.5 w-3.5" /> No category
      </span>
    );
  }
  return (
    <span className="flex flex-wrap gap-1">
      {categories.map((c) => (
        <span key={c.id} className="max-w-[14rem] truncate rounded-md bg-slate-100 px-1.5 py-0.5 text-xs text-slate-700" title={c.title}>
          {c.title}
        </span>
      ))}
    </span>
  );
}

function Kpi({ icon, label, value, hint, onClick, active }: { icon: React.ReactNode; label: string; value: number; hint?: string; onClick?: () => void; active?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-2xl border bg-card p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 ${
        active ? "border-blue-400 ring-1 ring-blue-200" : "border-border"
      }`}
    >
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-muted">{label}</p>
        <span className="text-slate-400" aria-hidden>{icon}</span>
      </div>
      <p className="mt-1.5 text-2xl font-semibold tabular-nums text-foreground">{value.toLocaleString()}</p>
      {hint && <p className="mt-0.5 text-xs text-muted">{hint}</p>}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Manage one person's categories
// ---------------------------------------------------------------------------
function CategoriesDialog({
  person,
  options,
  onClose,
  onChanged,
}: {
  person: Staff;
  options: CategoryOption[] | null;
  onClose: () => void;
  onChanged: () => void;
}) {
  const [mine, setMine] = useState(() => new Set(person.categories.map((c) => c.id)));
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function toggle(c: CategoryOption) {
    const on = mine.has(c.id);
    setBusy(c.id);
    try {
      await api.post(on ? "/remove-user/from-category/" : "/assign-category/to-user/", {
        category_id: c.id,
        assigned_to_id: person.id,
      });
      setMine((prev) => {
        const next = new Set(prev);
        if (on) next.delete(c.id);
        else next.add(c.id);
        return next;
      });
      toast.success(on ? `Removed from ${c.title}` : `Added to ${c.title}`);
      onChanged();
    } catch (err) {
      toast.error(apiErrorMessage(err, "Couldn't update the categories."));
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6" role="dialog" aria-modal="true" aria-label={`Categories for ${person.name}`}>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-950/50" onClick={onClose} />
      <motion.div
        initial={{ y: 16, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 8, opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="relative flex max-h-[88dvh] w-full max-w-lg flex-col overflow-hidden rounded-3xl bg-white shadow-2xl"
      >
        <header className="flex items-start justify-between gap-3 border-b border-slate-200 px-5 py-4">
          <div className="flex min-w-0 items-center gap-3">
            <Avatar person={person} size={40} />
            <div className="min-w-0">
              <h2 className="truncate text-base font-semibold text-slate-900">{person.name}</h2>
              <p className="truncate text-xs text-slate-500">
                {ROLE_LABEL[person.role]} · {person.email}
              </p>
            </div>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded-full p-2 text-slate-500 hover:bg-slate-100">
            <FiX className="h-5 w-5" />
          </button>
        </header>
        <div className="flex-1 overflow-y-auto px-5 py-4">
          <p className="mb-3 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <FiTag className="h-3.5 w-3.5" /> Categories they cover
          </p>
          {options === null ? (
            <p className="text-sm text-slate-500">Loading…</p>
          ) : (
            <ul className="space-y-2">
              {options.map((c) => {
                const on = mine.has(c.id);
                return (
                  <li key={c.id}>
                    <button
                      type="button"
                      onClick={() => toggle(c)}
                      disabled={busy === c.id}
                      aria-pressed={on}
                      className={`flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left text-sm transition disabled:opacity-60 ${
                        on ? "border-blue-300 bg-blue-50 text-blue-900" : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <span
                        className={`inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${
                          on ? "border-blue-600 bg-blue-600 text-white" : "border-slate-300 bg-white"
                        }`}
                        aria-hidden
                      >
                        {on && <FiCheck className="h-3.5 w-3.5" />}
                      </span>
                      <span className="min-w-0 flex-1">{c.title}</span>
                      {busy === c.id && <FiRefreshCw className="h-4 w-4 animate-spin text-slate-400" aria-hidden />}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </motion.div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Edit one person's name, email and phone
// ---------------------------------------------------------------------------
function EditDialog({ person, onClose, onSaved }: { person: Staff; onClose: () => void; onSaved: (s: Staff) => void }) {
  const [form, setForm] = useState({ name: person.name, email: person.email, phone_number: person.phone ?? "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const emailChanged = form.email.trim().toLowerCase() !== person.email.toLowerCase();
  const changed = form.name.trim() !== person.name || emailChanged || form.phone_number.trim() !== (person.phone ?? "");

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return setError("Enter a name.");
    if (!form.email.trim()) return setError("Enter an email address.");
    setSaving(true);
    setError(null);
    try {
      const res = await api.patch(`/staff/${person.id}/`, {
        name: form.name.trim(),
        email: form.email.trim(),
        phone_number: form.phone_number.trim(),
      });
      onSaved({ ...person, name: res.data.name ?? form.name, email: res.data.email ?? form.email, phone: res.data.phone_number ?? form.phone_number });
      toast.success(emailChanged ? `Saved. ${res.data.name ?? form.name} now signs in with the new email.` : "Details saved");
      onClose();
    } catch (err) {
      setError(apiErrorMessage(err, "Couldn't save the changes."));
    } finally {
      setSaving(false);
    }
  }

  const input =
    "w-full rounded-xl border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6" role="dialog" aria-modal="true" aria-label={`Edit ${person.name}`}>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-950/50" onClick={onClose} />
      <motion.form
        onSubmit={save}
        initial={{ y: 16, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 8, opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="relative w-full max-w-md rounded-3xl bg-white p-5 shadow-2xl sm:p-6"
      >
        <header className="mb-4 flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <Avatar person={person} size={40} />
            <div className="min-w-0">
              <h2 className="inline-flex items-center gap-1.5 text-base font-semibold text-slate-900">
                <FiEdit2 className="h-4 w-4 text-blue-600" /> Edit details
              </h2>
              <p className="truncate text-xs text-slate-500">{ROLE_LABEL[person.role]}</p>
            </div>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded-full p-2 text-slate-500 hover:bg-slate-100">
            <FiX className="h-5 w-5" />
          </button>
        </header>
        <div className="space-y-4">
          {(
            [
              ["staff-name", "Full name", "name", "text", <FiUser key="i" />],
              ["staff-email", "Email", "email", "email", <FiMail key="i" />],
              ["staff-phone", "Phone", "phone_number", "tel", <FiPhone key="i" />],
            ] as const
          ).map(([id, label, key, type, icon]) => (
            <div key={id}>
              <label htmlFor={id} className="mb-1 block text-sm font-medium text-slate-700">
                {label}
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden>
                  {icon}
                </span>
                <input id={id} type={type} value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} className={input} />
              </div>
            </div>
          ))}
          {emailChanged && (
            <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900">
              The email is also their sign-in. After saving, they sign in with the new email; their password stays the same.
            </p>
          )}
          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-xl px-3.5 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100">
            Cancel
          </button>
          <button
            type="submit"
            disabled={!changed || saving}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-40"
          >
            <FiCheck /> {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </motion.form>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
type RoleFilter = "all" | "agent" | "super_agent";
type StatusFilter = "all" | "available" | "engaged" | "offline";

/** The admin Agents page: everyone who handles tickets, what they cover and how busy they are. */
export default function StaffDirectory() {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [options, setOptions] = useState<CategoryOption[] | null>(null);

  const [search, setSearch] = useState("");
  const [role, setRole] = useState<RoleFilter>("all");
  const [statusF, setStatusF] = useState<StatusFilter>("all");
  const [category, setCategory] = useState("all");
  const [onlyUncovered, setOnlyUncovered] = useState(false);

  const [managing, setManaging] = useState<Staff | null>(null);
  const [editing, setEditing] = useState<Staff | null>(null);
  const [adding, setAdding] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/staff/overview/");
      setStaff(Array.isArray(res?.data?.staff) ? res.data.staff : []);
    } catch (err) {
      setError(apiErrorMessage(err, "Couldn't load the team."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    api
      .get("/get-all-category/")
      .then((res) =>
        setOptions(
          (Array.isArray(res?.data) ? res.data : [])
            .map((c: any) => ({ id: String(c.id), title: String(c.title) }))
            .sort((a: CategoryOption, b: CategoryOption) => a.title.localeCompare(b.title))
        )
      )
      .catch(() => setOptions([]));
  }, [load]);

  const counts = useMemo(
    () => ({
      total: staff.length,
      agents: staff.filter((s) => s.role === "agent").length,
      supers: staff.filter((s) => s.role === "super_agent").length,
      available: staff.filter((s) => statusKey(s.status) === "available").length,
      uncovered: staff.filter((s) => s.categories.length === 0).length,
      open: staff.reduce((n, s) => n + s.tickets.open, 0),
    }),
    [staff]
  );

  const shown = useMemo(() => {
    const q = search.trim().toLowerCase();
    return staff.filter((s) => {
      if (role !== "all" && s.role !== role) return false;
      if (statusF !== "all" && statusKey(s.status) !== statusF) return false;
      if (category !== "all" && !s.categories.some((c) => c.id === category)) return false;
      if (onlyUncovered && s.categories.length) return false;
      if (!q) return true;
      return [s.name, s.email, s.phone, ...s.categories.map((c) => c.title)].some((v) => (v ?? "").toLowerCase().includes(q));
    });
  }, [staff, search, role, statusF, category, onlyUncovered]);

  async function remove(s: Staff) {
    if (!window.confirm(`Remove ${s.name} (${s.email})?\n\nTheir account is deleted and they can no longer sign in.`)) return;
    setRemoving(s.id);
    try {
      await api.delete(`/delete-user-account/${s.id}/`);
      toast.success(`${s.name} removed`);
      setStaff((list) => list.filter((x) => x.id !== s.id));
    } catch (err) {
      toast.error(apiErrorMessage(err, "Couldn't remove them."));
    } finally {
      setRemoving(null);
    }
  }

  const clearFilters = () => {
    setSearch("");
    setRole("all");
    setStatusF("all");
    setCategory("all");
    setOnlyUncovered(false);
  };
  const filtering = search || role !== "all" || statusF !== "all" || category !== "all" || onlyUncovered;

  const Actions = ({ s }: { s: Staff }) => (
    <div className="flex items-center justify-end gap-1.5">
      <button
        type="button"
        onClick={() => setEditing(s)}
        aria-label={`Edit ${s.name}`}
        title="Edit name, email or phone"
        className="rounded-lg p-1.5 text-muted hover:bg-blue-50 hover:text-blue-700"
      >
        <FiEdit2 className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => setManaging(s)}
        className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 py-1.5 text-xs font-semibold text-foreground hover:bg-slate-50"
      >
        <FiTag className="h-3.5 w-3.5" /> Categories
      </button>
      <button
        type="button"
        onClick={() => remove(s)}
        disabled={removing === s.id}
        aria-label={`Remove ${s.name}`}
        title="Remove this person"
        className="rounded-lg p-1.5 text-muted hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50"
      >
        <FiTrash2 className="h-4 w-4" />
      </button>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-600">Team</p>
          <h1 className="mt-1 inline-flex items-center gap-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            <FiUsers className="h-7 w-7 text-blue-600" aria-hidden /> Agents
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-muted">Everyone who handles tickets, the categories they cover, and how busy they are right now.</p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={load}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-sm font-medium text-foreground shadow-sm hover:bg-slate-50 disabled:opacity-60"
          >
            <FiRefreshCw className={loading ? "animate-spin" : ""} /> Refresh
          </button>
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-3.5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
          >
            <FiPlus /> Add agent
          </button>
        </div>
      </div>

      {/* Summary, each a quick filter */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <Kpi icon={<FiUsers />} label="Team" value={counts.total} hint={`${counts.open} open tickets assigned`} onClick={clearFilters} active={!filtering} />
        <Kpi icon={<FiUser />} label="Agents" value={counts.agents} onClick={() => setRole(role === "agent" ? "all" : "agent")} active={role === "agent"} />
        <Kpi icon={<FiShield />} label="Super agents" value={counts.supers} onClick={() => setRole(role === "super_agent" ? "all" : "super_agent")} active={role === "super_agent"} />
        <Kpi
          icon={<FiUserCheck />}
          label="Available now"
          value={counts.available}
          onClick={() => setStatusF(statusF === "available" ? "all" : "available")}
          active={statusF === "available"}
        />
        <Kpi
          icon={<FiAlertCircle />}
          label="Without a category"
          value={counts.uncovered}
          hint={counts.uncovered ? "They receive nothing" : "Everyone is placed"}
          onClick={() => setOnlyUncovered(!onlyUncovered)}
          active={onlyUncovered}
        />
      </div>

      <section className="rounded-2xl border border-border bg-card shadow-sm">
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 border-b border-border p-4">
          <div className="relative min-w-0 flex-1 basis-56">
            <FiSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, email, phone or category"
              aria-label="Search the team"
              className="w-full rounded-xl border border-border bg-surface-muted/50 py-2 pl-9 pr-3 text-sm outline-none focus:border-blue-300 focus:bg-card"
            />
          </div>
          <select value={role} onChange={(e) => setRole(e.target.value as RoleFilter)} aria-label="Role" className="rounded-xl border border-border bg-card px-2.5 py-2 text-sm">
            <option value="all">All roles</option>
            <option value="agent">Agents</option>
            <option value="super_agent">Super agents</option>
          </select>
          <select value={statusF} onChange={(e) => setStatusF(e.target.value as StatusFilter)} aria-label="Availability" className="rounded-xl border border-border bg-card px-2.5 py-2 text-sm">
            <option value="all">Any availability</option>
            <option value="available">Available</option>
            <option value="engaged">Engaged</option>
            <option value="offline">Offline</option>
          </select>
          <select value={category} onChange={(e) => setCategory(e.target.value)} aria-label="Category" className="max-w-[16rem] rounded-xl border border-border bg-card px-2.5 py-2 text-sm">
            <option value="all">All categories</option>
            {(options ?? []).map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>
          {filtering && (
            <button type="button" onClick={clearFilters} className="rounded-xl px-2.5 py-2 text-sm font-medium text-blue-700 hover:bg-blue-50">
              Clear
            </button>
          )}
        </div>

        <p className="px-4 pt-3 text-xs text-muted">
          {loading && !staff.length ? "Loading…" : `${shown.length} of ${staff.length} ${staff.length === 1 ? "person" : "people"}`}
        </p>

        {error ? (
          <div className="m-4 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            <span>{error}</span>
            <button type="button" onClick={load} className="rounded-full border border-red-300 bg-white px-3 py-1 text-xs font-semibold">
              Try again
            </button>
          </div>
        ) : !loading && shown.length === 0 ? (
          <p className="p-10 text-center text-sm text-muted">{staff.length ? "Nobody matches these filters." : "No agents yet. Add the first one."}</p>
        ) : (
          <>
            {/* Wide screens: a table */}
            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs font-medium uppercase tracking-wide text-muted">
                    <th className="px-4 py-3">Person</th>
                    <th className="px-4 py-3">Role</th>
                    <th className="px-4 py-3">Availability</th>
                    <th className="px-4 py-3">Categories</th>
                    <th className="px-4 py-3 text-right">Open tickets</th>
                    <th className="px-4 py-3 text-right">Awaiting reply</th>
                    <th className="px-4 py-3" aria-label="Actions" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {shown.map((s) => (
                    <tr key={s.id} className="transition-colors hover:bg-slate-50/70">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar person={s} size={36} />
                          <div className="min-w-0">
                            <p className="truncate font-medium text-foreground">{s.name}</p>
                            <p className="truncate text-xs text-muted">{s.email}</p>
                            {s.phone && (
                              <p className="inline-flex items-center gap-1 text-xs text-muted">
                                <FiPhone className="h-3 w-3" /> {s.phone}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3"><RoleBadge role={s.role} /></td>
                      <td className="px-4 py-3"><StatusPill status={s.status} /></td>
                      <td className="max-w-[20rem] px-4 py-3"><CategoryChips categories={s.categories} /></td>
                      <td className="px-4 py-3 text-right tabular-nums">{s.tickets.open}</td>
                      <td className={`px-4 py-3 text-right tabular-nums ${s.tickets.awaiting_reply ? "font-semibold text-blue-700" : ""}`}>
                        {s.tickets.awaiting_reply}
                      </td>
                      <td className="px-4 py-3"><Actions s={s} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Phones and tablets: cards */}
            <ul className="grid gap-3 p-4 sm:grid-cols-2 lg:hidden">
              {shown.map((s) => (
                <li key={s.id} className="rounded-2xl border border-border p-4">
                  <div className="flex items-start gap-3">
                    <Avatar person={s} size={40} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-foreground">{s.name}</p>
                      <p className="truncate text-xs text-muted">{s.email}</p>
                      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                        <RoleBadge role={s.role} />
                        <StatusPill status={s.status} />
                      </div>
                    </div>
                  </div>
                  <div className="mt-3"><CategoryChips categories={s.categories} /></div>
                  <div className="mt-3 flex items-center justify-between gap-3 border-t border-border pt-3">
                    <p className="inline-flex items-center gap-1.5 text-xs text-muted">
                      <FiInbox className="h-3.5 w-3.5" /> {s.tickets.open} open · {s.tickets.awaiting_reply} awaiting
                    </p>
                    <Actions s={s} />
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>

      {typeof document !== "undefined" &&
        createPortal(
          <AnimatePresence>
            {managing && (
              <CategoriesDialog key={managing.id} person={managing} options={options} onClose={() => setManaging(null)} onChanged={load} />
            )}
            {editing && (
              <EditDialog
                key={`edit-${editing.id}`}
                person={editing}
                onClose={() => setEditing(null)}
                onSaved={(updated) => setStaff((list) => list.map((x) => (x.id === updated.id ? updated : x)))}
              />
            )}
          </AnimatePresence>,
          document.body
        )}

      <AddAgentModal
        isOpen={adding}
        onClose={() => setAdding(false)}
        onSuccess={() => {
          setAdding(false);
          load();
        }}
      />
    </div>
  );
}
