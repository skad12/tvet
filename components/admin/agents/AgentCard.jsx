// "use client";

// import { motion } from "framer-motion";
// import { LuMail } from "react-icons/lu";
// import { FiPhoneCall } from "react-icons/fi";

// export default function AgentCard({ agent, currentUserEmail = null }) {
//   const {
//     username = "Agent",
//     email = "",
//     phone = "—",
//     status = "offline",
//   } = agent;

//   const normalizeStatus = (value) => {
//     const v = String(value || "").toLowerCase();
//     if (v === "available") return "available";
//     if (v === "engaged") return "engaged";
//     return "offline";
//   };

//   const liveStatus = normalizeStatus(status);

//   const statusStyles = {
//     available: {
//       badge: "bg-emerald-50 text-emerald-700",
//       dot: "bg-emerald-500",
//       label: "Available",
//     },
//     engaged: {
//       badge: "bg-blue-50 text-blue-700",
//       dot: "bg-blue-500",
//       label: "Engaged",
//     },
//     offline: {
//       badge: "bg-red-50 text-red-700",
//       dot: "bg-red-500",
//       label: "Offline",
//     },
//   };

//   const { badge, dot, label } =
//     statusStyles[liveStatus] || statusStyles.offline;

//   const initials = (username || "U")
//     .split(/\s|[._-]/)
//     .map((s) => (s ? s[0] : ""))
//     .slice(0, 2)
//     .join("")
//     .toUpperCase();

//   const isYou =
//     currentUserEmail &&
//     email &&
//     currentUserEmail.toLowerCase() === email.toLowerCase();

//   return (
//     <motion.article
//       layout
//       initial={{ opacity: 0, y: 8 }}
//       animate={{ opacity: 1, y: 0 }}
//       whileHover={{ y: -4 }}
//       transition={{ duration: 0.2 }}
//       className={`bg-white rounded-lg shadow-sm p-6 ${
//         isYou ? "ring-2 ring-blue-200" : ""
//       }`}
//       role="article"
//     >
//       <div className="flex items-start gap-4">
//         <div className="relative">
//           <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 font-semibold">
//             {initials}
//           </div>

//           <span
//             className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${dot}`}
//             aria-hidden
//             title={label}
//           />
//         </div>

//         <div className="flex-1">
//           <div className="flex items-start justify-between gap-2">
//             <div>
//               <div className="text-slate-800 font-semibold">
//                 {username}{" "}
//                 {isYou && (
//                   <span className="ml-2 text-xs text-blue-600">(You)</span>
//                 )}
//               </div>
//               <div
//                 className={`text-xs mt-1 px-2 py-0.5 rounded-full inline-block ${badge}`}
//               >
//                 {label}
//               </div>
//             </div>

//             <div className="text-xs text-slate-400">{/* action area */}</div>
//           </div>

//           <div className="mt-4 text-sm text-slate-600 space-y-2">
//             <div className="flex items-center gap-2">
//               <LuMail />
//               <div className="truncate">{email}</div>
//             </div>

//             <div className="flex items-center gap-2">
//               <FiPhoneCall />
//               <div className="truncate">{phone}</div>
//             </div>
//           </div>
//         </div>
//       </div>
//     </motion.article>
//   );
// }

"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { LuMail } from "react-icons/lu";
import { FiPhoneCall } from "react-icons/fi";
import { FiTrash2 } from "react-icons/fi";

export default function AgentCard({
  agent,
  currentUserEmail = null,
  onDelete,
}) {
  const [isHovered, setIsHovered] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const {
    username = "Agent",
    email = "",
    phone = "—",
    status = "offline",
  } = agent;

  const normalizeStatus = (value) => {
    const v = String(value || "").toLowerCase();
    if (v === "available") return "available";
    if (v === "engaged") return "engaged";
    return "offline";
  };

  const liveStatus = normalizeStatus(status);

  const statusStyles = {
    available: {
      badge: "bg-emerald-50 text-emerald-700",
      dot: "bg-emerald-500",
      label: "Available",
    },
    engaged: {
      badge: "bg-blue-50 text-blue-700",
      dot: "bg-blue-500",
      label: "Engaged",
    },
    offline: {
      badge: "bg-red-50 text-red-700",
      dot: "bg-red-500",
      label: "Offline",
    },
  };

  const { badge, dot, label } =
    statusStyles[liveStatus] || statusStyles.offline;

  const initials = (username || "U")
    .split(/\s|[._-]/)
    .map((s) => (s ? s[0] : ""))
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const isYou =
    currentUserEmail &&
    email &&
    currentUserEmail.toLowerCase() === email.toLowerCase();

  const handleDeleteClick = (e) => {
    e.stopPropagation();
    if (!onDelete || isDeleting) return;
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    setShowDeleteModal(false);
    try {
      await onDelete(agent.id);
    } catch (error) {
      console.error("Failed to delete agent:", error);
      setIsDeleting(false);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteModal(false);
  };

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`relative bg-white rounded-lg shadow-sm p-6 ${
        isYou ? "ring-2 ring-blue-200" : ""
      } ${isDeleting ? "opacity-50 pointer-events-none" : ""}`}
      role="article"
    >
      {isHovered && onDelete && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          onClick={handleDeleteClick}
          disabled={isDeleting}
          className="absolute top-3 right-3 p-2 rounded-full bg-red-50 hover:bg-red-100 text-red-600 transition-colors z-10"
          title="Delete agent"
        >
          <FiTrash2 className="w-4 h-4" />
        </motion.button>
      )}

      {showDeleteModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={handleCancelDelete}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6"
          >
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                <FiTrash2 className="w-6 h-6 text-red-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  Delete Agent
                </h3>
                <p className="text-sm text-slate-600 mb-4">
                  Are you sure you want to delete{" "}
                  <span className="font-semibold">{username}</span>? This action
                  cannot be undone.
                </p>
                <div className="flex gap-3 justify-end">
                  <button
                    onClick={handleCancelDelete}
                    className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmDelete}
                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                  >
                    Delete Agent
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
      <div className="flex items-start gap-4">
        <div className="relative">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 font-semibold">
            {initials}
          </div>

          <span
            className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${dot}`}
            aria-hidden
            title={label}
          />
        </div>

        <div className="flex-1">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="text-slate-800 font-semibold">
                {username}{" "}
                {isYou && (
                  <span className="ml-2 text-xs text-blue-600">(You)</span>
                )}
              </div>
              <div
                className={`text-xs mt-1 px-2 py-0.5 rounded-full inline-block ${badge}`}
              >
                {label}
              </div>
            </div>

            <div className="text-xs text-slate-400">{/* action area */}</div>
          </div>

          <div className="mt-4 text-sm text-slate-600 space-y-2">
            <div className="flex items-center gap-2">
              <LuMail />
              <div className="truncate">{email}</div>
            </div>

            <div className="flex items-center gap-2">
              <FiPhoneCall />
              <div className="truncate">{phone}</div>
            </div>
          </div>
        </div>
      </div>
    </motion.article>
  );
}
