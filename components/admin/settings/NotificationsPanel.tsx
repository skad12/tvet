"use client";

import { useState } from "react";
import { landing } from "@/components/ui/landingStyles";

export default function NotificationsPanel() {
  const initial = {
    newTicketAlerts: true,
    ticketAssignment: true,
    aiEscalations: true,
    dailySummary: false,
  };
  const [prefs, setPrefs] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: string; text: string } | null>(null);

  const toggle = (k: keyof typeof initial) =>
    setPrefs((s) => ({ ...s, [k]: !s[k] }));

  const save = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setSaving(true);
    setMsg(null);
    try {
      await new Promise((r) => setTimeout(r, 600));
      setMsg({ type: "success", text: "Notification preferences saved." });
    } catch {
      setMsg({ type: "error", text: "Failed to save." });
    } finally {
      setSaving(false);
    }
  };

  const Row = ({
    title,
    desc,
    keyName,
  }: {
    title: string;
    desc: string;
    keyName: keyof typeof initial;
  }) => (
    <div className="flex items-center justify-between gap-4 border-b border-border py-4 last:border-b-0">
      <div>
        <div className="font-medium text-foreground">{title}</div>
        <div className="mt-1 text-sm text-muted">{desc}</div>
      </div>
      <label className="relative inline-flex cursor-pointer items-center">
        <input
          type="checkbox"
          checked={prefs[keyName]}
          onChange={() => toggle(keyName)}
          className="peer sr-only"
        />
        <div className="h-6 w-11 rounded-full bg-surface-muted transition peer-checked:bg-blue-600 peer-focus:ring-4 peer-focus:ring-ring" />
        <span className="absolute left-1 top-0.5 h-5 w-5 rounded-full bg-card shadow transition peer-checked:translate-x-5" />
      </label>
    </div>
  );

  return (
    <form onSubmit={save} className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold text-foreground">
          Notification Preferences
        </h3>
        <p className={landing.subtitle}>
          Choose what notifications you want to receive
        </p>
      </div>

      <div className="rounded-2xl border border-border bg-surface-muted/50 px-4">
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

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {msg ? (
          <div
            className={`text-sm ${
              msg.type === "success" ? "text-emerald-700" : "text-red-700"
            }`}
          >
            {msg.text}
          </div>
        ) : (
          <div />
        )}
        <button type="submit" disabled={saving} className={landing.btnPrimary}>
          {saving ? "Saving..." : "Save preferences"}
        </button>
      </div>
    </form>
  );
}
