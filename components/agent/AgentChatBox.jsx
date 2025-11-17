"use client";

import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  DEFAULT_CHAT_POLL_MS,
  digestMessages,
  fetchTicketChats,
  normalizeChatEntries,
  postTicketMessage,
} from "@/lib/chatClient";

export default function ChatBox({ selected, userEmail: propUserEmail }) {
  const { token, user } = useAuth();
  const userEmail = propUserEmail ?? user?.email ?? user?.username ?? "me";

  const appUserId =
    user?.app_user_id ??
    user?.appUserId ??
    user?.user_id ??
    user?.id ??
    user?.uid ??
    user?.pk ??
    null;

  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [msgText, setMsgText] = useState("");
  const [error, setError] = useState(null);
  const [serverResponseSnippet, setServerResponseSnippet] = useState(null);
  const [showServerResponse, setShowServerResponse] = useState(false);

  const containerRef = useRef(null);

  function scrollToBottom() {
    try {
      const el = containerRef.current;
      if (!el) return;
      el.scrollTop = el.scrollHeight;
    } catch (e) {}
  }

  const digestRef = useRef("");
  const pollTimerRef = useRef(null);
  const controllerRef = useRef(null);
  const CURRENT_ROLE = "agent";

  const fetchChats = useCallback(
    async ({ showLoading = false } = {}) => {
      if (!selected?.id) return;
      controllerRef.current?.abort();
      const abortController = new AbortController();
      controllerRef.current = abortController;

      try {
        if (showLoading) setLoading(true);
        const data = await fetchTicketChats(selected.id, {
          token,
          signal: abortController.signal,
        });
        const mapped = normalizeChatEntries(data, {
          ticketId: selected.id,
        });
        const digest = digestMessages(mapped);
        if (digest !== digestRef.current) {
          digestRef.current = digest;
          setMessages(mapped);
          requestAnimationFrame(scrollToBottom);
        }
        setError(null);
      } catch (err) {
        if (err.name === "AbortError") return;
        console.error("Failed to load chats:", err);
        setError(err.message || "Failed to load chats");
      } finally {
        if (showLoading) setLoading(false);
      }
    },
    [selected?.id, token]
  );

  useEffect(() => {
    digestRef.current = "";
  }, [selected?.id]);

  useEffect(() => {
    if (!selected?.id) {
      setMessages([]);
      return () => {};
    }

    fetchChats({ showLoading: true });
    pollTimerRef.current = setInterval(
      () => fetchChats(),
      DEFAULT_CHAT_POLL_MS
    );

    return () => {
      controllerRef.current?.abort();
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, [selected?.id, fetchChats]);

  useEffect(() => {
    scrollToBottom();
  }, [messages.length]);

  async function sendMessage(e) {
    if (e && e.preventDefault) e.preventDefault();
    setError(null);
    setServerResponseSnippet(null);

    const text = (msgText || "").trim();
    if (!text || !selected?.id) return;

    if (!appUserId) {
      console.warn("[ChatBox] app_user_id missing; backend may require it.");
    }

    const ticket_id = selected.id;
    const tempId = `tmp-${Date.now()}`;

    const pendingMsg = {
      id: tempId,
      text,
      at: new Date().toISOString(),
      role: CURRENT_ROLE,
      from: appUserId ?? userEmail,
      status: "pending",
    };
    setMessages((s) => [...s, pendingMsg]);
    setMsgText("");
    setSending(true);

    try {
      await postTicketMessage({
        ticketId: ticket_id,
        message: text,
        appUserId: appUserId ?? "",
        token,
      });
      setMessages((s) =>
        s.map((m) => (m.id === tempId ? { ...m, status: "sent" } : m))
      );
      digestRef.current = "";
      fetchChats();
      requestAnimationFrame(scrollToBottom);
    } catch (err) {
      console.error("Failed to send message:", err);
      let snippet = null;
      if (err?.isAxiosError && err.response) {
        snippet =
          typeof err.response.data === "string"
            ? err.response.data
            : JSON.stringify(err.response.data, null, 2);
      } else if (err?.response) {
        snippet =
          typeof err.response.data === "string"
            ? err.response.data
            : JSON.stringify(err.response.data, null, 2);
      } else {
        snippet = err.message ?? String(err);
      }
      setServerResponseSnippet(snippet?.slice?.(0, 5000) ?? String(snippet));
      setError(
        `Failed to send message. Server returned error (see console or "Show response").`
      );
      setMessages((s) =>
        s.map((m) => (m.id === tempId ? { ...m, status: "failed" } : m))
      );
    } finally {
      setSending(false);
    }
  }

  async function retryMessage(msg) {
    if (!msg || msg.status !== "failed") return;
    setMessages((s) =>
      s.map((m) => (m.id === msg.id ? { ...m, status: "pending" } : m))
    );
    setError(null);
    setServerResponseSnippet(null);

    try {
      await postTicketMessage({
        ticketId: selected.id,
        message: msg.text,
        appUserId: appUserId ?? "",
        token,
      });
      setMessages((s) =>
        s.map((m) =>
          m.id === msg.id ? { ...m, status: "sent", role: CURRENT_ROLE } : m
        )
      );
      digestRef.current = "";
      fetchChats();
      requestAnimationFrame(scrollToBottom);
    } catch (err) {
      console.error("Retry failed:", err);
      let snippet = null;
      if (err?.response)
        snippet =
          typeof err.response.data === "string"
            ? err.response.data
            : JSON.stringify(err.response.data, null, 2);
      setServerResponseSnippet(snippet?.slice?.(0, 5000) ?? String(snippet));
      setError("Retry failed. See server response.");
      setMessages((s) =>
        s.map((m) => (m.id === msg.id ? { ...m, status: "failed" } : m))
      );
    }
  }

  return (
    <motion.div
      layout
      className="lg:col-span-1 bg-white rounded shadow p-4 flex flex-col"
    >
      <div className="mb-3">
        <h3 className="font-medium text-slate-800">Conversation</h3>
        <p className="text-xs text-slate-500">Selected ticket chat & replies</p>
      </div>

      {!selected ? (
        <div className="p-6 text-sm text-slate-500">
          No ticket selected. Select a ticket from the list on the right.
        </div>
      ) : (
        <>
          <motion.div layout className="border rounded p-3 mb-4">
            <div className="text-sm font-semibold">
              {selected.category || selected.categoryTitle || "Subject"}
            </div>
            <div className="text-xs text-slate-400 mt-1">
              Ticket ID:{" "}
              <span className="text-xs text-indigo-600">{selected.id}</span>
            </div>
            <div className="text-xs text-slate-400">
              Priority:{" "}
              <span className="inline-block ml-2 text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded">
                Low
              </span>
            </div>
          </motion.div>

          <div
            ref={containerRef}
            className="space-y-3 max-h-[320px] overflow-auto mb-4 flex-1"
          >
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-blue-600 text-white rounded p-3 text-sm"
            >
              Support — Welcome to HelpDesk! Your ticket is being routed, an
              agent will join shortly.
            </motion.div>

            <AnimatePresence initial={false}>
              {loading ? (
                <motion.div
                  key="loading"
                  className="text-sm text-slate-500 p-3"
                >
                  Loading messages…
                </motion.div>
              ) : null}

              {messages.map((m) => (
                <motion.div
                  key={m.id}
                  variants={{
                    hidden: { opacity: 0, y: 6 },
                    visible: { opacity: 1, y: 0 },
                    exit: { opacity: 0, y: -6 },
                  }}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className={`p-3 rounded max-w-[90%] ${
                    m.role === CURRENT_ROLE
                      ? "bg-slate-100 self-end ml-auto text-slate-800"
                      : "bg-white border text-slate-800"
                  }`}
                >
                  <div className="text-sm">{m.text}</div>
                  <div className="text-xs text-slate-400 mt-1 flex items-center gap-2">
                    <span>{format(new Date(m.at), "PPpp")}</span>
                    {m.status === "pending" && (
                      <span className="text-xs text-amber-600">• Sending…</span>
                    )}
                    {m.status === "failed" && (
                      <>
                        <span className="text-xs text-red-600">• Failed</span>
                        <button
                          onClick={() => retryMessage(m)}
                          className="ml-2 text-xs text-blue-600 underline"
                        >
                          Retry
                        </button>
                      </>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {messages.length === 0 && !loading && (
              <div className="text-sm text-slate-400">No messages yet.</div>
            )}
          </div>

          <form onSubmit={sendMessage} className="flex gap-2 items-center mt-2">
            <input
              className="flex-1 border px-3 py-2 rounded"
              placeholder="Type a message..."
              value={msgText}
              onChange={(e) => setMsgText(e.target.value)}
              disabled={sending}
            />
            <motion.button
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={sending}
              className="bg-blue-600 text-white px-3 py-2 rounded"
            >
              {sending ? "Sending..." : "Send"}
            </motion.button>
          </form>

          {error && <div className="mt-2 text-xs text-red-600">{error}</div>}

          {serverResponseSnippet && (
            <div className="mt-2 text-xs">
              <button
                onClick={() => setShowServerResponse((s) => !s)}
                className="underline text-blue-600"
              >
                {showServerResponse
                  ? "Hide server response"
                  : "Show server response (debug)"}
              </button>
              {showServerResponse && (
                <pre className="mt-2 p-2 bg-slate-100 rounded overflow-auto text-xs max-h-40">
                  {serverResponseSnippet}
                </pre>
              )}
            </div>
          )}
        </>
      )}
    </motion.div>
  );
}
