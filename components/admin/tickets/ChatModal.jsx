// components/tickets/ChatModal.jsx
"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiX, FiPaperclip, FiSmile, FiSend } from "react-icons/fi";

/**
 * ChatModal
 * props:
 *  - ticket: ticket object (may include .messages array, .email, .categoryTitle, id, etc)
 *  - open: boolean
 *  - onClose: fn
 *  - onOpenUser: fn(ticket)
 *  - onMessageAdded?: optional fn(newMessage, ticket)  // will be called when a message is sent
 */
export default function ChatModal({
  ticket,
  open,
  onClose,
  onOpenUser,
  onMessageAdded,
}) {
  // always start with an empty array (avoid undefined)
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  // Keep messages in sync when the ticket changes.
  // Copy the array (so we don't accidentally mutate parent's data).
  useEffect(() => {
    if (ticket && Array.isArray(ticket.messages)) {
      setMessages([...ticket.messages]);
    } else {
      setMessages([]);
    }
    // reset input when ticket changes
    setText("");
  }, [ticket]);

  // Escape key handler (stable reference)
  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === "Escape") {
        onClose?.();
      }
    },
    [onClose]
  );

  useEffect(() => {
    if (!open) return;
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, handleKeyDown]);

  // If not open, render AnimatePresence with no child (allows exit animation if needed)
  // but we simply early-return null to keep behaviour identical to before.
  // However using AnimatePresence below ensures correct mounting/unmounting for motion children.
  if (!open) return null;

  const handleSend = async (e) => {
    e?.preventDefault();
    const body = text?.trim();
    if (!body) return;

    setSending(true);

    const newMsg = {
      id: `m-${Date.now()}`,
      from: "You",
      text: body,
      at: new Date().toISOString(),
    };

    // append locally
    setMessages((prev) => [...prev, newMsg]);

    // notify parent (optional) so parent can persist to API or update ticket list
    try {
      if (typeof onMessageAdded === "function") {
        // parent may return a promise - but we don't block UI on it
        onMessageAdded(newMsg, ticket);
      }
    } catch (err) {
      // swallow errors from parent callback
      console.warn("onMessageAdded threw:", err);
    }

    setText("");
    // simulated send delay
    setTimeout(() => setSending(false), 350);
  };

  return (
    <AnimatePresence>
      <motion.div
        key={`chat-modal-${ticket?.id ?? "no-ticket"}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-60 flex items-center justify-center"
        aria-modal="true"
        role="dialog"
      >
        {/* backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.5 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/40"
        />

        {/* modal container */}
        <motion.div
          initial={{ y: 20, opacity: 0, scale: 0.98 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 8, opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.22 }}
          className="relative w-full max-w-4xl h-[80vh] bg-white rounded-lg border border-slate-200 shadow-xl flex"
        >
          {/* Left: conversation */}
          <div className="flex-1 flex flex-col">
            <header className="flex items-center justify-between px-6 py-4 border-b border-slate-400">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => onOpenUser?.(ticket)}
                  className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-medium text-slate-700"
                  title="View user details"
                  aria-label="View user details"
                >
                  {String(ticket?.email ?? "U")
                    .slice(0, 2)
                    .toUpperCase()}
                </button>

                <div>
                  <div className="font-medium text-slate-800">
                    {ticket?.email ?? "Unknown"}
                  </div>
                  <div className="text-xs text-slate-500">
                    {ticket?.categoryTitle ?? ""}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className=" bg-green-200 px-2 py-1 rounded-full text-xs text-slate-500">
                  AI Assisted
                </span>
                <button
                  onClick={onClose}
                  className="p-2 rounded hover:bg-slate-100"
                  aria-label="Close chat"
                >
                  <FiX />
                </button>
              </div>
            </header>

            {/* messages */}
            <div className="flex-1 overflow-auto p-6 space-y-4">
              <div className="bg-blue-600 text-white rounded p-3 text-sm max-w-prose">
                Support — Welcome to HelpDesk! Your ticket is being routed, an
                agent will join shortly.
              </div>

              {messages.length === 0 && (
                <div className="text-sm text-slate-400">No messages yet.</div>
              )}

              {messages.map((m) => (
                <motion.div
                  key={m.id ?? m.at}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`max-w-[80%] ${
                    m.from === "You" ? "self-end" : "self-start"
                  }`}
                >
                  <div
                    className={`${
                      m.from === "You" ? "bg-slate-100" : "bg-white border"
                    } p-3 rounded-lg`}
                  >
                    <div className="text-sm text-slate-800">{m.text}</div>
                    <div className="text-xs text-slate-400 mt-1">
                      {new Date(m.at).toLocaleString()}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* input */}
            <form
              onSubmit={handleSend}
              className="px-4 py-3 border-t border-slate-400 flex items-center gap-3"
            >
              <button
                type="button"
                className="p-2 rounded-md text-slate-500 hover:bg-slate-100"
                title="Attach file"
              >
                <FiPaperclip />
              </button>

              <button
                type="button"
                className="p-2 rounded-md text-slate-500 hover:bg-slate-100"
                title="Emoji"
              >
                <FiSmile />
              </button>

              <input
                className="flex-1 border border-slate-400 rounded-full px-4 py-2 outline-none focus:ring-2 focus:ring-blue-200"
                placeholder="Type your message..."
                value={text}
                onChange={(e) => setText(e.target.value)}
                aria-label="Message input"
              />

              <button
                type="submit"
                disabled={sending}
                className="bg-blue-600 text-white p-2 rounded-full w-10 h-10 flex items-center justify-center"
                aria-label="Send message"
              >
                <FiSend />
              </button>
            </form>
          </div>

          {/* Right: user details (compact) */}
          <aside className="w-80 border-l border-slate-400 p-6 overflow-auto">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center font-medium text-slate-700">
                {String(ticket?.email ?? "U")
                  .slice(0, 2)
                  .toUpperCase()}
              </div>
              <div>
                <div className="font-semibold text-slate-800">
                  {ticket?.email?.split?.("@")?.[0] ?? "User"}
                </div>
                <div className="text-xs text-slate-500">
                  Student ID: TVET-2024-1523
                </div>
              </div>
            </div>

            <div className="text-sm text-slate-600 space-y-4">
              <div>
                <div className="text-xs text-slate-500">Contact</div>
                <div className="mt-2">{ticket?.email ?? "—"}</div>
                <div className="mt-1">+234 803 456 7890</div>
              </div>

              <div>
                <div className="text-xs text-slate-500">Enrollment</div>
                <div className="mt-2 font-medium">Welding Technology</div>
                <div className="text-xs text-slate-400">
                  Enrolled since January 2024
                </div>
              </div>
            </div>
          </aside>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
