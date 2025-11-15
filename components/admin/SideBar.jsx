// "use client";

// import { useState } from "react";
// import Link from "next/link";
// import { usePathname } from "next/navigation";
// import {
//   LayoutDashboard,
//   Ticket,
//   Users,
//   Tags,
//   Settings,
//   ChevronLeft,
//   ChevronRight,
// } from "lucide-react";

// const navItems = [
//   {
//     name: "Analytics",
//     href: "/admin/dashboard/analytics",
//     icon: LayoutDashboard,
//   },
//   { name: "Tickets", href: "/admin/dashboard/tickets", icon: Ticket },
//   { name: "Agents", href: "/admin/dashboard/agents", icon: Users },
//   { name: "Categories", href: "/admin/dashboard/categories", icon: Tags },
//   { name: "Settings", href: "/admin/dashboard/settings", icon: Settings },
//   { name: "Logout", href: "/", icon: Ticket },
// ];

// export default function Sidebar() {
//   const [collapsed, setCollapsed] = useState(false);
//   const pathname = usePathname();

//   return (
//     <aside
//       className={`fixe left-0 top-0 min-h-screen bg-white text-slate-800 flex flex-col justify-between transition-all duration-300 shadow-lg z-40 ${
//         collapsed ? "w-20" : "w-64"
//       }`}
//     >
//       {/* Top Logo / Toggle */}
//       <div>
//         <div className="flex items-center justify-between p-4 pb-5 border-b border-slate-200">
//           {!collapsed && (
//             <h2 className="text-lg font-semibold text-gray-800 tracking-tight">
//               TVET Support
//             </h2>
//           )}

//           <button
//             onClick={() => setCollapsed((s) => !s)}
//             aria-expanded={!collapsed}
//             aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
//             className="p-2 rounded hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-200"
//           >
//             {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
//           </button>
//         </div>

//         {/* Nav links */}
//         <div>
//           <nav className="mt-4 space-y-1 ">
//             {navItems.map((item) => {
//               const Icon = item.icon;
//               const isActive =
//                 pathname === item.href || pathname?.startsWith(item.href + "/");

//               // link base classes
//               const baseClasses =
//                 "flex items-center gap-3 px-4 py-2 text-slate-200 rounded-xs transition";

//               // when collapsed we center icons and reduce padding
//               const collapsedClasses = collapsed
//                 ? "justify-center px-2 py-3"
//                 : "justify-start";

//               // active / inactive classes
//               const activeClasses = isActive
//                 ? "bg-blue-800 text-white"
//                 : "text-slate-800 hover:bg-blue-600 hover:text-white";

//               return (
//                 <Link
//                   key={item.name}
//                   href={item.href}
//                   className={`${baseClasses} ${collapsedClasses} ${activeClasses}`}
//                   title={collapsed ? item.name : undefined} // tooltip when collapsed
//                 >
//                   <Icon size={20} />
//                   {!collapsed && <span className="text-md">{item.name}</span>}
//                 </Link>
//               );
//             })}
//           </nav>
//         </div>
//       </div>

//       {/* Footer area */}
//       <div className="border-t border-slate-200">
//         {!collapsed ? (
//           <div className="p-4 text-xs text-gray-800">
//             © {new Date().getFullYear()} TVET Support
//           </div>
//         ) : (
//           // when collapsed, show a small compact footer (optional)
//           <div className="p-2 flex items-center justify-center text-xs text-gray-600">
//             ©{new Date().getFullYear()}
//           </div>
//         )}
//       </div>
//     </aside>
//   );
// }

// "use client";

// import { useState } from "react";
// import Link from "next/link";
// import { usePathname } from "next/navigation";
// import {
//   LayoutDashboard,
//   Ticket,
//   Users,
//   Tags,
//   Settings,
//   ChevronLeft,
//   ChevronRight,
// } from "lucide-react";
// import Image from "next/image";
// import logo from "@/public/images/tvet-logo.png";
// import { useAuth } from "@/lib/AuthContext";

// const navItems = [
//   {
//     name: "Analytics",
//     href: "/admin/dashboard/analytics",
//     icon: LayoutDashboard,
//   },
//   { name: "Tickets", href: "/admin/dashboard/tickets", icon: Ticket },
//   { name: "Agents", href: "/admin/dashboard/agents", icon: Users },
//   { name: "Categories", href: "/admin/dashboard/categories", icon: Tags },
//   { name: "Settings", href: "/admin/dashboard/settings", icon: Settings },
//   { name: "Logout", href: "/", icon: Ticket },
// ];

// export default function Sidebar() {
//   const [collapsed, setCollapsed] = useState(false);
//   const pathname = usePathname();
//   const { signOut } = useAuth();

//   return (
//     <aside
//       role="navigation"
//       aria-label="Admin sidebar"
//       className={` left-0 top-0 min-h-screen bg-white text-slate-800 flex flex-col justify-between transition-[width] duration-300 shadow-lg z-50 overflow-hidden ${
//         collapsed ? "w-20" : "w-64"
//       }`}
//     >
//       {/* Top: Logo + Toggle */}
//       <div>
//         <div className="flex items-center justify-between pt-3 pb-1.5 px-3 border-b border-slate-200">
//           <div className="flex items-center gap-3">
//             <Image
//               src={logo}
//               alt="Customer dashboard hero"
//               width={30}
//               height={30}
//               className="rounded object-cover"
//               priority
//             />

//             {!collapsed && (
//               <div>
//                 <h2 className="text-lg font-semibold text-slate-800 tracking-tight">
//                   TVET Support
//                 </h2>
//                 <div className="text-xs text-slate-500">Admin</div>
//               </div>
//             )}
//           </div>

//           <button
//             onClick={() => setCollapsed((s) => !s)}
//             aria-expanded={!collapsed}
//             aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
//             className="pt-5 pb-1.5 px-2 rounded"
//             title={collapsed ? "Expand" : "Collapse"}
//           >
//             {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
//           </button>
//         </div>

//         {/* Navigation */}
//         <nav className="mt-4 px-1" aria-label="Main navigation">
//           <ul className="space-y-1">
//             {navItems.map((item) => {
//               const Icon = item.icon;
//               const isActive =
//                 pathname === item.href || pathname?.startsWith(item.href + "/");

//               const linkBase =
//                 "flex items-center gap-3 rounded-md transition-colors duration-200";
//               const collapsedLayout = collapsed
//                 ? "justify-center px-2 py-3"
//                 : "px-3 py-2";
//               const activeClasses = isActive
//                 ? "bg-blue-700 text-white"
//                 : "text-slate-700 hover:bg-slate-100";

//               const isLogout = item.name.toLowerCase() === "logout";

//               return (
//                 <li key={item.href}>
//                   {isLogout ? (
//                     <button
//                       type="button"
//                       onClick={() => signOut("/auth/login")}
//                       className={`${linkBase} ${collapsedLayout} text-slate-700 hover:bg-slate-100`}
//                       title={collapsed ? item.name : undefined}
//                     >
//                       <Icon size={18} aria-hidden />
//                       {!collapsed && (
//                         <span className="text-sm">{item.name}</span>
//                       )}
//                     </button>
//                   ) : (
//                     <Link
//                       href={item.href}
//                       className={`${linkBase} ${collapsedLayout} ${activeClasses}`}
//                       title={collapsed ? item.name : undefined}
//                     >
//                       <Icon size={18} aria-hidden />
//                       {!collapsed && (
//                         <span className="text-sm">{item.name}</span>
//                       )}
//                     </Link>
//                   )}
//                 </li>
//               );
//             })}
//           </ul>
//         </nav>
//       </div>

//       {/* Footer */}
//       <div className="border-t border-slate-200">
//         {!collapsed ? (
//           <div className="p-4 text-xs text-slate-600">
//             © {new Date().getFullYear()} TVET Support
//           </div>
//         ) : (
//           <div className="p-2 flex items-center justify-center text-xs text-slate-600">
//             ©{new Date().getFullYear()}
//           </div>
//         )}
//       </div>
//     </aside>
//   );
// }

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
  // { name: "Categories", href: "/admin/dashboard/categories", icon: Tags },
  { name: "Settings", href: "/admin/dashboard/settings", icon: Settings },
  // Keep Logout here — will be rendered as a button
  { name: "Logout", href: "/", icon: LogOut, isLogout: true },
];

export default function Sidebar() {
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
      signOut();
    } catch (err) {
      // fallback: clear client storage and redirect
      console.error("Sign out failed:", err);
      try {
        localStorage.removeItem("user");
        localStorage.removeItem("token");
      } catch (e) {}
      window.location.href = "/";
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
