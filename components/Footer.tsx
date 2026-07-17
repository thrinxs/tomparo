"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import Logo from "@/components/Logo";
import { Twitter, Linkedin, Instagram, Mail, ArrowUpRight } from "lucide-react";

const footerLinks = {
  product: {
    title: "For Job Seekers",
    links: [
      { label: "CV Analysis", href: "/dashboard/resume" },
      { label: "Job Matching", href: "/dashboard/job" },
      { label: "Cover Letter", href: "/dashboard/apply" },
      { label: "Skill Gap Analysis", href: "/dashboard/skills" },
      { label: "Interview Coach", href: "/dashboard/interview" },
      { label: "Career AI", href: "/dashboard/career" },
      { label: "Pricing", href: "/pricing" },
    ],
  },
  recruiters: {
    title: "For Recruiters",
    links: [
      { label: "Recruiter Platform", href: "/recruiter-pricing" },
      { label: "AI Interviews", href: "/recruiter-pricing" },
      { label: "Talent Pool", href: "/recruiter-pricing" },
      { label: "Bulk CV Upload", href: "/recruiter-pricing" },
      { label: "AI Emails", href: "/recruiter-pricing" },
      { label: "AI Autopilot", href: "/recruiter-pricing" },
      { label: "Recruiter Pricing", href: "/recruiter-pricing" },
    ],
  },
  company: {
    title: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "How It Works", href: "/how-it-works" },
      { label: "Success Stories", href: "/success-stories" },
      { label: "FAQ", href: "/faq" },
      { label: "Contact", href: "/contact" },
    ],
  },
  legal: {
    title: "Legal",
    links: [
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Terms of Service", href: "/terms" },
    ],
  },
};

const socialLinks = [
  {
    label: "Twitter / X",
    href: "https://x.com/tomparo",
    icon: Twitter,
    color: "hover:bg-sky-500/20 hover:border-sky-500/40 hover:text-sky-400",
  },
  {
    label: "LinkedIn",
    href: "https://linkedin.com/company/tomparo",
    icon: Linkedin,
    color: "hover:bg-blue-500/20 hover:border-blue-500/40 hover:text-blue-400",
  },
  {
    label: "Instagram",
    href: "https://instagram.com/tomparo",
    icon: Instagram,
    color: "hover:bg-pink-500/20 hover:border-pink-500/40 hover:text-pink-400",
  },
  {
    label: "Email",
    href: "mailto:hello@tomparo.com",
    icon: Mail,
    color: "hover:bg-purple-500/20 hover:border-purple-500/40 hover:text-purple-400",
  },
];

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
    pathname?.startsWith("/interview/") ||
    (pathname?.startsWith("/recruiter/") && !pathname?.startsWith("/recruiter-pricing"));

  if (hideFooter) return null;

  return (
    <footer className="relative border-t border-white/5 bg-slate-950 overflow-hidden">

      {/* ── Gradient top line ── */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-purple-500/50 to-transparent" />

      {/* ── Watermark logo ── */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden">
        <Image
          src="/images/logo.png"
          alt=""
          width={1200}
          height={400}
          className="w-[90%] max-w-5xl h-auto opacity-[0.04] object-contain"
          aria-hidden="true"
        />
      </div>

      <div className="relative max-w-7xl mx-auto px-6">

        {/* ── Main footer grid ── */}
        <div className="pt-6 pb-16 grid grid-cols-1 lg:grid-cols-6 gap-8">

          {/* ── Brand column ── */}
          <div className="lg:col-span-2 space-y-2">
            {/* Logo — custom footer size, flush left, no padding */}
            <Link href="/" className="inline-block">
              <Image
                src="/images/tomparo_logo.png"
                alt="TomParo"
                width={500}
                height={200}
                className="w-auto" style={{ height: "380px" }}
                priority
              />
            </Link>

            <p className="text-sm text-slate-400 leading-relaxed max-w-xs">
              Nigeria&apos;s first AI-native career intelligence platform. Helping job seekers get hired faster and recruiters hire smarter.
            </p>

            {/* Social icons */}
            <div className="flex items-center gap-2">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.label}
                  className={`w-9 h-9 rounded-xl border border-white/10 bg-white/[0.02] flex items-center justify-center text-slate-500 transition-all duration-200 ${social.color}`}
                >
                  <social.icon className="w-4 h-4" />
                </a>
              ))}
            </div>

            {/* Nigeria badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/5 bg-white/[0.02]">
              <span className="text-base">🇳🇬</span>
              <span className="text-xs text-slate-500">Made in Nigeria</span>
            </div>
          </div>

          {/* ── Link columns — 2x2 grid on mobile, 4 cols on desktop ── */}
          <div className="lg:col-span-4 grid grid-cols-2 sm:grid-cols-4 gap-8">
            {Object.values(footerLinks).map((section) => (
              <div key={section.title} className="space-y-4">
                <h4 className="text-xs font-semibold text-white uppercase tracking-widest">
                  {section.title}
                </h4>
                <ul className="space-y-3">
                  {section.links.map((link) => (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        className="group inline-flex items-center gap-1 text-sm text-slate-500 hover:text-white transition-colors duration-200"
                      >
                        {link.label}
                        <ArrowUpRight className="w-3 h-3 opacity-0 -translate-y-0.5 translate-x-0.5 group-hover:opacity-100 group-hover:translate-y-0 group-hover:translate-x-0 transition-all duration-200" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* ── Divider ── */}
        <div className="h-px bg-gradient-to-r from-transparent via-white/5 to-transparent" />

        {/* ── Bottom bar ── */}
        <div className="py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <span>© {new Date().getFullYear()} TomParo.</span>
            <span>All rights reserved.</span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-slate-600">
            <span>
              Built by{" "}
              <a
                href="https://thrinxs.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-purple-400 hover:text-purple-300 transition font-medium"
              >
                Thrinxs
              </a>
            </span>
            <span className="w-1 h-1 rounded-full bg-slate-700" />
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              All systems operational
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
