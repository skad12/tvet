// import Image from "next/image";

// export const metadata = {
//   title: "Admin Dashboard - TVET Support",
// };

// const metrics = [
//   { title: "Total Tickets", value: 284, badge: "+12% from last week" },
//   { title: "Avg Response Time", value: "4.2m", badge: "-8% from last week" },
//   { title: "Resolved Today", value: 34, badge: "+23% from last week" },
//   { title: "Active Agents", value: 12, badge: "0% from last week" },
// ];

// const recentActivity = [
//   {
//     name: "Chukwuma Okonkwo",
//     action: "Ticket resolved",
//     ago: "2m",
//     status: "resolved",
//   },
//   {
//     name: "Aisha Mohammed",
//     action: "New ticket created",
//     ago: "5m",
//     status: "active",
//   },
//   {
//     name: "Emeka Nwachukwu",
//     action: "Agent assigned",
//     ago: "12m",
//     status: "waiting",
//   },
//   {
//     name: "Fatima Bello",
//     action: "Ticket escalated",
//     ago: "18m",
//     status: "active",
//   },
// ];

// export default function Dashboard() {
//   return (
//     <div className="min-h-screen bg-slate-50 py-8">
//       <div className="max-w-7xl mx-auto px-4">
//         <header className="mb-8 flex items-center justify-between">
//           <div>
//             <h1 className="text-3xl font-semibold text-slate-800">
//               Analytics Dashboard
//             </h1>
//             <p className="text-sm text-slate-600 mt-1">
//               Overview of your support platform
//             </p>
//           </div>
//         </header>

//         {/* Metrics */}
//         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
//           {metrics.map((m) => (
//             <div
//               key={m.title}
//               className="bg-white p-5 rounded shadow-sm border"
//             >
//               <div className="text-sm text-slate-500">{m.title}</div>
//               <div className="mt-3 text-2xl font-bold text-slate-800">
//                 {m.value}
//               </div>
//               <div className="mt-2 text-xs inline-block bg-slate-100 text-slate-700 px-2 py-1 rounded">
//                 {m.badge}
//               </div>
//             </div>
//           ))}
//         </div>

//         <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
//           {/* Recent Activity */}
//           <div className="lg:col-span-2 bg-white p-6 rounded shadow-sm border">
//             <h3 className="text-xl font-medium mb-4">Recent Activity</h3>
//             <ul className="space-y-3">
//               {recentActivity.map((r, idx) => (
//                 <li
//                   key={idx}
//                   className="flex items-start justify-between border rounded p-3"
//                 >
//                   <div>
//                     <div className="font-medium text-slate-800">{r.name}</div>
//                     <div className="text-sm text-slate-600">{r.action}</div>
//                   </div>
//                   <div className="text-right">
//                     <div className="text-xs text-slate-500">{r.ago}</div>
//                     <div
//                       className={`mt-2 text-xs px-2 py-1 rounded ${
//                         r.status === "resolved"
//                           ? "bg-green-50 text-green-700"
//                           : r.status === "waiting"
//                           ? "bg-yellow-50 text-yellow-700"
//                           : "bg-blue-50 text-blue-700"
//                       }`}
//                     >
//                       {r.status}
//                     </div>
//                   </div>
//                 </li>
//               ))}
//             </ul>
//           </div>

//           {/* AI Performance & Image */}
//           <div className="space-y-6">
//             <div className="bg-white p-6 rounded shadow-sm border">
//               <div className="flex items-center justify-between">
//                 <div>
//                   <div className="text-sm text-slate-500">
//                     AI Resolution Rate
//                   </div>
//                   <div className="text-2xl font-bold text-slate-800 mt-1">
//                     67%
//                   </div>
//                 </div>
//                 <div className="text-sm text-green-600 font-medium">+5%</div>
//               </div>

//               <div className="mt-4 text-sm text-slate-600">
//                 <div>
//                   Auto-resolved: <strong>8 tickets</strong>
//                 </div>
//                 <div className="mt-1">
//                   Escalated to agents: <strong>4 tickets</strong>
//                 </div>
//                 <div className="mt-1">
//                   Avg AI response time: <strong>1.2s</strong>
//                 </div>
//               </div>
//             </div>

//             <div className="bg-white p-4 rounded shadow-sm border">
//               <h4 className="text-sm font-medium text-slate-700 mb-3">
//                 Dashboard preview
//               </h4>
//               <div className="w-full h-auto rounded overflow-hidden">
//                 {/* local image from public/images */}
//                 <Image
//                   src="/images/admin-dashboard.png"
//                   alt="Admin dashboard preview"
//                   width={800}
//                   height={420}
//                   className="object-cover w-full rounded"
//                   priority
//                 />
//               </div>
//             </div>
//           </div>
//         </div>

//         {/* Bottom summary / quick actions */}
//       </div>
//     </div>
//   );
// }
// //

"use client";

import Sidebar from "@/components/SideBar";
import Topbar from "@/components/Topbar";
import MetricCard from "@/components/MetricCards";
import RecentActivity from "@/components/RecentActivity";
import AiPerformance from "@/components/AiPerformance";

const metrics = [
  { title: "Total Tickets", value: 284, badge: "+12% from last week" },
  { title: "Avg Response Time", value: "4.2m", badge: "-8% from last week" },
  { title: "Resolved Today", value: 34, badge: "+23% from last week" },
  { title: "Active Agents", value: 12, badge: "0% from last week" },
];

const recentActivity = [
  {
    name: "Chukwuma Okonkwo",
    action: "Ticket resolved",
    ago: "2m",
    status: "resolved",
  },
  {
    name: "Aisha Mohammed",
    action: "New ticket created",
    ago: "5m",
    status: "active",
  },
  {
    name: "Emeka Nwachukwu",
    action: "Agent assigned",
    ago: "12m",
    status: "waiting",
  },
  {
    name: "Fatima Bello",
    action: "Ticket escalated",
    ago: "18m",
    status: "active",
  },
];

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar />
      <div className="flex-1">
        <Topbar />
        <main className="max-w-7xl mx-auto px-4 py-8">
          <h1 className="text-3xl font-semibold text-slate-800 mb-1">
            Analytics Dashboard
          </h1>
          <p className="text-sm text-slate-500 mb-6">
            Overview of your support platform
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            {metrics.map((m, i) => (
              <MetricCard key={i} {...m} />
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <RecentActivity activities={recentActivity} />
            <div className="space-y-6">
              <AiPerformance />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
