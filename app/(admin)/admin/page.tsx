import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Users, Crown, Building2, TrendingUp,
  ArrowRight, Shield, CreditCard, BarChart3,
  FileText, Settings, UserCheck,
} from "lucide-react";

export default async function AdminHomePage() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role;
  if (role !== "ADMIN") redirect("/admin-login");

  // Platform stats
  const [
    totalUsers,
    premiumUsers,
    totalCompanies,
    totalTeamMembers,
    newUsersToday,
    newUsersThisWeek,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { role: "PREMIUM" } }),
    prisma.recruiterProfile.count(),
    prisma.recruiterTeamMember.count(),
    prisma.user.count({
      where: {
        createdAt: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
        },
      },
    }),
    prisma.user.count({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        },
      },
    }),
  ]);

  // Recent signups
  const recentUsers = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    take: 8,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
    },
  });

  const stats = [
    {
      label: "Total Users",
      value: totalUsers,
      sub: `+${newUsersToday} today`,
      icon: Users,
      color: "text-blue-400",
      bg: "bg-blue-500/10",
      border: "border-blue-500/20",
    },
    {
      label: "Premium Users",
      value: premiumUsers,
      sub: `${((premiumUsers / totalUsers) * 100).toFixed(1)}% conversion`,
      icon: Crown,
      color: "text-amber-400",
      bg: "bg-amber-500/10",
      border: "border-amber-500/20",
    },
    {
      label: "Companies",
      value: totalCompanies,
      sub: `${totalTeamMembers} team members`,
      icon: Building2,
      color: "text-purple-400",
      bg: "bg-purple-500/10",
      border: "border-purple-500/20",
    },
    {
      label: "New This Week",
      value: newUsersThisWeek,
      sub: "signups last 7 days",
      icon: TrendingUp,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/20",
    },
  ];

  const quickLinks = [
    {
      href: "/admin/users",
      label: "Manage Users",
      description: "View, upgrade, and manage all accounts",
      icon: Users,
      color: "text-blue-400",
      bg: "bg-blue-500/10",
      hover: "hover:border-blue-500/30",
    },
    {
      href: "/admin/subscriptions",
      label: "Subscriptions",
      description: "View all active plans and payments",
      icon: CreditCard,
      color: "text-amber-400",
      bg: "bg-amber-500/10",
      hover: "hover:border-amber-500/30",
    },
    {
      href: "/admin/analytics",
      label: "Analytics",
      description: "Platform usage and growth metrics",
      icon: BarChart3,
      color: "text-purple-400",
      bg: "bg-purple-500/10",
      hover: "hover:border-purple-500/30",
    },
    {
      href: "/admin/staff",
      label: "Staff",
      description: "Manage support and staff accounts",
      icon: Shield,
      color: "text-red-400",
      bg: "bg-red-500/10",
      hover: "hover:border-red-500/30",
    },
    {
      href: "/admin/content",
      label: "Content",
      description: "Edit FAQs, announcements, and copy",
      icon: FileText,
      color: "text-cyan-400",
      bg: "bg-cyan-500/10",
      hover: "hover:border-cyan-500/30",
    },
    {
      href: "/admin/settings",
      label: "Settings",
      description: "Platform configuration and feature flags",
      icon: Settings,
      color: "text-slate-400",
      bg: "bg-slate-500/10",
      hover: "hover:border-slate-500/30",
    },
    {
      href: "/dashboard",
      label: "Job Seeker View",
      description: "Preview the job seeker dashboard as admin",
      icon: Users,
      color: "text-blue-400",
      bg: "bg-blue-500/10",
      hover: "hover:border-blue-500/30",
    },
    {
      href: "/recruiter",
      label: "Recruiter View",
      description: "Preview the recruiter dashboard as admin",
      icon: Building2,
      color: "text-purple-400",
      bg: "bg-purple-500/10",
      hover: "hover:border-purple-500/30",
    },
  ];

  const roleColors: Record<string, string> = {
    FREE:                 "bg-slate-500/20 text-slate-400",
    PREMIUM:              "bg-amber-500/20 text-amber-400",
    ADMIN:                "bg-red-500/20 text-red-400",
    STAFF:                "bg-blue-500/20 text-blue-400",
    SUPPORT:              "bg-cyan-500/20 text-cyan-400",
    RECRUITER_STARTER:    "bg-purple-500/20 text-purple-400",
    RECRUITER_GROWTH:     "bg-purple-500/20 text-purple-400",
    RECRUITER_BUSINESS:   "bg-purple-500/20 text-purple-400",
    RECRUITER_ENTERPRISE: "bg-violet-500/20 text-violet-400",
    RECRUITER_SCALE:      "bg-violet-500/20 text-violet-400",
    RECRUITER_CUSTOM:     "bg-violet-500/20 text-violet-400",
  };

  const roleLabels: Record<string, string> = {
    FREE: "Free", PREMIUM: "Premium", ADMIN: "Admin",
    STAFF: "Staff", SUPPORT: "Support",
    RECRUITER_STARTER: "Starter", RECRUITER_GROWTH: "Growth",
    RECRUITER_BUSINESS: "Business", RECRUITER_ENTERPRISE: "Enterprise",
    RECRUITER_SCALE: "Scale", RECRUITER_CUSTOM: "Custom",
  };

  return (
    <div className="mx-auto max-w-7xl space-y-8">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">
          Platform Overview
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          Welcome back. Here's what's happening on TomParo.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <div
              key={s.label}
              className={`rounded-2xl border ${s.border} bg-white/[0.02] p-5`}
            >
              <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center mb-3`}>
                <Icon className={`h-5 w-5 ${s.color}`} />
              </div>
              <p className="text-2xl font-bold text-white">{s.value}</p>
              <p className="text-xs font-medium text-white mt-0.5">{s.label}</p>
              <p className="text-xs text-slate-500 mt-0.5">{s.sub}</p>
            </div>
          );
        })}
      </div>

      {/* Quick links */}
      <div>
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">
          Admin Sections
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {quickLinks.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`group flex items-center justify-between rounded-2xl border border-white/5 bg-white/[0.02] p-5 transition ${link.hover}`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl ${link.bg} flex items-center justify-center shrink-0`}>
                    <Icon className={`h-5 w-5 ${link.color}`} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{link.label}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{link.description}</p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-600 group-hover:text-slate-400 transition shrink-0" />
              </Link>
            );
          })}
        </div>
      </div>

      {/* Recent signups */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
            Recent Signups
          </h2>
          <Link
            href="/admin/users"
            className="text-xs text-blue-400 hover:text-blue-300 transition flex items-center gap-1"
          >
            View all <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        <div className="rounded-2xl border border-white/5 bg-white/[0.02] overflow-hidden">
          {recentUsers.map((user, idx) => (
            <div
              key={user.id}
              className={`flex items-center gap-4 px-5 py-3.5 ${
                idx !== recentUsers.length - 1 ? "border-b border-white/5" : ""
              }`}
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-700 text-xs font-bold text-white">
                {(user.name ?? user.email)[0].toUpperCase()}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {user.name ?? "—"}
                </p>
                <p className="text-xs text-slate-500 truncate">{user.email}</p>
              </div>

              <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${roleColors[user.role] ?? "bg-slate-500/20 text-slate-400"}`}>
                {roleLabels[user.role] ?? user.role}
              </span>

              <p className="hidden text-xs text-slate-500 shrink-0 md:block">
                {new Date(user.createdAt).toLocaleDateString("en-NG", {
                  day: "numeric", month: "short",
                })}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
