"use client";

import Logo from "@/components/Logo";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  LayoutDashboard, Users, BarChart3, Settings,
  Shield, CreditCard, FileText, Menu, X, LogOut, User,
  Bell, ChevronDown,
} from "lucide-react";
import { useState } from "react";

const navItems = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/subscriptions", label: "Subscriptions", icon: CreditCard },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/admin/staff", label: "Staff", icon: Shield },
  { href: "/admin/content", label: "Content", icon: FileText },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onMenuClick: () => void;
}

export default function AdminSidebar({ isOpen, onClose, onMenuClick }: Props) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const user = session?.user as any;
  const name = user?.name ?? "Admin";
  const email = user?.email ?? "";
  const initials = name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);

  return (
    <>
      {/* Mobile topbar */}
      <div className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-white/5 bg-slate-950/90 px-4 backdrop-blur-xl lg:hidden">
        <button
          onClick={onMenuClick}
          className="rounded-xl border border-white/10 bg-white/5 p-2 text-slate-400 hover:text-white transition"
        >
          <Menu className="h-5 w-5" />
        </button>

        <Logo size="md" href="/admin" />

        {/* Avatar dropdown — mobile */}
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-600 text-xs font-bold text-white"
          >
            {initials}
          </button>
          {dropdownOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setDropdownOpen(false)} />
              <div className="absolute right-0 top-full z-20 mt-2 w-48 rounded-2xl border border-white/10 bg-slate-900 p-1.5 shadow-xl">
                <div className="px-3 py-2 border-b border-white/5 mb-1">
                  <p className="text-xs font-medium text-white truncate">{name}</p>
                  <p className="text-xs text-slate-500 truncate">{email}</p>
                </div>
                <button
                  onClick={() => signOut({ callbackUrl: "/admin-login" })}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 transition"
                >
                  <LogOut className="h-4 w-4" />Sign Out
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Sidebar */}
      <aside className={`
        fixed left-0 top-0 z-40 flex h-screen w-64 flex-col
        border-r border-white/5 bg-slate-950/95 backdrop-blur-xl
        transition-transform duration-300 ease-in-out
        ${isOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0
      `}>

        {/* Logo + close */}
        <div className="flex items-center justify-between border-b border-white/5 px-4 py-3">
          <Logo size="md" href="/admin" />
          <button
            onClick={onClose}
            className="lg:hidden rounded-xl border border-white/10 bg-white/5 p-1.5 text-slate-400 hover:text-white transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Admin badge */}
        <div className="px-4 pt-3">
          <div className="flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-1.5">
            <Shield className="h-3.5 w-3.5 text-red-400" />
            <span className="text-xs font-semibold text-red-400">
              Platform Admin
            </span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-0.5 overflow-y-auto p-4">
          {navItems.map((item) => {
            const isActive = item.exact
              ? pathname === item.href
              : pathname.startsWith(item.href) && item.href !== "/admin";
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ${
                  isActive
                    ? "bg-red-500/10 text-red-400"
                    : "text-slate-400 hover:bg-white/5 hover:text-white"
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? "text-red-400" : ""}`} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* User footer */}
        <div className="border-t border-white/5 p-4">
          <div className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.02] p-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-600 text-xs font-bold text-white">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{name}</p>
              <p className="text-xs text-slate-500 truncate">{email}</p>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: "/admin-login" })}
              className="text-slate-500 hover:text-red-400 transition"
              title="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
