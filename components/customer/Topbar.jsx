// components/Navbar.jsx
"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext"; // adjust path if needed
import CreateTicket from "./CreateTicket"; // adjust path if you place CreateTicket elsewhere

export default function Navbar({
  userEmail,
  onTicketCreated,
  showCreateTicket = true,
}) {
  const { signOut, user } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const userId =
    user?.app_user_id ??
    user?.appUserId ??
    user?.user_id ??
    user?.userId ??
    user?.id ??
    user?.uid ??
    user?.pk ??
    null;
  const accountType = user?.account_type ?? user?.role ?? user?.type ?? "user";
  const displayName =
    user?.username ?? (userEmail ? userEmail.split("@")[0] : "User");
  const displayEmail = userEmail ?? user?.email ?? user?.username ?? "";
  const displayRole = (accountType || "user").toString().toLowerCase();

  async function handleSignOut(e) {
    e?.preventDefault?.();
    setSigningOut(true);
    try {
      // signOut defined in AuthContext will clear storage and redirect
      await signOut("/");
    } catch (err) {
      console.error("Failed to sign out:", err);
      try {
        localStorage.removeItem("user");
        localStorage.removeItem("token");
      } catch (e) {}
      window.location.href = "/";
    }
  }

  return (
    <>
      <motion.div
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 md:mb-8"
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="flex-1 min-w-0">
          <h2 className="text-xl sm:text-2xl font-semibold truncate">
            Hi {displayName} 👋
          </h2>
          <div className="text-xs sm:text-sm text-slate-500 mt-1 truncate">
            {displayEmail || "You are viewing your dashboard."}
          </div>
          <div className="mt-1 text-xs text-slate-500 flex items-center gap-2 flex-wrap">
            <span className="font-medium text-slate-600">
              ID: {userId ? String(userId) : "—"}
            </span>

            <span className="uppercase tracking-wide text-slate-500">
              {String(accountType || "user")}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0 flex-wrap justify-end">
          {/* <div className="text-right text-xs sm:text-sm">
            <div className="font-semibold text-slate-800">{displayName}</div>
            <div className="uppercase tracking-wide text-slate-500">
              {displayRole}
            </div>
          </div> */}

          {showCreateTicket && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg text-sm sm:text-base font-medium hover:bg-blue-700 transition-colors"
              aria-haspopup="dialog"
              aria-expanded={isModalOpen}
            >
              <span className="hidden sm:inline">New Ticket</span>
              <span className="sm:hidden">+ New</span>
            </button>
          )}

          <button
            onClick={handleSignOut}
            className="px-3 sm:px-4 py-2 border border-slate-300 rounded-lg text-sm sm:text-base hover:bg-slate-50 transition-colors"
            aria-label="Sign out"
            disabled={signingOut}
          >
            <span className="hidden sm:inline">
              {signingOut ? "Logging out…" : "Logout"}
            </span>
            <span className="sm:hidden">{signingOut ? "..." : "Exit"}</span>
          </button>
        </div>
      </motion.div>

      {/* Controlled modal */}
      <AnimatePresence>
        {isModalOpen && (
          <CreateTicket
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            defaultReporterEmail={displayEmail}
            onTicketCreated={(ticket) => {
              // Close modal after ticket creation
              setIsModalOpen(false);
              // Trigger refresh callback if provided
              if (onTicketCreated) {
                onTicketCreated(ticket);
              }
            }}
          />
        )}
      </AnimatePresence>
    </>
  );
}
