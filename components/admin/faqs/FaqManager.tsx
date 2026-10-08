"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { FiEdit2, FiPlus, FiSearch, FiTrash2, FiX } from "react-icons/fi";
import { toast } from "sonner";

import api from "@/lib/axios";
import { apiErrorMessage } from "@/lib/apiError";
import { landing } from "@/components/ui/landingStyles";

type Faq = { id: string; category: string; question: string; answer: string };
type Draft = { id?: string; category: string; question: string; answer: string };

const EMPTY_DRAFT: Draft = { category: "", question: "", answer: "" };

/**
 * Admin management of the FAQs the support AI answers from. Filing an FAQ
 * under one of the widget's topics matters: the AI weighs FAQs in the topic a
 * trainee picked first.
 */
export default function FaqManager() {
  const [faqs, setFaqs] = useState<Faq[]>([]);
  const [topics, setTopics] = useState<string[]>([]);
  const [otherCategories, setOtherCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [topicFilter, setTopicFilter] = useState("all");

  const [draft, setDraft] = useState<Draft | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const [faqRes, catRes] = await Promise.all([
        api.get("/get-all-faqs/"),
        api.get("/faqs/categories/").catch(() => null),
      ]);
      setFaqs(Array.isArray(faqRes?.data) ? faqRes.data.filter((f) => f?.id) : []);
      setTopics(catRes?.data?.topics ?? []);
      setOtherCategories(catRes?.data?.other ?? []);
    } catch (err) {
      setLoadError(apiErrorMessage(err, "Could not load FAQs"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const categoryOptions = useMemo(
    () => Array.from(new Set([...topics, ...otherCategories, "general"])),
    [topics, otherCategories]
  );

  const shown = useMemo(() => {
    const q = search.trim().toLowerCase();
    return faqs.filter((f) => {
      if (topicFilter !== "all" && f.category !== topicFilter) return false;
      if (!q) return true;
      return [f.question, f.answer, f.category].some((v) => (v ?? "").toLowerCase().includes(q));
    });
  }, [faqs, search, topicFilter]);

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
      if (body.category && !categoryOptions.includes(body.category)) {
        setOtherCategories((c) => [...c, body.category]);
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
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className={landing.eyebrow}>Knowledge base</p>
          <h1 className={landing.title}>FAQs</h1>
          <p className={landing.subtitle}>
            The support AI answers trainees from these. File each one under the topic trainees pick in
            the chat, and it is weighed first for them.
          </p>
        </div>
        <button type="button" onClick={() => openEditor()} className={`${landing.btnPrimary} inline-flex items-center gap-2`}>
          <FiPlus /> Add FAQ
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-0 flex-1 basis-60">
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
        <select
          value={topicFilter}
          onChange={(e) => setTopicFilter(e.target.value)}
          aria-label="Filter by topic"
          className={`${landing.select} w-full sm:w-auto`}
        >
          <option value="all">All topics</option>
          {categoryOptions.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      <p className="text-xs text-muted">
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
            <li key={faq.id} className={`${landing.card} p-4`}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <span className={`${landing.badge} mb-2 border border-blue-100 bg-blue-50 text-blue-700`}>
                    {faq.category || "general"}
                  </span>
                  <h3 className="font-semibold text-foreground">{faq.question}</h3>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-muted">{faq.answer}</p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <button
                    type="button"
                    onClick={() => openEditor(faq)}
                    className={`${landing.btnGhost} inline-flex items-center gap-1`}
                    aria-label={`Edit FAQ: ${faq.question}`}
                  >
                    <FiEdit2 /> Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(faq)}
                    disabled={deletingId === faq.id}
                    className={`${landing.btnGhost} inline-flex items-center gap-1 text-red-600 disabled:opacity-50`}
                    aria-label={`Delete FAQ: ${faq.question}`}
                  >
                    <FiTrash2 /> {deletingId === faq.id ? "Deleting…" : "Delete"}
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {draft && (
        <div className={landing.modalOverlay} role="dialog" aria-modal="true" aria-label={draft.id ? "Edit FAQ" : "Add FAQ"}>
          <div className={landing.modalBackdrop} onClick={() => !saving && setDraft(null)} />
          <form onSubmit={save} className={`${landing.modal} max-h-[90dvh] overflow-y-auto`}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">{draft.id ? "Edit FAQ" : "Add FAQ"}</h2>
              <button type="button" onClick={() => setDraft(null)} disabled={saving} aria-label="Close" className="rounded-full p-1 text-slate-500 hover:bg-slate-100">
                <FiX />
              </button>
            </div>

            <label className={landing.label} htmlFor="faq-category">
              Topic
            </label>
            <input
              id="faq-category"
              list="faq-category-options"
              value={draft.category}
              onChange={(e) => setDraft({ ...draft, category: e.target.value })}
              placeholder="Pick a topic, or type a new one"
              className={`${landing.input} mb-1`}
            />
            <datalist id="faq-category-options">
              {categoryOptions.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
            <p className="mb-3 text-[11px] text-muted">Blank files it under &ldquo;general&rdquo;.</p>

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
      )}
    </div>
  );
}
