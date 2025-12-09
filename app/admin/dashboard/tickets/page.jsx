// // "use client";

// // import { useEffect, useState } from "react";
// // import { motion, AnimatePresence } from "framer-motion";
// // import ChatModal from "@/components/admin/tickets/ChatModal";
// // import UserModal from "@/components/admin/tickets/UserModal";
// // import api from "@/lib/axios";
// // // import AddCategoryModal from "@/components/admin/categories/AddCategoryModal";
// // import TicketsList from "@/components/admin/tickets/TicketsList";

// // export default function CategoriesPage() {
// //   const [categories, setCategories] = useState([]);
// //   const [catLoading, setCatLoading] = useState(true);
// //   const [catError, setCatError] = useState(null);
// //   const [activeCategory, setActiveCategory] = useState(null);
// //   const [selectedTicket, setSelectedTicket] = useState(null);
// //   const [chatOpen, setChatOpen] = useState(false);
// //   const [userOpen, setUserOpen] = useState(false);
// //   const [openAdd, setOpenAdd] = useState(false);

// //   useEffect(() => {
// //     let mounted = true;
// //     async function loadCategories() {
// //       setCatLoading(true);
// //       setCatError(null);
// //       try {
// //         const res = await api.get("/get-all-category/");
// //         const data = Array.isArray(res.data)
// //           ? res.data
// //           : res.data?.categories ?? [];
// //         if (!mounted) return;
// //         setCategories(data);
// //         setActiveCategory(data?.[0]?.id ?? null);
// //       } catch (err) {
// //         if (mounted) setCatError("Failed to load categories");
// //       } finally {
// //         if (mounted) setCatLoading(false);
// //       }
// //     }
// //     loadCategories();
// //     return () => {
// //       mounted = false;
// //     };
// //   }, []);

// //   useEffect(() => {
// //     if (selectedTicket) setChatOpen(true);
// //   }, [selectedTicket]);

// //   function openChat(t) {
// //     setSelectedTicket(t);
// //     setChatOpen(true);
// //   }
// //   function closeChat() {
// //     setChatOpen(false);
// //   }
// //   function openUserDetails(ticket) {
// //     setSelectedTicket(ticket);
// //     setUserOpen(true);
// //   }
// //   function closeUser() {
// //     setUserOpen(false);
// //   }

// //   return (
// //     <div className="min-h-screen bg-slate-50 py-4 sm:py-6 lg:py-8">
// //       <div className="max-w-7xl mx-auto px-2 sm:px-4">
// //         <motion.h1
// //           initial={{ opacity: 0, y: -10 }}
// //           animate={{ opacity: 1, y: 0 }}
// //           transition={{ duration: 0.4 }}
// //           className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-800 mb-1"
// //         >
// //           Tickets
// //         </motion.h1>
// //         <motion.p
// //           initial={{ opacity: 0, y: -10 }}
// //           animate={{ opacity: 1, y: 0 }}
// //           transition={{ duration: 0.5, delay: 0.1 }}
// //           className="text-xs sm:text-sm text-slate-500 mb-4 sm:mb-6"
// //         >
// //           Browse tickets by category and open conversations
// //         </motion.p>

// //         <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
// //           <div className="mb-4">
// //             {catError && (
// //               <div className="text-red-600 text-sm mb-2">{catError}</div>
// //             )}
// //             <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-0 pb-2">
// //               <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto whitespace-nowrap pb-1 sm:pb-0">
// //                 <button
// //                   onClick={() => setActiveCategory(null)}
// //                   className={`inline-flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm font-medium transition shrink-0 ${
// //                     activeCategory === null
// //                       ? "bg-slate-900 text-white shadow"
// //                       : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
// //                   }`}
// //                 >
// //                   All
// //                 </button>
// //                 {(catLoading ? [] : categories).map((c) => (
// //                   <button
// //                     key={c.id}
// //                     onClick={() => setActiveCategory(c.id)}
// //                     className={`inline-flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm font-medium transition shrink-0 ${
// //                       activeCategory === c.id
// //                         ? "bg-slate-900 text-white shadow"
// //                         : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
// //                     }`}
// //                   >
// //                     {c.title ?? c.name ?? c.label ?? c.id}
// //                   </button>
// //                 ))}
// //               </div>
// //             </div>
// //           </div>
// //         </motion.div>

// //         <AnimatePresence>
// //           {chatOpen && (
// //             <ChatModal
// //               ticket={selectedTicket}
// //               open={true}
// //               onClose={closeChat}
// //               onOpenUser={openUserDetails}
// //               onMessageAdded={(newMsg, ticket) => {
// //                 api
// //                   .post(`/tickets/${ticket.id}/messages`, newMsg)
// //                   .catch(console.error);
// //               }}
// //             />
// //           )}
// //         </AnimatePresence>

// //         <AnimatePresence>
// //           {userOpen && (
// //             <UserModal
// //               user={selectedTicket?.user}
// //               open={true}
// //               onClose={closeUser}
// //             />
// //           )}
// //         </AnimatePresence>

// //         {/* Category Tickets List */}
// //         {activeCategory && (
// //           <motion.div
// //             initial={{ opacity: 0, y: 10 }}
// //             animate={{ opacity: 1, y: 0 }}
// //             transition={{ duration: 0.3 }}
// //             className="mt-6"
// //           >
// //             <TicketsList
// //               categoryId={activeCategory}
// //               onSelectTicket={openChat}
// //               selectedTicketId={selectedTicket?.id}
// //             />
// //           </motion.div>
// //         )}
// //       </div>
// //     </div>
// //   );
// // }

// "use client";

// import { useEffect, useState } from "react";
// import { motion, AnimatePresence } from "framer-motion";
// import ChatModal from "@/components/admin/tickets/ChatModal";
// import UserModal from "@/components/admin/tickets/UserModal";
// import api from "@/lib/axios";
// // import AddCategoryModal from "@/components/admin/categories/AddCategoryModal";
// import TicketsList from "@/components/admin/tickets/TicketsList";

// export default function CategoriesPage() {
//   const [categories, setCategories] = useState([]);
//   const [catLoading, setCatLoading] = useState(true);
//   const [catError, setCatError] = useState(null);
//   // default to null so "All" shows all tickets
//   const [activeCategory, setActiveCategory] = useState(null);
//   const [selectedTicket, setSelectedTicket] = useState(null);
//   const [chatOpen, setChatOpen] = useState(false);
//   const [userOpen, setUserOpen] = useState(false);
//   const [openAdd, setOpenAdd] = useState(false);

//   useEffect(() => {
//     let mounted = true;
//     async function loadCategories() {
//       setCatLoading(true);
//       setCatError(null);
//       try {
//         const res = await api.get("/get-all-category/");
//         const data = Array.isArray(res.data)
//           ? res.data
//           : res.data?.categories ?? [];
//         if (!mounted) return;
//         setCategories(data);
//         // IMPORTANT: do NOT force-select the first category here.
//         // Keep activeCategory as-is (null = All) so "All" works as expected.
//       } catch (err) {
//         if (mounted) setCatError("Failed to load categories");
//       } finally {
//         if (mounted) setCatLoading(false);
//       }
//     }
//     loadCategories();
//     return () => {
//       mounted = false;
//     };
//   }, []);

//   useEffect(() => {
//     if (selectedTicket) setChatOpen(true);
//   }, [selectedTicket]);

//   function openChat(t) {
//     setSelectedTicket(t);
//     setChatOpen(true);
//   }
//   function closeChat() {
//     setChatOpen(false);
//   }
//   function openUserDetails(ticket) {
//     setSelectedTicket(ticket);
//     setUserOpen(true);
//   }
//   function closeUser() {
//     setUserOpen(false);
//   }

//   return (
//     <div className="min-h-screen bg-slate-50 py-4 sm:py-6 lg:py-8">
//       <div className="max-w-7xl mx-auto px-2 sm:px-4">
//         <motion.h1
//           initial={{ opacity: 0, y: -10 }}
//           animate={{ opacity: 1, y: 0 }}
//           transition={{ duration: 0.4 }}
//           className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-800 mb-1"
//         >
//           Tickets
//         </motion.h1>
//         <motion.p
//           initial={{ opacity: 0, y: -10 }}
//           animate={{ opacity: 1, y: 0 }}
//           transition={{ duration: 0.5, delay: 0.1 }}
//           className="text-xs sm:text-sm text-slate-500 mb-4 sm:mb-6"
//         >
//           Browse tickets by category and open conversations
//         </motion.p>

//         <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
//           <div className="mb-4">
//             {catError && (
//               <div className="text-red-600 text-sm mb-2">{catError}</div>
//             )}
//             <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-0 pb-2">
//               <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto whitespace-nowrap pb-1 sm:pb-0">
//                 <button
//                   onClick={() => setActiveCategory(null)}
//                   className={`inline-flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm font-medium transition shrink-0 ${
//                     activeCategory === null
//                       ? "bg-slate-900 text-white shadow"
//                       : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
//                   }`}
//                 >
//                   All
//                 </button>
//                 {(catLoading ? [] : categories).map((c) => (
//                   <button
//                     key={c.id}
//                     onClick={() => setActiveCategory(c.id)}
//                     className={`inline-flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm font-medium transition shrink-0 ${
//                       activeCategory === c.id
//                         ? "bg-slate-900 text-white shadow"
//                         : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
//                     }`}
//                   >
//                     {c.title ?? c.name ?? c.label ?? c.id}
//                   </button>
//                 ))}
//               </div>
//             </div>
//           </div>
//         </motion.div>

//         <AnimatePresence>
//           {chatOpen && (
//             <ChatModal
//               ticket={selectedTicket}
//               open={true}
//               onClose={closeChat}
//               onOpenUser={openUserDetails}
//               onMessageAdded={(newMsg, ticket) => {
//                 api
//                   .post(`/tickets/${ticket.id}/messages`, newMsg)
//                   .catch(console.error);
//               }}
//             />
//           )}
//         </AnimatePresence>

//         <AnimatePresence>
//           {userOpen && (
//             <UserModal
//               user={selectedTicket?.user}
//               open={true}
//               onClose={closeUser}
//             />
//           )}
//         </AnimatePresence>

//         {/* Category Tickets List */}
//         {/* Always render TicketsList — pass `null` for categoryId to show ALL tickets */}
//         <motion.div
//           initial={{ opacity: 0, y: 10 }}
//           animate={{ opacity: 1, y: 0 }}
//           transition={{ duration: 0.3 }}
//           className="mt-6"
//         >
//           <TicketsList
//             categoryId={activeCategory}
//             onSelectTicket={openChat}
//             selectedTicketId={selectedTicket?.id}
//           />
//         </motion.div>
//       </div>
//     </div>
//   );
// }

// "use client";

// import { useEffect, useState } from "react";
// import { motion, AnimatePresence } from "framer-motion";
// import ChatModal from "@/components/admin/tickets/ChatModal";
// import UserModal from "@/components/admin/tickets/UserModal";
// import api from "@/lib/axios";
// // import AddCategoryModal from "@/components/admin/categories/AddCategoryModal";
// import TicketsList from "@/components/admin/tickets/TicketsList";

// export default function CategoriesPage() {
//   const [categories, setCategories] = useState([]);
//   const [catLoading, setCatLoading] = useState(true);
//   const [catError, setCatError] = useState(null);
//   // default to null so "All" shows all tickets
//   const [activeCategory, setActiveCategory] = useState(null);
//   const [selectedTicket, setSelectedTicket] = useState(null);
//   const [chatOpen, setChatOpen] = useState(false);
//   const [userOpen, setUserOpen] = useState(false);
//   const [openAdd, setOpenAdd] = useState(false);

//   useEffect(() => {
//     let mounted = true;
//     async function loadCategories() {
//       setCatLoading(true);
//       setCatError(null);
//       try {
//         const res = await api.get("/get-all-category/");
//         // Accept either an array or { categories: [...] }
//         const data = Array.isArray(res.data)
//           ? res.data
//           : res.data?.categories ?? [];
//         if (!mounted) return;
//         setCategories(data);
//         // keep activeCategory as-is (null = All). If you want first category selected by default, uncomment:
//         // setActiveCategory(prev => prev ?? data?.[0]?.id ?? null);
//       } catch (err) {
//         console.error("Failed to load categories", err);
//         if (mounted) setCatError("Failed to load categories");
//       } finally {
//         if (mounted) setCatLoading(false);
//       }
//     }
//     loadCategories();
//     return () => {
//       mounted = false;
//     };
//   }, []);

//   useEffect(() => {
//     if (selectedTicket) setChatOpen(true);
//   }, [selectedTicket]);

//   function openChat(t) {
//     setSelectedTicket(t);
//     setChatOpen(true);
//   }
//   function closeChat() {
//     setChatOpen(false);
//   }
//   function openUserDetails(ticket) {
//     setSelectedTicket(ticket);
//     setUserOpen(true);
//   }
//   function closeUser() {
//     setUserOpen(false);
//   }

//   return (
//     <div className="min-h-screen bg-slate-50 py-4 sm:py-6 lg:py-8">
//       <div className="max-w-7xl mx-auto px-2 sm:px-4">
//         <motion.h1
//           initial={{ opacity: 0, y: -10 }}
//           animate={{ opacity: 1, y: 0 }}
//           transition={{ duration: 0.4 }}
//           className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-800 mb-1"
//         >
//           Tickets
//         </motion.h1>
//         <motion.p
//           initial={{ opacity: 0, y: -10 }}
//           animate={{ opacity: 1, y: 0 }}
//           transition={{ duration: 0.5, delay: 0.1 }}
//           className="text-xs sm:text-sm text-slate-500 mb-4 sm:mb-6"
//         >
//           Browse tickets by category and open conversations
//         </motion.p>

//         <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
//           <div className="mb-4">
//             {catError && (
//               <div className="text-red-600 text-sm mb-2">{catError}</div>
//             )}
//             <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-0 pb-2">
//               <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto whitespace-nowrap pb-1 sm:pb-0">
//                 <button
//                   onClick={() => setActiveCategory(null)}
//                   className={`inline-flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm font-medium transition shrink-0 ${
//                     activeCategory === null
//                       ? "bg-slate-900 text-white shadow"
//                       : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
//                   }`}
//                 >
//                   All
//                 </button>
//                 {(catLoading ? [] : categories).map((c) => (
//                   <button
//                     key={c.id ?? c.name}
//                     onClick={() => setActiveCategory(c.id ?? c.name)}
//                     className={`inline-flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm font-medium transition shrink-0 ${
//                       activeCategory === (c.id ?? c.name)
//                         ? "bg-slate-900 text-white shadow"
//                         : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
//                     }`}
//                   >
//                     {c.title ?? c.name ?? c.label ?? c.id}
//                   </button>
//                 ))}
//               </div>
//             </div>
//           </div>
//         </motion.div>

//         <AnimatePresence>
//           {chatOpen && (
//             <ChatModal
//               ticket={selectedTicket}
//               open={true}
//               onClose={closeChat}
//               onOpenUser={openUserDetails}
//               onMessageAdded={(newMsg, ticket) => {
//                 api
//                   .post(`/tickets/${ticket.id}/messages`, newMsg)
//                   .catch(console.error);
//               }}
//             />
//           )}
//         </AnimatePresence>

//         <AnimatePresence>
//           {userOpen && (
//             <UserModal
//               user={selectedTicket?.user}
//               open={true}
//               onClose={closeUser}
//             />
//           )}
//         </AnimatePresence>

//         {/* Category Tickets List */}
//         {/* Always render TicketsList — pass selected category id/name so the list shows that category's tickets. */}
//         <motion.div
//           initial={{ opacity: 0, y: 10 }}
//           animate={{ opacity: 1, y: 0 }}
//           transition={{ duration: 0.3 }}
//           className="mt-6"
//         >
//           <TicketsList
//             // pass category id or name; TicketsList will handle null/"all"
//             categoryId={activeCategory}
//             // you can change start/stop props if you want different pagination behaviour
//             start={0}
//             stop={100}
//             onSelectTicket={openChat}
//             selectedTicketId={selectedTicket?.id}
//           />
//         </motion.div>
//       </div>
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
