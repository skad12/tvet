
"use client";

import React, { useEffect, useState } from "react";
import { AiOutlineRobot } from "react-icons/ai";
import api from "@/lib/axios";
export default function AiPerformance({ data = {} }) {
  const [escalatedCount, setEscalatedCount] = useState(null);
  const [loadingEscalated, setLoadingEscalated] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function loadEscalated() {
      setLoadingEscalated(true);
      try {
        const res = await api.get("/get-all-escalated-tickets/");
        const list = Array.isArray(res.data)
          ? res.data
          : res.data?.tickets ?? [];
        if (mounted) setEscalatedCount(list.length);
      } catch (e) {
        if (mounted) setEscalatedCount(null);
      } finally {
        if (mounted) setLoadingEscalated(false);
      }
    }

    loadEscalated();
    return () => {
      mounted = false;
    };
  }, []);
  // If the parent passes analytics data, use it; otherwise fallback to example values
  const resolutionRate =
    data.tickets_handled_by_ai && data.total_tickets
      ? Math.round((data.tickets_handled_by_ai / data.total_tickets) * 100)
      : data.ai_resolution_rate ?? 67;

  const changePct = data.ai_change_pct ?? 5; // e.g. +5
  const autoResolved = data.tickets_handled_by_ai ?? data.auto_resolved ?? 8;
  const escalated =
    escalatedCount ?? data.tickets_handled_by_human ?? data.escalated ?? 4;
  const avgResponse =
    data.avg_ai_response_time ?? data.avg_response_time ?? "1.2s";

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-lg bg-slate-50">
            <AiOutlineRobot className="w-6 h-6 text-sky-500" />
          </div>

          <div>
            <div className="text-sm text-slate-500">AI Resolution Rate</div>
            <div className="text-sm text-slate-400">Tickets handled by AI</div>
          </div>
        </div>

        <div className="flex flex-col items-end">
          <div className="text-3xl font-bold text-slate-800">
            {resolutionRate}%
          </div>
          <div className="mt-2 inline-flex items-center text-xs font-medium px-2 py-1 rounded-full bg-emerald-50 text-emerald-700">
            {changePct >= 0 ? `+${changePct}%` : `${changePct}%`}
          </div>
        </div>
      </div>

      <div className="mt-6 text-sm text-slate-600 space-y-3">
        <div className="flex items-center justify-between">
          <div>Handled by AI</div>
          <div className="text-slate-800 font-medium">
            {autoResolved} tickets
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div>Escalated by Agents</div>
          <div className="text-slate-800 font-medium">
            {loadingEscalated && escalatedCount === null ? "…" : escalated}{" "}
            tickets
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div>Avg AI response time</div>
          <div className="text-slate-800 font-medium">{avgResponse}</div>
        </div>
      </div>
    </div>
  );
}
