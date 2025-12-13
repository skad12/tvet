"use client";

import NavBar from "@/components/NavBar";
import Footer from "@/components/Footer";
import LoginForm from "@/components/LoginForm";

export default function AdminLoginPage() {
  return (
    <>
      <NavBar />
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-12">
        <LoginForm />
      </div>
      <Footer />
    </>
  );
}
