import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import {
  Users,
  Briefcase,
  Upload,
  TrendingUp,
  ArrowRight,
  Bot,
  Mic,
  Mail,
} from "lucide-react";
import Link from "next/link";

export default async function RecruiterDashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) redirect("/signin");

  const userId = (session.user as any).id;
  const role = (session.user as any).role as string;

  // Get recruiter profile + counts
  const profile = await prisma.recruiterProfile.findUnique({
    where: { userId },
    include: {
      _count: {
        select: {
          jobPostings: true,
          candidates: true,
        },
      },
    },
  });

  // If no profile yet (edge case — signed up via Google without recruiter flow)
  if (!profile) {
    redirect("/recruiter-pricing");
  }

  const planNames: Record<string, string> = {
    RECRUITER_STARTER: "Starter",
    RECRUITER_GROWTH: "Growth",
    RECRUITER_BUSINESS: "Business",
    RECRUITER_ENTERPRISE: "Enterprise",
    RECRUITER_SCALE: "Scale",
    RECRUITER_CUSTOM: "Custom",
  };

  const cvLimits: Record<string, number> = {
    RECRUITER_STARTER: 20,
    RECRUITER_GROWTH: 50,
    RECRUITER_BUSINESS: 200,
    RECRUITER_ENTERPRISE: 500,
    RECRUITER_SCALE: 1000,
    RECRUITER_CUSTOM: 99999,
  };

  const planName = planNames[role] ?? "Free";
  const cvLimit = cvLimits[role] ?? 0;
  const cvsUsed = profile.cvsUsedThisMonth;
  const cvsRemaining = Math.max(0, cvLimit - cvsUsed);
  const cvPercent = cvLimit > 0 ? Math.min(100, (cvsUsed / cvLimit) * 100) : 0;

  const totalJobs = profile._count.jobPostings;
  const totalCandidates = profile._count.candidates;

  const hasGrowth = [
    "RECRUITER_GROWTH",
    "RECRUITER_BUSINESS",
    "RECRUITER_ENTERPRISE",
    "RECRUITER_SCALE",
    "RECRUITER_CUSTOM",
  ].includes(role);

  const hasBusiness = [
    "RECRUITER_BUSINESS",
    "RECRUITER_ENTERPRISE",
    "RECRUITER_SCALE",
    "RECRUITER_CUSTOM",
  ].includes(role);

  const hasEnterprise = [
    "RECRUITER_ENTERPRISE",
    "RECRUITER_SCALE",
    "RECRUITER_CUSTOM",
  ].includes(role);

  return (
    <div className="max-w-6xl mx-auto space-y-8">

      {/* ── Header ── */}
      <div>
        <h1 className="text-2xl font-bold text-white">
          Welcome back, {(session.user as any).name?.split(" ")[0]} 👋
        </h1>
        <p className="text-slate-400 mt-1">
          {profile.companyName} · {planName} Plan
        </p>
      </div>

      {/* ── Stats Row ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "Total Candidates",
            value: totalCandidates,
            icon: Users,
            color: "text-purple-400",
            bg: "bg-purple-500/10",
          },
          {
            label: "Active Jobs",
            value: totalJobs,
            icon: Briefcase,
            color: "text-blue-400",
            bg: "bg-blue-500/10",
          },
          {
            label: "CVs Used This Month",
            value: `${cvsUsed} / ${cvLimit}`,
            icon: Upload,
            color: "text-amber-400",
            bg: "bg-amber-500/10",
          },
          {
            label: "CVs Remaining",
            value: cvsRemaining,
            icon: TrendingUp,
            color: "text-emerald-400",
            bg: "bg-emerald-500/10",
          },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="rounded-2xl border border-white/5 bg-white/[0.02] p-6"
            >
              <div
                className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center mb-4`}
              >
                <Icon className={`h-5 w-5 ${stat.color}`} />
              </div>
              <p className="text-2xl font-bold text-white">{stat.value}</p>
              <p className="text-sm text-slate-400 mt-1">{stat.label}</p>
            </div>
          );
        })}
      </div>

      {/* ── CV Usage Bar ── */}
      <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-6">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-medium text-white">
            Monthly CV Usage
          </p>
          <p className="text-sm text-slate-400">
            {cvsUsed} of {cvLimit} used
          </p>
        </div>
        <div className="h-2 w-full rounded-full bg-white/5">
          <div
            className={`h-2 rounded-full transition-all ${
              cvPercent > 80
                ? "bg-red-500"
                : cvPercent > 50
                ? "bg-amber-500"
                : "bg-purple-500"
            }`}
            style={{ width: `${cvPercent}%` }}
          />
        </div>
        <p className="text-xs text-slate-500 mt-2">
          Resets monthly · {cvsRemaining} CVs remaining
        </p>
      </div>

      {/* ── Quick Actions ── */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

          {/* Upload CV — always available */}
          <Link
            href="/recruiter/upload"
            className="group flex items-center justify-between rounded-2xl border border-white/5 bg-white/[0.02] p-6 transition hover:border-purple-500/30 hover:bg-purple-500/5"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                <Upload className="h-5 w-5 text-purple-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Upload CV</p>
                <p className="text-xs text-slate-400">Analyse a candidate</p>
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-slate-600 group-hover:text-purple-400 transition" />
          </Link>

          {/* Post Job — always available */}
          <Link
            href="/recruiter/jobs"
            className="group flex items-center justify-between rounded-2xl border border-white/5 bg-white/[0.02] p-6 transition hover:border-blue-500/30 hover:bg-blue-500/5"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <Briefcase className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Post a Job</p>
                <p className="text-xs text-slate-400">Create a new listing</p>
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-slate-600 group-hover:text-blue-400 transition" />
          </Link>

          {/* View Candidates — always available */}
          <Link
            href="/recruiter/candidates"
            className="group flex items-center justify-between rounded-2xl border border-white/5 bg-white/[0.02] p-6 transition hover:border-emerald-500/30 hover:bg-emerald-500/5"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                <Users className="h-5 w-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Candidates</p>
                <p className="text-xs text-slate-400">View all applicants</p>
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-slate-600 group-hover:text-emerald-400 transition" />
          </Link>

          {/* AI Emails — Growth+ */}
          <Link
            href={hasGrowth ? "/recruiter/emails" : "/recruiter-pricing"}
            className={`group flex items-center justify-between rounded-2xl border border-white/5 p-6 transition ${
              hasGrowth
                ? "bg-white/[0.02] hover:border-pink-500/30 hover:bg-pink-500/5"
                : "bg-white/[0.01] opacity-60"
            }`}
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-pink-500/10 flex items-center justify-center">
                <Mail className="h-5 w-5 text-pink-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">AI Emails</p>
                <p className="text-xs text-slate-400">
                  {hasGrowth ? "Send AI-written emails" : "Growth plan required"}
                </p>
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-slate-600 group-hover:text-pink-400 transition" />
          </Link>

          {/* AI Interviews — Business+ */}
          <Link
            href={hasBusiness ? "/recruiter/interviews" : "/recruiter-pricing"}
            className={`group flex items-center justify-between rounded-2xl border border-white/5 p-6 transition ${
              hasBusiness
                ? "bg-white/[0.02] hover:border-amber-500/30 hover:bg-amber-500/5"
                : "bg-white/[0.01] opacity-60"
            }`}
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                <Mic className="h-5 w-5 text-amber-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">AI Interviews</p>
                <p className="text-xs text-slate-400">
                  {hasBusiness ? "Text, voice & video" : "Business plan required"}
                </p>
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-slate-600 group-hover:text-amber-400 transition" />
          </Link>

          {/* Autopilot — Enterprise+ */}
          <Link
            href={hasEnterprise ? "/recruiter/autopilot" : "/recruiter-pricing"}
            className={`group flex items-center justify-between rounded-2xl border border-white/5 p-6 transition ${
              hasEnterprise
                ? "bg-white/[0.02] hover:border-emerald-500/30 hover:bg-emerald-500/5"
                : "bg-white/[0.01] opacity-60"
            }`}
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                <Bot className="h-5 w-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">AI Autopilot</p>
                <p className="text-xs text-slate-400">
                  {hasEnterprise ? "Fully autonomous hiring" : "Enterprise plan required"}
                </p>
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-slate-600 group-hover:text-emerald-400 transition" />
          </Link>
        </div>
      </div>

      {/* ── Upgrade prompt for non-enterprise ── */}
      {!hasEnterprise && (
        <div className="rounded-2xl border border-purple-500/20 bg-gradient-to-r from-purple-500/10 to-pink-500/5 p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <p className="text-white font-semibold">
              Unlock AI Interviews & Autopilot
            </p>
            <p className="text-sm text-slate-400 mt-1">
              Upgrade to Business or Enterprise to conduct AI interviews
              and automate your entire hiring pipeline.
            </p>
          </div>
          <Link
            href="/recruiter-pricing"
            className="shrink-0 inline-flex items-center gap-2 rounded-xl bg-purple-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-purple-500 transition"
          >
            See Plans
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      )}
    </div>
  );
}