"use client";

import Sidebar from "@/components/SideBar";
import Topbar from "@/components/Topbar";
import MetricCard from "@/components/MetricCards";
import RecentActivity from "@/components/RecentActivity";
import AiPerformance from "@/components/AiPerformance";

const metrics = [
  {
    title: "Total Tickets",
    value: 284,
    badge: "+12% from last week",
    badgeColor: "blue",
  },
  {
    title: "Avg Response Time",
    value: "4.2m",
    badge: "-8% from last week",
    badgeColor: "cyan",
  },
  {
    title: "Resolved Today",
    value: 34,
    badge: "+23% from last week",
    badgeColor: "green",
  },
  {
    title: "Active Agents",
    value: 12,
    badge: "0% from last week",
    badgeColor: "slate",
  },
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
          <h1 className="text-3xl font-bold text-slate-800 mb-1">
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
