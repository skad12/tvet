"use client";

import Topbar from "@/components/admin/Topbar";
import Sidebar from "@/components/admin/SideBar";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useState } from "react";

export default function AdminLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <ProtectedRoute allowed={["admin"]}>
      {/* The frame is exactly the screen's height and never moves: the
          sidebar and top bar stay put and only the content area scrolls.
          dvh follows mobile browser bars as they show and hide. */}
      <div className="flex h-dvh flex-col overflow-hidden app-shell md:flex-row">
        {/* Mobile sidebar overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside
          className={`
            fixed md:static top-0 left-0 h-dvh z-50 md:shrink-0
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
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          {/* Topbar with mobile menu button */}
          <Topbar onSidebarOpen={() => setSidebarOpen(!sidebarOpen)} />

          {/* Scrollable content */}
          <main className="app-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain">
            <div className="p-4 md:p-6">{children}</div>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
