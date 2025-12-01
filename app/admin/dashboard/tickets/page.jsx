"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
    setSelectedTicket(null);
  }

  // Open chat only when a ticket is selected via list interaction
  // Avoid auto-reopening when closing the modal
  useEffect(() => {
    if (selectedTicket) setChatOpen(true);
  }, [selectedTicket]);

  function openUserDetails(ticket) {
    setSelectedTicket(ticket);
    setUserOpen(true);
  }

  function closeUser() {
    setUserOpen(false);
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="min-h-screen bg-slate-50 p-3 sm:p-4 lg:p-6"
    >
      <main className="max-w-7xl mx-auto px-2 sm:px-4 py-2 sm:py-4">
        <motion.h1
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-800 mb-1"
        >
          Tickets
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-xs sm:text-sm text-slate-500 mb-4 sm:mb-6"
        >
          Browse and manage support tickets
        </motion.p>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <TicketsList onOpenChat={openChat} selectedId={selectedTicket?.id} />
        </motion.div>
      </main>

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
    </motion.div>
  );
}
