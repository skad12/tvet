"use client";

import { motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext"; // adjust path if needed

export default function Navbar({ userEmail }) {
  const { signOut, user } = useAuth();

  const userId =
    // user?.app_user_id ??
    // user?.appUserId ??
    // user?.user_id ??
    // user?.userId ??
    user?.id ?? null;
  const accountType = user?.account_type ?? user?.role ?? user?.type ?? "user";
  const displayName =
    user?.name ??
    user?.full_name ??
    user?.fullName ??
    (userEmail ? userEmail.split("@")[0] : "User");
  const displayEmail = userEmail ?? user?.email ?? user?.username ?? "";

  async function handleSignOut(e) {
    e?.preventDefault?.();
    try {
      // signOut defined in AuthContext will clear storage and redirect
      signOut("/auth/login");
    } catch (err) {
      console.error("Failed to sign out:", err);
      try {
        localStorage.removeItem("user");
        localStorage.removeItem("token");
      } catch (e) {}
      window.location.href = "/auth/login";
    }
  }

  return (
    <motion.div
      className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-slate-200 py-3 sm:py-4 mb-4 sm:mb-6 lg:mb-8 px-2 sm:px-0"
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
      <div>
          <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold">Hi {displayName} 👋</h2>
          <div className="mt-1 text-[10px] sm:text-xs text-slate-500">
          <span className="uppercase tracking-wide text-slate-500">
            {String(accountType || "user")}
          </span>
        </div>
      </div>

        <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
        <button
          onClick={handleSignOut}
            className="px-3 sm:px-4 py-1.5 sm:py-2 border rounded text-xs sm:text-sm w-full sm:w-auto"
          aria-label="Sign out"
        >
            <span className="hidden sm:inline">Logout</span>
            <span className="sm:hidden">Exit</span>
        </button>
        </div>
      </div>
    </motion.div>
  );
}
