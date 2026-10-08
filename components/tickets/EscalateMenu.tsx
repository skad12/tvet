"use client";

import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import api from "@/lib/axios";
import { toast } from "sonner";

export type EscalationCategory = { id: string; title: string };

type EscalateMenuProps = {
  onSelect: (category: EscalationCategory) => void;
  escalating?: boolean;
  disabled?: boolean;
  buttonClassName?: string;
  // Which edge of the button the menu lines up with by default. If that
  // would run off the screen the menu flips to the other side.
  align?: "left" | "right";
};

/**
 * The Escalate button, as a menu of the categories a ticket can be escalated
 * to. Categories come from the API's /get-all-category/ and are loaded the
 * first time the menu opens.
 */
export default function EscalateMenu({
  onSelect,
  escalating = false,
  disabled = false,
  buttonClassName = "",
  align = "left",
}: EscalateMenuProps) {
  const [open, setOpen] = useState(false);
  const [categories, setCategories] = useState<EscalationCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [side, setSide] = useState<"left" | "right">(align);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  // Keep the menu on screen: where the button sits depends on the layout
  // (it wraps to the left on phones), so measure once it is open.
  useLayoutEffect(() => {
    if (!open) {
      setSide(align);
      return;
    }
    const menu = menuRef.current;
    if (!menu) return;
    const { left, right } = menu.getBoundingClientRect();
    const margin = 8;
    if (side === "left" && right > window.innerWidth - margin) setSide("right");
    else if (side === "right" && left < margin) setSide("left");
  }, [open, side, align, loading, categories.length]);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent | TouchEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("touchstart", close);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("touchstart", close);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  async function toggle() {
    setOpen((was) => !was);
    if (categories.length || loading) return;
    setLoading(true);
    try {
      const res = await api.get("/get-all-category/");
      const list = Array.isArray(res?.data) ? res.data : [];
      setCategories(
        list
          .filter((c) => c?.id != null && c?.title)
          .map((c) => ({ id: String(c.id), title: String(c.title) }))
      );
    } catch {
      toast.error("Could not load categories");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (disabled || escalating) return;
          toggle();
        }}
        disabled={disabled || escalating}
        className={`inline-flex items-center gap-1 ${buttonClassName} ${
          escalating ? "cursor-not-allowed opacity-50" : ""
        }`}
        aria-label="Escalate ticket"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        {escalating ? "Escalating…" : "Escalate"}
        <svg className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 011.06.02L10 11.06l3.71-3.83a.75.75 0 111.08 1.04l-4.25 4.39a.75.75 0 01-1.08 0L5.21 8.27a.75.75 0 01.02-1.06z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {open && (
        <div
          ref={menuRef}
          role="menu"
          aria-label="Escalate to category"
          className={`absolute ${side === "right" ? "right-0" : "left-0"} top-full z-50 mt-2 max-h-72 w-72 max-w-[80vw] overflow-y-auto rounded-lg border border-slate-200 bg-white p-1 shadow-lg`}
        >
          <div className="px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
            Escalate to
          </div>
          {loading ? (
            <div className="px-2 py-3 text-center text-xs text-slate-500">
              Loading categories…
            </div>
          ) : categories.length === 0 ? (
            <div className="px-2 py-3 text-center text-xs text-slate-500">
              No categories set up yet
            </div>
          ) : (
            categories.map((category) => (
              <button
                key={category.id}
                type="button"
                role="menuitem"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setOpen(false);
                  onSelect(category);
                }}
                className="block w-full rounded-md px-2 py-2 text-left text-xs text-slate-700 hover:bg-slate-100 sm:text-sm"
              >
                {category.title}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
