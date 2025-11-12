"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { FiClock } from "react-icons/fi";
import api from "@/lib/axios";

export default function TicketsList({ onOpenChat, selectedId }) {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const res = api ? await api.get("/tickets") : null;
        const data = res?.data ?? [
          {
            id: "t-01",
            email: "chukwuma.o@example.com",
            categoryTitle: "Issues with the Center",
            preview:
              "I need help with my course enrollment for the welding program.",
            createdAt: new Date().toISOString(),
            status: "pending",
            messages: [],
          },
          {
            id: "t-02",
            email: "aisha.moh@example.com",
            categoryTitle: "Onboarding issues and sign in",
            preview: "When does the next semester start?",
            createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
            status: "active",
            messages: [],
          },
        ];
        if (mounted) setTickets(data);
      } catch (err) {
        console.error("Failed to load tickets", err);
        if (mounted) setTickets([]);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => (mounted = false);
  }, []);

  return (
    <aside className="h-[calc(100vh-96px)] overflow-auto rounded-lg p-4">
      <motion.ul
        layout
        initial="hidden"
        animate="visible"
        className="space-y-3"
      >
        {loading ? (
          <li className="text-sm text-slate-500 py-8 text-center">
            Loading tickets…
          </li>
        ) : tickets.length === 0 ? (
          <li className="text-sm text-slate-500 py-8 text-center">
            No tickets found
          </li>
        ) : (
          tickets.map((t) => (
            <motion.li
              key={t.id}
              layout
              whileHover={{ scale: 1.01 }}
              onClick={() => onOpenChat?.(t)}
              className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer border  border-slate-400 ${
                selectedId === t.id
                  ? "bg-slate-50 border-blue-100"
                  : "hover:bg-slate-50"
              }`}
            >
              <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-medium text-slate-700">
                {t.email?.slice(0, 2).toUpperCase() ?? "U"}
              </div>

              <div className="flex-1">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <div className="font-medium text-slate-800">
                      {t.email.split?.("@")?.[0] ?? t.email}
                    </div>
                    <div className="text-xs text-slate-500">
                      {t.categoryTitle ?? "No subject"}
                    </div>
                  </div>
                  <div className="text-xs text-slate-400 text-right">
                    <div className="flex items-center gap-1">
                      <FiClock className="w-3 h-3" />
                      <span>{new Date(t.createdAt).toLocaleTimeString()}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-2 text-sm text-slate-600">{t.preview}</div>
                <div className="mt-2 flex items-center gap-2">
                  <span
                    className={`inline-block text-xs px-2 py-0.5 rounded ${
                      t.status === "resolved"
                        ? "bg-green-50 text-green-700"
                        : t.status === "pending"
                        ? "bg-amber-50 text-amber-700"
                        : "bg-slate-50 text-slate-700"
                    }`}
                  >
                    {t.status}
                  </span>
                </div>
              </div>
            </motion.li>
          ))
        )}
      </motion.ul>
    </aside>
  );
}
