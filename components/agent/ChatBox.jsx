"use client";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { useState } from "react";

export default function ChatBox({
  selected,
  userEmail,
  msgText,
  setMsgText,
  handleSendMessage,
  sendingMsg,
}) {
  const messageItem = {
    hidden: { opacity: 0, y: 6 },
    visible: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -6 },
  };

  return (
    <motion.div layout className="lg:col-span-1 bg-white rounded shadow p-4">
      <div className="mb-3">
        <h3 className="font-medium text-slate-800">Conversation</h3>
        <p className="text-xs text-slate-500">Selected ticket chat & replies</p>
      </div>

      {!selected ? (
        <div className="p-6 text-sm text-slate-500">
          No ticket selected. Select a ticket from the list on the right.
        </div>
      ) : (
        <>
          <motion.div layout className="border rounded p-3 mb-4">
            <div className="text-sm font-semibold">
              {selected.category || selected.categoryTitle || "Subject"}
            </div>
            <div className="text-xs text-slate-400 mt-1">
              Ticket ID:{" "}
              <span className="text-xs text-indigo-600">{selected.id}</span>
            </div>
            <div className="text-xs text-slate-400">
              Priority:{" "}
              <span className="inline-block ml-2 text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded">
                Low
              </span>
            </div>
          </motion.div>

          <div className="space-y-3 max-h-[320px] overflow-auto mb-4">
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-blue-600 text-white rounded p-3 text-sm"
            >
              Support — Welcome to HelpDesk! Your ticket is being routed, an
              agent will join shortly.
            </motion.div>

            <AnimatePresence initial={false}>
              {(selected.messages ?? []).map((m) => (
                <motion.div
                  key={m.id || m.at}
                  variants={messageItem}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className={`p-3 rounded ${
                    m.from === userEmail
                      ? "bg-slate-100 self-end"
                      : "bg-white border"
                  }`}
                >
                  <div className="text-sm text-slate-800">{m.text}</div>
                  <div className="text-xs text-slate-400 mt-1">
                    {format(new Date(m.at), "PPpp")}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {(selected.messages ?? []).length === 0 && (
              <div className="text-sm text-slate-400">No messages yet.</div>
            )}
          </div>

          <form
            onSubmit={handleSendMessage}
            className="flex gap-2 items-center"
          >
            <input
              className="flex-1 border px-3 py-2 rounded"
              placeholder="Type a message..."
              value={msgText}
              onChange={(e) => setMsgText(e.target.value)}
            />
            <motion.button
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={sendingMsg}
              className="bg-blue-600 text-white px-3 py-2 rounded"
            >
              {sendingMsg ? "Sending..." : "Send"}
            </motion.button>
          </form>
        </>
      )}
    </motion.div>
  );
}
