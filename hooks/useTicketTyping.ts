"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type UseTicketTypingOptions = {
  ticketId?: string | number | null;
  userId?: string | number | null;
  userName?: string;
  role?: string;
  text?: string;
  enabled?: boolean;
};

type RemoteTyper = {
  userId: string;
  userName: string;
  role: string;
};

export function useTicketTyping({
  ticketId,
  userId,
  userName = "Someone",
  role = "user",
  text = "",
  enabled = true,
}: UseTicketTypingOptions) {
  const [remoteTypers, setRemoteTypers] = useState<RemoteTyper[]>([]);
  const isTypingRef = useRef(false);

  const signalTyping = useCallback(
    async (isTyping: boolean) => {
      if (!enabled || !ticketId || !userId) return;
      if (!isTyping && !isTypingRef.current) return;

      isTypingRef.current = isTyping;

      try {
        await fetch("/api/chat-typing", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ticketId: String(ticketId),
            userId: String(userId),
            userName,
            role,
            isTyping,
          }),
        });
      } catch {
        // Non-blocking presence signal
      }
    },
    [enabled, role, ticketId, userId, userName]
  );

  useEffect(() => {
    if (!enabled || !ticketId || !userId) {
      setRemoteTypers([]);
      return;
    }

    const trimmed = String(text ?? "").trim();
    if (trimmed) {
      signalTyping(true);
    } else {
      signalTyping(false);
    }
  }, [enabled, signalTyping, text, ticketId, userId]);

  useEffect(() => {
    if (!enabled || !ticketId || !userId) {
      setRemoteTypers([]);
      return;
    }

    let mounted = true;

    const poll = async () => {
      try {
        const params = new URLSearchParams({
          ticketId: String(ticketId),
          excludeUserId: String(userId),
        });
        const response = await fetch(`/api/chat-typing?${params.toString()}`);
        if (!response.ok) return;
        const data = await response.json();
        if (!mounted) return;
        setRemoteTypers(Array.isArray(data?.typing) ? data.typing : []);
      } catch {
        if (mounted) setRemoteTypers([]);
      }
    };

    poll();
    const interval = setInterval(poll, 2000);

    return () => {
      mounted = false;
      clearInterval(interval);
      signalTyping(false);
    };
  }, [enabled, signalTyping, ticketId, userId]);

  const remoteTyping = remoteTypers.length > 0;
  const remoteLabel = remoteTypers[0]?.userName
    ? `${remoteTypers[0].userName} is typing`
    : "Someone is typing";

  return {
    remoteTyping,
    remoteTypers,
    remoteLabel,
  };
}
