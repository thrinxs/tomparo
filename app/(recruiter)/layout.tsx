"use client";

import RecruiterSidebar from "@/components/layout/RecruiterSidebar";
import RecruiterTopbar from "@/components/layout/RecruiterTopbar";

export default function RecruiterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-950">
      <RecruiterSidebar />
      <div className="pl-64">
        <RecruiterTopbar />
        <main className="min-h-[calc(100vh-4rem)] p-8">{children}</main>
      </div>
    </div>
  );
}