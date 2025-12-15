"use client";

import { useEffect, useState, useMemo } from "react";
import AgentsGrid from "@/components/admin/agents/AgentsGrid";
import Topbar from "@/components/admin/Topbar";
import api from "@/lib/axios";

function normalizeAccountType(raw) {
  if (!raw) return "";
  return String(raw).trim().toLowerCase();
}

function normalizeUserStatus(status) {
  const value = String(status || "").toLowerCase();
  if (value.includes("avail") || value === "available") return "available";
  if (value.includes("engag") || value === "engaged") return "engaged";
  return "offline";
}

const isSuperAgentType = (t) =>
  [
    "super_agent",
    "super agent",
    "super-agent",
    "super",
    "superadmin",
    "super_admin",
    "super admin",
  ].includes(t);

const isAgentType = (t) =>
  ["agent", "support_agent", "support-agent", "support"].includes(t);

export default function AgentsPage() {
  const [agents, setAgents] = useState({
    agents: [],
    superAgents: [],
    all: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeCategory, setActiveCategory] = useState("agents");

  // this is the local current user's status (driven by Navbar)
  const [userStatus, setUserStatus] = useState(null);
  const [currentUserEmail, setCurrentUserEmail] = useState(null);

  // filter for displayed status (all / available / engaged / offline)
  const [statusFilter, setStatusFilter] = useState("all");

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

        const raw = Array.isArray(res.data)
          ? res.data
          : Array.isArray(res?.data?.results)
          ? res.data.results
          : res.data?.users ?? [];

        let normalized = raw.map((user, idx) => {
          const accountType = normalizeAccountType(user.account_type);
          const username =
            user.username || user.email?.split("@")[0] || `agent${idx}`;

          return {
            id: user.id ?? user._id ?? `agent-${idx}`,
            username,
            email: user.email ?? "",
            phone: user.phone_number ?? user.phone ?? user.telephone ?? "—",
            accountType,
            status: normalizeUserStatus(user.user_status),
            __raw: user,
          };
        });

        // best-effort: try to fetch live status per agent
        try {
          const withLiveStatus = await Promise.all(
            normalized.map(async (agent) => {
              if (!agent.id) return agent;
              try {
                const resStatus = await api.get(
                  `/get-user-status/${agent.id}/`
                );
                const s = normalizeUserStatus(
                  resStatus?.data?.status ?? resStatus?.data
                );
                return { ...agent, status: s };
              } catch (err) {
                return agent;
              }
            })
          );
          normalized = withLiveStatus;
        } catch (e) {
          // ignore
        }

        if (mounted) {
          const agentsOnly = normalized.filter((u) =>
            isAgentType(u.accountType)
          );
          const superAgentsOnly = normalized.filter((u) =>
            isSuperAgentType(u.accountType)
          );

          // fallback — if there are no explicit account types, keep everyone in agents
          if (agentsOnly.length === 0 && superAgentsOnly.length === 0) {
            setAgents({ agents: normalized, superAgents: [], all: normalized });
          } else {
            setAgents({
              agents: agentsOnly,
              superAgents: superAgentsOnly,
              all: normalized,
            });
          }
        }
      } catch (err) {
        console.error("Failed to load agents", err);
        if (mounted) {
          setError("Failed to load agents — showing demo data");
          const demoAgents = [
            {
              id: "a-1",
              username: "adebayo",
              email: "adebayo@tvet.edu.ng",
              phone: "+234 801 234 5678",
              accountType: "agent",
              status: "available",
            },
            {
              id: "a-2",
              username: "ngozi",
              email: "ngozi@tvet.edu.ng",
              phone: "+234 802 345 6789",
              accountType: "agent",
              status: "available",
            },
            {
              id: "s-1",
              username: "ibrahim",
              email: "ibrahim@tvet.edu.ng",
              phone: "+234 803 456 7890",
              accountType: "super_agent",
              status: "engaged",
            },
          ];
          setAgents({
            agents: demoAgents.filter((a) => a.accountType === "agent"),
            superAgents: demoAgents.filter(
              (a) => a.accountType === "super_agent"
            ),
            all: demoAgents,
          });
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

  // handle status changes originating from the topbar (Navbar)
  async function handleUserStatusChange(newStatus, email) {
    setUserStatus(newStatus);
    if (email) setCurrentUserEmail(email);

    // optimistic update: find matching agent in lists and update status
    setAgents((prev) => {
      const updateList = (list) =>
        list.map((a) =>
          a.email && email && a.email.toLowerCase() === email.toLowerCase()
            ? { ...a, status: newStatus }
            : a
        );

      return {
        agents: updateList(prev.agents || []),
        superAgents: updateList(prev.superAgents || []),
        all: updateList(prev.all || []),
      };
    });

    // try to persist change to backend (best-effort)
    try {
      if (api && typeof api.post === "function") {
        await api.post("/set-user-status/", { email, status: newStatus });
      }
    } catch (err) {
      // ignore errors — status change is optimistic
      console.warn("Failed to sync user status with API", err);
    }
  }

  const displayedAgents = useMemo(() => {
    const base =
      activeCategory === "agents" ? agents.agents : agents.superAgents;
    if (!Array.isArray(base)) return [];
    if (!statusFilter || statusFilter === "all") return base;
    return base.filter(
      (a) => (a.status || "offline").toLowerCase() === statusFilter
    );
  }, [agents, activeCategory, statusFilter]);

  return (
    <div className="min-h-screen bg-slate-50">
      <Topbar userStatus={userStatus} onStatusChange={handleUserStatusChange} />

      <div className="py-8">
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

              <div className="mb-4 flex items-center gap-4 flex-wrap">
                <div className="flex gap-2 border-b border-slate-200">
                  <button
                    onClick={() => setActiveCategory("agents")}
                    className={`px-4 py-2 font-medium text-sm transition-colors ${
                      activeCategory === "agents"
                        ? "text-blue-600 border-b-2 border-blue-600"
                        : "text-slate-600 hover:text-slate-800"
                    }`}
                  >
                    Agents ({agents.agents?.length || 0})
                  </button>
                  <button
                    onClick={() => setActiveCategory("super")}
                    className={`px-4 py-2 font-medium text-sm transition-colors ${
                      activeCategory === "super"
                        ? "text-blue-600 border-b-2 border-blue-600"
                        : "text-slate-600 hover:text-slate-800"
                    }`}
                  >
                    Super Agents ({agents.superAgents?.length || 0})
                  </button>
                </div>

                {/* status filter */}
                <div className="ml-4 flex items-center gap-2">
                  <span className="text-sm text-slate-500 mr-2">Filter:</span>
                  <button
                    onClick={() => setStatusFilter("all")}
                    className={`px-3 py-1 rounded text-sm ${
                      statusFilter === "all"
                        ? "bg-slate-100"
                        : "hover:bg-slate-50"
                    }`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setStatusFilter("available")}
                    className={`px-3 py-1 rounded text-sm ${
                      statusFilter === "available"
                        ? "bg-emerald-50 text-emerald-700"
                        : "hover:bg-slate-50"
                    }`}
                  >
                    Available
                  </button>
                  <button
                    onClick={() => setStatusFilter("engaged")}
                    className={`px-3 py-1 rounded text-sm ${
                      statusFilter === "engaged"
                        ? "bg-blue-50 text-blue-700"
                        : "hover:bg-slate-50"
                    }`}
                  >
                    Engaged
                  </button>
                  <button
                    onClick={() => setStatusFilter("offline")}
                    className={`px-3 py-1 rounded text-sm ${
                      statusFilter === "offline"
                        ? "bg-red-50 text-red-700"
                        : "hover:bg-slate-50"
                    }`}
                  >
                    Offline
                  </button>
                </div>
              </div>

              <AgentsGrid
                agents={displayedAgents}
                currentUserEmail={currentUserEmail}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
