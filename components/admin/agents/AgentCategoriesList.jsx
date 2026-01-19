
"use client";

import React, { useEffect, useMemo, useState } from "react";
import api from "@/lib/axios"; // your axios instance (adjust path if different)

function normalizeAgentName(agent) {
  // Return a cleaned agent name string, or null if there's no useful name.
  if (agent === null || agent === undefined) return null;
  if (typeof agent === "string") {
    const v = agent.trim();
    if (
      v === "" ||
      v.toLowerCase() === "null" ||
      v.toLowerCase() === "unassigned"
    )
      return null;
    return v;
  }
  return String(agent);
}

function isAssignedAgentValid(agent) {
  // true if assigned_agent contains a usable value
  return normalizeAgentName(agent) !== null;
}

// Try to match agents to a category using several likely fields
function agentsForCategory(category, allAgents) {
  if (!Array.isArray(allAgents)) return [];

  const catId = String(category.id ?? category._id ?? "")
    .toString()
    .toLowerCase();
  const catTitle = String(
    category.title ?? category.name ?? category.label ?? ""
  )
    .toString()
    .toLowerCase();

  return allAgents.filter((agent) => {
    const aCatId = (
      agent.category_id ??
      agent.categoryId ??
      agent.category?.id ??
      agent.category?._id ??
      null
    )
      ?.toString()
      .toLowerCase();

    const aCatTitle = String(
      agent.category_title ??
        agent.categoryTitle ??
        agent.category?.title ??
        agent.category?.name ??
        ""
    )
      .toString()
      .toLowerCase();

    if (catId && aCatId && aCatId === catId) return true;
    if (catTitle && aCatTitle && aCatTitle === catTitle) return true;
    return false;
  });
}

export default function AgentCategoriesList({
  initialData = null,
  allAgents = [],
}) {
  const [categories, setCategories] = useState(initialData);
  const [loading, setLoading] = useState(!initialData);
  const [error, setError] = useState(null);
  const [activeCategoryId, setActiveCategoryId] = useState(null);

  // State for assign agent modal
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedAgentId, setSelectedAgentId] = useState("");
  const [assigning, setAssigning] = useState(false);
  const [assignError, setAssignError] = useState(null);
  const [assignSuccess, setAssignSuccess] = useState(false);

  useEffect(() => {
    // If parent provided categories, just mirror them locally once
    if (initialData && Array.isArray(initialData)) {
      setCategories(initialData);
      if (!activeCategoryId && initialData.length > 0) {
        const firstId = initialData[0].id ?? initialData[0]._id ?? null;
        setActiveCategoryId(firstId);
      }
      return;
    }

    let mounted = true;
    setLoading(true);
    setError(null);

    api
      .get("/get-all-category/")
      .then((res) => {
        if (!mounted) return;
        const data = Array.isArray(res?.data)
          ? res.data
          : res?.data?.results || [];
        setCategories(data);
        if (!activeCategoryId && data.length > 0) {
          const firstId = data[0].id ?? data[0]._id ?? null;
          setActiveCategoryId(firstId);
        }
      })
      .catch((err) => {
        if (!mounted) return;
        setError(err?.message || "Failed to load categories");
      })
      .finally(() => mounted && setLoading(false));

    return () => {
      mounted = false;
    };
  }, [initialData, activeCategoryId]);

  const activeCategory = useMemo(() => {
    if (!Array.isArray(categories)) return null;
    if (!activeCategoryId && categories.length > 0) return categories[0];
    return (
      categories.find(
        (c) => String(c.id ?? c._id ?? "") === String(activeCategoryId ?? "")
      ) ?? null
    );
  }, [categories, activeCategoryId]);

  const activeAgents = useMemo(() => {
    if (!activeCategory) return [];
    const fromLink = agentsForCategory(activeCategory, allAgents || []);
    if (fromLink.length > 0) return fromLink;

    // Fallback: only show a single assigned agent if the assigned_agent field
    // contains a valid name/value (not "null", not empty, etc).
    const assignedName = normalizeAgentName(activeCategory.assigned_agent);
    if (assignedName) {
      return [
        {
          id: activeCategory.id ?? activeCategory._id ?? "assigned",
          username: assignedName,
          email: "",
          phone: "—",
          status: "available",
        },
      ];
    }

    // No linked agents and no valid assigned agent
    return [];
  }, [activeCategory, allAgents]);

  // Function to assign agent to category
  async function handleAssignAgent() {
    if (!selectedAgentId || !activeCategory) return;

    setAssigning(true);
    setAssignError(null);
    setAssignSuccess(false);

    try {
      const categoryId = activeCategory.id ?? activeCategory._id;
      await api.post("/assign-category/to-user/", {
        category_id: categoryId,
        assigned_to_id: selectedAgentId,
      });

      setAssignSuccess(true);
      setShowAssignModal(false);
      setSelectedAgentId("");

      // Refresh categories to get updated assignments
      const res = await api.get("/get-all-category/");
      const data = Array.isArray(res?.data)
        ? res.data
        : res?.data?.results || [];
      setCategories(data);

      // Show success message briefly
      setTimeout(() => setAssignSuccess(false), 3000);
    } catch (err) {
      console.error("Failed to assign agent:", err);
      setAssignError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to assign agent to category"
      );
    } finally {
      setAssigning(false);
    }
  }

  return (
    <div className="w-full bg-white rounded-xl shadow-sm border border-slate-200 p-4 sm:p-6">
      <div className="flex items-center justify-between mb-4 gap-2">
        <div>
          <h2 className="text-lg sm:text-xl font-semibold text-slate-800">
            Agent Categories
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Browse agents grouped by ticket category
          </p>
        </div>
        <span className="text-xs sm:text-sm text-slate-500">
          {loading
            ? "Loading..."
            : `${(categories || []).length} categor${
                (categories || []).length === 1 ? "y" : "ies"
              }`}
        </span>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-md bg-red-50 text-red-700 text-sm">
          Error: {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-10">
          <svg
            className="w-8 h-8 animate-spin text-slate-400"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden
          >
            <circle
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
              className="opacity-25"
            />
            <path
              d="M4 12a8 8 0 018-8"
              stroke="currentColor"
              strokeWidth="4"
              className="opacity-75"
            />
          </svg>
        </div>
      ) : (categories || []).length === 0 ? (
        <div className="py-8 text-center text-slate-500 text-sm">
          No categories found
        </div>
      ) : (
        <>
          {/* Category tabs – similar pill style to ticket categories */}
          <div className="mb-4 overflow-x-auto pb-1">
            <div className="inline-flex items-center gap-2">
              {(categories || []).map((cat) => {
                const id = cat.id ?? cat._id ?? null;
                const title = cat.title ?? cat.name ?? "Untitled";

                const linkedCount = agentsForCategory(
                  cat,
                  allAgents || []
                ).length;
                const assignedValid = isAssignedAgentValid(cat.assigned_agent);

                // If there are linked agents, use that count. Otherwise if the category
                // has a valid assigned_agent string, count as 1. If assigned_agent is "null" or missing,
                // show 0.
                const count =
                  linkedCount > 0 ? linkedCount : assignedValid ? 1 : 0;

                const isActive =
                  String(id ?? "") === String(activeCategoryId ?? "");

                return (
                  <button
                    key={id ?? title}
                    onClick={() => setActiveCategoryId(id)}
                    className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium whitespace-nowrap transition-colors border ${
                      isActive
                        ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                        : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <span>{title}</span>
                    <span
                      className={`ml-1 inline-flex items-center justify-center rounded-full px-1.5 text-[10px] ${
                        isActive
                          ? "bg-white/15 text-slate-100"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Agents under active category – ticket-form like card body */}
          <div className="mt-2 border-t border-slate-200 pt-4">
            {activeCategory ? (
              <>
                <div className="flex items-center justify-between mb-3 gap-3">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-800">
                      {activeCategory.title ??
                        activeCategory.name ??
                        "Selected Category"}
                    </h3>
                    <p className="text-xs text-slate-500">
                      Agents currently assigned to this category
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">
                      {activeAgents.length} agent
                      {activeAgents.length === 1 ? "" : "s"}
                    </span>
                    <button
                      onClick={() => {
                        setShowAssignModal(true);
                        setAssignError(null);
                        setSelectedAgentId("");
                      }}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors shadow-sm"
                    >
                      <svg
                        className="w-3 h-3"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M12 5v14M5 12h14" />
                      </svg>
                      Assign Agent
                    </button>
                  </div>
                </div>

                {activeAgents.length === 0 ? (
                  // Distinguish explicit "assigned_agent" = "null" from an entirely empty fallback
                  activeCategory.hasOwnProperty("assigned_agent") &&
                  !isAssignedAgentValid(activeCategory.assigned_agent) ? (
                    <div className="py-6 text-center text-xs sm:text-sm text-slate-500 border border-dashed border-slate-200 rounded-lg">
                      No agents assigned
                    </div>
                  ) : (
                    <div className="py-6 text-center text-xs sm:text-sm text-slate-500 border border-dashed border-slate-200 rounded-lg">
                      No agents linked to this category yet.
                    </div>
                  )
                ) : (
                  <ul className="divide-y divide-slate-100 rounded-lg border border-slate-100 overflow-hidden bg-slate-50/60">
                    {activeAgents.map((agent) => {
                      const status = (agent.status || "offline")
                        .toString()
                        .toLowerCase();

                      let badgeClass = "bg-red-50 text-red-700 border-red-200";
                      let dotClass = "bg-red-500";
                      let label = "Offline";

                      if (status === "available") {
                        badgeClass =
                          "bg-emerald-50 text-emerald-700 border-emerald-200";
                        dotClass = "bg-emerald-500";
                        label = "Available";
                      } else if (status === "engaged") {
                        badgeClass = "bg-blue-50 text-blue-700 border-blue-200";
                        dotClass = "bg-blue-500";
                        label = "Engaged";
                      }

                      return (
                        <li
                          key={agent.id || agent.email || agent.username}
                          className="flex items-center justify-between gap-3 px-3 py-3 bg-white/70"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-semibold text-slate-700">
                              {(agent.username || "AG")
                                .split(/\s|[._-]/)
                                .map((s) => (s ? s[0] : ""))
                                .slice(0, 2)
                                .join("")
                                .toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <div className="text-sm font-medium text-slate-800 truncate">
                                {agent.username || "Agent"}
                              </div>
                              {agent.email && (
                                <div className="text-xs text-slate-500 truncate">
                                  {agent.email}
                                </div>
                              )}
                            </div>
                          </div>

                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border ${badgeClass}`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${dotClass}`}
                            />
                            {label}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </>
            ) : (
              <div className="py-6 text-center text-xs sm:text-sm text-slate-500">
                Select a category to see its agents.
              </div>
            )}
          </div>
        </>
      )}

      {/* Success Message */}
      {assignSuccess && (
        <div className="mt-4 p-3 rounded-md bg-emerald-50 text-emerald-700 text-sm border border-emerald-200">
          Agent successfully assigned to category!
        </div>
      )}

      {/* Assign Agent Modal */}
      {showAssignModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setShowAssignModal(false)}
        >
          <div
            className="bg-white rounded-lg shadow-xl max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-800">
                Assign Agent to Category
              </h3>
              <button
                onClick={() => setShowAssignModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="mb-4">
              <p className="text-sm text-slate-600 mb-3">
                Select an agent to assign to{" "}
                <span className="font-medium">
                  {activeCategory?.title ?? activeCategory?.name}
                </span>
              </p>

              <label className="block text-sm font-medium text-slate-700 mb-2">
                Agent
              </label>
              <select
                value={selectedAgentId}
                onChange={(e) => setSelectedAgentId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={assigning}
              >
                <option value="">Select an agent...</option>
                {(allAgents || []).map((agent) => (
                  <option key={agent.id} value={agent.id}>
                    {agent.username} ({agent.email})
                  </option>
                ))}
              </select>
            </div>

            {assignError && (
              <div className="mb-4 p-3 rounded-md bg-red-50 text-red-700 text-sm border border-red-200">
                {assignError}
              </div>
            )}

            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setShowAssignModal(false)}
                disabled={assigning}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={handleAssignAgent}
                disabled={!selectedAgentId || assigning}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {assigning ? "Assigning..." : "Assign Agent"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
