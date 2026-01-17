
// "use client";

// import { useEffect, useState, useCallback, useRef, useMemo } from "react";
// import { motion, AnimatePresence } from "framer-motion";
// import { FiX, FiPaperclip, FiSmile, FiSend, FiUserPlus } from "react-icons/fi";
// import { useAuth } from "@/context/AuthContext";
// import { useUsersDirectory } from "@/hooks/useUsersDirectory";
// import api from "@/lib/axios";
// import {
//   DEFAULT_CHAT_POLL_MS,
//   digestMessages,
//   fetchTicketChats,
//   normalizeChatEntries,
//   postTicketMessage,
// } from "@/lib/chatClient";

// function normalizeAgentName(agent) {
//   if (agent === null || agent === undefined) return null;
//   if (typeof agent === "string") {
//     const v = agent.trim();
//     if (
//       v === "" ||
//       v.toLowerCase() === "null" ||
//       v.toLowerCase() === "unassigned"
//     )
//       return null;
//     return v;
//   }
//   return String(agent);
// }

// function normalizeStatusValue(statusVal) {
//   if (statusVal === null || statusVal === undefined) return "active";
//   const raw = String(statusVal).toLowerCase().trim();
//   if (raw === "resolved" || raw === "closed" || raw === "completed")
//     return "resolved";
//   if (raw === "pending" || raw === "waiting" || raw === "in_progress")
//     return "pending";
//   if (raw === "active" || raw === "open" || raw === "new") return "active";
//   return raw;
// }

//   // Format date safely; prefer server's created_at_display if given
//   function formatMaybeDate(val, display) {
//     if (display) return display;
//     if (!val) return "—";
//     const dt = new Date(val);
//     if (isValid(dt)) return format(dt, "PPpp");
//     try {
//       return String(val).slice(0, 32);
//     } catch {
//       return "—";
//     }
//   }
//   const time = ticket?.created_at ?? "";

// export default function ChatModal({
//   ticket = {},
//   open = false,
//   onClose = () => {},
//   onOpenUser = () => {},
//   onMessageAdded,
// }) {
//   const { token, user } = useAuth?.() ?? {};
//   const currentUserId =
//     user?.app_user_id ??
//     user?.appUserId ??
//     user?.user_id ??
//     user?.userId ??
//     user?.id ??
//     user?.uid ??
//     user?.pk ??
//     null;

//   const CURRENT_ROLE = "agent";
//   const [messages, setMessages] = useState([]);
//   const [text, setText] = useState("");
//   const [sending, setSending] = useState(false);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState(null);
//   const [showAssignMenu, setShowAssignMenu] = useState(false);
//   const [assigning, setAssigning] = useState(false);
//   const [showNotification, setShowNotification] = useState(false);
//   const [notificationMessage, setNotificationMessage] = useState("");
//   const { users: agents = [] } = useUsersDirectory({ enabled: true });

//   // resolve / popup / escalate states
//   const [resolving, setResolving] = useState(false);
//   const [resolveNotice, setResolveNotice] = useState(null);
//   const [escalating, setEscalating] = useState(false);
//   const [escalationNotice, setEscalationNotice] = useState(null);
//   const [showPopup, setShowPopup] = useState(false);
//   const [isResolved, setIsResolved] = useState(false);
//   const [escalated, setEscalated] = useState(false);

//   const digestRef = useRef("");
//   const controllerRef = useRef(null);
//   const pollRef = useRef(null);

//   const ticketId = ticket?.id ?? null;

//   // derive ticket status_label and normalized status
//   const { status_label, status } = useMemo(() => {
//     const statusRaw =
//       ticket?.ticket_status ?? ticket?.status ?? ticket?.state ?? null;
//     const label =
//       statusRaw === null || statusRaw === undefined
//         ? "Active"
//         : String(statusRaw);
//     const norm = normalizeStatusValue(label);
//     return { status_label: label, status: norm };
//   }, [ticket]);

//   // set resolved & escalated state when ticket changes (ticket_status is source of truth for resolved)
//   useEffect(() => {
//     const ticketStatus =
//       typeof ticket?.ticket_status === "string"
//         ? String(ticket.ticket_status).toLowerCase()
//         : "";
//     const rawTicketStatus =
//       typeof ticket?.raw?.ticket_status === "string"
//         ? String(ticket.raw.ticket_status).toLowerCase()
//         : "";
//     const resolved =
//       ticketStatus === "resolved" || rawTicketStatus === "resolved";
//     setIsResolved(resolved);

//     // escalated from explicit ticket field or raw
//     const escFlag =
//       Boolean(ticket?.escalated) || Boolean(ticket?.raw?.escalated) || false;
//     // also consider textual flags if present
//     const s = String(
//       ticket?.status || ticket?.progress || ticket?.statusDisplay || ""
//     ).toLowerCase();
//     const isTextEscalated = s === "escalated";
//     setEscalated(escFlag || isTextEscalated);
//   }, [
//     ticket?.ticket_status,
//     ticket?.raw?.ticket_status,
//     ticket?.escalated,
//     ticket?.raw?.escalated,
//     ticket?.status,
//     ticket?.progress,
//     ticket?.statusDisplay,
//     ticket?.id,
//   ]);

//   // assigned agent resolution (by id or name). treat "null"/""/"unassigned" as no agent
//   const assignedAgentId =
//     ticket?.assigned_to_id ??
//     ticket?.assigned_to ??
//     ticket?.raw?.assigned_to_id ??
//     ticket?.raw?.assigned_to ??
//     null;

//   const assignedAgentName = normalizeAgentName(
//     ticket?.assigned_to_name ??
//       ticket?.raw?.assigned_to_name ??
//       ticket?.assigned_to_name
//   );

//   // try find agent by id first, then by matching name/email/username
//   const assignedAgent = useMemo(() => {
//     if (!agents || agents.length === 0) {
//       if (assignedAgentName) {
//         return {
//           id: null,
//           name: assignedAgentName,
//           username: assignedAgentName,
//         };
//       }
//       return null;
//     }

//     if (assignedAgentId) {
//       const found = agents.find(
//         (a) => String(a.id) === String(assignedAgentId)
//       );
//       if (found) return found;
//     }

//     if (assignedAgentName) {
//       const lower = assignedAgentName.toLowerCase();
//       const found = agents.find(
//         (a) =>
//           (a.name && a.name.toLowerCase() === lower) ||
//           (a.username && a.username.toLowerCase() === lower) ||
//           (a.email && a.email.toLowerCase() === lower)
//       );
//       if (found) return found;
//       return { id: null, name: assignedAgentName, username: assignedAgentName };
//     }

//     return null;
//   }, [agents, assignedAgentId, assignedAgentName]);

//   // initialize messages when ticket changes
//   useEffect(() => {
//     if (ticket && Array.isArray(ticket.messages)) {
//       const fallback = normalizeChatEntries(ticket.messages, { ticketId });
//       setMessages(fallback);
//     } else {
//       setMessages([]);
//     }
//     setText("");
//     setError(null);
//   }, [ticket, ticketId]);

//   const handleKeyDown = useCallback(
//     (e) => {
//       if (e?.key === "Escape") {
//         try {
//           controllerRef.current?.abort();
//           onClose?.();
//         } catch (err) {}
//       }
//     },
//     [onClose]
//   );

//   useEffect(() => {
//     if (!open) return;
//     if (typeof window === "undefined") return;

//     window.addEventListener("keydown", handleKeyDown);
//     return () => window.removeEventListener("keydown", handleKeyDown);
//   }, [open, handleKeyDown]);

//   useEffect(() => {
//     if (!showAssignMenu) return;
//     const handleClickOutside = (e) => {
//       if (!e.target.closest(".assign-menu-container")) {
//         setShowAssignMenu(false);
//       }
//     };
//     document.addEventListener("mousedown", handleClickOutside);
//     return () => document.removeEventListener("mousedown", handleClickOutside);
//   }, [showAssignMenu]);

//   useEffect(() => {
//     if (!open || !ticketId) {
//       return () => {};
//     }

//     let mounted = true;

//     const loadChats = async (initial = false) => {
//       if (!ticketId) return;
//       controllerRef.current?.abort();
//       controllerRef.current = new AbortController();

//       try {
//         if (initial) setLoading(true);
//         const data = await fetchTicketChats(ticketId, {
//           token,
//           signal: controllerRef.current.signal,
//         });
//         if (!mounted) return;
//         const mapped = normalizeChatEntries(data, { ticketId });
//         const digest = digestMessages(mapped);
//         if (digest !== digestRef.current) {
//           digestRef.current = digest;
//           setMessages(mapped);
//         }
//         setError(null);
//       } catch (err) {
//         const isCanceled =
//           err?.name === "AbortError" ||
//           err?.name === "CanceledError" ||
//           err?.code === "ERR_CANCELED" ||
//           err?.message === "canceled";
//         if (isCanceled) return;
//         console.error("Failed to load chats:", err);
//         setError(err.message || "Failed to load messages");
//       } finally {
//         if (mounted) setLoading(false);
//       }
//     };

//     loadChats(true);
//     pollRef.current = setInterval(() => loadChats(false), DEFAULT_CHAT_POLL_MS);

//     return () => {
//       mounted = false;
//       controllerRef.current?.abort();
//       if (pollRef.current) clearInterval(pollRef.current);
//     };
//   }, [open, ticketId, token]);

//   const handleSend = async (e) => {
//     try {
//       e?.preventDefault?.();
//     } catch (err) {
//       /* ignore */
//     }

//     const body = String(text || "").trim();
//     if (!body || !ticketId) return;

//     setSending(true);
//     setError(null);

//     const optimisticMsg = {
//       id: `local-${Date.now()}`,
//       text: body,
//       at: new Date().toISOString(),
//       role: CURRENT_ROLE,
//       status: "pending",
//     };
//     setMessages((prev) => [...prev, optimisticMsg]);

//     try {
//       await postTicketMessage({
//         ticketId,
//         message: body,
//         appUserId: currentUserId ?? "",
//         token,
//         fromTicket: ticket?.from_ticket ?? ticket?.raw?.from_ticket ?? false,
//       });
//       setMessages((prev) =>
//         prev.map((msg) =>
//           msg.id === optimisticMsg.id ? { ...msg, status: "sent" } : msg
//         )
//       );
//       digestRef.current = "";
//       if (typeof onMessageAdded === "function") {
//         onMessageAdded(
//           { ...optimisticMsg, status: "sent", role: CURRENT_ROLE },
//           ticket
//         );
//       }
//       setText("");
//     } catch (err) {
//       console.error("Failed to send message:", err);
//       setError(err.message || "Failed to send message");
//       setMessages((prev) =>
//         prev.map((msg) =>
//           msg.id === optimisticMsg.id ? { ...msg, status: "failed" } : msg
//         )
//       );
//     } finally {
//       setSending(false);
//     }
//   };

//   const safeClose = useCallback(() => {
//     try {
//       controllerRef.current?.abort();
//       setShowAssignMenu(false);
//       onClose?.();
//     } catch (err) {}
//   }, [onClose]);

//   // Resolve handler
//   const handleResolve = async (e) => {
//     if (e) {
//       e.preventDefault();
//       e.stopPropagation();
//     }
//     if (!ticketId || resolving || isResolved) return;

//     setResolving(true);
//     setResolveNotice(null);

//     try {
//       await api.post("/set-ticket-status/", {
//         ticket_id: ticketId,
//         status: "Resolved",
//       });

//       setIsResolved(true);
//       setResolveNotice("Ticket resolved successfully.");

//       requestAnimationFrame(() => {
//         setShowPopup(true);
//         setTimeout(() => {
//           setShowPopup(false);
//         }, 5000);
//       });

//       // notify parent to refresh
//       try {
//         if (typeof onMessageAdded === "function") {
//           onMessageAdded({}, ticket);
//         }
//       } catch (e) {}

//       setNotificationMessage("Ticket resolved");
//       setShowNotification(true);
//       setTimeout(() => setShowNotification(false), 3000);
//     } catch (err) {
//       console.error("Failed to resolve ticket:", err);
//       setResolveNotice("Failed to resolve ticket");
//     } finally {
//       setResolving(false);
//     }
//   };

//   // Escalate handler (added)
//   const handleEscalate = async (e) => {
//     if (e) {
//       e.preventDefault();
//       e.stopPropagation();
//     }
//     if (!ticketId || escalating || escalated || isResolved) return;

//     setEscalating(true);
//     setEscalationNotice(null);

//     try {
//       await api.post("/tickets/escalate-ticket/", {
//         ticket_id: ticketId,
//         agent_id: currentUserId ?? null,
//       });

//       setEscalated(true);
//       setEscalationNotice("Ticket escalated successfully.");

//       requestAnimationFrame(() => {
//         setShowPopup(true);
//         setTimeout(() => {
//           setShowPopup(false);
//         }, 5000);
//       });

//       // notify parent to refresh
//       try {
//         if (typeof onMessageAdded === "function") {
//           onMessageAdded({}, ticket);
//         }
//       } catch (e) {}

//       setNotificationMessage("Ticket escalated");
//       setShowNotification(true);
//       setTimeout(() => setShowNotification(false), 3000);
//     } catch (err) {
//       console.error("Failed to escalate ticket:", err);
//       setEscalationNotice(err?.message ?? "Failed to escalate ticket");
//       setEscalated(false);
//     } finally {
//       setEscalating(false);
//     }
//   };

//   return (
//     <AnimatePresence>
//       {open && (
//         <motion.div
//           key={`chat-modal-${ticket?.id ?? "no-ticket"}`}
//           initial={{ opacity: 0 }}
//           animate={{ opacity: 1 }}
//           exit={{ opacity: 0 }}
//           className="fixed inset-0 z-50 flex items-center justify-center"
//           aria-modal="true"
//           role="dialog"
//         >
//           {/* backdrop */}
//           <motion.div
//             initial={{ opacity: 0 }}
//             animate={{ opacity: 0.5 }}
//             exit={{ opacity: 0 }}
//             onClick={safeClose}
//             className="absolute inset-0 bg-black/40"
//           />

//           {/* modal container */}
//           <motion.div
//             initial={{ y: 20, opacity: 0, scale: 0.98 }}
//             animate={{ y: 0, opacity: 1, scale: 1 }}
//             exit={{ y: 8, opacity: 0, scale: 0.98 }}
//             transition={{ duration: 0.22 }}
//             className="relative w-full max-w-4xl h-[80vh] bg-white rounded-lg border border-slate-200 shadow-xl flex"
//           >
//             {/* Left: conversation */}
//             <div className="flex-1 flex flex-col">
//               <header className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
//                 <div className="flex items-center gap-4">
//                   <button
//                     onClick={() => {
//                       try {
//                         onOpenUser?.(ticket);
//                       } catch (err) {
//                         console.warn("onOpenUser threw:", err);
//                       }
//                     }}
//                     className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-medium text-slate-700"
//                     title="View user details"
//                     aria-label="View user details"
//                   >
//                     {String(ticket?.email ?? ticket?.name ?? "U")
//                       .slice(0, 2)
//                       .toUpperCase()}
//                   </button>

//                   <div>
//                     <div className="font-medium text-slate-800">
//                       {ticket?.email ?? ticket?.name ?? "Unknown"}
//                     </div>
//                     <div className="text-xs text-slate-500 flex items-center gap-2">
//                       <span>{ticket?.categoryTitle ?? ""}</span>

//                       <span
//                         className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
//                           status === "resolved"
//                             ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
//                             : status === "pending"
//                             ? "bg-amber-100 text-amber-700 border border-amber-200"
//                             : "bg-blue-100 text-blue-700 border border-blue-200"
//                         }`}
//                       >
//                         {status_label}
//                       </span>

//                       {escalated && (
//                         <span className="ml-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
//                           Escalated
//                         </span>
//                       )}
//                     </div>
//                   </div>
//                 </div>

//                 <div className="flex items-center gap-3">
//                   {assignedAgent && (
//                     <button
//                       onClick={() => setShowAssignMenu(!showAssignMenu)}
//                       className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-xs font-medium hover:bg-slate-200 transition-colors"
//                       aria-label="Change assigned agent"
//                     >
//                       <FiUserPlus className="w-4 h-4" />
//                       <span>
//                         {assignedAgent.name ||
//                           assignedAgent.username ||
//                           assignedAgent.email}
//                       </span>
//                     </button>
//                   )}
//                   <div className="relative assign-menu-container">
//                     <button
//                       onClick={() => setShowAssignMenu(!showAssignMenu)}
//                       disabled={assigning || !ticketId}
//                       className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
//                       aria-label="Assign ticket"
//                     >
//                       <FiUserPlus className="w-4 h-4" />
//                       {assigning ? "Assigning..." : "Assign"}
//                     </button>
//                     {showAssignMenu && (
//                       <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-lg shadow-lg border border-slate-200 z-50 max-h-64 overflow-y-auto assign-menu-container">
//                         <div className="p-2">
//                           <div className="text-xs font-semibold text-slate-700 px-2 py-1 mb-1">
//                             Select Agent
//                           </div>
//                           {agents.length === 0 ? (
//                             <div className="text-xs text-slate-500 px-2 py-4 text-center">
//                               No agents available
//                             </div>
//                           ) : (
//                             agents
//                               .filter((a) => a.account_type === "agent")
//                               .map((agent) => (
//                                 <button
//                                   key={agent.id}
//                                   onClick={async () => {
//                                     setAssigning(true);
//                                     try {
//                                       await api.post(
//                                         "/assign-ticket/to-user/",
//                                         {
//                                           ticket_id: ticketId,
//                                           assigned_to_id: agent.id,
//                                         }
//                                       );
//                                       setShowAssignMenu(false);
//                                       setNotificationMessage(
//                                         `Ticket assigned to ${
//                                           agent.name ||
//                                           agent.username ||
//                                           agent.email
//                                         }`
//                                       );
//                                       setShowNotification(true);
//                                       setTimeout(() => {
//                                         setShowNotification(false);
//                                       }, 3000);
//                                       if (onMessageAdded) {
//                                         onMessageAdded({}, ticket);
//                                       }
//                                     } catch (err) {
//                                       console.error(
//                                         "Failed to assign ticket:",
//                                         err
//                                       );
//                                       setError(
//                                         err?.response?.data?.message ||
//                                           "Failed to assign ticket"
//                                       );
//                                     } finally {
//                                       setAssigning(false);
//                                     }
//                                   }}
//                                   className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50 rounded transition-colors"
//                                 >
//                                   <div className="font-medium text-slate-800">
//                                     {agent.name ||
//                                       agent.username ||
//                                       agent.email}
//                                   </div>
//                                   <div className="text-xs text-slate-500">
//                                     {agent.email}
//                                   </div>
//                                 </button>
//                               ))
//                           )}
//                         </div>
//                       </div>
//                     )}
//                   </div>

//                   {/* Escalate button */}
//                   <button
//                     onClick={handleEscalate}
//                     disabled={escalating || escalated || isResolved}
//                     className={`text-xs px-2 py-1 rounded border transition-colors ${
//                       escalated
//                         ? "border-purple-300 bg-purple-50 text-purple-700 cursor-not-allowed"
//                         : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
//                     } ${escalating ? "opacity-50 cursor-not-allowed" : ""}`}
//                     aria-label="Escalate ticket"
//                   >
//                     {escalating
//                       ? "Escalating…"
//                       : escalated
//                       ? "Escalated"
//                       : "Escalate"}
//                   </button>

//                   {/* Resolve button */}
//                   {!isResolved && (
//                     <button
//                       onClick={handleResolve}
//                       disabled={resolving || isResolved}
//                       className={`text-xs px-2 py-1 rounded border transition-colors ${
//                         isResolved
//                           ? "border-emerald-300 bg-emerald-50 text-emerald-700 cursor-not-allowed"
//                           : "border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
//                       } ${resolving ? "opacity-50 cursor-not-allowed" : ""}`}
//                       aria-label="Resolve ticket"
//                     >
//                       {resolving
//                         ? "Resolving…"
//                         : isResolved
//                         ? "Resolved"
//                         : "Resolve"}
//                     </button>
//                   )}

//                   <span className=" bg-green-200 px-2 py-1 rounded-full text-xs text-slate-500">
//                     AI Assisted
//                   </span>
//                   <button
//                     type="button"
//                     onClick={safeClose}
//                     className="p-2 rounded hover:bg-slate-100"
//                     aria-label="Close chat"
//                   >
//                     <FiX />
//                   </button>
//                 </div>
//               </header>

//               {/* messages */}
//               <div
//                 className="flex-1 overflow-y-auto p-6 space-y-1 bg-slate-50"
//                 style={{ maxHeight: "calc(80vh - 200px)", minHeight: "400px" }}
//               >
//                 <motion.div
//                   initial={{ opacity: 0, y: 6 }}
//                   animate={{ opacity: 1, y: 0 }}
//                   className="bg-blue-600 text-white rounded-lg p-3 text-sm shadow-sm"
//                 >
//                   Support — Welcome to HelpDesk! Your ticket is being routed, an
//                   agent will join shortly.
//                 </motion.div>

//                 {loading && (
//                   <div className="flex items-center justify-center p-6">
//                     <div className="flex items-center gap-2 text-sm text-slate-500">
//                       <div className="w-4 h-4 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
//                       <span>Loading messages…</span>
//                     </div>
//                   </div>
//                 )}

//                 {messages.length === 0 && !loading && (
//                   <div className="text-sm text-slate-400 text-center py-8">
//                     No messages yet.
//                   </div>
//                 )}

//                 {messages.map((m, idx) => {
//                   const isSender =
//                     m.role === "agent" || m.role === CURRENT_ROLE;
//                   const prevMessage = idx > 0 ? messages[idx - 1] : null;
//                   const isSameSender =
//                     prevMessage &&
//                     ((isSender &&
//                       (prevMessage.role === "agent" ||
//                         prevMessage.role === CURRENT_ROLE)) ||
//                       (!isSender &&
//                         prevMessage.role !== "agent" &&
//                         prevMessage.role !== CURRENT_ROLE));
//                   return (
//                     <motion.div
//                       key={m.id ?? idx}
//                       initial={{ opacity: 0, y: 6 }}
//                       animate={{ opacity: 1, y: 0 }}
//                       className={`flex ${
//                         isSender ? "justify-end" : "justify-start"
//                       } ${isSameSender ? "mt-0.5" : "mt-2"}`}
//                     >
//                       <div
//                         className={`p-3 rounded-lg max-w-[75%] shadow-sm ${
//                           isSender
//                             ? "bg-blue-600 text-white rounded-tr-none"
//                             : "bg-gray-200 text-gray-800 rounded-tl-none"
//                         }`}
//                       >
//                         <div className="text-sm whitespace-pre-wrap break-words">
//                           {m.text}
//                         </div>
//                         <div
//                           className={`text-xs mt-1.5 flex items-center gap-2 ${
//                             isSender ? "text-blue-100" : "text-gray-600"
//                           }`}
//                         >
//                           <span>{new Date(m.at).toLocaleString()}</span>
//                           {m.status === "failed" && (
//                             <span className="text-red-600">• Failed</span>
//                           )}
//                           {m.status === "pending" && (
//                             <span className="text-amber-600">• Sending…</span>
//                           )}
//                         </div>
//                       </div>
//                     </motion.div>
//                   );
//                 })}
//               </div>

//               {/* input */}
//               <form
//                 onSubmit={handleSend}
//                 className="px-4 py-3 border-t border-slate-200 flex items-center gap-3"
//               >
//                 <button
//                   type="button"
//                   className="p-2 rounded-md text-slate-500 hover:bg-slate-100"
//                   title="Attach file"
//                 >
//                   <FiPaperclip />
//                 </button>

//                 <button
//                   type="button"
//                   className="p-2 rounded-md text-slate-500 hover:bg-slate-100"
//                   title="Emoji"
//                 >
//                   <FiSmile />
//                 </button>

//                 <input
//                   className="flex-1 border border-slate-300 rounded-full px-4 py-2 outline-none focus:ring-2 focus:ring-blue-200"
//                   placeholder="Type your message..."
//                   value={text}
//                   onChange={(e) => setText(e.target.value)}
//                   aria-label="Message input"
//                   disabled={sending}
//                 />

//                 <button
//                   type="submit"
//                   disabled={sending}
//                   className="bg-blue-600 text-white p-2 rounded-full w-10 h-10 flex items-center justify-center"
//                   aria-label="Send message"
//                 >
//                   {sending ? (
//                     <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
//                   ) : (
//                     <FiSend />
//                   )}
//                 </button>
//               </form>

//               {error && (
//                 <div className="px-6 pb-3 text-xs text-red-600">{error}</div>
//               )}
//             </div>

//             {/* Notification Toast (bottom-right) */}
//             <AnimatePresence>
//               {showNotification && (
//                 <motion.div
//                   initial={{ opacity: 0, y: 20 }}
//                   animate={{ opacity: 1, y: 0 }}
//                   exit={{ opacity: 0, y: 20 }}
//                   className="fixed bottom-4 right-4 bg-green-600 text-white px-4 py-3 rounded-lg shadow-lg z-50 flex items-center gap-2"
//                 >
//                   <svg
//                     className="w-5 h-5"
//                     fill="none"
//                     stroke="currentColor"
//                     viewBox="0 0 24 24"
//                   >
//                     <path
//                       strokeLinecap="round"
//                       strokeLinejoin="round"
//                       strokeWidth={2}
//                       d="M5 13l4 4L19 7"
//                     />
//                   </svg>
//                   <span className="text-sm font-medium">
//                     {notificationMessage}
//                   </span>
//                 </motion.div>
//               )}
//             </AnimatePresence>

//             {/* Popup Toast (top-right) - shows escalate/resolve success */}
//             <AnimatePresence>
//               {showPopup && (resolveNotice || escalationNotice) && (
//                 <motion.div
//                   initial={{ opacity: 0, y: -10 }}
//                   animate={{ opacity: 1, y: 0 }}
//                   exit={{ opacity: 0, y: -10 }}
//                   transition={{ duration: 0.18 }}
//                   className="pointer-events-auto fixed right-4 top-6 z-50 w-full max-w-sm sm:max-w-md rounded shadow-lg mx-4 sm:mx-0"
//                   role="status"
//                   aria-live="polite"
//                 >
//                   <div className="flex items-start gap-3 p-3 rounded bg-white border border-slate-200">
//                     <div className="shrink-0">
//                       <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-green-50 text-green-600 border border-green-100">
//                         <svg
//                           xmlns="http://www.w3.org/2000/svg"
//                           className="w-5 h-5"
//                           viewBox="0 0 20 20"
//                           fill="currentColor"
//                           aria-hidden
//                         >
//                           <path
//                             fillRule="evenodd"
//                             d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 10-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
//                             clipRule="evenodd"
//                           />
//                         </svg>
//                       </div>
//                     </div>
//                     <div className="flex-1 min-w-0">
//                       <p className="text-sm font-medium text-slate-900">
//                         Success
//                       </p>
//                       <p className="text-sm text-slate-600">
//                         {escalationNotice ?? resolveNotice}
//                       </p>
//                     </div>
//                     <div className="flex items-start ml-3">
//                       <button
//                         onClick={() => setShowPopup(false)}
//                         aria-label="Close"
//                         className="inline-flex p-1 rounded text-slate-400 hover:text-slate-600"
//                       >
//                         <svg
//                           xmlns="http://www.w3.org/2000/svg"
//                           className="w-4 h-4"
//                           viewBox="0 0 20 20"
//                           fill="currentColor"
//                           aria-hidden
//                         >
//                           <path
//                             fillRule="evenodd"
//                             d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
//                             clipRule="evenodd"
//                           />
//                         </svg>
//                       </button>
//                     </div>
//                   </div>
//                 </motion.div>
//               )}
//             </AnimatePresence>

//             {/* Right: user details (compact) */}
//             <aside className="w-80 border-l border-slate-200 p-6 overflow-auto">
//               <div className="flex items-center gap-4 mb-4">
//                 <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center font-medium text-slate-700">
//                   {String(ticket?.email ?? ticket?.name ?? "U")
//                     .slice(0, 2)
//                     .toUpperCase()}
//                 </div>
//                 <div>
//                   <div className="font-semibold text-slate-800">
//                     {ticket?.email?.split?.("@")?.[0] ?? ticket?.name ?? "User"}
//                   </div>
//                   <div className="text-xs text-slate-500">
//                     Customer ID:{" "}
//                     {String(
//                       ticket?.raw?.customer_id ??
//                         ticket?.raw?.user_id ??
//                         ticket?.raw?.userId ??
//                         ticket?.raw?.reporter_id ??
//                         ticket?.id ??
//                         "—"
//                     )}
//                   </div>
//                 </div>
//               </div>

//               <div className="text-sm text-slate-600 space-y-4">
//                 <div>
//                   <div className="text-xs text-slate-500 flex items-center justify-between">
//                     <span>Ticket Status</span>
//                     <span
//                       className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
//                         status === "resolved"
//                           ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
//                           : status === "pending"
//                           ? "bg-amber-100 text-amber-700 border border-amber-200"
//                           : "bg-blue-100 text-blue-700 border border-blue-200"
//                       }`}
//                     >
//                       {status_label}
//                     </span>
//                   </div>
//                   <div className="mt-2 text-xs text-slate-500">
//                   {formatMaybeDate(time)}
//                   </div>
//                 </div>

//                 <div>
//                   <div className="text-xs text-slate-500">Assigned to</div>
//                   <div className="mt-2 font-medium">
//                     {assignedAgent
//                       ? assignedAgent.name ||
//                         assignedAgent.username ||
//                         assignedAgent.email
//                       : "No agent assigned"}
//                   </div>
//                   <div className="text-xs text-slate-400">
//                     {assignedAgent?.email ?? ""}
//                   </div>
//                 </div>

//                 {escalated && (
//                   <div className="mt-2">
//                     <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-50 text-red-700 border border-red-200 text-xs font-semibold">
//                       Escalated
//                     </div>
//                   </div>
//                 )}
//               </div>
//             </aside>
//           </motion.div>
//         </motion.div>
//       )}
//     </AnimatePresence>
//   );
// }




"use client";

import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiX, FiPaperclip, FiSmile, FiSend, FiUserPlus } from "react-icons/fi";
import { useAuth } from "@/context/AuthContext";
import { useUsersDirectory } from "@/hooks/useUsersDirectory";
import api from "@/lib/axios";
import {
  DEFAULT_CHAT_POLL_MS,
  digestMessages,
  fetchTicketChats,
  normalizeChatEntries,
  postTicketMessage,
} from "@/lib/chatClient";
import { format, isValid } from "date-fns"; 

function normalizeAgentName(agent) {
  if (agent === null || agent === undefined) return null;
  if (typeof agent === "string") {
    const v = agent.trim();
    if (
      v === "" ||
      v.toLowerCase() === "null" ||
      v.toLowerCase() === "unassigned"
    )
      return null;
    return v;
  }
  return String(agent);
}

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
  const [showAssignMenu, setShowAssignMenu] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState("");
  const { users: agents = [] } = useUsersDirectory({ enabled: true });

  // resolve / popup / escalate states
  const [resolving, setResolving] = useState(false);
  const [resolveNotice, setResolveNotice] = useState(null);
  const [escalating, setEscalating] = useState(false);
  const [escalationNotice, setEscalationNotice] = useState(null);
  const [showPopup, setShowPopup] = useState(false);
  const [isResolved, setIsResolved] = useState(false);
  const [escalated, setEscalated] = useState(false);

  const digestRef = useRef("");
  const controllerRef = useRef(null);
  const pollRef = useRef(null);

  const ticketId = ticket?.id ?? null;

  // derive ticket status_label and normalized status
  const { status_label, status } = useMemo(() => {
    const statusRaw =
      ticket?.ticket_status ?? ticket?.status ?? ticket?.state ?? null;
    const label =
      statusRaw === null || statusRaw === undefined
        ? "Active"
        : String(statusRaw);
    const norm = normalizeStatusValue(label);
    return { status_label: label, status: norm };
  }, [ticket]);

  // set resolved & escalated state when ticket changes (ticket_status is source of truth for resolved)
  useEffect(() => {
    const ticketStatus =
      typeof ticket?.ticket_status === "string"
        ? String(ticket.ticket_status).toLowerCase()
        : "";
    const rawTicketStatus =
      typeof ticket?.raw?.ticket_status === "string"
        ? String(ticket.raw.ticket_status).toLowerCase()
        : "";
    const resolved =
      ticketStatus === "resolved" || rawTicketStatus === "resolved";
    setIsResolved(resolved);

    // escalated from explicit ticket field or raw
    const escFlag =
      Boolean(ticket?.escalated) || Boolean(ticket?.raw?.escalated) || false;
    // also consider textual flags if present
    const s = String(
      ticket?.status || ticket?.progress || ticket?.statusDisplay || ""
    ).toLowerCase();
    const isTextEscalated = s === "escalated";
    setEscalated(escFlag || isTextEscalated);
  }, [
    ticket?.ticket_status,
    ticket?.raw?.ticket_status,
    ticket?.escalated,
    ticket?.raw?.escalated,
    ticket?.status,
    ticket?.progress,
    ticket?.statusDisplay,
    ticket?.id,
  ]);

  // assigned agent resolution (by id or name). treat "null"/""/"unassigned" as no agent
  const assignedAgentId =
    ticket?.assigned_to_id ??
    ticket?.assigned_to ??
    ticket?.raw?.assigned_to_id ??
    ticket?.raw?.assigned_to ??
    null;

  const assignedAgentName = normalizeAgentName(
    ticket?.assigned_to_name ??
      ticket?.raw?.assigned_to_name ??
      ticket?.assigned_to_name
  );

  // try find agent by id first, then by matching name/email/username
  const assignedAgent = useMemo(() => {
    if (!agents || agents.length === 0) {
      if (assignedAgentName) {
        return {
          id: null,
          name: assignedAgentName,
          username: assignedAgentName,
        };
      }
      return null;
    }

    if (assignedAgentId) {
      const found = agents.find(
        (a) => String(a.id) === String(assignedAgentId)
      );
      if (found) return found;
    }

    if (assignedAgentName) {
      const lower = assignedAgentName.toLowerCase();
      const found = agents.find(
        (a) =>
          (a.name && a.name.toLowerCase() === lower) ||
          (a.username && a.username.toLowerCase() === lower) ||
          (a.email && a.email.toLowerCase() === lower)
      );
      if (found) return found;
      return { id: null, name: assignedAgentName, username: assignedAgentName };
    }

    return null;
  }, [agents, assignedAgentId, assignedAgentName]);

  // initialize messages when ticket changes
  useEffect(() => {
    if (ticket && Array.isArray(ticket.messages)) {
      const fallback = normalizeChatEntries(ticket.messages, { ticketId });
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
          controllerRef.current?.abort();
          onClose?.();
        } catch (err) {}
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
    if (!showAssignMenu) return;
    const handleClickOutside = (e) => {
      if (!e.target.closest(".assign-menu-container")) {
        setShowAssignMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showAssignMenu]);

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
        const isCanceled =
          err?.name === "AbortError" ||
          err?.name === "CanceledError" ||
          err?.code === "ERR_CANCELED" ||
          err?.message === "canceled";
        if (isCanceled) return;
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
        fromTicket: ticket?.from_ticket ?? ticket?.raw?.from_ticket ?? false,
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

  const safeClose = useCallback(() => {
    try {
      controllerRef.current?.abort();
      setShowAssignMenu(false);
      onClose?.();
    } catch (err) {}
  }, [onClose]);

  // Resolve handler
  const handleResolve = async (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (!ticketId || resolving || isResolved) return;

    setResolving(true);
    setResolveNotice(null);

    try {
      await api.post("/set-ticket-status/", {
        ticket_id: ticketId,
        status: "Resolved",
      });

      setIsResolved(true);
      setResolveNotice("Ticket resolved successfully.");

      requestAnimationFrame(() => {
        setShowPopup(true);
        setTimeout(() => {
          setShowPopup(false);
        }, 5000);
      });

      // notify parent to refresh
      try {
        if (typeof onMessageAdded === "function") {
          onMessageAdded({}, ticket);
        }
      } catch (e) {}

      setNotificationMessage("Ticket resolved");
      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 3000);
    } catch (err) {
      console.error("Failed to resolve ticket:", err);
      setResolveNotice("Failed to resolve ticket");
    } finally {
      setResolving(false);
    }
  };

  // Escalate handler (added)
  const handleEscalate = async (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (!ticketId || escalating || escalated || isResolved) return;

    setEscalating(true);
    setEscalationNotice(null);

    try {
      await api.post("/tickets/escalate-ticket/", {
        ticket_id: ticketId,
        agent_id: currentUserId ?? null,
      });

      setEscalated(true);
      setEscalationNotice("Ticket escalated successfully.");

      requestAnimationFrame(() => {
        setShowPopup(true);
        setTimeout(() => {
          setShowPopup(false);
        }, 5000);
      });

      // notify parent to refresh
      try {
        if (typeof onMessageAdded === "function") {
          onMessageAdded({}, ticket);
        }
      } catch (e) {}

      setNotificationMessage("Ticket escalated");
      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 3000);
    } catch (err) {
      console.error("Failed to escalate ticket:", err);
      setEscalationNotice(err?.message ?? "Failed to escalate ticket");
      setEscalated(false);
    } finally {
      setEscalating(false);
    }
  };

  // compute time here (inside component so ticket is defined)
  const time =
    ticket?.created_at ??
    ticket?.raw?.created_at ??
    "";

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
            onClick={safeClose}
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
              <header className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
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
                    {String(ticket?.email ?? ticket?.name ?? "U")
                      .slice(0, 2)
                      .toUpperCase()}
                  </button>

                  <div>
                    <div className="font-medium text-slate-800">
                      {ticket?.email ?? ticket?.name ?? "Unknown"}
                    </div>
                    <div className="text-xs text-slate-500 flex items-center gap-2">
                      <span>{ticket?.categoryTitle ?? ""}</span>

                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          status === "resolved"
                            ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                            : status === "pending"
                            ? "bg-amber-100 text-amber-700 border border-amber-200"
                            : "bg-blue-100 text-blue-700 border border-blue-200"
                        }`}
                      >
                        {status_label}
                      </span>

                      {escalated && (
                        <span className="ml-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
                          Escalated
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {assignedAgent && (
                    <button
                      onClick={() => setShowAssignMenu(!showAssignMenu)}
                      className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-xs font-medium hover:bg-slate-200 transition-colors"
                      aria-label="Change assigned agent"
                    >
                      <FiUserPlus className="w-4 h-4" />
                      <span>
                        {assignedAgent.name ||
                          assignedAgent.username ||
                          assignedAgent.email}
                      </span>
                    </button>
                  )}
                  <div className="relative assign-menu-container">
                    <button
                      onClick={() => setShowAssignMenu(!showAssignMenu)}
                      disabled={assigning || !ticketId}
                      className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      aria-label="Assign ticket"
                    >
                      <FiUserPlus className="w-4 h-4" />
                      {assigning ? "Assigning..." : "Assign"}
                    </button>
                    {showAssignMenu && (
                      <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-lg shadow-lg border border-slate-200 z-50 max-h-64 overflow-y-auto assign-menu-container">
                        <div className="p-2">
                          <div className="text-xs font-semibold text-slate-700 px-2 py-1 mb-1">
                            Select Agent
                          </div>
                          {agents.length === 0 ? (
                            <div className="text-xs text-slate-500 px-2 py-4 text-center">
                              No agents available
                            </div>
                          ) : (
                            agents
                              .filter((a) => a.account_type === "agent")
                              .map((agent) => (
                                <button
                                  key={agent.id}
                                  onClick={async () => {
                                    setAssigning(true);
                                    try {
                                      await api.post(
                                        "/assign-ticket/to-user/",
                                        {
                                          ticket_id: ticketId,
                                          assigned_to_id: agent.id,
                                        }
                                      );
                                      setShowAssignMenu(false);
                                      setNotificationMessage(
                                        `Ticket assigned to ${
                                          agent.name ||
                                          agent.username ||
                                          agent.email
                                        }`
                                      );
                                      setShowNotification(true);
                                      setTimeout(() => {
                                        setShowNotification(false);
                                      }, 3000);
                                      if (onMessageAdded) {
                                        onMessageAdded({}, ticket);
                                      }
                                    } catch (err) {
                                      console.error(
                                        "Failed to assign ticket:",
                                        err
                                      );
                                      setError(
                                        err?.response?.data?.message ||
                                          "Failed to assign ticket"
                                      );
                                    } finally {
                                      setAssigning(false);
                                    }
                                  }}
                                  className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50 rounded transition-colors"
                                >
                                  <div className="font-medium text-slate-800">
                                    {agent.name ||
                                      agent.username ||
                                      agent.email}
                                  </div>
                                  <div className="text-xs text-slate-500">
                                    {agent.email}
                                  </div>
                                </button>
                              ))
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Escalate button */}
                  <button
                    onClick={handleEscalate}
                    disabled={escalating || escalated || isResolved}
                    className={`text-xs px-2 py-1 rounded border transition-colors ${
                      escalated
                        ? "border-purple-300 bg-purple-50 text-purple-700 cursor-not-allowed"
                        : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                    } ${escalating ? "opacity-50 cursor-not-allowed" : ""}`}
                    aria-label="Escalate ticket"
                  >
                    {escalating
                      ? "Escalating…"
                      : escalated
                      ? "Escalated"
                      : "Escalate"}
                  </button>

                  {/* Resolve button */}
                  {!isResolved && (
                    <button
                      onClick={handleResolve}
                      disabled={resolving || isResolved}
                      className={`text-xs px-2 py-1 rounded border transition-colors ${
                        isResolved
                          ? "border-emerald-300 bg-emerald-50 text-emerald-700 cursor-not-allowed"
                          : "border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                      } ${resolving ? "opacity-50 cursor-not-allowed" : ""}`}
                      aria-label="Resolve ticket"
                    >
                      {resolving
                        ? "Resolving…"
                        : isResolved
                        ? "Resolved"
                        : "Resolve"}
                    </button>
                  )}

                  <span className=" bg-green-200 px-2 py-1 rounded-full text-xs text-slate-500">
                    AI Assisted
                  </span>
                  <button
                    type="button"
                    onClick={safeClose}
                    className="p-2 rounded hover:bg-slate-100"
                    aria-label="Close chat"
                  >
                    <FiX />
                  </button>
                </div>
              </header>

              {/* messages */}
              <div
                className="flex-1 overflow-y-auto p-6 space-y-1 bg-slate-50"
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
                  const isSender =
                    m.role === "agent" || m.role === CURRENT_ROLE;
                  const prevMessage = idx > 0 ? messages[idx - 1] : null;
                  const isSameSender =
                    prevMessage &&
                    ((isSender &&
                      (prevMessage.role === "agent" ||
                        prevMessage.role === CURRENT_ROLE)) ||
                      (!isSender &&
                        prevMessage.role !== "agent" &&
                        prevMessage.role !== CURRENT_ROLE));
                  return (
                    <motion.div
                      key={m.id ?? idx}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex ${
                        isSender ? "justify-end" : "justify-start"
                      } ${isSameSender ? "mt-0.5" : "mt-2"}`}
                    >
                      <div
                        className={`p-3 rounded-lg max-w-[75%] shadow-sm ${
                          isSender
                            ? "bg-blue-600 text-white rounded-tr-none"
                            : "bg-gray-200 text-gray-800 rounded-tl-none"
                        }`}
                      >
                        <div className="text-sm whitespace-pre-wrap break-words">
                          {m.text}
                        </div>
                        <div
                          className={`text-xs mt-1.5 flex items-center gap-2 ${
                            isSender ? "text-blue-100" : "text-gray-600"
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
                className="px-4 py-3 border-t border-slate-200 flex items-center gap-3"
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
                  className="flex-1 border border-slate-300 rounded-full px-4 py-2 outline-none focus:ring-2 focus:ring-blue-200"
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

            {/* Notification Toast (bottom-right) */}
            <AnimatePresence>
              {showNotification && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  className="fixed bottom-4 right-4 bg-green-600 text-white px-4 py-3 rounded-lg shadow-lg z-50 flex items-center gap-2"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span className="text-sm font-medium">
                    {notificationMessage}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Popup Toast (top-right) - shows escalate/resolve success */}
            <AnimatePresence>
              {showPopup && (resolveNotice || escalationNotice) && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.18 }}
                  className="pointer-events-auto fixed right-4 top-6 z-50 w-full max-w-sm sm:max-w-md rounded shadow-lg mx-4 sm:mx-0"
                  role="status"
                  aria-live="polite"
                >
                  <div className="flex items-start gap-3 p-3 rounded bg-white border border-slate-200">
                    <div className="shrink-0">
                      <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-green-50 text-green-600 border border-green-100">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="w-5 h-5"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                          aria-hidden
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 10-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900">
                        Success
                      </p>
                      <p className="text-sm text-slate-600">
                        {escalationNotice ?? resolveNotice}
                      </p>
                    </div>
                    <div className="flex items-start ml-3">
                      <button
                        onClick={() => setShowPopup(false)}
                        aria-label="Close"
                        className="inline-flex p-1 rounded text-slate-400 hover:text-slate-600"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="w-4 h-4"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                          aria-hidden
                        >
                          <path
                            fillRule="evenodd"
                            d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Right: user details (compact) */}
            <aside className="w-80 border-l border-slate-200 p-6 overflow-auto">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center font-medium text-slate-700">
                  {String(ticket?.email ?? ticket?.name ?? "U")
                    .slice(0, 2)
                    .toUpperCase()}
                </div>
                <div>
                  <div className="font-semibold text-slate-800">
                    {ticket?.email?.split?.("@")?.[0] ?? ticket?.name ?? "User"}
                  </div>
                  <div className="text-xs text-slate-500">
                    Customer ID:{" "}
                    {String(
                      ticket?.raw?.customer_id ??
                        ticket?.raw?.user_id ??
                        ticket?.raw?.userId ??
                        ticket?.raw?.reporter_id ??
                        ticket?.id ??
                        "—"
                    )}
                  </div>
                </div>
              </div>

              <div className="text-sm text-slate-600 space-y-4">
                <div>
                  <div className="text-xs text-slate-500 flex items-center justify-between">
                    <span>Ticket Status</span>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        status === "resolved"
                          ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                          : status === "pending"
                          ? "bg-amber-100 text-amber-700 border border-amber-200"
                          : "bg-blue-100 text-blue-700 border border-blue-200"
                      }`}
                    >
                      {status_label}
                    </span>
                  </div>
                  <div className="mt-2 text-xs text-slate-500">
                    {formatMaybeDate(time)}
                  </div>
                </div>

                <div>
                  <div className="text-xs text-slate-500">Assigned to</div>
                  <div className="mt-2 font-medium">
                    {assignedAgent
                      ? assignedAgent.name ||
                        assignedAgent.username ||
                        assignedAgent.email
                      : "No agent assigned"}
                  </div>
                  <div className="text-xs text-slate-400">
                    {assignedAgent?.email ?? ""}
                  </div>
                </div>

                {escalated && (
                  <div className="mt-2">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-50 text-red-700 border border-red-200 text-xs font-semibold">
                      Escalated
                    </div>
                  </div>
                )}
              </div>
            </aside>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
