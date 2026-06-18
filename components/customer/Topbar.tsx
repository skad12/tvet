"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext"; // adjust path if needed
import CreateTicket from "./CreateTicket"; // adjust path if you place CreateTicket elsewhere
import ThemeToggle from "@/components/ThemeToggle";

type NavbarProps = {
  userEmail?: string;
  onTicketCreated?: (ticket: any) => void;
  showCreateTicket?: boolean;
  userStatus?: string | null;
};

export default function Navbar({
  userEmail,
  onTicketCreated,
  showCreateTicket = true,
  userStatus = null,
}: NavbarProps) {
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
      toast.success("Signed out successfully");
      signOut("/auth/login");
    } catch (err) {
      console.error("Failed to sign out:", err);
      toast.error("Sign out failed. Redirecting to login.");
      try {
        localStorage.removeItem("user");
        localStorage.removeItem("token");
      } catch (e) {}
      window.location.href = "/auth/login";
    }
  }

  return (
    <>
      <motion.div
        className="sticky top-0 z-40 mb-6 rounded-3xl border border-border bg-card/85 text-card-foreground px-5 py-4 shadow-xl shadow-slate-950/5 backdrop-blur md:mb-8"
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h2 className="text-xl sm:text-2xl font-semibold truncate">
              Hi {displayName} 👋
            </h2>
            <div className="text-xs sm:text-sm text-muted mt-1 truncate">
              {displayEmail || "You are viewing your dashboard."}
            </div>
            <div className="mt-1 text-xs text-muted flex items-center gap-2 flex-wrap">
              {/* <span className="font-medium text-slate-600">
                ID: {userId ? String(userId) : "—"}
              </span> */}

              <span className="uppercase tracking-wide text-muted">
                {String(accountType || "user")}
              </span>

              {userStatus && (
                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  {userStatus}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0 flex-wrap justify-end">
            <ThemeToggle variant="ghost" />
            {/* <div className="text-right text-xs sm:text-sm">
            <div className="font-semibold text-slate-800">{displayName}</div>
            <div className="uppercase tracking-wide text-slate-500">
              {displayRole}
            </div>
          </div> */}

            {showCreateTicket && (
              <button
                onClick={() => setIsModalOpen(true)}
                className="rounded-full bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-blue-600/20 transition-colors hover:bg-blue-700 sm:text-base"
                aria-haspopup="dialog"
                aria-expanded={isModalOpen}
              >
                <span className="hidden sm:inline">New Ticket</span>
                <span className="sm:hidden">+ New</span>
              </button>
            )}

            <button
              onClick={handleSignOut}
              className="rounded-full border border-border bg-card/80 px-4 py-2 text-sm text-foreground transition-colors hover:bg-surface-muted sm:text-base"
              aria-label="Sign out"
              disabled={signingOut}
            >
              <span className="hidden sm:inline">
                {signingOut ? "Logging out…" : "Logout"}
              </span>
              <span className="sm:hidden">{signingOut ? "..." : "Logout"}</span>
            </button>
          </div>
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
