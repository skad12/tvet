"use client";
import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/axios";

import Navbar from "@/components/super_agent/Topbar";
import SuperAgentChatBox from "@/components/super_agent/SuperAgentChatBox";
import SuperAgentChatList from "@/components/super_agent/SuperAgentChatList";

export default function SuperAgentDashboardPage() {
  const [tickets, setTickets] = useState([]);
  const [loadingTickets, setLoadingTickets] = useState(true);
  const [ticketsError, setTicketsError] = useState(null);
  const [selected, setSelected] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [userStatus, setUserStatus] = useState(null);

  const { user } = useAuth();

  const userId = useMemo(() => {
    if (!user) return null;
    const candidates = [
      user.app_user_id,
      user.appUserId,
      user.user_id,
      user.userId,
      user.id,
      user.uid,
      user.pk,
    ];
    for (const c of candidates) {
      if (c !== undefined && c !== null && c !== "") return c;
    }
    return null;
  }, [user]);

  const userEmail = useMemo(() => {
    if (!user) return "";
    return (
      user.email ??
      user.username ??
      (Array.isArray(user.emails) ? user.emails[0] : "") ??
      ""
    );
  }, [user]);

  // Super agents only see escalated tickets - fetch all escalated tickets
  async function fetchEscalatedTickets({ showLoading = true } = {}) {
    if (showLoading) setLoadingTickets(true);
    setTicketsError(null);
    try {
      let data = null;

      // Use the escalated tickets endpoint
      if (api && typeof api.get === "function") {
        const res = await api.get("/get-all-escalated-tickets/");
        data = res?.data;
      } else {
        const res = await fetch("/get-all-escalated-tickets/", {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });
        if (!res.ok) {
          throw new Error(`Failed to fetch escalated tickets (${res.status})`);
        }
        data = await res.json();
      }

      let escalatedTickets = Array.isArray(data)
        ? data
        : data?.tickets ?? data ?? [];

      // Ensure all tickets are marked as escalated
      escalatedTickets = escalatedTickets.map((ticket) => {
        return {
          ...ticket,
          escalated: true,
          status: ticket.status || ticket.ticket_status || "escalated",
          ticket_status: ticket.ticket_status || ticket.status || "escalated",
        };
      });

      // Don't filter resolved tickets - let the chatlist component handle filtering via tabs
      setTickets(escalatedTickets);

      // Auto-select first ticket if available
      setSelected((prevSelected) => {
        if (prevSelected) {
          const exists = escalatedTickets.find(
            (t) =>
              String(t.id ?? t.pk) ===
              String(prevSelected.id ?? prevSelected.pk)
          );
          if (exists) return exists;
        }
        return escalatedTickets.length > 0 ? escalatedTickets[0] : null;
      });
    } catch (err) {
      console.error("Failed to load escalated tickets", err);
      setTickets([]);
      setSelected(null);
      setTicketsError(err?.message ?? "Failed to load escalated tickets");
    } finally {
      if (showLoading) setLoadingTickets(false);
    }
  }

  const handleManualRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchEscalatedTickets({ showLoading: false });
    } finally {
      setRefreshing(false);
    }
  };

  async function fetchUserStatus(currentUserId) {
    if (!currentUserId) return;
    try {
      const res = await api.get(`/get-user-status/${currentUserId}/`);
      const status = res?.data?.status ?? null;
      setUserStatus(status);
    } catch (err) {
      console.warn("Failed to fetch user status:", err);
      setUserStatus(null);
    }
  }

  useEffect(() => {
    fetchEscalatedTickets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!userId) return;
    fetchUserStatus(userId);
    // Refresh status every 10 seconds
    const interval = setInterval(() => fetchUserStatus(userId), 10000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  useEffect(() => {
    // Refresh escalated tickets every 10 seconds
    const interval = setInterval(
      () => fetchEscalatedTickets({ showLoading: false }),
      10000
    );
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // Update selected ticket if it's no longer in the list
    if (!selected) return;
    const exists = tickets.find(
      (t) => String(t.id ?? t.pk) === String(selected.id ?? selected.pk)
    );
    if (!exists) {
      setSelected(tickets.length > 0 ? tickets[0] : null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tickets]);

  return (
    <ProtectedRoute allowed={["super_agent"]}>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="min-h-screen bg-slate-50 py-2 sm:py-4"
      >
        <div className="max-w-7xl mx-auto px-2 sm:px-4">
          <Navbar
            userEmail={userEmail || undefined}
            showCreateTicket={false}
            userStatus={userStatus}
          />
          {ticketsError && (
            <div className="mb-3 sm:mb-4 rounded border border-red-200 bg-red-50 px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-red-700">
              {ticketsError}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
            {/* Chat box - hidden on mobile when no ticket selected, shown on larger screens */}
            <div className={`${selected ? "block" : "hidden"} lg:block`}>
              <SuperAgentChatBox
                key={selected?.id}
                selected={selected}
                onResolved={(ticketId) => {
                  // When a ticket is resolved, remove it from the list
                  try {
                    setTickets((prev) =>
                      (Array.isArray(prev) ? prev : []).filter((t) => {
                        const id = t?.id ?? t?.pk;
                        return String(id) !== String(ticketId);
                      })
                    );
                    setSelected((prev) => {
                      const remaining = tickets.filter(
                        (t) => String(t.id ?? t.pk) !== String(ticketId)
                      );
                      return remaining.length > 0 ? remaining[0] : null;
                    });
                  } catch (e) {
                    console.error("Error handling resolved ticket:", e);
                  }
                }}
              />
            </div>
            {/* Chat list - full width on mobile, 2/3 on desktop */}
            <div className="lg:col-span-2">
              <SuperAgentChatList
                tickets={tickets}
                selected={selected}
                setSelected={setSelected}
                loading={loadingTickets}
                onRefresh={handleManualRefresh}
                refreshing={refreshing}
              />
            </div>
            {/* Mobile chat box popup - shown when ticket selected on mobile */}
            <AnimatePresence>
              {selected && (
                <>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setSelected(null)}
                    className="lg:hidden fixed inset-0 bg-black/50 z-40"
                  />
                  <motion.div
                    initial={{ opacity: 0, y: 100 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 100 }}
                    className="lg:hidden fixed inset-x-0 bottom-0 z-50 bg-white rounded-t-2xl shadow-xl flex flex-col"
                    style={{ maxHeight: "85vh" }}
                    data-chat-box
                  >
                    <div className="p-4 border-b border-slate-200 flex items-center justify-between flex-shrink-0">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-slate-800 text-sm truncate">
                          {selected.subject || selected.name || "Chat"}
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {selected.email || userEmail}
                        </p>
                      </div>
                      <button
                        onClick={() => setSelected(null)}
                        className="ml-2 p-2 rounded-lg text-slate-500 hover:bg-slate-100 flex-shrink-0"
                        aria-label="Close chat"
                      >
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    </div>
                    <div className="flex-1 overflow-hidden min-h-0">
                      <SuperAgentChatBox
                        key={selected?.id}
                        selected={selected}
                        onResolved={(ticketId) => {
                          try {
                            setTickets((prev) =>
                              (Array.isArray(prev) ? prev : []).filter((t) => {
                                const id = t?.id ?? t?.pk;
                                return String(id) !== String(ticketId);
                              })
                            );
                            setSelected((prev) => {
                              const remaining = tickets.filter(
                                (t) => String(t.id ?? t.pk) !== String(ticketId)
                              );
                              return remaining.length > 0 ? remaining[0] : null;
                            });
                          } catch (e) {
                            console.error("Error handling resolved ticket:", e);
                          }
                        }}
                      />
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </ProtectedRoute>
  );
}
