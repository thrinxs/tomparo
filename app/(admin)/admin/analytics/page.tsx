import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { BarChart3, Users, Crown, Building2, TrendingUp, Activity } from "lucide-react";

export default async function AdminAnalyticsPage() {
  const session = await getServerSession(authOptions);
  if ((session?.user as any)?.role !== "ADMIN") redirect("/admin-login");

  const now = new Date();
  const startOfDay = new Date(now.setHours(0, 0, 0, 0));
  const last7 = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const last30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [
    totalUsers, premiumUsers, totalCompanies, totalTeamMembers,
    newToday, newLast7, newLast30,
    totalUsageToday, freeUsers, adminCount, staffCount,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { role: "PREMIUM" } }),
    prisma.recruiterProfile.count(),
    prisma.recruiterTeamMember.count(),
    prisma.user.count({ where: { createdAt: { gte: startOfDay } } }),
    prisma.user.count({ where: { createdAt: { gte: last7 } } }),
    prisma.user.count({ where: { createdAt: { gte: last30 } } }),
    prisma.usageTracking.aggregate({ _sum: { count: true }, where: { date: { gte: startOfDay } } }),
    prisma.user.count({ where: { role: "FREE" } }),
    prisma.user.count({ where: { role: "ADMIN" } }),
    prisma.user.count({ where: { role: { in: ["STAFF", "SUPPORT"] } } }),
  ]);

  const recruiterCounts = await prisma.user.groupBy({
    by: ["role"],
    where: { role: { startsWith: "RECRUITER" } },
    _count: true,
  });

  const roleLabels: Record<string, string> = {
    FREE: "Free", PREMIUM: "Premium", ADMIN: "Admin", STAFF: "Staff", SUPPORT: "Support",
    RECRUITER_STARTER: "Starter", RECRUITER_GROWTH: "Growth", RECRUITER_BUSINESS: "Business",
    RECRUITER_ENTERPRISE: "Enterprise", RECRUITER_SCALE: "Scale", RECRUITER_CUSTOM: "Custom",
  };

  const conversionRate = totalUsers > 0 ? ((premiumUsers / totalUsers) * 100).toFixed(1) : "0";

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Analytics</h1>
        <p className="mt-1 text-sm text-slate-400">Platform-wide usage and growth metrics</p>
      </div>

      {/* Growth stats */}
      <div>
        <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Growth</h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {[
            { label: "New Today", value: newToday, icon: TrendingUp, color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
            { label: "Last 7 Days", value: newLast7, icon: TrendingUp, color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20" },
            { label: "Last 30 Days", value: newLast30, icon: TrendingUp, color: "text-purple-400", bg: "bg-purple-500/10", border: "border-purple-500/20" },
            { label: "AI Uses Today", value: totalUsageToday._sum.count ?? 0, icon: Activity, color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20" },
          ].map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.label} className={`rounded-2xl border ${s.border} bg-white/[0.02] p-5`}>
                <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center mb-3`}>
                  <Icon className={`h-5 w-5 ${s.color}`} />
                </div>
                <p className="text-2xl font-bold text-white">{s.value}</p>
                <p className="text-xs text-slate-400 mt-0.5">{s.label}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* User breakdown */}
      <div>
        <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">User Breakdown</h2>
        <div className="grid gap-4 md:grid-cols-2">

          {/* By role */}
          <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5">
            <div className="flex items-center gap-2 mb-4">
              <Users className="h-4 w-4 text-blue-400" />
              <p className="text-sm font-semibold text-white">By Role</p>
            </div>
            <div className="space-y-3">
              {[
                { label: "Free", value: freeUsers, color: "bg-slate-500" },
                { label: "Premium", value: premiumUsers, color: "bg-amber-500" },
                { label: "Companies", value: totalCompanies, color: "bg-purple-500" },
                { label: "Team Members", value: totalTeamMembers, color: "bg-emerald-500" },
                { label: "Admins/Staff", value: adminCount + staffCount, color: "bg-red-500" },
              ].map((item) => (
                <div key={item.label} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">{item.label}</span>
                    <span className="text-white font-medium">{item.value}</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-white/5">
                    <div
                      className={`h-1.5 rounded-full ${item.color}`}
                      style={{ width: `${totalUsers > 0 ? Math.min(100, (item.value / totalUsers) * 100) : 0}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recruiter plans */}
          <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5">
            <div className="flex items-center gap-2 mb-4">
              <Building2 className="h-4 w-4 text-purple-400" />
              <p className="text-sm font-semibold text-white">Recruiter Plans</p>
            </div>
            {recruiterCounts.length === 0 ? (
              <p className="text-sm text-slate-500">No recruiter accounts yet</p>
            ) : (
              <div className="space-y-3">
                {recruiterCounts.map((r) => (
                  <div key={r.role} className="flex items-center justify-between">
                    <span className="text-sm text-slate-400">{roleLabels[r.role] ?? r.role}</span>
                    <span className="text-sm font-semibold text-white">{r._count}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Conversion */}
      <div className="rounded-2xl border border-amber-500/20 bg-gradient-to-r from-amber-500/5 to-orange-500/5 p-6">
        <div className="flex items-center gap-2 mb-2">
          <Crown className="h-5 w-5 text-amber-400" />
          <p className="text-sm font-semibold text-white">Premium Conversion Rate</p>
        </div>
        <p className="text-4xl font-bold text-amber-400">{conversionRate}%</p>
        <p className="text-xs text-slate-400 mt-1">
          {premiumUsers} premium out of {totalUsers} total users
        </p>
      </div>
    </div>
  );
}
