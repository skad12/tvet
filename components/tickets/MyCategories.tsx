"use client";

import { useEffect, useState } from "react";
import { FiTag } from "react-icons/fi";

import api from "@/lib/axios";

export type MyCategory = { id: string; title: string; sla_hours: number };

// One request per signed-in user, shared by the header and the dashboard
// strip. Keyed on the token so signing in as someone else fetches afresh.
const pending = new Map<string, Promise<MyCategory[]>>();

function fetchMine(): Promise<MyCategory[]> {
  let token = "";
  try {
    token = localStorage.getItem("token") ?? "";
  } catch {}
  let request = pending.get(token);
  if (!request) {
    request = api
      .get("/me/categories/")
      .then((res) => (Array.isArray(res?.data) ? res.data : []))
      .catch(() => {
        pending.delete(token);
        return [];
      });
    pending.set(token, request);
  }
  return request;
}

/** The categories the signed-in user is assigned to; null while loading. */
export function useMyCategories() {
  const [categories, setCategories] = useState<MyCategory[] | null>(null);
  useEffect(() => {
    let alive = true;
    fetchMine().then((list) => alive && setCategories(list));
    return () => {
      alive = false;
    };
  }, []);
  return categories;
}

/**
 * Shown under the greeting on the agent and super agent dashboards: the
 * categories this person covers, in bold, so it is the first thing they see.
 */
export default function MyCategoriesHeadline({ role }: { role: "agent" | "super_agent" }) {
  const categories = useMyCategories();
  const who = role === "super_agent" ? "Super agent for" : "Agent for";

  if (categories === null) {
    return <div className="mt-2 h-6 w-56 animate-pulse rounded-lg bg-slate-100" aria-hidden />;
  }
  if (categories.length === 0) {
    return (
      <p className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-amber-700">
        <FiTag className="h-4 w-4" aria-hidden /> Not assigned to a category yet
      </p>
    );
  }
  return (
    <div className="mt-2">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">{who}</p>
      <ul className="mt-1 flex flex-wrap gap-2">
        {categories.map((c) => (
          <li
            key={c.id}
            className="inline-flex max-w-full items-center gap-2 rounded-xl bg-blue-600 px-3 py-1.5 text-sm font-bold text-white shadow-sm sm:text-base"
          >
            <FiTag className="h-4 w-4 shrink-0" aria-hidden />
            <span className="min-w-0 break-words">{c.title}</span>
            <span className="shrink-0 rounded-md bg-white/20 px-1.5 py-0.5 text-[11px] font-semibold">SLA {c.sla_hours}h</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
