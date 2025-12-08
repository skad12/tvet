// "use client";

// import { useState, useEffect } from "react";
// import { motion, AnimatePresence } from "framer-motion";
// import TicketsList from "@/components/admin/tickets/TicketsList";
// import ChatModal from "@/components/admin/tickets/ChatModal";
// import UserModal from "@/components/admin/tickets/UserModal";
// import api from "@/lib/axios";

// export default function TicketsPage() {
//   const [selectedTicket, setSelectedTicket] = useState(null);
//   const [chatOpen, setChatOpen] = useState(false);
//   const [userOpen, setUserOpen] = useState(false);

//   // loading + ticket count
//   const [loading, setLoading] = useState(true);
//   const [ticketsCount, setTicketsCount] = useState(null);
//   const [error, setError] = useState(null);

//   useEffect(() => {
//     let mounted = true;

//     const loadCount = async () => {
//       setLoading(true);
//       setError(null);

//       try {
//         // Prefer axios instance if available
//         let res = null;
//         if (api && typeof api.get === "function") {
//           // endpoint that returns tickets or { tickets: [...] }
//           res = await api.get("/tickets");
//         } else {
//           // fallback: try server proxy
//           const fallback = await fetch("/api/tickets");
//           if (!fallback.ok) throw new Error("fallback fetch failed");
//           const json = await fallback.json();
//           res = { data: json };
//         }

//         // normalize result -> array of tickets
//         const all = Array.isArray(res.data)
//           ? res.data
//           : res.data?.tickets ?? [];

//         if (mounted) {
//           setTicketsCount(all.length);
//         }
//       } catch (err) {
//         console.error("Failed to load ticket count", err);
//         if (mounted) {
//           setError("Failed to load ticket count");
//           // safe fallback: 0
//           setTicketsCount(0);
//         }
//       } finally {
//         if (mounted) setLoading(false);
//       }
//     };

//     loadCount();

//     return () => {
//       mounted = false;
//     };
//   }, []);

//   // open chat modal
//   function openChat(t) {
//     setSelectedTicket(t);
//     setChatOpen(true);
//   }

//   function closeChat() {
//     setChatOpen(false);
//   }

//   useEffect(() => {
//     if (selectedTicket && !chatOpen) setChatOpen(true);
//   }, [selectedTicket, chatOpen]);

//   function openUserDetails(ticket) {
//     setSelectedTicket(ticket);
//     setUserOpen(true);
//   }

//   function closeUser() {
//     setUserOpen(false);
//   }

//   return (
//     <motion.div
//       layout
//       initial={{ opacity: 0, y: 8 }}
//       animate={{ opacity: 1, y: 0 }}
//       className="min-h-screen bg-slate-50 p-3 sm:p-4 lg:p-6"
//     >
//       <main className="max-w-7xl mx-auto px-2 sm:px-4 py-2 sm:py-4">
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
//           Browse and manage support tickets
//         </motion.p>

//         <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
//           <TicketsList onOpenChat={openChat} selectedId={selectedTicket?.id} />
//         </motion.div>
//       </main>

//       <AnimatePresence>
//         {chatOpen && (
//           <ChatModal
//             ticket={selectedTicket}
//             open={true}
//             onClose={closeChat}
//             onOpenUser={openUserDetails}
//             onMessageAdded={(newMsg, ticket) => {
//               api
//                 .post(`/tickets/${ticket.id}/messages`, newMsg)
//                 .catch(console.error);
//             }}
//           />
//         )}
//       </AnimatePresence>

//       <AnimatePresence>
//         {userOpen && (
//           <UserModal
//             user={selectedTicket?.user}
//             open={true}
//             onClose={closeUser}
//           />
//         )}
//       </AnimatePresence>
//     </motion.div>
//   );
// }

"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ChatModal from "@/components/admin/tickets/ChatModal";
import UserModal from "@/components/admin/tickets/UserModal";
import api from "@/lib/axios";
// import AddCategoryModal from "@/components/admin/categories/AddCategoryModal";
import CategoryTicketsList from "@/components/admin/categories/CategoryTicketsList";

export default function CategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [catLoading, setCatLoading] = useState(true);
  const [catError, setCatError] = useState(null);
  const [activeCategory, setActiveCategory] = useState(null);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const [openAdd, setOpenAdd] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function loadCategories() {
      setCatLoading(true);
      setCatError(null);
      try {
        const res = await api.get("/get-all-category/");
        const data = Array.isArray(res.data)
          ? res.data
          : res.data?.categories ?? [];
        if (!mounted) return;
        setCategories(data);
        setActiveCategory(data?.[0]?.id ?? null);
      } catch (err) {
        if (mounted) setCatError("Failed to load categories");
      } finally {
        if (mounted) setCatLoading(false);
      }
    }
    loadCategories();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (selectedTicket) setChatOpen(true);
  }, [selectedTicket]);

  function openChat(t) {
    setSelectedTicket(t);
    setChatOpen(true);
  }
  function closeChat() {
    setChatOpen(false);
  }
  function openUserDetails(ticket) {
    setSelectedTicket(ticket);
    setUserOpen(true);
  }
  function closeUser() {
    setUserOpen(false);
  }

  return (
    <div className="min-h-screen bg-slate-50 py-4 sm:py-6 lg:py-8">
      <div className="max-w-7xl mx-auto px-2 sm:px-4">
        <motion.h1
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-800 mb-1"
        >
          Categories
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-xs sm:text-sm text-slate-500 mb-4 sm:mb-6"
        >
          Browse tickets by category and open conversations
        </motion.p>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="mb-4">
            {catError && (
              <div className="text-red-600 text-sm mb-2">{catError}</div>
            )}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-0 pb-2">
              <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto whitespace-nowrap pb-1 sm:pb-0">
                <button
                  onClick={() => setActiveCategory(null)}
                  className={`inline-flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm font-medium transition shrink-0 ${
                    activeCategory === null
                      ? "bg-slate-900 text-white shadow"
                      : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  All
                </button>
                {(catLoading ? [] : categories).map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setActiveCategory(c.id)}
                    className={`inline-flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm font-medium transition shrink-0 ${
                      activeCategory === c.id
                        ? "bg-slate-900 text-white shadow"
                        : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    {c.title ?? c.name ?? c.label ?? c.id}
                  </button>
                ))}
              </div>
              <div className="shrink-0">
                <button
                  onClick={() => setOpenAdd(true)}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-1 sm:gap-2 bg-blue-600 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded text-xs sm:text-sm shadow hover:opacity-95"
                >
                  <span className="sm:hidden">+ Add</span>
                  <span className="hidden sm:inline">+ Add Category</span>
                </button>
              </div>
            </div>
          </div>
        </motion.div>

        <AnimatePresence>
          {chatOpen && (
            <ChatModal
              ticket={selectedTicket}
              open={true}
              onClose={closeChat}
              onOpenUser={openUserDetails}
              onMessageAdded={(newMsg, ticket) => {
                api
                  .post(`/tickets/${ticket.id}/messages`, newMsg)
                  .catch(console.error);
              }}
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {userOpen && (
            <UserModal
              user={selectedTicket?.user}
              open={true}
              onClose={closeUser}
            />
          )}
        </AnimatePresence>

        {/* <AddCategoryModal
          open={openAdd}
          onClose={() => setOpenAdd(false)}
          onAdded={(newCat) => {
            setCategories((s) => [newCat, ...s]);
            setActiveCategory(newCat?.id ?? null);
            setOpenAdd(false);
          }}
        /> */}

        {/* Category Tickets List */}
        {activeCategory && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="mt-6"
          >
            <CategoryTicketsList
              categoryId={activeCategory}
              onSelectTicket={openChat}
              selectedTicketId={selectedTicket?.id}
            />
          </motion.div>
        )}
      </div>
    </div>
  );
}
