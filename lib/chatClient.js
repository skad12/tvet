// "use client";

// let api = null;
// try {
//   api = require("@/lib/axios").default;
// } catch (err) {
//   api = null;
// }

// const DEFAULT_HEADERS = {
//   "Content-Type": "application/json",
// };

// export const DEFAULT_CHAT_POLL_MS = 4000;

// function coerceArray(payload) {
//   if (!payload) return [];
//   if (Array.isArray(payload)) return payload;
//   if (Array.isArray(payload.messages)) return payload.messages;
//   if (Array.isArray(payload.results)) return payload.results;
//   if (Array.isArray(payload.data)) return payload.data;
//   if (Array.isArray(payload.tickets)) return payload.tickets;
//   const maybe = payload?.data?.messages ?? payload?.messages ?? [];
//   return Array.isArray(maybe) ? maybe : [];
// }

// function resolveRole(input, fallback = "customer") {
//   const value = (input ?? "").toString().toLowerCase();
//   if (!value) return fallback;

//   const agentKeywords = [
//     "agent",
//     "support",
//     "staff",
//     "admin",
//     "ai",
//     "assistant",
//     "reply",
//     "human",
//   ];
//   const customerKeywords = [
//     "customer",
//     "user",
//     "reporter",
//     "requester",
//     "client",
//     "you",
//   ];

//   if (agentKeywords.some((kw) => value.includes(kw))) return "agent";
//   if (customerKeywords.some((kw) => value.includes(kw))) return "customer";
//   return fallback;
// }

// function parseDateToMs(d) {
//   if (!d) return NaN;
//   const n = Number(d);
//   if (!Number.isNaN(n)) return n;
//   const parsed = Date.parse(String(d));
//   return Number.isNaN(parsed) ? NaN : parsed;
// }

// /**
//  * normalizeChatEntries
//  * - Accepts varied payload shapes and returns chronological flat events:
//  *   { id, text, at (ISO), role, raw, status }
//  */
// export function normalizeChatEntries(payload, { ticketId } = {}) {
//   const rawEntries = coerceArray(payload);
//   if (!rawEntries.length) return [];

//   const events = [];
//   const metaOrder = {
//     msg: 0,
//     text: 0,
//     message: 0,
//     reply: 1,
//     response: 1,
//     other: 2,
//   };

//   rawEntries.forEach((entry, idx) => {
//     const entryBaseRaw =
//       entry.at ??
//       entry.created_at ??
//       entry.createdAt ??
//       entry.timestamp ??
//       entry.pub_date ??
//       entry.message_at ??
//       entry.reply_at ??
//       null;

//     const baseParsedMs = parseDateToMs(entryBaseRaw);
//     const baseMs = Number.isNaN(baseParsedMs) ? Date.now() + idx : baseParsedMs;

//     const baseId =
//       entry.id ??
//       entry.message_id ??
//       entry.pk ??
//       entry.uuid ??
//       `${ticketId ?? "ticket"}-${idx}`;

//     const subEvents = [];
//     const pushSub = (meta, textRaw, roleGuess, atOverride) => {
//       const text = (textRaw ?? "").toString().trim();
//       if (!text) return;
//       const atMsRaw = parseDateToMs(atOverride);
//       subEvents.push({
//         meta,
//         text,
//         roleGuess,
//         atMsRaw: Number.isNaN(atMsRaw) ? null : atMsRaw,
//       });
//     };

//     if (entry.message != null) {
//       pushSub(
//         "message",
//         entry.message,
//         entry.from ?? entry.author ?? entry.sender,
//         entry.message_at ?? entry.at ?? entry.created_at
//       );
//     }
//     if (entry.reply != null) {
//       pushSub(
//         "reply",
//         entry.reply,
//         entry.reply_by ?? entry.reply_from ?? "agent",
//         entry.reply_at ?? entry.at ?? entry.created_at
//       );
//     }

//     const hasMessageField =
//       entry.message || entry.text || entry.body || entry.payload;
//     if (!entry.message && !entry.reply && hasMessageField) {
//       pushSub(
//         "text",
//         entry.text ?? entry.body ?? entry.payload ?? entry.message,
//         entry.from ?? entry.author ?? entry.sender,
//         entry.at ?? entry.created_at
//       );
//     }

//     if (!entry.message && !entry.reply && !hasMessageField && entry.response) {
//       pushSub(
//         "response",
//         entry.response,
//         entry.response_by ?? "agent",
//         entry.at ?? entry.created_at
//       );
//     }

//     if (!subEvents.length) return;

//     let lastAssignedMs = null;
//     subEvents.forEach((se, sIdx) => {
//       const preferredMs = se.atMsRaw ?? baseMs + sIdx;
//       let assigned = preferredMs;
//       if (lastAssignedMs !== null && assigned <= lastAssignedMs)
//         assigned = lastAssignedMs + 1;
//       lastAssignedMs = assigned;

//       events.push({
//         idBase: baseId,
//         rawIndex: idx,
//         meta: se.meta,
//         metaOrder: metaOrder[se.meta] ?? 9,
//         text: se.text,
//         role: resolveRole(
//           se.roleGuess,
//           se.meta === "reply" ? "agent" : "customer"
//         ),
//         atMs: assigned,
//         raw: entry,
//         status: entry.status ?? "sent",
//       });
//     });
//   });

//   events.sort((a, b) => {
//     if (a.atMs !== b.atMs) return a.atMs - b.atMs;
//     if (a.rawIndex !== b.rawIndex) return a.rawIndex - b.rawIndex;
//     return a.metaOrder - b.metaOrder;
//   });

//   const normalized = events.map((ev, i) => {
//     const id = `${ev.idBase}-${ev.rawIndex}-${ev.meta}-${i}`;
//     return {
//       id,
//       text: ev.text,
//       at: new Date(ev.atMs).toISOString(),
//       role: ev.role,
//       raw: ev.raw,
//       status: ev.status ?? "sent",
//     };
//   });

//   return normalized;
// }

// export function digestMessages(list = []) {
//   if (!list.length) return "";
//   return list.map((m) => `${m.id}-${m.text}-${m.role}-${m.at}`).join("|");
// }

// export async function fetchTicketChats(ticketId, { token, signal } = {}) {
//   if (!ticketId) return [];
//   const endpoint = `/tickets/get/chats/${ticketId}/`;
//   const headers = token
//     ? { ...DEFAULT_HEADERS, Authorization: `Bearer ${token}` }
//     : DEFAULT_HEADERS;

//   if (api && typeof api.get === "function") {
//     const res = await api.get(endpoint, { headers, signal });
//     return res?.data ?? [];
//   }

//   const base =
//     typeof window !== "undefined"
//       ? process.env.NEXT_PUBLIC_API_BASE?.replace(/\/$/, "")
//       : "";
//   const url = base ? `${base}${endpoint}` : endpoint;
//   const response = await fetch(url, { method: "GET", headers, signal });
//   if (!response.ok) {
//     const text = await response.text().catch(() => "");
//     throw new Error(
//       `Failed to load chats (${response.status}) ${text || response.statusText}`
//     );
//   }
//   return response.json().catch(() => []);
// }

// export async function postTicketMessage({
//   ticketId,
//   message,
//   appUserId = "",
//   email = "",
//   token,
//   useEmailEndpoint = false,
// }) {
//   if (!ticketId) throw new Error("ticketId is required");

//   // Use email-based endpoint if email is provided and useEmailEndpoint is true
//   const endpoint =
//     useEmailEndpoint && email
//       ? "/tickets/add-message/email/"
//       : "/tickets/add-message/";

//   const payload =
//     useEmailEndpoint && email
//       ? { ticket_id: ticketId, email, message }
//       : { ticket_id: ticketId, app_user_id: appUserId, message };

//   const headers = token
//     ? { ...DEFAULT_HEADERS, Authorization: `Bearer ${token}` }
//     : DEFAULT_HEADERS;

//   if (api && typeof api.post === "function") {
//     const res = await api.post(endpoint, payload, { headers });
//     return res?.data ?? null;
//   }

//   const base =
//     typeof window !== "undefined"
//       ? process.env.NEXT_PUBLIC_API_BASE?.replace(/\/$/, "")
//       : "";
//   const url = base ? `${base}${endpoint}` : endpoint;

//   const response = await fetch(url, {
//     method: "POST",
//     headers,
//     body: JSON.stringify(payload),
//   });
//   if (!response.ok) {
//     const text = await response.text().catch(() => "");
//     throw new Error(
//       `Failed to send message (${response.status}) ${
//         text || response.statusText
//       }`
//     );
//   }
//   return response.json().catch(() => ({}));
// }

// // ---------------- pairing helpers ----------------

// export function cleanPairs(rawPairs = []) {
//   return (rawPairs || [])
//     .map((p) => {
//       const out = {};
//       if (p.message != null && String(p.message).trim() !== "")
//         out.message = p.message;
//       if (p.reply != null && String(p.reply).trim() !== "") out.reply = p.reply;
//       return out;
//     })
//     .filter((p) => Object.keys(p).length > 0);
// }

// /**
//  * Agent pairing: agent block -> `reply`, following customer block -> `message`
//  * Returns [{ reply, message }, ...]
//  */
// export function pairForAgent(flatMessages = []) {
//   if (!Array.isArray(flatMessages) || !flatMessages.length) return [];
//   const out = [];
//   let i = 0;
//   while (i < flatMessages.length) {
//     const replyParts = [];
//     while (
//       i < flatMessages.length &&
//       String(flatMessages[i].role) === "agent"
//     ) {
//       replyParts.push(flatMessages[i].text ?? flatMessages[i].message ?? "");
//       i++;
//     }
//     const messageParts = [];
//     while (
//       i < flatMessages.length &&
//       String(flatMessages[i].role) !== "agent"
//     ) {
//       messageParts.push(flatMessages[i].text ?? flatMessages[i].message ?? "");
//       i++;
//     }
//     out.push({
//       reply: replyParts.join("\n"),
//       message: messageParts.join("\n"),
//     });
//   }
//   return cleanPairs(out);
// }

// /**
//  * Customer pairing: customer block -> `message`, following agent block -> `reply`
//  * Returns [{ message, reply }, ...]
//  */
// export function pairForCustomer(flatMessages = []) {
//   if (!Array.isArray(flatMessages) || !flatMessages.length) return [];
//   const out = [];
//   let i = 0;
//   while (i < flatMessages.length) {
//     const messageParts = [];
//     while (
//       i < flatMessages.length &&
//       String(flatMessages[i].role) === "customer"
//     ) {
//       messageParts.push(flatMessages[i].text ?? flatMessages[i].message ?? "");
//       i++;
//     }
//     const replyParts = [];
//     while (
//       i < flatMessages.length &&
//       String(flatMessages[i].role) !== "customer"
//     ) {
//       replyParts.push(flatMessages[i].text ?? flatMessages[i].message ?? "");
//       i++;
//     }
//     out.push({
//       message: messageParts.join("\n"),
//       reply: replyParts.join("\n"),
//     });
//   }
//   return cleanPairs(out);
// }

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

const USER_DIRECTORY_TTL_MS = 5 * 60 * 1000;
let cachedUsersDirectory = null;
let cachedUsersDirectoryAt = 0;
let pendingUsersDirectoryPromise = null;

function coerceUsersArray(payload) {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload.results)) return payload.results;
  if (Array.isArray(payload.data)) return payload.data;
  if (Array.isArray(payload.users)) return payload.users;
  return [];
}

function getUserCandidateId(user) {
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

function errorLooksLikeInvalidUser(error) {
  const raw =
    error?.response?.data ??
    error?.data ??
    error?.message ??
    error ??
    "";
  const text = typeof raw === "string" ? raw : JSON.stringify(raw);
  return text.toLowerCase().includes("invalid user");
}

async function fetchUsersDirectoryForMessage(token) {
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

async function resolveMessageAppUserId({ email, username, token }) {
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

function parseDateToMs(d) {
  if (!d) return NaN;
  const n = Number(d);
  if (!Number.isNaN(n)) return n;
  const parsed = Date.parse(String(d));
  return Number.isNaN(parsed) ? NaN : parsed;
}

function normalizeMessageText(value) {
  return String(value ?? "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}

function isLocalMessage(message) {
  const id = String(message?.id ?? "");
  return (
    id.startsWith("tmp-") ||
    id.startsWith("local-") ||
    message?.status === "pending" ||
    message?.status === "failed"
  );
}

function serverMessageMatchesLocal(serverMessage, localMessage) {
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

function dedupeMessageEvents(messages = []) {
  const seen = [];
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
export function normalizeChatEntries(payload, { ticketId } = {}) {
  const rawEntries = coerceArray(payload);
  if (!rawEntries.length) return [];

  const events = [];
  const metaOrder = {
    msg: 0,
    text: 0,
    message: 0,
    reply: 1,
    response: 1,
    other: 2,
  };

  rawEntries.forEach((entry, idx) => {
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

    const subEvents = [];
    const pushSub = (meta, textRaw, roleGuess, atOverride) => {
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
      entry.user?.account_type ??
      entry.user?.role ??
      entry.app_user?.account_type ??
      entry.app_user?.role;

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

    let lastAssignedMs = null;
    subEvents.forEach((se, sIdx) => {
      const preferredMs = se.atMsRaw ?? baseMs + sIdx;
      let assigned = preferredMs;
      if (lastAssignedMs !== null && assigned <= lastAssignedMs)
        assigned = lastAssignedMs + 1;
      lastAssignedMs = assigned;

      events.push({
        idBase: baseId,
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
        status: entry.status ?? "sent",
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

export function digestMessages(list = []) {
  if (!list.length) return "";
  return list.map((m) => `${m.id}-${m.text}-${m.role}-${m.at}`).join("|");
}

export function mergeChatMessages(fetchedMessages = [], currentMessages = []) {
  const fetched = Array.isArray(fetchedMessages) ? fetchedMessages : [];
  const current = Array.isArray(currentMessages) ? currentMessages : [];
  const consumedFetched = new Set();

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
}) {
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

  const sendPayload = async (endpoint, payload) => {
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
        const error = new Error(
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

  const attempts = [];
  const addUserAttempts = (endpoint) => {
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

  let lastError = null;
  for (const [index, attempt] of attempts.entries()) {
    try {
      return await sendPayload(attempt.endpoint, attempt.payload);
    } catch (error) {
      lastError = error;
      const status = error?.response?.status ?? error?.status;
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

export function cleanPairs(rawPairs = []) {
  return (rawPairs || [])
    .map((p) => {
      const out = {};
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
export function pairForAgent(flatMessages = []) {
  if (!Array.isArray(flatMessages) || !flatMessages.length) return [];
  const out = [];
  let i = 0;
  while (i < flatMessages.length) {
    const replyParts = [];
    while (
      i < flatMessages.length &&
      String(flatMessages[i].role) === "agent"
    ) {
      replyParts.push(flatMessages[i].text ?? flatMessages[i].message ?? "");
      i++;
    }
    const messageParts = [];
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
export function pairForCustomer(flatMessages = []) {
  if (!Array.isArray(flatMessages) || !flatMessages.length) return [];
  const out = [];
  let i = 0;
  while (i < flatMessages.length) {
    const messageParts = [];
    while (
      i < flatMessages.length &&
      String(flatMessages[i].role) === "customer"
    ) {
      messageParts.push(flatMessages[i].text ?? flatMessages[i].message ?? "");
      i++;
    }
    const replyParts = [];
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
