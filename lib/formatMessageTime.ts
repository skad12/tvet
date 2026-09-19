import { format, isToday, isYesterday, isValid } from "date-fns";

/**
 * Timestamp shown against a single chat message.
 *
 * The time on its own is only unambiguous for today's messages — a reply from
 * last week rendered as "2:30 PM" reads as though it arrived minutes ago — so
 * anything older carries its date too.
 *
 * The value is an ISO string from the API, which includes a UTC offset, so the
 * browser renders it in the reader's own local time. Invalid or missing values
 * return an empty string rather than throwing, which date-fns `format` does on
 * an invalid date.
 */
export function formatMessageTime(value: unknown): string {
  if (value === null || value === undefined || value === "") return "";

  const dt = value instanceof Date ? value : new Date(value as string | number);
  if (!isValid(dt)) return "";

  if (isToday(dt)) return format(dt, "h:mm a");
  if (isYesterday(dt)) return `Yesterday, ${format(dt, "h:mm a")}`;
  return format(dt, "d MMM yyyy, h:mm a");
}

export default formatMessageTime;
