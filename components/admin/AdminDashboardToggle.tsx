"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Shield, Users, Briefcase } from "lucide-react";

const tabs = [
  { href: "/admin", label: "Admin", icon: Shield, color: "bg-red-600" },
  { href: "/jobseeker_dashboard", label: "Job Seeker", icon: Users, color: "bg-blue-600" },
  { href: "/recruiter_dashboard", label: "Recruiter", icon: Briefcase, color: "bg-purple-600" },
];

export default function AdminDashboardToggle() {
  const pathname = usePathname();

  const active =
    pathname.startsWith("/jobseeker_dashboard") ? "/jobseeker_dashboard"
    : pathname.startsWith("/recruiter_dashboard") ? "/recruiter_dashboard"
    : "/admin";

  return (
    <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2">
      <div className="flex items-center gap-1 rounded-2xl border border-white/10 bg-slate-900/95 p-1.5 shadow-2xl backdrop-blur-xl">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = active === tab.href;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all ${
                isActive
                  ? `${tab.color} text-white shadow-lg`
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
