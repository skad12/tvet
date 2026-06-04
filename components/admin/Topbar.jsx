"use client";

import React, { useEffect, useMemo, useState } from "react";
import api from "../../lib/axios";
import { motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";

// react-icons
import { FiBell, FiSettings, FiUserCheck, FiCheckCircle } from "react-icons/fi";
import { AiOutlineRobot } from "react-icons/ai";

export default function Topbar({ onSidebarOpen }) {
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
  const resolvedToday = loading ? "—" : data?.resolved_today ?? 0;

  return (
    <motion.header
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="sticky top-0 z-40 mb-6 rounded-3xl border border-white/70 bg-white/85 shadow-xl shadow-slate-950/5 backdrop-blur"
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
        {/* Mobile menu button */}
        <div className="md:hidden flex items-center">
          <button
            onClick={onSidebarOpen}
            className="-ml-2 rounded-2xl p-2 text-slate-700 transition hover:bg-slate-100"
            aria-label="Toggle menu"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
        </div>

        {/* left stats */}
        <div className="hidden md:flex items-center gap-4">
          <div className="flex items-center gap-2 rounded-2xl border border-blue-100 bg-blue-50 px-3 py-2 text-sm text-blue-700">
            <FiUserCheck className="w-4 h-4" aria-hidden />
            <span>Active</span>
            <span className="font-bold ml-2">{active}</span>
          </div>

          <div className="flex items-center gap-2 rounded-2xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            <AiOutlineRobot className="w-4 h-4" aria-hidden />
            <span>Handled by AI</span>
            <span className="font-bold ml-2">{aiHandling}</span>
          </div>

          <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
            <FiCheckCircle className="w-4 h-4" aria-hidden />
            <span>Total Resolved</span>
            <span className="font-bold ml-2">{resolvedToday}</span>
          </div>
        </div>

        {/* right controls */}
        <div className="flex items-center gap-3">
          <input
            placeholder="Search..."
            className="hidden w-64 rounded-full border border-slate-200 bg-white/80 px-4 py-2 text-sm shadow-inner focus:outline-none focus:ring-2 focus:ring-blue-100 sm:inline-block"
          />

          {/* Notification bell */}
          <button
            type="button"
            aria-label="Notifications"
            title="Notifications"
            className="rounded-full p-2 text-slate-600 transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-100"
          >
            <FiBell className="w-5 h-5" />
          </button>

          {/* Settings button */}
          <button
            type="button"
            aria-label="Settings"
            title="Settings"
            className="rounded-full p-2 text-slate-700 transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-100"
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
