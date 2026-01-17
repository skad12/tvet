
"use client";

import { useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiX } from "react-icons/fi";
import { format, isValid } from "date-fns";

function normalizeStatusValue(statusVal) {
  if (statusVal === null || statusVal === undefined) return "active";
  const raw = String(statusVal).toLowerCase().trim();
  if (raw === "resolved" || raw === "closed" || raw === "completed")
    return "resolved";
  if (raw === "pending" || raw === "waiting" || raw === "in_progress")
    return "pending";
  if (raw === "active" || raw === "open" || raw === "new") return "active";
  return raw;
}

// Format date safely; prefer server's created_at_display if given
// Uses same format as AgentChatList: PPpp
function formatMaybeDate(val, display) {
  if (display) return display;
  if (!val) return "—";
  const dt = new Date(val);
  if (isValid(dt)) return format(dt, "PPpp");
  try {
    return String(val).slice(0, 32);
  } catch {
    return "—";
  }
}

export default function UserModal({ user = null, open, onClose }) {
  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") onClose?.();
    }
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const info = user ?? {
    name: "Chukwuma Okonkwo",
    id: "TVET-2024-1523",
    email: "chukwuma.o@example.com",
    phone: "+234 803 456 7890",
    location: "Lagos, Nigeria",
    program: "Welding Technology",
    enrolled: "January 2024",
  };

  // If this "user" object is actually a ticket or contains ticket fields,
  // prefer ticket_status and escalated when showing ticket-related bits.
  const statusRaw = info?.ticket_status ?? info?.status ?? null;
  const statusLabel =
    statusRaw === null || statusRaw === undefined
      ? "Active"
      : String(statusRaw);
  const statusNorm = normalizeStatusValue(statusLabel);
  const escalated = info?.escalated === true;

  return (
    <AnimatePresence>
      <motion.div className="fixed inset-0 z-60 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.5 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/40 "
        />

        <motion.div
          initial={{ y: 20, opacity: 0, scale: 0.98 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 8, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-md bg-white rounded-lg shadow-xl"
        >
          <div className="flex items-center justify-between px-6 py-4 border-b">
            <h3 className="text-lg font-semibold">User Details</h3>
            <div className="flex items-center gap-2">
              <div
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                  statusNorm === "resolved"
                    ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                    : statusNorm === "pending"
                    ? "bg-amber-100 text-amber-700 border border-amber-200"
                    : "bg-blue-100 text-blue-700 border border-blue-200"
                }`}
              >
                {statusLabel}
              </div>
              {escalated && (
                <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
                  Escalated
                </div>
              )}
              <button
                onClick={onClose}
                className="p-2 rounded hover:bg-slate-100"
              >
                <FiX />
              </button>
            </div>
          </div>

          <div className="p-6 space-y-4 text-sm text-slate-600">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 font-medium">
                {(info.name ?? "U").slice(0, 2).toUpperCase()}
              </div>
              <div>
                <div className="font-semibold text-slate-800">{info.name}</div>
                <div className="text-xs text-slate-500">
                  Student ID: {info.id}
                </div>
              </div>
            </div>

            <div>
              <div className="text-xs text-slate-500">Contact</div>
              <div className="mt-2">{info.email}</div>
              <div className="mt-1">{info.phone}</div>
              <div className="mt-1">{info.location}</div>
            </div>

            <div>
              <div className="text-xs text-slate-500">Enrollment</div>
              <div className="mt-2 font-medium">{info.program}</div>
              <div className="text-xs text-slate-400">
                Enrolled since {info.enrolled}
              </div>
            </div>

            {/* If the passed "user" object contains ticket-ish fields, show them */}
            {(info.ticket_status || info.escalated || info.created_at) && (
              <div>
                <div className="text-xs text-slate-500">Ticket</div>
                <div className="mt-2 text-sm">
                  <div>
                    Status: <span className="font-medium">{statusLabel}</span>
                  </div>
                  {escalated && (
                    <div className="mt-1 text-red-600 font-semibold">
                      Escalated
                    </div>
                  )}
                  <div className="mt-1 text-xs text-slate-400">
                    Created: {formatMaybeDate(info.created_at)}
                  </div>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
