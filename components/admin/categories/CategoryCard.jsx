// components/categories/CategoryCard.jsx
"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { TbTag } from "react-icons/tb";
// optional: use any icon library you prefer

export default function CategoryCard({ category, count = 0 }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-lg border shadow-sm p-6 flex flex-col justify-between"
    >
      <div>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-blue-600/80 mt-1" />
            <h3 className="text-lg font-semibold text-slate-800">
              {category.title}
            </h3>
          </div>

          <div className="inline-flex items-center">
            <span className="text-xs bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full">
              {count}
            </span>
          </div>
        </div>

        <p className="text-sm text-slate-500 mt-3">
          {category.description ?? "Questions about this topic."}
        </p>
      </div>

      <div className="mt-4">
        <Link
          href={`/admin/dashboard/tickets?category=${category.id}`}
          className="inline-flex items-center gap-2 w-full justify-center border rounded-md px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
        >
          <TbTag />
          View Tickets
        </Link>
      </div>
    </motion.div>
  );
}
