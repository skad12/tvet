"use client";

import { useEffect } from "react";

import api from "@/lib/axios";

const EVERY_MS = 60_000;

/**
 * Tells the server this person still has their dashboard open: once on load,
 * every minute, and again on coming back to the tab. The server counts anyone
 * silent for three minutes as offline, so this keeps going while the tab is in
 * the background: agents work in other tabs and still need tickets.
 *
 * `paused` stops the heartbeats, for someone who has set themselves Offline:
 * a heartbeat would otherwise mark them available again.
 */
export default function usePresence(paused = false) {
  useEffect(() => {
    if (paused) return;
    let hasToken = false;
    try {
      hasToken = !!localStorage.getItem("token");
    } catch {}
    if (!hasToken) return;

    const beat = () => {
      api.post("/me/heartbeat/").catch(() => {});
    };
    beat();
    const timer = window.setInterval(beat, EVERY_MS);
    document.addEventListener("visibilitychange", beat);
    window.addEventListener("focus", beat);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", beat);
      window.removeEventListener("focus", beat);
    };
  }, [paused]);
}
