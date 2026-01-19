
"use client";
import { useEffect, useMemo, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";
import { useUserStore } from "@/stores/useUserStore";

import Navbar from "@/components/customer/Topbar";
import ChatBox from "@/components/customer/CustomerChatBox";
import ChatList from "@/components/customer/CustomerChatList";

export default function CustomerDashboardPage() {
  const [selected, setSelected] = useState(null);

  const { user } = useAuth();
  const {
    tickets,
    ticketsLoading,
    ticketsError,
    fetchTicketsIfNeeded,
    fetchTickets,
  } = useUserStore();

  // Get user info from user object
  const userId = useMemo(() => {
    if (!user) return null;
    return (
      user.app_user_id ??
      user.appUserId ??
      user.user_id ??
      user.userId ??
      user.id ??
      user.uid ??
      user.pk ??
      null
    );
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
        ticket.user_id,
        ticket.userId,
        ticket.owner_id,
        ticket.ownerId,
        ticket.created_by,
        ticket.createdBy,
        ticket.requester_id,
        ticket.requesterId,
        ticket.requester,
        ticket.agent_id,
        ticket.agentId,
        ticket.customer_id,
        ticket.customerId,
        ticket.client_id,
        ticket.clientId,
        ticket.assignee_id,
        ticket.assigneeId,
        ticket.assigned_to,
        ticket.assignedTo,
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
        ticket.email,
        ticket.user_email,
        ticket.userEmail,
        ticket.requester_email,
        ticket.requesterEmail,
        ticket.customer_email,
        ticket.customerEmail,
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

  const ensureTickets = useCallback(async () => {
    try {
      const all = await fetchTicketsIfNeeded({
        ttlMs: 60000,
        userId,
        userEmail,
      });
      if (!selected && Array.isArray(all)) {
        const filtered = all.filter((ticket) =>
          ticketBelongsToUser(ticket, userId, userEmail)
        );

        // Only auto-select first ticket on larger screens (avoid auto-opening chat on mobile)
        const canAutoSelect =
          typeof window !== "undefined" ? window.innerWidth >= 1024 : true;

        if (filtered.length > 0 && canAutoSelect) {
          setSelected(filtered[0]);
        }
      }
    } catch (e) {
      // errors are already handled in store state
    }
  }, [fetchTicketsIfNeeded, selected, userId, userEmail]);

  // Load tickets when user becomes available, with caching
  useEffect(() => {
    if (!userId && !userEmail) return;
    ensureTickets();
  }, [userId, userEmail, ensureTickets]);

  // Filter tickets for current user
  const userTickets = useMemo(() => {
    if (!tickets.length || (!userId && !userEmail)) return [];
    return tickets.filter((ticket) =>
      ticketBelongsToUser(ticket, userId, userEmail)
    );
  }, [tickets, userId, userEmail]);

  // Update selected ticket when user tickets change
  useEffect(() => {
    if (!userTickets.length) {
      setSelected(null);
      return;
    }

    // If current selected ticket doesn't belong to user, select first user ticket
    if (selected && !ticketBelongsToUser(selected, userId, userEmail)) {
      setSelected(userTickets[0]);
    } else if (!selected) {
      // keep existing behavior on desktop; on mobile we intentionally don't auto-open — ensureTickets already handled that
      const isDesktop =
        typeof window !== "undefined" ? window.innerWidth >= 1024 : true;
      if (isDesktop) setSelected(userTickets[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userTickets, userId, userEmail]);

  return (
    <ProtectedRoute allowed={["customer"]}>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="min-h-screen bg-slate-50 py-4 md:py-6"
      >
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <Navbar
            userEmail={userEmail || undefined}
            onTicketCreated={() => {
              // Refresh tickets after creation
              if (userId || userEmail) {
                fetchTicketsIfNeeded({ force: true, userId, userEmail });
              }
            }}
          />
          {ticketsError && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {ticketsError}
            </div>
          )}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
            {/* Chat box - HIDDEN on mobile, shown on larger screens */}
            <div className="hidden lg:block">
              <ChatBox key={selected?.id} selected={selected} />
            </div>
            {/* Chat list - full width on mobile, 2/3 on desktop */}
            <div className="lg:col-span-2">
              <ChatList
                tickets={userTickets}
                selected={selected}
                setSelected={setSelected}
                loading={ticketsLoading}
                userId={userId ?? undefined}
                userEmail={userEmail || undefined}
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
                    // removed onClick so tapping the backdrop does NOT close the chat on mobile
                    className="lg:hidden fixed inset-0 bg-black/50 z-40"
                    aria-hidden="true"
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
                        selected={selected}
                        userEmail={userEmail || undefined}
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
