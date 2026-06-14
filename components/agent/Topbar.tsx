"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import api from "@/lib/axios";
import { useAuth } from "@/context/AuthContext";

type AgentTopbarProps = {
  userEmail?: string;
  showCreateTicket?: boolean;
};

export default function AgentTopbar({ userEmail }: AgentTopbarProps) {
  const { signOut, user } = useAuth();
  const [signingOut, setSigningOut] = useState(false);
  const [agentStatus, setAgentStatus] = useState("loading");

  const userId =
    user?.app_user_id ??
    user?.appUserId ??
    user?.user_id ??
    user?.userId ??
    user?.id ??
    null;

  const accountType = user?.account_type ?? user?.role ?? user?.type ?? "agent";

  const displayName =
    user?.username ??
    user?.full_name ??
    user?.fullName ??
    (userEmail ? userEmail.split("@")[0] : "Agent");

  const displayEmail = userEmail ?? user?.email ?? user?.username ?? "";

  /* --------------------------------------------
     Fetch Agent Status
  --------------------------------------------- */
  useEffect(() => {
    if (!userId) return;

    let mounted = true;

    const fetchStatus = async () => {
      try {
        const res = await api.get(`/get-user-status/${String(userId)}/`);
        const status = res?.data?.status ?? res?.data?.user_status ?? "offline";
        if (!mounted) return;
        setAgentStatus(String(status).toLowerCase());
      } catch (err) {
        console.error("Failed to fetch agent status:", err);
        if (!mounted) return;
        setAgentStatus("error");
      }
    };

    fetchStatus();

    // keep status fresh
    const interval = setInterval(fetchStatus, 10000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [userId]);

  /* --------------------------------------------
     Status Pill Styling
  --------------------------------------------- */
  const statusStyles = {
    available: "bg-green-100 text-green-700 border-green-200",
    engaged: "bg-yellow-100 text-yellow-700 border-yellow-200",
    offline: "bg-slate-100 text-slate-600 border-slate-200",
    loading: "bg-blue-100 text-blue-700 border-blue-200",
    error: "bg-red-100 text-red-700 border-red-200",
  };

  const statusClass = statusStyles[agentStatus] || statusStyles.error;

  /* --------------------------------------------
     Sign Out
  --------------------------------------------- */
  async function handleSignOut(e) {
    e?.preventDefault?.();
    if (signingOut) return;
    setSigningOut(true);

    try {
      if (userId) {
        await api.post("/sign-out/", {
          app_user_id: String(userId),
        });
      }
    } catch (err) {
      console.warn("Sign-out sync failed:", err);
    } finally {
      signOut("/auth/login");
    }
  }

  return (
    <motion.div
      className="sticky top-0 z-40 mb-4 rounded-3xl border border-white/70 bg-white/85 px-5 py-4 shadow-xl shadow-slate-950/5 backdrop-blur sm:mb-6 lg:mb-8"
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold">
            Hi {displayName} 👋
          </h2>
          <div className="text-xs sm:text-sm text-slate-500 mt-1 truncate">
            {displayEmail || "You are viewing your dashboard."}
          </div>
          <div className="mt-1 flex items-center gap-2">
            <span className="uppercase text-[10px] sm:text-xs tracking-wide text-slate-500">
              {String(accountType)}
            </span>

            <span
              className={`rounded-full border px-2 py-0.5 text-[10px] font-medium capitalize sm:text-xs ${statusClass}`}
            >
              {agentStatus}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={handleSignOut}
            disabled={signingOut}
            className="w-full rounded-full border border-slate-300 bg-white/80 px-4 py-2 text-xs transition hover:bg-slate-50 disabled:opacity-60 sm:w-auto sm:text-sm"
          >
            {signingOut ? "Logging out…" : "Logout"}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
