"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { FiCheck, FiCpu, FiRefreshCw } from "react-icons/fi";
import { toast } from "sonner";

import api from "@/lib/axios";
import { apiErrorMessage } from "@/lib/apiError";

type Key = "ai_enabled" | "handover_on_request" | "faq_only";
type Config = Record<Key, boolean> & { updated_at?: string | null; updated_by?: string };

const ROWS: { key: Key; title: string; on: string; off: string }[] = [
  {
    key: "ai_enabled",
    title: "AI auto-response",
    on: "The AI answers trainees in the chat and hands over to staff when it needs to.",
    off: "The AI is off: every trainee message goes straight to a live agent.",
  },
  {
    key: "handover_on_request",
    title: "Hand over when asked",
    on: "A trainee who asks for a person is handed to a live agent straight away.",
    off: "The AI tries to help first, even when a trainee asks for a person.",
  },
  {
    key: "faq_only",
    title: "Answer only from FAQs",
    on: "Strict: the AI only answers what the FAQs cover and hands everything else to staff.",
    off: "The AI answers from the FAQs and can also give general guidance.",
  },
];

function Switch({ checked, disabled, onChange, label }: { checked: boolean; disabled?: boolean; onChange: () => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={onChange}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition focus:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 ${
        checked ? "bg-blue-600" : "bg-slate-300 dark:bg-slate-600"
      }`}
    >
      <span className={`inline-block h-5 w-5 rounded-full bg-white shadow transition ${checked ? "translate-x-5" : "translate-x-0.5"}`} />
    </button>
  );
}

/**
 * How the widget's AI behaves. Saved to the server the moment a switch is
 * flipped, and used from the trainee's next message.
 */
export default function AiSettings() {
  const [config, setConfig] = useState<Config | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState<Key | null>(null);

  const load = () => {
    setError(null);
    api
      .get("/settings/ai/")
      .then((r) => setConfig(r.data))
      .catch((err) => setError(apiErrorMessage(err, "Couldn't load the AI settings.")));
  };
  useEffect(load, []);

  async function flip(key: Key) {
    if (!config || saving) return;
    const next = !config[key];
    setSaving(key);
    setConfig({ ...config, [key]: next });
    try {
      const res = await api.patch("/settings/ai/", { [key]: next });
      setConfig(res.data);
      toast.success(`${ROWS.find((r) => r.key === key)?.title} ${next ? "on" : "off"}`);
    } catch (err) {
      setConfig((c) => (c ? { ...c, [key]: !next } : c));
      toast.error(apiErrorMessage(err, "Couldn't save that change."));
    } finally {
      setSaving(null);
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h3 className="inline-flex items-center gap-2 text-lg font-semibold text-foreground">
          <FiCpu className="text-blue-600" aria-hidden /> AI assistant
        </h3>
        <p className="text-sm text-muted">How the chat AI answers trainees. Changes save straight away and apply from the next message.</p>
      </div>

      {error ? (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
          <span>{error}</span>
          <button type="button" onClick={load} className="inline-flex items-center gap-1 font-semibold underline">
            <FiRefreshCw className="h-3.5 w-3.5" /> Try again
          </button>
        </div>
      ) : !config ? (
        <div className="space-y-3">
          {ROWS.map((r) => (
            <div key={r.key} className="h-20 animate-pulse rounded-2xl bg-surface-muted" />
          ))}
        </div>
      ) : (
        <ul className="space-y-3">
          {ROWS.map((r) => {
            const on = config[r.key];
            const inert = r.key !== "ai_enabled" && !config.ai_enabled;
            return (
              <li key={r.key} className={`flex items-start justify-between gap-4 rounded-2xl border border-border bg-surface-muted/50 p-4 ${inert ? "opacity-60" : ""}`}>
                <div className="min-w-0">
                  <p className="font-medium text-foreground">{r.title}</p>
                  <p className="mt-1 text-sm text-muted">{on ? r.on : r.off}</p>
                  {inert && <p className="mt-1 text-xs text-amber-700">Has no effect while the AI is off.</p>}
                </div>
                <div className="flex items-center gap-2 pt-0.5">
                  {saving === r.key ? <FiRefreshCw className="h-4 w-4 animate-spin text-muted" aria-hidden /> : null}
                  <Switch checked={on} disabled={saving !== null} onChange={() => flip(r.key)} label={r.title} />
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {config?.updated_at && (
        <p className="inline-flex items-center gap-1.5 text-xs text-muted">
          <FiCheck className="text-emerald-600" aria-hidden /> Saved · last changed {format(new Date(config.updated_at), "d MMM yyyy, HH:mm")}
          {config.updated_by ? ` by ${config.updated_by}` : ""}
        </p>
      )}
    </div>
  );
}
