// "use client";

// import { motion, AnimatePresence } from "framer-motion";
// import { format } from "date-fns";
// import React, { useCallback, useEffect, useRef, useState } from "react";
// import { useAuth } from "@/context/AuthContext";
// import {
//   DEFAULT_CHAT_POLL_MS,
//   digestMessages,
//   fetchTicketChats,
//   normalizeChatEntries,
//   postTicketMessage,
// } from "@/lib/chatClient";
// import { useUsersDirectory } from "@/hooks/useUsersDirectory";

// export default function ChatBox({ selected, userEmail: propUserEmail }) {
//   const { token, user } = useAuth();
//   const userEmail = propUserEmail ?? user?.email ?? user?.username ?? "me";
//   const { users: directory } = useUsersDirectory({ enabled: true });

//   const appUserId =
//     user?.app_user_id ??
//     user?.appUserId ??
//     user?.user_id ??
//     user?.id ??
//     user?.uid ??
//     user?.pk ??
//     null;

//   const [messages, setMessages] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [sending, setSending] = useState(false);
//   const [msgText, setMsgText] = useState("");
//   const [error, setError] = useState(null);
//   const [serverResponseSnippet, setServerResponseSnippet] = useState(null);
//   const [showServerResponse, setShowServerResponse] = useState(false);

//   const containerRef = useRef(null);

//   function scrollToBottom() {
//     try {
//       const el = containerRef.current;
//       if (!el) return;
//       el.scrollTop = el.scrollHeight;
//     } catch (e) {}
//   }

//   const digestRef = useRef("");
//   const pollTimerRef = useRef(null);
//   const controllerRef = useRef(null);
//   const CURRENT_ROLE = "customer";

//   const fetchChats = useCallback(
//     async ({ showLoading = false } = {}) => {
//       if (!selected?.id) return;

//       // abort previous in-flight request (if any)
//       try {
//         controllerRef.current?.abort();
//       } catch (e) {
//         // abort should be safe, but guard just in case
//       }

//       const abortController = new AbortController();
//       controllerRef.current = abortController;

//       try {
//         if (showLoading) setLoading(true);
//         const data = await fetchTicketChats(selected.id, {
//           token,
//           signal: abortController.signal,
//         });
//         const mapped = normalizeChatEntries(data, {
//           ticketId: selected.id,
//         });
//         const digest = digestMessages(mapped);
//         if (digest !== digestRef.current) {
//           digestRef.current = digest;
//           setMessages(mapped);
//           requestAnimationFrame(scrollToBottom);
//         }
//         setError(null);
//       } catch (err) {
//         // Treat any form of cancellation/abort as non-fatal and ignore it.
//         const isAbort =
//           err?.name === "AbortError" ||
//           err?.name === "CanceledError" || // Axios v1.5+ / node-fetch style
//           err?.code === "ERR_CANCELED" || // axios/node-style code
//           (typeof err?.message === "string" &&
//             err.message.toLowerCase().includes("cancel")); // fallback text match

//         if (isAbort) {
//           // silently ignore canceled requests — expected when we abort previous fetches
//           return;
//         }

//         console.error("Failed to load chats:", err);
//         setError(err.message || "Failed to load chats");
//       } finally {
//         if (showLoading) setLoading(false);
//       }
//     },
//     [selected?.id, token]
//   );

//   useEffect(() => {
//     digestRef.current = "";
//   }, [selected?.id]);

//   useEffect(() => {
//     if (!selected?.id) {
//       setMessages([]);
//       return () => {};
//     }

//     fetchChats({ showLoading: true });
//     pollTimerRef.current = setInterval(
//       () => fetchChats(),
//       DEFAULT_CHAT_POLL_MS
//     );

//     return () => {
//       controllerRef.current?.abort();
//       if (pollTimerRef.current) clearInterval(pollTimerRef.current);
//     };
//   }, [selected?.id, fetchChats]);

//   useEffect(() => {
//     scrollToBottom();
//   }, [messages.length]);

//   async function sendMessage(e) {
//     if (e && e.preventDefault) e.preventDefault();
//     setError(null);
//     setServerResponseSnippet(null);

//     const text = (msgText || "").trim();
//     if (!text || !selected?.id) return;

//     if (!appUserId) {
//       console.warn("[ChatBox] app_user_id missing; backend may require it.");
//     }

//     const ticket_id = selected.id;
//     const tempId = `tmp-${Date.now()}`;

//     const pendingMsg = {
//       id: tempId,
//       text,
//       at: new Date().toISOString(),
//       role: CURRENT_ROLE,
//       from: appUserId ?? userEmail,
//       status: "pending",
//     };
//     setMessages((s) => [...s, pendingMsg]);
//     setMsgText("");
//     setSending(true);

//     try {
//       await postTicketMessage({
//         ticketId: ticket_id,
//         message: text,
//         appUserId: appUserId ?? "",
//         email: userEmail,
//         token,
//         useEmailEndpoint: true, // Use email-based endpoint for customers
//       });
//       setMessages((s) =>
//         s.map((m) => (m.id === tempId ? { ...m, status: "sent" } : m))
//       );
//       digestRef.current = "";
//       fetchChats();
//       requestAnimationFrame(scrollToBottom);
//     } catch (err) {
//       console.error("Failed to send message:", err);
//       let snippet = null;
//       if (err?.isAxiosError && err.response) {
//         snippet =
//           typeof err.response.data === "string"
//             ? err.response.data
//             : JSON.stringify(err.response.data, null, 2);
//       } else if (err?.response) {
//         snippet =
//           typeof err.response.data === "string"
//             ? err.response.data
//             : JSON.stringify(err.response.data, null, 2);
//       } else {
//         snippet = err.message ?? String(err);
//       }
//       setServerResponseSnippet(snippet?.slice?.(0, 5000) ?? String(snippet));
//       setError(
//         `Failed to send message. Server returned error (see console or "Show response").`
//       );
//       setMessages((s) =>
//         s.map((m) => (m.id === tempId ? { ...m, status: "failed" } : m))
//       );
//     } finally {
//       setSending(false);
//     }
//   }

//   async function retryMessage(msg) {
//     if (!msg || msg.status !== "failed") return;
//     setMessages((s) =>
//       s.map((m) => (m.id === msg.id ? { ...m, status: "pending" } : m))
//     );
//     setError(null);
//     setServerResponseSnippet(null);

//     try {
//       await postTicketMessage({
//         ticketId: selected.id,
//         message: msg.text,
//         appUserId: appUserId ?? "",
//         email: userEmail,
//         token,
//         useEmailEndpoint: true, // Use email-based endpoint for customers
//       });
//       setMessages((s) =>
//         s.map((m) =>
//           m.id === msg.id ? { ...m, status: "sent", role: CURRENT_ROLE } : m
//         )
//       );
//       digestRef.current = "";
//       fetchChats();
//       requestAnimationFrame(scrollToBottom);
//     } catch (err) {
//       console.error("Retry failed:", err);
//       let snippet = null;
//       if (err?.response)
//         snippet =
//           typeof err.response.data === "string"
//             ? err.response.data
//             : JSON.stringify(err.response.data, null, 2);
//       setServerResponseSnippet(snippet?.slice?.(0, 5000) ?? String(snippet));
//       setError("Retry failed. See server response.");
//       setMessages((s) =>
//         s.map((m) => (m.id === msg.id ? { ...m, status: "failed" } : m))
//       );
//     }
//   }

//   const assignedAgentId =
//     selected?.assigned_to_id ??
//     selected?.assigned_to ??
//     selected?.agent_id ??
//     selected?.agentId ??
//     null;
//   const assignedAgent =
//     directory.find(
//       (person) => person?.id && String(person.id) === String(assignedAgentId)
//     ) ?? null;
//   const assignedAgentLabel =
//     assignedAgent?.name && assignedAgent.name !== "null"
//       ? assignedAgent.name
//       : assignedAgent?.username ??
//         assignedAgent?.email ??
//         selected?.assigned_to_name ??
//         "Unassigned";

//   // --- New: normalize status and pick label (supports selected.ticket_status === "Resolved")
//   const rawStatus =
//     selected?.ticket_status ?? selected?.status ?? selected?.state ?? null;

//   const normStatus = rawStatus ? String(rawStatus).toLowerCase() : null;

//   const statusLabel = rawStatus
//     ? // If it's a string and looks like it's already capitalized properly, keep it. Otherwise capitalize first letter.
//       typeof rawStatus === "string" && /^[A-Z]/.test(rawStatus)
//       ? rawStatus
//       : String(rawStatus).charAt(0).toUpperCase() + String(rawStatus).slice(1)
//     : "Active";

//   return (
//     <motion.div
//       layout
//       data-chat-box
//       className="lg:col-span-1 bg-white rounded-lg shadow-sm p-4 md:p-6 flex flex-col h-full min-h-[500px] md:min-h-[600px]"
//     >
//       <div className="mb-3">
//         <h3 className="font-medium text-slate-800">Conversation</h3>
//         <p className="text-xs text-slate-500">Selected ticket chat & replies</p>
//       </div>

//       {!selected ? (
//         <div className="flex-1 flex items-center justify-center p-6 text-sm text-slate-500 text-center">
//           <div>
//             <div className="text-4xl mb-2">💬</div>
//             <p className="font-medium">No ticket selected</p>
//             <p className="text-xs mt-1">
//               Select a ticket from the list to start chatting
//             </p>
//           </div>
//         </div>
//       ) : (
//         <>
//           <motion.div
//             layout
//             className="border border-slate-200 rounded-lg p-3 mb-4 bg-slate-50"
//           >
//             <div className="text-sm font-semibold text-slate-800 mb-2 uppercase">
//               {selected.subject ||
//                 selected.category ||
//                 selected.categoryTitle ||
//                 "No Subject"}
//             </div>
//             <div className="flex flex-wrap items-center gap- text-xs">
//               <div>{}</div>
//               {(rawStatus || rawStatus === null) && (
//                 <>
//                   <span
//                     className={`px-2 py-0.5 rounded-full text-xs font-medium ${
//                       normStatus === "resolved"
//                         ? "bg-emerald-100 text-emerald-700"
//                         : normStatus === "pending" || normStatus === "waiting"
//                         ? "bg-amber-100 text-amber-700"
//                         : "bg-blue-100 text-blue-700"
//                     }`}
//                   >
//                     {statusLabel}
//                   </span>
//                 </>
//               )}
//             </div>
//           </motion.div>

//           <div
//             ref={containerRef}
//             className="flex-1 overflow-y-auto mb-4 space-y-1 p-4 bg-slate-50 rounded-lg border border-slate-200"
//             style={{ maxHeight: "500px", minHeight: "400px" }}
//           >
//             <motion.div
//               initial={{ opacity: 0, y: 6 }}
//               animate={{ opacity: 1, y: 0 }}
//               className="bg-blue-600 text-white rounded-lg p-3 text-sm shadow-sm"
//             >
//               Support — Welcome to HelpDesk! Your ticket is being routed, an
//               agent will join shortly.
//             </motion.div>

//             <AnimatePresence initial={false}>
//               {loading ? (
//                 <motion.div
//                   key="loading"
//                   className="flex items-center justify-center p-6"
//                   initial={{ opacity: 0 }}
//                   animate={{ opacity: 1 }}
//                   exit={{ opacity: 0 }}
//                 >
//                   <div className="flex items-center gap-2 text-sm text-slate-500">
//                     <div className="w-4 h-4 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
//                     <span>Loading messages…</span>
//                   </div>
//                 </motion.div>
//               ) : null}

//               {messages.map((m, idx) => {
//                 const isCustomer =
//                   m.role === "customer" || m.role === CURRENT_ROLE;
//                 const prevMessage = idx > 0 ? messages[idx - 1] : null;
//                 const isSameSender =
//                   prevMessage &&
//                   ((isCustomer &&
//                     (prevMessage.role === "customer" ||
//                       prevMessage.role === CURRENT_ROLE)) ||
//                     (!isCustomer &&
//                       prevMessage.role !== "customer" &&
//                       prevMessage.role !== CURRENT_ROLE));
//                 return (
//                   <motion.div
//                     key={m.id}
//                     variants={{
//                       hidden: { opacity: 0, y: 6 },
//                       visible: { opacity: 1, y: 0 },
//                       exit: { opacity: 0, y: -6 },
//                     }}
//                     initial="hidden"
//                     animate="visible"
//                     exit="exit"
//                     className={`flex ${
//                       isCustomer ? "justify-end" : "justify-start"
//                     } ${isSameSender ? "mt-0.5" : "mt-2"}`}
//                   >
//                     <div
//                       className={`p-3 rounded-lg max-w-[75%] shadow-sm ${
//                         isCustomer
//                           ? "bg-blue-600 text-white rounded-tr-none"
//                           : "bg-gray-200 text-gray-800 rounded-tl-none"
//                       }`}
//                     >
//                       <div className="text-sm whitespace-pre-wrap break-words">
//                         {m.text}
//                       </div>
//                       <div
//                         className={`text-xs mt-1.5 flex items-center gap-2 ${
//                           isCustomer ? "text-blue-100" : "text-gray-600"
//                         }`}
//                       >
//                         <span>{format(new Date(m.at), "h:mm a")}</span>
//                         {m.status === "pending" && (
//                           <span className="text-xs text-amber-400">
//                             • Sending…
//                           </span>
//                         )}
//                         {m.status === "failed" && (
//                           <>
//                             <span className="text-xs text-red-300">
//                               • Failed
//                             </span>
//                             <button
//                               onClick={() => retryMessage(m)}
//                               className="ml-2 text-xs underline hover:opacity-80"
//                             >
//                               Retry
//                             </button>
//                           </>
//                         )}
//                       </div>
//                     </div>
//                   </motion.div>
//                 );
//               })}
//             </AnimatePresence>

//             {messages.length === 0 && !loading && (
//               <div className="text-sm text-slate-400 text-center py-8">
//                 No messages yet.
//               </div>
//             )}
//           </div>

//           <form
//             onSubmit={sendMessage}
//             className="flex gap-2 items-end mt-2 pt-2 border-t border-slate-200"
//           >
//             <div className="flex-1">
//               <textarea
//                 className="w-full border border-slate-300 px-3 py-2 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                 placeholder="Type a message..."
//                 value={msgText}
//                 onChange={(e) => {
//                   setMsgText(e.target.value);
//                   e.target.style.height = "auto";
//                   e.target.style.height = `${Math.min(
//                     e.target.scrollHeight,
//                     120
//                   )}px`;
//                 }}
//                 disabled={sending}
//                 rows={1}
//                 onKeyDown={(e) => {
//                   if (e.key === "Enter" && !e.shiftKey) {
//                     e.preventDefault();
//                     sendMessage(e);
//                   }
//                 }}
//               />
//             </div>
//             <motion.button
//               whileTap={{ scale: 0.95 }}
//               type="submit"
//               disabled={sending || !msgText.trim()}
//               className="bg-blue-600 text-white px-4 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0 h-[42px]"
//             >
//               {sending ? (
//                 <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
//               ) : (
//                 "Send"
//               )}
//             </motion.button>
//           </form>

//           {error && <div className="mt-2 text-xs text-red-600">{error}</div>}

//           {serverResponseSnippet && (
//             <div className="mt-2 text-xs">
//               <button
//                 onClick={() => setShowServerResponse((s) => !s)}
//                 className="underline text-blue-600"
//               >
//                 {showServerResponse
//                   ? "Hide server response"
//                   : "Show server response (debug)"}
//               </button>
//               {showServerResponse && (
//                 <pre className="mt-2 p-2 bg-slate-100 rounded overflow-auto text-xs max-h-40">
//                   {serverResponseSnippet}
//                 </pre>
//               )}
//             </div>
//           )}
//         </>
//       )}
//     </motion.div>
//   );
// }

"use client";

import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  DEFAULT_CHAT_POLL_MS,
  digestMessages,
  fetchTicketChats,
  normalizeChatEntries,
  // postTicketMessage, // no longer used for customer add-message; using direct API call
} from "@/lib/chatClient";
import { useUsersDirectory } from "@/hooks/useUsersDirectory";

let api = null;
try {
  // require to avoid SSR import issues
  api = require("@/lib/axios").default;
} catch (e) {
  api = null;
}

export default function ChatBox({ selected, userEmail: propUserEmail }) {
  const { token, user } = useAuth();
  const userEmail = propUserEmail ?? user?.email ?? user?.username ?? "me";
  const { users: directory } = useUsersDirectory({ enabled: true });

  const appUserId =
    user?.app_user_id ??
    user?.appUserId ??
    user?.user_id ??
    user?.id ??
    user?.uid ??
    user?.pk ??
    null;

  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [msgText, setMsgText] = useState("");
  const [error, setError] = useState(null);
  const [serverResponseSnippet, setServerResponseSnippet] = useState(null);
  const [showServerResponse, setShowServerResponse] = useState(false);

  const containerRef = useRef(null);

  function scrollToBottom() {
    try {
      const el = containerRef.current;
      if (!el) return;
      el.scrollTop = el.scrollHeight;
    } catch (e) {}
  }

  const digestRef = useRef("");
  const pollTimerRef = useRef(null);
  const controllerRef = useRef(null);
  const CURRENT_ROLE = "customer";

  const fetchChats = useCallback(
    async ({ showLoading = false } = {}) => {
      if (!selected?.id) return;

      // abort previous in-flight request (if any)
      try {
        controllerRef.current?.abort();
      } catch (e) {
        // ignore
      }
      const abortController = new AbortController();
      controllerRef.current = abortController;

      try {
        if (showLoading) setLoading(true);
        const data = await fetchTicketChats(selected.id, {
          token,
          signal: abortController.signal,
        });
        const mapped = normalizeChatEntries(data, {
          ticketId: selected.id,
        });
        const digest = digestMessages(mapped);
        if (digest !== digestRef.current) {
          digestRef.current = digest;
          setMessages(mapped);
          requestAnimationFrame(scrollToBottom);
        }
        setError(null);
      } catch (err) {
        const isAbort =
          err?.name === "AbortError" ||
          err?.name === "CanceledError" ||
          err?.code === "ERR_CANCELED" ||
          (typeof err?.message === "string" &&
            err.message.toLowerCase().includes("cancel"));

        if (isAbort) return;

        console.error("Failed to load chats:", err);
        setError(err.message || "Failed to load chats");
      } finally {
        if (showLoading) setLoading(false);
      }
    },
    [selected?.id, token]
  );

  useEffect(() => {
    digestRef.current = "";
  }, [selected?.id]);

  useEffect(() => {
    if (!selected?.id) {
      setMessages([]);
      return () => {};
    }

    fetchChats({ showLoading: true });
    pollTimerRef.current = setInterval(
      () => fetchChats(),
      DEFAULT_CHAT_POLL_MS
    );

    return () => {
      controllerRef.current?.abort();
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, [selected?.id, fetchChats]);

  useEffect(() => {
    scrollToBottom();
  }, [messages.length]);

  // --- POST message for customer using email-based endpoint
  async function sendMessage(e) {
    if (e && e.preventDefault) e.preventDefault();
    setError(null);
    setServerResponseSnippet(null);

    const text = (msgText || "").trim();
    if (!text || !selected?.id) return;

    if (!appUserId) {
      console.warn("[ChatBox] app_user_id missing; backend may require it.");
    }

    const ticket_id = selected.id;
    const tempId = `tmp-${Date.now()}`;

    const pendingMsg = {
      id: tempId,
      text,
      at: new Date().toISOString(),
      role: CURRENT_ROLE,
      from: appUserId ?? userEmail,
      status: "pending",
    };
    setMessages((s) => [...s, pendingMsg]);
    setMsgText("");
    setSending(true);

    try {
      // Use the customer email add-message endpoint
      if (!api || typeof api.post !== "function") {
        throw new Error("API client not configured");
      }

      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const body = {
        ticket_id,
        email: userEmail,
        message: text,
      };

      await api.post("/tickets/add-message/email/", body, { headers });

      // mark as sent
      setMessages((s) =>
        s.map((m) => (m.id === tempId ? { ...m, status: "sent" } : m))
      );
      digestRef.current = "";
      await fetchChats();
      requestAnimationFrame(scrollToBottom);
    } catch (err) {
      console.error("Failed to send message:", err);
      let snippet = null;
      if (err?.isAxiosError && err.response) {
        snippet =
          typeof err.response.data === "string"
            ? err.response.data
            : JSON.stringify(err.response.data, null, 2);
      } else if (err?.response) {
        snippet =
          typeof err.response.data === "string"
            ? err.response.data
            : JSON.stringify(err.response.data, null, 2);
      } else {
        snippet = err.message ?? String(err);
      }
      setServerResponseSnippet(snippet?.slice?.(0, 5000) ?? String(snippet));
      setError(
        `Failed to send message. Server returned error (see console or "Show response").`
      );
      setMessages((s) =>
        s.map((m) => (m.id === tempId ? { ...m, status: "failed" } : m))
      );
    } finally {
      setSending(false);
    }
  }

  // Retry uses same endpoint
  async function retryMessage(msg) {
    if (!msg || msg.status !== "failed") return;
    setMessages((s) =>
      s.map((m) => (m.id === msg.id ? { ...m, status: "pending" } : m))
    );
    setError(null);
    setServerResponseSnippet(null);

    try {
      if (!api || typeof api.post !== "function") {
        throw new Error("API client not configured");
      }

      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const body = {
        ticket_id: selected.id,
        email: userEmail,
        message: msg.text,
      };

      await api.post("/tickets/add-message/email/", body, { headers });

      setMessages((s) =>
        s.map((m) =>
          m.id === msg.id ? { ...m, status: "sent", role: CURRENT_ROLE } : m
        )
      );
      digestRef.current = "";
      await fetchChats();
      requestAnimationFrame(scrollToBottom);
    } catch (err) {
      console.error("Retry failed:", err);
      let snippet = null;
      if (err?.response)
        snippet =
          typeof err.response.data === "string"
            ? err.response.data
            : JSON.stringify(err.response.data, null, 2);
      setServerResponseSnippet(snippet?.slice?.(0, 5000) ?? String(snippet));
      setError("Retry failed. See server response.");
      setMessages((s) =>
        s.map((m) => (m.id === msg.id ? { ...m, status: "failed" } : m))
      );
    }
  }

  const assignedAgentId =
    selected?.assigned_to_id ??
    selected?.assigned_to ??
    selected?.agent_id ??
    selected?.agentId ??
    null;
  const assignedAgent =
    directory.find(
      (person) => person?.id && String(person.id) === String(assignedAgentId)
    ) ?? null;
  const assignedAgentLabel =
    assignedAgent?.name && assignedAgent.name !== "null"
      ? assignedAgent.name
      : assignedAgent?.username ??
        assignedAgent?.email ??
        selected?.assigned_to_name ??
        "Unassigned";

  const rawStatus =
    selected?.ticket_status ?? selected?.status ?? selected?.state ?? null;

  const normStatus = rawStatus ? String(rawStatus).toLowerCase() : null;

  const statusLabel = rawStatus
    ? typeof rawStatus === "string" && /^[A-Z]/.test(rawStatus)
      ? rawStatus
      : String(rawStatus).charAt(0).toUpperCase() + String(rawStatus).slice(1)
    : "Active";

  return (
    <motion.div
      layout
      data-chat-box
      className="lg:col-span-1 bg-white rounded-lg shadow-sm p-4 md:p-6 flex flex-col h-full min-h-[500px] md:min-h-[600px]"
    >
      <div className="mb-3">
        <h3 className="font-medium text-slate-800">Conversation</h3>
        <p className="text-xs text-slate-500">Selected ticket chat & replies</p>
      </div>

      {!selected ? (
        <div className="flex-1 flex items-center justify-center p-6 text-sm text-slate-500 text-center">
          <div>
            <div className="text-4xl mb-2">💬</div>
            <p className="font-medium">No ticket selected</p>
            <p className="text-xs mt-1">
              Select a ticket from the list to start chatting
            </p>
          </div>
        </div>
      ) : (
        <>
          <motion.div
            layout
            className="border border-slate-200 rounded-lg p-3 mb-4 bg-slate-50"
          >
            <div className="text-sm font-semibold text-slate-800 mb-2 uppercase">
              {selected.subject ||
                selected.category ||
                selected.categoryTitle ||
                "No Subject"}
            </div>
            <div className="flex flex-wrap items-center gap- text-xs">
              <div>{}</div>
              {(rawStatus || rawStatus === null) && (
                <>
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      normStatus === "resolved"
                        ? "bg-emerald-100 text-emerald-700"
                        : normStatus === "pending" || normStatus === "waiting"
                        ? "bg-amber-100 text-amber-700"
                        : "bg-blue-100 text-blue-700"
                    }`}
                  >
                    {statusLabel}
                  </span>
                </>
              )}
            </div>
          </motion.div>

          <div
            ref={containerRef}
            className="flex-1 overflow-y-auto mb-4 space-y-1 p-4 bg-slate-50 rounded-lg border border-slate-200"
            style={{ maxHeight: "500px", minHeight: "400px" }}
          >
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-blue-600 text-white rounded-lg p-3 text-sm shadow-sm"
            >
              Support — Welcome to HelpDesk! Your ticket is being routed, an
              agent will join shortly.
            </motion.div>

            <AnimatePresence initial={false}>
              {loading ? (
                <motion.div
                  key="loading"
                  className="flex items-center justify-center p-6"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <div className="w-4 h-4 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
                    <span>Loading messages…</span>
                  </div>
                </motion.div>
              ) : null}

              {messages.map((m, idx) => {
                const isCustomer =
                  m.role === "customer" || m.role === CURRENT_ROLE;
                const prevMessage = idx > 0 ? messages[idx - 1] : null;
                const isSameSender =
                  prevMessage &&
                  ((isCustomer &&
                    (prevMessage.role === "customer" ||
                      prevMessage.role === CURRENT_ROLE)) ||
                    (!isCustomer &&
                      prevMessage.role !== "customer" &&
                      prevMessage.role !== CURRENT_ROLE));
                return (
                  <motion.div
                    key={m.id}
                    variants={{
                      hidden: { opacity: 0, y: 6 },
                      visible: { opacity: 1, y: 0 },
                      exit: { opacity: 0, y: -6 },
                    }}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className={`flex ${
                      isCustomer ? "justify-end" : "justify-start"
                    } ${isSameSender ? "mt-0.5" : "mt-2"}`}
                  >
                    <div
                      className={`p-3 rounded-lg max-w-[75%] shadow-sm ${
                        isCustomer
                          ? "bg-blue-600 text-white rounded-tr-none"
                          : "bg-gray-200 text-gray-800 rounded-tl-none"
                      }`}
                    >
                      <div className="text-sm whitespace-pre-wrap break-words">
                        {m.text}
                      </div>
                      <div
                        className={`text-xs mt-1.5 flex items-center gap-2 ${
                          isCustomer ? "text-blue-100" : "text-gray-600"
                        }`}
                      >
                        <span>{format(new Date(m.at), "h:mm a")}</span>
                        {m.status === "pending" && (
                          <span className="text-xs text-amber-400">
                            • Sending…
                          </span>
                        )}
                        {m.status === "failed" && (
                          <>
                            <span className="text-xs text-red-300">
                              • Failed
                            </span>
                            <button
                              onClick={() => retryMessage(m)}
                              className="ml-2 text-xs underline hover:opacity-80"
                            >
                              Retry
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {messages.length === 0 && !loading && (
              <div className="text-sm text-slate-400 text-center py-8">
                No messages yet.
              </div>
            )}
          </div>

          <form
            onSubmit={sendMessage}
            className="flex gap-2 items-end mt-2 pt-2 border-t border-slate-200"
          >
            <div className="flex-1">
              <textarea
                className="w-full border border-slate-300 px-3 py-2 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Type a message..."
                value={msgText}
                onChange={(e) => {
                  setMsgText(e.target.value);
                  e.target.style.height = "auto";
                  e.target.style.height = `${Math.min(
                    e.target.scrollHeight,
                    120
                  )}px`;
                }}
                disabled={sending}
                rows={1}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage(e);
                  }
                }}
              />
            </div>
            <motion.button
              whileTap={{ scale: 0.95 }}
              type="submit"
              disabled={sending || !msgText.trim()}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0 h-[42px]"
            >
              {sending ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                "Send"
              )}
            </motion.button>
          </form>

          {error && <div className="mt-2 text-xs text-red-600">{error}</div>}

          {serverResponseSnippet && (
            <div className="mt-2 text-xs">
              <button
                onClick={() => setShowServerResponse((s) => !s)}
                className="underline text-blue-600"
              >
                {showServerResponse
                  ? "Hide server response"
                  : "Show server response (debug)"}
              </button>
              {showServerResponse && (
                <pre className="mt-2 p-2 bg-slate-100 rounded overflow-auto text-xs max-h-40">
                  {serverResponseSnippet}
                </pre>
              )}
            </div>
          )}
        </>
      )}
    </motion.div>
  );
}
