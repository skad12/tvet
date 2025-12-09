"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { format, isValid } from "date-fns";
import { useAuth } from "@/context/AuthContext";

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

  // always default to empty; we'll fetch by user id if ticketsProp is not provided
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

  // Normalize a single ticket object from various API shapes
  function normalizeTicket(t) {
    const id = t?.id ?? t?.pk ?? null;
    const subject = t?.subject ?? t?.title ?? null;
    const name = t?.name ?? t?.reporter_name ?? null;
    const email = t?.email ?? t?.reporter_email ?? "";

    // Check escalated first
    const isEscalated = t?.escalated === true;
    const progressLabel =
      typeof t?.progress === "string" && t.progress.trim().length > 0
        ? t.progress.trim()
        : null;
    const statusBool = typeof t?.status === "boolean" ? t.status : undefined;
    const statusStr =
      typeof t?.status === "string"
        ? String(t.status).toLowerCase()
        : undefined;
    const fallbackStatus = statusBool ?? statusStr ?? t?.state ?? null;

    let statusDisplay;
    // Use status boolean: true = resolved, false = pending
    if (
      statusBool === true ||
      statusStr === "resolved" ||
      statusStr === "true"
    ) {
      statusDisplay = "Resolved";
    } else if (isEscalated && statusBool !== true) {
      // Show escalated unless resolved
      statusDisplay = "Escalated";
    } else if (progressLabel) {
      statusDisplay = progressLabel;
    } else if (
      statusBool === false ||
      statusStr === "pending" ||
      statusStr === "false"
    ) {
      statusDisplay = "Pending";
    } else if (
      typeof fallbackStatus === "string" &&
      fallbackStatus.trim().length > 0
    ) {
      statusDisplay = fallbackStatus.trim();
    } else {
      statusDisplay = "Pending"; // Default to pending when null
    }

    const statusKey = statusDisplay ? statusDisplay.toLowerCase() : "pending";

    const created_at = t?.created_at ?? t?.createdAt ?? t?.pub_date ?? null;
    const created_at_display = t?.created_at_display ?? null;
    const preview =
      t?.preview ??
      (t?.progress ? String(t.progress).slice(0, 80) : "") ??
      null;

    // capture a set of possible user id fields so we can filter by user later
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
      created_at,
      created_at_display,
      preview,
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

  // Helper: check whether a normalized ticket belongs to the effective user id
  function ticketBelongsToUser(normalized, effId, effEmail) {
    if (!effId && !effEmail) return false;
    // compare to several possible places: ticketUserId, raw.user?.id, raw.reporter?.id
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
    // If tickets are supplied as prop, normalize *and filter* them by user id
    if (ticketsProp && !forceFetch) {
      const arr = Array.isArray(ticketsProp) ? ticketsProp : [ticketsProp];
      const normalized = arr.map(normalizeTicket);
      const shouldFilter = Boolean(effectiveUserId || effectiveUserEmail);
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

        // Fetch status for each ticket using /get-ticket-status/{id}/
        try {
          const ticketsWithStatus = await Promise.all(
            normalized.map(async (ticket) => {
              if (!ticket.id) return ticket;
              try {
                const statusRes = await api.get(
                  `/get-ticket-status/${ticket.id}/`,
                  {
                    headers: token ? { Authorization: `Bearer ${token}` } : {},
                    signal: ac.signal,
                  }
                );
                const statusData = statusRes?.data;
                if (statusData) {
                  // Update status from API response
                  const newStatus =
                    statusData.status ?? statusData.progress ?? null;
                  const newProgress = statusData.progress;
                  if (newStatus || newProgress) {
                    return {
                      ...ticket,
                      status: newStatus
                        ? String(newStatus).toLowerCase()
                        : ticket.status,
                      statusDisplay: newProgress || ticket.statusDisplay,
                      raw: {
                        ...ticket.raw,
                        status: newStatus,
                        progress: newProgress,
                      },
                    };
                  }
                }
              } catch (err) {
                // If status fetch fails, use default status
                if (
                  err?.name !== "AbortError" &&
                  err?.name !== "CanceledError"
                ) {
                  console.warn(
                    `Failed to fetch status for ticket ${ticket.id}:`,
                    err
                  );
                }
              }
              return ticket;
            })
          );
          normalized = ticketsWithStatus;
        } catch (err) {
          // Continue with original normalized tickets if status fetch fails
          if (err?.name !== "AbortError" && err?.name !== "CanceledError") {
            console.warn("Failed to fetch ticket statuses:", err);
          }
        }

        // double-check server-side filtering — keep only tickets that match the effective user id
        const shouldFilter = Boolean(effectiveUserId || effectiveUserEmail);
        const filteredByUser = shouldFilter
          ? normalized.filter((n) =>
              ticketBelongsToUser(n, effectiveUserId, effectiveUserEmail)
            )
          : normalized;

        setTickets(filteredByUser);

        // auto-select first if none selected and not previously auto-selected
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
  ]);

  const owned = useMemo(
    () => (Array.isArray(tickets) ? tickets : []),
    [tickets]
  );

  // counts based on normalized status mapping
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
            <div className="text-xs sm:text-sm text-slate-500">
              {loading
                ? "…"
                : `${owned.length} ticket${owned.length === 1 ? "" : "s"}`}
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
                const previewLabel = (t.preview || "").toString().trim();
                const statusLabel =
                  previewLabel ||
                  t.statusDisplay ||
                  (statusKey
                    ? statusKey.charAt(0).toUpperCase() + statusKey.slice(1)
                    : "—");
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
                      {/* {t.preview && (
                        <div className="text-xs text-slate-400 mt-1 truncate">
                          {t.preview}
                        </div>
                      )} */}
                    </div>

                    <div className="text-right shrink-0 flex flex-col items-end ml-2 sm:ml-4 gap-1">
                      <span
                        className={`inline-flex items-center justify-center px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium ${pillClass}`}
                      >
                        {statusLabel}
                      </span>
                      {t.raw?.escalated === true &&
                        statusKey !== "resolved" && (
                          <span className="inline-flex items-center gap-1 text-[10px] sm:text-xs font-semibold px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-100">
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
