"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { FiCheck, FiChevronDown, FiRefreshCw } from "react-icons/fi";
import { toast } from "sonner";

import api from "@/lib/axios";
import usePresence from "@/components/account/usePresence";

export type StatusMode = "auto" | "available" | "engaged" | "offline";
type Server = "Available" | "Engaged" | "Offline";

const CHECK_EVERY_MS = 30_000;
const storageKey = (userId: string) => `tvet-status-mode:${userId}`;

/** Forget the manual choice, so the next sign-in starts on Automatic. */
export function clearStatusMode(userId?: string | null) {
  if (!userId) return;
  try {
    localStorage.removeItem(storageKey(String(userId)));
  } catch {}
}

const OPTIONS: { mode: StatusMode; label: string; hint: string }[] = [
  { mode: "auto", label: "Automatic", hint: "Stay online and receive tickets while this dashboard is open" },
  { mode: "available", label: "Online", hint: "Ready for new tickets" },
  { mode: "engaged", label: "Engaged", hint: "Busy: new tickets go to someone free first" },
  { mode: "offline", label: "Offline", hint: "No new tickets are sent to you" },
];

const LOOK: Record<Server, { label: string; dot: string; pill: string }> = {
  Available: { label: "Online", dot: "bg-emerald-500", pill: "border-emerald-200 bg-emerald-50 text-emerald-700" },
  Engaged: { label: "Engaged", dot: "bg-amber-500", pill: "border-amber-200 bg-amber-50 text-amber-800" },
  Offline: { label: "Offline", dot: "bg-slate-400", pill: "border-slate-200 bg-slate-100 text-slate-600" },
};

/**
 * The agent's status, and the control to set it.
 *
 * Left on Automatic, the agent stays Online while the dashboard is open, so
 * new tickets keep reaching them: the server only hands new tickets to
 * agents marked available, and some of its paths mark an agent Engaged (at
 * sign-in, on assignment) and never undo it. Automatic puts that right
 * within half a minute. A manual choice holds until they change it or sign
 * out. Offline also stops the presence heartbeat, which would otherwise mark
 * them available again.
 */
export default function StatusControl({ userId }: { userId: string | null }) {
  const [mode, setModeState] = useState<StatusMode>("auto");
  // Nothing is sent until the saved choice is read, or a reload would briefly
  // act as Automatic and race a saved Offline back to Online.
  const [ready, setReady] = useState(false);
  const [server, setServer] = useState<Server | null>(null);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  // The saved choice for this person; Automatic when there is none.
  useEffect(() => {
    if (!userId) return;
    try {
      const saved = localStorage.getItem(storageKey(userId)) as StatusMode | null;
      if (saved && OPTIONS.some((o) => o.mode === saved)) setModeState(saved);
    } catch {}
    setReady(true);
  }, [userId]);

  usePresence(!ready || mode === "offline");

  /** Bring the server's status in line with the chosen mode. */
  const sync = useCallback(
    async (current: StatusMode) => {
      if (!userId) return;
      const want: Server = current === "offline" ? "Offline" : current === "engaged" ? "Engaged" : "Available";

      const res = await api.get(`/get-user-status/${userId}/`).catch(() => null);
      const now = (res?.data?.status ?? "Offline") as Server;
      if (now !== want) {
        await api.post("/set-user-status/", { app_user_id: userId, status: want });
        // A first heartbeat may not have landed yet; it will show Online then.
        if (want !== "Offline") await api.post("/me/heartbeat/").catch(() => {});
      }
      const after = await api.get(`/get-user-status/${userId}/`).catch(() => null);
      setServer((after?.data?.status ?? want) as Server);
    },
    [userId]
  );

  useEffect(() => {
    if (!userId || !ready) return;
    let alive = true;
    const run = () => {
      if (document.visibilityState === "visible") sync(mode).catch(() => alive && setServer(null));
    };
    run();
    const timer = window.setInterval(run, CHECK_EVERY_MS);
    document.addEventListener("visibilitychange", run);
    return () => {
      alive = false;
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", run);
    };
  }, [userId, ready, mode, sync]);

  // Close the menu on an outside click or Escape.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => !boxRef.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  async function choose(next: StatusMode) {
    setOpen(false);
    if (!userId) return;
    try {
      localStorage.setItem(storageKey(userId), next);
    } catch {}
    setBusy(true);
    try {
      await sync(next);
      setModeState(next);
      toast.success(next === "auto" ? "Status set to Automatic" : `You are now ${OPTIONS.find((o) => o.mode === next)?.label}`);
    } catch {
      toast.error("Couldn't update your status. It will retry shortly.");
    } finally {
      setBusy(false);
    }
  }

  const look = server ? LOOK[server] : null;
  return (
    <div ref={boxRef} className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Status: ${look?.label ?? "checking"}${mode === "auto" ? ", automatic" : ""}. Change status`}
        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold transition hover:shadow-sm ${
          look?.pill ?? "border-blue-200 bg-blue-50 text-blue-700"
        }`}
      >
        {busy ? <FiRefreshCw className="h-3 w-3 animate-spin" aria-hidden /> : <span className={`h-2 w-2 rounded-full ${look?.dot ?? "bg-blue-400"}`} aria-hidden />}
        {look?.label ?? "Checking…"}
        {mode === "auto" && <span className="font-normal opacity-75">· Auto</span>}
        <FiChevronDown className={`h-3.5 w-3.5 transition ${open ? "rotate-180" : ""}`} aria-hidden />
      </button>

      {open && (
        <div role="menu" aria-label="Set your status" className="absolute left-0 z-50 mt-2 w-72 rounded-2xl border border-border bg-card p-1.5 shadow-xl">
          {OPTIONS.map((o) => {
            const on = o.mode === mode;
            const dot = o.mode === "auto" ? "bg-blue-500" : LOOK[o.mode === "available" ? "Available" : o.mode === "engaged" ? "Engaged" : "Offline"].dot;
            return (
              <button
                key={o.mode}
                type="button"
                role="menuitemradio"
                aria-checked={on}
                onClick={() => choose(o.mode)}
                className={`flex w-full items-start gap-2.5 rounded-xl px-3 py-2 text-left transition ${on ? "bg-blue-50" : "hover:bg-surface-muted"}`}
              >
                <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${dot}`} aria-hidden />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-foreground">{o.label}</span>
                  <span className="block text-xs text-muted">{o.hint}</span>
                </span>
                {on && <FiCheck className="mt-1 h-4 w-4 shrink-0 text-blue-600" aria-hidden />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
