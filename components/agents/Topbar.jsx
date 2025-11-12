"use client";
import { motion } from "framer-motion";
import Link from "next/link";

export default function Navbar({ userEmail }) {
  return (
    <motion.div
      className="flex items-center justify-between mb-8"
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div>
        <h2 className="text-2xl font-semibold">
          Hi {userEmail ? userEmail.split("@")[0] : "User"} 👋
        </h2>
        <div className="text-sm text-slate-500 mt-1">
          {userEmail || "You are viewing your dashboard."}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Link href={"/support"}>
          <button className="px-4 py-2 bg-blue-600 text-white rounded">
            New Ticket
          </button>
        </Link>

        <Link href={"/"}>
          {" "}
          <button className="px-4 py-2 border rounded">Logout</button>
        </Link>
      </div>
    </motion.div>
  );
}
