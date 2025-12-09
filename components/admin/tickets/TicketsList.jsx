// "use client";

// import React, { useEffect, useState, useMemo } from "react";
// import { motion, AnimatePresence } from "framer-motion";
// import { FiClock } from "react-icons/fi";
// import api from "@/lib/axios";

// function normalizeChatToTicket(chat, category) {
//   // chat shape depends on backend; this normalizer is defensive
//   const id = chat?.id ?? chat?.ticket_id ?? String(Math.random()).slice(2, 10);
//   const email =
//     chat?.email && String(chat.email).trim() !== ""
//       ? String(chat.email).trim()
//       : chat?.user_email ?? chat?.user?.email ?? chat?.name ?? "";
//   const subject =
//     chat?.subject ?? chat?.title ?? category?.name ?? "No subject";
//   const preview =
//     chat?.preview ||
//     chat?.last_message ||
//     chat?.message ||
//     (Array.isArray(chat?.messages) && chat.messages[0]?.text) ||
//     "";
//   const createdAt =
//     chat?.created_at ??
//     chat?.created_at_display ??
//     chat?.pub_date ??
//     new Date().toISOString();
//   const status =
//     chat?.status ??
//     chat?.progress ??
//     (chat?.resolved ? "resolved" : chat?.escalated ? "escalated" : "pending");

//   return {
//     id,
//     email,
//     subject,
//     preview,
//     createdAt,
//     status: String(status || "pending").toLowerCase(),
//     escalated: !!chat?.escalated,
//     raw: chat,
//     category: {
//       id: category?.id ?? category?.name,
//       name: category?.name ?? category?.title ?? category?.label,
//     },
//   };
// }

// export default function TicketsList({
//   categoryId = null, // id or name of category; null = all
//   start = 0,
//   stop = 100,
//   onSelectTicket,
//   selectedTicketId,
// }) {
//   const [payload, setPayload] = useState([]); // array of category entries from endpoint
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);

//   useEffect(() => {
//     let mounted = true;
//     const ac = new AbortController();

//     async function load() {
//       setLoading(true);
//       setError(null);
//       try {
//         // endpoint requires start/stop
//         const res = await api.get(`/tickets/category-based/${start}/${stop}/`, {
//           signal: ac.signal,
//         });
//         let data = res?.data;
//         // handle several shapes
//         let arr = [];
//         if (!data) arr = [];
//         else if (Array.isArray(data)) arr = data;
//         else if (Array.isArray(data.results)) arr = data.results;
//         else if (Array.isArray(data.data)) arr = data.data;
//         else arr = [data];

//         if (!mounted) return;
//         setPayload(arr);
//       } catch (err) {
//         if (err?.name === "AbortError") return;
//         console.error("Failed to load category-based tickets:", err);
//         if (mounted) setError("Failed to load tickets");
//         if (mounted) setPayload([]);
//       } finally {
//         if (mounted) setLoading(false);
//       }
//     }

//     load();
//     return () => {
//       mounted = false;
//       ac.abort();
//     };
//   }, [start, stop]);

//   // flatten chats into ticket list and optionally filter by categoryId
//   const tickets = useMemo(() => {
//     const flat = [];
//     payload.forEach((categoryEntry) => {
//       const chats = Array.isArray(categoryEntry?.chats)
//         ? categoryEntry.chats
//         : categoryEntry?.tickets || [];
//       const categoryMeta = {
//         id: categoryEntry?.id ?? categoryEntry?.name,
//         name: categoryEntry?.name ?? categoryEntry?.title,
//       };
//       chats.forEach((c) => {
//         const t = normalizeChatToTicket(c, categoryMeta);
//         flat.push(t);
//       });
//     });

//     if (!categoryId) return flat;
//     // support both numeric/string id and name filtering
//     return flat.filter((t) => {
//       const cid = t.category?.id;
//       const cname = (t.category?.name || "").toString();
//       return (
//         cid === categoryId ||
//         cname === categoryId ||
//         String(cid) === String(categoryId)
//       );
//     });
//   }, [payload, categoryId]);

//   return (
//     <div className="bg-white border border-slate-200 rounded-lg p-4">
//       <div className="flex items-center justify-between mb-3">
//         <div className="text-sm font-semibold text-slate-700">Tickets</div>
//         <div className="text-xs text-slate-500">
//           {loading
//             ? "Loading…"
//             : `${tickets.length} ticket${tickets.length !== 1 ? "s" : ""}`}
//         </div>
//       </div>

//       {error && <div className="text-sm text-red-600 mb-2">{error}</div>}

//       <div className="divide-y divide-slate-100">
//         {loading ? (
//           <div className="py-8 text-center text-sm text-slate-500">
//             Loading tickets…
//           </div>
//         ) : tickets.length === 0 ? (
//           <div className="py-8 text-center text-sm text-slate-500">
//             No tickets
//           </div>
//         ) : (
//           <AnimatePresence>
//             {tickets.map((t) => {
//               const isSelected = selectedTicketId === t.id;
//               return (
//                 <motion.button
//                   key={t.id}
//                   layout
//                   initial={{ opacity: 0, y: 6 }}
//                   animate={{ opacity: 1, y: 0 }}
//                   exit={{ opacity: 0, y: -6 }}
//                   onClick={() => onSelectTicket?.(t)}
//                   className={`w-full text-left p-3 rounded-md transition flex items-start gap-3 ${
//                     isSelected
//                       ? "bg-blue-50 shadow-sm border-l-4 border-blue-500"
//                       : "hover:bg-slate-50"
//                   }`}
//                 >
//                   <div className="w-10 h-10 rounded-full bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center text-white font-semibold">
//                     {String(
//                       (t.email || t.subject || "").slice(0, 2)
//                     ).toUpperCase()}
//                   </div>

//                   <div className="min-w-0">
//                     <div className="flex items-center justify-between gap-2">
//                       <div className="text-sm font-medium text-slate-800 truncate">
//                         {t.email ||
//                           (t.raw?.user?.name ?? t.raw?.name ?? t.subject)}
//                       </div>
//                       <div className="text-xs text-slate-500 whitespace-nowrap flex items-center gap-1">
//                         <FiClock className="w-3 h-3" />
//                         <span>
//                           {new Date(t.createdAt).toLocaleString?.() ??
//                             t.createdAt}
//                         </span>
//                       </div>
//                     </div>

//                     <div className="text-xs text-slate-500 mt-1 truncate">
//                       {t.preview || "No preview available"}
//                     </div>

//                     <div className="flex items-center gap-2 mt-2">
//                       <span className="inline-flex items-center text-[11px] px-2 py-0.5 rounded-full border bg-slate-50 text-slate-700">
//                         {t.category?.name ?? "Uncategorized"}
//                       </span>

//                       <span
//                         className={`inline-flex text-[11px] px-2 py-0.5 rounded-full border ${
//                           t.status === "resolved"
//                             ? "bg-emerald-100 text-emerald-700 border-emerald-200"
//                             : t.status === "escalated"
//                             ? "bg-purple-100 text-purple-700 border-purple-200"
//                             : "bg-amber-50 text-amber-700 border-amber-200"
//                         }`}
//                       >
//                         {t.status}
//                       </span>
//                     </div>
//                   </div>
//                 </motion.button>
//               );
//             })}
//           </AnimatePresence>
//         )}
//       </div>
//     </div>
//   );
// }

// "use client";

// import React, { useEffect, useState, useMemo } from "react";
// import { motion, AnimatePresence } from "framer-motion";
// import { FiClock } from "react-icons/fi";
// import api from "@/lib/axios";

// function normalizeChatToTicket(chat, category) {
//   // chat shape depends on backend; this normalizer is defensive
//   const id = chat?.id ?? chat?.ticket_id ?? String(Math.random()).slice(2, 10);
//   const email =
//     chat?.email && String(chat.email).trim() !== ""
//       ? String(chat.email).trim()
//       : chat?.user_email ?? chat?.user?.email ?? chat?.name ?? "";
//   const subject =
//     chat?.subject ?? chat?.title ?? category?.name ?? "No subject";
//   const preview =
//     chat?.preview ||
//     chat?.last_message ||
//     chat?.message ||
//     (Array.isArray(chat?.messages) && chat.messages[0]?.text) ||
//     "";
//   const rawCreated =
//     chat?.created_at ??
//     chat?.created_at_display ??
//     chat?.pub_date ??
//     new Date().toISOString();

//   // defensive ISO normalization: try to parse and fallback to raw string
//   let createdAt = rawCreated;
//   try {
//     const parsed = Date.parse(String(rawCreated));
//     createdAt = Number.isFinite(parsed)
//       ? new Date(parsed).toISOString()
//       : String(rawCreated);
//   } catch {
//     createdAt = String(rawCreated);
//   }

//   const status =
//     chat?.status ??
//     chat?.progress ??
//     (chat?.resolved ? "resolved" : chat?.escalated ? "escalated" : "pending");

//   return {
//     id,
//     email,
//     subject,
//     preview,
//     createdAt,
//     status: String(status || "pending").toLowerCase(),
//     escalated: !!chat?.escalated,
//     raw: chat,
//     category: {
//       id: category?.id ?? category?.name,
//       name:
//         category?.name ?? category?.title ?? category?.label ?? "Uncategorized",
//     },
//   };
// }

// export default function TicketsList({
//   categoryId = null, // id or name of category; null = all
//   start = 0,
//   stop = 100,
//   onSelectTicket,
//   selectedTicketId,
// }) {
//   const [payload, setPayload] = useState([]); // array of category entries from endpoint
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);

//   useEffect(() => {
//     let mounted = true;
//     const ac = new AbortController();

//     async function load() {
//       setLoading(true);
//       setError(null);
//       try {
//         // endpoint requires start/stop
//         const res = await api.get(`/tickets/category-based/${start}/${stop}/`, {
//           signal: ac.signal,
//         });
//         let data = res?.data;
//         // handle several shapes
//         let arr = [];
//         if (!data) arr = [];
//         else if (Array.isArray(data)) arr = data;
//         else if (Array.isArray(data.results)) arr = data.results;
//         else if (Array.isArray(data.data)) arr = data.data;
//         else arr = [data];

//         if (!mounted) return;
//         setPayload(arr);
//       } catch (err) {
//         if (err?.name === "AbortError") return;
//         console.error("Failed to load category-based tickets:", err);
//         if (mounted) setError("Failed to load tickets");
//         if (mounted) setPayload([]);
//       } finally {
//         if (mounted) setLoading(false);
//       }
//     }

//     load();
//     return () => {
//       mounted = false;
//       ac.abort();
//     };
//   }, [start, stop]);

//   // flatten chats into ticket list and optionally filter by categoryId.
//   // Support "all" (case-insensitive) and null as "show everything".
//   const tickets = useMemo(() => {
//     const flat = [];
//     payload.forEach((categoryEntry) => {
//       const chats = Array.isArray(categoryEntry?.chats)
//         ? categoryEntry.chats
//         : categoryEntry?.tickets || [];
//       const categoryMeta = {
//         id: categoryEntry?.id ?? categoryEntry?.name,
//         name:
//           categoryEntry?.name ?? categoryEntry?.title ?? categoryEntry?.label,
//       };
//       chats.forEach((c) => {
//         const t = normalizeChatToTicket(c, categoryMeta);
//         flat.push(t);
//       });
//     });

//     // If categoryId explicitly asks for "all" (string) or is null/undefined -> return all
//     if (
//       categoryId === null ||
//       categoryId === undefined ||
//       (typeof categoryId === "string" && categoryId.toLowerCase() === "all")
//     ) {
//       // sort newest first
//       return flat.sort((a, b) => {
//         const ta = Date.parse(a.createdAt) || 0;
//         const tb = Date.parse(b.createdAt) || 0;
//         return tb - ta;
//       });
//     }

//     // support both numeric/string id and name filtering
//     const filtered = flat.filter((t) => {
//       const cid = t.category?.id;
//       const cname = (t.category?.name || "").toString();
//       return (
//         cid === categoryId ||
//         cname === categoryId ||
//         String(cid) === String(categoryId) ||
//         String(cname) === String(categoryId)
//       );
//     });

//     // sort newest first
//     return filtered.sort((a, b) => {
//       const ta = Date.parse(a.createdAt) || 0;
//       const tb = Date.parse(b.createdAt) || 0;
//       return tb - ta;
//     });
//   }, [payload, categoryId]);

//   return (
//     <div className="bg-white border border-slate-200 rounded-lg p-4">
//       <div className="flex items-center justify-between mb-3">
//         <div className="text-sm font-semibold text-slate-700">Tickets</div>
//         <div className="text-xs text-slate-500">
//           {loading
//             ? "Loading…"
//             : `${tickets.length} ticket${tickets.length !== 1 ? "s" : ""}`}
//         </div>
//       </div>

//       {error && <div className="text-sm text-red-600 mb-2">{error}</div>}

//       <div className="divide-y divide-slate-100">
//         {loading ? (
//           <div className="py-8 text-center text-sm text-slate-500">
//             Loading tickets…
//           </div>
//         ) : tickets.length === 0 ? (
//           <div className="py-8 text-center text-sm text-slate-500">
//             No tickets
//           </div>
//         ) : (
//           <AnimatePresence>
//             {tickets.map((t) => {
//               const isSelected = selectedTicketId === t.id;
//               return (
//                 <motion.button
//                   key={t.id}
//                   layout
//                   initial={{ opacity: 0, y: 6 }}
//                   animate={{ opacity: 1, y: 0 }}
//                   exit={{ opacity: 0, y: -6 }}
//                   onClick={() => onSelectTicket?.(t)}
//                   className={`w-full text-left p-3 rounded-md transition flex items-start gap-3 ${
//                     isSelected
//                       ? "bg-blue-50 shadow-sm border-l-4 border-blue-500"
//                       : "hover:bg-slate-50"
//                   }`}
//                 >
//                   <div className="w-10 h-10 rounded-full bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center text-white font-semibold">
//                     {String(
//                       (t.email || t.subject || "").slice(0, 2)
//                     ).toUpperCase()}
//                   </div>

//                   <div className="min-w-0">
//                     <div className="flex items-center justify-between gap-2">
//                       <div className="text-sm font-medium text-slate-800 truncate">
//                         {t.email ||
//                           (t.raw?.user?.name ?? t.raw?.name ?? t.subject)}
//                       </div>
//                       <div className="text-xs text-slate-500 whitespace-nowrap flex items-center gap-1">
//                         <FiClock className="w-3 h-3" />
//                         <span>
//                           {(() => {
//                             try {
//                               const d = new Date(t.createdAt);
//                               return isNaN(d.getTime())
//                                 ? t.createdAt
//                                 : d.toLocaleString();
//                             } catch {
//                               return t.createdAt;
//                             }
//                           })()}
//                         </span>
//                       </div>
//                     </div>

//                     <div className="text-xs text-slate-500 mt-1 truncate">
//                       {t.preview || "No preview available"}
//                     </div>

//                     <div className="flex items-center gap-2 mt-2">
//                       <span className="inline-flex items-center text-[11px] px-2 py-0.5 rounded-full border bg-slate-50 text-slate-700">
//                         {t.category?.name ?? "Uncategorized"}
//                       </span>

//                       <span
//                         className={`inline-flex text-[11px] px-2 py-0.5 rounded-full border ${
//                           t.status === "resolved"
//                             ? "bg-emerald-100 text-emerald-700 border-emerald-200"
//                             : t.status === "escalated"
//                             ? "bg-purple-100 text-purple-700 border-purple-200"
//                             : "bg-amber-50 text-amber-700 border-amber-200"
//                         }`}
//                       >
//                         {t.status}
//                       </span>
//                     </div>
//                   </div>
//                 </motion.button>
//               );
//             })}
//           </AnimatePresence>
//         )}
//       </div>
//     </div>
//   );
// }

// "use client";

// import React, { useEffect, useMemo, useState } from "react";
// import { motion, AnimatePresence } from "framer-motion";
// import { FiClock } from "react-icons/fi";
// import api from "@/lib/axios";

// /**
//  * TicketsList with server-backed pagination by category slice.
//  *
//  * Props:
//  *  - categoryId (string|null) : initial category to select (null = All)
//  *  - start (number)           : initial start index for category page (default 0)
//  *  - stop (number)            : NOT used directly — pageSize controls stop; kept for compatibility
//  *  - onSelectTicket(ticket)   : callback when ticket clicked
//  *  - selectedTicketId         : id of currently selected ticket (for UI highlight)
//  */

// function normalizeChatToTicket(chat, category) {
//   const id = chat?.id ?? chat?.ticket_id ?? String(Math.random()).slice(2, 10);
//   const email =
//     chat?.email && String(chat.email).trim() !== ""
//       ? String(chat.email).trim()
//       : chat?.user_email ?? chat?.user?.email ?? chat?.name ?? "";
//   const subject =
//     chat?.subject ?? chat?.title ?? category?.name ?? "No subject";
//   const preview =
//     chat?.preview ||
//     chat?.last_message ||
//     chat?.message ||
//     (Array.isArray(chat?.messages) && chat.messages[0]?.text) ||
//     "";
//   const rawCreated =
//     chat?.created_at ??
//     chat?.created_at_display ??
//     chat?.pub_date ??
//     new Date().toISOString();

//   // normalize to ISO when possible
//   let createdAt = rawCreated;
//   try {
//     const parsed = Date.parse(String(rawCreated));
//     createdAt = Number.isFinite(parsed)
//       ? new Date(parsed).toISOString()
//       : String(rawCreated);
//   } catch {
//     createdAt = String(rawCreated);
//   }

//   const status =
//     chat?.status ??
//     chat?.progress ??
//     (chat?.resolved ? "resolved" : chat?.escalated ? "escalated" : "pending");

//   return {
//     id,
//     email,
//     subject,
//     preview,
//     createdAt,
//     status: String(status || "pending").toLowerCase(),
//     escalated: !!chat?.escalated,
//     raw: chat,
//     category: {
//       id: category?.id ?? category?.name,
//       name:
//         category?.name ?? category?.title ?? category?.label ?? "Uncategorized",
//     },
//   };
// }

// export default function TicketsList({
//   categoryId = null,
//   start = 0,
//   stop = 100, // kept for API compatibility but we compute stop from pageSize
//   onSelectTicket,
//   selectedTicketId,
// }) {
//   const [payload, setPayload] = useState([]); // array of category entries from endpoint
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);

//   // pagination state (for categories slice)
//   const [pageSize, setPageSize] = useState(10);
//   const [currentStart, setCurrentStart] = useState(
//     Number.isFinite(start) ? start : 0
//   );

//   // active category local state — initialized from prop and kept in sync
//   const [activeCategory, setActiveCategory] = useState(
//     categoryId === undefined ? null : categoryId
//   );

//   useEffect(() => {
//     // sync when parent changes categoryId prop
//     setActiveCategory(categoryId === undefined ? null : categoryId);
//   }, [categoryId]);

//   useEffect(() => {
//     let mounted = true;
//     const ac = new AbortController();

//     async function load() {
//       setLoading(true);
//       setError(null);
//       try {
//         const computedStop = Math.max(0, currentStart + pageSize - 1);
//         const res = await api.get(
//           `/tickets/category-based/${currentStart}/${computedStop}/`,
//           {
//             signal: ac.signal,
//           }
//         );
//         let data = res?.data;
//         // normalize shapes -> array
//         let arr = [];
//         if (!data) arr = [];
//         else if (Array.isArray(data)) arr = data;
//         else if (Array.isArray(data.results)) arr = data.results;
//         else if (Array.isArray(data.data)) arr = data.data;
//         else arr = [data];

//         if (!mounted) return;
//         setPayload(arr);
//       } catch (err) {
//         if (err?.name === "AbortError") return;
//         console.error("Failed to load category-based tickets:", err);
//         if (mounted) setError("Failed to load tickets");
//         if (mounted) setPayload([]);
//       } finally {
//         if (mounted) setLoading(false);
//       }
//     }

//     load();
//     return () => {
//       mounted = false;
//       ac.abort();
//     };
//   }, [currentStart, pageSize]);

//   // derive categories list & counts from payload
//   const categories = useMemo(() => {
//     return payload.map((p) => ({
//       id: p?.id ?? p?.name ?? String(Math.random()).slice(2, 8),
//       name: p?.name ?? p?.title ?? p?.label ?? "Uncategorized",
//       chats: Array.isArray(p?.chats)
//         ? p.chats
//         : Array.isArray(p?.tickets)
//         ? p.tickets
//         : [],
//     }));
//   }, [payload]);

//   const counts = useMemo(() => {
//     const map = {};
//     categories.forEach((c) => {
//       map[c.name] = c.chats?.length || 0;
//       map[c.id] = c.chats?.length || 0;
//     });
//     // total for this page
//     map.__page_total = categories.reduce(
//       (s, c) => s + (c.chats?.length || 0),
//       0
//     );
//     return map;
//   }, [categories]);

//   // flattened tickets and optional category filter
//   const tickets = useMemo(() => {
//     const flat = [];
//     categories.forEach((cat) => {
//       const meta = { id: cat.id, name: cat.name };
//       (cat.chats || []).forEach((c) => {
//         flat.push(normalizeChatToTicket(c, meta));
//       });
//     });

//     // interpret "all" (case-insensitive) and null/undefined as show all
//     if (
//       activeCategory === null ||
//       activeCategory === undefined ||
//       (typeof activeCategory === "string" &&
//         activeCategory.toLowerCase() === "all")
//     ) {
//       return flat.sort(
//         (a, b) =>
//           (Date.parse(b.createdAt) || 0) - (Date.parse(a.createdAt) || 0)
//       );
//     }

//     // filter by id or name
//     const filtered = flat.filter((t) => {
//       const cid = t.category?.id;
//       const cname = (t.category?.name || "").toString();
//       return (
//         cid === activeCategory ||
//         cname === activeCategory ||
//         String(cid) === String(activeCategory) ||
//         String(cname) === String(activeCategory)
//       );
//     });

//     return filtered.sort(
//       (a, b) => (Date.parse(b.createdAt) || 0) - (Date.parse(a.createdAt) || 0)
//     );
//   }, [categories, activeCategory]);

//   // pagination helpers
//   const canPrev = currentStart > 0;
//   // If the server returned fewer categories than pageSize, assume no next page
//   const canNext = payload.length >= pageSize;

//   function goPrev() {
//     setCurrentStart((s) => Math.max(0, s - pageSize));
//   }
//   function goNext() {
//     setCurrentStart((s) => s + pageSize);
//   }

//   // when user picks a category tab, reset tickets page offset to 0 (to avoid confusing empty pages)
//   function handleSelectCategory(catId) {
//     setActiveCategory(catId);
//     setCurrentStart(0);
//   }

//   return (
//     <section className="bg-slate-50">
//       <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
//         {/* sticky header + tabs */}
//         <div className="sticky top-0 bg-white z-20 border-b border-slate-200">
//           <div className="flex items-center justify-between p-4">
//             <div className="text-sm font-semibold text-slate-700">Tickets</div>
//             <div className="text-xs text-slate-500">
//               {loading
//                 ? "Loading…"
//                 : `${tickets.length} ticket${tickets.length !== 1 ? "s" : ""}`}
//             </div>
//           </div>

//           <div className="px-4 pb-3">
//             <div
//               role="tablist"
//               aria-label="Ticket categories"
//               className="flex gap-2 overflow-x-auto whitespace-nowrap px-1 py-1"
//             >
//               {/* All tab */}
//               <button
//                 role="tab"
//                 aria-selected={
//                   activeCategory === null ||
//                   (typeof activeCategory === "string" &&
//                     activeCategory.toLowerCase() === "all")
//                 }
//                 onClick={() => handleSelectCategory(null)}
//                 className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition ${
//                   activeCategory === null ||
//                   (typeof activeCategory === "string" &&
//                     activeCategory.toLowerCase() === "all")
//                     ? "bg-slate-900 text-white shadow"
//                     : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
//                 }`}
//               >
//                 <span>All</span>
//                 <span className="inline-flex items-center justify-center px-2 py-0.5 text-xs rounded-full bg-slate-100 text-slate-700">
//                   {counts.__page_total ?? 0}
//                 </span>
//               </button>

//               {loading ? null : categories.length === 0 ? (
//                 <div className="text-sm text-slate-500 px-3 py-1">
//                   No categories
//                 </div>
//               ) : (
//                 categories.map((c) => {
//                   const active =
//                     activeCategory !== null &&
//                     (activeCategory === c.id || activeCategory === c.name);
//                   return (
//                     <button
//                       key={c.id}
//                       role="tab"
//                       aria-selected={active}
//                       onClick={() => handleSelectCategory(c.id)}
//                       className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition ${
//                         active
//                           ? "bg-slate-900 text-white shadow"
//                           : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
//                       }`}
//                     >
//                       <span className="truncate max-w-[10rem]">{c.name}</span>
//                       <span className="inline-flex items-center justify-center px-2 py-0.5 text-xs rounded-full bg-slate-100 text-slate-700">
//                         {c.chats?.length ?? 0}
//                       </span>
//                     </button>
//                   );
//                 })
//               )}
//             </div>
//           </div>
//         </div>

//         {/* content area */}
//         <div className="p-4">
//           {loading ? (
//             <div className="py-8 text-sm text-slate-500">Loading tickets…</div>
//           ) : error ? (
//             <div className="py-6 text-sm text-red-600">{error}</div>
//           ) : tickets.length === 0 ? (
//             <div className="py-8 text-sm text-slate-500">No tickets</div>
//           ) : (
//             <div className="divide-y divide-slate-100">
//               <AnimatePresence>
//                 {tickets.map((t) => {
//                   const isSelected = selectedTicketId === t.id;
//                   return (
//                     <motion.button
//                       key={t.id}
//                       layout
//                       initial={{ opacity: 0, y: 6 }}
//                       animate={{ opacity: 1, y: 0 }}
//                       exit={{ opacity: 0, y: -6 }}
//                       onClick={() => onSelectTicket?.(t)}
//                       className={`w-full text-left p-3 rounded-md transition flex items-start gap-3 ${
//                         isSelected
//                           ? "bg-blue-50 shadow-sm border-l-4 border-blue-500"
//                           : "hover:bg-slate-50"
//                       }`}
//                     >
//                       <div className="w-10 h-10 rounded-full bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center text-white font-semibold">
//                         {String(
//                           (t.email || t.subject || "").slice(0, 2)
//                         ).toUpperCase()}
//                       </div>

//                       <div className="min-w-0">
//                         <div className="flex items-center justify-between gap-2">
//                           <div className="text-sm font-medium text-slate-800 truncate">
//                             {t.email ||
//                               (t.raw?.user?.name ?? t.raw?.name ?? t.subject)}
//                           </div>
//                           <div className="text-xs text-slate-500 whitespace-nowrap flex items-center gap-1">
//                             <FiClock className="w-3 h-3" />
//                             <span>
//                               {(() => {
//                                 try {
//                                   const d = new Date(t.createdAt);
//                                   return isNaN(d.getTime())
//                                     ? t.createdAt
//                                     : d.toLocaleString();
//                                 } catch {
//                                   return t.createdAt;
//                                 }
//                               })()}
//                             </span>
//                           </div>
//                         </div>

//                         <div className="text-xs text-slate-500 mt-1 truncate">
//                           {t.preview || "No preview available"}
//                         </div>

//                         <div className="flex items-center gap-2 mt-2">
//                           <span className="inline-flex items-center text-[11px] px-2 py-0.5 rounded-full border bg-slate-50 text-slate-700">
//                             {t.category?.name ?? "Uncategorized"}
//                           </span>

//                           <span
//                             className={`inline-flex text-[11px] px-2 py-0.5 rounded-full border ${
//                               t.status === "resolved"
//                                 ? "bg-emerald-100 text-emerald-700 border-emerald-200"
//                                 : t.status === "escalated"
//                                 ? "bg-purple-100 text-purple-700 border-purple-200"
//                                 : "bg-amber-50 text-amber-700 border-amber-200"
//                             }`}
//                           >
//                             {t.status}
//                           </span>
//                         </div>
//                       </div>
//                     </motion.button>
//                   );
//                 })}
//               </AnimatePresence>
//             </div>
//           )}
//         </div>

//         {/* pager footer */}
//         <div className="p-3 border-t border-slate-100 bg-white flex items-center justify-between gap-3">
//           <div className="flex items-center gap-2">
//             <button
//               onClick={goPrev}
//               disabled={!canPrev}
//               className="px-3 py-1 rounded-md border border-slate-200 text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50"
//             >
//               Prev
//             </button>
//             <button
//               onClick={goNext}
//               disabled={!canNext}
//               className="px-3 py-1 rounded-md border border-slate-200 text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50"
//             >
//               Next
//             </button>

//             <div className="text-sm text-slate-600 ml-3">
//               Showing categories {currentStart} –{" "}
//               {Math.max(0, currentStart + pageSize - 1)}
//             </div>
//           </div>

//           <div className="flex items-center gap-2">
//             <label className="text-xs text-slate-500">Rows</label>
//             <select
//               value={pageSize}
//               onChange={(e) => {
//                 const n = Number(e.target.value) || 10;
//                 setPageSize(n);
//                 setCurrentStart(0); // reset to front on page size change
//               }}
//               className="text-sm px-2 py-1 border border-slate-300 rounded-md"
//             >
//               {[5, 10, 20, 50].map((n) => (
//                 <option key={n} value={n}>
//                   {n}
//                 </option>
//               ))}
//             </select>
//           </div>
//         </div>
//       </div>
//     </section>
//   );
// }

// export default function TicketsList({ tickets, loading, onSelectTicket }) {
//   if (loading) return <p>Loading...</p>;

//   if (!tickets.length) return <p>No tickets found.</p>;

//   return (
//     <div className="space-y-3">
//       {tickets.map((t) => (
//         <div
//           key={t.id}
//           className="bg-white border p-3 rounded-lg cursor-pointer"
//           onClick={() => onSelectTicket(t)}
//         >
//           <p className="font-semibold">{t.subject}</p>
//           <p className="text-xs text-gray-500">{t.category_name}</p>
//         </div>
//       ))}
//     </div>
//   );
// }

"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ChatModal from "@/components/admin/tickets/ChatModal";
import UserModal from "@/components/admin/tickets/UserModal";
import TicketsList from "@/components/admin/tickets/TicketsList";
import api from "@/lib/axios";

export default function CategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [loadingTickets, setLoadingTickets] = useState(true);

  const [activeCategory, setActiveCategory] = useState(null); // null = ALL
  const [selectedTicket, setSelectedTicket] = useState(null);

  const [chatOpen, setChatOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);

  // --------------------------
  // LOAD CATEGORIES
  // --------------------------
  useEffect(() => {
    async function loadCategories() {
      try {
        const res = await api.get("/get-all-category/");
        const data = Array.isArray(res.data)
          ? res.data
          : res.data?.categories ?? [];
        setCategories(data);
      } catch (err) {
        console.error("CAT ERROR:", err);
      }
    }
    loadCategories();
  }, []);

  // --------------------------
  // LOAD TICKETS (ALL OR BY CATEGORY)
  // --------------------------
  async function loadTickets(categoryId = null) {
    setLoadingTickets(true);
    try {
      let res;

      if (categoryId === null) {
        // GET ALL TICKETS
        res = await api.get("/tickets/all/");
      } else {
        // GET TICKETS BY CATEGORY
        res = await api.get(`/tickets/category/${categoryId}/`);
      }

      const data = Array.isArray(res.data) ? res.data : res.data?.tickets ?? [];
      setTickets(data);
    } catch (err) {
      console.error("TICKET ERROR:", err);
      setTickets([]);
    }
    setLoadingTickets(false);
  }

  // Load ALL tickets on first load
  useEffect(() => {
    loadTickets(null);
  }, []);

  // When user selects a category
  function handleCategorySelect(id) {
    setActiveCategory(id);
    loadTickets(id);
  }

  // --------------------------
  // Modal handlers
  // --------------------------
  function openChat(t) {
    setSelectedTicket(t);
    setChatOpen(true);
  }

  function openUser(t) {
    setSelectedTicket(t);
    setUserOpen(true);
  }

  return (
    <div className="min-h-screen bg-slate-50 py-4 sm:py-6 lg:py-8">
      <div className="max-w-7xl mx-auto px-2 sm:px-4">
        <h1 className="text-2xl font-bold">Tickets</h1>
        <p className="text-sm text-gray-500 mb-4">Browse tickets by category</p>

        {/* CATEGORY BUTTONS */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          <button
            onClick={() => handleCategorySelect(null)}
            className={`px-3 py-1.5 rounded-full text-sm ${
              activeCategory === null
                ? "bg-slate-900 text-white"
                : "bg-white border"
            }`}
          >
            All
          </button>

          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => handleCategorySelect(c.id)}
              className={`px-3 py-1.5 rounded-full text-sm ${
                activeCategory === c.id
                  ? "bg-slate-900 text-white"
                  : "bg-white border"
              }`}
            >
              {c.title ?? c.name}
            </button>
          ))}
        </div>

        {/* TICKETS LIST */}
        <TicketsList
          tickets={tickets}
          loading={loadingTickets}
          onSelectTicket={openChat}
          selectedTicketId={selectedTicket?.id}
        />

        {/* MODALS */}
        <AnimatePresence>
          {chatOpen && (
            <ChatModal
              ticket={selectedTicket}
              open={true}
              onClose={() => setChatOpen(false)}
              onOpenUser={openUser}
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {userOpen && (
            <UserModal
              user={selectedTicket?.user}
              open={true}
              onClose={() => setUserOpen(false)}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
