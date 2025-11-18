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
    <motion.div
      className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-slate-200 py-4 mb-8"
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div>
        <h2 className="text-2xl font-semibold">Hi {displayName} 👋</h2>
        {/* <div className="text-sm text-slate-500 mt-1">
          {displayEmail || "You are viewing your dashboard."}
        </div> */}
        <div className="mt-1 text-xs text-slate-500">
          <span className="uppercase tracking-wide text-slate-500">
            {String(accountType || "user")}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={handleSignOut}
          className="px-4 py-2 border rounded"
          aria-label="Sign out"
        >
          Logout
        </button>
      </div>
    </motion.div>
  );
}
