"use client";

import { useSession, signOut } from "next-auth/react";
import { useState } from "react";
import Link from "next/link";
import {
  ChevronDown,
  LogOut,
  Settings,
  Building2,
  User,
  Bell,
} from "lucide-react";

export default function RecruiterTopbar() {
  const { data: session } = useSession();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const user = session?.user as any;
  const name = user?.name ?? "Recruiter";
  const email = user?.email ?? "";
  const role = user?.role as string | undefined;

  // Initials for avatar
  const initials = name
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const planNames: Record<string, string> = {
    RECRUITER_STARTER: "Starter",
    RECRUITER_GROWTH: "Growth",
    RECRUITER_BUSINESS: "Business",
    RECRUITER_ENTERPRISE: "Enterprise",
    RECRUITER_SCALE: "Scale",
    RECRUITER_CUSTOM: "Custom",
  };

  const planName = role ? planNames[role] : null;

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-white/5 bg-slate-950/80 px-8 backdrop-blur-xl">

      {/* Left — Page context */}
      <div className="flex items-center gap-2 text-sm text-slate-400">
        <Building2 className="h-4 w-4 text-purple-400" />
        <span>Recruiter Dashboard</span>
        {planName && (
          <>
            <span className="text-slate-700">·</span>
            <span className="text-purple-400 font-medium">{planName} Plan</span>
          </>
        )}
      </div>

      {/* Right — Actions + Avatar */}
      <div className="flex items-center gap-3">

        {/* Notification bell (placeholder) */}
        <button className="relative rounded-xl border border-white/10 bg-white/5 p-2 text-slate-400 transition hover:bg-white/10 hover:text-white">
          <Bell className="h-4 w-4" />
        </button>

        {/* User dropdown */}
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2 transition hover:bg-white/10"
          >
            {/* Avatar */}
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-600 text-xs font-bold text-white">
              {initials}
            </div>
            <div className="hidden text-left sm:block">
              <p className="text-sm font-medium text-white leading-none">
                {name}
              </p>
              <p className="text-xs text-slate-500 mt-0.5 leading-none">
                {email}
              </p>
            </div>
            <ChevronDown
              className={`h-4 w-4 text-slate-500 transition-transform ${
                dropdownOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {/* Dropdown menu */}
          {dropdownOpen && (
            <>
              {/* Backdrop */}
              <div
                className="fixed inset-0 z-10"
                onClick={() => setDropdownOpen(false)}
              />
              <div className="absolute right-0 top-full z-20 mt-2 w-52 rounded-2xl border border-white/10 bg-slate-900 p-1.5 shadow-xl">
                <Link
                  href="/recruiter/settings"
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm text-slate-300 transition hover:bg-white/5 hover:text-white"
                >
                  <Settings className="h-4 w-4" />
                  Settings
                </Link>
                <Link
                  href="/recruiter-pricing"
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm text-slate-300 transition hover:bg-white/5 hover:text-white"
                >
                  <Building2 className="h-4 w-4" />
                  Upgrade Plan
                </Link>
                <div className="my-1 border-t border-white/5" />
                <button
                  onClick={() => signOut({ callbackUrl: "/signin" })}
                  className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm text-red-400 transition hover:bg-red-500/10"
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}