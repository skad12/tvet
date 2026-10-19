"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { FiBriefcase, FiCrosshair, FiMessageSquare, FiSearch, FiUser, FiX } from "react-icons/fi";

import api from "@/lib/axios";
import { apiErrorMessage } from "@/lib/apiError";
import ChatModal from "@/components/admin/tickets/ChatModal";
import TicketTimeline from "@/components/tickets/TicketTimeline";
import SlaBadge, { ticketReference } from "@/components/tickets/SlaBadge";
import TicketRef from "@/components/tickets/TicketRef";
import VerifiedBadge from "@/components/tickets/VerifiedBadge";

type Role = "admin" | "agent" | "super_agent";

// What each role may do from the conversation, matching their dashboards.
const CHAT_FLAGS: Record<Role, { canAssign: boolean; canEscalate: boolean; canMove: boolean }> = {
  admin: { canAssign: true, canEscalate: true, canMove: true },
  agent: { canAssign: false, canEscalate: true, canMove: false },
  super_agent: { canAssign: true, canEscalate: false, canMove: true },
};

function when(value: string | null | undefined) {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime())
    ? null
    : d.toLocaleString(undefined, { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  const empty = value == null || value === "" || value === "null";
  return (
    <div className="min-w-0">
      <dt className="text-[11px] font-medium uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className={`mt-0.5 break-words text-sm ${empty ? "text-slate-400" : "text-slate-800"}`}>{empty ? "—" : value}</dd>
    </div>
  );
}

function Chip({ children, tone }: { children: React.ReactNode; tone: "green" | "amber" | "red" | "blue" | "slate" }) {
  const cls = {
    green: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    amber: "bg-amber-50 text-amber-800 ring-amber-200",
    red: "bg-red-50 text-red-700 ring-red-200",
    blue: "bg-blue-50 text-blue-700 ring-blue-200",
    slate: "bg-slate-50 text-slate-700 ring-slate-200",
  }[tone];
  return <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ${cls}`}>{children}</span>;
}

function Result({ t, onClose, onViewConversation }: { t: any; onClose: () => void; onViewConversation: () => void }) {
  const resolved = String(t.ticket_status ?? "").toLowerCase() === "resolved";

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6" role="dialog" aria-modal="true" aria-label={`Ticket ${ticketReference(t)}`}>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-950/50" onClick={onClose} />
      <motion.div
        initial={{ y: 16, opacity: 0, scale: 0.98 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 8, opacity: 0, scale: 0.98 }}
        transition={{ duration: 0.2 }}
        className="relative flex max-h-[92dvh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl"
      >
        <header className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-200 px-5 py-4 sm:px-6">
          <div className="min-w-0">
            <TicketRef ticket={t} className="-ml-1 text-xs text-blue-600" />
            <h2 className="mt-0.5 truncate text-lg font-semibold text-slate-900">{t.name || t.email || "Ticket"}</h2>
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <Chip tone={resolved ? "green" : "amber"}>{resolved ? "Resolved" : t.ticket_status || "Pending"}</Chip>
              {t.escalated && <Chip tone="red">Escalated</Chip>}
              {t.awaiting_reply && !resolved && <Chip tone="blue">Awaiting reply</Chip>}
              <SlaBadge ticket={t} />
              <VerifiedBadge ticket={t} />
            </div>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded-full p-2 text-slate-500 hover:bg-slate-100">
            <FiX className="h-5 w-5" />
          </button>
        </header>

        <div className="grid flex-1 gap-5 overflow-y-auto px-5 py-5 sm:px-6 lg:grid-cols-[1fr_17rem]">
          <div className="space-y-5">
            <section>
              <h3 className="mb-3 inline-flex items-center gap-1.5 text-sm font-semibold text-slate-900">
                <FiUser className="h-4 w-4 text-slate-500" aria-hidden /> Trainee
              </h3>
              <dl className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
                <Field label="Name" value={t.name} />
                <Field label="Email" value={t.email} />
                <Field label="Phone" value={t.phone} />
                <Field label="Application / Reg. ID" value={t.app_id} />
                <Field label="Registered as" value={t.role} />
              </dl>
            </section>

            <section className="border-t border-slate-200 pt-5">
              <h3 className="mb-3 inline-flex items-center gap-1.5 text-sm font-semibold text-slate-900">
                <FiBriefcase className="h-4 w-4 text-slate-500" aria-hidden /> Handling
              </h3>
              <dl className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
                <Field label="Category" value={t.escalated_category || t.category || "Other category"} />
                <Field label="Assigned agent" value={t.assigned_to_name || t.assigned_to} />
                <Field label="Last activity" value={when(t.last_message_at)} />
                <Field
                  label="Messages"
                  value={t.messages ? `${t.messages.from_trainee} from trainee · ${t.messages.replies} replies` : null}
                />
                <Field label="Time to first staff reply" value={t.time_to_first_response != null ? `${Math.round(t.time_to_first_response / 60)} min` : null} />
                <Field label="Time to resolve" value={t.resolution_time != null ? `${Math.round(t.resolution_time / 60)} min` : null} />
              </dl>
            </section>
          </div>

          <TicketTimeline ticket={t} />
        </div>

        <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-slate-50 px-5 py-3 sm:px-6">
          <p className="text-xs text-slate-500">The conversation is not shown here.</p>
          <button
            type="button"
            onClick={onViewConversation}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
          >
            <FiMessageSquare /> View conversation
          </button>
        </footer>
      </motion.div>
    </div>
  );
}

/**
 * Look up any ticket the signed-in staff member may see, by its reference
 * (#A1B2C3) or full id: status, SLA, timeline and details, with the
 * conversation one click away.
 */
/**
 * Look a ticket up by its reference. `compact` is the slim field used in the
 * dashboards' top bars; the full bar sits on the ticket pages.
 */
export default function TrackTicket({ role, compact = false }: { role: Role; compact?: boolean }) {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ticket, setTicket] = useState<any | null>(null);
  const [chatOpen, setChatOpen] = useState(false);

  async function track(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/tickets/track/", { params: { q } });
      setTicket(res.data);
    } catch (err) {
      setError(apiErrorMessage(err, "Couldn't find that ticket."));
    } finally {
      setLoading(false);
    }
  }

  // ChatModal reads the API's fields from `raw` as well as the top level.
  const chatTicket = ticket ? { ...ticket, raw: ticket } : null;

  const onType = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    setError(null);
  };

  const overlays = (
    <>
      {/* On <body>, so the result is never drawn under a dashboard's top bar. */}
      {typeof document !== "undefined" &&
        createPortal(
          <AnimatePresence>
            {ticket && !chatOpen && (
              <Result t={ticket} onClose={() => setTicket(null)} onViewConversation={() => setChatOpen(true)} />
            )}
          </AnimatePresence>,
          document.body
        )}
      <AnimatePresence>
        {chatTicket && chatOpen && (
          <ChatModal key={chatTicket.id} ticket={chatTicket} open onClose={() => setChatOpen(false)} {...CHAT_FLAGS[role]} />
        )}
      </AnimatePresence>
    </>
  );

  if (compact) {
    return (
      <form onSubmit={track} role="search" aria-label="Track a ticket" className="relative">
        <FiCrosshair className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-blue-600" aria-hidden />
        <input
          value={query}
          onChange={onType}
          placeholder="Track ticket, e.g. #A1B2C3"
          aria-label="Ticket reference"
          autoComplete="off"
          spellCheck={false}
          className="w-full rounded-full border border-border bg-input-bg py-2 pl-9 pr-16 font-mono text-sm uppercase text-foreground shadow-inner outline-none placeholder:font-sans placeholder:normal-case focus:ring-2 focus:ring-ring"
        />
        <button
          type="submit"
          disabled={loading || !query.trim()}
          className="absolute right-1 top-1/2 -translate-y-1/2 rounded-full bg-blue-600 px-3 py-1 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-40"
        >
          {loading ? "…" : "Track"}
        </button>
        {error && (
          <p role="alert" className="absolute left-0 right-0 top-full z-50 mt-1.5 rounded-xl border border-red-200 bg-white px-3 py-2 text-xs text-red-700 shadow-lg">
            {error}
          </p>
        )}
        {overlays}
      </form>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-card px-3 py-3 shadow-sm sm:px-4">
      <form onSubmit={track} className="flex flex-wrap items-center gap-2">
        <label htmlFor={`track-${role}`} className="inline-flex items-center gap-1.5 text-sm font-semibold text-foreground">
          <FiCrosshair className="h-4 w-4 text-blue-600" aria-hidden /> Track a ticket
        </label>
        <div className="relative min-w-0 flex-1 basis-48">
          <FiSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            id={`track-${role}`}
            value={query}
            onChange={onType}
            placeholder="Reference, e.g. #A1B2C3"
            autoComplete="off"
            spellCheck={false}
            className="w-full rounded-xl border border-border bg-surface-muted/50 py-2 pl-9 pr-3 font-mono text-sm uppercase outline-none placeholder:font-sans placeholder:normal-case focus:border-blue-300 focus:bg-card"
          />
        </div>
        <button
          type="submit"
          disabled={loading || !query.trim()}
          className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Searching…" : "Track"}
        </button>
        {error && <p className="basis-full text-xs text-red-600">{error}</p>}
      </form>
      {overlays}
    </div>
  );
}
