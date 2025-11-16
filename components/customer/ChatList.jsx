"use client";

import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { format, isValid } from "date-fns";
import { useAuth } from "@/context/AuthContext";

let api = null;
try {
  api = require("@/lib/axios").default;
} catch (e) {
  api = null;
}

/**
 * ChatList
 *
 * - Fetches tickets only from /filter-ticket/by-user-id/{id}/ when ticketsProp is not supplied.
 * - Normalizes the response shape you supplied (id, name, email, subject, status boolean, created_at, created_at_display, pub_date).
 * - Maps boolean `status` => 'resolved' (true) or 'active' (false) for tab filtering.
 */
export default function ChatList({
  tickets: ticketsProp = null,
  selected,
  setSelected,
  loading: loadingProp = false,
  userId: propUserId = null,
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

  const effectiveUserId = propUserId ?? authUserId;

  // always default to empty; we'll fetch by user id if ticketsProp is not provided
  const [tickets, setTickets] = useState(ticketsProp ?? []);
  const [loading, setLoading] = useState(Boolean(loadingProp || !ticketsProp));
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("all");

  const TABS = [
    { id: "all", label: "All" },
    { id: "active", label: "Active" },
    { id: "pending", label: "Pending" },
    { id: "resolved", label: "Resolved" },
  ];

  // Normalize a single ticket object from your provided API shape
  function normalizeTicket(t) {
    const id = t?.id ?? t?.pk ?? null;
    const subject = t?.subject ?? t?.title ?? null;
    const name = t?.name ?? null;
    const email = t?.email ?? t?.reporter_email ?? "";
    // status from supplied body is boolean - interpret true => resolved
    const statusBool =
      typeof t?.status === "boolean" ? t.status : Boolean(t?.status);
    const status = statusBool ? "resolved" : "active"; // map to our status strings
    const created_at = t?.created_at ?? t?.createdAt ?? t?.pub_date ?? null;
    const created_at_display = t?.created_at_display ?? null;
    const preview =
      t?.preview ??
      (t?.progress ? String(t.progress).slice(0, 80) : "") ??
      null;

    return {
      id,
      subject,
      name,
      displaySubject: subject ?? name ?? "No subject",
      email,
      status,
      created_at,
      created_at_display,
      preview,
      raw: t,
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

  // Fetch tickets by user id using the required endpoint
  useEffect(() => {
    // If tickets are supplied as prop, keep them (but still we normalize them)
    if (ticketsProp) {
      const arr = Array.isArray(ticketsProp) ? ticketsProp : [ticketsProp];
      setTickets(arr.map(normalizeTicket));
      setLoading(false);
      setError(null);
      return;
    }

    let mounted = true;
    const ac = new AbortController();

    async function load() {
      if (!effectiveUserId) {
        setTickets([]);
        setLoading(false);
        setError("No user id to fetch tickets for.");
        return;
      }

      setLoading(true);
      setError(null);

      const endpointRelative = `/filter-ticket/by-user-id/${encodeURIComponent(
        effectiveUserId
      )}/`;

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

        const normalized = arr.map(normalizeTicket);
        setTickets(normalized);

        // auto-select first if none selected
        if (normalized.length > 0 && !selected) {
          setSelected?.(normalized[0]);
        }
      } catch (err) {
        if (err.name === "AbortError") return;
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveUserId, token, ticketsProp, setSelected, selected]);

  const owned = useMemo(
    () => (Array.isArray(tickets) ? tickets : []),
    [tickets]
  );

  // counts based on normalized status mapping
  const counts = useMemo(() => {
    const map = { all: owned.length, active: 0, pending: 0, resolved: 0 };
    owned.forEach((t) => {
      const s = t.status ?? "";
      if (s === "active") map.active++;
      else if (s === "pending" || s === "waiting") map.pending++;
      else if (s === "resolved") map.resolved++;
    });
    return map;
  }, [owned]);

  const filtered = useMemo(() => {
    if (!activeTab || activeTab === "all") return owned;
    return owned.filter((t) => {
      const s = t.status ?? "";
      if (activeTab === "pending") return s === "pending" || s === "waiting";
      return s === activeTab;
    });
  }, [owned, activeTab]);

  const listItem = {
    hidden: { opacity: 0, y: 8 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <motion.div layout className="bg-white rounded shadow-sm p-0">
      <div className="h-[520px] md:h-[420px] overflow-auto">
        <div className="sticky top-0 z-30 bg-white border-b border-slate-200">
          <div className="flex items-center justify-between p-4">
            <h3 className="text-lg font-medium text-slate-800">Your Tickets</h3>
            <div className="text-sm text-slate-500">
              {loading
                ? "…"
                : `${owned.length} ticket${owned.length === 1 ? "" : "s"}`}
            </div>
          </div>

          <div className="px-4 pb-3">
            <div
              role="tablist"
              aria-label="Ticket filters"
              className="flex gap-2 overflow-x-auto whitespace-nowrap px-1 py-1"
            >
              {TABS.map((t) => {
                const active = activeTab === t.id;
                return (
                  <button
                    key={t.id}
                    role="tab"
                    aria-selected={active}
                    onClick={() => setActiveTab(t.id)}
                    className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition ${
                      active
                        ? "bg-slate-900 text-white shadow"
                        : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <span>{t.label}</span>
                    <span className="inline-flex items-center justify-center px-2 py-0.5 text-xs rounded-full bg-slate-100 text-slate-700">
                      {counts[t.id] ?? (t.id === "all" ? owned.length : 0)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="p-4">
          {loading ? (
            <div className="p-6 text-sm text-slate-500">Loading tickets…</div>
          ) : error ? (
            <div className="p-4 text-sm text-red-600">{error}</div>
          ) : filtered.length === 0 ? (
            <div className="p-6 text-sm text-slate-500">
              No tickets found for this user.
            </div>
          ) : (
            <ul className="space-y-3">
              {filtered.map((t, idx) => {
                const subject = t.displaySubject ?? "No subject";
                const email = t.email ?? "";
                const status = t.status ?? "—";
                const time = t.created_at ?? t.created_at_display ?? "";
                const pillClass =
                  status === "resolved"
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                    : status === "waiting"
                    ? "bg-amber-50 text-amber-700 border border-amber-100"
                    : status === "pending"
                    ? "bg-amber-50 text-amber-700 border border-amber-100"
                    : status === "active"
                    ? "bg-sky-50 text-sky-700 border border-sky-100"
                    : "bg-slate-50 text-slate-700 border border-slate-100";

                return (
                  <motion.li
                    key={t.id ?? `${idx}-${email}`}
                    initial="hidden"
                    animate="visible"
                    variants={listItem}
                    className={`bg-white rounded-lg p-4 border border-slate-200 flex items-center justify-between shadow-sm cursor-pointer ${
                      selected?.id === t.id
                        ? "ring-2 ring-blue-200"
                        : "hover:bg-slate-50"
                    }`}
                    onClick={() => setSelected?.(t)}
                  >
                    <div className="min-w-0">
                      <div className="font-medium text-slate-800 truncate">
                        {subject}
                      </div>
                      <div className="text-xs text-slate-500 mt-1 truncate">
                        {email || t.name || "From Widget"}
                      </div>
                      {t.preview && (
                        <div className="text-xs text-slate-400 mt-1 truncate">
                          {t.preview}
                        </div>
                      )}
                    </div>

                    <div className="text-right flex-shrink-0 flex flex-col items-end ml-4">
                      <span
                        className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-medium ${pillClass}`}
                      >
                        {status}
                      </span>
                      <div className="text-xs text-slate-400 mt-2">
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
