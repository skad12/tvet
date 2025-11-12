"use client";

import { useState, useEffect } from "react";
import TicketsList from "@/components/admin/tickets/TicketsList";
import ChatModal from "@/components/admin/tickets/ChatModal";
import UserModal from "@/components/admin/tickets/UserModal";
import api from "@/lib/axios";

export default function TicketsPage() {
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);

  // loading + ticket count
  const [loading, setLoading] = useState(true);
  const [ticketsCount, setTicketsCount] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;

    const loadCount = async () => {
      setLoading(true);
      setError(null);

      try {
        // Prefer axios instance if available
        let res = null;
        if (api && typeof api.get === "function") {
          // endpoint that returns tickets or { tickets: [...] }
          res = await api.get("/tickets");
        } else {
          // fallback: try server proxy
          const fallback = await fetch("/api/tickets");
          if (!fallback.ok) throw new Error("fallback fetch failed");
          const json = await fallback.json();
          res = { data: json };
        }

        // normalize result -> array of tickets
        const all = Array.isArray(res.data)
          ? res.data
          : res.data?.tickets ?? [];

        if (mounted) {
          setTicketsCount(all.length);
        }
      } catch (err) {
        console.error("Failed to load ticket count", err);
        if (mounted) {
          setError("Failed to load ticket count");
          // safe fallback: 0
          setTicketsCount(0);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadCount();

    return () => {
      mounted = false;
    };
  }, []);

  // open chat modal
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
    <div className="min-h-screen bg-slate-50 p-6">
      <main className="max-w-7xl mx-auto gap-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-lg font-semibold">All Tickets</h4>

          <div className="text-sm text-slate-500">
            {loading ? "…" : ticketsCount ?? 0}
            {error && <span className="ml-3 text-red-500">({error})</span>}
          </div>
        </div>

        {/* Tickets list (left column) */}
        <div>
          <TicketsList onOpenChat={openChat} selectedId={selectedTicket?.id} />
        </div>
      </main>

      {/* Chat modal */}
      <ChatModal
        ticket={selectedTicket}
        open={chatOpen}
        onClose={closeChat}
        onOpenUser={openUserDetails}
        onMessageAdded={(newMsg, ticket) => {
          // persist via API
          api
            .post(`/tickets/${ticket.id}/messages`, newMsg)
            .catch(console.error);
          // also update parent state if needed
        }}
      />

      {/* User details modal */}
      <UserModal
        user={selectedTicket?.user}
        open={userOpen}
        onClose={closeUser}
      />
    </div>
  );
}
