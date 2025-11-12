// // app/admin/dashboard/agents/page.jsx
// "use client";

// import { useEffect, useState } from "react";
// import AgentsGrid from "@/components/admin/agents/AgentsGrid";
// import { motion } from "framer-motion";
// import api from "@/lib/axios";

// export default function AgentsPage() {
//   const [agents, setAgents] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);

//   useEffect(() => {
//     let mounted = true;

//     async function load() {
//       setLoading(true);
//       setError(null);

//       try {
//         let res = null;

//         if (api && typeof api.get === "function") {
//           // try hitting /agents — adjust if your backend uses a different endpoint
//           res = await api.get("/get-all-agents/");
//         } else {
//           // fallback to server-side proxy
//           const f = await fetch("/api/agents");
//           if (!f.ok) throw new Error("proxy fetch failed");
//           res = { data: await f.json() };
//         }

//         // normalize
//         const data = Array.isArray(res.data)
//           ? res.data
//           : res.data?.agents ?? [];

//         if (mounted) {
//           // ensure metrics exist for each agent
//           const normalized = data.map((a, idx) => ({
//             id: a.id ?? `agent-${idx}`,
//             name: a.name ?? a.fullName ?? "Agent",
//             email: a.email ?? `agent${idx}@tvet.local`,
//             phone: a.phone ?? "+234 800 000 0000",
//             status: (a.status || "offline").toLowerCase(),
//             metrics: {
//               active: a.metrics?.active ?? a.active ?? 0,
//               resolved: a.metrics?.resolved ?? a.resolved ?? 0,
//               avgTime: a.metrics?.avgTime ?? a.avgTime ?? "—",
//             },
//           }));

//           setAgents(normalized);
//         }
//       } catch (err) {
//         console.error("Failed to load agents", err);
//         if (mounted) {
//           setError("Failed to load agents — showing demo data");
//           // fallback demo data that matches your screenshot
//           setAgents([
//             {
//               id: "a-1",
//               name: "Adebayo Johnson",
//               email: "adebayo@tvet.edu.ng",
//               phone: "+234 801 234 5678",
//               status: "online",
//               metrics: { active: 5, resolved: 12, avgTime: "3.5m" },
//             },
//             {
//               id: "a-2",
//               name: "Ngozi Okafor",
//               email: "ngozi@tvet.edu.ng",
//               phone: "+234 802 345 6789",
//               status: "online",
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
//           ]);
//         }
//       } finally {
//         if (mounted) setLoading(false);
//       }
//     }

//     load();
//     return () => (mounted = false);
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

//             <AgentsGrid agents={agents} />
//           </>
//         )}
//       </div>
//     </div>
//   );
// }

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

export default function AgentsPage() {
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        let res = null;

        if (api && typeof api.get === "function") {
          // try hitting /get-all-agents/ — adjust if your backend uses a different endpoint
          res = await api.get("/get-all-agents/");
        } else {
          // fallback to server-side proxy
          const f = await fetch("/api/agents");
          if (!f.ok) throw new Error("proxy fetch failed");
          res = { data: await f.json() };
        }

        // The endpoint returns an array — normalize defensively
        const raw = Array.isArray(res.data) ? res.data : res.data?.agents ?? [];

        const normalized = raw.map((a, idx) => {
          const email = a.email ?? a.username ?? `agent${idx}@tvet.local`;
          const rawName = normalizeName(a.name, email);
          const derivedName = rawName ?? nameFromEmail(email);

          return {
            id: a.id ?? a._id ?? `agent-${idx}`,
            name: derivedName,
            email,
            phone: a.phone ?? a.telephone ?? "+234 800 000 0000",
            // keep status normalized to one of: online/away/offline
            status: (a.status || "offline").toString().toLowerCase(),
            metrics: {
              active: a.metrics?.active ?? a.active ?? 0,
              resolved: a.metrics?.resolved ?? a.resolved ?? 0,
              avgTime: a.metrics?.avgTime ?? a.avgTime ?? "—",
            },
            // keep original raw object for debugging if needed
            __raw: a,
          };
        });

        if (mounted) setAgents(normalized);
      } catch (err) {
        console.error("Failed to load agents", err);
        if (mounted) {
          setError("Failed to load agents — showing demo data");
          // fallback demo data
          setAgents([
            {
              id: "a-1",
              name: "Adebayo Johnson",
              email: "adebayo@tvet.edu.ng",
              phone: "+234 801 234 5678",
              status: "online",
              metrics: { active: 5, resolved: 12, avgTime: "3.5m" },
            },
            {
              id: "a-2",
              name: "Ngozi Okafor",
              email: "ngozi@tvet.edu.ng",
              phone: "+234 802 345 6789",
              status: "online",
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
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => (mounted = false);
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
