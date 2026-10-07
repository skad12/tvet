"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { FiEdit2, FiHelpCircle, FiPlus, FiSearch, FiTrash2, FiX } from "react-icons/fi";
import { toast } from "sonner";

import api from "@/lib/axios";
import { apiErrorMessage } from "@/lib/apiError";
import { landing } from "@/components/ui/landingStyles";

type Faq = { id: string; category: string; question: string; answer: string };
type Draft = { id?: string; category: string; question: string; answer: string };

const EMPTY_DRAFT: Draft = { category: "", question: "", answer: "" };

/**
 * Admin management of the FAQs the support AI answers from: a question and its
 * answer. An existing FAQ keeps whatever category it was filed under; new
 * ones are filed as general.
 */
export default function FaqManager() {
  const [faqs, setFaqs] = useState<Faq[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [search, setSearch] = useState("");

  const [draft, setDraft] = useState<Draft | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const faqRes = await api.get("/get-all-faqs/");
      setFaqs(Array.isArray(faqRes?.data) ? faqRes.data.filter((f) => f?.id) : []);
    } catch (err) {
      setLoadError(apiErrorMessage(err, "Could not load FAQs"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const shown = useMemo(() => {
    const q = search.trim().toLowerCase();
    return faqs.filter((f) => {
      if (!q) return true;
      return [f.question, f.answer].some((v) => (v ?? "").toLowerCase().includes(q));
    });
  }, [faqs, search]);

  function openEditor(faq?: Faq) {
    setFormError(null);
    setDraft(faq ? { ...faq } : { ...EMPTY_DRAFT });
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!draft) return;
    const body = {
      category: draft.category.trim(),
      question: draft.question.trim(),
      answer: draft.answer.trim(),
    };
    if (!body.question || !body.answer) {
      setFormError("Question and answer are both required.");
      return;
    }

    setSaving(true);
    setFormError(null);
    try {
      if (draft.id) {
        const res = await api.put(`/faqs/${draft.id}/`, body);
        const saved: Faq = res.data.faq;
        setFaqs((list) => list.map((f) => (f.id === saved.id ? saved : f)));
        toast.success("FAQ updated");
      } else {
        const res = await api.post("/faqs/create/", body);
        const saved: Faq = res.data.faq;
        setFaqs((list) => [saved, ...list]);
        toast.success("FAQ added");
      }
      setDraft(null);
    } catch (err) {
      setFormError(apiErrorMessage(err, "Could not save the FAQ"));
    } finally {
      setSaving(false);
    }
  }

  async function remove(faq: Faq) {
    if (!window.confirm(`Delete this FAQ?\n\n"${faq.question}"\n\nThe AI will stop using it straight away.`)) {
      return;
    }
    setDeletingId(faq.id);
    try {
      await api.delete(`/faqs/${faq.id}/delete/`);
      setFaqs((list) => list.filter((f) => f.id !== faq.id));
      toast.success("FAQ deleted");
    } catch (err) {
      toast.error(apiErrorMessage(err, "Could not delete the FAQ"));
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-600">Knowledge base</p>
          <h1 className="mt-1 inline-flex items-center gap-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            <FiHelpCircle className="h-7 w-7 text-blue-600" aria-hidden /> FAQs
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-muted">
            The questions trainees ask, with the answers the support AI gives from them.
          </p>
        </div>
        <button
          type="button"
          onClick={() => openEditor()}
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-3.5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
        >
          <FiPlus /> Add FAQ
        </button>
      </div>

      <section className="rounded-2xl border border-border bg-card shadow-sm">
      <div className="flex flex-wrap items-center gap-2 border-b border-border p-4">
        <div className="relative min-w-0 flex-1">
          <FiSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search questions and answers"
            aria-label="Search FAQs"
            className={`${landing.input} pl-9`}
          />
        </div>
      </div>

      <div className="p-4">
      <p className="mb-3 text-xs text-muted">
        {loading ? "Loading…" : `${shown.length} of ${faqs.length} FAQ${faqs.length === 1 ? "" : "s"}`}
      </p>

      {loadError ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {loadError}{" "}
          <button type="button" onClick={load} className="font-semibold underline">
            Try again
          </button>
        </div>
      ) : !loading && shown.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-sm text-muted">
          {faqs.length === 0
            ? "No FAQs yet. Add the questions trainees ask most, and the AI will start answering from them."
            : "No FAQs match your search."}
        </div>
      ) : (
        <ul className="space-y-3">
          {shown.map((faq) => (
            <li key={faq.id} className="rounded-2xl border border-border bg-card p-4 transition hover:border-blue-200">
              <div className="flex items-start justify-between gap-3">
                <h3 className="min-w-0 break-words pt-1 font-semibold text-foreground">{faq.question}</h3>
                <div className="flex shrink-0 gap-1.5 sm:gap-2">
                  <button
                    type="button"
                    onClick={() => openEditor(faq)}
                    className={`${landing.btnGhost} inline-flex items-center gap-1`}
                    aria-label={`Edit FAQ: ${faq.question}`}
                  >
                    <FiEdit2 /> <span className="hidden sm:inline">Edit</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(faq)}
                    disabled={deletingId === faq.id}
                    className={`${landing.btnGhost} inline-flex items-center gap-1 text-red-600 disabled:opacity-50`}
                    aria-label={`Delete FAQ: ${faq.question}`}
                  >
                    <FiTrash2 /> <span className="hidden sm:inline">{deletingId === faq.id ? "Deleting…" : "Delete"}</span>
                  </button>
                </div>
              </div>
              <p className="mt-1.5 whitespace-pre-wrap break-words text-sm text-muted">{faq.answer}</p>
            </li>
          ))}
        </ul>
      )}

      </div>
      </section>

      {draft && typeof document !== "undefined" && createPortal(
        <div className={landing.modalOverlay} role="dialog" aria-modal="true" aria-label={draft.id ? "Edit FAQ" : "Add FAQ"}>
          <div className={landing.modalBackdrop} onClick={() => !saving && setDraft(null)} />
          <form onSubmit={save} className={`${landing.modal} max-h-[90dvh] overflow-y-auto`}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">{draft.id ? "Edit FAQ" : "Add FAQ"}</h2>
              <button type="button" onClick={() => setDraft(null)} disabled={saving} aria-label="Close" className="rounded-full p-1 text-slate-500 hover:bg-slate-100">
                <FiX />
              </button>
            </div>

            <label className={landing.label} htmlFor="faq-question">
              Question
            </label>
            <input
              id="faq-question"
              value={draft.question}
              onChange={(e) => setDraft({ ...draft, question: e.target.value })}
              placeholder="How do I check my application status?"
              className={`${landing.input} mb-3`}
              required
            />

            <label className={landing.label} htmlFor="faq-answer">
              Answer
            </label>
            <textarea
              id="faq-answer"
              value={draft.answer}
              onChange={(e) => setDraft({ ...draft, answer: e.target.value })}
              rows={6}
              placeholder="The answer the AI should give. Include the specific dates, amounts or steps."
              className={`${landing.textarea} mb-3`}
              required
            />

            {formError && <p className="mb-3 text-sm text-red-600">{formError}</p>}

            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setDraft(null)} disabled={saving} className={landing.btnSecondary}>
                Cancel
              </button>
              <button type="submit" disabled={saving} className={`${landing.btnPrimary} disabled:opacity-50`}>
                {saving ? "Saving…" : draft.id ? "Save changes" : "Add FAQ"}
              </button>
            </div>
          </form>
        </div>
      , document.body)}
    </div>
  );
}
