// // "use client";

// // let api = null;
// // try {
// //   api = require("@/lib/axios").default;
// // } catch (err) {
// //   api = null;
// // }

// // const DEFAULT_HEADERS = {
// //   "Content-Type": "application/json",
// // };

// // export const DEFAULT_CHAT_POLL_MS = 4000;

// // function coerceArray(payload) {
// //   if (!payload) return [];
// //   if (Array.isArray(payload)) return payload;
// //   if (Array.isArray(payload.messages)) return payload.messages;
// //   if (Array.isArray(payload.results)) return payload.results;
// //   if (Array.isArray(payload.data)) return payload.data;
// //   if (Array.isArray(payload.tickets)) return payload.tickets;
// //   const maybe = payload?.data?.messages ?? payload?.messages ?? [];
// //   return Array.isArray(maybe) ? maybe : [];
// // }

// // function resolveRole(input, fallback = "customer") {
// //   const value = (input ?? "").toString().toLowerCase();
// //   if (!value) return fallback;

// //   const agentKeywords = [
// //     "agent",
// //     "support",
// //     "staff",
// //     "admin",
// //     "ai",
// //     "assistant",
// //     "reply",
// //     "human",
// //   ];
// //   const customerKeywords = [
// //     "customer",
// //     "user",
// //     "reporter",
// //     "requester",
// //     "client",
// //     "you",
// //   ];

// //   if (agentKeywords.some((kw) => value.includes(kw))) return "agent";
// //   if (customerKeywords.some((kw) => value.includes(kw))) return "customer";
// //   return fallback;
// // }

// // export function normalizeChatEntries(payload, { ticketId } = {}) {
// //   const rawEntries = coerceArray(payload);
// //   const normalized = [];

// //   rawEntries.forEach((entry, index) => {
// //     const baseTimestamp =
// //       entry.at ??
// //       entry.created_at ??
// //       entry.createdAt ??
// //       entry.timestamp ??
// //       entry.pub_date ??
// //       new Date().toISOString();

// //     const baseId =
// //       entry.id ??
// //       entry.message_id ??
// //       entry.pk ??
// //       entry.uuid ??
// //       `${ticketId ?? "ticket"}-${index}`;

// //     const pushEntry = (
// //       text,
// //       roleGuess,
// //       meta = "msg",
// //       atOverride = null,
// //       extra = {}
// //     ) => {
// //       const trimmed = String(text ?? "").trim();
// //       if (!trimmed) return;
// //       normalized.push({
// //         id: `${baseId}-${meta}-${index}`,
// //         text: trimmed,
// //         at: atOverride ?? baseTimestamp,
// //         role: resolveRole(roleGuess, meta === "reply" ? "agent" : "customer"),
// //         raw: entry,
// //         ...extra,
// //         status: extra.status ?? "sent",
// //       });
// //     };

// //     const hasMessageField =
// //       entry.message || entry.text || entry.body || entry.payload;

// //     if (entry.message) {
// //       pushEntry(entry.message, entry.from ?? entry.author ?? entry.sender, "msg", entry.message_at);
// //     }

// //     if (entry.reply) {
// //       pushEntry(
// //         entry.reply,
// //         entry.reply_by ?? entry.reply_from ?? "agent",
// //         "reply",
// //         entry.reply_at
// //       );
// //     }

// //     if (!entry.message && !entry.reply && hasMessageField) {
// //       pushEntry(
// //         entry.text ?? entry.body ?? entry.payload ?? entry.message,
// //         entry.from ?? entry.author ?? entry.sender,
// //         "text",
// //         entry.at ?? entry.created_at
// //       );
// //     }

// //     if (
// //       !entry.message &&
// //       !entry.reply &&
// //       !hasMessageField &&
// //       entry.response
// //     ) {
// //       pushEntry(entry.response, entry.response_by ?? "agent", "response");
// //     }
// //   });

// //   return normalized;
// // }

// // export function digestMessages(list = []) {
// //   if (!list.length) return "";
// //   return list.map((m) => `${m.id}-${m.text}-${m.role}`).join("|");
// // }

// // export async function fetchTicketChats(ticketId, { token, signal } = {}) {
// //   if (!ticketId) return [];
// //   const endpoint = `/tickets/get/chats/${ticketId}/`;
// //   const headers = token
// //     ? { ...DEFAULT_HEADERS, Authorization: `Bearer ${token}` }
// //     : DEFAULT_HEADERS;

// //   if (api && typeof api.get === "function") {
// //     const res = await api.get(endpoint, { headers, signal });
// //     return res?.data ?? [];
// //   }

// //   const base =
// //     typeof window !== "undefined"
// //       ? process.env.NEXT_PUBLIC_API_BASE?.replace(/\/$/, "")
// //       : "";
// //   const url = base ? `${base}${endpoint}` : endpoint;
// //   const response = await fetch(url, {
// //     method: "GET",
// //     headers,
// //     signal,
// //   });
// //   if (!response.ok) {
// //     const text = await response.text().catch(() => "");
// //     throw new Error(
// //       `Failed to load chats (${response.status}) ${text || response.statusText}`
// //     );
// //   }
// //   return response.json().catch(() => []);
// // }

// // export async function postTicketMessage({
// //   ticketId,
// //   message,
// //   appUserId = "",
// //   token,
// // }) {
// //   if (!ticketId) throw new Error("ticketId is required");
// //   const payload = {
// //     ticket_id: ticketId,
// //     app_user_id: appUserId,
// //     message,
// //   };

// //   const endpoint = "/tickets/add-message/";
// //   const headers = token
// //     ? { ...DEFAULT_HEADERS, Authorization: `Bearer ${token}` }
// //     : DEFAULT_HEADERS;

// //   if (api && typeof api.post === "function") {
// //     const res = await api.post(endpoint, payload, { headers });
// //     return res?.data ?? null;
// //   }

// //   const base =
// //     typeof window !== "undefined"
// //       ? process.env.NEXT_PUBLIC_API_BASE?.replace(/\/$/, "")
// //       : "";
// //   const url = base ? `${base}${endpoint}` : endpoint;

// //   const response = await fetch(url, {
// //     method: "POST",
// //     headers,
// //     body: JSON.stringify(payload),
// //   });
// //   if (!response.ok) {
// //     const text = await response.text().catch(() => "");
// //     throw new Error(
// //       `Failed to send message (${response.status}) ${
// //         text || response.statusText
// //       }`
// //     );
// //   }
// //   return response.json().catch(() => ({}));
// // }

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
//   if (!Number.isNaN(n)) return n; // already ms or numeric string
//   const parsed = Date.parse(String(d));
//   return Number.isNaN(parsed) ? NaN : parsed;
// }

// /**
//  * normalizeChatEntries
//  * - Accepts a payload that may be:
//  *    - flat list of messages with role/text/at, or
//  *    - items containing message & reply fields in one object
//  * - Returns a chronological flat array of normalized events:
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

//   // For stable ordering when timestamps are equal/missing, we'll synthesize ms
//   // base using the parsed timestamp or Date.now(), and add tiny offsets for multi-event entries.
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

//     // Try to parse base timestamp to ms
//     const baseParsedMs = parseDateToMs(entryBaseRaw);
//     // If parsing failed, create a deterministic base using current time + index small offset
//     const baseMs = Number.isNaN(baseParsedMs) ? Date.now() + idx : baseParsedMs;

//     const baseId =
//       entry.id ??
//       entry.message_id ??
//       entry.pk ??
//       entry.uuid ??
//       `${ticketId ?? "ticket"}-${idx}`;

//     // We'll collect sub-events (message, reply, text, response) in order and then push them with offsets
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

//     // If payload is already paired with message/reply fields, preserve that
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

//     // Generic text/body fields (fallback)
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

//     // If no recognized sub-event found, skip this entry
//     if (!subEvents.length) return;

//     // Assign atMs to subEvents deterministically:
//     // - Prefer explicit atMsRaw if present
//     // - Otherwise derive from baseMs and ensure ordering: earlier metaOrder first
//     // - Guarantee that within same raw entry, later subEvents get strictly larger atMs than earlier ones
//     // Start with a small micro-offset to keep stable ordering across entries with same baseMs
//     let lastAssignedMs = null;
//     subEvents.forEach((se, sIdx) => {
//       // idealMs pref = se.atMsRaw ?? baseMs + sIdx
//       const preferredMs = se.atMsRaw ?? baseMs + sIdx;
//       // Ensure monotonic within this entry
//       let assigned = preferredMs;
//       if (lastAssignedMs !== null && assigned <= lastAssignedMs) {
//         assigned = lastAssignedMs + 1; // bump by 1ms
//       }
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

//   // Sort events: by atMs asc, then rawIndex asc, then metaOrder asc to keep consistent ordering.
//   events.sort((a, b) => {
//     if (a.atMs !== b.atMs) return a.atMs - b.atMs;
//     if (a.rawIndex !== b.rawIndex) return a.rawIndex - b.rawIndex;
//     return a.metaOrder - b.metaOrder;
//   });

//   // Map to normalized shape expected by UI: stable id and ISO at string
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
//   // include timestamp to make digest reflect order changes too
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
//   const response = await fetch(url, {
//     method: "GET",
//     headers,
//     signal,
//   });
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
//   token,
// }) {
//   if (!ticketId) throw new Error("ticketId is required");
//   const payload = {
//     ticket_id: ticketId,
//     app_user_id: appUserId,
//     message,
//   };

//   const endpoint = "/tickets/add-message/";
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

function parseDateToMs(d) {
  if (!d) return NaN;
  const n = Number(d);
  if (!Number.isNaN(n)) return n;
  const parsed = Date.parse(String(d));
  return Number.isNaN(parsed) ? NaN : parsed;
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

    if (entry.message != null) {
      pushSub(
        "message",
        entry.message,
        entry.from ?? entry.author ?? entry.sender,
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
      entry.message || entry.text || entry.body || entry.payload;
    if (!entry.message && !entry.reply && hasMessageField) {
      pushSub(
        "text",
        entry.text ?? entry.body ?? entry.payload ?? entry.message,
        entry.from ?? entry.author ?? entry.sender,
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

  return normalized;
}

export function digestMessages(list = []) {
  if (!list.length) return "";
  return list.map((m) => `${m.id}-${m.text}-${m.role}-${m.at}`).join("|");
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
  token,
}) {
  if (!ticketId) throw new Error("ticketId is required");
  const payload = { ticket_id: ticketId, app_user_id: appUserId, message };
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
