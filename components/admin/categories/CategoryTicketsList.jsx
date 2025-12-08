"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { format, isValid } from "date-fns";
import api from "@/lib/axios";

export default function CategoryTicketsList({
  categoryId,
  onSelectTicket,
  selectedTicketId,
}) {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!categoryId) {
      setTickets([]);
      setLoading(false);
      return;
    }

    let mounted = true;
    const ac = new AbortController();

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const endpoint = `/tickets/category-based/?category=${categoryId}`;
        let data;

        if (api && typeof api.get === "function") {
          const res = await api.get(endpoint, { signal: ac.signal });
          data = res?.data;
        } else {
          const base =
            typeof window !== "undefined"
              ? process.env.NEXT_PUBLIC_API_BASE
              : undefined;
          const endpointUrl = base
            ? `${base.replace(/\/$/, "")}${endpoint}`
            : endpoint;

          const res = await fetch(endpointUrl, {
            method: "GET",
            headers: { "Content-Type": "application/json" },
            signal: ac.signal,
            credentials: "include",
          });

          if (!res.ok) {
            const text = await res.text().catch(() => "");
            throw new Error(`Failed to load (${res.status}) ${text}`);
          }
          data = await res.json().catch(() => null);
        }

        if (!mounted) return;

        // Normalize response - expect array of tickets with id, name, chats
        let arr = [];
        if (!data) arr = [];
        else if (Array.isArray(data)) arr = data;
        else if (Array.isArray(data.results)) arr = data.results;
        else if (Array.isArray(data.data)) arr = data.data;
        else if (Array.isArray(data.tickets)) arr = data.tickets;
        else arr = [data];

        // Group tickets by name (category name)
        const ticketsByCategory = {};
        arr.forEach((t) => {
          const categoryName = t?.name ?? "From Widget";
          if (!ticketsByCategory[categoryName]) {
            ticketsByCategory[categoryName] = [];
          }
          ticketsByCategory[categoryName].push({
            id: t?.id ?? null,
            name: categoryName,
            chats: Array.isArray(t?.chats) ? t.chats : [],
            email: t?.email ?? "",
            subject: t?.subject ?? categoryName,
            status: t?.status ?? "active",
            escalated: t?.escalated === true,
            created_at: t?.created_at ?? null,
            created_at_display: t?.created_at_display ?? null,
            raw: t,
          });
        });

        // Flatten grouped tickets for display
        const normalized = Object.values(ticketsByCategory).flat();
        setTickets(normalized);
      } catch (err) {
        const isCanceled =
          err?.name === "AbortError" ||
          err?.name === "CanceledError" ||
          err?.code === "ERR_CANCELED" ||
          err?.message === "canceled";
        if (isCanceled) return;
        console.error("Failed to load category tickets:", err);
        setError(err?.message ?? "Failed to load tickets");
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
  }, [categoryId]);

  function formatDate(val, display) {
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
    <div className="bg-white rounded-lg shadow-sm border border-slate-200">
      <div className="p-4 border-b border-slate-200">
        <h3 className="text-lg font-semibold text-slate-800">
          Tickets in Category
        </h3>
        <p className="text-sm text-slate-500 mt-1">
          {loading
            ? "Loading..."
            : `${tickets.length} ticket${tickets.length === 1 ? "" : "s"}`}
        </p>
      </div>

      <div className="max-h-[600px] overflow-y-auto">
        {loading ? (
          <div className="p-8 text-center text-sm text-slate-500">
            <div className="flex items-center justify-center gap-2">
              <div className="w-5 h-5 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
              <span>Loading tickets...</span>
            </div>
          </div>
        ) : error ? (
          <div className="p-4 text-sm text-red-600">{error}</div>
        ) : tickets.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-500">
            <div className="text-4xl mb-2">📋</div>
            <p>No tickets found in this category</p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            <AnimatePresence>
              {tickets.map((ticket, idx) => {
                const isSelected = selectedTicketId === ticket.id;
                return (
                  <motion.li
                    key={ticket.id ?? idx}
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
                          <h4 className="font-semibold text-slate-800 truncate">
                            {ticket.name || ticket.subject || "From Widget"}
                          </h4>
                          {ticket.escalated &&
                            String(ticket.status || "").toLowerCase() !==
                              "resolved" && (
                              <svg
                                className="w-4 h-4 text-purple-600 shrink-0"
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
                        <p className="text-xs text-slate-400 mt-1">
                          {formatDate(
                            ticket.created_at,
                            ticket.created_at_display
                          )}
                        </p>
                      </div>
                      <div className="shrink-0">
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            ticket.status === "resolved"
                              ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                              : ticket.status === "escalated"
                              ? "bg-purple-100 text-purple-700 border border-purple-200"
                              : ticket.status === "pending"
                              ? "bg-amber-100 text-amber-700 border border-amber-200"
                              : "bg-blue-100 text-blue-700 border border-blue-200"
                          }`}
                        >
                          {ticket.status || "active"}
                        </span>
                      </div>
                    </div>
                  </motion.li>
                );
              })}
            </AnimatePresence>
          </ul>
        )}
      </div>
    </div>
  );
}
