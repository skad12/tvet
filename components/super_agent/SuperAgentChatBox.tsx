
"use client";

import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useUsersDirectory } from "@/hooks/useUsersDirectory";
import { GoAlertFill } from "react-icons/go";
import api from "@/lib/axios";
import AssignAgentModal from "./AssignAgentModal";
import {
  DEFAULT_CHAT_POLL_MS,
  digestMessages,
  fetchTicketChats,
  normalizeChatEntries,
  postAgentTicketMessage,
} from "@/lib/chatClient";
import { toast } from "sonner";
import { landing } from "@/components/ui/landingStyles";

function getUserId(user) {
  return (
    user?.app_user_id ??
    user?.appUserId ??
    user?.user_id ??
    user?.userId ??
    user?.id ??
    user?.uid ??
    user?.pk ??
    null
  );
}

function normalizeIdentity(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase();
}

function isAgentAccount(user) {
  const accountType = normalizeIdentity(
    user?.account_type ?? user?.accountType ?? user?.role
  );
  return accountType === "agent" || accountType === "agents";
}

type SuperAgentChatBoxProps = {
  selected?: any;
  userEmail?: string;
  onResolved?: (ticketId: any) => void;
};

export default function SuperAgentChatBox({
  selected,
  userEmail: propUserEmail,
  onResolved,
}: SuperAgentChatBoxProps) {
  const { token, user } = useAuth();
  const userEmail = propUserEmail ?? user?.email ?? user?.username ?? "me";
  const { users: usersDirectory = [] } = useUsersDirectory({ enabled: true });

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
  const [resolving, setResolving] = useState(false);
  const [resolveNotice, setResolveNotice] = useState(null);
  const [showPopup, setShowPopup] = useState(false);
  const [isResolved, setIsResolved] = useState(false);

  // --- New states for assign-agent modal ---
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignNotice, setAssignNotice] = useState(null);
  const [localAssignedAgent, setLocalAssignedAgent] = useState(null);
  const [localAssignedName, setLocalAssignedName] = useState(
    selected?.assigned_to_name ?? null
  );

  useEffect(() => {
    setLocalAssignedName(selected?.assigned_to_name ?? null);
    setLocalAssignedAgent(null);
  }, [selected?.id, selected?.assigned_to_name]);

  const containerRef = useRef(null);

  function scrollToBottom() {
    try {
      const el = containerRef.current;
      if (!el) return;
      el.scrollTop = el.scrollHeight;
    } catch (e) {}
  }

  // helper to display assigned name
  function displayAssigned(name) {
    if (name === null || name === undefined) return "Unassigned";
    const s = String(name).trim();
    if (!s) return "Unassigned";
    if (s.toLowerCase() === "null") return "Unassigned";
    return s;
  }

  const digestRef = useRef("");
  const pollTimerRef = useRef(null);
  const controllerRef = useRef(null);
  const CURRENT_ROLE = "agent";

  function getAgentName(agent) {
    return agent?.name ?? agent?.username ?? agent?.email ?? "Agent";
  }

  function getAssignableAgents() {
    return usersDirectory
      .filter((candidate) => isAgentAccount(candidate) && getUserId(candidate))
      .sort((a, b) => {
        const aAvailable = normalizeIdentity(a?.user_status) === "available";
        const bAvailable = normalizeIdentity(b?.user_status) === "available";
        if (aAvailable === bAvailable) return 0;
        return aAvailable ? -1 : 1;
      });
  }

  async function resolveAgentMessageSender() {
    if (localAssignedAgent && isAgentAccount(localAssignedAgent)) {
      return localAssignedAgent;
    }

    const assignedRaw =
      selected?.assigned_to ??
      selected?.assigned_to_id ??
      selected?.agent_id ??
      selected?.agentId ??
      selected?.raw?.assigned_to ??
      selected?.raw?.assigned_to_id ??
      selected?.raw?.agent_id ??
      selected?.raw?.agentId ??
      null;

    const assignedId =
      typeof assignedRaw === "object" ? getUserId(assignedRaw) : assignedRaw;

    if (assignedId) {
      const assigned = usersDirectory.find(
        (candidate) =>
          isAgentAccount(candidate) &&
          String(getUserId(candidate)) === String(assignedId)
      );
      if (assigned) return assigned;
    }

    if (!selected?.id) return null;

    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    for (const agent of getAssignableAgents()) {
      const agentId = getUserId(agent);
      try {
        await api.post(
          "/assign-ticket/to-user/",
          {
            ticket_id: selected.id,
            assigned_to_id: agentId,
          },
          { headers }
        );
        setLocalAssignedAgent(agent);
        setLocalAssignedName(getAgentName(agent));
        return agent;
      } catch (err) {
        console.warn("Auto-assign before send failed:", err);
      }
    }

    return null;
  }

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
        const message = err.message || "Failed to load chats";
        setError(message);
        if (showLoading) toast.error(message);
      } finally {
        if (showLoading) setLoading(false);
      }
    },
    [selected?.id, token]
  );

  const messagesCacheRef = useRef(new Map());

  useEffect(() => {
    if (!selected?.id) {
      setMessages([]);
      return;
    } 

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
    const ticketStatus =
      typeof selected?.ticket_status === "string"
        ? String(selected.ticket_status).toLowerCase()
        : "";
    const rawTicketStatus =
      typeof selected?.raw?.ticket_status === "string"
        ? String(selected.raw.ticket_status).toLowerCase()
        : "";

    const resolved =
      ticketStatus === "resolved" || rawTicketStatus === "resolved";

    setIsResolved(resolved);
  }, [selected?.id, selected?.ticket_status, selected?.raw?.ticket_status]);

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
      if (ticket_id) {
        messagesCacheRef.current.set(ticket_id, updatedMessages);
      }
      return updatedMessages;
    });
    setMsgText("");
    setSending(true);

    let messageAgent = null;
    try {
      messageAgent = await resolveAgentMessageSender();
    } catch (err) {
      console.error("Failed to resolve agent sender:", err);
      const message =
        err?.response?.data?.message ??
        err?.message ??
        "Could not prepare agent connection for this reply.";
      setError(message);
      toast.error(message);
      setMessages((prev) => {
        const failedMessages = prev.map((m) =>
          m.id === tempId ? { ...m, status: "failed" } : m
        );
        if (ticket_id) {
          messagesCacheRef.current.set(ticket_id, failedMessages);
        }
        return failedMessages;
      });
      setSending(false);
      return;
    }

    const senderAppUserId = getUserId(messageAgent);
    if (!senderAppUserId) {
      const message = "No available agent account to send this reply.";
      setError(message);
      toast.error(message);
      setMessages((prev) => {
        const failedMessages = prev.map((m) =>
          m.id === tempId ? { ...m, status: "failed" } : m
        );
        if (ticket_id) {
          messagesCacheRef.current.set(ticket_id, failedMessages);
        }
        return failedMessages;
      });
      setSending(false);
      return;
    }

    try {
      await postAgentTicketMessage({
        ticketId: ticket_id,
        message: text,
        appUserId: senderAppUserId,
        email: messageAgent?.email ?? userEmail,
        username: messageAgent?.username ?? user?.username,
        token,
      });
      setMessages((prev) => {
        const sentMessages = prev.map((m) =>
          m.id === tempId ? { ...m, status: "sent" } : m
        );
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
      const message =
        `Failed to send message. Server returned error (see console or "Show response").`;
      setError(message);
      toast.error(message);
      setMessages((prev) => {
        const failedMessages = prev.map((m) =>
          m.id === tempId ? { ...m, status: "failed" } : m
        );
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
      if (selected?.id) {
        messagesCacheRef.current.set(selected.id, pendingMessages);
      }
      return pendingMessages;
    });
    setError(null);
    setServerResponseSnippet(null);

    let messageAgent = null;
    try {
      messageAgent = await resolveAgentMessageSender();
    } catch (err) {
      console.error("Failed to resolve agent sender:", err);
      const message =
        err?.response?.data?.message ??
        err?.message ??
        "Could not prepare agent connection for this reply.";
      setError(message);
      toast.error(message);
      return;
    }

    const senderAppUserId = getUserId(messageAgent);
    if (!senderAppUserId) {
      const message = "No available agent account to send this reply.";
      setError(message);
      toast.error(message);
      return;
    }

    try {
      await postAgentTicketMessage({
        ticketId: selected.id,
        message: msg.text,
        appUserId: senderAppUserId,
        email: messageAgent?.email ?? userEmail,
        username: messageAgent?.username ?? user?.username,
        token,
      });
      setMessages((prev) => {
        const retrySentMessages = prev.map((m) =>
          m.id === msg.id ? { ...m, status: "sent", role: CURRENT_ROLE } : m
        );
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
      const message = "Retry failed. See server response.";
      setError(message);
      toast.error(message);
      setMessages((prev) => {
        const retryFailedMessages = prev.map((m) =>
          m.id === msg.id ? { ...m, status: "failed" } : m
        );
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
      className={landing.chatBox}
    >
      <div className="mb-2 flex items-start justify-between gap-3 sm:mb-3">
        <div>
          <p className={landing.eyebrow}>Escalated queue</p>
          <h3 className={landing.sectionTitle}>Escalated Ticket Conversation</h3>
          <p className={landing.sectionDesc}>Resolve escalated tickets</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAssignModal(true)}
            disabled={!selected?.id}
            className={`${landing.btnGhost} ${
              !selected?.id ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            Assign agent
          </button>
        </div>
      </div>

      {!selected ? (
        <div className="p-4 sm:p-6 text-xs sm:text-sm text-muted text-center">
          No escalated ticket selected. Select a ticket from the list.
        </div>
      ) : (
        <>
          <motion.div
            layout
            className={landing.ticketHeader}
          >
            <div className="text-xs sm:text-sm font-semibold text-foreground mb-1 sm:mb-2 uppercase truncate">
              {selected.subject ||
                selected.category ||
                selected.categoryTitle ||
                "No Subject"}
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-[10px] sm:text-xs">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-semibold bg-red-50 text-red-700 border border-red-200">
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
            </div>
            <div className="text-[10px] sm:text-xs text-muted mt-1 flex items-center gap-2 sm:gap-3 flex-wrap">
              <span>
                Ticket ID:{" "}
                <span className="text-xs text-green-600">{selected.id}</span>
              </span>

              <span>
                Assigned to:{" "}
                <span className="text-xs text-foreground">
                  {displayAssigned(localAssignedName)}
                </span>
              </span>

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
                      setResolveNotice("Ticket resolved successfully.");
                      toast.success("Ticket resolved successfully");

                      requestAnimationFrame(() => {
                        setShowPopup(true);
                        setTimeout(() => {
                          setShowPopup(false);
                        }, 5000);
                      });

                      try {
                        if (typeof onResolved === "function") {
                          onResolved(selected.id);
                        }
                      } catch (e) {}
                    } catch (err) {
                      setResolveNotice(null);
                      console.error("Failed to resolve ticket:", err);
                      toast.error("Failed to resolve ticket");
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
                  {resolving ? "Resolving…" : isResolved ? "Resolved" : "Resolve"}
                </button>
              )}
            </div>
          </motion.div>

          <AnimatePresence>
            {showPopup && resolveNotice && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.18 }}
                className="pointer-events-auto fixed right-4 top-6 z-50 w-full max-w-sm sm:max-w-md rounded shadow-lg mx-4 sm:mx-0"
                role="status"
                aria-live="polite"
              >
                <div className={`${landing.toast} flex items-start gap-3`}>
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
                    <p className="text-sm font-medium text-foreground">
                      Success
                    </p>
                    <p className="text-sm text-muted">{resolveNotice}</p>
                  </div>
                  <div className="flex items-start ml-3">
                    <button
                      onClick={() => setShowPopup(false)}
                      aria-label="Close"
                      className="inline-flex p-1 rounded text-muted hover:text-muted"
                    >
                      <GoAlertFill />
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Assign Agent Modal */}
          <AssignAgentModal
            show={showAssignModal}
            onClose={() => setShowAssignModal(false)}
            ticketId={selected?.id}
            token={token}
            onAssigned={(agent) => {
              const name =
                agent?.name ?? agent?.username ?? agent?.email ?? "Agent";
              setLocalAssignedName(name);
              setAssignNotice(`Assigned to ${name} successfully.`);
              setShowAssignModal(false);

              requestAnimationFrame(() => {
                setShowPopup(true);
                setResolveNotice(`Assigned to ${name}`);
                setTimeout(() => setShowPopup(false), 4500);
              });
            }}
          />

          <div
            ref={containerRef}
            className={`${landing.messageArea} mb-3 sm:mb-4`}
            style={{ paddingBottom: "env(safe-area-inset-bottom, 12px)" }}
          >
            <AnimatePresence initial={false}>
              {loading ? (
                <motion.div
                  key="loading"
                  className="flex items-center justify-center p-6"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <div className="flex items-center gap-2 text-sm text-muted">
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
                          : "bg-surface-muted text-foreground rounded-tl-none"
                      }`}
                    >
                      <div className="text-sm whitespace-pre-wrap wrap-break-word">
                        {m.text}
                      </div>
                      <div
                        className={`text-xs mt-1.5 flex items-center gap-2 ${
                          isSender ? "text-blue-100" : "text-muted"
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
              <div className="text-sm text-muted text-center py-8">
                No messages yet.
              </div>
            )}
          </div>

          <form onSubmit={sendMessage} className="mt-2 flex shrink-0 items-center gap-2" style={{ paddingBottom: "env(safe-area-inset-bottom, 8px)" }}>
            <input
              className={`${landing.input} flex-1`}
              placeholder="Type a message..."
              value={msgText}
              onChange={(e) => setMsgText(e.target.value)}
              disabled={sending}
            />
            <motion.button
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={sending}
              className={`${landing.btnPrimary} whitespace-nowrap px-3 sm:px-4`}
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
                <pre className="mt-2 p-2 bg-surface-muted rounded overflow-auto text-xs max-h-40">
                  {serverResponseSnippet}
                </pre>
              )}
            </div>
          )}

          {assignNotice && (
            <div className="mt-2 text-sm text-green-700">{assignNotice}</div>
          )}
        </>
      )}
    </motion.div>
  );
}
