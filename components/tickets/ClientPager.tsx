"use client";

import { useState } from "react";

/** Page through a list already in memory (the agent and super agent queues). */
export function usePaged<T>(items: T[], size = 10) {
  const [requested, setPage] = useState(1);
  const pages = Math.max(1, Math.ceil(items.length / size));
  // Clamped, so switching to a shorter tab never lands on an empty page.
  const page = Math.min(requested, pages);
  return {
    items: items.slice((page - 1) * size, page * size),
    page,
    pages,
    total: items.length,
    from: items.length ? (page - 1) * size + 1 : 0,
    to: Math.min(page * size, items.length),
    setPage: (n: number) => setPage(Math.min(Math.max(1, n), pages)),
  };
}

export default function ClientPager({ page, pages, total, from, to, setPage }: ReturnType<typeof usePaged<unknown>>) {
  if (pages <= 1) return null;
  const btn = "inline-flex h-8 min-w-8 items-center justify-center rounded-lg border border-border px-2.5 text-sm font-medium text-foreground transition hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-40";
  return (
    <nav aria-label="Ticket pages" className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3">
      <span className="text-xs text-muted">
        {from}–{to} of {total}
      </span>
      <div className="flex items-center gap-1.5">
        <button type="button" onClick={() => setPage(page - 1)} disabled={page <= 1} className={btn}>
          ‹ Prev
        </button>
        <span className="px-1 text-sm tabular-nums text-muted" aria-live="polite">
          {page} / {pages}
        </span>
        <button type="button" onClick={() => setPage(page + 1)} disabled={page >= pages} className={btn}>
          Next ›
        </button>
      </div>
    </nav>
  );
}
