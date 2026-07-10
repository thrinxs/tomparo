"use client";

import DashboardSidebar from "@/components/layout/DashboardSidebar";
import DashboardTopbar from "@/components/layout/DashboardTopbar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-950">
      <DashboardSidebar />
      <div className="pl-64">
        <DashboardTopbar />
        <main className="min-h-[calc(100vh-4rem)] p-8">{children}</main>
      </div>
    </div>
  );
}