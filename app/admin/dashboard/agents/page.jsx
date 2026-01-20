"use client";

import { useEffect, useMemo, useState } from "react";
import AgentsGrid from "@/components/admin/agents/AgentsGrid";
import AgentCategoriesList from "@/components/admin/agents/AgentCategoriesList";
import AddAgentModal from "@/components/admin/agents/AddAgentModal";
import { FiPlus } from "react-icons/fi";

import api from "@/lib/axios";

function normalizeAccountType(raw) {
  if (!raw) return "";
  return String(raw).trim().toLowerCase();
}

function normalizeUserStatus(status) {
  const value = String(status || "").toLowerCase();
  if (value.includes("avail") || value === "available") return "available";
  // if (value.includes("engag") || value === "engaged") return "engaged";
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

  // agents vs super-agents tab
  const [activeCategory, setActiveCategory] = useState("agents");
  // status filter tab (all / available / engaged / offline)
  const [statusFilter, setStatusFilter] = useState("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let mounted = true;

    async function loadAgents() {
      setLoading(true);
      setError(null);

      try {
        const res = await api.get("/get-all-users/");
        const raw = Array.isArray(res.data)
          ? res.data
          : Array.isArray(res?.data?.results)
          ? res.data.results
          : res.data?.users ?? [];

        const normalized = raw.map((user, idx) => {
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

        if (!mounted) return;

        const agentsOnly = normalized.filter((u) => isAgentType(u.accountType));
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
        if (mounted) setLoading(false);
      }
    }

    loadAgents();
    return () => {
      mounted = false;
    };
  }, [refreshKey]);

  const handleDeleteAgent = async (agentId) => {
    try {
      await api.delete(`/delete-user-account/${agentId}/`);

      // Refresh agents list after successful deletion
      setAgents((prev) => {
        const updatedAll = prev.all.filter((a) => a.id !== agentId);
        const agentsOnly = updatedAll.filter((u) => isAgentType(u.accountType));
        const superAgentsOnly = updatedAll.filter((u) =>
          isSuperAgentType(u.accountType)
        );

        return {
          agents: agentsOnly,
          superAgents: superAgentsOnly,
          all: updatedAll,
        };
      });
    } catch (error) {
      console.error("Failed to delete agent:", error);
      alert("Failed to delete agent. Please try again.");
      throw error;
    }
  };

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
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">
              Support Agents
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Manage and monitor your support team
            </p>
          </div>

          <div className="ml-auto">
            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded shadow"
            >
              <FiPlus />
              <span className="text-xs lg:text-base">Add Agent</span>
            </button>
          </div>
        </div>

        {loading ? (
          <div className="bg-white p-8 rounded shadow text-center text-slate-500">
            Loading agents…
          </div>
        ) : (
          <>
            <AddAgentModal
              isOpen={showAddModal}
              onClose={() => setShowAddModal(false)}
              onSuccess={() => setRefreshKey((k) => k + 1)}
            />

            {error && (
              <div className="mb-4 text-sm text-amber-700 bg-amber-50 p-3 rounded">
                {error}
              </div>
            )}

            <div className="mb-4 flex items-center gap-4 flex-wrap">
              {/* agent / super-agent tabs */}
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

              {/* status filter, styled similar to agent dashboard topbar badge */}
              <div className="ml-4 flex items-center gap-2">
                <span className="text-sm text-slate-500 mr-2">Filter:</span>
                <button
                  onClick={() => setStatusFilter("all")}
                  className={`px-3 py-1 rounded-full text-xs sm:text-sm border ${
                    statusFilter === "all"
                      ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                      : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setStatusFilter("available")}
                  className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs sm:text-sm border ${
                    statusFilter === "available"
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Available
                </button>
                {/* <button
                  onClick={() => setStatusFilter("engaged")}
                  className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs sm:text-sm border ${
                    statusFilter === "engaged"
                      ? "bg-blue-50 text-blue-700 border-blue-200"
                      : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                  Engaged
                </button> */}
                <button
                  onClick={() => setStatusFilter("offline")}
                  className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs sm:text-sm border ${
                    statusFilter === "offline"
                      ? "bg-red-50 text-red-700 border-red-200"
                      : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                  Offline
                </button>
              </div>
            </div>

            <AgentsGrid agents={displayedAgents} onDelete={handleDeleteAgent} />

            {/* Categories + agents per category (ticket style tabs) */}
            <div className="mt-10">
              <AgentCategoriesList allAgents={agents.all} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
