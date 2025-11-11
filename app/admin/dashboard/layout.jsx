import Topbar from "@/components/admin/Topbar";
import Sidebar from "@/components/admin/SideBar";

export default function SupportLayout({ children }) {
  return (
    <>
      <div className="min-h-screen bg-slate-50 flex">
        <Sidebar />
        <div className="flex-1">
          <Topbar />
          {children}
        </div>
      </div>
    </>
  );
}
