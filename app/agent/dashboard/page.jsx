"use client";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/axios";

import Navbar from "@/components/customer/Topbar";
import ChatBox from "@/components/customer/CustomerChatBox";
import ChatList from "@/components/customer/CustomerChatList";

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

  async function fetchTickets(currentUserId, currentEmail) {
    setLoadingTickets(true);
    setTicketsError(null);
    try {
      let data = null;
      const endpointRelative = "/tickets/";
      if (api && typeof api.get === "function") {
        const res = await api.get(endpointRelative);
        data = res?.data;
      } else {
        const res = await fetch(endpointRelative, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });
        if (!res.ok) {
          throw new Error(`Failed to fetch tickets (${res.status})`);
        }
        data = await res.json();
      }

      const allTickets = Array.isArray(data)
        ? data
        : data?.tickets ?? data ?? [];

      const filtered = allTickets.filter((ticket) =>
        ticketBelongsToUser(ticket, currentUserId, currentEmail)
      );

      setTickets(allTickets);
      setSelected(filtered.length > 0 ? filtered[0] : null);
    } catch (err) {
      console.error("Failed to load tickets", err);
      setTickets([]);
      setSelected(null);
      setTicketsError(err?.message ?? "Failed to load tickets");
    } finally {
      setLoadingTickets(false);
    }
  }

  useEffect(() => {
    if (!userId && !userEmail) return;
    fetchTickets(userId, userEmail);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, userEmail]);

  useEffect(() => {
    if (!userId && !userEmail) return;
    const interval = setInterval(() => fetchTickets(userId, userEmail), 10000);
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
        className="min-h-screen bg-slate-50 py-4"
      >
        <div className="max-w-7xl mx-auto px-4">
          <Navbar userEmail={userEmail || undefined} showCreateTicket={false} />
          {ticketsError && (
            <div className="mb-4 rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {ticketsError}
            </div>
          )}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <ChatBox key={selected?.id} selected={selected} />
            <div className="lg:col-span-2">
              <ChatList
                tickets={tickets}
                selected={selected}
                setSelected={setSelected}
                loading={loadingTickets}
                userId={userId ?? undefined}
                userEmail={userEmail || undefined}
              />
              {/* Additional agent-specific components can be added here */}
            </div>
          </div>
        </div>
      </motion.div>
    </ProtectedRoute>
  );
}
