// // app/admin/dashboard/agents/page.jsx
// "use client";

// import { useEffect, useState } from "react";
// import AgentsGrid from "@/components/admin/agents/AgentsGrid";
// import api from "@/lib/axios";

// function normalizeName(rawName, email) {
//   // treat literal "null"/"undefined" strings as missing
//   if (!rawName) return null;
//   const lowered = String(rawName).trim().toLowerCase();
//   if (lowered === "null" || lowered === "undefined" || lowered === "")
//     return null;
//   return String(rawName).trim();
// }

// function nameFromEmail(email) {
//   if (!email) return "Agent";
//   const local = String(email).split("@")[0] || email;
//   // make it nicer: replace dots/underscores and capitalize words
//   return (
//     local
//       .replace(/[._]/g, " ")
//       .split(" ")
//       .map((s) => (s ? s[0].toUpperCase() + s.slice(1) : ""))
//       .join(" ")
//       .trim() || email
//   );
// }

// function normalizeUserStatus(status) {
//   const value = String(status || "").toLowerCase();
//   if (value.includes("avail") || value === "online") return "available";
//   if (value.includes("away") || value.includes("busy")) return "away";
//   return "offline";
// }

// export default function AgentsPage() {
//   const [agents, setAgents] = useState({ available: [], offline: [], all: [] });
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [activeCategory, setActiveCategory] = useState("available");
//   useEffect(() => {
//     let mounted = true;
//     let refreshInterval = null;

//     async function loadAgents({ silent = false } = {}) {
//       if (!silent) setLoading(true);
//       setError(null);

//       try {
//         let res = null;
//         if (api && typeof api.get === "function") {
//           res = await api.get("/get-all-users/");
//         } else {
//           const fallback = await fetch("/api/agents");
//           if (!fallback.ok) throw new Error("proxy fetch failed");
//           res = { data: await fallback.json() };
//         }

//         const raw =
//           Array.isArray(res.data) || Array.isArray(res?.data?.results)
//             ? Array.isArray(res.data)
//               ? res.data
//               : res.data.results
//             : res.data?.agents ?? [];

//         let normalized = raw.map((user, idx) => {
//           const email = user.email ?? user.username ?? `agent${idx}@tvet.local`;
//           const rawName = normalizeName(user.name, email);
//           const derivedName = rawName ?? nameFromEmail(email);
//           const status = normalizeUserStatus(user.user_status);

//           return {
//             id: user.id ?? user._id ?? `agent-${idx}`,
//             name: derivedName,
//             email,
//             phone:
//               user.phone_number ??
//               user.phone ??
//               user.telephone ??
//               "+234 800 000 0000",
//             status,
//             metrics: {
//               active: user.metrics?.active ?? user.active ?? 0,
//               resolved: user.metrics?.resolved ?? user.resolved ?? 0,
//               avgTime: user.metrics?.avgTime ?? user.avgTime ?? "—",
//             },
//             __raw: user,
//           };
//         });

//         // Fetch live status per agent using /get-user-status/{id}/
//         try {
//           const withLiveStatus = await Promise.all(
//             normalized.map(async (agent) => {
//               if (!agent.id) return agent;
//               try {
//                 const resStatus = await api.get(`/get-user-status/${agent.id}/`);
//                 const s = normalizeUserStatus(resStatus?.data?.status ?? resStatus?.data);
//                 return { ...agent, status: s };
//               } catch (err) {
//                 return agent;
//               }
//             })
//           );
//           normalized = withLiveStatus;
//         } catch (e) {
//           // Ignore live status errors; keep normalized list
//         }

//         if (mounted) {
//           // Categorize agents into available and offline
//           const availableAgents = normalized.filter((a) => a.status === "available");
//           const offlineAgents = normalized.filter((a) => a.status !== "available");
//           // Store categorized agents
//           setAgents({
//             available: availableAgents,
//             offline: offlineAgents,
//             all: normalized,
//           });
//         }
//       } catch (err) {
//         console.error("Failed to load agents", err);
//         if (mounted) {
//           setError("Failed to load agents — showing demo data");
//           const demoAgents = [
//             {
//               id: "a-1",
//               name: "Adebayo Johnson",
//               email: "adebayo@tvet.edu.ng",
//               phone: "+234 801 234 5678",
//               status: "available",
//               metrics: { active: 5, resolved: 12, avgTime: "3.5m" },
//             },
//             {
//               id: "a-2",
//               name: "Ngozi Okafor",
//               email: "ngozi@tvet.edu.ng",
//               phone: "+234 802 345 6789",
//               status: "available",
//               metrics: { active: 3, resolved: 8, avgTime: "4.2m" },
//             },
//             {
//               id: "a-3",
//               name: "Ibrahim Musa",
//               email: "ibrahim@tvet.edu.ng",
//               phone: "+234 803 456 7890",
//               status: "away",
//               metrics: { active: 2, resolved: 15, avgTime: "2.8m" },
//             },
//             {
//               id: "a-4",
//               name: "Chioma Eze",
//               email: "chioma@tvet.edu.ng",
//               phone: "+234 804 567 8901",
//               status: "offline",
//               metrics: { active: 0, resolved: 10, avgTime: "3.1m" },
//             },
//           ];
//           const available = demoAgents.filter((a) => a.status === "available");
//           const offline = demoAgents.filter((a) => a.status !== "available");
//           setAgents({ available, offline, all: demoAgents });
//         }
//       } finally {
//         if (!silent && mounted) setLoading(false);
//       }
//     }

//     loadAgents();
//     refreshInterval = setInterval(() => loadAgents({ silent: true }), 30000);

//     return () => {
//       mounted = false;
//       if (refreshInterval) clearInterval(refreshInterval);
//     };
//   }, []);

//   return (
//     <div className="min-h-screen bg-slate-50 py-8">
//       <div className="max-w-7xl mx-auto px-4">
//         <div className="flex items-start justify-between gap-4 mb-6">
//           <div>
//             <h1 className="text-3xl font-bold text-slate-800">
//               Support Agents
//             </h1>
//             <p className="text-sm text-slate-500 mt-1">
//               Manage your support team
//             </p>
//           </div>

//           <div className="ml-auto">
//             <button
//               type="button"
//               className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded shadow"
//             >
//               <svg
//                 className="w-4 h-4"
//                 viewBox="0 0 24 24"
//                 fill="none"
//                 aria-hidden
//               >
//                 <path
//                   d="M12 5v14M5 12h14"
//                   stroke="currentColor"
//                   strokeWidth="1.6"
//                   strokeLinecap="round"
//                   strokeLinejoin="round"
//                 />
//               </svg>
//               Add Agent
//             </button>
//           </div>
//         </div>

//         {loading ? (
//           <div className="bg-white p-8 rounded shadow text-center text-slate-500">
//             Loading agents…
//           </div>
//         ) : (
//           <>
//             {error && (
//               <div className="mb-4 text-sm text-amber-700 bg-amber-50 p-3 rounded">
//                 {error}
//               </div>
//             )}

//             {/* Category tabs */}
//             <div className="mb-6 flex gap-2 border-b border-slate-200">
//               <button
//                 onClick={() => setActiveCategory("available")}
//                 className={`px-4 py-2 font-medium text-sm transition-colors ${
//                   activeCategory === "available"
//                     ? "text-blue-600 border-b-2 border-blue-600"
//                     : "text-slate-600 hover:text-slate-800"
//                 }`}
//               >
//                 Available ({agents.available?.length || 0})
//               </button>
//               <button
//                 onClick={() => setActiveCategory("offline")}
//                 className={`px-4 py-2 font-medium text-sm transition-colors ${
//                   activeCategory === "offline"
//                     ? "text-blue-600 border-b-2 border-blue-600"
//                     : "text-slate-600 hover:text-slate-800"
//                 }`}
//               >
//                 Offline ({agents.offline?.length || 0})
//               </button>
//             </div>

//             <AgentsGrid
//               agents={
//                 activeCategory === "available"
//                   ? agents.available
//                   : agents.offline
//               }
//             />
//           </>
//         )}
//       </div>
//     </div>
//   );
// }

// app/admin/dashboard/agents/page.jsx
"use client";

import { useEffect, useMemo, useState } from "react";
import AgentsGrid from "@/components/admin/agents/AgentsGrid";
import AgentCategoriesList from "@/components/admin/agents/AgentCategoriesList";
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

  // agents vs super-agents tab
  const [activeCategory, setActiveCategory] = useState("agents");
  // status filter tab (all / available / engaged / offline)
  const [statusFilter, setStatusFilter] = useState("all");

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
  }, []);

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
                <button
                  onClick={() => setStatusFilter("engaged")}
                  className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs sm:text-sm border ${
                    statusFilter === "engaged"
                      ? "bg-blue-50 text-blue-700 border-blue-200"
                      : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                  Engaged
                </button>
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

            <AgentsGrid agents={displayedAgents} />

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
