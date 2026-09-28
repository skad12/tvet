// Ticket activity: which tickets were written to most recently, and which are
// waiting on staff. The backend records both (last_message_at, awaiting_reply);
// these helpers read them consistently for every ticket list.

type AnyTicket = Record<string, any> | null | undefined;

function source(t: AnyTicket): Record<string, any> {
  if (!t) return {};
  // Lists keep the API object under `raw`; prefer the top level when present.
  return { ...(t.raw ?? {}), ...t };
}

/** Milliseconds of the ticket's latest activity, 0 when unknown. */
export function lastActivityTime(t: AnyTicket): number {
  const s = source(t);
  for (const value of [s.last_message_at, s.created_at, s.pub_date]) {
    if (!value) continue;
    const ms = new Date(value).getTime();
    if (!Number.isNaN(ms)) return ms;
  }
  return 0;
}

/** Newest activity first. Returns a new array. */
export function sortByActivity<T extends AnyTicket>(tickets: T[]): T[] {
  return [...tickets].sort((a, b) => lastActivityTime(b) - lastActivityTime(a));
}

/** The trainee has written and nobody has answered yet. */
export function needsReply(t: AnyTicket): boolean {
  const s = source(t);
  const resolved =
    String(s.ticket_status ?? "").toLowerCase() === "resolved" ||
    String(s.status ?? "").toLowerCase() === "resolved";
  return s.awaiting_reply === true && !resolved;
}

export const NEW_MESSAGE_BADGE_CLASS =
  "inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-700 sm:text-xs";
