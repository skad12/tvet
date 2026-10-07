"use client";

import { useState } from "react";
import { FiCheck, FiCopy } from "react-icons/fi";
import { toast } from "sonner";

import { ticketReference } from "@/components/tickets/SlaBadge";

async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Older browsers, or a page without clipboard permission.
    const area = document.createElement("textarea");
    area.value = text;
    area.setAttribute("readonly", "");
    area.style.position = "fixed";
    area.style.opacity = "0";
    document.body.appendChild(area);
    area.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(area);
    return ok;
  }
}

/**
 * A ticket's reference (#A1B2C3) that copies itself when clicked. It sits on
 * clickable cards, so the click stops here and does not open the ticket.
 */
export default function TicketRef({ ticket, className = "" }: { ticket: any; className?: string }) {
  const ref = ticketReference(ticket);
  const [copied, setCopied] = useState(false);
  if (!ref) return null;

  async function copy(e: React.MouseEvent | React.KeyboardEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (await copyText(ref)) {
      setCopied(true);
      toast.success(`Copied ${ref}`);
      window.setTimeout(() => setCopied(false), 1500);
    } else {
      toast.error("Couldn't copy the reference");
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && copy(e)}
      title={`Copy ${ref}`}
      aria-label={`Copy ticket reference ${ref}`}
      className={`group inline-flex shrink-0 items-center gap-1 rounded-md px-1 py-0.5 font-mono font-semibold transition-colors hover:bg-blue-50 hover:text-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 ${className}`}
    >
      {ref}
      {copied ? (
        <FiCheck className="h-3 w-3 text-emerald-600" aria-hidden />
      ) : (
        <FiCopy className="h-3 w-3 opacity-40 transition-opacity group-hover:opacity-100" aria-hidden />
      )}
    </button>
  );
}
