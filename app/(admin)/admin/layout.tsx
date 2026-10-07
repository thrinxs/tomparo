"use client";

// Note: metadata export must be in a server component
// favicon is served automatically from app/favicon.ico

import { useState } from "react";
import AdminSidebar from "@/components/layout/AdminSidebar";
import AdminDashboardToggle from "@/components/admin/AdminDashboardToggle";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-950">
      <AdminSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onMenuClick={() => setSidebarOpen(true)}
      />

      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/60 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="lg:pl-64">
        <main className="min-h-screen p-4 sm:p-6 lg:p-8 pb-24">
          {children}
        </main>
      </div>

      <AdminDashboardToggle />
    </div>
  );
}
