"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ChatModal from "@/components/admin/tickets/ChatModal";
import TrackTicket from "@/components/tickets/TrackTicket";
import { FiAlertTriangle, FiCalendar, FiCheckCircle, FiChevronDown, FiClock, FiFilter, FiList, FiTag, FiX } from "react-icons/fi";
import DateRangePanel, { EMPTY_RANGE, describeRange } from "@/components/tickets/DateRangePanel";
import UserModal from "@/components/admin/tickets/UserModal";
import api from "@/lib/axios";
import TicketsList from "@/components/admin/tickets/TicketsList";
import { readCache, writeCache, cacheKeys } from "@/lib/offlineCache";

export default function TicketPage() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Category states
  const [categories, setCategories] = useState([]);
  const [catLoading, setCatLoading] = useState(true);
  const [catError, setCatError] = useState(null);
  const [activeCategory, setActiveCategory] = useState(null); // null => All

  // Status filter state
  const [statusFilter, setStatusFilter] = useState("all"); // 'all', 'pending', 'escalated', 'resolved'

  // Advanced: a date range over when tickets were created or last active
  const [dateRange, setDateRange] = useState(EMPTY_RANGE);
  const [showDates, setShowDates] = useState(false);
  const dateActive = Boolean(dateRange.from || dateRange.to);

  // The home page's summary cards link here with ?status=pending|resolved.
  useEffect(() => {
    const wanted = new URLSearchParams(window.location.search).get("status");
    if (wanted && ["all", "pending", "escalated", "resolved"].includes(wanted)) setStatusFilter(wanted);
  }, []);

  // ticket selection / modal states
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function loadCategories() {
      setCatLoading(true);
      setCatError(null);
      try {
        const res = await api.get("/get-all-category/");
        const data = res?.data ?? [];
        if (!mounted) return;
        // Data is already an array of categories with id and title
        const arr = Array.isArray(data) ? data : [];
        setCategories(arr);
        if (arr.length) writeCache(cacheKeys.categories(), arr);
      } catch (err) {
        console.error("Failed to load categories:", err);
        // Categories barely change, so a saved copy is as good as a live one
        // for filtering while the server is away.
        const cached = readCache(cacheKeys.categories());
        const cachedList = Array.isArray(cached?.value) ? cached.value : [];
        if (mounted) {
          if (cachedList.length) {
            setCategories(cachedList);
            setCatError(null);
          } else {
            setCatError("Failed to load categories");
          }
        }
      } finally {
        if (mounted) setCatLoading(false);
      }
    }

    // No longer load all tickets here — TicketsList will handle pagination & initial load
    loadCategories();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (selectedTicket) setChatOpen(true);
  }, [selectedTicket]);

  function openChat(t) {
    setSelectedTicket(t);
    setChatOpen(true);
  }
  function closeChat() {
    setChatOpen(false);
  }
  function openUserDetails(ticket) {
    setSelectedTicket(ticket);
    setUserOpen(true);
  }
  function closeUser() {
    setUserOpen(false);
  }

  return (
    <div className="min-h-screen py-2">
      <div className="mx-auto max-w-7xl px-1 sm:px-2">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-6 rounded-4xl border border-white/70 bg-white/90 p-5 shadow-xl shadow-slate-950/5"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-blue-700">
            Ticket operations
          </p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-950 lg:text-3xl">
            Tickets
          </h1>
          <p className="mt-1 text-xs text-slate-500 sm:text-sm">
            Filter by category, status and dates, and open conversations
          </p>
        </motion.div>

        {/* Wider screens have the tracker in the top bar. */}
        <div className="mb-4 sm:hidden">
          <TrackTicket role="admin" />
        </div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="mb-4 rounded-3xl border border-white/70 bg-white/90 p-4 shadow-lg shadow-slate-950/5">
            {catError && (
              <div className="text-red-600 text-sm mb-2">{catError}</div>
            )}
            {/* Categories: one scrolling row. The bottom padding keeps the
                scrollbar clear of the names. */}
            <div className="flex items-center gap-2">
              <span className="inline-flex shrink-0 items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <FiTag className="h-3.5 w-3.5" aria-hidden /> Category
              </span>
              <div role="radiogroup" aria-label="Category" className="flex min-w-0 flex-1 gap-1.5 overflow-x-auto pb-2.5 pt-0.5 [scrollbar-width:thin]">
                {catLoading
                  ? [0, 1, 2, 3].map((i) => <span key={i} className="h-8 w-32 shrink-0 animate-pulse rounded-full bg-slate-100" />)
                  : [{ id: null, title: "All categories" }, ...categories].map((c) => {
                      const on = activeCategory === c.id;
                      return (
                        <button
                          key={c.id ?? "all"}
                          type="button"
                          role="radio"
                          aria-checked={on}
                          onClick={() => setActiveCategory(c.id)}
                          className={`shrink-0 whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-semibold transition sm:text-sm ${
                            on ? "border-blue-600 bg-blue-600 text-white shadow-sm" : "border-slate-200 bg-white text-slate-700 hover:border-blue-200 hover:bg-blue-50"
                          }`}
                        >
                          {c.title ?? c.name ?? ""}
                        </button>
                      );
                    })}
              </div>
            </div>

            <div className="mt-2 flex flex-col gap-3 border-t border-slate-100 pt-3 md:flex-row md:items-center md:justify-between">
              <div className="flex min-w-0 items-center gap-2">
                <span className="inline-flex shrink-0 items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <FiFilter className="h-3.5 w-3.5" aria-hidden /> Status
                </span>
                <div role="radiogroup" aria-label="Status" className="flex min-w-0 flex-1 overflow-x-auto rounded-xl bg-slate-100 p-1 md:flex-none">
                  {[
                    { id: "all", label: "All", icon: <FiList /> },
                    { id: "pending", label: "Pending", icon: <FiClock /> },
                    { id: "escalated", label: "Escalated", icon: <FiAlertTriangle /> },
                    { id: "resolved", label: "Resolved", icon: <FiCheckCircle /> },
                  ].map((status) => {
                    const on = statusFilter === status.id;
                    return (
                      <button
                        key={status.id}
                        type="button"
                        role="radio"
                        aria-checked={on}
                        onClick={() => setStatusFilter(status.id)}
                        className={`inline-flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-semibold transition sm:text-sm md:flex-none ${
                          on ? "bg-white text-blue-700 shadow-sm" : "text-slate-600 hover:text-slate-900"
                        }`}
                      >
                        <span className="h-3.5 w-3.5" aria-hidden>{status.icon}</span>
                        {status.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {dateActive && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-800 ring-1 ring-blue-200">
                    {describeRange(dateRange)}
                    <button type="button" onClick={() => setDateRange(EMPTY_RANGE)} aria-label="Clear dates" className="rounded-full p-0.5 hover:bg-blue-100">
                      <FiX className="h-3 w-3" />
                    </button>
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => setShowDates((v) => !v)}
                  aria-expanded={showDates}
                  className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-sm font-medium transition ${
                    showDates || dateActive ? "border-blue-300 bg-blue-50 text-blue-800" : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <FiCalendar className="h-4 w-4" aria-hidden /> Date range
                  <FiChevronDown className={`h-4 w-4 transition ${showDates ? "rotate-180" : ""}`} aria-hidden />
                </button>
              </div>
            </div>

            <AnimatePresence initial={false}>
              {showDates && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <DateRangePanel value={dateRange} onChange={setDateRange} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        <AnimatePresence>
          {chatOpen && (
            <ChatModal
              ticket={selectedTicket}
              open={true}
              onClose={closeChat}
              onOpenUser={openUserDetails}
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {userOpen && (
            <UserModal
              user={selectedTicket?.user}
              open={true}
              onClose={closeUser}
            />
          )}
        </AnimatePresence>

        {/* Tickets List */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mt-6"
        >
          <TicketsList
            categoryId={activeCategory}
            categoryName={
              activeCategory
                ? categories.find((c) => c.id === activeCategory)?.title ??
                  categories.find((c) => c.id === activeCategory)?.name
                : null
            }
            statusFilter={statusFilter}
            dateRange={dateActive ? dateRange : null}
            onSelectTicket={openChat}
            selectedTicketId={selectedTicket?.id}
            pageSize={20}
          />
        </motion.div>
      </div>
    </div>
  );
}
