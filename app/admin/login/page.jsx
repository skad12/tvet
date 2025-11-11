
"use client";

import NavBar from "@/components/NavBar";
import Footer from "@/components/Footer";
import AdminLoginForm from "@/components/admin/AdminLoginForm";

export default function AdminLoginPage() {
  return (
    <>
      <NavBar />
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-12">
        <AdminLoginForm />
      </div>
      <Footer />
    </>
  );
}
