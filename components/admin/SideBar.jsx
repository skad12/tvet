"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Ticket,
  Users,
  Tags,
  Settings,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const navItems = [
  {
    name: "Analytics",
    href: "/admin/dashboard/analytics",
    icon: LayoutDashboard,
  },
  { name: "Tickets", href: "/admin/dashboard/tickets", icon: Ticket },
  { name: "Agents", href: "/admin/dashboard/agents", icon: Users },
  { name: "Categories", href: "/admin/dashboard/categories", icon: Tags },
  { name: "Settings", href: "/admin/dashboard/settings", icon: Settings },
  { name: "Logout", href: "/", icon: Ticket },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  return (
    <aside
      className={`fixe left-0 top-0 min-h-screen bg-white text-slate-800 flex flex-col justify-between transition-all duration-300 shadow-lg z-40 ${
        collapsed ? "w-20" : "w-64"
      }`}
    >
      {/* Top Logo / Toggle */}
      <div>
        <div className="flex items-center justify-between p-4 pb-5 border-b border-slate-200">
          {!collapsed && (
            <h2 className="text-lg font-semibold text-gray-800 tracking-tight">
              TVET Support
            </h2>
          )}

          <button
            onClick={() => setCollapsed((s) => !s)}
            aria-expanded={!collapsed}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="p-2 rounded hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-200"
          >
            {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
          </button>
        </div>

        {/* Nav links */}
        <div>
          <nav className="mt-4 space-y-1 ">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                pathname === item.href || pathname?.startsWith(item.href + "/");

              // link base classes
              const baseClasses =
                "flex items-center gap-3 px-4 py-2 text-slate-200 rounded-xs transition";

              // when collapsed we center icons and reduce padding
              const collapsedClasses = collapsed
                ? "justify-center px-2 py-3"
                : "justify-start";

              // active / inactive classes
              const activeClasses = isActive
                ? "bg-blue-800 text-white"
                : "text-slate-800 hover:bg-blue-600 hover:text-white";

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`${baseClasses} ${collapsedClasses} ${activeClasses}`}
                  title={collapsed ? item.name : undefined} // tooltip when collapsed
                >
                  <Icon size={20} />
                  {!collapsed && <span className="text-md">{item.name}</span>}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Footer area */}
      <div className="border-t border-slate-200">
        {!collapsed ? (
          <div className="p-4 text-xs text-gray-800">
            © {new Date().getFullYear()} TVET Support
          </div>
        ) : (
          // when collapsed, show a small compact footer (optional)
          <div className="p-2 flex items-center justify-center text-xs text-gray-600">
            ©{new Date().getFullYear()}
          </div>
        )}
      </div>
    </aside>
  );
}
