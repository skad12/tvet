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
              <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-medium text-slate-700">
                {String(short).slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="font-medium text-slate-800 truncate">
                  {short}
                </div>
                <div className="text-xs text-slate-500 truncate">
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
              ? "bg-green-50 text-green-700"
              : s === "pending"
              ? "bg-amber-50 text-amber-700"
              : "bg-slate-50 text-slate-700";
          return (
            <span
              className={`inline-block text-xs px-2 py-0.5 rounded ${classes}`}
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
        className="rounded-md border border-slate-300 overflow-auto"
      >
        <table className="min-w-full divide-y">
          <thead className="bg-slate-50">
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id}>
                {hg.headers.map((header) => (
                  <th
                    key={header.id}
                    className="text-left px-4 py-3 text-xs text-slate-600 font-medium"
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

          <tbody className="bg-white divide-y divide-slate-00">
            {loading ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="text-center py-8 text-sm  text-slate-500"
                >
                  Loading tickets…
                </td>
              </tr>
            ) : table.getRowModel().rows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="text-center py-8 text-sm  text-slate-500"
                >
                  No tickets found
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
                      whileHover={{ scale: 1.01 }}
                      exit={{ opacity: 0, y: -10 }}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2 }}
                      onClick={() => onOpenChat?.(t)}
                      className={`cursor-pointer hover:bg-slate-50 border border-slate-100 rounded-md ${
                        isSelected
                          ? "bg-slate-50 border-l-4 border-blue-400"
                          : ""
                      }`}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <td key={cell.id} className="px-4 py-3 align-top">
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
      </motion.div>

      {/* Pagination */}
      <div className="mt-3 flex items-center justify-between gap-4 text-sm">
        <div className="flex items-center gap-2">
          <button
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
            className="px-3 py-1 border border-slate-300 rounded disabled:opacity-40"
          >
            First
          </button>
          <button
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="px-3 py-1 border border-slate-300 rounded disabled:opacity-40"
          >
            Prev
          </button>

          <span className="px-2 text-gray-800">
            Page <strong>{table.getState().pagination.pageIndex + 1}</strong> of{" "}
            {table.getPageCount()}
          </span>

          <button
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="px-3 py-1 border border-slate-300  rounded disabled:opacity-40"
          >
            Next
          </button>
          <button
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}
            className="px-3 py-1 border border-slate-300  rounded disabled:opacity-40"
          >
            Last
          </button>
        </div>

        <div className="text-slate-500">
          Showing {table.getRowModel().rows.length} of {filtered.length}{" "}
          filtered
        </div>
      </div>
      {error && <div className="mt-2 text-sm text-red-600">{error}</div>}
    </aside>
  );
}
