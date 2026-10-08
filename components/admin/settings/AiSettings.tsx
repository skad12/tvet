"use client";

import { useState } from "react";
import { landing } from "@/components/ui/landingStyles";

export default function AiSettings() {
  const [config, setConfig] = useState({
    autoRespond: true,
    smartRouting: true,
    threshold: 85,
  });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: string; text: string } | null>(null);

  const toggle = (k: "autoRespond" | "smartRouting") =>
    setConfig((s) => ({ ...s, [k]: !s[k] }));
  const setThreshold = (v: number) =>
    setConfig((s) => ({ ...s, threshold: v }));

  const save = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setSaving(true);
    setMsg(null);
    try {
      await new Promise((r) => setTimeout(r, 600));
      setMsg({ type: "success", text: "AI settings saved." });
    } catch {
      setMsg({ type: "error", text: "Failed to save." });
    } finally {
      setSaving(false);
    }
  };

  const ToggleRow = ({
    title,
    desc,
    checked,
    onChange,
  }: {
    title: string;
    desc: string;
    checked: boolean;
    onChange: () => void;
  }) => (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-border bg-surface-muted/50 p-4">
      <div>
        <div className="font-medium text-foreground">{title}</div>
        <div className="mt-1 text-sm text-muted">{desc}</div>
      </div>
      <label className="relative inline-flex cursor-pointer items-center">
        <input
          type="checkbox"
          className="peer sr-only"
          checked={checked}
          onChange={onChange}
        />
        <div className="h-6 w-11 rounded-full bg-surface-muted transition peer-checked:bg-blue-600" />
        <span className="absolute left-1 top-0.5 h-5 w-5 rounded-full bg-card shadow transition peer-checked:translate-x-5" />
      </label>
    </div>
  );

  return (
    <form onSubmit={save} className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold text-foreground">
          AI Assistant Configuration
        </h3>
        <p className={landing.subtitle}>
          Configure how AI handles support tickets
        </p>
      </div>

      <div className="space-y-4">
        <ToggleRow
          title="Enable AI Auto-Response"
          desc="AI automatically responds to common questions"
          checked={config.autoRespond}
          onChange={() => toggle("autoRespond")}
        />
        <ToggleRow
          title="Smart Routing"
          desc="AI routes tickets to the best agent"
          checked={config.smartRouting}
          onChange={() => toggle("smartRouting")}
        />

        <div className="grid items-center gap-4 rounded-2xl border border-border bg-surface-muted/50 p-4 md:grid-cols-2">
          <div>
            <div className="font-medium text-foreground">
              AI Confidence Threshold
            </div>
            <div className="mt-1 text-sm text-muted">
              Minimum confidence level for AI to auto-respond (0-100)
            </div>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="number"
              min={0}
              max={100}
              value={config.threshold}
              onChange={(e) => setThreshold(Number(e.target.value))}
              className={`${landing.input} max-w-[8rem]`}
            />
            <div className="text-sm text-muted">%</div>
          </div>
        </div>
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
          {saving ? "Saving..." : "Save AI settings"}
        </button>
      </div>
    </form>
  );
}
