"use client";

import React, { useEffect, useMemo, useState } from "react";
import api from "../../lib/axios";
import { motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

// react-icons
import Link from "next/link";
import { FiSettings, FiUserCheck, FiCheckCircle, FiInbox } from "react-icons/fi";
import ThemeToggle from "@/components/ThemeToggle";
import TrackTicket from "@/components/tickets/TrackTicket";
import usePresence from "@/components/account/usePresence";
import { readCache, writeCache } from "@/lib/offlineCache";

export default function Topbar({ onSidebarOpen }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();
  usePresence();

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
        // This is the path that actually succeeds, so it is the one that has
        // to seed the cache the offline fallback below reads.
        if (res.data) writeCache("admin_analytics", res.data);
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
          writeCache("admin_analytics", json);
          setError(null);
        } catch (proxyErr) {
          console.error("Proxy request failed:", proxyErr);
          // Show the last figures we had rather than an error in the header;
          // they are a summary, and a slightly old one still reads true.
          const cached = readCache("admin_analytics");
          if (mounted) {
            if (cached?.value) {
              setData(cached.value);
              setError(null);
            } else {
              const message = "Failed to load analytics";
              setError(message);
              toast.error(message);
            }
          }
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchAnalytics();
    // Live figures: re-read every minute while the tab is open.
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") fetchAnalytics();
    }, 60000);
    return () => {
      mounted = false;
      window.clearInterval(timer);
    };
  }, []);

  const online = loading ? "—" : data?.active_agents ?? 0;
  const open = loading ? "—" : data?.open_tickets ?? "—";
  const resolvedToday = loading ? "—" : data?.resolved_today ?? 0;

  const pill = "flex items-center gap-2 rounded-2xl border px-3 py-2 text-sm transition hover:-translate-y-0.5 hover:shadow-sm";

  return (
    <motion.header
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="sticky top-0 z-40 mb-6 rounded-3xl border border-border bg-card/85 text-card-foreground shadow-xl shadow-slate-950/5 backdrop-blur"
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
        {/* Mobile menu button */}
        <div className="md:hidden flex items-center">
          <button
            onClick={onSidebarOpen}
            className="-ml-2 rounded-2xl p-2 text-foreground transition hover:bg-surface-muted"
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

        {/* left: live figures, each opening the page behind it */}
        <div className="hidden lg:flex items-center gap-3">
          <Link href="/admin/dashboard/agents" title="Agents and super agents available right now" className={`${pill} border-blue-100 bg-blue-50 text-blue-700`}>
            <FiUserCheck className="w-4 h-4" aria-hidden />
            <span>Online</span>
            <span className="font-bold">{online}</span>
          </Link>
          <Link href="/admin/dashboard/tickets?status=pending" title="Tickets still waiting to be resolved" className={`${pill} border-amber-100 bg-amber-50 text-amber-800`}>
            <FiInbox className="w-4 h-4" aria-hidden />
            <span>Open</span>
            <span className="font-bold">{open}</span>
          </Link>
          <Link href="/admin/dashboard/tickets?status=resolved" title="Tickets resolved since midnight" className={`${pill} border-emerald-100 bg-emerald-50 text-emerald-700`}>
            <FiCheckCircle className="w-4 h-4" aria-hidden />
            <span>Resolved today</span>
            <span className="font-bold">{resolvedToday}</span>
          </Link>
        </div>

        {/* right controls */}
        <div className="flex min-w-0 flex-1 items-center justify-end gap-3">
          <div className="hidden w-full max-w-xs sm:block">
            <TrackTicket role="admin" compact />
          </div>

          <ThemeToggle variant="ghost" />

          <Link
            href="/admin/dashboard/settings"
            aria-label="Settings"
            title="Settings"
            className="rounded-full p-2 text-foreground transition hover:bg-surface-muted focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <FiSettings className="w-5 h-5" />
          </Link>

          <div className="hidden sm:flex flex-col text-right text-xs text-muted">
            <span className="text-sm font-semibold text-foreground">
              {user?.email ?? user?.username ?? "Admin"}
            </span>
            <span className="uppercase tracking-wide text-muted">
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
