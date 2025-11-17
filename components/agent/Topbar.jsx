// "use client";

// import { motion, AnimatePresence } from "framer-motion";
// import { useState } from "react";
// import { useAuth } from "@/context/AuthContext"; // adjust path if needed

// export default function Navbar({ userEmail }) {
//   const { signOut, user } = useAuth();
//   const [isModalOpen, setIsModalOpen] = useState(false);

//   const userId =
//     user?.app_user_id ??
//     user?.appUserId ??
//     user?.user_id ??
//     user?.userId ??
//     user?.id ??
//     user?.uid ??
//     user?.pk ??
//     null;
//   const accountType = user?.account_type ?? user?.role ?? user?.type ?? "user";
//   const displayName =
//     user?.name ??
//     user?.full_name ??
//     user?.fullName ??
//     (userEmail ? userEmail.split("@")[0] : "User");
//   const displayEmail = userEmail ?? user?.email ?? user?.username ?? "";

//   async function handleSignOut(e) {
//     e?.preventDefault?.();
//     try {
//       // signOut defined in AuthContext will clear storage and redirect
//       await signOut("/");
//     } catch (err) {
//       console.error("Failed to sign out:", err);
//       try {
//         localStorage.removeItem("user");
//         localStorage.removeItem("token");
//       } catch (e) {}
//       window.location.href = "/";
//     }
//   }

//   return (
//     <>
//       <motion.div
//         className="flex items-center justify-between mb-8"
//         initial={{ opacity: 0, y: -6 }}
//         animate={{ opacity: 1, y: 0 }}
//         transition={{ duration: 0.4 }}
//       >
//         <div>
//           <h2 className="text-2xl font-semibold">Hi {displayName} 👋</h2>
//           <div className="text-sm text-slate-500 mt-1">
//             {displayEmail || "You are viewing your dashboard."}
//           </div>
//           <div className="mt-1 text-xs text-slate-500">
//             <span className="font-medium text-slate-600">
//               ID: {userId ? String(userId) : "—"}
//             </span>
//             <span className="mx-2">•</span>
//             <span className="uppercase tracking-wide text-slate-500">
//               {String(accountType || "user")}
//             </span>
//           </div>
//         </div>

//         <div className="flex items-center gap-3">
//           {/* <button
//             onClick={() => setIsModalOpen(true)}
//             className="px-4 py-2 bg-blue-600 text-white rounded"
//             aria-haspopup="dialog"
//             aria-expanded={isModalOpen}
//           >
//             New Ticket
//           </button> */}

//           <button
//             onClick={handleSignOut}
//             className="px-4 py-2 border rounded"
//             aria-label="Sign out"
//           >
//             Logout
//           </button>
//         </div>
//       </motion.div>

//       {/* Controlled modal
//       <AnimatePresence>
//         {isModalOpen && (
//           <CreateTicket
//             isOpen={isModalOpen}
//             onClose={() => setIsModalOpen(false)}
//             defaultReporterEmail={displayEmail}
//           />
//         )}
//       </AnimatePresence> */}
//     </>
//   );
// }

"use client";

import { motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext"; // adjust path if needed

export default function Navbar({ userEmail }) {
  const { signOut, user } = useAuth();

  const userId =
    user?.app_user_id ??
    user?.appUserId ??
    user?.user_id ??
    user?.userId ??
    user?.id ??
    user?.uid ??
    user?.pk ??
    null;
  const accountType = user?.account_type ?? user?.role ?? user?.type ?? "user";
  const displayName =
    user?.name ??
    user?.full_name ??
    user?.fullName ??
    (userEmail ? userEmail.split("@")[0] : "User");
  const displayEmail = userEmail ?? user?.email ?? user?.username ?? "";

  async function handleSignOut(e) {
    e?.preventDefault?.();
    try {
      // signOut defined in AuthContext will clear storage and redirect
      await signOut("/");
    } catch (err) {
      console.error("Failed to sign out:", err);
      try {
        localStorage.removeItem("user");
        localStorage.removeItem("token");
      } catch (e) {}
      window.location.href = "/";
    }
  }

  return (
    <motion.div
      className="flex items-center justify-between mb-8"
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div>
        <h2 className="text-2xl font-semibold">Hi {displayName} 👋</h2>
        <div className="text-sm text-slate-500 mt-1">
          {displayEmail || "You are viewing your dashboard."}
        </div>
        <div className="mt-1 text-xs text-slate-500">
          <span className="font-medium text-slate-600">
            ID: {userId ? String(userId) : "—"}
          </span>
          <span className="mx-2">•</span>
          <span className="uppercase tracking-wide text-slate-500">
            {String(accountType || "user")}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={handleSignOut}
          className="px-4 py-2 border rounded"
          aria-label="Sign out"
        >
          Logout
        </button>
      </div>
    </motion.div>
  );
}
