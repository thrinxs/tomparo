"use client";

import { useSession, signOut } from "next-auth/react";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  Bell, ChevronDown, User, Settings,
  LogOut, Crown, Menu,
} from "lucide-react";

interface Props {
  onMenuClick: () => void;
}

export default function DashboardTopbar({ onMenuClick }: Props) {
  const { data: session } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const user = session?.user as any;
  const isPremium = user?.isPremium || false;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const initials = user?.name
    ?.split(" ")
    .map((n: string) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase() || "U";

  return (
    <div className="sticky top-0 z-30 border-b border-white/5 bg-slate-950/80 backdrop-blur-xl">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6">

        {/* Left — hamburger + welcome */}
        <div className="flex items-center gap-3">
          {/* Hamburger — mobile only */}
          <button
            onClick={onMenuClick}
            className="lg:hidden rounded-xl border border-white/10 bg-white/5 p-2 text-slate-400 hover:text-white hover:bg-white/10 transition"
          >
            <Menu className="h-5 w-5" />
          </button>

          {/* Welcome text */}
          <h1 className="text-sm font-medium text-slate-400">
            Welcome back,{" "}
            <span className="text-white">{user?.name?.split(" ")[0] || "there"}</span>
          </h1>
        </div>

        {/* Right — Actions */}
        <div className="flex items-center gap-2 sm:gap-3">

          {/* Notifications */}
          <button className="relative rounded-xl border border-white/5 bg-white/5 p-2.5 text-slate-400 transition hover:bg-white/10 hover:text-white">
            <Bell className="h-4 w-4" />
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500" />
          </button>

          {/* User Menu */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex items-center gap-2 sm:gap-3 rounded-xl border border-white/5 bg-white/5 px-2 sm:px-3 py-2 transition hover:bg-white/10"
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-cyan-400 text-xs font-semibold text-white shrink-0">
                {initials}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-xs font-medium text-white">{user?.name || "User"}</p>
                <p className="text-xs text-slate-500">{isPremium ? "Premium" : "Free Plan"}</p>
              </div>
              <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-full mt-2 w-64 rounded-2xl border border-white/10 bg-slate-900/95 p-2 shadow-2xl backdrop-blur-xl">
                <div className="border-b border-white/5 p-3">
                  <p className="text-sm font-medium text-white">{user?.name || "User"}</p>
                  <p className="mt-0.5 text-xs text-slate-500">{user?.email}</p>
                  <div className="mt-2">
                    {isPremium ? (
                      <div className="inline-flex items-center gap-1 rounded-full border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-400">
                        <Crown className="h-3 w-3" /> Premium
                      </div>
                    ) : (
                      <div className="inline-flex items-center gap-1 rounded-full border border-slate-700 bg-slate-800 px-2 py-0.5 text-xs font-medium text-slate-400">
                        Free Plan
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-1">
                  <Link
                    href="/dashboard/settings"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-300 transition hover:bg-white/5 hover:text-white"
                  >
                    <User className="h-4 w-4" /> Profile
                  </Link>
                  <Link
                    href="/dashboard/settings"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-300 transition hover:bg-white/5 hover:text-white"
                  >
                    <Settings className="h-4 w-4" /> Settings
                  </Link>
                  {!isPremium && (
                    <Link
                      href="/pricing"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-amber-400 transition hover:bg-amber-500/10"
                    >
                      <Crown className="h-4 w-4" /> Upgrade to Premium
                    </Link>
                  )}
                </div>

                <div className="border-t border-white/5 p-1">
                  <button
                    onClick={() => signOut({ callbackUrl: "/" })}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-red-400 transition hover:bg-red-500/10"
                  >
                    <LogOut className="h-4 w-4" /> Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
