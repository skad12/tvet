"use client";
import { motion } from "framer-motion";
import { format } from "date-fns";

export default function ChatList({ tickets, selected, setSelected, loading }) {
  const listContainer = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.05 } },
  };
  const listItem = {
    hidden: { opacity: 0, y: 8 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <motion.div layout className="bg-white rounded shadow p-4 mb-6">
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-slate-800">Your Tickets</h3>
        <div className="text-sm text-slate-500">
          Showing {loading ? "..." : tickets.length} tickets
        </div>
      </div>

      <motion.div
        variants={listContainer}
        initial="hidden"
        animate="visible"
        className="mt-4 divide-y"
      >
        {loading ? (
          <div className="p-6 text-sm text-slate-500">Loading tickets…</div>
        ) : tickets.length === 0 ? (
          <div className="p-6 text-sm text-slate-500">
            No tickets found for your email.
          </div>
        ) : (
          tickets.map((t) => (
            <motion.div
              key={t.id}
              layout
              variants={listItem}
              whileHover={{ scale: 1.01 }}
              onClick={() => setSelected(t)}
              className={`flex items-center justify-between p-3 cursor-pointer ${
                selected?.id === t.id ? "bg-slate-50" : ""
              }`}
            >
              <div>
                <div className="font-medium text-slate-800">
                  {t.category || t.categoryTitle || "No subject"}
                </div>
                <div className="text-xs text-slate-500">{t.email}</div>
              </div>
              <div className="text-right">
                <div className="inline-block text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded">
                  Low
                </div>
                <div className="text-xs text-slate-400 mt-1">
                  {t.createdAt ? format(new Date(t.createdAt), "PPpp") : "—"}
                </div>
              </div>
            </motion.div>
          ))
        )}
      </motion.div>
    </motion.div>
  );
}
