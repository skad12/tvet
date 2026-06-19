// components/AssignAgentModal.jsx
"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { landing } from "@/components/ui/landingStyles";
import api from "@/lib/axios";

type AssignAgentModalProps = {
  show?: boolean;
  onClose?: () => void;
  ticketId?: any;
  token?: string | null;
  onAssigned?: (agent: any) => void;
};

export default function AssignAgentModal({
  show = false,
  onClose = () => {},
  ticketId = null,
  token = null,
  onAssigned = () => {},
}: AssignAgentModalProps) {
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [assignLoading, setAssignLoading] = useState(false);
  const [notice, setNotice] = useState(null);

  useEffect(() => {
    if (!show) return;
    let mounted = true;
    const ac = new AbortController();

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const res = await api.get("/get-all-users-available/", {
          headers,
          signal: ac.signal,
        });
        const data = res?.data ?? [];
        if (!mounted) return;
        const arr = Array.isArray(data)
          ? data
          : data.results ?? data.data ?? [];
        setAgents(arr);
      } catch (err) {
        if (err?.name === "AbortError" || err?.message === "canceled") return;
        console.error("AssignAgentModal: failed to load agents", err);
        const message = err?.message ?? "Failed to load agents";
        setError(message);
        toast.error(message);
        setAgents([]);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();

    return () => {
      mounted = false;
      ac.abort();
    };
  }, [show, token]);

  async function handleAssign(agent) {
    if (!ticketId || !agent?.id) return;
    setAssignLoading(true);
    setNotice(null);

    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      await api.post(
        "/assign-ticket/to-user/",
        {
          ticket_id: ticketId,
          assigned_to_id: agent.id,
        },
        { headers }
      );

      const name = agent?.name ?? agent?.username ?? agent?.email ?? "Agent";
      setNotice(`Assigned to ${name} successfully.`);
      toast.success(`Assigned to ${name} successfully`);

      // Notify parent
      try {
        onAssigned(agent);
      } catch (e) {}

      // close modal after short delay so user can see notice
      setTimeout(() => onClose(), 700);
    } catch (err) {
      console.error("AssignAgentModal: assignment failed", err);
      const message = err?.response?.data ?? err?.message ?? "Assignment failed";
      setNotice(message);
      toast.error(String(message));
    } finally {
      setAssignLoading(false);
    }
  }

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className={`${landing.modalOverlay} flex items-center justify-center p-4`}
        >
          <div className={landing.modalBackdrop} onClick={onClose} />

          <motion.div
            initial={{ y: 8, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 8, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300 }}
            className={`${landing.modal} w-full max-w-xl p-4 sm:p-6`}
          >
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className={landing.eyebrow}>Routing</p>
                <h4 className={landing.sectionTitle}>Assign agent</h4>
              </div>
              <button onClick={onClose} className={landing.btnGhost}>
                Close
              </button>
            </div>

            <div className={`${landing.sectionDesc} mb-3`}>
              Select an available agent to assign this ticket to.
            </div>

            {loading ? (
              <div className="p-4 text-center">Loading agents…</div>
            ) : error ? (
              <div className="p-3 text-xs text-red-600">{error}</div>
            ) : agents.length === 0 ? (
              <div className="p-3 text-xs text-slate-500">
                No available agents found.
              </div>
            ) : (
              <ul className="space-y-2 max-h-64 overflow-auto">
                {agents.map((a) => (
                  <li
                    key={a.id}
                    className={`${landing.ticketHeader} flex items-center justify-between p-2`}
                  >
                    <div>
                      <div className="text-sm font-medium">
                        {a.username || a.username || a.email}
                      </div>
                      <div className="text-xs text-slate-500">
                        {a.account_type ?? "agent"} •{" "}
                        {a.user_status ?? "Available"}
                      </div>
                    </div>
                    <div>
                      <button
                        onClick={() => handleAssign(a)}
                        disabled={assignLoading}
                        className={`${landing.btnPrimary} text-xs px-3 py-1.5`}
                      >
                        {assignLoading ? "Assigning…" : "Assign"}
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            {notice && (
              <div className="mt-3 text-sm text-green-700">{notice}</div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
