"use client";

import React, { useEffect, useMemo, useState } from "react";

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
  const [faqData, setFaqData] = useState(); // undefined until fetched
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
          setError(err.message || "Failed to load FAQs");
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
    <section className="bg-slate-50 py-16">
      <div className="max-w-4xl mx-auto px-4 text-center">
        {/* scroll container: header + tabs sticky */}
        <div className="h-[520px] md:h-[420px] overflow-auto">
          {/* Sticky header */}
          <div className="sticky top-0 z-30 bg-slate-50 border-b border-slate-200">
            <div className="flex items-center justify-between p-4">
              <h2 className="text-2xl font-bold text-slate-800">
                Frequently Asked Questions
              </h2>
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
                            ? "bg-slate-900 text-white shadow"
                            : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        <span>{cat}</span>
                        <span className="inline-flex items-center justify-center px-2 py-0.5 text-xs rounded-full bg-slate-100 text-slate-700">
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
          <div className="p-4 text-left">
            {loading ? (
              <div className="py-8 text-sm text-slate-500">Loading FAQs…</div>
            ) : error ? (
              <div className="p-4 text-sm text-red-600">{error}</div>
            ) : categories.length === 0 ? (
              <div className="py-8 text-sm text-slate-500">
                No FAQs available.
              </div>
            ) : (faqData?.[activeCategory] || []).length === 0 ? (
              <div className="py-8 text-sm text-slate-500">
                No FAQs found for this category.
              </div>
            ) : (
              <ul className="space-y-3">
                {(faqData?.[activeCategory] || []).map((item, idx) => (
                  <li
                    key={`${item.q ?? "q"}-${idx}`}
                    className="bg-white rounded-lg p-4 border border-slate-200 shadow-sm"
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
                            <div className="font-medium text-slate-800 truncate">
                              {item.q || "Untitled question"}
                            </div>
                            <div className="text-xl text-slate-500 ml-4">
                              {openIndex === idx ? "−" : "+"}
                            </div>
                          </div>
                        </button>

                        {openIndex === idx && (
                          <div className="mt-3 text-sm text-slate-600">
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
