"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { format, isValid } from "date-fns";
import { useAuth } from "@/context/AuthContext";
import { GoAlertFill } from "react-icons/go";

let api = null;
try {
  api = require("@/lib/axios").default;
} catch (e) {
  api = null;
}

export default function ChatList({
  tickets: ticketsProp = null,
  selected,
  setSelected,
  loading: loadingProp = false,
  userId: propUserId = null,
  userEmail: propUserEmail = null,
  categoryId = null,
  forceFetch = false,
  onRefresh = null,
  refreshing = false,
  skipUserFilter = false,
}) {
  const { user, token } = useAuth?.() ?? {};

  const authUserId =
    user?.app_user_id ??
    user?.appUserId ??
    user?.user_id ??
    user?.userId ??
    user?.id ??
    user?.uid ??
    user?.pk ??
    null;

  const authUserEmail =
    user?.email ??
    user?.username ??
    (Array.isArray(user?.emails) ? user.emails[0] : null) ??
    user?.contact_email ??
    null;

  const effectiveUserId = propUserId ?? authUserId;
  const effectiveUserEmail = propUserEmail ?? authUserEmail;

  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(Boolean(loadingProp || !ticketsProp));
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("all");
  const [newTicketNotice, setNewTicketNotice] = useState(null);
  const [recentlyAdded, setRecentlyAdded] = useState({});
  const seenTicketsRef = useRef(new Set());
  const [showEscalatedOnly, setShowEscalatedOnly] = useState(false);
  const didAutoSelectRef = useRef(false);

  const TABS = [
    { id: "all", label: "All" },
    // { id: "active", label: "Active" },
    { id: "pending", label: "Pending" },
    { id: "resolved", label: "Resolved" },
  ];

  // Normalize a single ticket object from various API shapes.
  // ONLY uses ticket_status field as the source of truth for status
  function normalizeTicket(t) {
    const id = t?.id ?? t?.pk ?? null;
    const subject = t?.subject ?? t?.title ?? null;
    const name = t?.name ?? t?.reporter_name ?? null;
    const email = t?.email ?? t?.reporter_email ?? t?.user_email ?? "";

    // escalate flag
    const isEscalated = t?.escalated === true;

    // ONLY use ticket_status field - THIS IS THE ONLY SOURCE OF TRUTH
    const ticketStatusField =
      (typeof t?.ticket_status === "string" && t.ticket_status.trim()) || null;

    // Build status value - ONLY from ticket_status field
    let statusDisplay = "Pending"; // Default

    if (ticketStatusField) {
      const ticketStatusLower = ticketStatusField.toLowerCase();
      // Normalize to capitalized display names
      if (ticketStatusLower === "resolved") {
        statusDisplay = "Resolved";
      } else if (ticketStatusLower === "pending") {
        statusDisplay = "Pending";
      } else if (ticketStatusLower === "escalated") {
        statusDisplay = "Escalated";
      } else {
        // Keep original casing for other statuses
        statusDisplay =
          ticketStatusField.charAt(0).toUpperCase() +
          ticketStatusField.slice(1);
      }
    }

    const statusKey = statusDisplay
      ? String(statusDisplay).toLowerCase()
      : "pending";

    const created_at = t?.created_at ?? t?.createdAt ?? t?.pub_date ?? null;
    const created_at_display = t?.created_at_display ?? null;

    const ticketUserId =
      t?.user_id ??
      t?.userId ??
      t?.reporter_id ??
      t?.owner ??
      t?.created_by ??
      t?.assigned_to_id ??
      t?.assigned_to?.id ??
      null;

    return {
      id,
      subject,
      name,
      displaySubject: subject ?? name ?? "No subject",
      email,
      status: statusKey,
      statusDisplay,
      ticket_status: ticketStatusField, // Store original ticket_status for reference
      created_at,
      created_at_display,
      raw: { ...t, escalated: isEscalated },
      ticketUserId,
    };
  }

  // Format date safely; prefer server's created_at_display if given
  function formatMaybeDate(val, display) {
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

  function ticketBelongsToUser(normalized, effId, effEmail) {
    if (!effId && !effEmail) return false;
    const raw = normalized.raw ?? {};
    const idCandidates = [
      normalized.ticketUserId,
      raw?.user_id,
      raw?.userId,
      raw?.reporter_id,
      raw?.owner,
      raw?.created_by,
      raw?.user?.id,
      raw?.reporter?.id,
      raw?.assigned_to_id,
      raw?.assigned_to?.id,
    ];
    const emailCandidates = [
      normalized.email,
      raw?.email,
      raw?.reporter_email,
      raw?.user_email,
      raw?.assigned_to_email,
      raw?.reporter?.email,
      raw?.user?.email,
    ];
    const idMatch = effId
      ? idCandidates.some((c) => c != null && String(c) === String(effId))
      : false;
    const emailMatch = effEmail
      ? emailCandidates.some(
          (c) => c && String(c).toLowerCase() === String(effEmail).toLowerCase()
        )
      : false;
    return idMatch || emailMatch;
  }

  // Fetch tickets by user id using the required endpoint
  useEffect(() => {
    if (ticketsProp && !forceFetch) {
      const arr = Array.isArray(ticketsProp) ? ticketsProp : [ticketsProp];
      const normalized = arr.map(normalizeTicket);
      const shouldFilter = skipUserFilter
        ? false
        : Boolean(effectiveUserId || effectiveUserEmail);
      const filteredByUser = shouldFilter
        ? normalized.filter((n) =>
            ticketBelongsToUser(n, effectiveUserId, effectiveUserEmail)
          )
        : normalized;

      setTickets(filteredByUser);
      if (filteredByUser.length > 0 && !didAutoSelectRef.current && !selected) {
        setSelected?.(filteredByUser[0]);
        didAutoSelectRef.current = true;
      }
      setLoading(false);
      setError(null);
      return;
    }

    let mounted = true;
    const ac = new AbortController();

    async function load() {
      if (!effectiveUserId && !effectiveUserEmail) {
        setTickets([]);
        setLoading(false);
        setError("No user identity to fetch tickets for.");
        return;
      }

      setLoading(true);
      setError(null);

      const endpointRelative = categoryId
        ? `/tickets/category-based/?category=${categoryId}`
        : showEscalatedOnly
        ? `/get-all-escalated-tickets/`
        : `/tickets/`;

      try {
        let data;
        if (api && typeof api.get === "function") {
          const headers = token ? { Authorization: `Bearer ${token}` } : {};
          const res = await api.get(endpointRelative, {
            headers,
            signal: ac.signal,
          });
          data = res?.data;
        } else {
          const base =
            typeof window !== "undefined"
              ? process.env.NEXT_PUBLIC_API_BASE
              : undefined;
          const endpoint = base
            ? `${base.replace(/\/$/, "")}${endpointRelative}`
            : endpointRelative;

          const res = await fetch(endpoint, {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            signal: ac.signal,
          });
          if (!res.ok) {
            const text = await res.text().catch(() => "");
            throw new Error(`Failed to load (${res.status}) ${text}`);
          }
          data = await res.json().catch(() => null);
        }

        if (!mounted) return;

        // normalize response — expect an array (per your example)
        let arr = [];
        if (!data) arr = [];
        else if (Array.isArray(data)) arr = data;
        else if (Array.isArray(data.results)) arr = data.results;
        else if (Array.isArray(data.data)) arr = data.data;
        else if (Array.isArray(data.tickets)) arr = data.tickets;
        else arr = [data];

        let normalized = arr.map(normalizeTicket);

        // No longer fetching status from additional endpoint - we only use ticket_status field from ticket data

        const shouldFilter = skipUserFilter
          ? false
          : Boolean(effectiveUserId || effectiveUserEmail);
        const filteredByUser = shouldFilter
          ? normalized.filter((n) =>
              ticketBelongsToUser(n, effectiveUserId, effectiveUserEmail)
            )
          : normalized;

        setTickets(filteredByUser);

        if (
          filteredByUser.length > 0 &&
          !didAutoSelectRef.current &&
          !selected
        ) {
          setSelected?.(filteredByUser[0]);
          didAutoSelectRef.current = true;
        }
      } catch (err) {
        if (
          err?.name === "AbortError" ||
          err?.name === "CanceledError" ||
          err?.code === "ERR_CANCELED" ||
          err?.message === "canceled"
        )
          return;
        console.error("Failed to fetch tickets by user id:", err);
        setError(err.message || "Failed to load tickets");
        setTickets([]);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();

    return () => {
      mounted = false;
      ac.abort();
    };
  }, [
    effectiveUserId,
    effectiveUserEmail,
    token,
    ticketsProp,
    categoryId,
    showEscalatedOnly,
    forceFetch,
    selected,
    setSelected,
    skipUserFilter,
  ]);

  const owned = useMemo(
    () => (Array.isArray(tickets) ? tickets : []),
    [tickets]
  );

  const counts = useMemo(() => {
    const map = { all: owned.length, active: 0, pending: 0, resolved: 0 };
    owned.forEach((t) => {
      const s = (t.status ?? "").toLowerCase();
      if (s === "pending" || s === "waiting") map.pending++;
      else if (s === "resolved") map.resolved++;
      else map.active++;
    });
    return map;
  }, [owned]);

  const filtered = useMemo(() => {
    let list = owned;
    if (showEscalatedOnly) {
      // Filter by escalated flag from raw data
      list = list.filter((t) => t.raw?.escalated === true);
    }
    if (!activeTab || activeTab === "all") return list;
    return list.filter((t) => {
      const s = (t.status ?? "").toLowerCase();
      const statusBool =
        typeof t.raw?.status === "boolean" ? t.raw.status : undefined;
      if (activeTab === "pending") {
        return s === "pending" || s === "waiting" || statusBool === false;
      }
      if (activeTab === "resolved") {
        return s === "resolved" || statusBool === true;
      }
      return s === activeTab;
    });
  }, [owned, activeTab, showEscalatedOnly]);

  const listItem = {
    hidden: { opacity: 0, y: 8 },
    visible: { opacity: 1, y: 0 },
  };

  useEffect(() => {
    const now = Date.now();
    const newIds = [];
    owned.forEach((ticket) => {
      const tid = ticket.id ?? ticket.pk;
      if (!tid) return;
      if (!seenTicketsRef.current.has(tid)) {
        seenTicketsRef.current.add(tid);
        newIds.push(tid);
      }
    });
    if (newIds.length) {
      setRecentlyAdded((prev) => {
        const next = { ...prev };
        newIds.forEach((id) => {
          next[id] = now;
        });
        return next;
      });
      setNewTicketNotice(
        `${newIds.length} new ticket${
          newIds.length > 1 ? "s" : ""
        } assigned to you`
      );
    }
  }, [owned]);

  useEffect(() => {
    if (!newTicketNotice) return;
    const timer = setTimeout(() => setNewTicketNotice(null), 6000);
    return () => clearTimeout(timer);
  }, [newTicketNotice]);

  return (
    <motion.div layout className="bg-white rounded shadow-sm p-0">
      <div className="h-[400px] sm:h-[500px] md:h-[420px] overflow-auto">
        <div className="sticky top-0 z-30 bg-white border-b border-slate-200">
          <div className="flex items-center justify-between p-3 sm:p-4">
            <h3 className="text-base sm:text-lg font-medium text-slate-800">
              Your Tickets
            </h3>
            <div className="flex items-center gap-2">
              {onRefresh && (
                <button
                  onClick={onRefresh}
                  disabled={refreshing || loading}
                  className="inline-flex items-center gap-1 px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  aria-label="Refresh tickets"
                >
                  <svg
                    className={`w-3 h-3 sm:w-4 sm:h-4 ${
                      refreshing ? "animate-spin" : ""
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                  <span className="hidden sm:inline">
                    {refreshing ? "Refreshing..." : "Refresh"}
                  </span>
                </button>
              )}
              <div className="text-xs sm:text-sm text-slate-500">
                {loading
                  ? "…"
                  : `${owned.length} ticket${owned.length === 1 ? "" : "s"}`}
              </div>
            </div>
          </div>

          {newTicketNotice && (
            <div className="px-4 pb-2">
              <div className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded px-3 py-2">
                {newTicketNotice}
              </div>
            </div>
          )}

          <div className="px-3 sm:px-4 pb-2 sm:pb-3">
            <div
              role="tablist"
              aria-label="Ticket filters"
              className="flex gap-1.5 sm:gap-2 overflow-x-auto whitespace-nowrap px-1 py-1"
            >
              {TABS.map((t) => {
                const active = activeTab === t.id;
                return (
                  <button
                    key={t.id}
                    role="tab"
                    aria-selected={active}
                    onClick={() => setActiveTab(t.id)}
                    className={`inline-flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm font-medium transition ${
                      active
                        ? "bg-slate-900 text-white shadow"
                        : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <span>{t.label}</span>
                    <span className="inline-flex items-center justify-center px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-xs rounded-full bg-slate-100 text-slate-700">
                      {counts[t.id] ?? (t.id === "all" ? owned.length : 0)}
                    </span>
                  </button>
                );
              })}
              <label className="inline-flex items-center gap-1 sm:gap-2 ml-1 sm:ml-2 px-1.5 sm:px-2 py-0.5 sm:py-1 text-xs sm:text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={showEscalatedOnly}
                  onChange={(e) => setShowEscalatedOnly(e.target.checked)}
                  className="w-3 h-3 sm:w-4 sm:h-4"
                />
                <span>Escalated only</span>
              </label>
            </div>
          </div>
        </div>

        <div className="p-2 sm:p-4">
          {loading ? (
            <div className="p-4 sm:p-6 text-xs sm:text-sm text-slate-500 text-center">
              Loading tickets…
            </div>
          ) : error ? (
            <div className="p-3 sm:p-4 text-xs sm:text-sm text-red-600">
              {error}
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-4 sm:p-6 text-xs sm:text-sm text-slate-500 text-center">
              No tickets found for this user.
            </div>
          ) : (
            <ul className="space-y-2 sm:space-y-3">
              {filtered.map((t, idx) => {
                const now = Date.now();
                const subject = t.displaySubject ?? "No subject";
                const email = t.email ?? "";
                const statusKey = (t.status ?? "active").toLowerCase();
                // ONLY use statusDisplay which comes from ticket_status field
                const statusLabel = t.statusDisplay || "Pending";
                const time = t.created_at ?? t.created_at_display ?? "";
                const isRecentlyAdded =
                  t.id &&
                  recentlyAdded[t.id] &&
                  now - recentlyAdded[t.id] < 60000;
                const pillClass =
                  statusKey === "resolved"
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                    : statusKey === "escalated"
                    ? "bg-red-50 text-red-700 border border-red-100"
                    : statusKey === "waiting"
                    ? "bg-amber-50 text-amber-700 border border-amber-100"
                    : statusKey === "pending"
                    ? "bg-amber-50 text-amber-700 border border-amber-100"
                    : statusKey === "active" || statusKey === "open"
                    ? "bg-sky-50 text-sky-700 border border-sky-100"
                    : "bg-slate-50 text-slate-700 border border-slate-100";

                return (
                  <motion.li
                    key={t.id ?? `${idx}-${email}`}
                    initial="hidden"
                    animate="visible"
                    variants={listItem}
                    className={`bg-white rounded-lg p-3 sm:p-4 border border-slate-200 flex items-center justify-between shadow-sm cursor-pointer ${
                      selected?.id === t.id
                        ? "ring-2 ring-blue-200"
                        : "hover:bg-slate-50"
                    }`}
                    onClick={() => setSelected?.(t)}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-xs sm:text-sm text-slate-800 truncate flex items-center gap-1.5">
                        {subject}
                      </div>
                      <div className="text-[10px] sm:text-xs text-slate-500 mt-0.5 sm:mt-1 truncate">
                        {email || t.name || "From Widget"}
                      </div>
                      {isRecentlyAdded && (
                        <div className="text-[10px] uppercase tracking-wide font-semibold text-emerald-600">
                          New
                        </div>
                      )}
                    </div>

                    <div className="text-right shrink-0 flex flex-col items-end ml-2 sm:ml-4 gap-1">
                      <span
                        className={`inline-flex items-center justify-center px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium ${pillClass}`}
                      >
                        {statusLabel}
                      </span>

                      {/* Escalated badge: show whenever escalated is true */}
                      {t.raw?.escalated === true && (
                        <span className="inline-flex items-center gap-1 text-[10px] sm:text-xs font-semibold px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-100">
                          <GoAlertFill />
                          Escalated
                        </span>
                      )}

                      <div className="text-[10px] sm:text-xs text-slate-400 mt-1 sm:mt-2">
                        {formatMaybeDate(time, t.created_at_display)}
                      </div>
                    </div>
                  </motion.li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </motion.div>
  );
}
