"use client";

import { FiHome, FiUser } from "react-icons/fi";

/** Which widget role opened the ticket. Matches the backend's Ticket.role values. */
export function sourceOf(role: unknown): "trainee" | "centre" | "other" {
  const r = String(role ?? "").trim().toLowerCase();
  if (r === "registered trainee / applicant") return "trainee";
  if (r === "registered training centre") return "centre";
  return "other";
}

/** A small tag saying whether a trainee or a training centre opened the ticket. */
export default function SourceTag({ role }: { role: unknown }) {
  const source = sourceOf(role);
  if (source === "other") return null;
  const centre = source === "centre";
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold ${
        centre ? "border-violet-200 bg-violet-50 text-violet-700" : "border-sky-100 bg-sky-50 text-sky-700"
      }`}
    >
      {centre ? <FiHome className="h-3 w-3" aria-hidden /> : <FiUser className="h-3 w-3" aria-hidden />}
      {centre ? "Training centre" : "Trainee"}
    </span>
  );
}
