"use client";

import React, { useEffect, useMemo, useState } from "react";
import api from "../../lib/axios";
import { motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";

// react-icons
import { FiBell, FiSettings, FiUserCheck, FiCheckCircle } from "react-icons/fi";
import { AiOutlineRobot } from "react-icons/ai";

export default function Topbar() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  const userId = useMemo(() => {
    if (!user) return null;
    const candidates = [
      user.app_user_id,
      user.appUserId,
      user.user_id,
      user.userId,
      user.id,
      user.uid,
      user.pk,
    ];
    for (const c of candidates) {
      if (c !== undefined && c !== null && c !== "") return c;
    }
    return null;
  }, [user]);

  const initials = useMemo(() => {
    const source =
      user?.name ??
      user?.full_name ??
      user?.fullName ??
      user?.username ??
      user?.email ??
      "";
    if (!source) return "AD";
    const parts = source.split(/\s+/).filter(Boolean);
    if (parts.length === 0) return source.slice(0, 2).toUpperCase();
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }, [user]);

  const accountType = useMemo(() => {
    const value = user?.account_type ?? user?.role ?? user?.type ?? "admin";
    return String(value).toUpperCase();
  }, [user]);

  useEffect(() => {
    let mounted = true;

    const fetchAnalytics = async () => {
      try {
        const res = await api.get("/get-analytics/");
        if (!mounted) return;
        setData(res.data);
        setError(null);
      } catch (err) {
        console.warn(
          "Direct API request failed, trying server proxy...",
          err?.message ?? err
        );
        try {
          const proxied = await fetch("/api/analytics");
          if (!mounted) return;
          if (!proxied.ok) {
            const text = await proxied.text();
            throw new Error(`Proxy failed: ${proxied.status} ${text}`);
          }
          const json = await proxied.json();
          setData(json);
          setError(null);
        } catch (proxyErr) {
          console.error("Proxy request failed:", proxyErr);
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

  const active = loading ? "—" : data?.active_agents ?? 0;
  const aiHandling = loading ? "—" : data?.tickets_handled_by_ai ?? 0;
  const resolvedToday = loading ? "—" : data?.tickets_handled_by_human ?? 0;

  return (
    <motion.header
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-slate-200"
    >
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
        {/* left stats */}
        <div className="hidden md:flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-50 text-blue-700 text-sm">
            <FiUserCheck className="w-4 h-4" aria-hidden />
            <span>Active</span>
            <span className="font-bold ml-2">{active}</span>
          </div>

          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-50 text-emerald-700 text-sm">
            <AiOutlineRobot className="w-4 h-4" aria-hidden />
            <span>AI Handling</span>
            <span className="font-bold ml-2">{aiHandling}</span>
          </div>

          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-50 text-slate-700 text-sm">
            <FiCheckCircle className="w-4 h-4" aria-hidden />
            <span>Resolved Today</span>
            <span className="font-bold ml-2">{resolvedToday}</span>
          </div>
        </div>

        {/* right controls */}
        <div className="flex items-center gap-3">
          <input
            placeholder="Search..."
            className="hidden sm:inline-block w-64 border border-slate-200 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100"
          />

          {/* Notification bell */}
          <button
            type="button"
            aria-label="Notifications"
            title="Notifications"
            className="p-2 rounded-full text-slate-600 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-100"
          >
            <FiBell className="w-5 h-5" />
          </button>

          {/* Settings button */}
          <button
            type="button"
            aria-label="Settings"
            title="Settings"
            className="p-2 rounded-full hover:bg-slate-100 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-100"
          >
            <FiSettings className="w-5 h-5" />
          </button>

          <div className="hidden sm:flex flex-col text-right text-xs text-slate-500">
            <span className="text-sm font-semibold text-slate-700">
              {user?.email ?? user?.username ?? "Admin"}
            </span>
            <span className="uppercase tracking-wide text-slate-500">
              {String(accountType || "admin")}
            </span>
          </div>

          {/* Avatar */}
          <div className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center font-medium">
            {initials}
          </div>
        </div>
      </div>

      {error && (
        <div className="text-red-500 text-sm max-w-7xl mx-auto px-4 py-2">
          {error}
        </div>
      )}
    </motion.header>
  );
}
