import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Users, Briefcase, Upload, TrendingUp,
  ArrowRight, Bot, Mic, Mail,
} from "lucide-react";

export default async function RecruiterDashboardPreviewPage() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role;
  if (role !== "ADMIN") redirect("/admin-login");

  // Admin has no recruiter profile — show demo stats
  const [totalCandidates, totalJobs] = await Promise.all([
    prisma.recruiterCandidate.count(),
    prisma.jobPosting.count(),
  ]);

  const features = [
    { label: "Upload CV", description: "Analyse a candidate", icon: Upload, href: "/recruiter/upload", color: "text-purple-400", bg: "bg-purple-500/10", hover: "hover:border-purple-500/30" },
    { label: "Post a Job", description: "Create a new listing", icon: Briefcase, href: "/recruiter/jobs", color: "text-blue-400", bg: "bg-blue-500/10", hover: "hover:border-blue-500/30" },
    { label: "Candidates", description: "View all applicants", icon: Users, href: "/recruiter/candidates", color: "text-emerald-400", bg: "bg-emerald-500/10", hover: "hover:border-emerald-500/30" },
    { label: "AI Emails", description: "Send AI-written emails", icon: Mail, href: "/recruiter/emails", color: "text-pink-400", bg: "bg-pink-500/10", hover: "hover:border-pink-500/30" },
    { label: "AI Interviews", description: "Text, voice and video", icon: Mic, href: "/recruiter/interviews", color: "text-amber-400", bg: "bg-amber-500/10", hover: "hover:border-amber-500/30" },
    { label: "AI Autopilot", description: "Fully autonomous hiring", icon: Bot, href: "/recruiter/autopilot", color: "text-emerald-400", bg: "bg-emerald-500/10", hover: "hover:border-emerald-500/30" },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-8">

      {/* Admin preview banner */}
      <div className="rounded-2xl border border-red-500/20 bg-red-500/5 px-5 py-4">
        <p className="text-sm font-semibold text-red-400">Admin Preview — Recruiter Dashboard</p>
        <p className="text-xs text-slate-400 mt-0.5">
          You are viewing the recruiter experience as admin. All features are accessible.
        </p>
      </div>

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Recruiter Dashboard</h1>
        <p className="text-slate-400 mt-1">Admin Preview · Full Access</p>
      </div>

      {/* Platform stats */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          { label: "Total Candidates", value: totalCandidates, icon: Users, color: "text-purple-400", bg: "bg-purple-500/10" },
          { label: "Total Jobs", value: totalJobs, icon: Briefcase, color: "text-blue-400", bg: "bg-blue-500/10" },
          { label: "CVs Used", value: "—", icon: Upload, color: "text-amber-400", bg: "bg-amber-500/10" },
          { label: "CVs Remaining", value: "∞", icon: TrendingUp, color: "text-emerald-400", bg: "bg-emerald-500/10" },
        ].map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="rounded-2xl border border-white/5 bg-white/[0.02] p-5">
              <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center mb-3`}>
                <Icon className={`h-5 w-5 ${s.color}`} />
              </div>
              <p className="text-2xl font-bold text-white">{s.value}</p>
              <p className="text-xs text-slate-400 mt-0.5">{s.label}</p>
            </div>
          );
        })}
      </div>

      {/* Features */}
      <div>
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">
          Recruiter Features
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => {
            const Icon = f.icon;
            return (
              <Link
                key={f.href}
                href={f.href}
                className={`group flex items-center justify-between rounded-2xl border border-white/5 bg-white/[0.02] p-5 transition ${f.hover}`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl ${f.bg} flex items-center justify-center shrink-0`}>
                    <Icon className={`h-5 w-5 ${f.color}`} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{f.label}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{f.description}</p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-600 group-hover:text-slate-400 transition shrink-0" />
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
