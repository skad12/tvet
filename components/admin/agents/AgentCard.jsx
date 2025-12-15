"use client";

import { motion } from "framer-motion";
import { LuMail } from "react-icons/lu";
import { FiPhoneCall } from "react-icons/fi";

export default function AgentCard({ agent, currentUserEmail = null }) {
  const {
    username = "Agent",
    email = "",
    phone = "—",
    status = "offline",
  } = agent;

  const normalizeStatus = (value) => {
    const v = String(value || "").toLowerCase();
    if (v === "available") return "available";
    if (v === "engaged") return "engaged";
    return "offline";
  };

  const liveStatus = normalizeStatus(status);

  const statusStyles = {
    available: {
      badge: "bg-emerald-50 text-emerald-700",
      dot: "bg-emerald-500",
      label: "Available",
    },
    engaged: {
      badge: "bg-blue-50 text-blue-700",
      dot: "bg-blue-500",
      label: "Engaged",
    },
    offline: {
      badge: "bg-red-50 text-red-700",
      dot: "bg-red-500",
      label: "Offline",
    },
  };

  const { badge, dot, label } =
    statusStyles[liveStatus] || statusStyles.offline;

  const initials = (username || "U")
    .split(/\s|[._-]/)
    .map((s) => (s ? s[0] : ""))
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const isYou =
    currentUserEmail &&
    email &&
    currentUserEmail.toLowerCase() === email.toLowerCase();

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      className={`bg-white rounded-lg shadow-sm p-6 ${
        isYou ? "ring-2 ring-blue-200" : ""
      }`}
      role="article"
    >
      <div className="flex items-start gap-4">
        <div className="relative">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 font-semibold">
            {initials}
          </div>

          <span
            className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${dot}`}
            aria-hidden
            title={label}
          />
        </div>

        <div className="flex-1">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="text-slate-800 font-semibold">
                {username}{" "}
                {isYou && (
                  <span className="ml-2 text-xs text-blue-600">(You)</span>
                )}
              </div>
              <div
                className={`text-xs mt-1 px-2 py-0.5 rounded-full inline-block ${badge}`}
              >
                {label}
              </div>
            </div>

            <div className="text-xs text-slate-400">{/* action area */}</div>
          </div>

          <div className="mt-4 text-sm text-slate-600 space-y-2">
            <div className="flex items-center gap-2">
              <LuMail />
              <div className="truncate">{email}</div>
            </div>

            <div className="flex items-center gap-2">
              <FiPhoneCall />
              <div className="truncate">{phone}</div>
            </div>
          </div>
        </div>
      </div>
    </motion.article>
  );
}
