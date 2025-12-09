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
  LogOut,
} from "lucide-react";
import Image from "next/image";
import logo from "@/public/images/tvet-logo.png";
import { useAuth } from "@/context/AuthContext"; // <-- adjust path if your AuthContext lives elsewhere

const navItems = [
  {
    name: "Analytics",
    href: "/admin/dashboard/analytics",
    icon: LayoutDashboard,
  },
  { name: "Tickets", href: "/admin/dashboard/tickets", icon: Ticket },
  { name: "Agents", href: "/admin/dashboard/agents", icon: Users },

  { name: "Settings", href: "/admin/dashboard/settings", icon: Settings },
  // Keep Logout here — will be rendered as a button
  { name: "Logout", href: "/", icon: LogOut, isLogout: true },
];

export default function Sidebar({ onClose }) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const { user, signOut } = useAuth();

  // set to true if you want a confirmation dialog before signing out
  const confirmOnSignOut = false;

  async function handleSignOut(e) {
    e.preventDefault();
    if (confirmOnSignOut) {
      const ok = window.confirm("Are you sure you want to sign out?");
      if (!ok) return;
    }

    try {
      // call context signOut (this should clear localStorage and redirect)
      signOut("/auth/login");
    } catch (err) {
      // fallback: clear client storage and redirect
      console.error("Sign out failed:", err);
      try {
        localStorage.removeItem("user");
        localStorage.removeItem("token");
      } catch (e) {}
      window.location.href = "/auth/login";
    }
  }

  return (
    <aside
      role="navigation"
      aria-label="Admin sidebar"
      className={` left-0 top-0 min-h-screen bg-white text-slate-800 flex flex-col justify-between transition-[width] duration-300 shadow-lg z-50 overflow-hidden ${
        collapsed ? "w-20" : "w-64"
      }`}
    >
      {/* Top: Logo + Toggle */}
      <div>
        <div className="flex items-center justify-between pt-3 pb-1.5 px-3 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <Image
              src={logo}
              alt="Customer dashboard hero"
              width={30}
              height={30}
              className="rounded object-cover"
              priority
            />

            {!collapsed && (
              <div>
                <h2 className="text-lg font-semibold text-slate-800 tracking-tight">
                  TVET Support
                </h2>
              </div>
            )}
          </div>

          <button
            onClick={() => setCollapsed((s) => !s)}
            aria-expanded={!collapsed}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="pt-5 pb-1.5 px-2 rounded"
            title={collapsed ? "Expand" : "Collapse"}
          >
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="mt-4 px-1" aria-label="Main navigation">
          <ul className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                pathname === item.href || pathname?.startsWith(item.href + "/");

              const linkBase =
                "flex items-center gap-3 rounded-md transition-colors duration-200";
              const collapsedLayout = collapsed
                ? "justify-center px-2 py-3"
                : "px-3 py-2";
              const activeClasses = isActive
                ? "bg-blue-700 text-white"
                : "text-slate-700 hover:bg-slate-100";

              // special-case Logout: render a button that calls signOut
              if (item.isLogout) {
                return (
                  <li key={item.name}>
                    <button
                      onClick={handleSignOut}
                      className={`${linkBase} ${collapsedLayout} ${activeClasses} w-full text-left`}
                      title={collapsed ? item.name : undefined}
                    >
                      <Icon size={18} aria-hidden />
                      {!collapsed && (
                        <span className="text-sm flex-1">{item.name}</span>
                      )}
                    </button>
                  </li>
                );
              }

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`${linkBase} ${collapsedLayout} ${activeClasses}`}
                    title={collapsed ? item.name : undefined}
                    onClick={() => {
                      // Close mobile menu on navigation
                      if (onClose && window.innerWidth < 768) {
                        onClose();
                      }
                    }}
                  >
                    <Icon size={18} aria-hidden />
                    {!collapsed && <span className="text-sm">{item.name}</span>}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>

      {/* Footer */}
      <div className="border-t border-slate-200">
        {!collapsed ? (
          <div className="p-4 text-xs text-slate-600">
            © {new Date().getFullYear()} TVET Support
          </div>
        ) : (
          <div className="p-2 flex items-center justify-center text-xs text-slate-600">
            ©{new Date().getFullYear()}
          </div>
        )}
      </div>
    </aside>
  );
}
