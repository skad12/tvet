// "use client";
// import { motion } from "framer-motion";
// import { format } from "date-fns";

// export default function ChatList({ tickets, selected, setSelected, loading }) {
//   const listContainer = {
//     hidden: {},
//     visible: { transition: { staggerChildren: 0.05 } },
//   };
//   const listItem = {
//     hidden: { opacity: 0, y: 8 },
//     visible: { opacity: 1, y: 0 },
//   };

//   return (
//     <motion.div layout className="bg-white rounded shadow p-4 mb-6">
//       <div className="flex items-center justify-between">
//         <h3 className="font-medium text-slate-800">Your Tickets</h3>
//         <div className="text-sm text-slate-500">
//           Showing {loading ? "..." : tickets.length} tickets
//         </div>
//       </div>

//       <motion.div
//         variants={listContainer}
//         initial="hidden"
//         animate="visible"
//         className="mt-4 divide-y"
//       >
//         {loading ? (
//           <div className="p-6 text-sm text-slate-500">Loading tickets…</div>
//         ) : tickets.length === 0 ? (
//           <div className="p-6 text-sm text-slate-500">
//             No tickets found for your email.
//           </div>
//         ) : (
//           tickets.map((t) => (
//             <motion.div
//               key={t.id}
//               layout
//               variants={listItem}
//               whileHover={{ scale: 1.01 }}
//               onClick={() => setSelected(t)}
//               className={`flex items-center justify-between p-3 cursor-pointer ${
//                 selected?.id === t.id ? "bg-slate-50" : ""
//               }`}
//             >
//               <div>
//                 <div className="font-medium text-slate-800">
//                   {t.category || t.categoryTitle || "No subject"}
//                 </div>
//                 <div className="text-xs text-slate-500">{t.email}</div>
//               </div>
//               <div className="text-right">
//                 <div className="inline-block text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded">
//                   Low
//                 </div>
//                 <div className="text-xs text-slate-400 mt-1">
//                   {t.createdAt ? format(new Date(t.createdAt), "PPpp") : "—"}
//                 </div>
//               </div>
//             </motion.div>
//           ))
//         )}
//       </motion.div>
//     </motion.div>
//   );
// }

// components/ChatList.jsx
// "use client";

// import React, { useMemo, useState } from "react";
// import { motion } from "framer-motion";
// import { format } from "date-fns";
// import { useAuth } from "@/context/AuthContext"; // adjust path if your AuthContext is elsewhere

// export default function ChatList({
//   tickets = [],
//   selected,
//   setSelected,
//   loading = false,
//   userId: propUserId = null, // optional override
// }) {
//   const { user } = useAuth?.() ?? {}; // safe-call in case useAuth is not available
//   // Try to derive a few useful values from auth user
//   const authUserId =
//     user?.app_user_id ??
//     user?.appUserId ??
//     user?.user_id ??
//     user?.userId ??
//     user?.id ??
//     user?.uid ??
//     user?.pk ??
//     null;
//   const authEmail = (user?.email ?? user?.username ?? "").toLowerCase();

//   const currentUserId = propUserId ?? authUserId;

//   const [activeTab, setActiveTab] = useState("all");

//   const TABS = [
//     { id: "all", label: "All" },
//     { id: "active", label: "Active" },
//     { id: "pending", label: "Pending" },
//     { id: "resolved", label: "Resolved" },
//   ];

//   // helper: pick a normalized status from ticket
//   function ticketStatus(t) {
//     return String(
//       (t.ticket_status ?? t.status ?? t.state ?? "").toLowerCase() || ""
//     ).trim();
//   }

//   // helper: check if ticket belongs to user (match by many possible fields)
//   function ticketBelongsToUser(t) {
//     if (!currentUserId && !authEmail) return true; // if no user info, show everything
//     // compare ids across common fields
//     const idCandidates = [
//       t.app_user_id,
//       t.appUserId,
//       t.user_id,
//       t.userId,
//       t.reporter_id,
//       t.reporterId,
//       t.requester_id,
//       t.requesterId,
//       t.customer_id,
//       t.customerId,
//       t.owner_id,
//       t.ownerId,
//       t.id, // sometimes ticket id equals user's id? unlikely
//     ]
//       .filter(Boolean)
//       .map(String);

//     // normalize currentUserId also to string
//     if (currentUserId) {
//       const cur = String(currentUserId);
//       if (idCandidates.some((x) => x === cur)) return true;
//     }

//     // fallback: match by email (case-insensitive)
//     const ticketEmail = String(
//       t.email ?? t.reporter_email ?? t.requester_email ?? ""
//     ).toLowerCase();
//     if (authEmail && ticketEmail && ticketEmail === authEmail) return true;
//     if (propUserId == null && authUserId == null) {
//       // nothing to match, default to true so list isn't unexpectedly empty
//       return true;
//     }

//     return false;
//   }

//   // filtered by current user ownership
//   const owned = useMemo(() => {
//     const arr = Array.isArray(tickets) ? tickets : [];
//     return arr.filter((t) => ticketBelongsToUser(t));
//   }, [tickets, currentUserId, authEmail]);

//   // compute counts
//   const counts = useMemo(() => {
//     const map = { all: owned.length, active: 0, pending: 0, resolved: 0 };
//     owned.forEach((t) => {
//       const s = ticketStatus(t);
//       if (s === "active") map.active++;
//       else if (s === "pending" || s === "waiting") map.pending++;
//       else if (s === "resolved") map.resolved++;
//     });
//     return map;
//   }, [owned]);

//   // filtered by active tab
//   const filtered = useMemo(() => {
//     if (!activeTab || activeTab === "all") return owned;
//     return owned.filter((t) => {
//       const s = ticketStatus(t);
//       if (activeTab === "pending") return s === "pending" || s === "waiting";
//       return s === activeTab;
//     });
//   }, [owned, activeTab]);

//   // motion variants
//   const listItem = {
//     hidden: { opacity: 0, y: 8 },
//     visible: { opacity: 1, y: 0 },
//   };

//   return (
//     <motion.div layout className="bg-white rounded shadow-sm p-0">
//       {/* container with a fixed height so header can be sticky and list scrolls */}
//       <div className="h-[520px] md:h-[420px] overflow-auto">
//         {/* sticky header */}
//         <div className="sticky top-0 z-30 bg-white border-b border-slate-200">
//           <div className="flex items-center justify-between p-4">
//             <h3 className="text-lg font-medium text-slate-800">Your Tickets</h3>
//             <div className="text-sm text-slate-500">
//               {loading
//                 ? "…"
//                 : `${owned.length} ticket${owned.length === 1 ? "" : "s"}`}
//             </div>
//           </div>

//           {/* tabs */}
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

//         {/* content */}
//         <div className="p-4">
//           {loading ? (
//             <div className="p-6 text-sm text-slate-500">Loading tickets…</div>
//           ) : filtered.length === 0 ? (
//             <div className="p-6 text-sm text-slate-500">No tickets found.</div>
//           ) : (
//             <ul className="space-y-3">
//               {filtered.map((t, idx) => {
//                 const name =
//                   t.category ??
//                   t.categoryTitle ??
//                   t.subject ??
//                   t.title ??
//                   t.preview ??
//                   "No subject";
//                 const email =
//                   t.email ?? t.reporter_email ?? t.requester_email ?? "";
//                 const status = (
//                   t.ticket_status ??
//                   t.status ??
//                   ""
//                 ).toLowerCase();
//                 const time =
//                   t.createdAt ??
//                   t.created_at ??
//                   t.timestamp ??
//                   t.at ??
//                   t.created ??
//                   "";
//                 const pillClass =
//                   status === "resolved"
//                     ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
//                     : status === "waiting"
//                     ? "bg-amber-50 text-amber-700 border border-amber-100"
//                     : status === "pending"
//                     ? "bg-amber-50 text-amber-700 border border-amber-100"
//                     : status === "active"
//                     ? "bg-sky-50 text-sky-700 border border-sky-100"
//                     : "bg-slate-50 text-slate-700 border border-slate-100";

//                 return (
//                   <motion.li
//                     key={t.id ?? `${idx}-${email}`}
//                     initial="hidden"
//                     animate="visible"
//                     variants={listItem}
//                     className={`bg-white rounded-lg p-4 border border-slate-200 flex items-center justify-between shadow-sm cursor-pointer ${
//                       selected?.id === t.id
//                         ? "ring-2 ring-blue-200"
//                         : "hover:bg-slate-50"
//                     }`}
//                     onClick={() => setSelected?.(t)}
//                   >
//                     <div className="min-w-0">
//                       <div className="font-medium text-slate-800 truncate">
//                         {name}
//                       </div>
//                       <div className="text-xs text-slate-500 mt-1 truncate">
//                         {email}
//                       </div>
//                       {t.preview && (
//                         <div className="text-xs text-slate-400 mt-1 truncate">
//                           {t.preview}
//                         </div>
//                       )}
//                     </div>

//                     <div className="text-right flex-shrink-0 flex flex-col items-end ml-4">
//                       <span
//                         className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-medium ${pillClass}`}
//                       >
//                         {(t.ticket_status ?? t.status) || "—"}
//                       </span>
//                       <div className="text-xs text-slate-400 mt-2">
//                         {time ? format(new Date(time), "PPpp") : "—"}
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

// components/ChatList.jsx
// "use client";

// import React, { useEffect, useMemo, useState } from "react";
// import { motion } from "framer-motion";
// import { format } from "date-fns";
// import { useAuth } from "@/context/AuthContext"; // adjust path if your AuthContext is elsewhere

// // try to use your axios helper if present
// let api = null;
// try {
//   // eslint-disable-next-line import/no-unresolved
//   api = require("@/lib/axios").default;
// } catch (e) {
//   api = null;
// }

// export default function ChatList({
//   // optional: allow caller to pass a pre-fetched list; if provided we won't call endpoint
//   tickets: ticketsProp = null,
//   selected,
//   setSelected,
//   loading: loadingProp = false,
//   userId: propUserId = null, // override id if provided
// }) {
//   const { user, token } = useAuth?.() ?? {}; // safe-call

//   // derive user id from many possible fields
//   const authUserId =
//     user?.app_user_id ??
//     user?.appUserId ??
//     user?.user_id ??
//     user?.userId ??
//     user?.id ??
//     user?.uid ??
//     user?.pk ??
//     null;

//   const effectiveUserId = propUserId ?? authUserId;

//   const [tickets, setTickets] = useState(ticketsProp ?? []);
//   const [loading, setLoading] = useState(Boolean(loadingProp || !ticketsProp));
//   const [error, setError] = useState(null);
//   const [activeTab, setActiveTab] = useState("all");

//   const TABS = [
//     { id: "all", label: "All" },
//     { id: "active", label: "Active" },
//     { id: "pending", label: "Pending" },
//     { id: "resolved", label: "Resolved" },
//   ];

//   // fetch tickets by user id when no tickets prop provided
//   useEffect(() => {
//     if (ticketsProp) {
//       // parent passed tickets; use them and don't fetch
//       setTickets(ticketsProp);
//       setLoading(false);
//       setError(null);
//       return;
//     }

//     let mounted = true;
//     const ac = new AbortController();

//     async function load() {
//       if (!effectiveUserId) {
//         // nothing to fetch — show empty list
//         setTickets([]);
//         setLoading(false);
//         setError("No user id to fetch tickets for.");
//         return;
//       }

//       setLoading(true);
//       setError(null);

//       const endpointRelative = `/filter-ticket/by-user-id/${encodeURIComponent(
//         effectiveUserId
//       )}/`;

//       try {
//         let data;
//         if (api && typeof api.get === "function") {
//           const headers = token ? { Authorization: `Bearer ${token}` } : {};
//           const res = await api.get(endpointRelative, {
//             headers,
//             signal: ac.signal,
//           });
//           data = res?.data;
//         } else {
//           // try using NEXT_PUBLIC_API_BASE if set, otherwise use relative endpoint
//           const base =
//             typeof window !== "undefined"
//               ? process.env.NEXT_PUBLIC_API_BASE
//               : undefined;
//           const endpoint = base
//             ? `${base.replace(/\/$/, "")}${endpointRelative}`
//             : endpointRelative;

//           const res = await fetch(endpoint, {
//             method: "GET",
//             headers: {
//               "Content-Type": "application/json",
//               ...(token ? { Authorization: `Bearer ${token}` } : {}),
//             },
//             signal: ac.signal,
//           });

//           if (!res.ok) {
//             const text = await res.text().catch(() => "");
//             throw new Error(`Failed to load (${res.status}) ${text}`);
//           }
//           data = await res.json().catch(() => null);
//         }

//         if (!mounted) return;

//         // normalize data -> array of ticket objects
//         let arr = [];
//         if (!data) arr = [];
//         else if (Array.isArray(data)) arr = data;
//         else if (Array.isArray(data.results)) arr = data.results;
//         else if (Array.isArray(data.data)) arr = data.data;
//         else if (Array.isArray(data.tickets)) arr = data.tickets;
//         else arr = [data];

//         setTickets(arr);
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
//     // intentionally depend on effectiveUserId and token
//   }, [effectiveUserId, token, ticketsProp]);

//   // counts and filtering
//   const ticketStatus = (t) =>
//     String(
//       (t.ticket_status ?? t.status ?? t.state ?? "").toLowerCase() || ""
//     ).trim();

//   const owned = useMemo(() => {
//     // we've already fetched tickets for the user, so just return tickets
//     return Array.isArray(tickets) ? tickets : [];
//   }, [tickets]);

//   const counts = useMemo(() => {
//     const map = { all: owned.length, active: 0, pending: 0, resolved: 0 };
//     owned.forEach((t) => {
//       const s = ticketStatus(t);
//       if (s === "active") map.active++;
//       else if (s === "pending" || s === "waiting") map.pending++;
//       else if (s === "resolved") map.resolved++;
//     });
//     return map;
//   }, [owned]);

//   const filtered = useMemo(() => {
//     if (!activeTab || activeTab === "all") return owned;
//     return owned.filter((t) => {
//       const s = ticketStatus(t);
//       if (activeTab === "pending") return s === "pending" || s === "waiting";
//       return s === activeTab;
//     });
//   }, [owned, activeTab]);

//   const listItem = {
//     hidden: { opacity: 0, y: 8 },
//     visible: { opacity: 1, y: 0 },
//   };

//   return (
//     <motion.div layout className="bg-white rounded shadow-sm p-0">
//       <div className="h-[520px] md:h-[420px] overflow-auto">
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
//             <div className="p-6 text-sm text-slate-500">Loading tickets…</div>
//           ) : error ? (
//             <div className="p-4 text-sm text-red-600">{error}</div>
//           ) : filtered.length === 0 ? (
//             <div className="p-6 text-sm text-slate-500">
//               No tickets found for this user.
//             </div>
//           ) : (
//             <ul className="space-y-3">
//               {filtered.map((t, idx) => {
//                 const subject =
//                   t.category ??
//                   t.categoryTitle ??
//                   t.subject ??
//                   t.title ??
//                   t.preview ??
//                   "No subject";
//                 const email =
//                   t.email ?? t.reporter_email ?? t.requester_email ?? "";
//                 const status = (
//                   t.ticket_status ??
//                   t.status ??
//                   ""
//                 ).toLowerCase();
//                 const time =
//                   t.createdAt ??
//                   t.created_at ??
//                   t.timestamp ??
//                   t.at ??
//                   t.created ??
//                   "";
//                 const pillClass =
//                   status === "resolved"
//                     ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
//                     : status === "waiting"
//                     ? "bg-amber-50 text-amber-700 border border-amber-100"
//                     : status === "pending"
//                     ? "bg-amber-50 text-amber-700 border border-amber-100"
//                     : status === "active"
//                     ? "bg-sky-50 text-sky-700 border border-sky-100"
//                     : "bg-slate-50 text-slate-700 border border-slate-100";

//                 return (
//                   <motion.li
//                     key={t.id ?? `${idx}-${email}`}
//                     initial="hidden"
//                     animate="visible"
//                     variants={listItem}
//                     className={`bg-white rounded-lg p-4 border border-slate-200 flex items-center justify-between shadow-sm cursor-pointer ${
//                       selected?.id === t.id
//                         ? "ring-2 ring-blue-200"
//                         : "hover:bg-slate-50"
//                     }`}
//                     onClick={() => setSelected?.(t)}
//                   >
//                     <div className="min-w-0">
//                       <div className="font-medium text-slate-800 truncate">
//                         {subject}
//                       </div>
//                       <div className="text-xs text-slate-500 mt-1 truncate">
//                         {email}
//                       </div>
//                       {t.preview && (
//                         <div className="text-xs text-slate-400 mt-1 truncate">
//                           {t.preview}
//                         </div>
//                       )}
//                     </div>

//                     <div className="text-right flex-shrink-0 flex flex-col items-end ml-4">
//                       <span
//                         className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-medium ${pillClass}`}
//                       >
//                         {(t.ticket_status ?? t.status) || "—"}
//                       </span>
//                       <div className="text-xs text-slate-400 mt-2">
//                         {time ? format(new Date(time), "PPpp") : "—"}
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

// components/customer/ChatList.jsx
// "use client";

// import React, { useEffect, useMemo, useState } from "react";
// import { motion } from "framer-motion";
// import { format, isValid } from "date-fns";
// import { useAuth } from "@/context/AuthContext"; // adjust path if needed

// // try to use axios instance if available
// let api = null;
// try {
//   api = require("@/lib/axios").default;
// } catch (e) {
//   api = null;
// }

// export default function ChatList({
//   tickets: ticketsProp = null,
//   selected,
//   setSelected,
//   loading: loadingProp = false,
//   userId: propUserId = null, // optional override
// }) {
//   const { user, token } = useAuth?.() ?? {};

//   // attempt to derive user id from common places
//   const authUserId =
//     user?.app_user_id ??
//     user?.appUserId ??
//     user?.user_id ??
//     user?.userId ??
//     user?.id ??
//     user?.uid ??
//     user?.pk ??
//     null;

//   const effectiveUserId = propUserId ?? authUserId;

//   const [tickets, setTickets] = useState(ticketsProp ?? []);
//   const [loading, setLoading] = useState(Boolean(loadingProp || !ticketsProp));
//   const [error, setError] = useState(null);
//   const [activeTab, setActiveTab] = useState("all");

//   const TABS = [
//     { id: "all", label: "All" },
//     { id: "active", label: "Active" },
//     { id: "pending", label: "Pending" },
//     { id: "resolved", label: "Resolved" },
//   ];

//   // fetch tickets by user id when no tickets prop provided
//   useEffect(() => {
//     if (ticketsProp) {
//       setTickets(ticketsProp);
//       setLoading(false);
//       setError(null);
//       return;
//     }

//     let mounted = true;
//     const ac = new AbortController();

//     async function load() {
//       if (!effectiveUserId) {
//         setTickets([]);
//         setLoading(false);
//         setError("No user id to fetch tickets for.");
//         return;
//       }

//       setLoading(true);
//       setError(null);

//       const endpointRelative = `/filter-ticket/by-user-id/${encodeURIComponent(
//         effectiveUserId
//       )}/`;

//       try {
//         let data;
//         if (api && typeof api.get === "function") {
//           const headers = token ? { Authorization: `Bearer ${token}` } : {};
//           const res = await api.get(endpointRelative, {
//             headers,
//             signal: ac.signal,
//           });
//           data = res?.data;
//         } else {
//           const base =
//             typeof window !== "undefined"
//               ? process.env.NEXT_PUBLIC_API_BASE
//               : undefined;
//           const endpoint = base
//             ? `${base.replace(/\/$/, "")}${endpointRelative}`
//             : endpointRelative;

//           const res = await fetch(endpoint, {
//             method: "GET",
//             headers: {
//               "Content-Type": "application/json",
//               ...(token ? { Authorization: `Bearer ${token}` } : {}),
//             },
//             signal: ac.signal,
//           });

//           if (!res.ok) {
//             const text = await res.text().catch(() => "");
//             throw new Error(`Failed to load (${res.status}) ${text}`);
//           }
//           data = await res.json().catch(() => null);
//         }

//         if (!mounted) return;

//         // normalize response to array
//         let arr = [];
//         if (!data) arr = [];
//         else if (Array.isArray(data)) arr = data;
//         else if (Array.isArray(data.results)) arr = data.results;
//         else if (Array.isArray(data.data)) arr = data.data;
//         else if (Array.isArray(data.tickets)) arr = data.tickets;
//         else arr = [data];

//         setTickets(arr);
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
//   }, [effectiveUserId, token, ticketsProp]);

//   // Defensive helper: safely derive status as lowercase string
//   const ticketStatus = (t) => {
//     const raw =
//       t?.ticket_status ??
//       t?.status ??
//       t?.state ??
//       t?.ticketStatus ??
//       t?.ticket_status_detail ??
//       "";

//     let val = raw;
//     if (val === null || val === undefined) return "";

//     // if it's already a string
//     if (typeof val === "string") {
//       return val.toLowerCase().trim();
//     }

//     // if it's a number
//     if (typeof val === "number") {
//       return String(val).toLowerCase().trim();
//     }

//     // if it's an object, try common keys
//     if (typeof val === "object") {
//       const candidate =
//         val.code ?? val.name ?? val.key ?? val.status ?? val.state ?? null;
//       if (candidate !== null && candidate !== undefined) {
//         return String(candidate).toLowerCase().trim();
//       }
//       // fallback to JSON string (safe)
//       try {
//         return JSON.stringify(val).toLowerCase().trim();
//       } catch {
//         return "";
//       }
//     }

//     // fallback
//     try {
//       return String(val).toLowerCase().trim();
//     } catch {
//       return "";
//     }
//   };

//   // safe date format
//   function formatMaybeDate(val) {
//     if (!val) return "—";
//     const dt = new Date(val);
//     if (isValid(dt)) return format(dt, "PPpp");
//     try {
//       return String(val).slice(0, 32);
//     } catch {
//       return "—";
//     }
//   }

//   const owned = useMemo(
//     () => (Array.isArray(tickets) ? tickets : []),
//     [tickets]
//   );

//   const counts = useMemo(() => {
//     const map = { all: owned.length, active: 0, pending: 0, resolved: 0 };
//     owned.forEach((t) => {
//       const s = ticketStatus(t);
//       if (s === "active") map.active++;
//       else if (s === "pending" || s === "waiting") map.pending++;
//       else if (s === "resolved") map.resolved++;
//     });
//     return map;
//   }, [owned]);

//   const filtered = useMemo(() => {
//     if (!activeTab || activeTab === "all") return owned;
//     return owned.filter((t) => {
//       const s = ticketStatus(t);
//       if (activeTab === "pending") return s === "pending" || s === "waiting";
//       return s === activeTab;
//     });
//   }, [owned, activeTab]);

//   const listItem = {
//     hidden: { opacity: 0, y: 8 },
//     visible: { opacity: 1, y: 0 },
//   };

//   return (
//     <motion.div layout className="bg-white rounded shadow-sm p-0">
//       <div className="h-[520px] md:h-[420px] overflow-auto">
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
//             <div className="p-6 text-sm text-slate-500">Loading tickets…</div>
//           ) : error ? (
//             <div className="p-4 text-sm text-red-600">{error}</div>
//           ) : filtered.length === 0 ? (
//             <div className="p-6 text-sm text-slate-500">
//               No tickets found for this user.
//             </div>
//           ) : (
//             <ul className="space-y-3">
//               {filtered.map((t, idx) => {
//                 const subject =
//                   t.category ??
//                   t.categoryTitle ??
//                   t.subject ??
//                   t.title ??
//                   t.preview ??
//                   "No subject";
//                 const email =
//                   t.email ?? t.reporter_email ?? t.requester_email ?? "";
//                 const status = ticketStatus(t);
//                 const time =
//                   t.createdAt ??
//                   t.created_at ??
//                   t.timestamp ??
//                   t.at ??
//                   t.created ??
//                   "";
//                 const pillClass =
//                   status === "resolved"
//                     ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
//                     : status === "waiting"
//                     ? "bg-amber-50 text-amber-700 border border-amber-100"
//                     : status === "pending"
//                     ? "bg-amber-50 text-amber-700 border border-amber-100"
//                     : status === "active"
//                     ? "bg-sky-50 text-sky-700 border border-sky-100"
//                     : "bg-slate-50 text-slate-700 border border-slate-100";

//                 return (
//                   <motion.li
//                     key={t.id ?? `${idx}-${email}`}
//                     initial="hidden"
//                     animate="visible"
//                     variants={listItem}
//                     className={`bg-white rounded-lg p-4 border border-slate-200 flex items-center justify-between shadow-sm cursor-pointer ${
//                       selected?.id === t.id
//                         ? "ring-2 ring-blue-200"
//                         : "hover:bg-slate-50"
//                     }`}
//                     onClick={() => setSelected?.(t)}
//                   >
//                     <div className="min-w-0">
//                       <div className="font-medium text-slate-800 truncate">
//                         {subject}
//                       </div>
//                       <div className="text-xs text-slate-500 mt-1 truncate">
//                         {email}
//                       </div>
//                       {t.preview && (
//                         <div className="text-xs text-slate-400 mt-1 truncate">
//                           {t.preview}
//                         </div>
//                       )}
//                     </div>

//                     <div className="text-right flex-shrink-0 flex flex-col items-end ml-4">
//                       <span
//                         className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-medium ${pillClass}`}
//                       >
//                         {t.ticket_status ?? t.status ?? "—"}
//                       </span>
//                       <div className="text-xs text-slate-400 mt-2">
//                         {time ? formatMaybeDate(time) : "—"}
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

"use client";

import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { format, isValid } from "date-fns";
import { useAuth } from "@/context/AuthContext";

let api = null;
try {
  api = require("@/lib/axios").default;
} catch (e) {
  api = null;
}

export default function ChatList({
  tickets: ticketsProp = null,
  selected,
  setSelected,
  loading: loadingProp = false,
  userId: propUserId = null,
}) {
  const { user, token } = useAuth?.() ?? {};

  const authUserId =
    user?.app_user_id ??
    user?.appUserId ??
    user?.user_id ??
    user?.userId ??
    user?.id ??
    user?.uid ??
    user?.pk ??
    null;

  const effectiveUserId = propUserId ?? authUserId;

  const [tickets, setTickets] = useState(ticketsProp ?? []);
  const [loading, setLoading] = useState(Boolean(loadingProp || !ticketsProp));
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("all");

  const TABS = [
    { id: "all", label: "All" },
    { id: "active", label: "Active" },
    { id: "pending", label: "Pending" },
    { id: "resolved", label: "Resolved" },
  ];

  // fetch tickets by user id when no tickets prop provided
  useEffect(() => {
    if (ticketsProp) {
      setTickets(ticketsProp);
      setLoading(false);
      setError(null);
      return;
    }
    let mounted = true;
    const ac = new AbortController();

    async function load() {
      if (!effectiveUserId) {
        setTickets([]);
        setLoading(false);
        setError("No user id to fetch tickets for.");
        return;
      }
      setLoading(true);
      setError(null);

      const endpointRelative = `/filter-ticket/by-user-id/${encodeURIComponent(
        effectiveUserId
      )}/`;
      try {
        let data;
        if (api && typeof api.get === "function") {
          const headers = token ? { Authorization: `Bearer ${token}` } : {};
          const res = await api.get(endpointRelative, {
            headers,
            signal: ac.signal,
          });
          data = res?.data;
        } else {
          const base =
            typeof window !== "undefined"
              ? process.env.NEXT_PUBLIC_API_BASE
              : undefined;
          const endpoint = base
            ? `${base.replace(/\/$/, "")}${endpointRelative}`
            : endpointRelative;

          const res = await fetch(endpoint, {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
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

        setTickets(arr);

        // auto-select first ticket if nothing selected
        if (arr.length > 0 && !selected) {
          setSelected?.(arr[0]);
        }
      } catch (err) {
        if (err.name === "AbortError") return;
        console.error("Failed to fetch tickets by user id:", err);
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
  }, [effectiveUserId, token, ticketsProp, setSelected, selected]);

  const ticketStatus = (t) => {
    const raw =
      t?.ticket_status ??
      t?.status ??
      t?.state ??
      t?.ticketStatus ??
      t?.ticket_status_detail ??
      "";
    if (raw === null || raw === undefined) return "";
    if (typeof raw === "string") return raw.toLowerCase().trim();
    if (typeof raw === "number") return String(raw).toLowerCase().trim();
    if (typeof raw === "object") {
      const candidate =
        raw.code ?? raw.name ?? raw.key ?? raw.status ?? raw.state ?? null;
      if (candidate !== null && candidate !== undefined) {
        return String(candidate).toLowerCase().trim();
      }
      try {
        return JSON.stringify(raw).toLowerCase().trim();
      } catch {
        return "";
      }
    }
    try {
      return String(raw).toLowerCase().trim();
    } catch {
      return "";
    }
  };

  function formatMaybeDate(val) {
    if (!val) return "—";
    const dt = new Date(val);
    if (isValid(dt)) return format(dt, "PPpp");
    try {
      return String(val).slice(0, 32);
    } catch {
      return "—";
    }
  }

  const owned = useMemo(
    () => (Array.isArray(tickets) ? tickets : []),
    [tickets]
  );

  const counts = useMemo(() => {
    const map = { all: owned.length, active: 0, pending: 0, resolved: 0 };
    owned.forEach((t) => {
      const s = ticketStatus(t);
      if (s === "active") map.active++;
      else if (s === "pending" || s === "waiting") map.pending++;
      else if (s === "resolved") map.resolved++;
    });
    return map;
  }, [owned]);

  const filtered = useMemo(() => {
    if (!activeTab || activeTab === "all") return owned;
    return owned.filter((t) => {
      const s = ticketStatus(t);
      if (activeTab === "pending") return s === "pending" || s === "waiting";
      return s === activeTab;
    });
  }, [owned, activeTab]);

  const listItem = {
    hidden: { opacity: 0, y: 8 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <motion.div layout className="bg-white rounded shadow-sm p-0">
      <div className="h-[520px] md:h-[420px] overflow-auto">
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
            <div className="p-6 text-sm text-slate-500">Loading tickets…</div>
          ) : error ? (
            <div className="p-4 text-sm text-red-600">{error}</div>
          ) : filtered.length === 0 ? (
            <div className="p-6 text-sm text-slate-500">
              No tickets found for this user.
            </div>
          ) : (
            <ul className="space-y-3">
              {filtered.map((t, idx) => {
                const subject =
                  t.category ??
                  t.categoryTitle ??
                  t.subject ??
                  t.title ??
                  t.preview ??
                  "No subject";
                const email =
                  t.email ?? t.reporter_email ?? t.requester_email ?? "";
                const status = ticketStatus(t);
                const time =
                  t.createdAt ??
                  t.created_at ??
                  t.timestamp ??
                  t.at ??
                  t.created ??
                  "";
                const pillClass =
                  status === "resolved"
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                    : status === "waiting"
                    ? "bg-amber-50 text-amber-700 border border-amber-100"
                    : status === "pending"
                    ? "bg-amber-50 text-amber-700 border border-amber-100"
                    : status === "active"
                    ? "bg-sky-50 text-sky-700 border border-sky-100"
                    : "bg-slate-50 text-slate-700 border border-slate-100";

                return (
                  <motion.li
                    key={t.id ?? `${idx}-${email}`}
                    initial="hidden"
                    animate="visible"
                    variants={listItem}
                    className={`bg-white rounded-lg p-4 border border-slate-200 flex items-center justify-between shadow-sm cursor-pointer ${
                      selected?.id === t.id
                        ? "ring-2 ring-blue-200"
                        : "hover:bg-slate-50"
                    }`}
                    onClick={() => setSelected?.(t)}
                  >
                    <div className="min-w-0">
                      <div className="font-medium text-slate-800 truncate">
                        {subject}
                      </div>
                      <div className="text-xs text-slate-500 mt-1 truncate">
                        {email}
                      </div>
                      {t.preview && (
                        <div className="text-xs text-slate-400 mt-1 truncate">
                          {t.preview}
                        </div>
                      )}
                    </div>

                    <div className="text-right flex-shrink-0 flex flex-col items-end ml-4">
                      <span
                        className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-medium ${pillClass}`}
                      >
                        {t.ticket_status ?? t.status ?? "—"}
                      </span>
                      <div className="text-xs text-slate-400 mt-2">
                        {time ? formatMaybeDate(time) : "—"}
                      </div>
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
