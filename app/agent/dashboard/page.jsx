"use client";
import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/axios";

import Navbar from "@/components/agent/Topbar";
import ChatBox from "@/components/agent/AgentChatBox";
import ChatList from "@/components/agent/AgentChatList";

export default function AgentDashboardPage() {
  const [tickets, setTickets] = useState([]);
  const [loadingTickets, setLoadingTickets] = useState(true);
  const [ticketsError, setTicketsError] = useState(null);
  const [selected, setSelected] = useState(null);

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

  function ticketBelongsToUser(ticket, uid, email) {
    if (!ticket) return false;
    if (uid) {
      const idCandidates = [
        ticket.agent_id,
        ticket.agentId,
        ticket.assigned_to_id,
        ticket.assigned_to?.id,
        ticket.assignee_id,
        ticket.assigneeId,
        ticket.assigned_to,
        ticket.assignedTo,
        ticket.owner_id,
        ticket.ownerId,
        ticket.user_id,
        ticket.userId,
      ];
      if (
        idCandidates.some(
          (candidate) =>
            candidate !== undefined &&
            candidate !== null &&
            String(candidate) === String(uid)
        )
      ) {
        return true;
      }
    }

    if (email) {
      const emailCandidates = [
        ticket.agent_email,
        ticket.agentEmail,
        ticket.assigned_to_email,
        ticket.assigned_to?.email,
        ticket.email,
        ticket.requester_email,
        ticket.requesterEmail,
      ];
      if (
        emailCandidates.some(
          (candidate) =>
            candidate &&
            String(candidate).toLowerCase() === String(email).toLowerCase()
        )
      ) {
        return true;
      }
    }

    return false;
  }

  async function fetchTickets(
    currentUserId,
    currentEmail,
    { showLoading = true } = {}
  ) {
    if (showLoading) setLoadingTickets(true);
    setTicketsError(null);
    try {
      let data = null;
      // Preferred: filter by user id using GET (backend-safe). Fallback to /tickets/.
      if (api && typeof api.get === "function" && currentUserId) {
        try {
          // Primary: GET with path param
          const res = await api.get(
            `/filter-ticket/by-user-id/${currentUserId}/`
          );
          data = res?.data;
        } catch (err) {
          // Secondary: GET without path param, passing id as query if supported
          if (err?.response?.status === 405 || err?.response?.status === 404) {
            try {
              const res = await api.get(`/filter-ticket/by-user-id/`, {
                params: { id: currentUserId },
              });
              data = res?.data;
            } catch (err2) {
              if (
                err2?.response?.status !== 405 &&
                err2?.response?.status !== 404
              ) {
                throw err2;
              }
            }
          } else {
            throw err;
          }
        }
      }

      if (!data) {
        if (api && typeof api.get === "function") {
          const res = await api.get("/tickets/");
          data = res?.data;
        } else {
          const res = await fetch("/tickets/", {
            method: "GET",
            headers: { "Content-Type": "application/json" },
          });
          if (!res.ok) {
            throw new Error(`Failed to fetch tickets (${res.status})`);
          }
          data = await res.json();
        }
      }

      let allTickets = Array.isArray(data) ? data : data?.tickets ?? data ?? [];

      // preserve local escalated status if present
      allTickets = allTickets.map((srv) => {
        const id = srv?.id ?? srv?.pk;
        const prev = (Array.isArray(tickets) ? tickets : []).find(
          (t) => String(t?.id ?? t?.pk) === String(id)
        );
        const prevEsc =
          prev &&
          (String(prev.status || "").toLowerCase() === "escalated" ||
            prev.progress === "Escalated");
        if (prevEsc) {
          return { ...srv, status: "escalated", progress: "Escalated" };
        }
        return srv;
      });

      const filtered = allTickets.filter((ticket) =>
        ticketBelongsToUser(ticket, currentUserId, currentEmail)
      );

      setTickets(allTickets);
      // Preserve current selection when possible
      setSelected((prevSelected) => {
        if (prevSelected) {
          const exists = filtered.find(
            (t) =>
              String(t.id ?? t.pk) ===
              String(prevSelected.id ?? prevSelected.pk)
          );
          if (exists) return exists;
        }
        return filtered.length > 0 ? filtered[0] : null;
      });
    } catch (err) {
      console.error("Failed to load tickets", err);
      setTickets([]);
      setSelected(null);
      setTicketsError(err?.message ?? "Failed to load tickets");
    } finally {
      if (showLoading) setLoadingTickets(false);
    }
  }

  useEffect(() => {
    if (!userId && !userEmail) return;
    fetchTickets(userId, userEmail);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, userEmail]);

  useEffect(() => {
    if (!userId && !userEmail) return;
    const interval = setInterval(
      () => fetchTickets(userId, userEmail, { showLoading: false }),
      10000
    );
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, userEmail]);

  useEffect(() => {
    if (!selected || !userId) return;
    if (!ticketBelongsToUser(selected, userId, userEmail)) {
      const next = tickets.find((ticket) =>
        ticketBelongsToUser(ticket, userId, userEmail)
      );
      setSelected(next ?? null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tickets, userId, userEmail]);

  return (
    <ProtectedRoute allowed={["agent"]}>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="min-h-screen bg-slate-50 py-2 sm:py-4"
      >
        <div className="max-w-7xl mx-auto px-2 sm:px-4">
          <Navbar userEmail={userEmail || undefined} showCreateTicket={false} />
          {ticketsError && (
            <div className="mb-3 sm:mb-4 rounded border border-red-200 bg-red-50 px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-red-700">
              {ticketsError}
            </div>
          )}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
            {/* Chat box - hidden on mobile when no ticket selected, shown on larger screens */}
            <div className={`${selected ? "block" : "hidden"} lg:block`}>
              <ChatBox
                key={selected?.id}
                selected={selected}
                onEscalated={(ticketId) => {
                try {
                  setTickets((prev) =>
                    (Array.isArray(prev) ? prev : []).map((t) => {
                      const id = t?.id ?? t?.pk;
                      if (String(id) === String(ticketId)) {
                        return {
                          ...t,
                          status: "escalated",
                          progress: "Escalated",
                        };
                      }
                      return t;
                    })
                  );
                  setSelected((prev) =>
                    prev && String(prev.id) === String(ticketId)
                      ? { ...prev, status: "escalated", progress: "Escalated" }
                      : prev
                  );
                } catch (e) {}
              }}
              />
            </div>
            {/* Chat list - full width on mobile, 2/3 on desktop */}
            <div className="lg:col-span-2">
              <ChatList
                tickets={tickets}
                selected={selected}
                setSelected={setSelected}
                userId={userId ?? undefined}
                userEmail={userEmail || undefined}
              />
              {/* Additional agent-specific components can be added here */}
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
                      <ChatBox
                        key={selected?.id}
                        selected={selected}
                        onEscalated={(ticketId) => {
                          try {
                            setTickets((prev) =>
                              (Array.isArray(prev) ? prev : []).map((t) => {
                                const id = t?.id ?? t?.pk;
                                if (String(id) === String(ticketId)) {
                                  return {
                                    ...t,
                                    status: "escalated",
                                    progress: "Escalated",
                                  };
                                }
                                return t;
                              })
                            );
                            setSelected((prev) =>
                              prev && String(prev.id) === String(ticketId)
                                ? { ...prev, status: "escalated", progress: "Escalated" }
                                : prev
                            );
                          } catch (e) {}
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
