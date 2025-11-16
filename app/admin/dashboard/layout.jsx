import Topbar from "@/components/admin/Topbar";
import Sidebar from "@/components/admin/SideBar";
import ProtectedRoute from "@/components/ProtectedRoute";

export default function AdminLayout({ children }) {
  return (
    <ProtectedRoute allowed={["admin"]}>
      <div className="min-h-screen bg-slate-50 flex">
        {/* Hide sidebar on small screens for better readability */}
        <div className="hidden md:block">
          <Sidebar />
        </div>

        <div className="flex-1 ">
          <Topbar />
          {children}
        </div>
      </div>
    </ProtectedRoute>
  );
}
