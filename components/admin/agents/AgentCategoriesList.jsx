"use client";

import React, { useEffect, useMemo, useState } from "react";
import api from "@/lib/axios"; // your axios instance (adjust path if different)

function normalizeAgentName(agent) {
  if (agent === null) return "Unassigned";
  if (typeof agent === "string" && agent.trim().toLowerCase() === "null")
    return "Unassigned";
  if (!agent || (typeof agent === "string" && agent.trim() === ""))
    return "Unassigned";
  return agent;
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

    // Fallback: if category has an assigned_agent string, show it as a single "agent"
    if (activeCategory.assigned_agent) {
      const name = normalizeAgentName(activeCategory.assigned_agent);
      return [
        {
          id: activeCategory.id ?? activeCategory._id ?? "assigned",
          username: name,
          email: "",
          phone: "—",
          status: "available",
        },
      ];
    }

    return [];
  }, [activeCategory, allAgents]);

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
                const count = agentsForCategory(cat, allAgents || []).length;

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
                <div className="flex items-center justify-between mb-3">
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
                  <span className="text-xs text-slate-500">
                    {activeAgents.length} agent
                    {activeAgents.length === 1 ? "" : "s"}
                  </span>
                </div>

                {activeAgents.length === 0 ? (
                  <div className="py-6 text-center text-xs sm:text-sm text-slate-500 border border-dashed border-slate-200 rounded-lg">
                    No agents linked to this category yet.
                  </div>
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
    </div>
  );
}
