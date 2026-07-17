"use client";

import Logo from "@/components/Logo";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  LayoutDashboard, Users, Briefcase, Upload, Mic, Mail,
  Bot, BarChart3, Settings, Lock, Rocket, FileText,
  Kanban, Inbox, X, MessageSquare,
} from "lucide-react";

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  requiredPlan?: string[];
  dividerBefore?: boolean;
}

const navItems: NavItem[] = [
  { href: "/recruiter", label: "Overview", icon: LayoutDashboard },
  { href: "/recruiter/jobs", label: "Job Postings", icon: Briefcase },
  { href: "/recruiter/talent-pool", label: "Talent Pool", icon: Inbox },
  { href: "/recruiter/candidates", label: "Candidates", icon: Users },
  { href: "/recruiter/upload", label: "Upload CVs", icon: Upload },
  {
    href: "/recruiter/pipeline", label: "Pipeline", icon: Kanban,
    requiredPlan: ["RECRUITER_GROWTH", "RECRUITER_BUSINESS", "RECRUITER_ENTERPRISE", "RECRUITER_SCALE", "RECRUITER_CUSTOM"],
    dividerBefore: true,
  },
  {
    href: "/recruiter/bulk", label: "Bulk Upload", icon: FileText,
    requiredPlan: ["RECRUITER_GROWTH", "RECRUITER_BUSINESS", "RECRUITER_ENTERPRISE", "RECRUITER_SCALE", "RECRUITER_CUSTOM"],
  },
  {
    href: "/recruiter/interviews", label: "AI Interviews", icon: MessageSquare,
    requiredPlan: ["RECRUITER_BUSINESS", "RECRUITER_ENTERPRISE", "RECRUITER_SCALE", "RECRUITER_CUSTOM"],
    dividerBefore: true,
  },
  {
    href: "/recruiter/emails", label: "AI Emails", icon: Mail,
    requiredPlan: ["RECRUITER_GROWTH", "RECRUITER_BUSINESS", "RECRUITER_ENTERPRISE", "RECRUITER_SCALE", "RECRUITER_CUSTOM"],
  },
  {
    href: "/recruiter/autopilot", label: "AI Autopilot", icon: Bot,
    requiredPlan: ["RECRUITER_ENTERPRISE", "RECRUITER_SCALE", "RECRUITER_CUSTOM"],
    dividerBefore: true,
  },
  {
    href: "/recruiter/analytics", label: "Analytics", icon: BarChart3,
    requiredPlan: ["RECRUITER_BUSINESS", "RECRUITER_ENTERPRISE", "RECRUITER_SCALE", "RECRUITER_CUSTOM"],
  },
  { href: "/recruiter/settings", label: "Settings", icon: Settings, dividerBefore: true },
];

const planNames: Record<string, string> = {
  RECRUITER_STARTER: "Starter",
  RECRUITER_GROWTH: "Growth",
  RECRUITER_BUSINESS: "Business",
  RECRUITER_ENTERPRISE: "Enterprise",
  RECRUITER_SCALE: "Scale",
  RECRUITER_CUSTOM: "Custom",
};

const minPlanLabel = (requiredPlan: string[]) => {
  const order = [
    "RECRUITER_STARTER", "RECRUITER_GROWTH", "RECRUITER_BUSINESS",
    "RECRUITER_ENTERPRISE", "RECRUITER_SCALE", "RECRUITER_CUSTOM",
  ];
  const min = requiredPlan.reduce((a, b) => order.indexOf(a) < order.indexOf(b) ? a : b);
  return planNames[min] ?? "Growth";
};

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function RecruiterSidebar({ isOpen, onClose }: Props) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const role = (session?.user as any)?.role as string | undefined;

  const hasAccess = (requiredPlan?: string[]) => {
    if (!requiredPlan) return true;
    if (!role) return false;
    return requiredPlan.includes(role) || role === "ADMIN";
  };

  const isStarter = role === "RECRUITER_STARTER" || !role;
  const hasNoRole = !role || role === "FREE";

  return (
    <aside className={`
      fixed left-0 top-0 z-40 flex h-screen w-64 flex-col
      border-r border-white/5 bg-slate-950/95 backdrop-blur-xl
      transition-transform duration-300 ease-in-out
      ${isOpen ? "translate-x-0" : "-translate-x-full"}
      lg:translate-x-0
    `}>

      {/* Logo + close button (mobile) */}
      <div className="border-b border-white/5 px-3 py-2 flex items-center justify-between">
        <Logo size="sm" href="/recruiter" />
        <button
          onClick={onClose}
          className="lg:hidden rounded-xl border border-white/10 bg-white/5 p-1.5 text-slate-400 hover:text-white transition"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Plan badge */}
      {role && role.startsWith("RECRUITER") && (
        <div className="px-4 pt-3">
          <div className="flex items-center gap-2 rounded-lg bg-purple-500/10 border border-purple-500/20 px-3 py-1.5">
            <div className="h-1.5 w-1.5 rounded-full bg-purple-400 animate-pulse" />
            <span className="text-xs font-semibold text-purple-400">
              {planNames[role] ?? "Recruiter"} Plan
            </span>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 space-y-0.5 overflow-y-auto p-4">
        {navItems.map((item) => {
          const isActive =
            item.href === "/recruiter"
              ? pathname === "/recruiter"
              : pathname.startsWith(item.href);
          const locked = !hasAccess(item.requiredPlan);
          const Icon = item.icon;

          return (
            <div key={item.href}>
              {item.dividerBefore && <div className="my-2 border-t border-white/5" />}
              <Link
                href={locked ? "/recruiter-pricing" : item.href}
                onClick={onClose}
                className={`group flex items-center justify-between rounded-xl px-4 py-3 text-sm font-medium transition ${
                  isActive
                    ? "bg-purple-500/10 text-purple-400"
                    : locked
                    ? "text-slate-600 hover:bg-white/5 hover:text-slate-400"
                    : "text-slate-400 hover:bg-white/5 hover:text-white"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`h-4 w-4 ${isActive ? "text-purple-400" : locked ? "text-slate-700" : ""}`} />
                  <span>{item.label}</span>
                </div>
                {locked && (
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-slate-600 group-hover:text-slate-500">
                      {minPlanLabel(item.requiredPlan!)}
                    </span>
                    <Lock className="h-3 w-3 text-slate-700 group-hover:text-slate-500" />
                  </div>
                )}
              </Link>
            </div>
          );
        })}
      </nav>

      {/* Upgrade Banner */}
      {(isStarter || hasNoRole) && (
        <div className="border-t border-white/5 p-4">
          <div className="rounded-2xl border border-purple-500/20 bg-gradient-to-br from-purple-600/10 to-pink-500/5 p-4">
            <div className="mb-2 flex items-center gap-2">
              <Rocket className="h-4 w-4 text-purple-400" />
              <span className="text-xs font-semibold uppercase tracking-wider text-purple-400">Upgrade</span>
            </div>
            <h3 className="text-sm font-semibold text-white">Unlock More Features</h3>
            <p className="mt-1 text-xs text-slate-400">Bulk upload, AI interviews, autopilot & more.</p>
            <Link
              href="/recruiter-pricing"
              onClick={onClose}
              className="mt-3 inline-flex w-full items-center justify-center rounded-xl bg-purple-600 px-4 py-2 text-xs font-medium text-white shadow-lg shadow-purple-700/25 transition hover:bg-purple-500"
            >
              See Plans
            </Link>
          </div>
        </div>
      )}
    </aside>
  );
}
