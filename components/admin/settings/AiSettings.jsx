"use client";

import { useState } from "react";

export default function AiSettings() {
  const [config, setConfig] = useState({
    autoRespond: true,
    smartRouting: true,
    threshold: 85,
  });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);

  const toggle = (k) => setConfig((s) => ({ ...s, [k]: !s[k] }));
  const setThreshold = (v) => setConfig((s) => ({ ...s, threshold: v }));

  const save = async (e) => {
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

  const inputClass =
    "w-28 border border-slate-400 rounded px-3 py-2 outline-none focus:ring-1 focus:shadow-md";

  return (
    <form onSubmit={save} className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold text-slate-700">
          AI Assistant Configuration
        </h3>
        <p className="text-sm text-slate-500 mt-1">
          Configure how AI handles support tickets
        </p>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="font-medium text-slate-700">
              Enable AI Auto-Response
            </div>
            <div className="text-sm text-slate-500">
              AI automatically responds to common questions
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={config.autoRespond}
              onChange={() => toggle("autoRespond")}
            />
            <div className="w-12 h-6 bg-slate-200 rounded-full peer-checked:bg-blue-600 transition" />
            <span className="dot absolute left-1 top-0.5 w-5 h-5 bg-white rounded-full shadow transform transition peer-checked:translate-x-5" />
          </label>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <div className="font-medium text-slate-700">Smart Routing</div>
            <div className="text-sm text-slate-500">
              AI routes tickets to the best agent
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={config.smartRouting}
              onChange={() => toggle("smartRouting")}
            />
            <div className="w-12 h-6 bg-slate-200 rounded-full peer-checked:bg-blue-600 transition" />
            <span className="dot absolute left-1 top-0.5 w-5 h-5 bg-white rounded-full shadow transform transition peer-checked:translate-x-5" />
          </label>
        </div>

        <div className="grid md:grid-cols-2 gap-4 items-center">
          <div>
            <div className="font-medium text-slate-700">
              AI Confidence Threshold
            </div>
            <div className="text-sm text-slate-500">
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
              className={inputClass}
            />
            <div className="text-sm text-slate-500">%</div>
          </div>
        </div>
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
          {saving ? "Saving..." : "Save AI settings"}
        </button>
      </div>
    </form>
  );
}
