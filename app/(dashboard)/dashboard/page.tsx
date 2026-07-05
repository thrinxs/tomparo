import Link from "next/link";
import { FileText, Target, TrendingUp, Mail, ArrowRight } from "lucide-react";

export default function DashboardHome() {
  return (
    <div className="mx-auto max-w-6xl">
      {/* Welcome */}
      <div className="mb-10">
        <h1 className="text-3xl font-semibold text-white">Your Dashboard</h1>
        <p className="mt-2 text-slate-400">
          Everything you need to power your job search.
        </p>
      </div>

      {/* Score Cards Row */}
      <div className="mb-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-5">
          <div className="mb-3 flex items-center justify-between">
            <FileText className="h-5 w-5 text-blue-400" />
            <span className="text-xs text-slate-500">Not yet</span>
          </div>
          <p className="text-2xl font-bold text-white">—</p>
          <p className="mt-1 text-xs text-slate-500">Resume Score</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-5">
          <div className="mb-3 flex items-center justify-between">
            <Target className="h-5 w-5 text-cyan-400" />
            <span className="text-xs text-slate-500">Not yet</span>
          </div>
          <p className="text-2xl font-bold text-white">—</p>
          <p className="mt-1 text-xs text-slate-500">Job Match</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-5">
          <div className="mb-3 flex items-center justify-between">
            <Mail className="h-5 w-5 text-emerald-400" />
            <span className="text-xs text-slate-500">Not yet</span>
          </div>
          <p className="text-2xl font-bold text-white">—</p>
          <p className="mt-1 text-xs text-slate-500">Applications</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-5">
          <div className="mb-3 flex items-center justify-between">
            <TrendingUp className="h-5 w-5 text-amber-400" />
            <span className="text-xs text-slate-500">Not yet</span>
          </div>
          <p className="text-2xl font-bold text-white">—</p>
          <p className="mt-1 text-xs text-slate-500">Skills Gap</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mb-10">
        <h2 className="mb-4 text-xl font-semibold text-white">Quick Actions</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <Link
            href="/dashboard/resume"
            className="group rounded-2xl border border-white/10 bg-white/[0.02] p-6 transition hover:border-blue-500/30 hover:bg-white/[0.04]"
          >
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-400 ring-1 ring-blue-500/20">
              <FileText className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-semibold text-white">
              Analyze Your Resume
            </h3>
            <p className="mt-2 text-sm text-slate-400">
              Get your ATS score, strengths, and improvements in seconds.
            </p>
            <div className="mt-4 flex items-center gap-2 text-sm font-medium text-blue-400 transition group-hover:gap-3">
              Start now <ArrowRight className="h-4 w-4" />
            </div>
          </Link>

          <Link
            href="/dashboard/job"
            className="group rounded-2xl border border-white/10 bg-white/[0.02] p-6 transition hover:border-cyan-500/30 hover:bg-white/[0.04]"
          >
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-400 ring-1 ring-cyan-500/20">
              <Target className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-semibold text-white">
              Match a Job Vacancy
            </h3>
            <p className="mt-2 text-sm text-slate-400">
              Paste a job description and see how well you match.
            </p>
            <div className="mt-4 flex items-center gap-2 text-sm font-medium text-cyan-400 transition group-hover:gap-3">
              Start now <ArrowRight className="h-4 w-4" />
            </div>
          </Link>
        </div>
      </div>

      {/* Getting Started */}
      <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-blue-600/5 to-cyan-500/5 p-8">
        <h2 className="text-xl font-semibold text-white">Getting Started</h2>
        <p className="mt-2 text-slate-400">
          Follow these steps to unlock TomParo&apos;s full potential.
        </p>

        <div className="mt-6 space-y-3">
          {[
            "Upload your CV or create one from scratch",
            "Paste a job description to see your match",
            "Generate a tailored cover letter",
            "Practice interviews (Premium)",
          ].map((step, i) => (
            <div
              key={i}
              className="flex items-center gap-4 rounded-xl border border-white/5 bg-slate-900/40 p-4"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-500/10 text-sm font-semibold text-blue-400 ring-1 ring-blue-500/20">
                {i + 1}
              </div>
              <p className="text-sm text-slate-300">{step}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}