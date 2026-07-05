"use client";


import Logo from "@/components/Logo";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  LayoutDashboard,
  FileText,
  Target,
  Mail,
  TrendingUp,
  MessageSquareText,
  Brain,
  MessageCircle,
  Inbox,
  History,
  Settings,
  Lock,
  Crown,
  Zap,
} from "lucide-react";

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  premium?: boolean;
}

const navItems: NavItem[] = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/resume", label: "Resume", icon: FileText },
  { href: "/dashboard/job", label: "Job Match", icon: Target },
  { href: "/dashboard/apply", label: "Apply", icon: Mail },
  { href: "/dashboard/skills", label: "Skills", icon: TrendingUp },
  { href: "/dashboard/interview", label: "Interview", icon: MessageSquareText, premium: true },
  { href: "/dashboard/career", label: "Career AI", icon: Brain, premium: true },
  { href: "/dashboard/chat", label: "AI Chat", icon: MessageCircle, premium: true },
  { href: "/dashboard/messages", label: "Messages", icon: Inbox, premium: true },
  { href: "/dashboard/history", label: "History", icon: History },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

export default function DashboardSidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  const isPremium = (session?.user as any)?.isPremium || false;

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col border-r border-white/5 bg-slate-950/95 backdrop-blur-xl">
      {/* Logo */}
      <div className="border-b border-white/5 px-6 py-4">
  <Logo size="md" />
</div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto p-4">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const isLocked = item.premium && !isPremium;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={isLocked ? "/dashboard?upgrade=true" : item.href}
              className={`group flex items-center justify-between rounded-xl px-4 py-3 text-sm font-medium transition ${
                isActive
                  ? "bg-blue-500/10 text-blue-400"
                  : "text-slate-400 hover:bg-white/5 hover:text-white"
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
              </div>

              {isLocked && (
                <Lock className="h-3.5 w-3.5 text-slate-600 group-hover:text-slate-400" />
              )}

              {item.premium && !isLocked && (
                <Crown className="h-3.5 w-3.5 text-amber-400" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Upgrade Banner */}
      {!isPremium && (
        <div className="border-t border-white/5 p-4">
          <div className="rounded-2xl border border-blue-500/20 bg-gradient-to-br from-blue-600/10 to-cyan-500/5 p-5">
            <div className="mb-3 flex items-center gap-2">
              <Zap className="h-4 w-4 text-blue-400" />
              <span className="text-xs font-semibold uppercase tracking-wider text-blue-400">
                Upgrade
              </span>
            </div>
            <h3 className="text-sm font-semibold text-white">
              Unlock Premium
            </h3>
            <p className="mt-1 text-xs text-slate-400">
              Interview coach, AI chat, career roadmap & more.
            </p>
            <Link
              href="/pricing"
              className="mt-4 inline-flex w-full items-center justify-center rounded-xl bg-blue-600 px-4 py-2 text-xs font-medium text-white shadow-lg shadow-blue-700/25 transition hover:bg-blue-500"
            >
              Upgrade Now
            </Link>
          </div>
        </div>
      )}
    </aside>
  );
}