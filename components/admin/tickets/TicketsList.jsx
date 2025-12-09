<<<<<<< HEAD
// // "use client";

// // import React, { useEffect, useState } from "react";
// // import { motion, AnimatePresence } from "framer-motion";
// // import { format, isValid } from "date-fns";
// // import api from "@/lib/axios";

// // export default function CategoryTicketsList({
// //   categoryId,
// //   onSelectTicket,
// //   selectedTicketId,
// // }) {
// //   const [tickets, setTickets] = useState([]);
// //   const [loading, setLoading] = useState(false);
// //   const [error, setError] = useState(null);

// //   useEffect(() => {
// //     if (!categoryId) {
// //       setTickets([]);
// //       setLoading(false);
// //       return;
// //     }

// //     let mounted = true;
// //     const ac = new AbortController();

// //     async function load() {
// //       setLoading(true);
// //       setError(null);

// //       try {
// //         let data;
// //         const primary = `/tickets/category-based/?category=${categoryId}`;
// //         const secondary = `/tickets/category-based/${categoryId}/`;
// //         const fallbackAll = `/tickets/`;

// //         if (api && typeof api.get === "function") {
// //           try {
// //             const res = await api.get(primary, { signal: ac.signal });
// //             data = res?.data;
// //           } catch (err) {
// //             if (err?.response?.status === 404 || err?.response?.status === 405) {
// //               try {
// //                 const res2 = await api.get(secondary, { signal: ac.signal });
// //                 data = res2?.data;
// //               } catch (err2) {
// //                 // final fallback: fetch all tickets and filter client-side
// //                 const res3 = await api.get(fallbackAll, { signal: ac.signal });
// //                 const all = res3?.data;
// //                 const arr = Array.isArray(all) ? all : all?.tickets ?? [];
// //                 data = arr.filter((t) => {
// //                   const id =
// //                     t?.category_id ?? t?.categoryId ?? t?.category?.id ?? null;
// //                   return String(id) === String(categoryId);
// //                 });
// //               }
// //             } else {
// //               throw err;
// //             }
// //           }
// //         } else {
// //           const base =
// //             typeof window !== "undefined"
// //               ? process.env.NEXT_PUBLIC_API_BASE
// //               : undefined;
// //           const toUrl = (p) => (base ? `${base.replace(/\/$/, "")}${p}` : p);

// //           const res = await fetch(toUrl(primary), {
// //             method: "GET",
// //             headers: { "Content-Type": "application/json" },
// //             signal: ac.signal,
// //             credentials: "include",
// //           });

// //           if (!res.ok) {
// //             if (res.status === 404 || res.status === 405) {
// //               const res2 = await fetch(toUrl(secondary), {
// //                 method: "GET",
// //                 headers: { "Content-Type": "application/json" },
// //                 signal: ac.signal,
// //                 credentials: "include",
// //               });
// //               if (!res2.ok) {
// //                 const res3 = await fetch(toUrl(fallbackAll), {
// //                   method: "GET",
// //                   headers: { "Content-Type": "application/json" },
// //                   signal: ac.signal,
// //                   credentials: "include",
// //                 });
// //                 const all = res3.ok ? await res3.json().catch(() => null) : null;
// //                 const arr = Array.isArray(all) ? all : all?.tickets ?? [];
// //                 data = arr.filter((t) => {
// //                   const id =
// //                     t?.category_id ?? t?.categoryId ?? t?.category?.id ?? null;
// //                   return String(id) === String(categoryId);
// //                 });
// //               } else {
// //                 data = await res2.json().catch(() => null);
// //               }
// //             } else {
// //               const text = await res.text().catch(() => "");
// //               throw new Error(`Failed to load (${res.status}) ${text}`);
// //             }
// //           } else {
// //             data = await res.json().catch(() => null);
// //           }
// //         }

// //         if (!mounted) return;

// //         // Normalize response - expect array of tickets with id, name, chats
// //         let arr = [];
// //         if (!data) arr = [];
// //         else if (Array.isArray(data)) arr = data;
// //         else if (Array.isArray(data.results)) arr = data.results;
// //         else if (Array.isArray(data.data)) arr = data.data;
// //         else if (Array.isArray(data.tickets)) arr = data.tickets;
// //         else arr = [data];

// //         // Group tickets by name (category name)
// //         const ticketsByCategory = {};
// //         arr.forEach((t) => {
// //           const categoryName = t?.name ?? "From Widget";
// //           if (!ticketsByCategory[categoryName]) {
// //             ticketsByCategory[categoryName] = [];
// //           }
// //           ticketsByCategory[categoryName].push({
// //             id: t?.id ?? null,
// //             name: categoryName,
// //             chats: Array.isArray(t?.chats) ? t.chats : [],
// //             email: t?.email ?? "",
// //             subject: t?.subject ?? categoryName,
// //             status: t?.status ?? "active",
// //             escalated: t?.escalated === true,
// //             created_at: t?.created_at ?? null,
// //             created_at_display: t?.created_at_display ?? null,
// //             raw: t,
// //           });
// //         });

// //         // Flatten grouped tickets for display
// //         const normalized = Object.values(ticketsByCategory).flat();
// //         setTickets(normalized);
// //       } catch (err) {
// //         const isCanceled =
// //           err?.name === "AbortError" ||
// //           err?.name === "CanceledError" ||
// //           err?.code === "ERR_CANCELED" ||
// //           err?.message === "canceled";
// //         if (isCanceled) return;
// //         console.error("Failed to load category tickets:", err);
// //         setError(err?.message ?? "Failed to load tickets");
// //         setTickets([]);
// //       } finally {
// //         if (mounted) setLoading(false);
// //       }
// //     }

// //     load();
// //     return () => {
// //       mounted = false;
// //       ac.abort();
// //     };
// //   }, [categoryId]);

// //   function formatDate(val, display) {
// //     if (display) return display;
// //     if (!val) return "—";
// //     const dt = new Date(val);
// //     if (isValid(dt)) return format(dt, "PPpp");
// //     try {
// //       return String(val).slice(0, 32);
// //     } catch {
// //       return "—";
// //     }
// //   }

// //   return (
// //     <div className="bg-white rounded-lg shadow-sm border border-slate-200">
// //       <div className="p-4 border-b border-slate-200">
// //         <h3 className="text-lg font-semibold text-slate-800">
// //           Tickets in Category
// //         </h3>
// //         <p className="text-sm text-slate-500 mt-1">
// //           {loading
// //             ? "Loading..."
// //             : `${tickets.length} ticket${tickets.length === 1 ? "" : "s"}`}
// //         </p>
// //       </div>

// //       <div className="max-h-[600px] overflow-y-auto">
// //         {loading ? (
// //           <div className="p-8 text-center text-sm text-slate-500">
// //             <div className="flex items-center justify-center gap-2">
// //               <div className="w-5 h-5 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
// //               <span>Loading tickets...</span>
// //             </div>
// //           </div>
// //         ) : error ? (
// //           <div className="p-4 text-sm text-red-600">{error}</div>
// //         ) : tickets.length === 0 ? (
// //           <div className="p-8 text-center text-sm text-slate-500">
// //             <div className="text-4xl mb-2">📋</div>
// //             <p>No tickets found in this category</p>
// //           </div>
// //         ) : (
// //           <ul className="divide-y divide-slate-100">
// //             <AnimatePresence>
// //               {tickets.map((ticket, idx) => {
// //                 const isSelected = selectedTicketId === ticket.id;
// //                 return (
// //                   <motion.li
// //                     key={ticket.id ?? idx}
// //                     initial={{ opacity: 0, y: 8 }}
// //                     animate={{ opacity: 1, y: 0 }}
// //                     exit={{ opacity: 0, y: -8 }}
// //                     onClick={() => onSelectTicket?.(ticket)}
// //                     className={`p-4 cursor-pointer transition-all ${
// //                       isSelected
// //                         ? "bg-blue-50 border-l-4 border-blue-500"
// //                         : "hover:bg-slate-50"
// //                     }`}
// //                   >
// //                     <div className="flex items-start justify-between gap-4">
// //                       <div className="flex-1 min-w-0">
// //                         <div className="flex items-center gap-2 mb-1">
// //                           <h4 className="font-semibold text-slate-800 truncate">
// //                             {ticket.name || ticket.subject || "From Widget"}
// //                           </h4>
// //                           {ticket.escalated &&
// //                             String(ticket.status || "").toLowerCase() !==
// //                               "resolved" && (
// //                               <svg
// //                                 className="w-4 h-4 text-purple-600 shrink-0"
// //                                 fill="currentColor"
// //                                 viewBox="0 0 20 20"
// //                                 aria-label="Escalated"
// //                               >
// //                                 <path
// //                                   fillRule="evenodd"
// //                                   d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
// //                                   clipRule="evenodd"
// //                                 />
// //                               </svg>
// //                             )}
// //                         </div>
// //                         {ticket.email && (
// //                           <p className="text-xs text-slate-500 truncate">
// //                             {ticket.email}
// //                           </p>
// //                         )}
// //                         <p className="text-xs text-slate-400 mt-1">
// //                           {formatDate(
// //                             ticket.created_at,
// //                             ticket.created_at_display
// //                           )}
// //                         </p>
// //                       </div>
// //                       <div className="shrink-0">
// //                         <span
// //                           className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
// //                             ticket.status === "resolved"
// //                               ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
// //                               : ticket.status === "escalated"
// //                               ? "bg-purple-100 text-purple-700 border border-purple-200"
// //                               : ticket.status === "pending"
// //                               ? "bg-amber-100 text-amber-700 border border-amber-200"
// //                               : "bg-blue-100 text-blue-700 border border-blue-200"
// //                           }`}
// //                         >
// //                           {ticket.status || "active"}
// //                         </span>
// //                       </div>
// //                     </div>
// //                   </motion.li>
// //                 );
// //               })}
// //             </AnimatePresence>
// //           </ul>
// //         )}
// //       </div>
// //     </div>
// //   );
// // }

// "use client";

// import React, { useEffect, useState } from "react";
// import { motion, AnimatePresence } from "framer-motion";
// import { format, isValid } from "date-fns";
// import api from "@/lib/axios";

// export default function TicketsList({
//   categoryId,
//   onSelectTicket,
//   selectedTicketId,
//   pageSize = 20,
// }) {
//   const [tickets, setTickets] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState(null);

//   // pagination control
//   const [start, setStart] = useState(0);
//   const [stop, setStop] = useState(pageSize - 1);
//   const [hasMore, setHasMore] = useState(false);

//   useEffect(() => {
//     // whenever category changes, reset pagination
//     setStart(0);
//     setStop(pageSize - 1);
//     setTickets([]);
//   }, [categoryId, pageSize]);

//   useEffect(() => {
//     let mounted = true;
//     const ac = new AbortController();

//     async function load() {
//       setLoading(true);
//       setError(null);

//       try {
//         let resData = null;

//         // Prefer POST to match "req.body start and stop" but also support GET fallback
//         const url = `/tickets/${start}/${stop}/`;

//         // prepare payload to send (and include category filter if present)
//         const payload = { start: Number(start), stop: Number(stop) };
//         if (categoryId) payload.category = categoryId;

//         // Try POST first
//         try {
//           const res = await api.post(url, payload, { signal: ac.signal });
//           resData = res?.data ?? null;
//         } catch (postErr) {
//           // If POST fails with 4xx/5xx, try GET fallback (some APIs use GET)
//           // Also if server rejects POST with CORS etc.
//           try {
//             const params = categoryId ? `?category=${categoryId}` : "";
//             const res2 = await api.get(url + params, { signal: ac.signal });
//             resData = res2?.data ?? null;
//           } catch (getErr) {
//             // Final fallback: try fetching all and client-side filter (if API doesn't support this route)
//             const res3 = await api
//               .get("/tickets/", { signal: ac.signal })
//               .catch(() => null);
//             const all = res3?.data ?? [];
//             const arr = Array.isArray(all)
//               ? all
//               : all?.tickets ?? all?.results ?? [];
//             // filter by category if requested
//             const filtered = categoryId
//               ? arr.filter((t) => {
//                   const id =
//                     t?.category_id ?? t?.categoryId ?? t?.category?.id ?? null;
//                   return String(id) === String(categoryId);
//                 })
//               : arr;
//             resData = filtered;
//           }
//         }

//         if (!mounted) return;

//         // Normalize response to an array
//         let arr = [];
//         if (!resData) arr = [];
//         else if (Array.isArray(resData)) arr = resData;
//         else if (Array.isArray(resData.results)) arr = resData.results;
//         else if (Array.isArray(resData.data)) arr = resData.data;
//         else if (Array.isArray(resData.tickets)) arr = resData.tickets;
//         else arr = [resData];

//         // If the API returned a paginated block with metadata, try to detect hasMore
//         // e.g., { tickets: [...], total: N } or results with next field.
//         const totalMaybe = resData?.total ?? resData?.count ?? null;
//         if (typeof totalMaybe === "number") {
//           const nextStart = stop + 1;
//           setHasMore(totalMaybe > nextStart);
//         } else if (resData?.next) {
//           setHasMore(true);
//         } else {
//           // If returned less than requested pageSize -> likely no more
//           setHasMore(arr.length === pageSize);
//         }

//         // Map/normalize each ticket object into shape expected by UI
//         const normalized = arr.map((t) => ({
//           id: t?.id ?? t?.ticket_id ?? null,
//           name: t?.name ?? t?.subject ?? t?.title ?? "From Widget",
//           chats: Array.isArray(t?.chats) ? t.chats : t?.messages ?? [],
//           email: t?.email ?? t?.user_email ?? "",
//           subject: t?.subject ?? t?.title ?? "",
//           status: t?.status ?? t?.state ?? "active",
//           escalated: t?.escalated === true || t?.priority === "high",
//           created_at: t?.created_at ?? t?.created_on ?? t?.createdAt ?? null,
//           created_at_display: t?.created_at_display ?? null,
//           raw: t,
//         }));

//         // when start == 0 we replace; otherwise append
//         setTickets((prev) =>
//           start === 0 ? normalized : [...prev, ...normalized]
//         );
//       } catch (err) {
//         const isCanceled =
//           err?.name === "AbortError" ||
//           err?.name === "CanceledError" ||
//           err?.code === "ERR_CANCELED" ||
//           err?.message === "canceled";
//         if (isCanceled) return;
//         console.error("Failed to load tickets:", err);
//         setError(err?.message ?? "Failed to load tickets");
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
//   }, [categoryId, start, stop, pageSize]);

//   function loadMore() {
//     // advance pagination
//     const nextStart = stop + 1;
//     const nextStop = nextStart + (pageSize - 1);
//     setStart(nextStart);
//     setStop(nextStop);
//   }

//   function formatDate(val, display) {
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

//   return (
//     <div className="bg-white rounded-lg shadow-sm border border-slate-200">
//       <div className="p-4 border-b border-slate-200">
//         <h3 className="text-lg font-semibold text-slate-800">
//           {categoryId ? `Tickets in Category ${categoryId}` : "All Tickets"}
//         </h3>
//         <p className="text-sm text-slate-500 mt-1">
//           {loading
//             ? "Loading..."
//             : `${tickets.length} ticket${tickets.length === 1 ? "" : "s"}`}
//         </p>
//       </div>

//       <div className="max-h-[600px] overflow-y-auto">
//         {loading ? (
//           <div className="p-8 text-center text-sm text-slate-500">
//             <div className="flex items-center justify-center gap-2">
//               <div className="w-5 h-5 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
//               <span>Loading tickets...</span>
//             </div>
//           </div>
//         ) : error ? (
//           <div className="p-4 text-sm text-red-600">{error}</div>
//         ) : tickets.length === 0 ? (
//           <div className="p-8 text-center text-sm text-slate-500">
//             <div className="text-4xl mb-2">📋</div>
//             <p>No tickets found{categoryId ? " in this category" : ""}</p>
//           </div>
//         ) : (
//           <>
//             <ul className="divide-y divide-slate-100">
//               <AnimatePresence>
//                 {tickets.map((ticket, idx) => {
//                   const isSelected = selectedTicketId === ticket.id;
//                   return (
//                     <motion.li
//                       key={ticket.id ?? idx}
//                       initial={{ opacity: 0, y: 8 }}
//                       animate={{ opacity: 1, y: 0 }}
//                       exit={{ opacity: 0, y: -8 }}
//                       onClick={() => onSelectTicket?.(ticket)}
//                       className={`p-4 cursor-pointer transition-all ${
//                         isSelected
//                           ? "bg-blue-50 border-l-4 border-blue-500"
//                           : "hover:bg-slate-50"
//                       }`}
//                     >
//                       <div className="flex items-start justify-between gap-4">
//                         <div className="flex-1 min-w-0">
//                           <div className="flex items-center gap-2 mb-1">
//                             <h4 className="font-semibold text-slate-800 truncate">
//                               {ticket.name || ticket.subject || "From Widget"}
//                             </h4>
//                             {ticket.escalated &&
//                               String(ticket.status || "").toLowerCase() !==
//                                 "resolved" && (
//                                 <svg
//                                   className="w-4 h-4 text-purple-600 shrink-0"
//                                   fill="currentColor"
//                                   viewBox="0 0 20 20"
//                                   aria-label="Escalated"
//                                 >
//                                   <path
//                                     fillRule="evenodd"
//                                     d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
//                                     clipRule="evenodd"
//                                   />
//                                 </svg>
//                               )}
//                           </div>
//                           {ticket.email && (
//                             <p className="text-xs text-slate-500 truncate">
//                               {ticket.email}
//                             </p>
//                           )}
//                           <p className="text-xs text-slate-400 mt-1">
//                             {formatDate(
//                               ticket.created_at,
//                               ticket.created_at_display
//                             )}
//                           </p>
//                         </div>
//                         <div className="shrink-0">
//                           <span
//                             className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
//                               ticket.status === "resolved"
//                                 ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
//                                 : ticket.status === "escalated"
//                                 ? "bg-purple-100 text-purple-700 border border-purple-200"
//                                 : ticket.status === "pending"
//                                 ? "bg-amber-100 text-amber-700 border border-amber-200"
//                                 : "bg-blue-100 text-blue-700 border border-blue-200"
//                             }`}
//                           >
//                             {ticket.status || "active"}
//                           </span>
//                         </div>
//                       </div>
//                     </motion.li>
//                   );
//                 })}
//               </AnimatePresence>
//             </ul>

//             {/* Load more */}
//             <div className="p-4 border-t border-slate-100 text-center">
//               {hasMore ? (
//                 <button
//                   onClick={loadMore}
//                   className="inline-flex items-center px-4 py-2 rounded bg-slate-900 text-white text-sm"
//                 >
//                   Load more
//                 </button>
//               ) : (
//                 <span className="text-xs text-slate-400">No more tickets</span>
//               )}
//             </div>
//           </>
//         )}
//       </div>
//     </div>
//   );
// }

=======
>>>>>>> parent of cba5be4... categories page removed, ticket page updated
"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { format, isValid } from "date-fns";
import api from "@/lib/axios";

export default function TicketsList({
  categoryId,
  onSelectTicket,
  selectedTicketId,
  pageSize = 20,
}) {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
<<<<<<< HEAD
=======
  const [showEscalatedOnly, setShowEscalatedOnly] = useState(false);
  const [categoryFilters, setCategoryFilters] = useState([
    { label: "All Tickets", value: "all", count: 0 },
  ]);
  const [activeCategory, setActiveCategory] = useState("all");

  // normalize single server ticket -> table row
  function normalizeTicketForTable(t) {
    const id = t?.id ?? String(Math.random()).slice(2, 10);

    // If email empty, use name (your response shows many empty emails)
    const email =
      t?.email && String(t.email).trim() !== ""
        ? String(t.email).trim()
        : t?.name ?? "";

    // Category/subject attempt: subject -> name -> fallback
    const categoryTitle = t?.subject ?? t?.name ?? "From Widget";
    const categoryName = t?.name ?? categoryTitle ?? "From Widget";
>>>>>>> parent of cba5be4... categories page removed, ticket page updated

  // pagination control (start and stop are inclusive)
  const [start, setStart] = useState(0);
  const [stop, setStop] = useState(pageSize - 1);
  const [hasMore, setHasMore] = useState(false);

  // reset pagination on category change
  useEffect(() => {
    setStart(0);
    setStop(pageSize - 1);
    setTickets([]);
  }, [categoryId, pageSize]);

  useEffect(() => {
    let mounted = true;
    const ac = new AbortController();

    async function load() {
      setLoading(true);
      setError(null);

      try {
        let resData = null;

        // Primary endpoint: category-based paginated route
        const categoryBasedUrl = `/tickets/category-based/${start}/${stop}/`;
        const genericPagedUrl = `/tickets/${start}/${stop}/`;

        if (categoryId !== null && categoryId !== undefined) {
          const res = await api.get(categoryBasedUrl, {
            signal: ac.signal,
            params: { category: categoryId },
          });
          resData = res?.data ?? null;
        } else {
          const res = await api.get(genericPagedUrl, { signal: ac.signal });
          resData = res?.data ?? null;
        }

        if (!mounted) return;

        // Normalize to array
        let arr = [];
        if (!resData) arr = [];
        else if (Array.isArray(resData)) arr = resData;
        else if (Array.isArray(resData.results)) arr = resData.results;
        else if (Array.isArray(resData.data)) arr = resData.data;
        else if (Array.isArray(resData.tickets)) arr = resData.tickets;
        else arr = [resData];

        // Determine hasMore:
        const totalMaybe = resData?.total ?? resData?.count ?? null;
        if (typeof totalMaybe === "number") {
          const nextStart = stop + 1;
          setHasMore(totalMaybe > nextStart);
        } else if (resData?.next) {
          setHasMore(true);
        } else {
          // if returned full page size, assume there may be more
          setHasMore(arr.length === pageSize);
        }

        // Normalize tickets to expected shape
        const normalized = arr.map((t) => ({
          id: t?.id ?? t?.ticket_id ?? null,
          name: t?.name ?? t?.subject ?? t?.title ?? "From Widget",
          chats: Array.isArray(t?.chats) ? t.chats : t?.messages ?? [],
          email: t?.email ?? t?.user_email ?? "",
          subject: t?.subject ?? t?.title ?? "",
          status: t?.status ?? t?.state ?? "active",
          escalated: t?.escalated === true || t?.priority === "high",
          created_at: t?.created_at ?? t?.created_on ?? t?.createdAt ?? null,
          created_at_display: t?.created_at_display ?? null,
          raw: t,
        }));

        // if start == 0 -> replace list, else append
        setTickets((prev) =>
          start === 0 ? normalized : [...prev, ...normalized]
        );
      } catch (err) {
        const isCanceled =
          err?.name === "AbortError" ||
          err?.name === "CanceledError" ||
          err?.code === "ERR_CANCELED" ||
          err?.message === "canceled";
        if (isCanceled) return;
        console.error("Failed to load tickets:", err);
        setError(err?.message ?? "Failed to load tickets");
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
  }, [categoryId, start, stop, pageSize]);

<<<<<<< HEAD
  function loadMore() {
    const nextStart = stop + 1;
    const nextStop = nextStart + (pageSize - 1);
    setStart(nextStart);
    setStop(nextStop);
  }
=======
  const categoryFiltered = useMemo(() => {
    if (activeCategory === "all") return tickets;
    return tickets.filter((t) => {
      const name = t.categoryName ?? t.categoryTitle ?? "From Widget";
      return name === activeCategory;
    });
  }, [tickets, activeCategory]);

  const filtered = useMemo(() => {
    if (!search) return categoryFiltered;
    const q = search.toLowerCase();
    return categoryFiltered.filter(
      (t) =>
        (t.email || "").toLowerCase().includes(q) ||
        (t.categoryTitle || "").toLowerCase().includes(q) ||
        (t.preview || "").toLowerCase().includes(q) ||
        (t.status || "").toLowerCase().includes(q)
    );
  }, [categoryFiltered, search]);

  const columns = useMemo(
    () => [
      {
        accessorKey: "email",
        header: "User",
        cell: ({ getValue, row }) => {
          const email = getValue();
          const short = (email || "").split?.("@")?.[0] ?? email;
          return (
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center font-semibold text-white shadow-sm">
                {String(short).slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="font-semibold text-slate-800 truncate">
                  {short}
                </div>
                <div className="text-xs text-slate-500 truncate mt-0.5">
                  {row.original.categoryTitle ?? "No subject"}
                </div>
                {row.original.escalated &&
                  String(row.original.status).toLowerCase() !== "resolved" && (
                    <div className="mt-1">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-100 text-purple-700 border border-purple-200">
                        <svg
                          className="w-3 h-3"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                          aria-label="Escalated"
                        >
                          <path
                            fillRule="evenodd"
                            d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                            clipRule="evenodd"
                          />
                        </svg>
                        Escalated
                      </span>
                    </div>
                  )}
              </div>
            </div>
          );
        },
      },

      {
        accessorKey: "createdAt",
        header: () => (
          <span className="flex items-center gap-1">
            <FiClock className="w-4 h-4" /> Date
          </span>
        ),
        cell: ({ getValue, row }) => {
          // prefer server display if available (row.original.raw.created_at_display)
          const display = row.original?.raw?.created_at_display;
          const ts = getValue();
          const d = display ?? ts;
          try {
            return (
              <div className="text-xs text-slate-500">
                {new Date(d).toLocaleString()}
              </div>
            );
          } catch {
            return <div className="text-xs text-slate-500">{String(d)}</div>;
          }
        },
        enableSorting: false,
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ getValue, row }) => {
          const s = getValue() || "pending";
          const key = String(s).toLowerCase();
          const classes =
            key === "resolved"
              ? "bg-emerald-100 text-emerald-700 border-emerald-200"
              : key === "escalated"
              ? "bg-purple-100 text-purple-700 border-purple-200"
              : key === "pending" || key === "waiting"
              ? "bg-amber-100 text-amber-700 border-amber-200"
              : key === "active" || key === "open"
              ? "bg-blue-100 text-blue-700 border-blue-200"
              : "bg-slate-100 text-slate-700 border-slate-200";

          let Icon = null;
          if (key === "resolved") Icon = FiCheckCircle;
          else if (key === "escalated") Icon = TbAlertTriangle;
          else Icon = FiClock;
          return (
            <div className="flex flex-col items-start gap-1">
              <span
                className={`inline-flex items-center text-xs font-semibold px-3 py-1 rounded-full border ${classes}`}
              >
                {Icon ? <Icon className="w-3 h-3 mr-1" /> : null}
                {s}
              </span>
              {row.original?.escalated &&
                String(row.original?.status || "").toLowerCase() !==
                  "resolved" && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                    <svg
                      className="w-3 h-3"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                      aria-hidden
                    >
                      <path
                        fillRule="evenodd"
                        d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Escalated
                  </span>
                )}
            </div>
          );
        },
      },
    ],
    []
  );

  const table = useReactTable({
    data: filtered,
    columns,
    pageCount: Math.ceil(filtered.length / pageSize),
    state: {},
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });
>>>>>>> parent of cba5be4... categories page removed, ticket page updated

  function formatDate(val, display) {
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

  return (
<<<<<<< HEAD
    <div className="bg-white rounded-lg shadow-sm border border-slate-200">
      <div className="p-4 border-b border-slate-200">
        <h3 className="text-lg font-semibold text-slate-800">
          {categoryId ? `Tickets in Category ${categoryId}` : "All Tickets"}
        </h3>
        <p className="text-sm text-slate-500 mt-1">
          {loading
            ? "Loading..."
            : `${tickets.length} ticket${tickets.length === 1 ? "" : "s"}`}
        </p>
      </div>

      <div className="max-h-[600px] overflow-y-auto">
        {loading ? (
          <div className="p-8 text-center text-sm text-slate-500">
            <div className="flex items-center justify-center gap-2">
              <div className="w-5 h-5 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
              <span>Loading tickets...</span>
=======
    <aside className="h-[calc(100vh-96px)] overflow-auto rounded-lg p-4">
      {/* Search + Controls */}
      <div className="mb-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search tickets..."
              className="px-3 py-2 border border-slate-300 rounded-md text-sm w-64 focus:outline-none"
            />
            <div className="text-sm text-slate-500">
              {loading
                ? "Loading…"
                : `${filtered.length} result${
                    filtered.length === 1 ? "" : "s"
                  }`}
>>>>>>> parent of cba5be4... categories page removed, ticket page updated
            </div>
          </div>
        ) : error ? (
          <div className="p-4 text-sm text-red-600">{error}</div>
        ) : tickets.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-500">
            <div className="text-4xl mb-2">📋</div>
            <p>No tickets found{categoryId ? " in this category" : ""}</p>
          </div>
        ) : (
          <>
            <ul className="divide-y divide-slate-100">
              <AnimatePresence>
                {tickets.map((ticket, idx) => {
                  const isSelected = selectedTicketId === ticket.id;
                  return (
                    <motion.li
                      key={ticket.id ?? idx}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      onClick={() => onSelectTicket?.(ticket)}
                      className={`p-4 cursor-pointer transition-all ${
                        isSelected
                          ? "bg-blue-50 border-l-4 border-blue-500"
                          : "hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold text-slate-800 truncate">
                              {ticket.name || ticket.subject || "From Widget"}
                            </h4>
                            {ticket.escalated &&
                              String(ticket.status || "").toLowerCase() !==
                                "resolved" && (
                                <svg
                                  className="w-4 h-4 text-purple-600 shrink-0"
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                  aria-label="Escalated"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                              )}
                          </div>
                          {ticket.email && (
                            <p className="text-xs text-slate-500 truncate">
                              {ticket.email}
                            </p>
                          )}
                          <p className="text-xs text-slate-400 mt-1">
                            {formatDate(
                              ticket.created_at,
                              ticket.created_at_display
                            )}
                          </p>
                        </div>
                        <div className="shrink-0">
                          <span
                            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              ticket.status === "resolved"
                                ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                                : ticket.status === "escalated"
                                ? "bg-purple-100 text-purple-700 border border-purple-200"
                                : ticket.status === "pending"
                                ? "bg-amber-100 text-amber-700 border border-amber-200"
                                : "bg-blue-100 text-blue-700 border border-blue-200"
                            }`}
                          >
                            {ticket.status || "active"}
                          </span>
                        </div>
                      </div>
                    </motion.li>
                  );
                })}
              </AnimatePresence>
            </ul>

            <div className="p-4 border-t border-slate-100 text-center">
              {hasMore ? (
                <button
                  onClick={loadMore}
                  className="inline-flex items-center px-4 py-2 rounded bg-slate-900 text-white text-sm"
                >
                  Load more
                </button>
              ) : (
                <span className="text-xs text-slate-400">No more tickets</span>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
