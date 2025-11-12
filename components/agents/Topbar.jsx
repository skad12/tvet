

"use client";
import { motion } from "framer-motion";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext"; // adjust path if needed

export default function Navbar({ userEmail }) {
  const { signOut, user } = useAuth();

  // set to true if you want a confirm dialog before signing out
  const confirmOnSignOut = false;

  async function handleSignOut(e) {
    e.preventDefault();
    if (confirmOnSignOut) {
      const ok = window.confirm("Are you sure you want to sign out?");
      if (!ok) return;
    }
    try {
      // pass a redirect path if you want (e.g. '/')
      await signOut("/");
    } catch (err) {
      console.error("Failed to sign out:", err);
      // fallback: clear storage and redirect
      try {
        localStorage.removeItem("user");
        localStorage.removeItem("token");
      } catch (e) {}
      window.location.href = "/";
    }
  }

  return (
    <motion.div
      className="flex items-center justify-between mb-8"
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div>
        <h2 className="text-2xl font-semibold">
          Hi {userEmail ? userEmail.split("@")[0] : user?.name ?? "User"} 👋
        </h2>
        <div className="text-sm text-slate-500 mt-1">
          {userEmail ?? user?.email ?? "You are viewing your dashboard."}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Link href={"/support"}>
          <button className="px-4 py-2 bg-blue-600 text-white rounded">
            New Ticket
          </button>
        </Link>

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
