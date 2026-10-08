"use client";

import { useEffect } from "react";

import api from "@/lib/axios";

const EVERY_MS = 60_000;

/**
 * Tells the server this person still has their dashboard open: once on load,
 * every minute while the tab is visible, and again on coming back to it. The
 * server counts anyone silent for three minutes as offline.
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
      if (document.visibilityState !== "visible") return;
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
