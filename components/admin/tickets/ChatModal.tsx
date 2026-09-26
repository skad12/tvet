"use client";

import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiX, FiPaperclip, FiSmile, FiSend, FiUserPlus } from "react-icons/fi";
import { useAuth } from "@/context/AuthContext";
import { useUsersDirectory } from "@/hooks/useUsersDirectory";
import api from "@/lib/axios";
import {
  DEFAULT_CHAT_POLL_MS,
  digestMessages,
  fetchTicketChats,
  normalizeChatEntries,
  postTicketMessage,
} from "@/lib/chatClient";
import { format, isValid } from "date-fns";
import { toast } from "sonner";
import { landing } from "@/components/ui/landingStyles";
import { formatMessageTime } from "@/lib/formatMessageTime";
import { readCache, writeCache, cacheKeys } from "@/lib/offlineCache";

function normalizeAgentName(agent) {
  if (agent === null || agent === undefined) return null;
  if (typeof agent === "string") {
    const v = agent.trim();
    if (
      v === "" ||
      v.toLowerCase() === "null" ||
      v.toLowerCase() === "unassigned"
    )
      return null;
    return v;
  }
  return String(agent);
}

function normalizeStatusValue(statusVal) {
  if (statusVal === null || statusVal === undefined) return "active";
  const raw = String(statusVal).toLowerCase().trim();
  if (raw === "resolved" || raw === "closed" || raw === "completed")
    return "resolved";
  if (raw === "pending" || raw === "waiting" || raw === "in_progress")
    return "pending";
  if (raw === "active" || raw === "open" || raw === "new") return "active";
  return raw;
}

function coerceUsersArray(payload) {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload.results)) return payload.results;
  if (Array.isArray(payload.data)) return payload.data;
  if (Array.isArray(payload.users)) return payload.users;
  return [];
}

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

function getAgentDisplayName(agent) {
  return agent?.name ?? agent?.username ?? agent?.email ?? "Agent";
}

function isAssignableAgent(agent) {
  const accountType = String(
    agent?.account_type ?? agent?.accountType ?? agent?.role ?? ""
  )
    .trim()
    .toLowerCase();
  return accountType === "agent" || accountType === "agents";
}

// Format date safely; prefer server's created_at_display if given
function formatMaybeDate(val: any, display?: any) {
  if (display) return display;
  if (!val) return "—";
  const dt = new Date(val);
  if (isValid(dt)) return format(dt, "PPpp");
  try {
    return String(val).slice(0, 32);
  } catch {
    return "—";
  }
}

type ChatModalProps = {
  ticket?: any;
  open?: boolean;
  onClose?: () => void;
  onOpenUser?: (ticket: any) => void;
  onMessageAdded?: (message: any, ticket: any) => void;
};

export default function ChatModal({
  ticket = {},
  open = false,
  onClose = () => {},
  onOpenUser = () => {},
  onMessageAdded,
}: ChatModalProps) {
  const { token, user } = useAuth?.() ?? {};
  const currentUserId =
    user?.app_user_id ??
    user?.appUserId ??
    user?.user_id ??
    user?.userId ??
    user?.id ??
    user?.uid ??
    user?.pk ??
    null;
  const currentUserEmail = user?.email ?? user?.username ?? "";

  const CURRENT_ROLE = "agent";
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showAssignMenu, setShowAssignMenu] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState("");
  const { users: agents = [] } = useUsersDirectory({ enabled: true });
  const [availableAgents, setAvailableAgents] = useState([]);
  const [loadingAvailableAgents, setLoadingAvailableAgents] = useState(false);

  // resolve / popup / escalate states
  const [resolving, setResolving] = useState(false);
  const [resolveNotice, setResolveNotice] = useState(null);
  const [escalating, setEscalating] = useState(false);
  const [escalationNotice, setEscalationNotice] = useState(null);
  const [showPopup, setShowPopup] = useState(false);
  const [isResolved, setIsResolved] = useState(false);
  const [escalated, setEscalated] = useState(false);

  const digestRef = useRef("");
  const controllerRef = useRef(null);
  const pollRef = useRef(null);

  const ticketId = ticket?.id ?? null;

  // derive ticket status_label and normalized status
  const { status_label, status } = useMemo(() => {
    const statusRaw =
      ticket?.ticket_status ?? ticket?.status ?? ticket?.state ?? null;
    const label =
      statusRaw === null || statusRaw === undefined
        ? "Active"
        : String(statusRaw);
    const norm = normalizeStatusValue(label);
    return { status_label: label, status: norm };
  }, [ticket]);

  // set resolved & escalated state when ticket changes (ticket_status is source of truth for resolved)
  useEffect(() => {
    const ticketStatus =
      typeof ticket?.ticket_status === "string"
        ? String(ticket.ticket_status).toLowerCase()
        : "";
    const rawTicketStatus =
      typeof ticket?.raw?.ticket_status === "string"
        ? String(ticket.raw.ticket_status).toLowerCase()
        : "";
    const resolved =
      ticketStatus === "resolved" || rawTicketStatus === "resolved";
    setIsResolved(resolved);

    // escalated from explicit ticket field or raw
    const escFlag =
      Boolean(ticket?.escalated) || Boolean(ticket?.raw?.escalated) || false;
    // also consider textual flags if present
    const s = String(
      ticket?.status || ticket?.progress || ticket?.statusDisplay || ""
    ).toLowerCase();
    const isTextEscalated = s === "escalated";
    setEscalated(escFlag || isTextEscalated);
  }, [
    ticket?.ticket_status,
    ticket?.raw?.ticket_status,
    ticket?.escalated,
    ticket?.raw?.escalated,
    ticket?.status,
    ticket?.progress,
    ticket?.statusDisplay,
    ticket?.id,
  ]);

  // assigned agent resolution (by id or name). treat "null"/""/"unassigned" as no agent
  const assignedAgentId =
    ticket?.assigned_to_id ??
    ticket?.assigned_to ??
    ticket?.raw?.assigned_to_id ??
    ticket?.raw?.assigned_to ??
    null;

  const assignedAgentName = normalizeAgentName(
    ticket?.assigned_to_name ??
      ticket?.raw?.assigned_to_name ??
      ticket?.assigned_to_name
  );

  // try find agent by id first, then by matching name/email/username
  const assignedAgent = useMemo(() => {
    if (!agents || agents.length === 0) {
      if (assignedAgentName) {
        return {
          id: null,
          name: assignedAgentName,
          username: assignedAgentName,
        };
      }
      return null;
    }

    if (assignedAgentId) {
      const found = agents.find(
        (a) => String(a.id) === String(assignedAgentId)
      );
      if (found) return found;
    }

    if (assignedAgentName) {
      const lower = assignedAgentName.toLowerCase();
      const found = agents.find(
        (a) =>
          (a.name && a.name.toLowerCase() === lower) ||
          (a.username && a.username.toLowerCase() === lower) ||
          (a.email && a.email.toLowerCase() === lower)
      );
      if (found) return found;
      return { id: null, name: assignedAgentName, username: assignedAgentName };
    }

    return null;
  }, [agents, assignedAgentId, assignedAgentName]);

  // initialize messages when ticket changes
  useEffect(() => {
    if (ticket && Array.isArray(ticket.messages)) {
      const fallback = normalizeChatEntries(ticket.messages, { ticketId });
      setMessages(fallback);
    } else {
      setMessages([]);
    }
    setText("");
    setError(null);
  }, [ticket, ticketId]);

  const handleKeyDown = useCallback(
    (e) => {
      if (e?.key === "Escape") {
        try {
          controllerRef.current?.abort();
          onClose?.();
        } catch (err) {}
      }
    },
    [onClose]
  );

  useEffect(() => {
    if (!open) return;
    if (typeof window === "undefined") return;

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, handleKeyDown]);

  useEffect(() => {
    if (!showAssignMenu) return;
    const handleClickOutside = (e) => {
      if (!e.target.closest(".assign-menu-container")) {
        setShowAssignMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showAssignMenu]);

  useEffect(() => {
    if (!showAssignMenu) return;

    let mounted = true;
    const controller = new AbortController();

    async function loadAvailableAgents() {
      setLoadingAvailableAgents(true);
      try {
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const res = await api.get("/get-all-users-available/", {
          headers,
          signal: controller.signal,
        });
        if (!mounted) return;
        setAvailableAgents(
          coerceUsersArray(res?.data).filter(isAssignableAgent)
        );
      } catch (err) {
        const isCanceled =
          err?.name === "AbortError" ||
          err?.name === "CanceledError" ||
          err?.code === "ERR_CANCELED" ||
          err?.message === "canceled";
        if (isCanceled) return;
        console.error("Failed to load available agents:", err);
        if (mounted) {
          setAvailableAgents([]);
          const message = "Failed to load available agents";
          setError(message);
          toast.error(message);
        }
      } finally {
        if (mounted) setLoadingAvailableAgents(false);
      }
    }

    loadAvailableAgents();

    return () => {
      mounted = false;
      controller.abort();
    };
  }, [showAssignMenu, token]);

  useEffect(() => {
    if (!open || !ticketId) {
      return () => {};
    }

    let mounted = true;

    const loadChats = async (initial = false) => {
      if (!ticketId) return;
      controllerRef.current?.abort();
      controllerRef.current = new AbortController();

      try {
        if (initial) setLoading(true);
        const data = await fetchTicketChats(ticketId, {
          token,
          signal: controllerRef.current.signal,
        });
        if (!mounted) return;
        const mapped = normalizeChatEntries(data, { ticketId });
        const digest = digestMessages(mapped);
        if (digest !== digestRef.current) {
          digestRef.current = digest;
          setMessages(mapped);
        }
        // Keep the conversation so it still renders if the server drops out.
        writeCache(cacheKeys.ticketChats(ticketId), mapped);
        setError(null);
      } catch (err) {
        const isCanceled =
          err?.name === "AbortError" ||
          err?.name === "CanceledError" ||
          err?.code === "ERR_CANCELED" ||
          err?.message === "canceled";
        if (isCanceled) return;
        console.error("Failed to load chats:", err);
        const message = err.message || "Failed to load messages";

        // Show the last copy of this conversation rather than an error, and
        // stay silent about it if something is already on screen — the poller
        // will pick the live version back up on its own.
        const cached = readCache(cacheKeys.ticketChats(ticketId));
        const cachedMessages = Array.isArray(cached?.value) ? cached.value : [];

        if (cachedMessages.length) {
          setMessages((prev) => (prev.length ? prev : cachedMessages));
          setError(null);
        } else {
          setError(message);
          if (initial) toast.error(message);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadChats(true);
    pollRef.current = setInterval(() => loadChats(false), DEFAULT_CHAT_POLL_MS);

    return () => {
      mounted = false;
      controllerRef.current?.abort();
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [open, ticketId, token]);

  const handleSend = async (e) => {
    try {
      e?.preventDefault?.();
    } catch (err) {
      /* ignore */
    }

    const body = String(text || "").trim();
    if (!body || !ticketId) return;

    setSending(true);
    setError(null);

    const optimisticMsg = {
      id: `local-${Date.now()}`,
      text: body,
      at: new Date().toISOString(),
      role: CURRENT_ROLE,
      status: "pending",
    };
    setMessages((prev) => [...prev, optimisticMsg]);

    try {
      await postTicketMessage({
        ticketId,
        message: body,
        appUserId: currentUserId ?? "",
        email: currentUserEmail,
        username: user?.username,
        token,
        fromTicket: ticket?.from_ticket ?? ticket?.raw?.from_ticket ?? false,
      });
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === optimisticMsg.id ? { ...msg, status: "sent" } : msg
        )
      );
      digestRef.current = "";
      if (typeof onMessageAdded === "function") {
        onMessageAdded(
          { ...optimisticMsg, status: "sent", role: CURRENT_ROLE },
          ticket
        );
      }
      setText("");
    } catch (err) {
      console.error("Failed to send message:", err);
      const message = err.message || "Failed to send message";
      setError(message);
      toast.error(message);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === optimisticMsg.id ? { ...msg, status: "failed" } : msg
        )
      );
    } finally {
      setSending(false);
    }
  };

  const safeClose = useCallback(() => {
    try {
      controllerRef.current?.abort();
      setShowAssignMenu(false);
      onClose?.();
    } catch (err) {}
  }, [onClose]);

  // Resolve handler
  const handleResolve = async (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (!ticketId || resolving || isResolved) return;

    setResolving(true);
    setResolveNotice(null);

    try {
      await api.post("/set-ticket-status/", {
        ticket_id: ticketId,
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

      // notify parent to refresh
      try {
        if (typeof onMessageAdded === "function") {
          onMessageAdded({}, ticket);
        }
      } catch (e) {}

      setNotificationMessage("Ticket resolved");
      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 3000);
    } catch (err) {
      console.error("Failed to resolve ticket:", err);
      setResolveNotice("Failed to resolve ticket");
      toast.error("Failed to resolve ticket");
    } finally {
      setResolving(false);
    }
  };

  // Escalate handler (added)
  const handleEscalate = async (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (!ticketId || escalating || escalated || isResolved) return;

    setEscalating(true);
    setEscalationNotice(null);

    try {
      await api.post("/tickets/escalate-ticket/", {
        ticket_id: ticketId,
        agent_id: currentUserId ?? null,
      });

      setEscalated(true);
      setEscalationNotice("Ticket escalated successfully.");
      toast.success("Ticket escalated successfully");

      requestAnimationFrame(() => {
        setShowPopup(true);
        setTimeout(() => {
          setShowPopup(false);
        }, 5000);
      });

      // notify parent to refresh
      try {
        if (typeof onMessageAdded === "function") {
          onMessageAdded({}, ticket);
        }
      } catch (e) {}

      setNotificationMessage("Ticket escalated");
      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 3000);
    } catch (err) {
      console.error("Failed to escalate ticket:", err);
      setEscalationNotice(err?.message ?? "Failed to escalate ticket");
      toast.error(err?.message ?? "Failed to escalate ticket");
      setEscalated(false);
    } finally {
      setEscalating(false);
    }
  };

  // compute time here (inside component so ticket is defined)
  const time = ticket?.created_at ?? ticket?.raw?.created_at ?? "";

  // Ticket.name carries different things depending on where the ticket came
  // from. The widget stores the person's name in it; the ticket form stores the
  // chosen category's title (see api.views.create_ticket), and older widget
  // rows are literally called "From Widget". Only the first is a person, so the
  // others are not shown under a "Name" label — and the category the form put
  // in `subject` is surfaced as the category it is.
  const submittedDetails = useMemo(() => {
    const raw = (ticket?.raw ?? {}) as Record<string, unknown>;
    const str = (v: unknown) =>
      typeof v === "string" && v.trim() ? v.trim() : null;

    const rawName = str(raw.name) ?? str(ticket?.name);
    const subject = str(raw.subject);
    const category = str(raw.category);

    // A ticket raised through the form sets from_ticket and copies the category
    // title into both name and subject, so a name equal to either is that title
    // rather than a person. "From Widget" is the old placeholder.
    const isFormTicket = raw.from_ticket === true;
    const nameIsCategory =
      Boolean(rawName) && (rawName === subject || rawName === category);
    const personName =
      rawName &&
      !isFormTicket &&
      !nameIsCategory &&
      rawName.toLowerCase() !== "from widget"
        ? rawName
        : null;

    return [
      ["Name", personName],
      ["Email", str(raw.email) ?? str(ticket?.email)],
      ["Phone", str(raw.phone)],
      ["Application / Reg. ID", str(raw.app_id)],
      ["Enquiry type", str(raw.role)],
      ["Category", category ?? subject],
    ] as const;
  }, [ticket]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key={`chat-modal-${ticket?.id ?? "no-ticket"}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className={`${landing.modalOverlay} flex items-center justify-center`}
          aria-modal="true"
          role="dialog"
        >
          {/* backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            onClick={safeClose}
            className={landing.modalBackdrop}
          />

          {/* modal container */}
          <motion.div
            initial={{ y: 20, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 8, opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.22 }}
            className={`${landing.modal} relative flex h-[85dvh] w-full max-w-6xl flex-col overflow-hidden p-0 lg:h-[80vh] lg:flex-row`}
          >
            {/* Left: conversation. Below lg the panes stack, so this one needs
                min-h-0 to shrink and keep the input on screen. */}
            <div className="flex-1 min-w-0 min-h-0 flex flex-col">
              <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3 sm:gap-4 sm:px-6 sm:py-4">
                {/* min-w-0 lets this side shrink; without it a long email has
                    nowhere to go and runs into the actions on the right. */}
                <div className="flex min-w-0 basis-full grow items-center gap-4 sm:basis-0">
                  <button
                    onClick={() => {
                      try {
                        onOpenUser?.(ticket);
                      } catch (err) {
                        console.warn("onOpenUser threw:", err);
                      }
                    }}
                    className="w-10 h-10 shrink-0 rounded-full bg-slate-100 flex items-center justify-center font-medium text-slate-700"
                    title="View user details"
                    aria-label="View user details"
                  >
                    {String(ticket?.email ?? ticket?.name ?? "U")
                      .slice(0, 2)
                      .toUpperCase()}
                  </button>

                  <div className="min-w-0">
                    <div
                      className="truncate font-medium text-slate-800"
                      title={String(ticket?.email ?? ticket?.name ?? "")}
                    >
                      {ticket?.email ?? ticket?.name ?? "Unknown"}
                    </div>
                    <div className="text-xs text-slate-500 flex flex-wrap items-center gap-2">
                      <span>{ticket?.categoryTitle ?? ""}</span>

                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          status === "resolved"
                            ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                            : status === "pending"
                            ? "bg-amber-100 text-amber-700 border border-amber-200"
                            : "bg-blue-100 text-blue-700 border border-blue-200"
                        }`}
                      >
                        {status_label}
                      </span>

                      {escalated && (
                        <span className="ml-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
                          Escalated
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 sm:shrink-0 sm:gap-3">
                  {assignedAgent && (
                    <button
                      onClick={() => setShowAssignMenu(!showAssignMenu)}
                      className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-xs font-medium hover:bg-slate-200 transition-colors"
                      aria-label="Change assigned agent"
                    >
                      <FiUserPlus className="w-4 h-4" />
                      <span>
                        {assignedAgent.name ||
                          assignedAgent.username ||
                          assignedAgent.email}
                      </span>
                    </button>
                  )}
                  <div className="relative assign-menu-container">
                    <button
                      onClick={() => setShowAssignMenu(!showAssignMenu)}
                      disabled={assigning || !ticketId}
                      className={`${landing.btnPrimary} flex items-center gap-2 px-3 py-1.5 text-xs disabled:cursor-not-allowed disabled:opacity-50`}
                      aria-label="Assign ticket"
                    >
                      <FiUserPlus className="w-4 h-4" />
                      {assigning ? "Assigning..." : "Assign"}
                    </button>
                    {showAssignMenu && (
                      <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-lg shadow-lg border border-slate-200 z-50 max-h-64 overflow-y-auto assign-menu-container">
                        <div className="p-2">
                          <div className="text-xs font-semibold text-slate-700 px-2 py-1 mb-1">
                            Select Agent
                          </div>
                          {loadingAvailableAgents ? (
                            <div className="text-xs text-slate-500 px-2 py-4 text-center">
                              Loading available agents...
                            </div>
                          ) : availableAgents.length === 0 ? (
                            <div className="text-xs text-slate-500 px-2 py-4 text-center">
                              No agents available
                            </div>
                          ) : (
                            availableAgents.map((agent) => {
                              const agentId = getUserId(agent);
                              const agentName = getAgentDisplayName(agent);
                              return (
                                <button
                                  key={agentId ?? agent.email ?? agentName}
                                  onClick={async () => {
                                    if (!agentId) {
                                      const message = "Selected agent has no user id";
                                      setError(message);
                                      toast.error(message);
                                      return;
                                    }
                                    setAssigning(true);
                                    try {
                                      await api.post(
                                        "/assign-ticket/to-user/",
                                        {
                                          ticket_id: ticketId,
                                          assigned_to_id: agentId,
                                        }
                                      );
                                      setShowAssignMenu(false);
                                      setNotificationMessage(
                                        `Ticket assigned to ${agentName}`
                                      );
                                      toast.success(`Ticket assigned to ${agentName}`);
                                      setShowNotification(true);
                                      setTimeout(() => {
                                        setShowNotification(false);
                                      }, 3000);
                                      if (onMessageAdded) {
                                        onMessageAdded({}, ticket);
                                      }
                                    } catch (err) {
                                      console.error(
                                        "Failed to assign ticket:",
                                        err
                                      );
                                      const message =
                                        err?.response?.data?.message ||
                                        "Failed to assign ticket";
                                      setError(message);
                                      toast.error(message);
                                    } finally {
                                      setAssigning(false);
                                    }
                                  }}
                                  className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50 rounded transition-colors"
                                >
                                  <div className="font-medium text-slate-800">
                                    {agentName}
                                  </div>
                                  <div className="text-xs text-slate-500">
                                    {agent.email}
                                  </div>
                                </button>
                              );
                            })
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Escalate button */}
                  <button
                    onClick={handleEscalate}
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

                  {/* Resolve button */}
                  {!isResolved && (
                    <button
                      onClick={handleResolve}
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

                  <span className="hidden bg-green-200 px-2 py-1 rounded-full text-xs text-slate-500 sm:inline">
                    AI Assisted
                  </span>
                  <button
                    type="button"
                    onClick={safeClose}
                    className="p-2 rounded hover:bg-slate-100"
                    aria-label="Close chat"
                  >
                    <FiX />
                  </button>
                </div>
              </header>

              {/* messages */}
              <div
                className={`${landing.messageArea} flex-1 p-3 sm:p-6`}
              >
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-blue-600 text-white rounded-lg p-3 text-sm shadow-sm"
                >
                  Support — Welcome to HelpDesk! Your ticket is being routed, an
                  agent will join shortly.
                </motion.div>

                {loading && (
                  <div className="flex items-center justify-center p-6">
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                      <div className="w-4 h-4 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
                      <span>Loading messages…</span>
                    </div>
                  </div>
                )}

                {messages.length === 0 && !loading && (
                  <div className="text-sm text-slate-400 text-center py-8">
                    No messages yet.
                  </div>
                )}

                {messages.map((m, idx) => {
                  const isSender =
                    m.role === "agent" || m.role === CURRENT_ROLE;
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
                      key={m.id ?? idx}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
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
                          <span>{formatMessageTime(m.at)}</span>
                          {m.status === "failed" && (
                            <span className="text-red-600">• Failed</span>
                          )}
                          {m.status === "pending" && (
                            <span className="text-amber-600">• Sending…</span>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* input */}
              <form
                onSubmit={handleSend}
                className="border-t border-border px-3 py-3 flex shrink-0 items-center gap-2 sm:px-4 sm:gap-3"
              >
                <button
                  type="button"
                  className="hidden p-2 rounded-md text-slate-500 hover:bg-slate-100 sm:block"
                  title="Attach file"
                >
                  <FiPaperclip />
                </button>

                <button
                  type="button"
                  className="hidden p-2 rounded-md text-slate-500 hover:bg-slate-100 sm:block"
                  title="Emoji"
                >
                  <FiSmile />
                </button>

                <input
                  className={`${landing.input} flex-1 rounded-full`}
                  placeholder="Type your message..."
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  aria-label="Message input"
                  disabled={sending}
                />

                <button
                  type="submit"
                  disabled={sending}
                  className={`${landing.btnPrimary} flex h-10 w-10 items-center justify-center rounded-full p-2`}
                  aria-label="Send message"
                >
                  {sending ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <FiSend />
                  )}
                </button>
              </form>

              {error && (
                <div className="px-6 pb-3 text-xs text-red-600">{error}</div>
              )}
            </div>

            {/* Notification Toast (bottom-right) */}
            <AnimatePresence>
              {showNotification && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  className="fixed bottom-4 right-4 bg-green-600 text-white px-4 py-3 rounded-lg shadow-lg z-50 flex items-center gap-2"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span className="text-sm font-medium">
                    {notificationMessage}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Popup Toast (top-right) - shows escalate/resolve success */}
            <AnimatePresence>
              {showPopup && (resolveNotice || escalationNotice) && (
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
                        {escalationNotice ?? resolveNotice}
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

            {/* Right: user details (compact) */}
            {/* Below lg this sits under the chat, capped so it cannot take the
                space the conversation needs; at lg it becomes the side pane. */}
            <aside className="max-h-[35%] w-full shrink-0 overflow-auto border-t border-slate-200 p-4 sm:p-6 lg:max-h-none lg:w-[16.75rem] lg:border-l lg:border-t-0 xl:w-[20.5rem]">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 shrink-0 rounded-full bg-slate-100 flex items-center justify-center font-medium text-slate-700">
                  {String(ticket?.email ?? ticket?.name ?? "U")
                    .slice(0, 2)
                    .toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div
                    className="truncate font-semibold text-slate-800"
                    title={String(ticket?.email ?? ticket?.name ?? "")}
                  >
                    {ticket?.email?.split?.("@")?.[0] ?? ticket?.name ?? "User"}
                  </div>
                  <div className="text-xs text-slate-500">
                    Trainee ID:{" "}
                    {(() => {
                      const raw = String(
                        ticket?.raw?.customer_id ??
                          ticket?.raw?.user_id ??
                          ticket?.raw?.userId ??
                          ticket?.raw?.reporter_id ??
                          ticket?.id ??
                          "—"
                      );
                      // A full UUID crowds the header out; the first block is
                      // plenty to recognise a ticket by. The whole value stays
                      // available on hover and to anything copying the title.
                      return (
                        <span title={raw} className="font-mono">
                          {raw.length > 8 ? `${raw.slice(0, 8)}…` : raw}
                        </span>
                      );
                    })()}
                  </div>
                </div>
              </div>

              <div className="text-sm text-slate-600 space-y-4">
                {/* What the widget collected before the conversation started:
                    who they are, how to reach them, and what it is about. */}
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Submitted details
                  </div>
                  {/* Label above value rather than beside it: emails and
                      category titles are long and were being squeezed into a
                      narrow column. */}
                  <dl className="mt-3 space-y-3">
                    {submittedDetails.map(([label, value]) => (
                      <div key={String(label)}>
                        <dt className="text-[11px] uppercase tracking-wide text-slate-500">
                          {label}
                        </dt>
                        <dd
                          className="mt-0.5 break-words text-sm font-medium text-slate-800"
                          title={value ? String(value) : undefined}
                        >
                          {value ? String(value) : "—"}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </div>

                <div>
                  <div className="text-xs text-slate-500 flex items-center justify-between">
                    <span>Ticket Status</span>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        status === "resolved"
                          ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                          : status === "pending"
                          ? "bg-amber-100 text-amber-700 border border-amber-200"
                          : "bg-blue-100 text-blue-700 border border-blue-200"
                      }`}
                    >
                      {status_label}
                    </span>
                  </div>
                  <div className="mt-2 text-xs text-slate-500">
                    {formatMaybeDate(time)}
                  </div>
                </div>

                <div>
                  <div className="text-xs text-slate-500">Assigned to</div>
                  <div className="mt-2 font-medium">
                    {assignedAgent
                      ? assignedAgent.name ||
                        assignedAgent.username ||
                        assignedAgent.email
                      : "No agent assigned"}
                  </div>
                  <div className="text-xs text-slate-400">
                    {assignedAgent?.email ?? ""}
                  </div>
                </div>

                {escalated && (
                  <div className="mt-2">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-50 text-red-700 border border-red-200 text-xs font-semibold">
                      Escalated
                    </div>
                  </div>
                )}
              </div>
            </aside>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
