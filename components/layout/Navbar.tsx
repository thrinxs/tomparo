"use client";

import Logo from "@/components/Logo";
import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  // Hide navbar on auth pages and dashboard
  const hideNavbar =
    pathname?.startsWith("/signin") ||
    pathname?.startsWith("/signup") ||
    pathname?.startsWith("/forgot-password") ||
    pathname?.startsWith("/dashboard") ||
    pathname?.startsWith("/admin") ||
    pathname?.startsWith("/staff") ||
    pathname?.startsWith("/support");

  if (hideNavbar) return null;

  // ... rest of the code stays the same

  return (
    <header className="sticky top-0 z-50 border-b border-white/5 bg-slate-950/80 backdrop-blur-2xl">
      <div className="mx-auto flex h-24 max-w-6xl items-center justify-between px-6">
        {/* Logo */}
        <Logo size="xl" />

        {/* Desktop Navigation Links */}
        <nav className="hidden items-center gap-8 md:flex">
          <Link
            href="/#features"
            className="text-sm text-slate-400 transition hover:text-white"
          >
            Features
          </Link>
          <Link
            href="/#how-it-works"
            className="text-sm text-slate-400 transition hover:text-white"
          >
            How it works
          </Link>
          <Link
            href="/pricing"
            className="text-sm text-slate-400 transition hover:text-white"
          >
            Pricing
          </Link>
        </nav>

        {/* Desktop Auth Buttons */}
        <div className="hidden items-center gap-3 md:flex">
          <Link
            href="/signin"
            className="rounded-xl px-4 py-2 text-sm text-slate-400 transition hover:bg-white/5 hover:text-white"
          >
            Sign In
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-medium text-white shadow-lg shadow-blue-700/25 transition hover:bg-blue-500"
          >
            Get Started Free
          </Link>
        </div>

        {/* Mobile Menu Toggle */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="rounded-xl border border-white/10 bg-white/5 p-2 text-white transition hover:bg-white/10 md:hidden"
          aria-label="Toggle menu"
        >
          {mobileOpen ? (
            <X className="h-5 w-5" />
          ) : (
            <Menu className="h-5 w-5" />
          )}
        </button>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileOpen && (
        <div className="border-t border-white/5 bg-slate-950/95 backdrop-blur-2xl md:hidden">
          <div className="mx-auto max-w-6xl space-y-2 px-6 py-6">
            <Link
              href="/#features"
              onClick={() => setMobileOpen(false)}
              className="block rounded-xl px-4 py-3 text-sm text-slate-300 transition hover:bg-white/5 hover:text-white"
            >
              Features
            </Link>
            <Link
              href="/#how-it-works"
              onClick={() => setMobileOpen(false)}
              className="block rounded-xl px-4 py-3 text-sm text-slate-300 transition hover:bg-white/5 hover:text-white"
            >
              How it works
            </Link>
            <Link
              href="/pricing"
              onClick={() => setMobileOpen(false)}
              className="block rounded-xl px-4 py-3 text-sm text-slate-300 transition hover:bg-white/5 hover:text-white"
            >
              Pricing
            </Link>
            <div className="border-t border-white/5 pt-3">
              <Link
                href="/signin"
                onClick={() => setMobileOpen(false)}
                className="block rounded-xl px-4 py-3 text-sm text-slate-300 transition hover:bg-white/5 hover:text-white"
              >
                Sign In
              </Link>
              <Link
                href="/dashboard"
                onClick={() => setMobileOpen(false)}
                className="mt-2 block rounded-xl bg-blue-600 px-4 py-3 text-center text-sm font-medium text-white shadow-lg shadow-blue-700/25 transition hover:bg-blue-500"
              >
                Get Started Free
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}