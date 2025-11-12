// components/categories/AddCategoryModal.jsx
"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import api from "@/lib/axios";

export default function AddCategoryModal({
  open = false,
  onClose = () => {},
  onAdded = () => {},
}) {
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!open) return null;

  async function submit(e) {
    e.preventDefault();
    if (!title.trim()) {
      setError("Please provide a category title");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      // try to POST to your categories endpoint (adjust endpoint if needed)
      const res = await api.post("/categories", {
        title: title.trim(),
        description: desc.trim(),
      });
      const newCat = res?.data ?? {
        id: `local-${Date.now()}`,
        title: title.trim(),
        description: desc.trim(),
      };
      onAdded(newCat);
      setTitle("");
      setDesc("");
    } catch (err) {
      console.error("Failed to create category", err);
      setError(err?.response?.data?.message || "Failed to create category");
    } finally {
      setLoading(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-60 flex items-center justify-center"
    >
      <div onClick={onClose} className="absolute inset-0 bg-black/40" />
      <motion.div
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="relative bg-white w-full max-w-md p-6 rounded-lg shadow-lg"
      >
        <h4 className="text-lg font-semibold mb-3">Add Category</h4>

        <form onSubmit={submit} className="space-y-3">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title"
            className="w-full px-3 py-2 rounded border border-slate-200 "
          />
          <textarea
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            placeholder="Short description (optional)"
            className="w-full border border-slate-200 px-3 py-2 rounded"
            rows={3}
          />

          {error && <div className="text-red-600 text-sm">{error}</div>}

          <div className="flex items-center gap-3 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded border border-slate-400"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 rounded bg-blue-600 text-white"
            >
              {loading ? "Saving..." : "Create"}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
