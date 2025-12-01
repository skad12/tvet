// app/admin/dashboard/agents/page.jsx
"use client";

import { useEffect, useState } from "react";
import AgentsGrid from "@/components/admin/agents/AgentsGrid";
import api from "@/lib/axios";

function normalizeName(rawName, email) {
  // treat literal "null"/"undefined" strings as missing
  if (!rawName) return null;
  const lowered = String(rawName).trim().toLowerCase();
  if (lowered === "null" || lowered === "undefined" || lowered === "")
    return null;
  return String(rawName).trim();
}

function nameFromEmail(email) {
  if (!email) return "Agent";
  const local = String(email).split("@")[0] || email;
  // make it nicer: replace dots/underscores and capitalize words
  return (
    local
      .replace(/[._]/g, " ")
      .split(" ")
      .map((s) => (s ? s[0].toUpperCase() + s.slice(1) : ""))
      .join(" ")
      .trim() || email
  );
}

function normalizeUserStatus(status) {
  const value = String(status || "").toLowerCase();
  if (value.includes("avail") || value === "online") return "available";
  if (value.includes("away") || value.includes("busy")) return "away";
  return "offline";
}

export default function AgentsPage() {
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  useEffect(() => {
    let mounted = true;
    let refreshInterval = null;

    async function loadAgents({ silent = false } = {}) {
      if (!silent) setLoading(true);
      setError(null);

      try {
        let res = null;
        if (api && typeof api.get === "function") {
          res = await api.get("/get-all-users/");
        } else {
          const fallback = await fetch("/api/agents");
          if (!fallback.ok) throw new Error("proxy fetch failed");
          res = { data: await fallback.json() };
        }

        const raw =
          Array.isArray(res.data) || Array.isArray(res?.data?.results)
            ? Array.isArray(res.data)
              ? res.data
              : res.data.results
            : res.data?.agents ?? [];

        function isAgentAccount(u) {
          const val =
            u?.account_type ??
            u?.accountType ??
            u?.role ??
            u?.type ??
            u?.accountType ??
            null;
          const s = val != null ? String(val).toLowerCase().trim() : "";
          return s === "agent" || s === "agents";
        }

        const onlyAgents = (Array.isArray(raw) ? raw : []).filter(
          isAgentAccount
        );

        const normalized = onlyAgents.map((user, idx) => {
          const email = user.email ?? user.username ?? `agent${idx}@tvet.local`;
          const rawName = normalizeName(user.name, email);
          const derivedName = rawName ?? nameFromEmail(email);
          const status = normalizeUserStatus(user.user_status);

          return {
            id: user.id ?? user._id ?? `agent-${idx}`,
            name: derivedName,
            email,
            phone:
              user.phone_number ??
              user.phone ??
              user.telephone ??
              "+234 800 000 0000",
            status,
            metrics: {
              active: user.metrics?.active ?? user.active ?? 0,
              resolved: user.metrics?.resolved ?? user.resolved ?? 0,
              avgTime: user.metrics?.avgTime ?? user.avgTime ?? "—",
            },
            __raw: user,
          };
        });

        if (mounted) {
          setAgents(normalized);
        }
      } catch (err) {
        console.error("Failed to load agents", err);
        if (mounted) {
          setError("Failed to load agents — showing demo data");
          setAgents([
            {
              id: "a-1",
              name: "Adebayo Johnson",
              email: "adebayo@tvet.edu.ng",
              phone: "+234 801 234 5678",
              status: "available",
              metrics: { active: 5, resolved: 12, avgTime: "3.5m" },
            },
            {
              id: "a-2",
              name: "Ngozi Okafor",
              email: "ngozi@tvet.edu.ng",
              phone: "+234 802 345 6789",
              status: "available",
              metrics: { active: 3, resolved: 8, avgTime: "4.2m" },
            },
            {
              id: "a-3",
              name: "Ibrahim Musa",
              email: "ibrahim@tvet.edu.ng",
              phone: "+234 803 456 7890",
              status: "away",
              metrics: { active: 2, resolved: 15, avgTime: "2.8m" },
            },
            {
              id: "a-4",
              name: "Chioma Eze",
              email: "chioma@tvet.edu.ng",
              phone: "+234 804 567 8901",
              status: "offline",
              metrics: { active: 0, resolved: 10, avgTime: "3.1m" },
            },
          ]);
        }
      } finally {
        if (!silent && mounted) setLoading(false);
      }
    }

    loadAgents();
    refreshInterval = setInterval(() => loadAgents({ silent: true }), 30000);

    return () => {
      mounted = false;
      if (refreshInterval) clearInterval(refreshInterval);
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">
              Support Agents
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Manage your support team
            </p>
          </div>

          <div className="ml-auto">
            <button
              type="button"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded shadow"
            >
              <svg
                className="w-4 h-4"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden
              >
                <path
                  d="M12 5v14M5 12h14"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Add Agent
            </button>
          </div>
        </div>

        {loading ? (
          <div className="bg-white p-8 rounded shadow text-center text-slate-500">
            Loading agents…
          </div>
        ) : (
          <>
            {error && (
              <div className="mb-4 text-sm text-amber-700 bg-amber-50 p-3 rounded">
                {error}
              </div>
            )}

            <AgentsGrid agents={agents} />
          </>
        )}
      </div>
    </div>
  );
}
