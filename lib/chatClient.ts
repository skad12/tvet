"use client";

import type {
  ApiRecord,
  ApiUser,
  ChatMessage,
  ChatPair,
  ChatRole,
  IdValue,
} from "@/types/domain";

type RequestHeaders = Record<string, string>;

type FetchTicketChatsOptions = {
  token?: string | null;
  signal?: AbortSignal;
};

type PostTicketMessageInput = {
  ticketId: IdValue;
  message: string;
  appUserId?: IdValue | null | "";
  email?: string | null;
  username?: string | null;
  token?: string | null;
  useEmailEndpoint?: boolean;
  fromTicket?: boolean;
  allowEmailFallback?: boolean;
};

export type PostAgentTicketMessageInput = {
  ticketId: IdValue;
  message: string;
  appUserId?: IdValue | null | "";
  email?: string;
  username?: string | null;
  token?: string | null;
};

export const AGENT_ADD_MESSAGE_ENDPOINT = "/tickets/add-message/";

/** Agent + super-agent share this single add-message route. */
export async function postAgentTicketMessage({
  ticketId,
  message,
  appUserId = "",
  email = "",
  username = "",
  token,
}: PostAgentTicketMessageInput): Promise<unknown> {
  if (!ticketId) throw new Error("ticketId is required");

  let resolvedAppUserId = appUserId;
  const fallbackUserId = await resolveMessageAppUserId({
    email,
    username,
    token,
  });
  if (!resolvedAppUserId && fallbackUserId) {
    resolvedAppUserId = fallbackUserId;
  }

  const headers = token
    ? { ...DEFAULT_HEADERS, Authorization: `Bearer ${token}` }
    : DEFAULT_HEADERS;

  const payload = {
    ticket_id: ticketId,
    app_user_id: resolvedAppUserId,
    message,
  };

  if (api && typeof api.post === "function") {
    const res = await api.post(AGENT_ADD_MESSAGE_ENDPOINT, payload, { headers });
    return res?.data ?? null;
  }

  const base =
    typeof window !== "undefined"
      ? process.env.NEXT_PUBLIC_API_BASE?.replace(/\/$/, "")
      : "";
  const url = base
    ? `${base}${AGENT_ADD_MESSAGE_ENDPOINT}`
    : AGENT_ADD_MESSAGE_ENDPOINT;
  const response = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const text = await response.text().catch(() => "");
    const error: any = new Error(
      `Failed to send message (${response.status}) ${text || response.statusText}`
    );
    error.status = response.status;
    error.data = text;
    throw error;
  }
  return response.json().catch(() => ({}));
}

type MessagePostAttempt = {
  endpoint: string;
  payload: Record<string, unknown>;
};

type ChatSubEvent = {
  meta: string;
  text: string;
  roleGuess: unknown;
  atMsRaw: number | null;
};

type ChatEvent = {
  idBase: IdValue | string;
  rawIndex: number;
  meta: string;
  text: string;
  metaOrder: number;
  role: ChatRole;
  atMs: number;
  raw: ApiRecord;
  status: string;
};

export type NormalizedChatMessage = Required<Pick<ChatMessage, "id" | "text" | "at" | "role">> & {
  raw: ApiRecord;
  status?: ChatMessage["status"];
  from?: ChatMessage["from"];
};

let api: typeof import("@/lib/axios").default | null = null;
try {
  api = require("@/lib/axios").default;
} catch (err) {
  api = null;
}

const DEFAULT_HEADERS: RequestHeaders = {
  "Content-Type": "application/json",
};

export const DEFAULT_CHAT_POLL_MS = 4000;

const USER_DIRECTORY_TTL_MS = 5 * 60 * 1000;
let cachedUsersDirectory: ApiUser[] | null = null;
let cachedUsersDirectoryAt = 0;
let pendingUsersDirectoryPromise: Promise<ApiUser[]> | null = null;

function coerceUsersArray(payload: unknown): ApiUser[] {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload as ApiUser[];
  const record = payload as ApiRecord;
  if (Array.isArray(record.results)) return record.results as ApiUser[];
  if (Array.isArray(record.data)) return record.data as ApiUser[];
  if (Array.isArray(record.users)) return record.users as ApiUser[];
  return [];
}

function getUserCandidateId(user?: ApiUser | null): IdValue | null {
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

function normalizeIdentity(value: unknown): string {
  return String(value ?? "")
    .trim()
    .toLowerCase();
}

function errorLooksLikeInvalidUser(error: unknown): boolean {
  const err = error as { response?: { data?: unknown }; data?: unknown; message?: string };
  const raw =
    err?.response?.data ??
    err?.data ??
    err?.message ??
    error ??
    "";
  const text = typeof raw === "string" ? raw : JSON.stringify(raw);
  return text.toLowerCase().includes("invalid user");
}

async function fetchUsersDirectoryForMessage(token?: string | null): Promise<ApiUser[]> {
  if (
    cachedUsersDirectory &&
    Date.now() - cachedUsersDirectoryAt < USER_DIRECTORY_TTL_MS
  ) {
    return cachedUsersDirectory;
  }

  if (pendingUsersDirectoryPromise) return pendingUsersDirectoryPromise;

  const headers = token
    ? { ...DEFAULT_HEADERS, Authorization: `Bearer ${token}` }
    : DEFAULT_HEADERS;

  pendingUsersDirectoryPromise = (async () => {
    if (api && typeof api.get === "function") {
      const res = await api.get("/get-all-users/", { headers });
      return coerceUsersArray(res?.data);
    }

    const base =
      typeof window !== "undefined"
        ? process.env.NEXT_PUBLIC_API_BASE?.replace(/\/$/, "")
        : "";
    const url = base ? `${base}/get-all-users/` : "/get-all-users/";
    const response = await fetch(url, { method: "GET", headers });
    if (!response.ok) return [];
    const data = await response.json().catch(() => []);
    return coerceUsersArray(data);
  })()
    .then((users) => {
      cachedUsersDirectory = users;
      cachedUsersDirectoryAt = Date.now();
      return users;
    })
    .finally(() => {
      pendingUsersDirectoryPromise = null;
    });

  return pendingUsersDirectoryPromise;
}

async function resolveMessageAppUserId({
  email,
  username,
  token,
}: Pick<PostTicketMessageInput, "email" | "username" | "token">): Promise<IdValue | null> {
  const normalizedEmail = normalizeIdentity(email);
  const normalizedUsername = normalizeIdentity(username);
  if (!normalizedEmail && !normalizedUsername) return null;

  const users = await fetchUsersDirectoryForMessage(token).catch(() => []);
  const matched = users.find((user) => {
    const userEmail = normalizeIdentity(user?.email);
    const userUsername = normalizeIdentity(user?.username);
    return (
      (normalizedEmail && userEmail === normalizedEmail) ||
      (normalizedUsername && userUsername === normalizedUsername)
    );
  });

  return getUserCandidateId(matched);
}

function coerceArray(payload: unknown): ApiRecord[] {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload as ApiRecord[];
  const record = payload as ApiRecord;
  const dataRecord = record.data as ApiRecord | undefined;
  if (Array.isArray(record.messages)) return record.messages as ApiRecord[];
  if (Array.isArray(record.results)) return record.results as ApiRecord[];
  if (Array.isArray(record.data)) return record.data as ApiRecord[];
  if (Array.isArray(record.tickets)) return record.tickets as ApiRecord[];
  const maybe = dataRecord?.messages ?? record.messages ?? [];
  return Array.isArray(maybe) ? (maybe as ApiRecord[]) : [];
}

function resolveRole(input: unknown, fallback: ChatRole = "customer"): ChatRole {
  const value = (input ?? "").toString().toLowerCase();
  if (!value) return fallback;

  const agentKeywords = [
    "agent",
    "super_agent",
    "super-agent",
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

function parseDateToMs(d: unknown): number {
  if (!d) return NaN;
  const n = Number(d);
  if (!Number.isNaN(n)) return n;
  const parsed = Date.parse(String(d));
  return Number.isNaN(parsed) ? NaN : parsed;
}

function normalizeMessageText(value: unknown): string {
  return String(value ?? "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}

function isLocalMessage(message?: ChatMessage | null): boolean {
  const id = String(message?.id ?? "");
  return (
    id.startsWith("tmp-") ||
    id.startsWith("local-") ||
    message?.status === "pending" ||
    message?.status === "failed"
  );
}

function serverMessageMatchesLocal(
  serverMessage: ChatMessage,
  localMessage: ChatMessage
): boolean {
  const serverText = normalizeMessageText(serverMessage?.text);
  const localText = normalizeMessageText(localMessage?.text);
  if (!serverText || serverText !== localText) return false;

  if (serverMessage?.role && localMessage?.role) {
    if (serverMessage.role === localMessage.role) return true;
  }

  const serverAt = parseDateToMs(serverMessage?.at);
  const localAt = parseDateToMs(localMessage?.at);
  if (!Number.isNaN(serverAt) && !Number.isNaN(localAt)) {
    return Math.abs(serverAt - localAt) < 10 * 60 * 1000;
  }

  return true;
}

function dedupeMessageEvents(messages: NormalizedChatMessage[] = []): NormalizedChatMessage[] {
  const seen: Array<{ text: string; role: ChatRole; atMs: number }> = [];
  return messages.filter((message) => {
    const text = normalizeMessageText(message?.text);
    const role = message?.role ?? "";
    const atMs = parseDateToMs(message?.at);
    if (!text) return true;

    const duplicate = seen.some((entry) => {
      if (entry.text !== text || entry.role !== role) return false;
      if (Number.isNaN(entry.atMs) || Number.isNaN(atMs)) return false;
      return Math.abs(entry.atMs - atMs) <= 60 * 1000;
    });

    if (!duplicate) {
      seen.push({ text, role, atMs });
    }

    return !duplicate;
  });
}

/**
 * normalizeChatEntries
 * - Accepts varied payload shapes and returns chronological flat events:
 *   { id, text, at (ISO), role, raw, status }
 */
export function normalizeChatEntries(
  payload: unknown,
  { ticketId }: { ticketId?: IdValue | string } = {}
): NormalizedChatMessage[] {
  const rawEntries = coerceArray(payload);
  if (!rawEntries.length) return [];

  const events: ChatEvent[] = [];
  const metaOrder: Record<string, number> = {
    msg: 0,
    text: 0,
    message: 0,
    reply: 1,
    response: 1,
    other: 2,
  };

  rawEntries.forEach((entry, idx) => {
    const userRecord = entry.user as ApiUser | undefined;
    const appUserRecord = entry.app_user as ApiUser | undefined;
    const entryBaseRaw =
      entry.at ??
      entry.created_at ??
      entry.createdAt ??
      entry.timestamp ??
      entry.pub_date ??
      entry.message_at ??
      entry.reply_at ??
      null;

    const baseParsedMs = parseDateToMs(entryBaseRaw);
    const baseMs = Number.isNaN(baseParsedMs) ? Date.now() + idx : baseParsedMs;

    const baseId =
      entry.id ??
      entry.message_id ??
      entry.pk ??
      entry.uuid ??
      `${ticketId ?? "ticket"}-${idx}`;

    const subEvents: ChatSubEvent[] = [];
    const pushSub = (
      meta: string,
      textRaw: unknown,
      roleGuess: unknown,
      atOverride: unknown
    ): void => {
      const text = (textRaw ?? "").toString().trim();
      if (!text) return;
      const atMsRaw = parseDateToMs(atOverride);
      subEvents.push({
        meta,
        text,
        roleGuess,
        atMsRaw: Number.isNaN(atMsRaw) ? null : atMsRaw,
      });
    };

    const roleGuess =
      entry.from ??
      entry.author ??
      entry.sender ??
      entry.role ??
      entry.sender_type ??
      entry.senderType ??
      entry.user_type ??
      entry.userType ??
      entry.account_type ??
      entry.accountType ??
      entry.created_by_role ??
      userRecord?.account_type ??
      userRecord?.role ??
      appUserRecord?.account_type ??
      appUserRecord?.role;

    if (entry.message != null) {
      pushSub(
        "message",
        entry.message,
        roleGuess,
        entry.message_at ?? entry.at ?? entry.created_at
      );
    }
    if (entry.reply != null) {
      pushSub(
        "reply",
        entry.reply,
        entry.reply_by ?? entry.reply_from ?? "agent",
        entry.reply_at ?? entry.at ?? entry.created_at
      );
    }

    const hasMessageField =
      entry.message ||
      entry.text ||
      entry.body ||
      entry.payload ||
      entry.content ||
      entry.chat ||
      entry.msg;
    if (!entry.message && !entry.reply && hasMessageField) {
      pushSub(
        "text",
        entry.text ??
          entry.body ??
          entry.payload ??
          entry.content ??
          entry.chat ??
          entry.msg ??
          entry.message,
        roleGuess,
        entry.at ?? entry.created_at
      );
    }

    if (!entry.message && !entry.reply && !hasMessageField && entry.response) {
      pushSub(
        "response",
        entry.response,
        entry.response_by ?? "agent",
        entry.at ?? entry.created_at
      );
    }

    if (!subEvents.length) return;

    let lastAssignedMs: number | null = null;
    subEvents.forEach((se, sIdx) => {
      const preferredMs = se.atMsRaw ?? baseMs + sIdx;
      let assigned = preferredMs;
      if (lastAssignedMs !== null && assigned <= lastAssignedMs)
        assigned = lastAssignedMs + 1;
      lastAssignedMs = assigned;

      events.push({
        idBase: String(baseId),
        rawIndex: idx,
        meta: se.meta,
        metaOrder: metaOrder[se.meta] ?? 9,
        text: se.text,
        role: resolveRole(
          se.roleGuess,
          se.meta === "reply" ? "agent" : "customer"
        ),
        atMs: assigned,
        raw: entry,
        status: String(entry.status ?? "sent"),
      });
    });
  });

  events.sort((a, b) => {
    if (a.atMs !== b.atMs) return a.atMs - b.atMs;
    if (a.rawIndex !== b.rawIndex) return a.rawIndex - b.rawIndex;
    return a.metaOrder - b.metaOrder;
  });

  const normalized = events.map((ev, i) => {
    const id = `${ev.idBase}-${ev.rawIndex}-${ev.meta}-${i}`;
    return {
      id,
      text: ev.text,
      at: new Date(ev.atMs).toISOString(),
      role: ev.role,
      raw: ev.raw,
      status: ev.status ?? "sent",
    };
  });

  return dedupeMessageEvents(normalized);
}

export function digestMessages(list: ChatMessage[] = []): string {
  if (!list.length) return "";
  return list.map((m) => `${m.id}-${m.text}-${m.role}-${m.at}`).join("|");
}

export function mergeChatMessages(
  fetchedMessages: ChatMessage[] = [],
  currentMessages: ChatMessage[] = []
): ChatMessage[] {
  const fetched = Array.isArray(fetchedMessages) ? fetchedMessages : [];
  const current = Array.isArray(currentMessages) ? currentMessages : [];
  const consumedFetched = new Set<number>();

  const localMessagesToKeep = current.filter((message) => {
    if (!isLocalMessage(message)) return false;
    if (message.status === "failed") return true;

    const matchIndex = fetched.findIndex((serverMessage, index) => {
      if (consumedFetched.has(index)) return false;
      return serverMessageMatchesLocal(serverMessage, message);
    });

    if (matchIndex >= 0) {
      consumedFetched.add(matchIndex);
      return false;
    }

    return true;
  });

  return [...fetched, ...localMessagesToKeep].sort((a, b) => {
    const aMs = parseDateToMs(a?.at);
    const bMs = parseDateToMs(b?.at);
    if (Number.isNaN(aMs) && Number.isNaN(bMs)) return 0;
    if (Number.isNaN(aMs)) return 1;
    if (Number.isNaN(bMs)) return -1;
    return aMs - bMs;
  });
}

export async function fetchTicketChats(
  ticketId: IdValue | string | null | undefined,
  { token, signal }: FetchTicketChatsOptions = {}
): Promise<unknown[]> {
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
  const response = await fetch(url, { method: "GET", headers, signal });
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
  email = "",
  username = "",
  token,
  useEmailEndpoint = false,
  fromTicket = false,
  allowEmailFallback = false,
}: PostTicketMessageInput): Promise<unknown> {
  if (!ticketId) throw new Error("ticketId is required");

  let resolvedAppUserId = appUserId;
  const fallbackUserId = await resolveMessageAppUserId({
    email,
    username,
    token,
  });
  if (!resolvedAppUserId && fallbackUserId) {
    resolvedAppUserId = fallbackUserId;
  }

  const headers = token
    ? { ...DEFAULT_HEADERS, Authorization: `Bearer ${token}` }
    : DEFAULT_HEADERS;

  const sendPayload = async (
    endpoint: string,
    payload: Record<string, unknown>
  ): Promise<unknown> => {
    const base =
      typeof window !== "undefined"
        ? process.env.NEXT_PUBLIC_API_BASE?.replace(/\/$/, "")
        : "";
    const url = base ? `${base}${endpoint}` : endpoint;

    if (typeof window !== "undefined" || !api || typeof api.post !== "function") {
      const response = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const text = await response.text().catch(() => "");
        const error: any = new Error(
          `Failed to send message (${response.status}) ${
            text || response.statusText
          }`
        );
        error.status = response.status;
        error.data = text;
        throw error;
      }
      return response.json().catch(() => ({}));
    }

    const res = await api.post(endpoint, payload, { headers });
    return res?.data ?? null;
  };

  const userIds = [
    resolvedAppUserId,
    appUserId,
    fallbackUserId,
  ].filter((value, index, array) => {
    if (value === undefined || value === null || value === "") return false;
    return array.findIndex((item) => String(item) === String(value)) === index;
  });

  const attempts: MessagePostAttempt[] = [];
  const addUserAttempts = (endpoint: string): void => {
    userIds.forEach((userId) => {
      attempts.push({
        endpoint,
        payload: { ticket_id: ticketId, app_user_id: userId, message },
      });
    });
  };

  if (useEmailEndpoint && email) {
    attempts.push({
      endpoint: "/tickets/add-message/email/",
      payload: { ticket_id: ticketId, email, message },
    });
  } else if (fromTicket) {
    addUserAttempts("/tickets/add-message/");
    if (allowEmailFallback && email) {
      attempts.push({
        endpoint: "/tickets/add-message/email/",
        payload: { ticket_id: ticketId, email, message },
      });
      attempts.push({
        endpoint: "/tickets/add-message/ticket/",
        payload: { ticket_id: ticketId, email, message },
      });
    }
    addUserAttempts("/tickets/add-message/ticket/");
  } else {
    addUserAttempts("/tickets/add-message/");
    addUserAttempts("/tickets/add-message/ticket/");
    if (allowEmailFallback && email) {
      attempts.push({
        endpoint: "/tickets/add-message/email/",
        payload: { ticket_id: ticketId, email, message },
      });
    }
  }

  if (attempts.length === 0) {
    attempts.push({
      endpoint: fromTicket
        ? "/tickets/add-message/ticket/"
        : "/tickets/add-message/",
      payload: { ticket_id: ticketId, app_user_id: "", message },
    });
  }

  let lastError: unknown = null;
  for (const [index, attempt] of attempts.entries()) {
    try {
      return await sendPayload(attempt.endpoint, attempt.payload);
    } catch (error) {
      lastError = error;
      const err = error as { response?: { status?: number }; status?: number };
      const status = err?.response?.status ?? err?.status;
      const hasMoreAttempts = index < attempts.length - 1;
      if (status >= 500 && hasMoreAttempts) continue;
      if (!errorLooksLikeInvalidUser(error) && status !== 400) {
        throw error;
      }
    }
  }

  throw lastError ?? new Error("Failed to send message");
}

// ---------------- pairing helpers ----------------

export function cleanPairs(rawPairs: ChatPair[] = []): ChatPair[] {
  return (rawPairs || [])
    .map((p) => {
      const out: ChatPair = {};
      if (p.message != null && String(p.message).trim() !== "")
        out.message = p.message;
      if (p.reply != null && String(p.reply).trim() !== "") out.reply = p.reply;
      return out;
    })
    .filter((p) => Object.keys(p).length > 0);
}

/**
 * Agent pairing: agent block -> `reply`, following customer block -> `message`
 * Returns [{ reply, message }, ...]
 */
export function pairForAgent(flatMessages: ChatMessage[] = []): ChatPair[] {
  if (!Array.isArray(flatMessages) || !flatMessages.length) return [];
  const out: ChatPair[] = [];
  let i = 0;
  while (i < flatMessages.length) {
    const replyParts: string[] = [];
    while (
      i < flatMessages.length &&
      String(flatMessages[i].role) === "agent"
    ) {
      replyParts.push(flatMessages[i].text ?? flatMessages[i].message ?? "");
      i++;
    }
    const messageParts: string[] = [];
    while (
      i < flatMessages.length &&
      String(flatMessages[i].role) !== "agent"
    ) {
      messageParts.push(flatMessages[i].text ?? flatMessages[i].message ?? "");
      i++;
    }
    out.push({
      reply: replyParts.join("\n"),
      message: messageParts.join("\n"),
    });
  }
  return cleanPairs(out);
}

/**
 * Customer pairing: customer block -> `message`, following agent block -> `reply`
 * Returns [{ message, reply }, ...]
 */
export function pairForCustomer(flatMessages: ChatMessage[] = []): ChatPair[] {
  if (!Array.isArray(flatMessages) || !flatMessages.length) return [];
  const out: ChatPair[] = [];
  let i = 0;
  while (i < flatMessages.length) {
    const messageParts: string[] = [];
    while (
      i < flatMessages.length &&
      String(flatMessages[i].role) === "customer"
    ) {
      messageParts.push(flatMessages[i].text ?? flatMessages[i].message ?? "");
      i++;
    }
    const replyParts: string[] = [];
    while (
      i < flatMessages.length &&
      String(flatMessages[i].role) !== "customer"
    ) {
      replyParts.push(flatMessages[i].text ?? flatMessages[i].message ?? "");
      i++;
    }
    out.push({
      message: messageParts.join("\n"),
      reply: replyParts.join("\n"),
    });
  }
  return cleanPairs(out);
}
