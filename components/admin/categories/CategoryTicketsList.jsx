"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  flexRender,
} from "@tanstack/react-table";
import { motion, AnimatePresence } from "framer-motion";
import { FiClock, FiCheckCircle } from "react-icons/fi";
import { TbAlertTriangle } from "react-icons/tb";
import api from "@/lib/axios";

/**
 * TicketsTable
 * - Loads tickets from `/tickets/`
 * - Normalizes server response (see sample you provided) into the shape the table expects:
 *   { id, email, categoryTitle, preview, createdAt, status, messages, raw }
 */

export default function TicketsTable({ onOpenChat, selectedId }) {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [pageSize, setPageSize] = useState(5);
  const [error, setError] = useState(null);
  const [showEscalatedOnly, setShowEscalatedOnly] = useState(false);
  const [categoryFilters, setCategoryFilters] = useState([""]);
  const [activeCategory, setActiveCategory] = useState("all");

  // normalize single server ticket -> table row
  function normalizeTicketForTable(t) {
    const id = t?.id ?? String(Math.random()).slice(2, 10);

    // If email empty, use name (your response shows many empty emails)
    const email =
      t?.email && String(t.email).trim() !== ""
        ? String(t.email).trim()
        : t?.name ?? "";

    // Category/subject attempt: subject -> name -> fallback
    const categoryTitle = t?.subject ?? t?.name ?? "From Widget";
    const categoryName = t?.name ?? categoryTitle ?? "From Widget";

    // Preview: prefer preview, then subject, then otp/progress
    const preview =
      (t?.preview && String(t.preview)) ||
      (t?.subject && String(t.subject)) ||
      (t?.otp ? `OTP: ${t.otp}` : "") ||
      (t?.progress ? String(t.progress) : "") ||
      "";

    // createdAt: prefer machine timestamp (created_at or pub_date); created_at_display is used in UI formatting area if needed
    const createdAt = t?.created_at ?? t?.pub_date ?? new Date().toISOString();

    // status mapping: check escalated first, then boolean status, then progress
    let status;
    if (t?.escalated === true) {
      status = "escalated";
    } else if (typeof t?.status === "boolean") {
      status = t.status
        ? "resolved"
        : t?.progress
        ? String(t.progress).toLowerCase()
        : "pending";
    } else if (t?.progress) {
      status = String(t.progress).toLowerCase();
    } else {
      status = "pending"; // Default to pending when null
    }

    return {
      id,
      email,
      categoryTitle,
      categoryName,
      preview,
      createdAt,
      status,
      escalated: t?.escalated === true,
      messages: Array.isArray(t?.messages) ? t.messages : [],
      raw: t,
    };
  }

  // load from /tickets/
  useEffect(() => {
    let mounted = true;
    const ac = new AbortController();

    async function load() {
      setLoading(true);
      setError(null);

      try {
        let data;
        const endpoint = showEscalatedOnly
          ? "/get-all-escalated-tickets/"
          : "/tickets/";
        if (api && typeof api.get === "function") {
          const res = await api.get(endpoint, { signal: ac.signal });
          data = res?.data;
        } else {
          const res = await fetch(endpoint, {
            method: "GET",
            headers: { "Content-Type": "application/json" },
            signal: ac.signal,
            credentials: "include",
          });
          if (!res.ok) {
            const txt = await res.text().catch(() => "");
            throw new Error(`Failed to load tickets (${res.status}) ${txt}`);
          }
          data = await res.json().catch(() => null);
        }

        if (!mounted) return;

        // normalize: server returns array per your sample
        let arr = [];
        if (!data) arr = [];
        else if (Array.isArray(data)) arr = data;
        else if (Array.isArray(data.results)) arr = data.results;
        else if (Array.isArray(data.data)) arr = data.data;
        else arr = [data];

        let normalized = arr.map(normalizeTicketForTable);
        let categoryPayload = [];

        try {
          let categoryData;
          if (api && typeof api.get === "function") {
            const categoryRes = await api.get("/tickets/category-based/", {
              signal: ac.signal,
            });
            categoryData = categoryRes?.data;
          } else {
            const resCat = await fetch("/tickets/category-based/", {
              method: "GET",
              headers: { "Content-Type": "application/json" },
              signal: ac.signal,
              credentials: "include",
            });
            if (resCat.ok) {
              categoryData = await resCat.json().catch(() => null);
            }
          }

          if (categoryData) {
            if (Array.isArray(categoryData)) categoryPayload = categoryData;
            else if (Array.isArray(categoryData.results))
              categoryPayload = categoryData.results;
            else if (Array.isArray(categoryData.data))
              categoryPayload = categoryData.data;
            else if (Array.isArray(categoryData.tickets))
              categoryPayload = categoryData.tickets;
          }
        } catch (categoryErr) {
          if (categoryErr?.name !== "AbortError") {
            console.warn("Failed to load category-based tickets:", categoryErr);
          }
        }

        // Fetch status for each ticket using /get-ticket-status/{id}/
        // Do this in parallel but don't block on failures
        try {
          const statusPromises = normalized.map(async (ticket) => {
            if (!ticket.id) return ticket;
            try {
              const statusRes = await api.get(
                `/get-ticket-status/${ticket.id}/`,
                {
                  signal: ac.signal,
                }
              );
              const statusData = statusRes?.data;
              if (statusData) {
                // Update status from API response
                const newStatus =
                  statusData.status ?? statusData.progress ?? null;
                if (newStatus) {
                  return {
                    ...ticket,
                    status: String(newStatus).toLowerCase(),
                    raw: {
                      ...ticket.raw,
                      status: newStatus,
                      progress: statusData.progress,
                    },
                  };
                }
              }
            } catch (err) {
              // If status fetch fails, use default status
              if (err?.name !== "AbortError") {
                console.warn(
                  `Failed to fetch status for ticket ${ticket.id}:`,
                  err
                );
              }
            }
            return ticket;
          });

          normalized = await Promise.all(statusPromises);
        } catch (err) {
          // Continue with original normalized tickets if status fetch fails
          if (err?.name !== "AbortError") {
            console.warn("Failed to fetch ticket statuses:", err);
          }
        }

        setTickets(normalized);

        const counts = normalized.reduce((acc, ticket) => {
          const name =
            ticket.categoryName ?? ticket.categoryTitle ?? "From Widget";
          acc[name] = (acc[name] || 0) + 1;
          return acc;
        }, {});

        categoryPayload.forEach((entry) => {
          const name = entry?.name ?? "From Widget";
          if (!(name in counts)) counts[name] = 0;
        });

        const filters = [
          {
            label: "All Tickets",
            value: "all",
            count: normalized.length,
          },
          ...Object.entries(counts).map(([name, count]) => ({
            label: name,
            value: name,
            count,
          })),
        ];
        setCategoryFilters(filters);
        setActiveCategory((prev) => {
          if (prev === "all") return prev;
          return filters.some((f) => f.value === prev) ? prev : "all";
        });
      } catch (err) {
        const isCanceled =
          err?.name === "AbortError" ||
          err?.name === "CanceledError" ||
          err?.code === "ERR_CANCELED" ||
          err?.message === "canceled";
        if (isCanceled) return;
        console.error("Failed to load /tickets/:", err);
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
  }, [showEscalatedOnly]);

  const categoryFiltered = useMemo(() => {
    if (activeCategory === "all") return tickets;
    return tickets.filter((t) => {
      const name = t.categoryName ?? t.categoryTitle ?? "From Widget";
      return name === activeCategory;
    });
  }, [tickets, activeCategory]);

  const filtered = useMemo(() => {
    if (!search) return categoryFiltered;
    const q = search.toLowerCase();
    return categoryFiltered.filter(
      (t) =>
        (t.email || "").toLowerCase().includes(q) ||
        (t.categoryTitle || "").toLowerCase().includes(q) ||
        (t.preview || "").toLowerCase().includes(q) ||
        (t.status || "").toLowerCase().includes(q)
    );
  }, [categoryFiltered, search]);

  const columns = useMemo(
    () => [
      {
        accessorKey: "email",
        header: "User",
        cell: ({ getValue, row }) => {
          const email = getValue();
          const short = (email || "").split?.("@")?.[0] ?? email;
          return (
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center font-semibold text-white shadow-sm">
                {String(short).slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="font-semibold text-slate-800 truncate">
                  {short}
                </div>
                <div className="text-xs text-slate-500 truncate mt-0.5">
                  {row.original.categoryTitle ?? "No subject"}
                </div>
                {row.original.escalated &&
                  String(row.original.status).toLowerCase() !== "resolved" && (
                    <div className="mt-1">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-100 text-purple-700 border border-purple-200">
                        <svg
                          className="w-3 h-3"
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
                        Escalated
                      </span>
                    </div>
                  )}
              </div>
            </div>
          );
        },
      },

      {
        accessorKey: "createdAt",
        header: () => (
          <span className="flex items-center gap-1">
            <FiClock className="w-4 h-4" /> Date
          </span>
        ),
        cell: ({ getValue, row }) => {
          // prefer server display if available (row.original.raw.created_at_display)
          const display = row.original?.raw?.created_at_display;
          const ts = getValue();
          const d = display ?? ts;
          try {
            const iso = new Date(d).toISOString();
            return <div className="text-xs text-slate-500">{iso}</div>;
          } catch {
            return <div className="text-xs text-slate-500">{String(d)}</div>;
          }
        },
        enableSorting: false,
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ getValue, row }) => {
          const s = getValue() || "pending";
          const key = String(s).toLowerCase();
          const classes =
            key === "resolved"
              ? "bg-emerald-100 text-emerald-700 border-emerald-200"
              : key === "escalated"
              ? "bg-purple-100 text-purple-700 border-purple-200"
              : key === "pending" || key === "waiting"
              ? "bg-amber-100 text-amber-700 border-amber-200"
              : key === "active" || key === "open"
              ? "bg-blue-100 text-blue-700 border-blue-200"
              : "bg-slate-100 text-slate-700 border-slate-200";
          let Icon = null;
          if (key === "resolved") Icon = FiCheckCircle;
          else if (key === "escalated") Icon = TbAlertTriangle;
          else Icon = FiClock;
          return (
            <div className="flex flex-col items-start gap-1">
              <span
                className={`inline-flex items-center text-xs font-semibold px-3 py-1 rounded-full border ${classes}`}
              >
                {Icon ? <Icon className="w-3 h-3 mr-1" /> : null}
                {s}
              </span>
              {row.original?.escalated &&
                String(row.original?.status || "").toLowerCase() !==
                  "resolved" && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
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
          );
        },
      },
    ],
    []
  );

  const table = useReactTable({
    data: filtered,
    columns,
    pageCount: Math.ceil(filtered.length / pageSize),
    state: {},
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  useEffect(() => {
    table.setPageSize(pageSize);
  }, [pageSize, table]);

  return (
    <aside className="h-[calc(100vh-96px)] overflow-auto rounded-lg p-4">
      {/* Search + Controls */}
      <div className="mb-3">
        <div className="flex gap-2 overflow-x-auto pb-2">
          {categoryFilters.map((filter, idx) => {
            const isActive = activeCategory === filter.value;
            return (
              <button
                key={`${filter.value}-${idx}`}
                onClick={() => setActiveCategory(filter.value)}
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border transition ${
                  isActive
                    ? "bg-slate-900 text-white border-slate-900"
                    : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                }`}
              >
                <span>{filter.label}</span>
              </button>
            );
          })}
        </div>
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search tickets..."
              className="px-3 py-2 border border-slate-300 rounded-md text-sm w-64 focus:outline-none"
            />
            <div className="text-sm text-slate-500">
              {loading
                ? "Loading…"
                : `${filtered.length} result${
                    filtered.length === 1 ? "" : "s"
                  }`}
            </div>
            <label className="ml-3 inline-flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={showEscalatedOnly}
                onChange={(e) => setShowEscalatedOnly(e.target.checked)}
              />
              <span>Escalated only</span>
            </label>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-500">Rows</label>
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="text-sm px-2 py-1 border border-slate-300 rounded-md"
            >
              {[5, 10].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Animated Table */}
      <motion.div
        layout
        transition={{ layout: { duration: 0.3, type: "spring" } }}
        className="rounded-lg border border-slate-200 overflow-hidden shadow-sm bg-white"
      >
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-gradient-to-r from-slate-50 to-slate-100">
              {table.getHeaderGroups().map((hg) => (
                <tr key={hg.id}>
                  {hg.headers.map((header) => (
                    <th
                      key={header.id}
                      className="text-left px-6 py-4 text-xs font-semibold text-slate-700 uppercase tracking-wider"
                    >
                      {header.isPlaceholder ? null : (
                        <div>
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                        </div>
                      )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>

            <tbody className="bg-white divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="text-center py-12 text-sm text-slate-500"
                  >
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
                      <span>Loading tickets…</span>
                    </div>
                  </td>
                </tr>
              ) : table.getRowModel().rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="text-center py-12 text-sm text-slate-500"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <div className="text-4xl">📋</div>
                      <span>No tickets found</span>
                    </div>
                  </td>
                </tr>
              ) : (
                <AnimatePresence>
                  {table.getRowModel().rows.map((row) => {
                    const t = row.original;
                    const isSelected = selectedId === t.id;
                    return (
                      <motion.tr
                        key={row.id}
                        layout
                        whileHover={{
                          backgroundColor: "#f8fafc",
                          scale: 1.002,
                        }}
                        exit={{ opacity: 0, y: -10 }}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2 }}
                        onClick={() => onOpenChat?.(t)}
                        className={`cursor-pointer transition-all duration-200 ${
                          isSelected
                            ? "bg-blue-50 border-l-4 border-blue-500 shadow-sm"
                            : "hover:bg-slate-50"
                        }`}
                      >
                        {row.getVisibleCells().map((cell) => (
                          <td
                            key={cell.id}
                            className={`px-6 py-4 align-top ${
                              isSelected ? "text-slate-800" : "text-slate-700"
                            }`}
                          >
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext()
                            )}
                          </td>
                        ))}
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Pagination */}
      <div className="mt-4 flex items-center justify-between gap-4 text-sm bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
        <div className="flex items-center gap-2">
          <button
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
            className="px-4 py-2 border border-slate-300 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors font-medium"
          >
            First
          </button>
          <button
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="px-4 py-2 border border-slate-300 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors font-medium"
          >
            Prev
          </button>

          <span className="px-4 py-2 text-slate-700 font-medium bg-slate-50 rounded-lg">
            Page{" "}
            <strong className="text-blue-600">
              {table.getState().pagination.pageIndex + 1}
            </strong>{" "}
            of <strong>{table.getPageCount()}</strong>
          </span>

          <button
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="px-4 py-2 border border-slate-300 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors font-medium"
          >
            Next
          </button>
          <button
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}
            className="px-4 py-2 border border-slate-300 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors font-medium"
          >
            Last
          </button>
        </div>

        <div className="text-slate-600 font-medium">
          Showing{" "}
          <span className="text-blue-600 font-semibold">
            {table.getRowModel().rows.length}
          </span>{" "}
          of{" "}
          <span className="text-blue-600 font-semibold">{filtered.length}</span>{" "}
          tickets
        </div>
      </div>
      {error && <div className="mt-2 text-sm text-red-600">{error}</div>}
    </aside>
  );
}
