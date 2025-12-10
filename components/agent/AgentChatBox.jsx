"use client";

import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/axios";
import {
  DEFAULT_CHAT_POLL_MS,
  digestMessages,
  fetchTicketChats,
  normalizeChatEntries,
  postTicketMessage,
} from "@/lib/chatClient";

export default function ChatBox({
  selected,
  userEmail: propUserEmail,
  onEscalated,
}) {
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
  const [escalating, setEscalating] = useState(false);
  const [escalated, setEscalated] = useState(false);
  const [escalateError, setEscalateError] = useState(null);
  const [escalationNotice, setEscalationNotice] = useState(null);
  const [showPopup, setShowPopup] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [resolveNotice, setResolveNotice] = useState(null);
  const [isResolved, setIsResolved] = useState(false);

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
          // Cache messages for this ticket
          if (selected?.id) {
            messagesCacheRef.current.set(selected.id, mapped);
          }
          requestAnimationFrame(scrollToBottom);
        }
        setError(null);
      } catch (err) {
        const isCanceled =
          err?.name === "AbortError" ||
          err?.name === "CanceledError" ||
          err?.code === "ERR_CANCELED" ||
          err?.message === "canceled";
        if (isCanceled) return;
        console.error("Failed to load chats:", err);
        setError(err.message || "Failed to load chats");
      } finally {
        if (showLoading) setLoading(false);
      }
    },
    [selected?.id, token]
  );

  // Store messages per ticket to prevent reloading
  const messagesCacheRef = useRef(new Map());

  useEffect(() => {
    if (!selected?.id) {
      setMessages([]);
      return;
    }

    // Restore cached messages if available
    const cached = messagesCacheRef.current.get(selected.id);
    if (cached) {
      setMessages(cached);
      digestRef.current = digestMessages(cached);
    } else {
      digestRef.current = "";
    }
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

  useEffect(() => {
    const s = String(selected?.status || "").toLowerCase();
    const p = String(selected?.progress || "").toLowerCase();
    const d = String(selected?.statusDisplay || "").toLowerCase();
    setEscalated(
      s === "escalated" ||
        p === "escalated" ||
        d === "escalated" ||
        selected?.raw?.escalated === true
    );
    setEscalationNotice(null);
    setShowPopup(false);

    // Determine if ticket is resolved based on status boolean or string
    const statusBool =
      typeof selected?.status === "boolean" ? selected.status : undefined;
    const statusStr =
      typeof selected?.status === "string"
        ? String(selected.status).toLowerCase()
        : "";

    // Ticket is resolved if status is true (boolean), "resolved", "Resolved", or "true"
    const resolved =
      statusBool === true ||
      statusStr === "resolved" ||
      statusStr === "true" ||
      p === "resolved" ||
      d === "resolved";

    setIsResolved(resolved);
  }, [
    selected?.id,
    selected?.status,
    selected?.progress,
    selected?.statusDisplay,
    selected?.raw?.escalated,
  ]);

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
    setMessages((prev) => {
      const updatedMessages = [...prev, pendingMsg];
      // Update cache
      if (ticket_id) {
        messagesCacheRef.current.set(ticket_id, updatedMessages);
      }
      return updatedMessages;
    });
    setMsgText("");
    setSending(true);

    try {
      await postTicketMessage({
        ticketId: ticket_id,
        message: text,
        appUserId: appUserId ?? "",
        token,
      });
      setMessages((prev) => {
        const sentMessages = prev.map((m) =>
          m.id === tempId ? { ...m, status: "sent" } : m
        );
        // Update cache
        if (ticket_id) {
          messagesCacheRef.current.set(ticket_id, sentMessages);
        }
        return sentMessages;
      });
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
      setMessages((prev) => {
        const failedMessages = prev.map((m) =>
          m.id === tempId ? { ...m, status: "failed" } : m
        );
        // Update cache
        if (ticket_id) {
          messagesCacheRef.current.set(ticket_id, failedMessages);
        }
        return failedMessages;
      });
    } finally {
      setSending(false);
    }
  }

  async function retryMessage(msg) {
    if (!msg || msg.status !== "failed") return;
    setMessages((prev) => {
      const pendingMessages = prev.map((m) =>
        m.id === msg.id ? { ...m, status: "pending" } : m
      );
      // Update cache
      if (selected?.id) {
        messagesCacheRef.current.set(selected.id, pendingMessages);
      }
      return pendingMessages;
    });
    setError(null);
    setServerResponseSnippet(null);

    try {
      await postTicketMessage({
        ticketId: selected.id,
        message: msg.text,
        appUserId: appUserId ?? "",
        token,
      });
      setMessages((prev) => {
        const retrySentMessages = prev.map((m) =>
          m.id === msg.id ? { ...m, status: "sent", role: CURRENT_ROLE } : m
        );
        // Update cache
        if (selected?.id) {
          messagesCacheRef.current.set(selected.id, retrySentMessages);
        }
        return retrySentMessages;
      });
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
      setMessages((prev) => {
        const retryFailedMessages = prev.map((m) =>
          m.id === msg.id ? { ...m, status: "failed" } : m
        );
        // Update cache
        if (selected?.id) {
          messagesCacheRef.current.set(selected.id, retryFailedMessages);
        }
        return retryFailedMessages;
      });
    }
  }

  return (
    <motion.div
      layout
      className="lg:col-span-1 bg-white rounded shadow p-3 sm:p-4 flex flex-col h-[500px] sm:h-auto lg:h-auto"
    >
      <div className="mb-2 sm:mb-3">
        <h3 className="text-sm sm:text-base font-medium text-slate-800">
          Conversation
        </h3>
        <p className="text-[10px] sm:text-xs text-slate-500">
          Selected ticket chat & replies
        </p>
      </div>

      {!selected ? (
        <div className="p-4 sm:p-6 text-xs sm:text-sm text-slate-500 text-center">
          No ticket selected. Select a ticket from the list.
        </div>
      ) : (
        <>
          <motion.div
            layout
            className="border border-slate-300 rounded p-2 sm:p-3 mb-3 sm:mb-4"
          >
            <div className="text-xs sm:text-sm font-semibold text-slate-800 mb-1 sm:mb-2 uppercase truncate">
              {selected.subject ||
                selected.category ||
                selected.categoryTitle ||
                "No Subject"}
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-[10px] sm:text-xs">
              {escalated && !isResolved && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                  <svg
                    className="w-3 h-3"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    aria-hidden
                  >
                    <path
                      fillRule="evenodd"
                      d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Escalated
                </span>
              )}
            </div>
            <div className="text-[10px] sm:text-xs text-slate-400 mt-1 flex items-center gap-2 sm:gap-3 flex-wrap">
              <span>
                Ticket ID:{" "}
                <span className="text-xs text-green-600">{selected.id}</span>
              </span>
              <button
                onClick={async (e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (!selected?.id || escalating) return;

                  setEscalateError(null);
                  setEscalating(true);

                  try {
                    await api.post("/tickets/escalate-ticket/", {
                      ticket_id: selected.id,
                      agent_id: appUserId ?? null,
                    });

                    // Update state immediately
                    setEscalated(true);
                    setEscalationNotice("Ticket escalated successfully.");

                    // Use requestAnimationFrame to ensure state is updated before showing popup
                    requestAnimationFrame(() => {
                      setShowPopup(true);
                      // Auto-hide after 5 seconds
                      setTimeout(() => {
                        setShowPopup(false);
                      }, 5000);
                    });

                    try {
                      if (typeof onEscalated === "function") {
                        onEscalated(selected.id);
                      }
                    } catch (e) {}
                  } catch (e) {
                    setEscalateError(e?.message ?? "Failed to escalate ticket");
                    setEscalated(false);
                  } finally {
                    setEscalating(false);
                  }
                }}
                disabled={escalating || escalated || isResolved}
                className={`text-xs px-2 py-1 rounded border transition-colors ${
                  escalated
                    ? "border-purple-300 bg-purple-50 text-purple-700 cursor-not-allowed"
                    : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                } ${escalating ? "opacity-50 cursor-not-allowed" : ""}`}
                aria-label="Escalate ticket"
              >
                {escalating
                  ? "Escalating…"
                  : escalated
                  ? "Escalated"
                  : "Escalate"}
              </button>
              {!isResolved && (
                <button
                  onClick={async (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (!selected?.id || resolving || isResolved) return;

                    setResolving(true);
                    setResolveNotice(null);

                    try {
                      await api.post("/set-ticket-status/", {
                        ticket_id: selected.id,
                        status: "Resolved",
                      });

                      setIsResolved(true);
                      setEscalated(false);
                      setResolveNotice("Ticket resolved successfully.");

                      requestAnimationFrame(() => {
                        setShowPopup(true);
                        setTimeout(() => {
                          setShowPopup(false);
                        }, 5000);
                      });

                      try {
                        if (typeof onEscalated === "function") {
                          onEscalated(selected.id);
                        }
                      } catch (e) {}
                    } catch (err) {
                      setResolveNotice(null);
                      console.error("Failed to resolve ticket:", err);
                    } finally {
                      setResolving(false);
                    }
                  }}
                  disabled={resolving || isResolved}
                  className={`text-xs px-2 py-1 rounded border transition-colors ${
                    isResolved
                      ? "border-emerald-300 bg-emerald-50 text-emerald-700 cursor-not-allowed"
                      : "border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                  } ${resolving ? "opacity-50 cursor-not-allowed" : ""}`}
                  aria-label="Resolve ticket"
                >
                  {resolving
                    ? "Resolving…"
                    : isResolved
                    ? "Resolved"
                    : "Resolve"}
                </button>
              )}
            </div>
            {/* <div className="text-xs text-slate-400">
              Priority:{" "}
              <span className="inline-block ml-2 text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded">
                Low
              </span>
            </div> */}
          </motion.div>

          {/* Popup Toast for escalation/resolve success */}
          <AnimatePresence>
            {showPopup && (escalationNotice || resolveNotice) && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.18 }}
                className="pointer-events-auto fixed right-4 top-6 z-50 w-full max-w-sm sm:max-w-md rounded shadow-lg mx-4 sm:mx-0"
                role="status"
                aria-live="polite"
              >
                <div className="flex items-start gap-3 p-3 rounded bg-white border border-slate-200">
                  <div className="shrink-0">
                    <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-green-50 text-green-600 border border-green-100">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="w-5 h-5"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        aria-hidden
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 10-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900">
                      Success
                    </p>
                    <p className="text-sm text-slate-600">
                      {escalationNotice || resolveNotice}
                    </p>
                  </div>
                  <div className="flex items-start ml-3">
                    <button
                      onClick={() => setShowPopup(false)}
                      aria-label="Close"
                      className="inline-flex p-1 rounded text-slate-400 hover:text-slate-600"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="w-4 h-4"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        aria-hidden
                      >
                        <path
                          fillRule="evenodd"
                          d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div
            ref={containerRef}
            className="flex-1 overflow-y-auto mb-3 sm:mb-4 space-y-1 p-2 sm:p-4 bg-slate-50 rounded-lg border border-slate-200"
            style={{ maxHeight: "400px", minHeight: "300px" }}
          >
            {/* <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-blue-600 text-white rounded-lg p-3 text-sm shadow-sm"
            >
              Support — Welcome to HelpDesk! Your ticket is being routed, an
              agent will join shortly.
            </motion.div> */}

            <AnimatePresence initial={false}>
              {loading ? (
                <motion.div
                  key="loading"
                  className="flex items-center justify-center p-6"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <div className="w-4 h-4 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
                    <span>Loading messages…</span>
                  </div>
                </motion.div>
              ) : null}

              {messages.map((m, idx) => {
                const isSender = m.role === "agent" || m.role === CURRENT_ROLE;
                const prevMessage = idx > 0 ? messages[idx - 1] : null;
                const isSameSender =
                  prevMessage &&
                  ((isSender &&
                    (prevMessage.role === "agent" ||
                      prevMessage.role === CURRENT_ROLE)) ||
                    (!isSender &&
                      prevMessage.role !== "agent" &&
                      prevMessage.role !== CURRENT_ROLE));
                return (
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
                    className={`flex ${
                      isSender ? "justify-end" : "justify-start"
                    } ${isSameSender ? "mt-0.5" : "mt-2"}`}
                  >
                    <div
                      className={`p-3 rounded-lg max-w-[75%] shadow-sm ${
                        isSender
                          ? "bg-blue-600 text-white rounded-tr-none"
                          : "bg-gray-200 text-gray-800 rounded-tl-none"
                      }`}
                    >
                      <div className="text-sm whitespace-pre-wrap wrap-break-word">
                        {m.text}
                      </div>
                      <div
                        className={`text-xs mt-1.5 flex items-center gap-2 ${
                          isSender ? "text-blue-100" : "text-gray-600"
                        }`}
                      >
                        <span>{format(new Date(m.at), "h:mm a")}</span>
                        {m.status === "pending" && (
                          <span className="text-xs text-amber-600">
                            • Sending…
                          </span>
                        )}
                        {m.status === "failed" && (
                          <>
                            <span className="text-xs text-red-600">
                              • Failed
                            </span>
                            <button
                              onClick={() => retryMessage(m)}
                              className="ml-2 text-xs underline hover:opacity-80"
                            >
                              Retry
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {messages.length === 0 && !loading && (
              <div className="text-sm text-slate-400 text-center py-8">
                No messages yet.
              </div>
            )}
          </div>

          <form onSubmit={sendMessage} className="flex gap-2 items-center mt-2">
            <input
              className="flex-1 border border-slate-200 px-2 sm:px-3 py-1.5 sm:py-2 rounded text-sm active:shadow-sm"
              placeholder="Type a message..."
              value={msgText}
              onChange={(e) => setMsgText(e.target.value)}
              disabled={sending}
            />
            <motion.button
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={sending}
              className="bg-blue-600 text-white px-2 sm:px-3 py-1.5 sm:py-2 rounded text-xs sm:text-sm font-medium whitespace-nowrap"
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
