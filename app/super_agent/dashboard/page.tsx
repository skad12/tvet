
"use client";
import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/axios";

import Navbar from "@/components/super_agent/Topbar";
import ChatModal from "@/components/admin/tickets/ChatModal";
import StaffOverview from "@/components/tickets/StaffOverview";
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

  // Super agents see escalated tickets in their own categories only. The
  // API works out whose categories from the sign-in token sent with the call.
  async function fetchEscalatedTickets({ showLoading = true } = {}) {
    if (showLoading) setLoadingTickets(true);
    setTicketsError(null);
    try {
      const res = await api.get("/super-agent/tickets/");
      const data = res?.data;

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

      setTickets(escalatedTickets);

      // Preserve current selection when possible; otherwise auto-select FIRST only on desktop
      setSelected((prevSelected) => {
        if (prevSelected) {
          const exists = escalatedTickets.find(
            (t) =>
              String(t.id ?? t.pk) ===
              String(prevSelected.id ?? prevSelected.pk)
          );
          if (exists) return exists;
        }
        // Nothing opens automatically: a ticket opens as a popup only when
        // the super agent picks one.
        return null;
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
  }, []);

  useEffect(() => {
    if (!userId) return;
    fetchUserStatus(userId);
    // Refresh status every 10 seconds
    const interval = setInterval(() => fetchUserStatus(userId), 10000);
    return () => clearInterval(interval);
  }, [userId]);

  useEffect(() => {
    // Refresh escalated tickets every 10 seconds
    const interval = setInterval(
      () => fetchEscalatedTickets({ showLoading: false }),
      10000
    );
    return () => clearInterval(interval);
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
        className="min-h-screen app-shell py-3 sm:py-5"
      >
        <div className="mx-auto max-w-7xl px-3 sm:px-5">
          <Navbar
            userEmail={userEmail || undefined}
            showCreateTicket={false}
            userStatus={userStatus}
          />
          {ticketsError && (
            <div className="mb-3 rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 shadow-sm sm:mb-4 sm:px-4 sm:py-3 sm:text-sm">
              {ticketsError}
            </div>
          )}

          <StaffOverview tickets={tickets} role="super_agent" />

          {/* The list takes the full width; a ticket opens as a popup chat,
              the same one the admin dashboard uses, and replies are sent from it. */}
          <SuperAgentChatList
            tickets={tickets}
            selected={selected}
            setSelected={setSelected}
            loading={loadingTickets}
            onRefresh={handleManualRefresh}
            refreshing={refreshing}
            autoSelect={false}
          />

          <AnimatePresence>
            {selected && (
              <ChatModal
                key={selected?.id}
                ticket={selected}
                open
                canEscalate={false}
                closeOnMove
                onClose={() => setSelected(null)}
                onMessageAdded={() => fetchEscalatedTickets({ showLoading: false })}
              />
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </ProtectedRoute>
  );
}
