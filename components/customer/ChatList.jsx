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

// "use client";
// import { motion } from "framer-motion";
// import { format } from "date-fns";
// import { useMemo } from "react";
// import { useAuth } from "@/context/AuthContext"; // adjust path if needed

// export default function ChatList({
//   tickets = [],
//   selected,
//   setSelected,
//   loading = false,
//   userId: propUserId = null, // optional explicit user id
// }) {
//   const listContainer = {
//     hidden: {},
//     visible: { transition: { staggerChildren: 0.05 } },
//   };
//   const listItem = {
//     hidden: { opacity: 0, y: 8 },
//     visible: { opacity: 1, y: 0 },
//   };

//   // fallback to context user if caller didn't provide a userId
//   const { user: ctxUser } = useAuth();
//   const effectiveUserId =
//     propUserId ??
//     ctxUser?.id ??
//     ctxUser?.user_id ??
//     ctxUser?.uid ??
//     ctxUser?.pk ??
//     null;

//   // helper: checks many possible owner field names
//   function ticketBelongsToUser(ticket, uid) {
//     if (!ticket || !uid) return false;

//     const candidates = [
//       ticket.user_id,
//       ticket.userId,
//       ticket.owner_id,
//       ticket.ownerId,
//       ticket.created_by,
//       ticket.createdBy,
//       ticket.requester_id,
//       ticket.requesterId,
//       ticket.requester,
//       ticket.agent_id,
//       ticket.agentId,
//       ticket.customer_id,
//       ticket.customerId,
//       ticket.client_id,
//       ticket.clientId,
//       ticket.assignee_id,
//       ticket.assigneeId,
//       ticket.assigned_to,
//       ticket.assignedTo,
//     ];

//     for (const c of candidates) {
//       if (c === undefined || c === null) continue;
//       if (String(c) === String(uid)) return true;
//     }

//     return false;
//   }

//   const filtered = useMemo(() => {
//     if (!Array.isArray(tickets)) return [];
//     // if no effective user id, return empty array (you asked to filter by user's id)
//     if (!effectiveUserId) return [];
//     return tickets.filter((t) => ticketBelongsToUser(t, effectiveUserId));
//   }, [tickets, effectiveUserId]);

//   return (
//     <motion.div layout className="bg-white rounded shadow p-4 mb-6">
//       <div className="flex items-center justify-between">
//         <h3 className="font-medium text-slate-800">Your Tickets</h3>
//         <div className="text-sm text-slate-500">
//           {loading
//             ? "..."
//             : `Showing ${filtered.length} of ${tickets.length} tickets`}
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
//         ) : effectiveUserId === null ? (
//           <div className="p-6 text-sm text-slate-500">
//             No user id available — cannot filter tickets.
//           </div>
//         ) : filtered.length === 0 ? (
//           <div className="p-6 text-sm text-slate-500">
//             No tickets found for your account.
//           </div>
//         ) : (
//           filtered.map((t) => (
//             <motion.div
//               key={
//                 t.id ??
//                 t.ticket_id ??
//                 `${t.email ?? ""}-${t.createdAt ?? t.created_at ?? ""}`
//               }
//               layout
//               variants={listItem}
//               whileHover={{ scale: 1.01 }}
//               onClick={() => setSelected?.(t)}
//               className={`flex items-center justify-between p-3 cursor-pointer ${
//                 selected?.id === t.id ? "bg-slate-50" : ""
//               }`}
//             >
//               <div>
//                 <div className="font-medium text-slate-800">
//                   {t.category || t.categoryTitle || t.subject || "No subject"}
//                 </div>
//                 <div className="text-xs text-slate-500">
//                   {t.email ?? t.requester_email ?? t.requesterEmail ?? ""}
//                 </div>
//               </div>
//               <div className="text-right">
//                 <div className="inline-block text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded">
//                   Low
//                 </div>
//                 <div className="text-xs text-slate-400 mt-1">
//                   {t.createdAt
//                     ? format(new Date(t.createdAt), "PPpp")
//                     : t.created_at
//                     ? format(new Date(t.created_at), "PPpp")
//                     : "—"}
//                 </div>
//               </div>
//             </motion.div>
//           ))
//         )}
//       </motion.div>
//     </motion.div>
//   );
// }

"use client";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { useMemo } from "react";
import { useAuth } from "@/context/AuthContext"; // adjust path if needed

export default function ChatList({
  tickets = [],
  selected,
  setSelected,
  loading = false,
  userId: propUserId = null, // optional explicit user id
}) {
  const listContainer = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.05 } },
  };
  const listItem = {
    hidden: { opacity: 0, y: 8 },
    visible: { opacity: 1, y: 0 },
  };

  // fallback to context user if caller didn't provide a userId
  const { user: ctxUser } = useAuth();
  const effectiveUserId =
    propUserId ??
    ctxUser?.id ??
    ctxUser?.user_id ??
    ctxUser?.uid ??
    ctxUser?.pk ??
    null;

  // helper: checks many possible owner field names
  function ticketBelongsToUser(ticket, uid) {
    if (!ticket || !uid) return false;

    const candidates = [
      ticket.user_id,
      ticket.userId,
      ticket.owner_id,
      ticket.ownerId,
      ticket.created_by,
      ticket.createdBy,
      ticket.requester_id,
      ticket.requesterId,
      ticket.requester,
      ticket.agent_id,
      ticket.agentId,
      ticket.customer_id,
      ticket.customerId,
      ticket.client_id,
      ticket.clientId,
      ticket.assignee_id,
      ticket.assigneeId,
      ticket.assigned_to,
      ticket.assignedTo,
    ];

    for (const c of candidates) {
      if (c === undefined || c === null) continue;
      if (String(c) === String(uid)) return true;
    }

    return false;
  }

  const filtered = useMemo(() => {
    if (!Array.isArray(tickets)) return [];
    // if no effective user id, return empty array (you asked to filter by user's id)
    if (!effectiveUserId) return [];
    return tickets.filter((t) => ticketBelongsToUser(t, effectiveUserId));
  }, [tickets, effectiveUserId]);

  return (
    <motion.div layout className="bg-white rounded shadow p-4 mb-6">
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-slate-800">Your Tickets</h3>
        <div className="text-sm text-slate-500">
          {loading
            ? "..."
            : `Showing ${filtered.length} of ${tickets.length} tickets`}
        </div>
      </div>

      <motion.div
        variants={listContainer}
        initial="hidden"
        animate="visible"
        className="mt-4 divide-y"
      >
        {loading ? (
          <div className="p-6 text-sm text-slate-500">Loading tickets…</div>
        ) : effectiveUserId === null ? (
          <div className="p-6 text-sm text-slate-500">
            No user id available — cannot filter tickets.
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-6 text-sm text-slate-500">
            No tickets found for your account.
          </div>
        ) : (
          filtered.map((t) => (
            <motion.div
              key={
                t.id ??
                t.ticket_id ??
                `${t.email ?? ""}-${t.createdAt ?? t.created_at ?? ""}`
              }
              layout
              variants={listItem}
              whileHover={{ scale: 1.01 }}
              onClick={() => setSelected?.(t)}
              className={`flex items-center justify-between p-3 cursor-pointer ${
                selected?.id === t.id ? "bg-slate-50" : ""
              }`}
            >
              <div>
                <div className="font-medium text-slate-800">
                  {t.category || t.categoryTitle || t.subject || "No subject"}
                </div>
                <div className="text-xs text-slate-500">
                  {t.email ?? t.requester_email ?? t.requesterEmail ?? ""}
                </div>
              </div>
              <div className="text-right">
                <div className="inline-block text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded">
                  Low
                </div>
                <div className="text-xs text-slate-400 mt-1">
                  {t.createdAt
                    ? format(new Date(t.createdAt), "PPpp")
                    : t.created_at
                    ? format(new Date(t.created_at), "PPpp")
                    : "—"}
                </div>
              </div>
            </motion.div>
          ))
        )}
      </motion.div>
    </motion.div>
  );
}
