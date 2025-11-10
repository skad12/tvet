// import React from "react";

// export default function RecentActivity({ activities }) {
//   return (
//     <section className="lg:col-span-2 bg-white rounded-lg border border-slate-200 shadow-sm p-6">
//       <div className="flex items-center justify-between mb-4">
//         <h3 className="text-xl font-medium text-slate-800">Recent Activity</h3>
//       </div>
//       <ul className="space-y-3">
//         {activities.map((r, idx) => (
//           <li
//             key={idx}
//             className="flex items-center justify-between bg-slate-50 rounded p-3 border border-slate-200"
//           >
//             <div>
//               <div className="font-medium text-slate-800">
//                 {r.customer_name}
//               </div>
//               <div className="text-sm text-slate-500">{r.action}</div>
//             </div>
//             <div className="text-right">
//               <div className="text-xs text-slate-400">{r.ago}</div>
//               <div
//                 className={`mt-2 text-xs px-2 py-1 rounded ${
//                   r.status === "resolved"
//                     ? "bg-green-50 text-green-700"
//                     : r.status === "waiting"
//                     ? "bg-yellow-50 text-yellow-700"
//                     : "bg-blue-50 text-blue-700"
//                 }`}
//               >
//                 {r.status}
//               </div>
//             </div>
//           </li>
//         ))}
//       </ul>
//     </section>
//   );
// }

// import React from "react";

// export default function RecentActivity({ activities = [] }) {
//   return (
//     <section className="lg:col-span-2 bg-white rounded-lg border border-slate-200 shadow-sm p-6">
//       <div className="flex items-center justify-between mb-4">
//         <h3 className="text-xl font-medium text-slate-800">Recent Activity</h3>
//       </div>

//       {activities.length === 0 ? (
//         <div className="py-6 text-center text-sm text-slate-500">
//           No recent activity
//         </div>
//       ) : (
//         <ul className="space-y-3">
//           {activities.map((r, idx) => (
//             <li
//               key={idx}
//               className="flex items-center justify-between bg-slate-50 rounded p-3 border border-slate-200"
//             >
//               {/* Left side (customer + status) */}
//               <div>
//                 <div className="font-medium text-slate-800">
//                   {r.customer_name || "Unknown"}
//                 </div>
//                 <div className="text-sm text-slate-500">
//                   {r.ticket_status || "Pending"}
//                 </div>
//               </div>

//               {/* Right side (time + colored badge) */}
//               <div className="text-right">
//                 <div className="text-xs text-slate-400">
//                   {r.how_long_ago || "–"}
//                 </div>
//                 <div
//                   className={`mt-2 text-xs px-2 py-1 rounded ${
//                     (r.ticket_status || "").toLowerCase() === "resolved"
//                       ? "bg-green-50 text-green-700"
//                       : (r.ticket_status || "").toLowerCase() === "pending"
//                       ? "bg-yellow-50 text-yellow-700"
//                       : (r.ticket_status || "").toLowerCase() === "active"
//                       ? "bg-blue-50 text-blue-700"
//                       : "bg-slate-50 text-slate-500"
//                   }`}
//                 >
//                   {r.ticket_status || "N/A"}
//                 </div>
//               </div>
//             </li>
//           ))}
//         </ul>
//       )}
//     </section>
//   );
// }

import React from "react";

function getActionText(item) {
  if (item.action) return item.action;
  const status = (item.ticket_status || item.status || "").toLowerCase();
  if (status === "resolved") return "Ticket resolved";
  if (status === "pending") return "Ticket pending";
  if (status === "active") return "Active ticket";
  return "";
}

export default function RecentActivity({ activities = [] }) {
  return (
    <section className="lg:col-span-2 bg-white rounded-lg border border-slate-200 shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-medium text-slate-800">Recent Activity</h3>
      </div>

      {activities.length === 0 ? (
        <div className="py-8 text-center text-sm text-slate-500">
          No recent activity
        </div>
      ) : (
        <ul className="space-y-3">
          {activities.map((r, idx) => {
            const name = r.customer_name ?? r.name ?? "Unknown";
            const actionText = getActionText(r);
            const status = (r.ticket_status ?? r.status ?? "").toLowerCase();
            const time = r.how_long_ago ?? r.ago ?? "";

            // pill color (subtle)
            const pillClass =
              status === "resolved"
                ? "bg-white border border-emerald-200 text-emerald-700"
                : status === "waiting"
                ? "bg-white border border-amber-200 text-amber-700"
                : status === "pending"
                ? "bg-white border border-amber-200 text-amber-700"
                : status === "active"
                ? "bg-white border border-sky-200 text-sky-700"
                : "bg-white border border-slate-200 text-slate-600";

            return (
              <li
                key={idx}
                className="bg-white rounded-lg p-4 border border-slate-200 flex items-center justify-between shadow-sm"
              >
                <div>
                  <div className="font-medium text-slate-800">{name}</div>
                  {actionText && (
                    <div className="text-sm text-slate-500 mt-1">
                      {actionText}
                    </div>
                  )}
                </div>

                <div className="text-right flex flex-col items-end">
                  <span
                    className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-medium ${pillClass}`}
                  >
                    {(r.ticket_status ?? r.status) || "—"}
                  </span>

                  <div className="text-xs text-slate-400 mt-2">{time}</div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
