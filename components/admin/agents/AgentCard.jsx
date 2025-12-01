// components/admin/AgentCard.jsx
"use client";

import { motion } from "framer-motion";
import { LuMail } from "react-icons/lu";
import { FiPhoneCall } from "react-icons/fi";

/**
 * AgentCard
 * Props:
 *  - agent: { id, name, email, phone, status, metrics: { active, resolved, avgTime } }
 */
export default function AgentCard({ agent }) {
  const {
    id,
    name,
    email,
    phone,
    status: initialStatus = "offline",
    metrics = {},
  } = agent;

  const normalizeStatus = (value) => {
    const lowered = String(value || "").toLowerCase();
    if (lowered === "available" || lowered === "online") return "available";
    if (lowered === "away" || lowered === "busy") return "away";
    return "offline";
  };

  const liveStatus = normalizeStatus(initialStatus);

  const initials = (name || "U")
    .split(" ")
    .map((s) => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const statusStyles = {
    available: {
      badge: "bg-emerald-50 text-emerald-700",
      dot: "bg-emerald-500",
      label: "Available",
    },
    away: {
      badge: "bg-amber-50 text-amber-700",
      dot: "bg-amber-400",
      label: "Away",
    },
    offline: {
      badge: "bg-slate-50 text-slate-600",
      dot: "bg-slate-300",
      label: "Offline",
    },
  };

  const { badge, dot, label } =
    statusStyles[liveStatus] ?? statusStyles.offline;

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.25 }}
      className="bg-white rounded-lg shadow-sm p-6"
      role="article"
    >
      <div className="flex items-start gap-4">
        <div className="relative">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 font-semibold">
            {initials}
          </div>

          {/* small status dot */}
          <span
            className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${dot}`}
            aria-hidden
            title={label}
          />
        </div>

        <div className="flex-1">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="text-slate-800 font-semibold">{name}</div>
              <div
                className={`text-xs mt-1 px-2 py-0.5 rounded-full inline-block ${badge}`}
              >
                {label}
              </div>
            </div>
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

          <hr className="my-4 border-t border-slate-100" />

          <div className="grid grid-cols-3 text-center gap-4">
            <div>
              <div className="text-lg font-semibold text-slate-800">
                {metrics.active ?? 0}
              </div>
              <div className="text-xs text-slate-500 mt-1">Active</div>
            </div>

            <div>
              <div className="text-lg font-semibold text-slate-800">
                {metrics.resolved ?? 0}
              </div>
              <div className="text-xs text-slate-500 mt-1">Resolved</div>
            </div>

            <div>
              <div className="text-lg font-semibold text-slate-800">
                {metrics.avgTime ?? "—"}
              </div>
              <div className="text-xs text-slate-500 mt-1">Avg Time</div>
            </div>
          </div>
        </div>
      </div>
    </motion.article>
  );
}
