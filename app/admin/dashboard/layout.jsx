"use client";

import Topbar from "@/components/admin/Topbar";
import Sidebar from "@/components/admin/SideBar";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useState } from "react";

export default function AdminLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <ProtectedRoute allowed={["admin"]}>
      <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
        {/* Mobile sidebar overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside
          className={`
            fixed md:sticky top-0 left-0 h-screen z-50
            transform transition-transform duration-300 ease-in-out
            ${
              sidebarOpen
                ? "translate-x-0"
                : "-translate-x-full md:translate-x-0"
            }
          `}
        >
          <Sidebar onClose={() => setSidebarOpen(false)} />
        </aside>

        {/* Main content area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Topbar with mobile menu button */}
          <Topbar onSidebarOpen={() => setSidebarOpen(!sidebarOpen)} />

          {/* Scrollable content */}
          <main className="flex-1 overflow-y-auto">
            <div className="p-4 md:p-6">{children}</div>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
