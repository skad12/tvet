"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import api from "@/lib/axios";
import { useAuth } from "@/context/AuthContext";
import ThemeToggle from "@/components/ThemeToggle";
import ChangePasswordButton from "@/components/account/ChangePassword";
import MyCategoriesHeadline from "@/components/tickets/MyCategories";
import TrackTicket from "@/components/tickets/TrackTicket";
import BrandMark from "@/components/account/BrandMark";
import StatusControl, { clearStatusMode } from "@/components/account/StatusControl";

type AgentTopbarProps = {
  userEmail?: string;
  showCreateTicket?: boolean;
};

export default function AgentTopbar({ userEmail }: AgentTopbarProps) {
  const { signOut, user } = useAuth();
  const [signingOut, setSigningOut] = useState(false);

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
     Sign Out
  --------------------------------------------- */
  async function handleSignOut(e) {
    e?.preventDefault?.();
    if (signingOut) return;
    setSigningOut(true);

    // The next sign-in starts on Automatic again.
    clearStatusMode(userId ? String(userId) : null);
    try {
      if (userId) {
        await api.post("/sign-out/", {
          app_user_id: String(userId),
        });
      }
    } catch (err) {
      console.warn("Sign-out sync failed:", err);
      toast.error("Could not sync sign-out status, signing out locally.");
    } finally {
      toast.success("Signed out successfully");
      signOut("/auth/login");
    }
  }

  return (
    <motion.div
      className="sticky top-0 z-40 mb-4 rounded-3xl border border-border bg-card/85 text-card-foreground px-5 py-4 shadow-xl shadow-slate-950/5 backdrop-blur sm:mb-6 lg:mb-8"
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="mb-3 border-b border-border pb-3">
        <BrandMark workspace="Agent workspace" href="/agent/dashboard" />
      </div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold">
            Hi {displayName} 👋
          </h2>
          <MyCategoriesHeadline role="agent" />
          <div className="text-xs sm:text-sm text-muted mt-1 truncate">
            {displayEmail || "You are viewing your dashboard."}
          </div>
          <div className="mt-1.5 flex items-center gap-2">
            <StatusControl userId={userId ? String(userId) : null} />
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="hidden w-64 sm:block">
            <TrackTicket role="agent" compact />
          </div>
          <ThemeToggle variant="ghost" />
          <ChangePasswordButton />
          <button
            onClick={handleSignOut}
            disabled={signingOut}
            className="w-full rounded-full border border-border bg-card/80 px-4 py-2 text-xs text-foreground transition hover:bg-surface-muted disabled:opacity-60 sm:w-auto sm:text-sm"
          >
            {signingOut ? "Logging out…" : "Logout"}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
