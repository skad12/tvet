"use client";

import React, { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

// try to use axios instance if available (safe require)
let api = null;
try {
  api = require("@/lib/axios").default;
} catch (e) {
  try {
    api = require("../../lib/axios").default;
  } catch {
    api = null;
  }
}

/** Normalizers */
function normalizeFromObject(obj) {
  const out = {};
  for (const [cat, items] of Object.entries(obj || {})) {
    if (!Array.isArray(items)) continue;
    out[cat] = items.map((it) => ({
      q: it.q ?? it.question ?? it.title ?? it.heading ?? "",
      a: it.a ?? it.answer ?? it.body ?? it.content ?? "",
      raw: it,
    }));
  }
  return out;
}

function normalizeFromArray(arr) {
  const out = {};
  for (const it of arr || []) {
    const category =
      it.category ??
      it.category_title ??
      it.category_name ??
      it.section ??
      "General";
    const q = it.q ?? it.question ?? it.title ?? it.heading ?? "";
    const a = it.a ?? it.answer ?? it.body ?? it.content ?? "";
    if (!out[category]) out[category] = [];
    out[category].push({ q, a, raw: it });
  }
  return out;
}

export default function FAQ() {
  const [faqData, setFaqData] = useState<Record<string, any[]> | undefined>(); // undefined until fetched
  const [activeCategory, setActiveCategory] = useState("");
  const [openIndex, setOpenIndex] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // fetch FAQs
  useEffect(() => {
    let mounted = true;
    const ac = new AbortController();

    async function load() {
      setLoading(true);
      setError(null);

      try {
        let data;
        if (api && typeof api.get === "function") {
          const res = await api.get("/get-all-faqs/", { signal: ac.signal });
          data = res?.data;
        } else {
          const base =
            typeof window !== "undefined"
              ? process.env.NEXT_PUBLIC_API_BASE
              : undefined;
          const endpoint = base
            ? `${base.replace(/\/$/, "")}/get-all-faqs/`
            : "/get-all-faqs/";
          const res = await fetch(endpoint, { signal: ac.signal });
          if (!res.ok) {
            const text = await res.text().catch(() => "");
            throw new Error(`Failed to load (${res.status}) ${text}`);
          }
          data = await res.json().catch(() => null);
        }

        if (!mounted) return;

        let normalized = {};
        if (!data) {
          normalized = {}; // empty — no fallback
        } else if (Array.isArray(data)) {
          normalized = normalizeFromArray(data);
        } else if (typeof data === "object") {
          const valuesAreArrays = Object.values(data).every((v) =>
            Array.isArray(v)
          );
          if (valuesAreArrays) normalized = normalizeFromObject(data);
          else
            normalized = normalizeFromArray(
              Array.isArray(data) ? data : [data]
            );
        } else {
          normalized = {};
        }

        if (mounted) {
          setFaqData(normalized);
          const keys = Object.keys(normalized);
          setActiveCategory((prev) =>
            prev && keys.includes(prev) ? prev : keys[0] ?? ""
          );
          setOpenIndex(null);
        }
      } catch (err) {
        const isCanceled =
          err?.name === "AbortError" ||
          err?.name === "CanceledError" ||
          err?.code === "ERR_CANCELED" ||
          err?.message === "canceled";
        if (isCanceled) return;
        console.error("Failed to load FAQs", err);
        if (mounted) {
          const message = err.message || "Failed to load FAQs";
          setError(message);
          toast.error(message);
          setFaqData({});
          setActiveCategory("");
          setOpenIndex(null);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();

    return () => {
      mounted = false;
      ac.abort();
    };
  }, []);

  const categories = useMemo(() => Object.keys(faqData || {}), [faqData]);

  const counts = useMemo(() => {
    const map = {};
    for (const k of categories) map[k] = faqData?.[k]?.length ?? 0;
    return map;
  }, [faqData, categories]);

  return (
    <section className="relative overflow-hidden rounded-4xl border border-slate-200 bg-white p-4 shadow-xl shadow-slate-950/5 md:p-6">
      <div className="pointer-events-none absolute -left-16 -top-16 h-40 w-40 rounded-full bg-blue-100/70 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 -right-16 h-48 w-48 rounded-full bg-cyan-100/70 blur-3xl" />

      <div className="relative mx-auto max-w-5xl text-center">
        <div className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-blue-700">
            Self-service help
          </p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-950 md:text-4xl">
            Frequently Asked Questions
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-slate-600">
            Find quick answers by category before opening a support ticket.
          </p>
        </div>

        {/* scroll container: header + tabs sticky */}
        <div className="h-[560px] overflow-hidden rounded-3xl border border-slate-200 bg-slate-50/80 text-left shadow-inner md:h-[460px]">
          {/* Sticky header */}
          <div className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
            <div className="flex items-center justify-between p-4">
              <h3 className="text-lg font-semibold text-slate-900">
                Frequently Asked Questions
              </h3>
              {/* <div className="text-sm text-slate-500">
                {loading
                  ? "…"
                  : `${categories.reduce(
                      (s, k) => s + (counts[k] || 0),
                      0
                    )} question${
                      categories.reduce((s, k) => s + (counts[k] || 0), 0) === 1
                        ? ""
                        : "s"
                    }`}
              </div> */}
            </div>

            {/* Tabs bar */}
            <div className="px-4 pb-3">
              <div
                role="tablist"
                aria-label="FAQ categories"
                className="flex gap-2 overflow-x-auto whitespace-nowrap px-1 py-1"
              >
                {loading ? (
                  <div className="text-sm text-slate-500 px-3 py-1">
                    Loading categories…
                  </div>
                ) : categories.length === 0 ? (
                  <div className="text-sm text-slate-500 px-3 py-1">
                    No categories
                  </div>
                ) : (
                  categories.map((cat) => {
                    const active = activeCategory === cat;
                    return (
                      <button
                        key={cat}
                        role="tab"
                        aria-selected={active}
                        onClick={() => {
                          setActiveCategory(cat);
                          setOpenIndex(null);
                        }}
                        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition ${
                          active
                            ? "bg-blue-600 text-white shadow shadow-blue-600/20"
                            : "bg-white border border-slate-200 text-slate-700 hover:border-blue-200 hover:bg-blue-50"
                        }`}
                      >
                        <span>{cat}</span>
                        <span
                          className={`inline-flex items-center justify-center rounded-full px-2 py-0.5 text-xs ${
                            active
                              ? "bg-white/20 text-white"
                              : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {counts[cat] ?? 0}
                        </span>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Content area */}
          <div className="h-[calc(100%-116px)] overflow-auto p-4 text-left">
            {loading ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-8 text-sm text-slate-500">
                Loading FAQs…
              </div>
            ) : error ? (
              <div className="rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-600">
                {error}
              </div>
            ) : categories.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-8 text-sm text-slate-500">
                No FAQs available.
              </div>
            ) : (faqData?.[activeCategory] || []).length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-8 text-sm text-slate-500">
                No FAQs found for this category.
              </div>
            ) : (
              <ul className="space-y-3">
                {(faqData?.[activeCategory] || []).map((item, idx) => (
                  <li
                    key={`${item.q ?? "q"}-${idx}`}
                    className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-blue-200 hover:shadow-md"
                  >
                    <div className="flex items-start justify-between">
                      <div className="min-w-0 text-left">
                        <button
                          onClick={() =>
                            setOpenIndex(openIndex === idx ? null : idx)
                          }
                          className="w-full text-left"
                          aria-expanded={openIndex === idx}
                        >
                          <div className="flex items-center justify-between">
                            <div className="font-semibold text-slate-900">
                              {item.q || "Untitled question"}
                            </div>
                            <div className="ml-4 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xl text-slate-600">
                              {openIndex === idx ? "−" : "+"}
                            </div>
                          </div>
                        </button>

                        {openIndex === idx && (
                          <div className="mt-3 border-t border-slate-100 pt-3 text-sm leading-relaxed text-slate-600">
                            {item.a || "No answer provided."}
                          </div>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
