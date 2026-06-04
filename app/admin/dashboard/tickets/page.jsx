"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ChatModal from "@/components/admin/tickets/ChatModal";
import UserModal from "@/components/admin/tickets/UserModal";
import api from "@/lib/axios";
import TicketsList from "@/components/admin/tickets/TicketsList";

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
  const [statusFilter, setStatusFilter] = useState("all"); // 'all', 'pending', 'resolved', 'active', etc.

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
      } catch (err) {
        if (mounted) setCatError("Failed to load categories");
        console.error("Failed to load categories:", err);
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
            Browse tickets by category and open conversations
          </p>
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="mb-4 rounded-3xl border border-white/70 bg-white/90 p-4 shadow-lg shadow-slate-950/5">
            {catError && (
              <div className="text-red-600 text-sm mb-2">{catError}</div>
            )}
            <div className="flex flex-col gap-3 pb-2">
              {/* Category filters */}
              <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto whitespace-nowrap pb-1 sm:pb-0">
                <button
                  onClick={() => setActiveCategory(null)}
                  className={`inline-flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm font-medium transition shrink-0 ${
                    activeCategory === null
                      ? "bg-blue-600 text-white shadow shadow-blue-600/20"
                      : "bg-white border border-slate-200 text-slate-700 hover:border-blue-200 hover:bg-blue-50"
                  }`}
                >
                  All Categories
                </button>
                {(catLoading ? [] : categories).map((c) => {
                  // Use title as the category name (matching the ticket's name field)
                  const categoryTitle = c.title ?? c.name ?? "";
                  return (
                    <button
                      key={c.id}
                      onClick={() => setActiveCategory(c.id)}
                      className={`inline-flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm font-medium transition shrink-0 ${
                        activeCategory === c.id
                          ? "bg-blue-600 text-white shadow shadow-blue-600/20"
                          : "bg-white border border-slate-200 text-slate-700 hover:border-blue-200 hover:bg-blue-50"
                      }`}
                    >
                      {categoryTitle}
                    </button>
                  );
                })}
              </div>

              {/* Status filters */}
              <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto whitespace-nowrap">
                <span className="text-xs sm:text-sm text-slate-600 font-medium shrink-0">
                  Status:
                </span>
                {[
                  { id: "all", label: "All" },
                  { id: "pending", label: "Pending" },
                  { id: "resolved", label: "Resolved" },
                ].map((status) => (
                  <button
                    key={status.id}
                    onClick={() => setStatusFilter(status.id)}
                    className={`inline-flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm font-medium transition shrink-0 ${
                      statusFilter === status.id
                        ? "bg-blue-600 text-white shadow"
                        : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    {status.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        <AnimatePresence>
          {chatOpen && (
            <ChatModal
              ticket={selectedTicket}
              open={true}
              onClose={closeChat}
              onOpenUser={openUserDetails}
              onMessageAdded={(newMsg, ticket) => {
                api
                  .post(`/tickets/${ticket.id}/messages`, newMsg)
                  .catch(console.error);
              }}
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
            onSelectTicket={openChat}
            selectedTicketId={selectedTicket?.id}
            pageSize={10}
          />
        </motion.div>
      </div>
    </div>
  );
}
