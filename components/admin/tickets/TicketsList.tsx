"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { format, isValid } from "date-fns";
import api from "@/lib/axios";
import { apiErrorMessage } from "@/lib/apiError";
import { calculateResolutionTime } from "@/lib/resolutionTime";
import { NEW_MESSAGE_BADGE_CLASS, needsReply, sortByActivity } from "@/lib/ticketActivity";
import SlaBadge from "@/components/tickets/SlaBadge";
import TicketRef from "@/components/tickets/TicketRef";
import VerifiedBadge from "@/components/tickets/VerifiedBadge";
import SourceTag, { sourceOf } from "@/components/tickets/SourceTag";
import TicketInsights from "@/components/tickets/TicketInsights";
import Skeleton, { ChatListSkeleton } from "@/components/ui/Skeleton";
import { toast } from "sonner";
import {
  readCache,
  writeCache,
  describeAge,
  cacheKeys,
} from "@/lib/offlineCache";

// Helper: normalize a status string to canonical values for comparisons
function normalizeStatusValue(statusVal) {
  // if (!statusVal && statusVal !== false) return "active";
  // If statusVal is boolean (e.g., status: false), convert to string
  const raw = String(statusVal).toLowerCase().trim();
  if (raw === "resolved" || raw === "closed" || raw === "completed")
    return "resolved";
  if (raw === "pending" || raw === "waiting" || raw === "in_progress")
    return "pending";
  // if (raw === "active" || raw === "open" || raw === "new")
  //   return "active";
  return raw;
}

// Normalize tickets to expected shape and capture both raw label and normalized value
function normalizeAdminTicket(t) {
  // ONLY use ticket_status (string) field - this is the source of truth
  // Do NOT use the boolean 'status' field as it causes confusion
  const statusRaw = t?.ticket_status ?? t?.state ?? null;

  // statusLabel is for human display (keeps casing from API when possible)
  const statusLabel =
    statusRaw === null || statusRaw === undefined
      ? "Active"
      : typeof statusRaw === "string"
      ? statusRaw
      : String(statusRaw);

  return {
    id: t?.id ?? t?.ticket_id ?? null,
    name: t?.name ?? t?.subject ?? t?.title ?? "From Widget",
    chats: Array.isArray(t?.chats) ? t.chats : t?.messages ?? [],
    email: t?.email ?? t?.user_email ?? "",
    subject: t?.subject ?? t?.title ?? "",
    // normalized status for logic (e.g., filtering)
    status: normalizeStatusValue(statusLabel),
    // human-friendly status label to show in the UI (e.g. "Pending")
    status_label: statusLabel,
    escalated: t?.escalated === true || t?.priority === "high",
    created_at: t?.created_at ?? t?.created_on ?? t?.createdAt ?? null,
    created_at_display: t?.created_at_display ?? null,
    pub_date: t?.pub_date ?? null,
    raw: t,
  };
}

// Keep the first copy of each ticket: after a reorder, a later page can repeat
// one already shown.
function uniqueById(list) {
  const seen = new Set();
  return list.filter((t) => {
    const key = t?.id == null ? null : String(t.id);
    if (key === null) return true;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export default function TicketsList({
  categoryId,
  categoryName,
  statusFilter = "all",
  sourceFilter = "all",
  dateRange = null,
  onSelectTicket,
  selectedTicketId,
  pageSize = 11,
}) {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Numbered pages, counted on the server so they are exact under any filter.
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(pageSize);
  const [count, setCount] = useState(0);
  const [pages, setPages] = useState(1);
  const listRef = useRef(null);

  // When the API is unreachable we keep showing the last tickets we saw.
  // staleSince is when that copy was saved; null means the list is live.
  const [staleSince, setStaleSince] = useState(null);
  // Bumped to re-run the loader when the server looks like it is back.
  const [retryTick, setRetryTick] = useState(0);

  const dateFrom = dateRange?.from || "";
  const dateTo = dateRange?.to || "";
  const dateField = dateRange?.field === "created" ? "created" : "activity";

  // Category, status and dates are filtered on the server, so the counts and
  // pages are right across the whole list.
  const filterParams = React.useMemo(() => {
    const p: Record<string, string> = {};
    if (categoryId) p.category = String(categoryId);
    if (statusFilter && statusFilter !== "all") p.state = statusFilter;
    if (sourceFilter && sourceFilter !== "all") p.source = sourceFilter;
    if (dateFrom) p.from = dateFrom;
    if (dateTo) p.to = dateTo;
    if (dateFrom || dateTo) p.date_field = dateField;
    return p;
  }, [categoryId, statusFilter, sourceFilter, dateFrom, dateTo, dateField]);
  const insightParams = filterParams;
  const filterKey = JSON.stringify(filterParams);
  // Only the unfiltered first page is saved for offline use.
  const cacheable = Object.keys(filterParams).length === 0 && page === 1;

  // Back to page 1 whenever the filters or the page size change.
  useEffect(() => {
    setPage(1);
  }, [filterKey, perPage]);

  const fetchPage = useCallback(
    (signal?: AbortSignal) =>
      api.get("/tickets/paged/", { params: { ...JSON.parse(filterKey), page, page_size: perPage }, signal }),
    [filterKey, page, perPage]
  );

  useEffect(() => {
    let mounted = true;
    const ac = new AbortController();
    setLoading(true);
    setError(null);
    fetchPage(ac.signal)
      .then((res) => {
        if (!mounted) return;
        const data = res?.data ?? {};
        const rows = uniqueById((Array.isArray(data.results) ? data.results : []).map(normalizeAdminTicket));
        setTickets(rows);
        setCount(Number(data.count) || 0);
        setPages(Math.max(1, Number(data.pages) || 1));
        if (data.page && data.page !== page) setPage(data.page);
        if (cacheable && rows.length) writeCache(cacheKeys.adminTickets(null), rows);
        setStaleSince(null);
      })
      .catch((err) => {
        const canceled = err?.name === "AbortError" || err?.name === "CanceledError" || err?.code === "ERR_CANCELED";
        if (canceled || !mounted) return;
        console.error("Failed to load tickets:", err);
        // Server unreachable: show the last saved first page rather than nothing.
        const cached = readCache(cacheKeys.adminTickets(null));
        const cachedList = Array.isArray(cached?.value) ? cached.value : [];
        if (cachedList.length) {
          setTickets(cachedList);
          setCount(cachedList.length);
          setPages(1);
          setStaleSince(cached.savedAt);
        } else {
          const message = apiErrorMessage(err, "Failed to load tickets");
          setError(message);
          toast.error(message);
          setTickets([]);
        }
      })
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
      ac.abort();
    };
    // cacheable follows page and filterKey, which are already dependencies.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchPage, retryTick]);

  // While we are showing a saved copy, keep an eye out for the server coming
  // back: on the browser's own online event, when the tab is focused again,
  // and on a slow poll so a server that recovers quietly is still noticed.
  useEffect(() => {
    if (!staleSince) return undefined;
    const retry = () => setRetryTick((n) => n + 1);
    const onVisible = () => {
      if (document.visibilityState === "visible") retry();
    };
    window.addEventListener("online", retry);
    document.addEventListener("visibilitychange", onVisible);
    const timer = window.setInterval(retry, 30000);
    return () => {
      window.removeEventListener("online", retry);
      document.removeEventListener("visibilitychange", onVisible);
      window.clearInterval(timer);
    };
  }, [staleSince]);

  // Re-read the page on screen every 15 seconds, so a ticket a trainee has
  // just written to moves up and gets its badge without a reload.
  useEffect(() => {
    if (staleSince) return undefined;
    const refresh = async () => {
      if (document.visibilityState !== "visible") return;
      try {
        const res = await fetchPage();
        const data = res?.data ?? {};
        setTickets(uniqueById((Array.isArray(data.results) ? data.results : []).map(normalizeAdminTicket)));
        setCount(Number(data.count) || 0);
        setPages(Math.max(1, Number(data.pages) || 1));
      } catch {
        // The main loader handles outages; a missed refresh just waits for the next.
      }
    };
    const timer = window.setInterval(refresh, 15000);
    return () => window.clearInterval(timer);
  }, [fetchPage, staleSince]);

  function goTo(next: number) {
    const target = Math.min(Math.max(1, next), pages);
    if (target === page) return;
    setPage(target);
    listRef.current?.scrollTo?.({ top: 0, behavior: "smooth" });
  }

  // Apply status filter to displayed tickets (client-side filtering after load)
  const displayedTickets = React.useMemo(() => {
    // The server already applied the dates; repeating it here keeps a saved
    // offline copy honest too. Dates compare as local YYYY-MM-DD strings.
    const dayOf = (v) => {
      if (!v) return null;
      const d = new Date(v);
      return isValid(d) ? format(d, "yyyy-MM-dd") : null;
    };
    // Same rule as the server: created only, or any activity (opened, a
    // message, assigned, escalated, resolved) inside the dates.
    const inRange = (t) => {
      if (!dateFrom && !dateTo) return true;
      const r = t.raw ?? {};
      const moments =
        dateField === "created"
          ? [t.created_at]
          : [t.created_at, r.last_message_at, r.agent_assigned_at, r.escalated_at, r.resolved_at];
      return moments.some((v) => {
        const day = dayOf(v);
        return Boolean(day) && (!dateFrom || day >= dateFrom) && (!dateTo || day <= dateTo);
      });
    };
    const fromWanted = (t) => !sourceFilter || sourceFilter === "all" || sourceOf(t.raw?.role) === sourceFilter;
    const byActivity = sortByActivity(tickets).filter(inRange).filter(fromWanted);
    if (!statusFilter || statusFilter === "all") return byActivity;

    function normalizeStatusForFilter(status) {
      if (!status) return "pending";
      const s = String(status).toLowerCase().trim();
      if (s === "resolved" || s === "closed" || s === "completed")
        return "resolved";
      if (s === "pending" || s === "waiting" || s === "in_progress")
        return "pending";

      return s;
    }

    const wanted = statusFilter.toLowerCase();
    // Escalated: handed up and not yet resolved, whatever its status word.
    if (wanted === "escalated") {
      return byActivity.filter((t) => t.raw?.escalated === true && normalizeStatusForFilter(t.status) !== "resolved");
    }
    // Pending = not resolved yet, as on the server.
    if (wanted === "pending") {
      return byActivity.filter((t) => normalizeStatusForFilter(t.status) !== "resolved");
    }
    return byActivity.filter((t) => {
      const ticketStatusNormalized = normalizeStatusForFilter(t.status);
      return ticketStatusNormalized === wanted;
    });
  }, [tickets, statusFilter, sourceFilter, dateFrom, dateTo, dateField]);

  // Format date safely; prefer server's created_at_display if given
  // Uses same format as AgentChatList: PPpp
  function formatMaybeDate(val: any, display?: any) {
    if (display) return display;
    if (!val) return "—";
    const dt = new Date(val);
    if (isValid(dt)) return format(dt, "PPpp");
    try {
      return String(val).slice(0, 32);
    } catch {
      return "—";
    }
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <div className="p-4 border-b border-slate-200">
        <h3 className="text-lg font-semibold text-slate-800">
          {categoryId
            ? `Tickets in ${categoryName || categoryId}`
            : "All Tickets"}
          {statusFilter !== "all" &&
            ` - ${
              statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)
            }`}
        </h3>
        <p className="text-sm text-slate-500 mt-1">
          {loading
            ? "Loading..."
            : count === 0
            ? "No tickets"
            : `Showing ${(page - 1) * perPage + 1}–${Math.min(page * perPage, count)} of ${count} ticket${count === 1 ? "" : "s"}`}
        </p>
        <TicketInsights params={insightParams} />

        {staleSince && (
          <div
            role="status"
            className="mt-3 flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800"
          >
            <span aria-hidden="true">⚠</span>
            <span>
              Can&apos;t reach the server. Showing tickets saved{" "}
              {describeAge(staleSince)}; this will refresh on its own once the
              connection is back.
            </span>
          </div>
        )}
      </div>

      <div ref={listRef} className="max-h-[640px] overflow-y-auto">
        {loading ? (
          <div className="p-4">
            <ChatListSkeleton />
          </div>
        ) : error ? (
          <div className="p-4 text-sm text-red-600">{error}</div>
        ) : displayedTickets.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-500">
            <div className="text-4xl mb-2">📋</div>
            <p>
              No tickets found
              {categoryId ? ` in ${categoryName || "this category"}` : ""}
              {statusFilter !== "all" ? ` with status "${statusFilter}"` : ""}
              {dateRange?.from || dateRange?.to ? " in the chosen dates" : ""}
            </p>
          </div>
        ) : (
          <>
            <ul className="divide-y divide-slate-100">
              <AnimatePresence>
                {displayedTickets.map((ticket, idx) => {
                  const isSelected = selectedTicketId === ticket.id;
                  // Use title attribute to show full raw timestamp on hover
                  const lastActivity = ticket.raw?.last_message_at ?? ticket.created_at;
                  const titleAttr = lastActivity ?? "";
                  const awaiting = needsReply(ticket);
                  // Ensure unique key by combining id with index
                  const uniqueKey = ticket.id
                    ? `${ticket.id}-${idx}`
                    : `ticket-${idx}`;
                  const resolvedAt =
                    ticket.raw?.resolved_at ?? ticket.resolved_at ?? null;
                  const resolutionTime = calculateResolutionTime(
                    ticket.created_at,
                    resolvedAt,
                    ticket.status
                  );
                  return (
                    <motion.li
                      key={uniqueKey}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      onClick={() => onSelectTicket?.(ticket)}
                      className={`p-4 cursor-pointer transition-all ${
                        isSelected
                          ? "bg-blue-50 border-l-4 border-blue-500"
                          : "hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <TicketRef ticket={ticket} className="-ml-1 text-xs text-slate-500" />
                            <h4 className="font-semibold text-slate-800 truncate">
                              {ticket.name || ticket.subject || "From Widget"}
                            </h4>
                            <VerifiedBadge ticket={ticket} />
                            <SourceTag role={ticket.raw?.role} />

                            {/* Escalated icon shown when escalated === true */}
                            {ticket.escalated && (
                              <svg
                                className="w-4 h-4 text-red-600 shrink-0"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                                aria-label="Escalated"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            )}
                          </div>

                          {ticket.email && (
                            <p className="text-xs text-slate-500 truncate">
                              {ticket.email}
                            </p>
                          )}
                          <p
                            className="text-xs text-slate-400 mt-1"
                            title={titleAttr}
                          >
                            {formatMaybeDate(lastActivity)}
                          </p>
                          {ticket.raw?.escalated_category && (
                            <p className="text-xs text-slate-500 mt-1 truncate">
                              Escalated to: {ticket.raw.escalated_category}
                            </p>
                          )}
                          {resolutionTime && (
                            <p className="text-xs text-emerald-600 mt-1 font-medium">
                              Resolved in {resolutionTime}
                            </p>
                          )}
                        </div>

                        <div className="shrink-0 flex flex-wrap items-center justify-end gap-2">
                          {awaiting && (
                            <span className={NEW_MESSAGE_BADGE_CLASS}>● New message</span>
                          )}
                          <SlaBadge ticket={ticket} />
                          <span
                            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              ticket.status === "resolved"
                                ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                                : ticket.status === "escalated"
                                ? "bg-red-100 text-red-700 border border-red-200"
                                : ticket.status === "pending"
                                ? "bg-amber-100 text-amber-700 border border-amber-200"
                                : "bg-blue-100 text-blue-700 border border-blue-200"
                            }`}
                          >
                            {/* show human-friendly label if available (e.g. "Pending"), otherwise normalized */}
                            {ticket.status_label ?? (ticket.status || "Active")}
                          </span>

                          {/* Escalated badge (always shown when escalated === true) */}
                          {ticket.escalated && (
                            <span className="ml-2 inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
                              <svg
                                className="w-3 h-3"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                                aria-hidden
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                                  clipRule="evenodd"
                                />
                              </svg>
                              Escalated
                            </span>
                          )}
                        </div>
                      </div>
                    </motion.li>
                  );
                })}
              </AnimatePresence>
            </ul>

          </>
        )}
      </div>

      {count > 0 && !staleSince && (
        <Pager page={page} pages={pages} perPage={perPage} onPage={goTo} onPerPage={setPerPage} busy={loading} />
      )}
    </div>
  );
}

/** Page numbers around the current one, with gaps shown as an ellipsis. */
function pageList(page: number, pages: number): (number | "…")[] {
  const keep = new Set([1, pages, page - 1, page, page + 1]);
  if (page <= 3) [2, 3, 4].forEach((n) => keep.add(n));
  if (page >= pages - 2) [pages - 1, pages - 2, pages - 3].forEach((n) => keep.add(n));
  const nums = [...keep].filter((n) => n >= 1 && n <= pages).sort((a, b) => a - b);
  const out: (number | "…")[] = [];
  nums.forEach((n, i) => {
    if (i && n - nums[i - 1] > 1) out.push("…");
    out.push(n);
  });
  return out;
}

function Pager({ page, pages, perPage, onPage, onPerPage, busy }) {
  const btn =
    "inline-flex h-9 min-w-9 items-center justify-center rounded-lg border px-2.5 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-40";
  return (
    <nav
      aria-label="Ticket pages"
      className="flex flex-col gap-3 border-t border-slate-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
    >
      <label className="inline-flex items-center gap-2 text-sm text-slate-500">
        Per page
        <select
          value={perPage}
          onChange={(e) => onPerPage(Number(e.target.value))}
          className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm text-slate-800"
        >
          {[10, 20, 50, 100].map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </label>
      <div className="flex flex-wrap items-center gap-1.5">
        <button type="button" onClick={() => onPage(page - 1)} disabled={page <= 1 || busy} className={`${btn} border-slate-200 bg-white text-slate-700 hover:bg-slate-50`}>
          ‹ Prev
        </button>
        {pageList(page, pages).map((n, i) =>
          n === "…" ? (
            <span key={`gap-${i}`} className="px-1 text-sm text-slate-400" aria-hidden>
              …
            </span>
          ) : (
            <button
              key={n}
              type="button"
              onClick={() => onPage(n)}
              disabled={busy && n !== page}
              aria-current={n === page ? "page" : undefined}
              aria-label={`Page ${n}`}
              className={`${btn} ${n === page ? "border-blue-600 bg-blue-600 text-white" : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"}`}
            >
              {n}
            </button>
          )
        )}
        <button type="button" onClick={() => onPage(page + 1)} disabled={page >= pages || busy} className={`${btn} border-slate-200 bg-white text-slate-700 hover:bg-slate-50`}>
          Next ›
        </button>
      </div>
    </nav>
  );
}
