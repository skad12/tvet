"use client";

let api = null;
try {
  api = require("@/lib/axios").default;
} catch (err) {
  api = null;
}

const DEFAULT_HEADERS = {
  "Content-Type": "application/json",
};

export const DEFAULT_CHAT_POLL_MS = 4000;

function coerceArray(payload) {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload.messages)) return payload.messages;
  if (Array.isArray(payload.results)) return payload.results;
  if (Array.isArray(payload.data)) return payload.data;
  if (Array.isArray(payload.tickets)) return payload.tickets;
  const maybe = payload?.data?.messages ?? payload?.messages ?? [];
  return Array.isArray(maybe) ? maybe : [];
}

function resolveRole(input, fallback = "customer") {
  const value = (input ?? "").toString().toLowerCase();
  if (!value) return fallback;

  const agentKeywords = [
    "agent",
    "support",
    "staff",
    "admin",
    "ai",
    "assistant",
    "reply",
    "human",
  ];
  const customerKeywords = [
    "customer",
    "user",
    "reporter",
    "requester",
    "client",
    "you",
  ];

  if (agentKeywords.some((kw) => value.includes(kw))) return "agent";
  if (customerKeywords.some((kw) => value.includes(kw))) return "customer";
  return fallback;
}

export function normalizeChatEntries(payload, { ticketId } = {}) {
  const rawEntries = coerceArray(payload);
  const normalized = [];

  rawEntries.forEach((entry, index) => {
    const baseTimestamp =
      entry.at ??
      entry.created_at ??
      entry.createdAt ??
      entry.timestamp ??
      entry.pub_date ??
      new Date().toISOString();

    const baseId =
      entry.id ??
      entry.message_id ??
      entry.pk ??
      entry.uuid ??
      `${ticketId ?? "ticket"}-${index}`;

    const pushEntry = (
      text,
      roleGuess,
      meta = "msg",
      atOverride = null,
      extra = {}
    ) => {
      const trimmed = String(text ?? "").trim();
      if (!trimmed) return;
      normalized.push({
        id: `${baseId}-${meta}-${index}`,
        text: trimmed,
        at: atOverride ?? baseTimestamp,
        role: resolveRole(roleGuess, meta === "reply" ? "agent" : "customer"),
        raw: entry,
        ...extra,
        status: extra.status ?? "sent",
      });
    };

    const hasMessageField =
      entry.message || entry.text || entry.body || entry.payload;

    if (entry.message) {
      pushEntry(entry.message, entry.from ?? entry.author ?? entry.sender, "msg", entry.message_at);
    }

    if (entry.reply) {
      pushEntry(
        entry.reply,
        entry.reply_by ?? entry.reply_from ?? "agent",
        "reply",
        entry.reply_at
      );
    }

    if (!entry.message && !entry.reply && hasMessageField) {
      pushEntry(
        entry.text ?? entry.body ?? entry.payload ?? entry.message,
        entry.from ?? entry.author ?? entry.sender,
        "text",
        entry.at ?? entry.created_at
      );
    }

    if (
      !entry.message &&
      !entry.reply &&
      !hasMessageField &&
      entry.response
    ) {
      pushEntry(entry.response, entry.response_by ?? "agent", "response");
    }
  });

  return normalized;
}

export function digestMessages(list = []) {
  if (!list.length) return "";
  return list.map((m) => `${m.id}-${m.text}-${m.role}`).join("|");
}

export async function fetchTicketChats(ticketId, { token, signal } = {}) {
  if (!ticketId) return [];
  const endpoint = `/tickets/get/chats/${ticketId}/`;
  const headers = token
    ? { ...DEFAULT_HEADERS, Authorization: `Bearer ${token}` }
    : DEFAULT_HEADERS;

  if (api && typeof api.get === "function") {
    const res = await api.get(endpoint, { headers, signal });
    return res?.data ?? [];
  }

  const base =
    typeof window !== "undefined"
      ? process.env.NEXT_PUBLIC_API_BASE?.replace(/\/$/, "")
      : "";
  const url = base ? `${base}${endpoint}` : endpoint;
  const response = await fetch(url, {
    method: "GET",
    headers,
    signal,
  });
  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(
      `Failed to load chats (${response.status}) ${text || response.statusText}`
    );
  }
  return response.json().catch(() => []);
}

export async function postTicketMessage({
  ticketId,
  message,
  appUserId = "",
  token,
}) {
  if (!ticketId) throw new Error("ticketId is required");
  const payload = {
    ticket_id: ticketId,
    app_user_id: appUserId,
    message,
  };

  const endpoint = "/tickets/add-message/";
  const headers = token
    ? { ...DEFAULT_HEADERS, Authorization: `Bearer ${token}` }
    : DEFAULT_HEADERS;

  if (api && typeof api.post === "function") {
    const res = await api.post(endpoint, payload, { headers });
    return res?.data ?? null;
  }

  const base =
    typeof window !== "undefined"
      ? process.env.NEXT_PUBLIC_API_BASE?.replace(/\/$/, "")
      : "";
  const url = base ? `${base}${endpoint}` : endpoint;

  const response = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(
      `Failed to send message (${response.status}) ${
        text || response.statusText
      }`
    );
  }
  return response.json().catch(() => ({}));
}

