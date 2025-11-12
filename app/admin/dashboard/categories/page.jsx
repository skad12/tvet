// app/admin/dashboard/categories/page.jsx
"use client";

import CategoriesGrid from "@/components/admin/categories/CategoriesGrid";

export default function CategoriesPage() {
  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <CategoriesGrid />
      </div>
    </div>
  );
}
