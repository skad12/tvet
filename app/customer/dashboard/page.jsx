"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import api from "../../../lib/axios";

import Navbar from "@/components/customer/Topbar";
import ChatBox from "@/components/customer/ChatBox";
import ChatList from "@/components/customer/ChatList";
import AdBox from "@/components/customer/AdBox";

export default function CustomerDashboardPage() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState("");
  const [selected, setSelected] = useState(null);
  const [msgText, setMsgText] = useState("");
  const [sendingMsg, setSendingMsg] = useState(false);

  useEffect(() => {
    const email = localStorage.getItem("tvet_user_email") || "";
    setUserEmail(email);
    fetchTickets(email);
  }, []);

  async function fetchTickets(filterEmail = "") {
    setLoading(true);
    try {
      const res = await api.get("/tickets");
      const all = Array.isArray(res.data)
        ? res.data
        : res.data?.tickets ?? res.data ?? [];
      const list = filterEmail
        ? all.filter(
            (t) =>
              String(t.email).toLowerCase() ===
              String(filterEmail).toLowerCase()
          )
        : all;
      setTickets(list);
      setSelected(list.length ? list[0] : null);
    } catch (err) {
      console.error("Failed to load tickets", err);
      setTickets([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleSendMessage(e) {
    e?.preventDefault();
    if (!msgText.trim() || !selected) return;
    setSendingMsg(true);

    const newMsg = {
      id: `local-${Date.now()}`,
      from: userEmail || "You",
      text: msgText.trim(),
      at: new Date().toISOString(),
    };

    setSelected((s) => ({ ...s, messages: [...(s?.messages ?? []), newMsg] }));
    setTickets((prev) =>
      prev.map((t) =>
        t.id === selected.id
          ? { ...t, messages: [...(t.messages ?? []), newMsg] }
          : t
      )
    );
    setMsgText("");
    setTimeout(() => setSendingMsg(false), 500);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="min-h-screen bg-slate-50 py-4"
    >
      <div className="max-w-7xl mx-auto px-4">
        <Navbar userEmail={userEmail} />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <ChatBox
            selected={selected}
            userEmail={userEmail}
            msgText={msgText}
            setMsgText={setMsgText}
            handleSendMessage={handleSendMessage}
            sendingMsg={sendingMsg}
          />
          <div className="lg:col-span-2">
            <ChatList
              tickets={tickets}
              selected={selected}
              setSelected={setSelected}
              loading={loading}
            />
            {/* <AdBox /> */}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
