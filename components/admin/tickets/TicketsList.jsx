"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  flexRender,
} from "@tanstack/react-table";
import { motion, AnimatePresence } from "framer-motion";
import { FiClock } from "react-icons/fi";
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

    // Preview: prefer preview, then subject, then otp/progress
    const preview =
      (t?.preview && String(t.preview)) ||
      (t?.subject && String(t.subject)) ||
      (t?.otp ? `OTP: ${t.otp}` : "") ||
      (t?.progress ? String(t.progress) : "") ||
      "";

    // createdAt: prefer machine timestamp (created_at or pub_date); created_at_display is used in UI formatting area if needed
    const createdAt = t?.created_at ?? t?.pub_date ?? new Date().toISOString();

    // status mapping: boolean (server) => resolved/open/active; fallback to string if server already returns textual
    let status;
    if (typeof t?.status === "boolean") {
      status = t.status ? "resolved" : "active";
    } else {
      status = String(t?.status ?? "active");
    }

    return {
      id,
      email,
      categoryTitle,
      preview,
      createdAt,
      status,
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
        if (api && typeof api.get === "function") {
          const res = await api.get("/tickets/", { signal: ac.signal });
          data = res?.data;
        } else {
          const res = await fetch("/tickets/", {
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

        const normalized = arr.map(normalizeTicketForTable);
        setTickets(normalized);
      } catch (err) {
        if (err.name === "AbortError") return;
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
  }, []);

  const filtered = useMemo(() => {
    if (!search) return tickets;
    const q = search.toLowerCase();
    return tickets.filter(
      (t) =>
        (t.email || "").toLowerCase().includes(q) ||
        (t.categoryTitle || "").toLowerCase().includes(q) ||
        (t.preview || "").toLowerCase().includes(q) ||
        (t.status || "").toLowerCase().includes(q)
    );
  }, [tickets, search]);

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
              </div>
            </div>
          );
        },
      },
      // {
      //   accessorKey: "preview",
      //   header: "Preview",
      //   cell: ({ getValue }) => (
      //     <div className="text-sm text-slate-600 truncate max-w-md">
      //       {getValue()}
      //     </div>
      //   ),
      // },
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
            return (
              <div className="text-xs text-slate-500">
                {new Date(d).toLocaleString()}
              </div>
            );
          } catch {
            return <div className="text-xs text-slate-500">{String(d)}</div>;
          }
        },
        enableSorting: false,
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ getValue }) => {
          const s = getValue();
          const classes =
            s === "resolved"
              ? "bg-emerald-100 text-emerald-700 border-emerald-200"
              : s === "pending"
              ? "bg-amber-100 text-amber-700 border-amber-200"
              : s === "active"
              ? "bg-blue-100 text-blue-700 border-blue-200"
              : "bg-slate-100 text-slate-700 border-slate-200";
          return (
            <span
              className={`inline-flex items-center text-xs font-semibold px-3 py-1 rounded-full border ${classes}`}
            >
              {s}
            </span>
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
      <div className="mb-3 flex items-center justify-between gap-2">
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
              : `${filtered.length} result${filtered.length === 1 ? "" : "s"}`}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-500">Rows</label>
          <select
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value))}
            className="text-sm px-2 py-1 border border-slate-300 rounded-md"
          >
            {[5, 10, 20, 50].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
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
                        whileHover={{ backgroundColor: "#f8fafc", scale: 1.002 }}
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
            Page <strong className="text-blue-600">{table.getState().pagination.pageIndex + 1}</strong> of{" "}
            <strong>{table.getPageCount()}</strong>
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
          Showing <span className="text-blue-600 font-semibold">{table.getRowModel().rows.length}</span> of{" "}
          <span className="text-blue-600 font-semibold">{filtered.length}</span> tickets
        </div>
      </div>
      {error && <div className="mt-2 text-sm text-red-600">{error}</div>}
    </aside>
  );
}
