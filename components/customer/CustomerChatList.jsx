// "use client";

// import React, { useEffect, useMemo, useState } from "react";
// import { motion } from "framer-motion";
// import { format, isValid } from "date-fns";
// import { useAuth } from "@/context/AuthContext";
// import { useUsersDirectory } from "@/hooks/useUsersDirectory";
// import { GoAlertFill } from "react-icons/go";

// let api = null;
// try {
//   api = require("@/lib/axios").default;
// } catch (e) {
//   api = null;
// }

// /**
//  * ChatList
//  *
//  * - Always fetches tickets from `/filter-ticket/by-user-id/{id}/` when no tickets prop
//  * - When `tickets` prop is provided we still normalize *and filter* those tickets by the
//  *   effective user id so the UI always shows tickets for that user only.
//  * - Normalizes many possible shapes for ticket objects and status values.
//  */
// export default function ChatList({
//   tickets: ticketsProp = null,
//   selected,
//   setSelected,
//   loading: loadingProp = false,
//   userId: propUserId = null,
//   userEmail: propUserEmail = null,
//   // if true, force fetching from the server even when ticketsProp is provided
//   forceFetch = false,
// }) {
//   const { user, token } = useAuth?.() ?? {};
//   const { users: directory } = useUsersDirectory({ enabled: true });

//   const authUserId =
//     user?.app_user_id ??
//     user?.appUserId ??
//     user?.user_id ??
//     user?.userId ??
//     user?.id ??
//     user?.uid ??
//     user?.pk ??
//     null;

//   const authUserEmail =
//     user?.email ??
//     user?.username ??
//     (Array.isArray(user?.emails) ? user.emails[0] : null) ??
//     user?.contact_email ??
//     null;

//   const effectiveUserId = propUserId ?? authUserId;
//   const effectiveUserEmail = propUserEmail ?? authUserEmail;

//   // always default to empty; we'll fetch by user id if ticketsProp is not provided
//   const [tickets, setTickets] = useState([]);
//   const [loading, setLoading] = useState(Boolean(loadingProp || !ticketsProp));
//   const [error, setError] = useState(null);
//   const [activeTab, setActiveTab] = useState("all");

//   // Use tab ids that match the normalized status keys
//   const TABS = [
//     { id: "all", label: "All" },
//     { id: "pending", label: "Pending" },
//     { id: "resolved", label: "Resolved" },
//   ];

//   // Normalize a single ticket object from various API shapes
//   function normalizeTicket(t) {
//     const id = t?.id ?? t?.pk ?? null;
//     const subject = t?.subject ?? t?.title ?? null;
//     const name = t?.name ?? t?.reporter_name ?? null;
//     const email = t?.email ?? t?.reporter_email ?? "";

//     const progressLabel =
//       typeof t?.ticket_status === "string" && t.ticket_status.trim().length > 0
//         ? t.ticket_status.trim()
//         : null;
//     const statusBool = typeof t?.status === "boolean" ? t.status : undefined;
//     const statusStr = typeof t?.status === "string" ? t.status : undefined;
//     const ticketStatusStr =
//       typeof t?.ticket_status === "string" ? t.ticket_status : undefined;

//     // Use ticket_status as primary source of truth
//     let statusDisplay;
//     if (ticketStatusStr && ticketStatusStr.trim().length > 0) {
//       const ticketStatusLower = ticketStatusStr.toLowerCase();
//       if (ticketStatusLower === "resolved") {
//         statusDisplay = "Resolved";
//       } else if (
//         ticketStatusLower === "pending" ||
//         ticketStatusLower === "waiting"
//       ) {
//         statusDisplay = "Pending";
//       } else if (ticketStatusLower === "escalated") {
//         statusDisplay = "Escalated";
//       } else {
//         statusDisplay = ticketStatusStr.trim();
//       }
//     } else if (progressLabel) {
//       statusDisplay = progressLabel;
//     } else if (statusBool === true) {
//       statusDisplay = "Resolved";
//     } else if (typeof statusStr === "string" && statusStr.trim().length > 0) {
//       statusDisplay = statusStr.trim();
//     } else {
//       statusDisplay = "Active";
//     }

//     const statusKey = statusDisplay ? statusDisplay.toLowerCase() : "active";

//     const created_at = t?.created_at ?? t?.createdAt ?? t?.pub_date ?? null;
//     const created_at_display = t?.created_at_display ?? null;
//     const preview =
//       t?.preview ??
//       (t?.progress ? String(t.progress).slice(0, 80) : "") ??
//       null;

//     // capture a set of possible user id fields so we can filter by user later
//     const ticketUserId =
//       t?.user_id ??
//       t?.userId ??
//       t?.reporter_id ??
//       t?.owner ??
//       t?.created_by ??
//       t?.assigned_to_id ??
//       t?.assigned_to?.id ??
//       null;

//     return {
//       id,
//       subject,
//       name,
//       displaySubject: subject ?? name ?? "No subject",
//       email,
//       status: statusKey,
//       statusDisplay,
//       created_at,
//       created_at_display,
//       preview,
//       raw: t,
//       ticketUserId,
//     };
//   }

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

//   // Helper: check whether a normalized ticket belongs to the effective user id
//   function ticketBelongsToUser(normalized, effId, effEmail) {
//     if (!effId && !effEmail) return false;
//     // compare to possible identifiers and emails
//     const raw = normalized.raw ?? {};
//     const idCandidates = [
//       normalized.ticketUserId,
//       raw?.user_id,
//       raw?.userId,
//       raw?.reporter_id,
//       raw?.owner,
//       raw?.created_by,
//       raw?.user?.id,
//       raw?.reporter?.id,
//       raw?.assigned_to_id,
//       raw?.assigned_to?.id,
//     ];
//     const emailCandidates = [
//       normalized.email,
//       raw?.email,
//       raw?.reporter_email,
//       raw?.user_email,
//       raw?.customer_email,
//       raw?.assigned_to_email,
//       raw?.reporter?.email,
//       raw?.user?.email,
//     ];

//     const idMatch = effId
//       ? idCandidates.some((c) => c != null && String(c) === String(effId))
//       : false;
//     const emailMatch = effEmail
//       ? emailCandidates.some(
//           (c) => c && String(c).toLowerCase() === String(effEmail).toLowerCase()
//         )
//       : false;

//     return idMatch || emailMatch;
//   }

//   // Fetch tickets by user id using the required endpoint
//   useEffect(() => {
//     // If tickets are supplied as prop, normalize *and filter* them by user id
//     if (ticketsProp && !forceFetch) {
//       const arr = Array.isArray(ticketsProp) ? ticketsProp : [ticketsProp];
//       const normalized = arr.map(normalizeTicket);
//       const shouldFilter = Boolean(effectiveUserId || effectiveUserEmail);
//       const filteredByUser = shouldFilter
//         ? normalized.filter((n) =>
//             ticketBelongsToUser(n, effectiveUserId, effectiveUserEmail)
//           )
//         : normalized;

//       setTickets(filteredByUser);
//       if (filteredByUser.length > 0 && !selected)
//         setSelected?.(filteredByUser[0]);
//       setLoading(false);
//       setError(null);
//       return;
//     }

//     let mounted = true;
//     const ac = new AbortController();

//     async function load() {
//       if (!effectiveUserId && !effectiveUserEmail) {
//         setTickets([]);
//         setLoading(false);
//         setError("No user identity to fetch tickets for.");
//         return;
//       }

//       setLoading(true);
//       setError(null);

//       // For customers: use email-based filtering endpoint
//       let endpointRelative;
//       let requestMethod = "GET";
//       let requestBody = null;

//       if (effectiveUserEmail) {
//         // Use POST with email in body for customer filtering
//         endpointRelative = `/filter-ticket/by-user-email/`;
//         requestMethod = "POST";
//         requestBody = { email: effectiveUserEmail };
//       } else if (effectiveUserId) {
//         endpointRelative = `/filter-ticket/by-user-id/${effectiveUserId}/`;
//       } else {
//         endpointRelative = `/tickets/`;
//       }

//       try {
//         let data;
//         if (api && typeof api[requestMethod.toLowerCase()] === "function") {
//           const headers = token ? { Authorization: `Bearer ${token}` } : {};
//           try {
//             if (requestMethod === "POST" && requestBody) {
//               const res = await api.post(endpointRelative, requestBody, {
//                 headers,
//                 signal: ac.signal,
//               });
//               data = res?.data;
//             } else {
//               const res = await api.get(endpointRelative, {
//                 headers,
//                 signal: ac.signal,
//               });
//               data = res?.data;
//             }
//           } catch (err) {
//             if (
//               effectiveUserId &&
//               (err?.response?.status === 404 || err?.response?.status === 405)
//             ) {
//               const res2 = await api.get(`/filter-ticket/by-user-id/`, {
//                 headers,
//                 params: { id: effectiveUserId },
//                 signal: ac.signal,
//               });
//               data = res2?.data;
//             } else {
//               throw err;
//             }
//           }
//         } else {
//           const base =
//             typeof window !== "undefined"
//               ? process.env.NEXT_PUBLIC_API_BASE
//               : undefined;
//           const endpoint = base
//             ? `${base.replace(/\/$/, "")}${endpointRelative}`
//             : endpointRelative;

//           const res = await fetch(endpoint, {
//             method: requestMethod,
//             headers: {
//               "Content-Type": "application/json",
//               ...(token ? { Authorization: `Bearer ${token}` } : {}),
//             },
//             body: requestBody ? JSON.stringify(requestBody) : undefined,
//             signal: ac.signal,
//           });
//           if (!res.ok) {
//             const text = await res.text().catch(() => "");
//             throw new Error(`Failed to load (${res.status}) ${text}`);
//           }
//           data = await res.json().catch(() => null);
//         }

//         if (!mounted) return;

//         // normalize response — expect an array (per your example)
//         let arr = [];
//         if (!data) arr = [];
//         else if (Array.isArray(data)) arr = data;
//         else if (Array.isArray(data.results)) arr = data.results;
//         else if (Array.isArray(data.data)) arr = data.data;
//         else if (Array.isArray(data.tickets)) arr = data.tickets;
//         else arr = [data];

//         const normalized = arr.map(normalizeTicket);

//         // double-check server-side filtering — keep only tickets that match the effective user id
//         const shouldFilter = Boolean(effectiveUserId || effectiveUserEmail);
//         const filteredByUser = shouldFilter
//           ? normalized.filter((n) =>
//               ticketBelongsToUser(n, effectiveUserId, effectiveUserEmail)
//             )
//           : normalized;

//         setTickets(filteredByUser);

//         // auto-select first if none selected
//         if (filteredByUser.length > 0 && !selected) {
//           setSelected?.(filteredByUser[0]);
//         }
//       } catch (err) {
//         if (err.name === "AbortError") return;
//         console.error("Failed to fetch tickets by user id:", err);
//         setError(err.message || "Failed to load tickets");
//         setTickets([]);
//       } finally {
//         if (mounted) setLoading(false);
//       }
//     }

//     load();

//     return () => {
//       mounted = false;
//       ac.abort();
//     };
//   }, [
//     effectiveUserId,
//     effectiveUserEmail,
//     token,
//     ticketsProp,
//     setSelected,
//     selected,
//     forceFetch,
//   ]);

//   const owned = useMemo(
//     () => (Array.isArray(tickets) ? tickets : []),
//     [tickets]
//   );

//   // counts based on normalized status mapping
//   const counts = useMemo(() => {
//     const map = { all: owned.length, active: 0, pending: 0, resolved: 0 };
//     owned.forEach((t) => {
//       const s = (t.status ?? "").toLowerCase();
//       if (s === "pending" || s === "waiting") map.pending++;
//       else if (s === "resolved") map.resolved++;
//       else map.active++;
//     });
//     return map;
//   }, [owned]);

//   const filtered = useMemo(() => {
//     if (!activeTab || activeTab === "all") return owned;
//     return owned.filter((t) => {
//       const s = (t.status ?? "").toLowerCase();
//       if (activeTab === "pending") return s === "pending" || s === "waiting";
//       if (activeTab === "Resolved") return s === "resolved";
//       // fallback: exact match
//       return s === activeTab;
//     });
//   }, [owned, activeTab]);

//   const listItem = {
//     hidden: { opacity: 0, y: 8 },
//     visible: { opacity: 1, y: 0 },
//   };

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

//   return (
//     <motion.div layout className="bg-white rounded-lg shadow-sm p-0">
//       <div className="h-[calc(100vh-300px)] md:h-[600px] lg:h-[520px] overflow-auto">
//         <div className="sticky top-0 z-30 bg-white border-b border-slate-200">
//           <div className="flex items-center justify-between p-4">
//             <h3 className="text-lg font-medium text-slate-800">Your Tickets</h3>
//             <div className="text-sm text-slate-500">
//               {loading
//                 ? "…"
//                 : `${owned.length} ticket${owned.length === 1 ? "" : "s"}`}
//             </div>
//           </div>

//           <div className="px-4 pb-3">
//             <div
//               role="tablist"
//               aria-label="Ticket filters"
//               className="flex gap-2 overflow-x-auto whitespace-nowrap px-1 py-1"
//             >
//               {TABS.map((t) => {
//                 const active = activeTab === t.id;
//                 return (
//                   <button
//                     key={t.id}
//                     role="tab"
//                     aria-selected={active}
//                     onClick={() => setActiveTab(t.id)}
//                     className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition ${
//                       active
//                         ? "bg-slate-900 text-white shadow"
//                         : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
//                     }`}
//                   >
//                     <span>{t.label}</span>
//                     <span className="inline-flex items-center justify-center px-2 py-0.5 text-xs rounded-full bg-slate-100 text-slate-700">
//                       {counts[t.id] ?? (t.id === "all" ? owned.length : 0)}
//                     </span>
//                   </button>
//                 );
//               })}
//             </div>
//           </div>
//         </div>

//         <div className="p-4">
//           {loading ? (
//             <div className="p-6 flex items-center justify-center gap-2 text-sm text-slate-500">
//               <div className="w-4 h-4 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
//               <span>Loading tickets…</span>
//             </div>
//           ) : error ? (
//             <div className="p-4 text-sm text-red-600">{error}</div>
//           ) : filtered.length === 0 ? (
//             <div className="p-6 text-sm text-slate-500 text-center">
//               <p className="font-medium">No tickets found</p>
//               <p className="text-xs mt-1">Create a new ticket to get started</p>
//             </div>
//           ) : (
//             <ul className="space-y-3">
//               {filtered.map((t, idx) => {
//                 const subject = t.displaySubject ?? "No subject";
//                 const email = t.email ?? "";
//                 const statusKey = (t.status ?? "active").toLowerCase();
//                 const previewLabel = (t.preview || "").toString().trim();
//                 const statusLabel =
//                   previewLabel ||
//                   t.statusDisplay ||
//                   (statusKey
//                     ? statusKey.charAt(0).toUpperCase() + statusKey.slice(1)
//                     : "—");
//                 const time = t.created_at ?? "";
//                 const assignedToId =
//                   t.raw?.assigned_to_id ??
//                   t.raw?.assigned_to ??
//                   t.raw?.agent_id ??
//                   t.assigned_to_id ??
//                   t.assigned_to ??
//                   null;
//                 const assignedUser =
//                   directory.find(
//                     (person) =>
//                       person?.id && String(person.id) === String(assignedToId)
//                   ) ?? null;
//                 const assignedLabel =
//                   assignedUser?.name && assignedUser.name !== "null"
//                     ? assignedUser.name
//                     : assignedUser?.username ??
//                       assignedUser?.email ??
//                       t.raw?.assigned_to_name ??
//                       null;
//                 const pillClass =
//                   statusKey === "resolved"
//                     ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
//                     : statusKey === "waiting"
//                     ? "bg-amber-50 text-amber-700 border border-amber-100"
//                     : statusKey === "pending"
//                     ? "bg-amber-50 text-amber-700 border border-amber-100"
//                     : statusKey === "active" || statusKey === "open"
//                     ? "bg-sky-50 text-sky-700 border border-sky-100"
//                     : "bg-slate-50 text-slate-700 border border-slate-100";

//                 return (
//                   <motion.li
//                     key={t.id ?? `${idx}-${email}`}
//                     initial="hidden"
//                     animate="visible"
//                     variants={listItem}
//                     className={`bg-white rounded-lg p-4 border border-slate-200 flex items-center justify-between shadow-sm cursor-pointer transition-colors ${
//                       selected?.id === t.id
//                         ? "ring-2 ring-blue-500 bg-blue-50"
//                         : "hover:bg-slate-50"
//                     }`}
//                     onClick={() => {
//                       setSelected?.(t);
//                       // On mobile, scroll chat into view after selection
//                       if (
//                         typeof window !== "undefined" &&
//                         window.innerWidth < 1024
//                       ) {
//                         setTimeout(() => {
//                           const chatElement =
//                             document.querySelector("[data-chat-box]");
//                           if (chatElement) {
//                             chatElement.scrollIntoView({
//                               behavior: "smooth",
//                               block: "nearest",
//                             });
//                           }
//                         }, 100);
//                       }
//                     }}
//                   >
//                     <div className="min-w-0">
//                       <div className="font-medium text-slate-800 truncate">
//                         {subject}
//                       </div>
//                       <div className="text-xs text-slate-500 mt-1 truncate">
//                         {email || t.name || "From Widget"}
//                       </div>
//                     </div>

//                     <div className="text-right flex-shrink-0 flex flex-col items-end ml-4">
//                       <span
//                         className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-medium ${pillClass}`}
//                       >
//                         {statusKey.charAt(0).toUpperCase() + statusKey.slice(1)}
//                       </span>
//                       {t.raw?.escalated === true &&
//                         statusKey !== "Resolved" && (
//                           <span className="mt-1 inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-purple-50 text-red-700 border border-purple-100">
//                             <GoAlertFill />
//                             Escalated
//                           </span>
//                         )}
//                       <div className="text-xs text-slate-400 mt-2">
//                         {formatMaybeDate(time, t.created_at_display)}
//                       </div>
//                     </div>
//                   </motion.li>
//                 );
//               })}
//             </ul>
//           )}
//         </div>
//       </div>
//     </motion.div>
//   );
// }

// "use client";

// import React, { useEffect, useMemo, useState } from "react";
// import { motion } from "framer-motion";
// import { format, isValid } from "date-fns";
// import { useAuth } from "@/context/AuthContext";
// import { useUsersDirectory } from "@/hooks/useUsersDirectory";
// import { GoAlertFill } from "react-icons/go";
// import { calculateResolutionTime } from "@/lib/resolutionTime";
// import Skeleton, { ChatListSkeleton } from "@/components/ui/Skeleton";

// let api = null;
// try {
//   api = require("@/lib/axios").default;
// } catch (e) {
//   api = null;
// }

// /**
//  * ChatList
//  *
//  * - Fetches tickets by email when effectiveUserEmail is present using:
//  *   POST /filter-ticket/by-user-email/ { email }
//  * - Falls back to fetching by user id when email is not available.
//  */
// export default function ChatList({
//   tickets: ticketsProp = null,
//   selected,
//   setSelected,
//   loading: loadingProp = false,
//   userId: propUserId = null,
//   userEmail: propUserEmail = null,
//   forceFetch = false,
// }) {
//   const { user, token } = useAuth?.() ?? {};
//   const { users: directory } = useUsersDirectory({ enabled: true });

//   const authUserId =
//     user?.app_user_id ??
//     user?.appUserId ??
//     user?.user_id ??
//     user?.userId ??
//     user?.id ??
//     user?.uid ??
//     user?.pk ??
//     null;

//   const authUserEmail =
//     user?.email ??
//     user?.username ??
//     (Array.isArray(user?.emails) ? user.emails[0] : null) ??
//     user?.contact_email ??
//     null;

//   const effectiveUserId = propUserId ?? authUserId;
//   const effectiveUserEmail = propUserEmail ?? authUserEmail;

//   const [tickets, setTickets] = useState([]);
//   const [loading, setLoading] = useState(Boolean(loadingProp || !ticketsProp));
//   const [error, setError] = useState(null);
//   const [activeTab, setActiveTab] = useState("all");

//   const TABS = [
//     { id: "all", label: "All" },
//     { id: "pending", label: "Pending" },
//     { id: "resolved", label: "Resolved" },
//   ];

//   function normalizeTicket(t) {
//     const id = t?.id ?? t?.pk ?? null;
//     const subject = t?.subject ?? t?.title ?? null;
//     const name = t?.name ?? t?.reporter_name ?? null;
//     const email = t?.email ?? t?.reporter_email ?? "";

//     const progressLabel =
//       typeof t?.ticket_status === "string" && t.ticket_status.trim().length > 0
//         ? t.ticket_status.trim()
//         : null;
//     const statusBool = typeof t?.status === "boolean" ? t.status : undefined;
//     const statusStr = typeof t?.status === "string" ? t.status : undefined;
//     const ticketStatusStr =
//       typeof t?.ticket_status === "string" ? t.ticket_status : undefined;

//     let statusDisplay;
//     if (ticketStatusStr && ticketStatusStr.trim().length > 0) {
//       const ticketStatusLower = ticketStatusStr.toLowerCase();
//       if (ticketStatusLower === "resolved") {
//         statusDisplay = "Resolved";
//       } else if (
//         ticketStatusLower === "pending" ||
//         ticketStatusLower === "waiting"
//       ) {
//         statusDisplay = "Pending";
//       } else if (ticketStatusLower === "escalated") {
//         statusDisplay = "Escalated";
//       } else {
//         statusDisplay = ticketStatusStr.trim();
//       }
//     } else if (progressLabel) {
//       statusDisplay = progressLabel;
//     } else if (statusBool === true) {
//       statusDisplay = "Resolved";
//     } else if (typeof statusStr === "string" && statusStr.trim().length > 0) {
//       statusDisplay = statusStr.trim();
//     } else {
//       statusDisplay = "Active";
//     }

//     const statusKey = statusDisplay ? statusDisplay.toLowerCase() : "active";

//     const created_at = t?.created_at ?? t?.createdAt ?? t?.pub_date ?? null;
//     const created_at_display = t?.created_at_display ?? null;
//     const preview =
//       t?.preview ??
//       (t?.progress ? String(t.progress).slice(0, 80) : "") ??
//       null;

//     const ticketUserId =
//       t?.user_id ??
//       t?.userId ??
//       t?.reporter_id ??
//       t?.owner ??
//       t?.created_by ??
//       t?.assigned_to_id ??
//       t?.assigned_to?.id ??
//       null;

//     return {
//       id,
//       subject,
//       name,
//       displaySubject: subject ?? name ?? "No subject",
//       email,
//       status: statusKey,
//       statusDisplay,
//       created_at,
//       created_at_display,
//       preview,
//       raw: t,
//       ticketUserId,
//     };
//   }

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

//   function ticketBelongsToUser(normalized, effId, effEmail) {
//     if (!effId && !effEmail) return false;
//     const raw = normalized.raw ?? {};
//     const idCandidates = [
//       normalized.ticketUserId,
//       raw?.user_id,
//       raw?.userId,
//       raw?.reporter_id,
//       raw?.owner,
//       raw?.created_by,
//       raw?.user?.id,
//       raw?.reporter?.id,
//       raw?.assigned_to_id,
//       raw?.assigned_to?.id,
//     ];
//     const emailCandidates = [
//       normalized.email,
//       raw?.email,
//       raw?.reporter_email,
//       raw?.user_email,
//       raw?.customer_email,
//       raw?.assigned_to_email,
//       raw?.reporter?.email,
//       raw?.user?.email,
//     ];

//     const idMatch = effId
//       ? idCandidates.some((c) => c != null && String(c) === String(effId))
//       : false;
//     const emailMatch = effEmail
//       ? emailCandidates.some(
//           (c) => c && String(c).toLowerCase() === String(effEmail).toLowerCase()
//         )
//       : false;

//     return idMatch || emailMatch;
//   }

//   useEffect(() => {
//     if (ticketsProp && !forceFetch) {
//       const arr = Array.isArray(ticketsProp) ? ticketsProp : [ticketsProp];
//       const normalized = arr.map(normalizeTicket);
//       const shouldFilter = Boolean(effectiveUserId || effectiveUserEmail);
//       const filteredByUser = shouldFilter
//         ? normalized.filter((n) =>
//             ticketBelongsToUser(n, effectiveUserId, effectiveUserEmail)
//           )
//         : normalized;

//       setTickets(filteredByUser);
//       if (filteredByUser.length > 0 && !selected)
//         setSelected?.(filteredByUser[0]);
//       setLoading(false);
//       setError(null);
//       return;
//     }

//     let mounted = true;
//     const ac = new AbortController();

//     async function load() {
//       if (!effectiveUserEmail && !effectiveUserId) {
//         setTickets([]);
//         setLoading(false);
//         setError("No user email or identity to fetch tickets for.");
//         return;
//       }

//       setLoading(true);
//       setError(null);

//       let endpointRelative;
//       let requestMethod = "GET";
//       let requestBody = null;

//       if (effectiveUserEmail) {
//         // Use POST with email in body for customer filtering as requested
//         endpointRelative = `/filter-ticket/by-user-email/`;
//         requestMethod = "POST";
//         requestBody = { email: effectiveUserEmail };
//       } else {
//         endpointRelative = `/filter-ticket/by-user-id/${effectiveUserId}/`;
//       }

//       try {
//         let data;
//         if (api && typeof api[requestMethod.toLowerCase()] === "function") {
//           const headers = token ? { Authorization: `Bearer ${token}` } : {};

//           if (requestMethod === "POST" && requestBody) {
//             const res = await api.post(endpointRelative, requestBody, {
//               headers,
//               signal: ac.signal,
//             });
//             data = res?.data;
//           } else {
//             const res = await api.get(endpointRelative, {
//               headers,
//               signal: ac.signal,
//             });
//             data = res?.data;
//           }
//         } else {
//           const base =
//             typeof window !== "undefined"
//               ? process.env.NEXT_PUBLIC_API_BASE
//               : undefined;
//           const endpoint = base
//             ? `${base.replace(/\/$/, "")}${endpointRelative}`
//             : endpointRelative;

//           const res = await fetch(endpoint, {
//             method: requestMethod,
//             headers: {
//               "Content-Type": "application/json",
//               ...(token ? { Authorization: `Bearer ${token}` } : {}),
//             },
//             body: requestBody ? JSON.stringify(requestBody) : undefined,
//             signal: ac.signal,
//           });
//           if (!res.ok) {
//             const text = await res.text().catch(() => "");
//             throw new Error(`Failed to load (${res.status}) ${text}`);
//           }
//           data = await res.json().catch(() => null);
//         }

//         if (!mounted) return;

//         let arr = [];
//         if (!data) arr = [];
//         else if (Array.isArray(data)) arr = data;
//         else if (Array.isArray(data.results)) arr = data.results;
//         else if (Array.isArray(data.data)) arr = data.data;
//         else if (Array.isArray(data.tickets)) arr = data.tickets;
//         else arr = [data];

//         const normalized = arr.map(normalizeTicket);
//         const shouldFilter = Boolean(effectiveUserId || effectiveUserEmail);
//         const filteredByUser = shouldFilter
//           ? normalized.filter((n) =>
//               ticketBelongsToUser(n, effectiveUserId, effectiveUserEmail)
//             )
//           : normalized;

//         setTickets(filteredByUser);

//         if (filteredByUser.length > 0 && !selected) {
//           setSelected?.(filteredByUser[0]);
//         }
//       } catch (err) {
//         if (err.name === "AbortError") return;
//         console.error("Failed to fetch tickets by user id/email:", err);
//         setError(err.message || "Failed to load tickets");
//         setTickets([]);
//       } finally {
//         if (mounted) setLoading(false);
//       }
//     }

//     load();

//     return () => {
//       mounted = false;
//       ac.abort();
//     };
//   }, [
//     effectiveUserId,
//     effectiveUserEmail,
//     token,
//     ticketsProp,
//     setSelected,
//     selected,
//     forceFetch,
//   ]);

//   const owned = useMemo(
//     () => (Array.isArray(tickets) ? tickets : []),
//     [tickets]
//   );

//   const counts = useMemo(() => {
//     const map = { all: owned.length, active: 0, pending: 0, resolved: 0 };
//     owned.forEach((t) => {
//       const s = (t.status ?? "").toLowerCase();
//       if (s === "pending" || s === "waiting") map.pending++;
//       else if (s === "resolved") map.resolved++;
//       else map.active++;
//     });
//     return map;
//   }, [owned]);

//   const filtered = useMemo(() => {
//     if (!activeTab || activeTab === "all") return owned;
//     return owned.filter((t) => {
//       const s = (t.status ?? "").toLowerCase();
//       if (activeTab === "pending") return s === "pending" || s === "waiting";
//       if (activeTab === "resolved") return s === "resolved";
//       return s === activeTab;
//     });
//   }, [owned, activeTab]);

//   const listItem = {
//     hidden: { opacity: 0, y: 8 },
//     visible: { opacity: 1, y: 0 },
//   };

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

//   return (
//     <motion.div layout className="bg-white rounded-lg shadow-sm p-0">
//       <div className="h-[calc(100vh-300px)] md:h-[600px] lg:h-[520px] overflow-auto">
//         <div className="sticky top-0 z-30 bg-white border-b border-slate-200">
//           <div className="flex items-center justify-between p-4">
//             <h3 className="text-lg font-medium text-slate-800">Your Tickets</h3>
//             <div className="text-sm text-slate-500">
//               {loading
//                 ? "…"
//                 : `${owned.length} ticket${owned.length === 1 ? "" : "s"}`}
//             </div>
//           </div>

//           <div className="px-4 pb-3">
//             <div
//               role="tablist"
//               aria-label="Ticket filters"
//               className="flex gap-2 overflow-x-auto whitespace-nowrap px-1 py-1"
//             >
//               {TABS.map((t) => {
//                 const active = activeTab === t.id;
//                 return (
//                   <button
//                     key={t.id}
//                     role="tab"
//                     aria-selected={active}
//                     onClick={() => setActiveTab(t.id)}
//                     className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition ${
//                       active
//                         ? "bg-slate-900 text-white shadow"
//                         : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
//                     }`}
//                   >
//                     <span>{t.label}</span>
//                     <span className="inline-flex items-center justify-center px-2 py-0.5 text-xs rounded-full bg-slate-100 text-slate-700">
//                       {counts[t.id] ?? (t.id === "all" ? owned.length : 0)}
//                     </span>
//                   </button>
//                 );
//               })}
//             </div>
//           </div>
//         </div>

//         <div className="p-4">
//           {loading ? (
//             <ChatListSkeleton />
//           ) : error ? (
//             <div className="p-4 text-sm text-red-600">{error}</div>
//           ) : filtered.length === 0 ? (
//             <div className="p-6 text-sm text-slate-500 text-center">
//               <p className="font-medium">No tickets found</p>
//               <p className="text-xs mt-1">Create a new ticket to get started</p>
//             </div>
//           ) : (
//             <ul className="space-y-3">
//               {filtered.map((t, idx) => {
//                 const subject = t.displaySubject ?? "No subject";
//                 const email = t.email ?? "";
//                 const statusKey = (t.status ?? "active").toLowerCase();
//                 const previewLabel = (t.preview || "").toString().trim();
//                 const statusLabel =
//                   previewLabel ||
//                   t.statusDisplay ||
//                   (statusKey
//                     ? statusKey.charAt(0).toUpperCase() + statusKey.slice(1)
//                     : "—");
//                 const time = t.created_at ?? "";
//                 const resolvedAt = t.raw?.resolved_at ?? t.resolved_at ?? null;
//                 const resolutionTime = calculateResolutionTime(
//                   t.created_at,
//                   resolvedAt,
//                   t.status || t.ticket_status
//                 );
//                 const assignedToId =
//                   t.raw?.assigned_to_id ??
//                   t.raw?.assigned_to ??
//                   t.raw?.agent_id ??
//                   t.assigned_to_id ??
//                   t.assigned_to ??
//                   null;
//                 const assignedUser =
//                   directory.find(
//                     (person) =>
//                       person?.id && String(person.id) === String(assignedToId)
//                   ) ?? null;
//                 const assignedLabel =
//                   assignedUser?.name && assignedUser.name !== "null"
//                     ? assignedUser.name
//                     : assignedUser?.username ??
//                       assignedUser?.email ??
//                       t.raw?.assigned_to_name ??
//                       null;
//                 const pillClass =
//                   statusKey === "resolved"
//                     ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
//                     : statusKey === "waiting"
//                     ? "bg-amber-50 text-amber-700 border border-amber-100"
//                     : statusKey === "pending"
//                     ? "bg-amber-50 text-amber-700 border border-amber-100"
//                     : statusKey === "active" || statusKey === "open"
//                     ? "bg-sky-50 text-sky-700 border border-sky-100"
//                     : "bg-slate-50 text-slate-700 border border-slate-100";

//                 return (
//                   <motion.li
//                     key={t.id ?? `${idx}-${email}`}
//                     initial="hidden"
//                     animate="visible"
//                     variants={listItem}
//                     className={`bg-white rounded-lg p-4 border border-slate-200 flex items-center justify-between shadow-sm cursor-pointer transition-colors ${
//                       selected?.id === t.id
//                         ? "ring-2 ring-blue-500 bg-blue-50"
//                         : "hover:bg-slate-50"
//                     }`}
//                     onClick={() => {
//                       setSelected?.(t);
//                       if (
//                         typeof window !== "undefined" &&
//                         window.innerWidth < 1024
//                       ) {
//                         setTimeout(() => {
//                           const chatElement =
//                             document.querySelector("[data-chat-box]");
//                           if (chatElement) {
//                             chatElement.scrollIntoView({
//                               behavior: "smooth",
//                               block: "nearest",
//                             });
//                           }
//                         }, 100);
//                       }
//                     }}
//                   >
//                     <div className="min-w-0">
//                       <div className="font-medium text-slate-800 truncate">
//                         {subject}
//                       </div>
//                       <div className="text-xs text-slate-500 mt-1 truncate">
//                         {email || t.name || "From Widget"}
//                       </div>
//                     </div>

//                     <div className="text-right flex-shrink-0 flex flex-col items-end ml-4">
//                       <span
//                         className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-medium ${pillClass}`}
//                       >
//                         {statusKey.charAt(0).toUpperCase() + statusKey.slice(1)}
//                       </span>
//                       {t.raw?.escalated === true &&
//                         statusKey !== "Resolved" && (
//                           <span className="mt-1 inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-purple-50 text-red-700 border border-purple-100">
//                             <GoAlertFill />
//                             Escalated
//                           </span>
//                         )}
//                       <div className="text-xs text-slate-400 mt-2">
//                         {formatMaybeDate(time)}
//                       </div>
//                       {resolutionTime && (
//                         <div className="text-xs text-emerald-600 mt-1 font-medium">
//                           Resolved in {resolutionTime}
//                         </div>
//                       )}
//                     </div>
//                   </motion.li>
//                 );
//               })}
//             </ul>
//           )}
//         </div>
//       </div>
//     </motion.div>
//   );
// }



"use client";

import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { format, isValid } from "date-fns";
import { useAuth } from "@/context/AuthContext";
import { useUsersDirectory } from "@/hooks/useUsersDirectory";
import { GoAlertFill } from "react-icons/go";
import { calculateResolutionTime } from "@/lib/resolutionTime";
import Skeleton, { ChatListSkeleton } from "@/components/ui/Skeleton";

let api = null;
try {
  api = require("@/lib/axios").default;
} catch (e) {
  api = null;
}

/**
 * ChatList
 *
 * - Fetches tickets by email when effectiveUserEmail is present using:
 *   POST /filter-ticket/by-user-email/ { email }
 * - Falls back to fetching by user id when email is not available.
 */
export default function ChatList({
  tickets: ticketsProp = null,
  selected,
  setSelected,
  loading: loadingProp = false,
  userId: propUserId = null,
  userEmail: propUserEmail = null,
  forceFetch = false,
}) {
  const { user, token } = useAuth?.() ?? {};
  const { users: directory } = useUsersDirectory({ enabled: true });

  const authUserId =
    user?.app_user_id ??
    user?.appUserId ??
    user?.user_id ??
    user?.userId ??
    user?.id ??
    user?.uid ??
    user?.pk ??
    null;

  const authUserEmail =
    user?.email ??
    user?.username ??
    (Array.isArray(user?.emails) ? user.emails[0] : null) ??
    user?.contact_email ??
    null;

  const effectiveUserId = propUserId ?? authUserId;
  const effectiveUserEmail = propUserEmail ?? authUserEmail;

  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(Boolean(loadingProp || !ticketsProp));
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("all");

  const TABS = [
    { id: "all", label: "All" },
    { id: "pending", label: "Pending" },
    { id: "resolved", label: "Resolved" },
  ];

  function normalizeTicket(t) {
    const id = t?.id ?? t?.pk ?? null;
    const subject = t?.subject ?? t?.title ?? null;
    const name = t?.name ?? t?.reporter_name ?? null;
    const email = t?.email ?? t?.reporter_email ?? "";

    const progressLabel =
      typeof t?.ticket_status === "string" && t.ticket_status.trim().length > 0
        ? t.ticket_status.trim()
        : null;
    const statusBool = typeof t?.status === "boolean" ? t.status : undefined;
    const statusStr = typeof t?.status === "string" ? t.status : undefined;
    const ticketStatusStr =
      typeof t?.ticket_status === "string" ? t.ticket_status : undefined;

    let statusDisplay;
    if (ticketStatusStr && ticketStatusStr.trim().length > 0) {
      const ticketStatusLower = ticketStatusStr.toLowerCase();
      if (ticketStatusLower === "resolved") {
        statusDisplay = "Resolved";
      } else if (
        ticketStatusLower === "pending" ||
        ticketStatusLower === "waiting"
      ) {
        statusDisplay = "Pending";
      } else if (ticketStatusLower === "escalated") {
        statusDisplay = "Escalated";
      } else {
        statusDisplay = ticketStatusStr.trim();
      }
    } else if (progressLabel) {
      statusDisplay = progressLabel;
    } else if (statusBool === true) {
      statusDisplay = "Resolved";
    } else if (typeof statusStr === "string" && statusStr.trim().length > 0) {
      statusDisplay = statusStr.trim();
    } else {
      statusDisplay = "Active";
    }

    const statusKey = statusDisplay ? statusDisplay.toLowerCase() : "active";

    const created_at = t?.created_at ?? t?.createdAt ?? t?.pub_date ?? null;
    const created_at_display = t?.created_at_display ?? null;
    const preview =
      t?.preview ??
      (t?.progress ? String(t.progress).slice(0, 80) : "") ??
      null;

    const ticketUserId =
      t?.user_id ??
      t?.userId ??
      t?.reporter_id ??
      t?.owner ??
      t?.created_by ??
      t?.assigned_to_id ??
      t?.assigned_to?.id ??
      null;

    return {
      id,
      subject,
      name,
      displaySubject: subject ?? name ?? "No subject",
      email,
      status: statusKey,
      statusDisplay,
      created_at,
      created_at_display,
      preview,
      raw: t,
      ticketUserId,
    };
  }

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

  function ticketBelongsToUser(normalized, effId, effEmail) {
    if (!effId && !effEmail) return false;
    const raw = normalized.raw ?? {};
    const idCandidates = [
      normalized.ticketUserId,
      raw?.user_id,
      raw?.userId,
      raw?.reporter_id,
      raw?.owner,
      raw?.created_by,
      raw?.user?.id,
      raw?.reporter?.id,
      raw?.assigned_to_id,
      raw?.assigned_to?.id,
    ];
    const emailCandidates = [
      normalized.email,
      raw?.email,
      raw?.reporter_email,
      raw?.user_email,
      raw?.customer_email,
      raw?.assigned_to_email,
      raw?.reporter?.email,
      raw?.user?.email,
    ];

    const idMatch = effId
      ? idCandidates.some((c) => c != null && String(c) === String(effId))
      : false;
    const emailMatch = effEmail
      ? emailCandidates.some(
          (c) => c && String(c).toLowerCase() === String(effEmail).toLowerCase()
        )
      : false;

    return idMatch || emailMatch;
  }

  useEffect(() => {
    if (ticketsProp && !forceFetch) {
      const arr = Array.isArray(ticketsProp) ? ticketsProp : [ticketsProp];
      const normalized = arr.map(normalizeTicket);
      const shouldFilter = Boolean(effectiveUserId || effectiveUserEmail);
      const filteredByUser = shouldFilter
        ? normalized.filter((n) =>
            ticketBelongsToUser(n, effectiveUserId, effectiveUserEmail)
          )
        : normalized;

      setTickets(filteredByUser);

      // ===== Desktop-only auto-select =====
      if (
        filteredByUser.length > 0 &&
        !selected &&
        (typeof window === "undefined" || window.innerWidth >= 1024)
      ) {
        setSelected?.(filteredByUser[0]);
      }

      setLoading(false);
      setError(null);
      return;
    }

    let mounted = true;
    const ac = new AbortController();

    async function load() {
      if (!effectiveUserEmail && !effectiveUserId) {
        setTickets([]);
        setLoading(false);
        setError("No user email or identity to fetch tickets for.");
        return;
      }

      setLoading(true);
      setError(null);

      let endpointRelative;
      let requestMethod = "GET";
      let requestBody = null;

      if (effectiveUserEmail) {
        // Use POST with email in body for customer filtering as requested
        endpointRelative = `/filter-ticket/by-user-email/`;
        requestMethod = "POST";
        requestBody = { email: effectiveUserEmail };
      } else {
        endpointRelative = `/filter-ticket/by-user-id/${effectiveUserId}/`;
      }

      try {
        let data;
        if (api && typeof api[requestMethod.toLowerCase()] === "function") {
          const headers = token ? { Authorization: `Bearer ${token}` } : {};

          if (requestMethod === "POST" && requestBody) {
            const res = await api.post(endpointRelative, requestBody, {
              headers,
              signal: ac.signal,
            });
            data = res?.data;
          } else {
            const res = await api.get(endpointRelative, {
              headers,
              signal: ac.signal,
            });
            data = res?.data;
          }
        } else {
          const base =
            typeof window !== "undefined"
              ? process.env.NEXT_PUBLIC_API_BASE
              : undefined;
          const endpoint = base
            ? `${base.replace(/\/$/, "")}${endpointRelative}`
            : endpointRelative;

          const res = await fetch(endpoint, {
            method: requestMethod,
            headers: {
              "Content-Type": "application/json",
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: requestBody ? JSON.stringify(requestBody) : undefined,
            signal: ac.signal,
          });
          if (!res.ok) {
            const text = await res.text().catch(() => "");
            throw new Error(`Failed to load (${res.status}) ${text}`);
          }
          data = await res.json().catch(() => null);
        }

        if (!mounted) return;

        let arr = [];
        if (!data) arr = [];
        else if (Array.isArray(data)) arr = data;
        else if (Array.isArray(data.results)) arr = data.results;
        else if (Array.isArray(data.data)) arr = data.data;
        else if (Array.isArray(data.tickets)) arr = data.tickets;
        else arr = [data];

        const normalized = arr.map(normalizeTicket);
        const shouldFilter = Boolean(effectiveUserId || effectiveUserEmail);
        const filteredByUser = shouldFilter
          ? normalized.filter((n) =>
              ticketBelongsToUser(n, effectiveUserId, effectiveUserEmail)
            )
          : normalized;

        setTickets(filteredByUser);

        // ===== Desktop-only auto-select =====
        if (
          filteredByUser.length > 0 &&
          !selected &&
          (typeof window === "undefined" || window.innerWidth >= 1024)
        ) {
          setSelected?.(filteredByUser[0]);
        }
      } catch (err) {
        if (err.name === "AbortError") return;
        console.error("Failed to fetch tickets by user id/email:", err);
        setError(err.message || "Failed to load tickets");
        setTickets([]);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();

    return () => {
      mounted = false;
      ac.abort();
    };
  }, [
    effectiveUserId,
    effectiveUserEmail,
    token,
    ticketsProp,
    setSelected,
    selected,
    forceFetch,
  ]);

  const owned = useMemo(
    () => (Array.isArray(tickets) ? tickets : []),
    [tickets]
  );

  const counts = useMemo(() => {
    const map = { all: owned.length, active: 0, pending: 0, resolved: 0 };
    owned.forEach((t) => {
      const s = (t.status ?? "").toLowerCase();
      if (s === "pending" || s === "waiting") map.pending++;
      else if (s === "resolved") map.resolved++;
      else map.active++;
    });
    return map;
  }, [owned]);

  const filtered = useMemo(() => {
    if (!activeTab || activeTab === "all") return owned;
    return owned.filter((t) => {
      const s = (t.status ?? "").toLowerCase();
      if (activeTab === "pending") return s === "pending" || s === "waiting";
      if (activeTab === "resolved") return s === "resolved";
      return s === activeTab;
    });
  }, [owned, activeTab]);

  const listItem = {
    hidden: { opacity: 0, y: 8 },
    visible: { opacity: 1, y: 0 },
  };

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

  return (
    <motion.div layout className="bg-white rounded-lg shadow-sm p-0">
      <div className="h-[calc(100vh-300px)] md:h-[600px] lg:h-[520px] overflow-auto">
        <div className="sticky top-0 z-30 bg-white border-b border-slate-200">
          <div className="flex items-center justify-between p-4">
            <h3 className="text-lg font-medium text-slate-800">Your Tickets</h3>
            <div className="text-sm text-slate-500">
              {loading
                ? "…"
                : `${owned.length} ticket${owned.length === 1 ? "" : "s"}`}
            </div>
          </div>

          <div className="px-4 pb-3">
            <div
              role="tablist"
              aria-label="Ticket filters"
              className="flex gap-2 overflow-x-auto whitespace-nowrap px-1 py-1"
            >
              {TABS.map((t) => {
                const active = activeTab === t.id;
                return (
                  <button
                    key={t.id}
                    role="tab"
                    aria-selected={active}
                    onClick={() => setActiveTab(t.id)}
                    className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition ${
                      active
                        ? "bg-slate-900 text-white shadow"
                        : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <span>{t.label}</span>
                    <span className="inline-flex items-center justify-center px-2 py-0.5 text-xs rounded-full bg-slate-100 text-slate-700">
                      {counts[t.id] ?? (t.id === "all" ? owned.length : 0)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="p-4">
          {loading ? (
            <ChatListSkeleton />
          ) : error ? (
            <div className="p-4 text-sm text-red-600">{error}</div>
          ) : filtered.length === 0 ? (
            <div className="p-6 text-sm text-slate-500 text-center">
              <p className="font-medium">No tickets found</p>
              <p className="text-xs mt-1">Create a new ticket to get started</p>
            </div>
          ) : (
            <ul className="space-y-3">
              {filtered.map((t, idx) => {
                const subject = t.displaySubject ?? "No subject";
                const email = t.email ?? "";
                const statusKey = (t.status ?? "active").toLowerCase();
                const previewLabel = (t.preview || "").toString().trim();
                const statusLabel =
                  previewLabel ||
                  t.statusDisplay ||
                  (statusKey
                    ? statusKey.charAt(0).toUpperCase() + statusKey.slice(1)
                    : "—");
                const time = t.created_at ?? "";
                const resolvedAt = t.raw?.resolved_at ?? t.resolved_at ?? null;
                const resolutionTime = calculateResolutionTime(
                  t.created_at,
                  resolvedAt,
                  t.status || t.ticket_status
                );
                const assignedToId =
                  t.raw?.assigned_to_id ??
                  t.raw?.assigned_to ??
                  t.raw?.agent_id ??
                  t.assigned_to_id ??
                  t.assigned_to ??
                  null;
                const assignedUser =
                  directory.find(
                    (person) =>
                      person?.id && String(person.id) === String(assignedToId)
                  ) ?? null;
                const assignedLabel =
                  assignedUser?.name && assignedUser.name !== "null"
                    ? assignedUser.name
                    : assignedUser?.username ??
                      assignedUser?.email ??
                      t.raw?.assigned_to_name ??
                      null;
                const pillClass =
                  statusKey === "resolved"
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                    : statusKey === "waiting"
                    ? "bg-amber-50 text-amber-700 border border-amber-100"
                    : statusKey === "pending"
                    ? "bg-amber-50 text-amber-700 border border-amber-100"
                    : statusKey === "active" || statusKey === "open"
                    ? "bg-sky-50 text-sky-700 border border-sky-100"
                    : "bg-slate-50 text-slate-700 border border-slate-100";

                return (
                  <motion.li
                    key={t.id ?? `${idx}-${email}`}
                    initial="hidden"
                    animate="visible"
                    variants={listItem}
                    className={`bg-white rounded-lg p-4 border border-slate-200 flex items-center justify-between shadow-sm cursor-pointer transition-colors ${
                      selected?.id === t.id
                        ? "ring-2 ring-blue-500 bg-blue-50"
                        : "hover:bg-slate-50"
                    }`}
                    onClick={() => {
                      setSelected?.(t);
                      if (
                        typeof window !== "undefined" &&
                        window.innerWidth < 1024
                      ) {
                        setTimeout(() => {
                          const chatElement =
                            document.querySelector("[data-chat-box]");
                          if (chatElement) {
                            chatElement.scrollIntoView({
                              behavior: "smooth",
                              block: "nearest",
                            });
                          }
                        }, 100);
                      }
                    }}
                  >
                    <div className="min-w-0">
                      <div className="font-medium text-slate-800 truncate">
                        {subject}
                      </div>
                      <div className="text-xs text-slate-500 mt-1 truncate">
                        {email || t.name || "From Widget"}
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0 flex flex-col items-end ml-4">
                      <span
                        className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-medium ${pillClass}`}
                      >
                        {statusKey.charAt(0).toUpperCase() + statusKey.slice(1)}
                      </span>
                      {t.raw?.escalated === true &&
                        statusKey !== "Resolved" && (
                          <span className="mt-1 inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-purple-50 text-red-700 border border-purple-100">
                            <GoAlertFill />
                            Escalated
                          </span>
                        )}
                      <div className="text-xs text-slate-400 mt-2">
                        {formatMaybeDate(time)}
                      </div>
                      {resolutionTime && (
                        <div className="text-xs text-emerald-600 mt-1 font-medium">
                          Resolved in {resolutionTime}
                        </div>
                      )}
                    </div>
                  </motion.li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </motion.div>
  );
}
