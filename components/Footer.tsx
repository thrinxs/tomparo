"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Logo from "@/components/Logo";

export default function Footer() {
  const pathname = usePathname();

  const hideFooter =
    pathname?.startsWith("/signin") ||
    pathname?.startsWith("/signup") ||
    pathname?.startsWith("/forgot-password") ||
    pathname?.startsWith("/dashboard") ||
    pathname?.startsWith("/admin") ||
    pathname?.startsWith("/staff") ||
    pathname?.startsWith("/support") ||
    pathname?.startsWith("/recruiter/"); // ← hides on /recruiter/* but NOT /recruiter-pricing

  if (hideFooter) return null;

  return (
    <footer className="border-t border-slate-800/50 py-10 px-6">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <Logo size="sm" />

        <div className="flex items-center gap-6 text-sm text-slate-500">
          <Link href="/privacy" className="hover:text-white transition">
            Privacy
          </Link>
          <Link href="/terms" className="hover:text-white transition">
            Terms
          </Link>
          <Link href="/contact" className="hover:text-white transition">
            Contact
          </Link>
        </div>

        <div className="text-sm text-slate-600 text-center">
          <p>© {new Date().getFullYear()} TomParo. All rights reserved.</p>
          <p className="mt-1">
            Built by{" "}
            <a
              href="https://thrinxs.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:text-blue-400 transition font-medium"
            >
              Thrinxs
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}