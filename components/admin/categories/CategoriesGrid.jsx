// components/categories/CategoriesGrid.jsx
"use client";

import { useEffect, useState } from "react";
import CategoryCard from "./CategoryCard";
import AddCategoryModal from "./AddCategoryModal";
import { motion } from "framer-motion";
import api from "@/lib/axios";

export default function CategoriesGrid({
  initialCategories = null,
  showAdd = true,
}) {
  const [categories, setCategories] = useState(initialCategories ?? []);
  const [loading, setLoading] = useState(!initialCategories);
  const [error, setError] = useState(null);
  const [openAdd, setOpenAdd] = useState(false);
  const [counts, setCounts] = useState({}); // map categoryId -> count

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get("/get-all-category/");
        const data = Array.isArray(res.data)
          ? res.data
          : res.data?.categories ?? [];
        if (!mounted) return;
        setCategories(data);

        // Try fetch tickets and compute counts per category if /tickets is available
        try {
          const t = await api.get("/tickets");
          const all = Array.isArray(t.data) ? t.data : t.data?.tickets ?? [];
          const map = {};
          (all || []).forEach((tk) => {
            const id =
              tk.category_id ??
              tk.categoryId ??
              tk.category?.id ??
              tk.category_id;
            if (id) map[id] = (map[id] || 0) + 1;
          });
          if (mounted) setCounts(map);
        } catch (e) {
          // tickets fetch failed — ignore (counts remain empty)
          console.warn("Failed to fetch tickets for counts:", e?.message || e);
        }
      } catch (err) {
        console.error("Failed to load categories", err);
        if (mounted) {
          setError("Failed to load categories");
          // fallback examples
          setCategories([
            {
              id: "enrollment",
              title: "Enrollment",
              description: "Questions about course enrollment and registration",
            },
            {
              id: "technical",
              title: "Technical Support",
              description: "Platform and technical issues",
            },
            {
              id: "billing",
              title: "Billing",
              description: "Payment and fee-related inquiries",
            },
          ]);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    if (!initialCategories) load();
    return () => (mounted = false);
  }, [initialCategories]);

  function handleAdded(newCat) {
    // Insert new category locally (optimistic)
    setCategories((s) => [newCat, ...s]);
    setOpenAdd(false);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">
            Ticket Categories
          </h1>
          <p className="text-sm text-slate-500">
            Organize support requests by topic
          </p>
        </div>

        {showAdd && (
          <div>
            <button
              onClick={() => setOpenAdd(true)}
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded shadow hover:opacity-95"
            >
              + Add Category
            </button>
          </div>
        )}
      </div>

      {error && <div className="text-red-600 mb-4">{error}</div>}

      <motion.div
        layout
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        {loading
          ? Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-40 bg-white rounded-lg shadow animate-pulse"
              />
            ))
          : categories.map((c) => (
              <CategoryCard key={c.id} category={c} count={counts[c.id] ?? 0} />
            ))}
      </motion.div>

      <AddCategoryModal
        open={openAdd}
        onClose={() => setOpenAdd(false)}
        onAdded={handleAdded}
      />
    </div>
  );
}
