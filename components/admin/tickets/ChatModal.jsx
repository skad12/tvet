// // components/tickets/ChatModal.jsx
// "use client";

// import { useEffect, useState, useCallback } from "react";
// import { motion, AnimatePresence } from "framer-motion";
// import { FiX, FiPaperclip, FiSmile, FiSend } from "react-icons/fi";

// /**
//  * ChatModal
//  * props:
//  *  - ticket: ticket object (may include .messages array, .email, .categoryTitle, id, etc)
//  *  - open: boolean
//  *  - onClose: fn
//  *  - onOpenUser: fn(ticket)
//  *  - onMessageAdded?: optional fn(newMessage, ticket)  // will be called when a message is sent
//  */
// export default function ChatModal({
//   ticket,
//   open,
//   onClose,
//   onOpenUser,
//   onMessageAdded,
// }) {
//   // always start with an empty array (avoid undefined)
//   const [messages, setMessages] = useState([]);
//   const [text, setText] = useState("");
//   const [sending, setSending] = useState(false);

//   // Keep messages in sync when the ticket changes.
//   // Copy the array (so we don't accidentally mutate parent's data).
//   useEffect(() => {
//     if (ticket && Array.isArray(ticket.messages)) {
//       setMessages([...ticket.messages]);
//     } else {
//       setMessages([]);
//     }
//     // reset input when ticket changes
//     setText("");
//   }, [ticket]);

//   // Escape key handler (stable reference)
//   const handleKeyDown = useCallback(
//     (e) => {
//       if (e.key === "Escape") {
//         onClose?.();
//       }
//     },
//     [onClose]
//   );

//   useEffect(() => {
//     if (!open) return;
//     window.addEventListener("keydown", handleKeyDown);
//     return () => window.removeEventListener("keydown", handleKeyDown);
//   }, [open, handleKeyDown]);

//   // If not open, render AnimatePresence with no child (allows exit animation if needed)
//   // but we simply early-return null to keep behaviour identical to before.
//   // However using AnimatePresence below ensures correct mounting/unmounting for motion children.
//   if (!open) return null;

//   const handleSend = async (e) => {
//     e?.preventDefault();
//     const body = text?.trim();
//     if (!body) return;

//     setSending(true);

//     const newMsg = {
//       id: `m-${Date.now()}`,
//       from: "You",
//       text: body,
//       at: new Date().toISOString(),
//     };

//     // append locally
//     setMessages((prev) => [...prev, newMsg]);

//     // notify parent (optional) so parent can persist to API or update ticket list
//     try {
//       if (typeof onMessageAdded === "function") {
//         // parent may return a promise - but we don't block UI on it
//         onMessageAdded(newMsg, ticket);
//       }
//     } catch (err) {
//       // swallow errors from parent callback
//       console.warn("onMessageAdded threw:", err);
//     }

//     setText("");
//     // simulated send delay
//     setTimeout(() => setSending(false), 350);
//   };

//   return (
//     <AnimatePresence>
//       <motion.div
//         key={`chat-modal-${ticket?.id ?? "no-ticket"}`}
//         initial={{ opacity: 0 }}
//         animate={{ opacity: 1 }}
//         exit={{ opacity: 0 }}
//         className="fixed inset-0 z-60 flex items-center justify-center"
//         aria-modal="true"
//         role="dialog"
//       >
//         {/* backdrop */}
//         <motion.div
//           initial={{ opacity: 0 }}
//           animate={{ opacity: 0.5 }}
//           exit={{ opacity: 0 }}
//           onClick={onClose}
//           className="absolute inset-0 bg-black/40"
//         />

//         {/* modal container */}
//         <motion.div
//           initial={{ y: 20, opacity: 0, scale: 0.98 }}
//           animate={{ y: 0, opacity: 1, scale: 1 }}
//           exit={{ y: 8, opacity: 0, scale: 0.98 }}
//           transition={{ duration: 0.22 }}
//           className="relative w-full max-w-4xl h-[80vh] bg-white rounded-lg border border-slate-200 shadow-xl flex"
//         >
//           {/* Left: conversation */}
//           <div className="flex-1 flex flex-col">
//             <header className="flex items-center justify-between px-6 py-4 border-b border-slate-400">
//               <div className="flex items-center gap-4">
//                 <button
//                   onClick={() => onOpenUser?.(ticket)}
//                   className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-medium text-slate-700"
//                   title="View user details"
//                   aria-label="View user details"
//                 >
//                   {String(ticket?.email ?? "U")
//                     .slice(0, 2)
//                     .toUpperCase()}
//                 </button>

//                 <div>
//                   <div className="font-medium text-slate-800">
//                     {ticket?.email ?? "Unknown"}
//                   </div>
//                   <div className="text-xs text-slate-500">
//                     {ticket?.categoryTitle ?? ""}
//                   </div>
//                 </div>
//               </div>

//               <div className="flex items-center gap-3">
//                 <span className=" bg-green-200 px-2 py-1 rounded-full text-xs text-slate-500">
//                   AI Assisted
//                 </span>
//                 <button
//                   onClick={onClose}
//                   className="p-2 rounded hover:bg-slate-100"
//                   aria-label="Close chat"
//                 >
//                   <FiX />
//                 </button>
//               </div>
//             </header>

//             {/* messages */}
//             <div className="flex-1 overflow-auto p-6 space-y-4">
//               <div className="bg-blue-600 text-white rounded p-3 text-sm max-w-prose">
//                 Support — Welcome to HelpDesk! Your ticket is being routed, an
//                 agent will join shortly.
//               </div>

//               {messages.length === 0 && (
//                 <div className="text-sm text-slate-400">No messages yet.</div>
//               )}

//               {messages.map((m) => (
//                 <motion.div
//                   key={m.id ?? m.at}
//                   initial={{ opacity: 0, y: 6 }}
//                   animate={{ opacity: 1, y: 0 }}
//                   className={`max-w-[80%] ${
//                     m.from === "You" ? "self-end" : "self-start"
//                   }`}
//                 >
//                   <div
//                     className={`${
//                       m.from === "You" ? "bg-slate-100" : "bg-white border"
//                     } p-3 rounded-lg`}
//                   >
//                     <div className="text-sm text-slate-800">{m.text}</div>
//                     <div className="text-xs text-slate-400 mt-1">
//                       {new Date(m.at).toLocaleString()}
//                     </div>
//                   </div>
//                 </motion.div>
//               ))}
//             </div>

//             {/* input */}
//             <form
//               onSubmit={handleSend}
//               className="px-4 py-3 border-t border-slate-400 flex items-center gap-3"
//             >
//               <button
//                 type="button"
//                 className="p-2 rounded-md text-slate-500 hover:bg-slate-100"
//                 title="Attach file"
//               >
//                 <FiPaperclip />
//               </button>

//               <button
//                 type="button"
//                 className="p-2 rounded-md text-slate-500 hover:bg-slate-100"
//                 title="Emoji"
//               >
//                 <FiSmile />
//               </button>

//               <input
//                 className="flex-1 border border-slate-400 rounded-full px-4 py-2 outline-none focus:ring-2 focus:ring-blue-200"
//                 placeholder="Type your message..."
//                 value={text}
//                 onChange={(e) => setText(e.target.value)}
//                 aria-label="Message input"
//               />

//               <button
//                 type="submit"
//                 disabled={sending}
//                 className="bg-blue-600 text-white p-2 rounded-full w-10 h-10 flex items-center justify-center"
//                 aria-label="Send message"
//               >
//                 <FiSend />
//               </button>
//             </form>
//           </div>

//           {/* Right: user details (compact) */}
//           <aside className="w-80 border-l border-slate-400 p-6 overflow-auto">
//             <div className="flex items-center gap-4 mb-4">
//               <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center font-medium text-slate-700">
//                 {String(ticket?.email ?? "U")
//                   .slice(0, 2)
//                   .toUpperCase()}
//               </div>
//               <div>
//                 <div className="font-semibold text-slate-800">
//                   {ticket?.email?.split?.("@")?.[0] ?? "User"}
//                 </div>
//                 <div className="text-xs text-slate-500">
//                   Student ID: TVET-2024-1523
//                 </div>
//               </div>
//             </div>

//             <div className="text-sm text-slate-600 space-y-4">
//               <div>
//                 <div className="text-xs text-slate-500">Contact</div>
//                 <div className="mt-2">{ticket?.email ?? "—"}</div>
//                 <div className="mt-1">+234 803 456 7890</div>
//               </div>

//               <div>
//                 <div className="text-xs text-slate-500">Enrollment</div>
//                 <div className="mt-2 font-medium">Welding Technology</div>
//                 <div className="text-xs text-slate-400">
//                   Enrolled since January 2024
//                 </div>
//               </div>
//             </div>
//           </aside>
//         </motion.div>
//       </motion.div>
//     </AnimatePresence>
//   );
// }

// components/tickets/ChatModal.jsx
"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiX, FiPaperclip, FiSmile, FiSend } from "react-icons/fi";
import { useAuth } from "@/context/AuthContext";
import {
  DEFAULT_CHAT_POLL_MS,
  digestMessages,
  fetchTicketChats,
  normalizeChatEntries,
  postTicketMessage,
} from "@/lib/chatClient";

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
  ticket = {},
  open = false,
  onClose = () => {},
  onOpenUser = () => {},
  onMessageAdded,
}) {
  const { token, user } = useAuth?.() ?? {};
  const currentUserId =
    user?.app_user_id ??
    user?.appUserId ??
    user?.user_id ??
    user?.userId ??
    user?.id ??
    user?.uid ??
    user?.pk ??
    null;

  const CURRENT_ROLE = "agent";
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const digestRef = useRef("");
  const controllerRef = useRef(null);
  const pollRef = useRef(null);

  const ticketId = ticket?.id ?? null;

  useEffect(() => {
    if (ticket && Array.isArray(ticket.messages)) {
      const fallback = normalizeChatEntries(ticket.messages, {
        ticketId,
      });
      setMessages(fallback);
    } else {
      setMessages([]);
    }
    setText("");
    setError(null);
  }, [ticket, ticketId]);

  const handleKeyDown = useCallback(
    (e) => {
      if (e?.key === "Escape") {
        try {
          onClose?.();
        } catch (err) {
          console.warn("onClose threw:", err);
        }
      }
    },
    [onClose]
  );

  useEffect(() => {
    if (!open) return;
    if (typeof window === "undefined") return;

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, handleKeyDown]);

  useEffect(() => {
    if (!open || !ticketId) {
      return () => {};
    }

    let mounted = true;

    const loadChats = async (initial = false) => {
      if (!ticketId) return;
      controllerRef.current?.abort();
      controllerRef.current = new AbortController();

      try {
        if (initial) setLoading(true);
        const data = await fetchTicketChats(ticketId, {
          token,
          signal: controllerRef.current.signal,
        });
        if (!mounted) return;
        const mapped = normalizeChatEntries(data, { ticketId });
        const digest = digestMessages(mapped);
        if (digest !== digestRef.current) {
          digestRef.current = digest;
          setMessages(mapped);
        }
        setError(null);
      } catch (err) {
        if (err.name === "AbortError") return;
        console.error("Failed to load chats:", err);
        setError(err.message || "Failed to load messages");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadChats(true);
    pollRef.current = setInterval(() => loadChats(false), DEFAULT_CHAT_POLL_MS);

    return () => {
      mounted = false;
      controllerRef.current?.abort();
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [open, ticketId, token]);

  const handleSend = async (e) => {
    try {
      e?.preventDefault?.();
    } catch (err) {
      /* ignore */
    }

    const body = String(text || "").trim();
    if (!body || !ticketId) return;

    setSending(true);
    setError(null);

    const optimisticMsg = {
      id: `local-${Date.now()}`,
      text: body,
      at: new Date().toISOString(),
      role: CURRENT_ROLE,
      status: "pending",
    };
    setMessages((prev) => [...prev, optimisticMsg]);

    try {
      await postTicketMessage({
        ticketId,
        message: body,
        appUserId: currentUserId ?? "",
        token,
      });
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === optimisticMsg.id ? { ...msg, status: "sent" } : msg
        )
      );
      digestRef.current = "";
      if (typeof onMessageAdded === "function") {
        onMessageAdded(
          { ...optimisticMsg, status: "sent", role: CURRENT_ROLE },
          ticket
        );
      }
      setText("");
    } catch (err) {
      console.error("Failed to send message:", err);
      setError(err.message || "Failed to send message");
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === optimisticMsg.id ? { ...msg, status: "failed" } : msg
        )
      );
    } finally {
      setSending(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key={`chat-modal-${ticket?.id ?? "no-ticket"}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center"
          aria-modal="true"
          role="dialog"
        >
          {/* backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              try {
                onClose();
              } catch (err) {
                console.warn("onClose threw:", err);
              }
            }}
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
                    onClick={() => {
                      try {
                        onOpenUser?.(ticket);
                      } catch (err) {
                        console.warn("onOpenUser threw:", err);
                      }
                    }}
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
                    onClick={() => {
                      try {
                        onClose();
                      } catch (err) {
                        console.warn("onClose threw:", err);
                      }
                    }}
                    className="p-2 rounded hover:bg-slate-100"
                    aria-label="Close chat"
                  >
                    <FiX />
                  </button>
                </div>
              </header>

              {/* messages */}
              <div
                className="flex-1 overflow-y-auto p-6 space-y-3 bg-slate-50"
                style={{ maxHeight: "calc(80vh - 200px)", minHeight: "400px" }}
              >
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-blue-600 text-white rounded-lg p-3 text-sm shadow-sm"
                >
                  Support — Welcome to HelpDesk! Your ticket is being routed, an
                  agent will join shortly.
                </motion.div>

                {loading && (
                  <div className="flex items-center justify-center p-6">
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                      <div className="w-4 h-4 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
                      <span>Loading messages…</span>
                    </div>
                  </div>
                )}

                {messages.length === 0 && !loading && (
                  <div className="text-sm text-slate-400 text-center py-8">
                    No messages yet.
                  </div>
                )}

                {messages.map((m, idx) => {
                  const isAgent = m.role === "agent" || m.role === CURRENT_ROLE;
                  return (
                    <motion.div
                      key={m.id ?? idx}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex ${
                        isAgent ? "justify-end" : "justify-start"
                      }`}
                    >
                      <div
                        className={`p-3 rounded-lg max-w-[75%] shadow-sm ${
                          isAgent
                            ? "bg-gray-200 text-gray-800 rounded-tr-none"
                            : "bg-blue-600 text-white rounded-tl-none"
                        }`}
                      >
                        <div className="text-sm whitespace-pre-wrap break-words">
                          {m.text}
                        </div>
                        <div
                          className={`text-xs mt-1.5 flex items-center gap-2 ${
                            isAgent ? "text-gray-600" : "text-blue-100"
                          }`}
                        >
                          <span>{new Date(m.at).toLocaleString()}</span>
                          {m.status === "failed" && (
                            <span className="text-red-600">• Failed</span>
                          )}
                          {m.status === "pending" && (
                            <span className="text-amber-600">• Sending…</span>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
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
                  disabled={sending}
                />

                <button
                  type="submit"
                  disabled={sending}
                  className="bg-blue-600 text-white p-2 rounded-full w-10 h-10 flex items-center justify-center"
                  aria-label="Send message"
                >
                  {sending ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <FiSend />
                  )}
                </button>
              </form>

              {error && (
                <div className="px-6 pb-3 text-xs text-red-600">{error}</div>
              )}
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
      )}
    </AnimatePresence>
  );
}
