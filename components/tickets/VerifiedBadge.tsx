"use client";

import { FiShield } from "react-icons/fi";

type Fields = { verified?: unknown; verified_by?: unknown; external_user_id?: unknown; raw?: unknown };

/** Whether the trainee was logged in on the TVET website when they opened the chat. */
export function verification(ticket: unknown) {
  const top = (ticket ?? {}) as Fields;
  const t = ((top.raw as Fields | undefined) ?? top) as Fields;
  const pick = (k: keyof Fields) => t[k] ?? top[k];
  return {
    verified: pick("verified") === true,
    by: (typeof pick("verified_by") === "string" && (pick("verified_by") as string)) || "the TVET website",
    userId: typeof pick("external_user_id") === "string" ? (pick("external_user_id") as string) : null,
  };
}

/**
 * A green "Verified" pill for tickets from users who were logged in on the
 * TVET website (checked with a signed token; see main/identity.py). Nothing
 * is shown for others, so old tickets are not flagged.
 */
export default function VerifiedBadge({ ticket, compact = false }: { ticket: unknown; compact?: boolean }) {
  const v = verification(ticket);
  if (!v.verified) return null;
  const title = `Logged in on ${v.by}${v.userId ? ` · user ID ${v.userId}` : ""}`;
  return (
    <span
      title={title}
      aria-label={`Verified: ${title}`}
      className="inline-flex shrink-0 items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700"
    >
      <FiShield className="h-3 w-3" aria-hidden />
      {!compact && "Verified"}
    </span>
  );
}
