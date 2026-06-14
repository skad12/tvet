"use client";

import { useState } from "react";
import { motion } from "framer-motion";

export default function NotificationsPanel() {
  const initial = {
    newTicketAlerts: true,
    ticketAssignment: true,
    aiEscalations: true,
    dailySummary: false,
  };
  const [prefs, setPrefs] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);

  const toggle = (k) => setPrefs((s) => ({ ...s, [k]: !s[k] }));

  const save = async (e) => {
    e?.preventDefault();
    setSaving(true);
    setMsg(null);
    try {
      // simulate
      await new Promise((r) => setTimeout(r, 600));
      setMsg({ type: "success", text: "Notification preferences saved." });
    } catch {
      setMsg({ type: "error", text: "Failed to save." });
    } finally {
      setSaving(false);
    }
  };

  const Row = ({ title, desc, keyName }) => (
    <div className="flex items-center justify-between py-3 border-b last:border-b-0">
      <div>
        <div className="font-medium text-slate-800">{title}</div>
        <div className="text-sm text-slate-500 mt-1">{desc}</div>
      </div>
      <div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={prefs[keyName]}
            onChange={() => toggle(keyName)}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-slate-200 rounded-full peer-checked:bg-blue-600 peer-focus:ring-2 peer-focus:ring-blue-200 transition" />
          <span
            className={`dot absolute left-1 top-0.5 w-5 h-5 bg-white rounded-full shadow transform transition peer-checked:translate-x-5`}
          />
        </label>
      </div>
    </div>
  );

  return (
    <form onSubmit={save} className="space-y-4">
      <div>
        <h3 className="text-xl font-semibold text-slate-800">
          Notification Preferences
        </h3>
        <p className="text-sm text-slate-500 mt-1">
          Choose what notifications you want to receive
        </p>
      </div>

      <div className="mt-4 space-y-0 rounded-md overflow-hidden bg-white">
        <Row
          keyName="newTicketAlerts"
          title="New Ticket Alerts"
          desc="Get notified when a new ticket is created"
        />
        <Row
          keyName="ticketAssignment"
          title="Ticket Assignment"
          desc="Notifications when tickets are assigned to you"
        />
        <Row
          keyName="aiEscalations"
          title="AI Escalations"
          desc="When AI escalates a ticket to human agents"
        />
        <Row
          keyName="dailySummary"
          title="Daily Summary"
          desc="Receive a daily summary of ticket activity"
        />
      </div>

      <div className="flex items-center justify-between">
        <div>
          {msg && (
            <div
              className={`text-sm ${
                msg.type === "success" ? "text-green-700" : "text-red-700"
              }`}
            >
              {msg.text}
            </div>
          )}
        </div>
        <button
          type="submit"
          disabled={saving}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg disabled:opacity-60"
        >
          {saving ? "Saving..." : "Save preferences"}
        </button>
      </div>
    </form>
  );
}
