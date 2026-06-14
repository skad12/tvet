"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

import MetricCard from "@/components/admin/analytics/MetricCards";
import RecentActivity from "@/components/admin/analytics/RecentActivity";
import AiPerformance from "@/components/admin/analytics/AiPerformance";
import api from "@/lib/axios";

// react-icons
import { FiBarChart2, FiClock, FiCheckCircle, FiUsers } from "react-icons/fi";

export default function DashboardPage() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;

    const fetchAnalytics = async () => {
      try {
        const res = await api.get("/get-analytics/");
        if (!mounted) return;
        setAnalytics(res.data);
        setError(null);
      } catch (err) {
        console.warn("Direct API failed, falling back to proxy:", err?.message);
        try {
          const fallback = await fetch("/api/analytics");
          if (!mounted) return;
          if (!fallback.ok) throw new Error(`Proxy failed: ${fallback.status}`);
          const data = await fallback.json();
          setAnalytics(data);
        } catch (err2) {
          console.error("Proxy also failed:", err2);
          if (mounted) setError("Failed to load analytics");
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchAnalytics();
    return () => {
      mounted = false;
    };
  }, []);

  // Metric cards
  const metrics = [
    {
      title: "Total Tickets",
      value: analytics ? analytics.total_tickets : loading ? "…" : 0,
      badge: "+12% from last week",
      badgeColor: "blue",
      Icon: FiBarChart2,
    },
    {
      title: "Avg Response Time",
      value: analytics ? analytics.avg_response_time : loading ? "…" : "N/A",
      badge: "-8% from last week",
      badgeColor: "cyan",
      Icon: FiClock,
    },
    {
      title: " Total Resolved",
      value: analytics ? analytics.resolved_today : loading ? "…" : 0,
      badge: "+23% from last week",
      badgeColor: "green",
      Icon: FiCheckCircle,
    },
    {
      title: "Active Agents",
      value: analytics ? analytics.active_agents : loading ? "…" : 0,
      badge: "0% from last week",
      badgeColor: "slate",
      Icon: FiUsers,
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

  return (
    <div className="flex min-h-screen">
      <div className="flex-1">
        <main className="mx-auto max-w-7xl px-1 py-2">
          {/* Header with motion */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mb-6 overflow-hidden rounded-4xl bg-slate-950 p-6 text-white shadow-2xl shadow-slate-950/20"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-blue-200">
              Admin overview
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight">
              Analytics Dashboard
            </h1>
            <p className="mt-2 text-sm text-slate-300">
              Overview of your support platform
            </p>
          </motion.div>

          {/* Metric Cards */}
          <motion.div
            className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4"
            initial="hidden"
            animate="visible"
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: {
                opacity: 1,
                y: 0,
                transition: { staggerChildren: 0.1 },
              },
            }}
          >
            {metrics.map((m, i) => (
              <motion.div
                key={i}
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { opacity: 1, y: 0 },
                }}
                transition={{ duration: 0.4 }}
              >
                <MetricCard {...m} />
              </motion.div>
            ))}
          </motion.div>

          {/* Recent Activity + AI Performance */}
          <motion.div
            className="grid grid-cols-1 gap-6 lg:grid-cols-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            <RecentActivity activities={analytics?.recent_list || []} />
            <div className="space-y-6">
              <AiPerformance data={analytics || {}} />
            </div>
          </motion.div>

          {error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-6 rounded-2xl border border-red-100 bg-red-50 p-4 text-red-600"
            >
              {error}
            </motion.div>
          )}
        </main>
      </div>
    </div>
  );
}
