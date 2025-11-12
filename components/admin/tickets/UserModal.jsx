"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiX } from "react-icons/fi";

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

  return (
    <AnimatePresence>
      <motion.div className="fixed inset-0 z-60 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.5 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/40"
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
            <button
              onClick={onClose}
              className="p-2 rounded hover:bg-slate-100"
            >
              <FiX />
            </button>
          </div>

          <div className="p-6 space-y-4 text-sm text-slate-600">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 font-medium">
                {info.name.slice(0, 2).toUpperCase()}
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
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
