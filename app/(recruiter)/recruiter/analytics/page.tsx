"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  BarChart3, Users, Briefcase, Mail, TrendingUp, TrendingDown,
  CheckCircle, XCircle, Clock, Star, Trophy, Zap, Lock,
  FileText, Upload, Send, UserPlus, Settings, Loader2,
  ArrowUpRight, ArrowDownRight, Minus,
} from "lucide-react";
import toast from "react-hot-toast";

const activityIcons: Record<string, any> = {
  CV_UPLOADED: Upload,
  CV_BULK_UPLOADED: Upload,
  JOB_CREATED: Briefcase,
  JOB_UPDATED: Briefcase,
  JOB_CLOSED: Briefcase,
  APPLICATION_RECEIVED: FileText,
  CANDIDATE_STATUS_CHANGED: Users,
  EMAIL_SENT: Send,
  BULK_EMAIL_SENT: Send,
  TEAM_MEMBER_INVITED: UserPlus,
  TEAM_MEMBER_JOINED: UserPlus,
  TEAM_MEMBER_REMOVED: Users,
  SETTINGS_UPDATED: Settings,
};

const activityColors: Record<string, string> = {
  CV_UPLOADED: "text-purple-400 bg-purple-500/10",
  CV_BULK_UPLOADED: "text-purple-400 bg-purple-500/10",
  JOB_CREATED: "text-blue-400 bg-blue-500/10",
  JOB_UPDATED: "text-blue-400 bg-blue-500/10",
  JOB_CLOSED: "text-slate-400 bg-slate-500/10",
  APPLICATION_RECEIVED: "text-emerald-400 bg-emerald-500/10",
  CANDIDATE_STATUS_CHANGED: "text-amber-400 bg-amber-500/10",
  EMAIL_SENT: "text-pink-400 bg-pink-500/10",
  BULK_EMAIL_SENT: "text-pink-400 bg-pink-500/10",
  TEAM_MEMBER_INVITED: "text-cyan-400 bg-cyan-500/10",
  TEAM_MEMBER_JOINED: "text-cyan-400 bg-cyan-500/10",
  TEAM_MEMBER_REMOVED: "text-red-400 bg-red-500/10",
  SETTINGS_UPDATED: "text-slate-400 bg-slate-500/10",
};

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  color = "text-purple-400",
  bg = "bg-purple-500/10",
  change,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: any;
  color?: string;
  bg?: string;
  change?: number;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center`}>
          <Icon className={`w-5 h-5 ${color}`} />
        </div>
        {change !== undefined && (
          <div className={`flex items-center gap-1 text-xs font-semibold ${
            change > 0 ? "text-emerald-400" : change < 0 ? "text-red-400" : "text-slate-500"
          }`}>
            {change > 0 ? (
              <ArrowUpRight className="w-3.5 h-3.5" />
            ) : change < 0 ? (
              <ArrowDownRight className="w-3.5 h-3.5" />
            ) : (
              <Minus className="w-3.5 h-3.5" />
            )}
            {Math.abs(change)}%
          </div>
        )}
      </div>
      <p className="text-3xl font-bold text-white mb-1">{value}</p>
      <p className="text-sm font-medium text-slate-400">{label}</p>
      {sub && <p className="text-xs text-slate-600 mt-0.5">{sub}</p>}
    </div>
  );
}

function PipelineBar({
  label,
  count,
  total,
  color,
}: {
  label: string;
  count: number;
  total: number;
  color: string;
}) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-sm text-slate-400">{label}</span>
        <span className="text-sm font-semibold text-white">{count} <span className="text-slate-600 font-normal text-xs">({pct}%)</span></span>
      </div>
      <div className="h-2 w-full rounded-full bg-white/5">
        <div
          className={`h-2 rounded-full transition-all ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export default function AnalyticsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [locked, setLocked] = useState(false);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await fetch("/api/recruiter/analytics");
        if (res.status === 403) {
          setLocked(true);
          return;
        }
        const json = await res.json();
        if (!res.ok) throw new Error(json.error);
        setData(json);
      } catch (err: any) {
        toast.error(err.message || "Failed to load analytics");
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-slate-500" />
      </div>
    );
  }

  if (locked) {
    return (
      <div className="max-w-2xl mx-auto py-20 text-center">
        <div className="w-16 h-16 rounded-2xl bg-purple-500/10 flex items-center justify-center mx-auto mb-6">
          <Lock className="w-8 h-8 text-purple-400" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-3">Analytics — Business+</h2>
        <p className="text-slate-400 mb-8">
          Upgrade to the Business plan or higher to access your full analytics dashboard.
        </p>
        <Link
          href="/recruiter-pricing"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-purple-600 text-white font-semibold hover:bg-purple-500 transition"
        >
          View Plans
          <ArrowUpRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  if (!data) return null;

  const totalCandidates =
    data.pipeline.new +
    data.pipeline.reviewed +
    data.pipeline.shortlisted +
    data.pipeline.rejected +
    data.pipeline.hired;

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Analytics</h1>
        <p className="text-slate-400 mt-1">Your recruitment performance at a glance</p>
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="CVs Analysed"
          value={data.cvs.total}
          sub={`${data.cvs.thisMonth} this month`}
          icon={Users}
          color="text-purple-400"
          bg="bg-purple-500/10"
          change={data.cvs.changePercent}
        />
        <StatCard
          label="Applications"
          value={data.applications.total}
          sub={`${data.applications.thisMonth} this month`}
          icon={FileText}
          color="text-blue-400"
          bg="bg-blue-500/10"
          change={data.applications.changePercent}
        />
        <StatCard
          label="Active Jobs"
          value={data.jobs.active}
          sub={`${data.jobs.total} total · ${data.jobs.closed} closed`}
          icon={Briefcase}
          color="text-emerald-400"
          bg="bg-emerald-500/10"
        />
        <StatCard
          label="Email Open Rate"
          value={`${data.emails.openRate}%`}
          sub={`${data.emails.opened} of ${data.emails.total} opened`}
          icon={Mail}
          color="text-pink-400"
          bg="bg-pink-500/10"
        />
      </div>

      {/* Pipeline + Top Jobs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Pipeline Breakdown */}
        <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-purple-400" />
              Candidate Pipeline
            </h3>
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-400" />
              <span className="text-sm font-semibold text-amber-400">
                {data.pipeline.hireRate}% hire rate
              </span>
            </div>
          </div>
          <div className="space-y-4">
            <PipelineBar label="New" count={data.pipeline.new} total={totalCandidates} color="bg-blue-500" />
            <PipelineBar label="Reviewed" count={data.pipeline.reviewed} total={totalCandidates} color="bg-purple-500" />
            <PipelineBar label="Shortlisted" count={data.pipeline.shortlisted} total={totalCandidates} color="bg-amber-500" />
            <PipelineBar label="Rejected" count={data.pipeline.rejected} total={totalCandidates} color="bg-red-500" />
            <PipelineBar label="Hired" count={data.pipeline.hired} total={totalCandidates} color="bg-emerald-500" />
          </div>
          <div className="mt-6 pt-6 border-t border-white/5 grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-emerald-400">{data.pipeline.hired}</p>
              <p className="text-xs text-slate-500 mt-0.5">Hired</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-amber-400">{data.pipeline.shortlisted}</p>
              <p className="text-xs text-slate-500 mt-0.5">Shortlisted</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-400">{data.pipeline.rejected}</p>
              <p className="text-xs text-slate-500 mt-0.5">Rejected</p>
            </div>
          </div>
        </div>

        {/* Top Jobs */}
        <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-8">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2 mb-6">
            <Zap className="w-5 h-5 text-amber-400" />
            Top Performing Jobs
          </h3>
          {data.topJobs.length === 0 ? (
            <div className="text-center py-8">
              <Briefcase className="w-10 h-10 text-slate-700 mx-auto mb-3" />
              <p className="text-slate-500 text-sm">No jobs yet</p>
              <Link href="/recruiter/jobs/new" className="text-purple-400 text-sm hover:text-purple-300 transition mt-2 inline-block">
                Create your first job →
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {data.topJobs.map((job: any, i: number) => (
                <div key={job.id} className="flex items-center gap-4 p-3 rounded-xl bg-white/[0.02] hover:bg-white/5 transition">
                  <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center shrink-0">
                    <span className="text-xs font-bold text-purple-400">#{i + 1}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{job.title}</p>
                    <p className="text-xs text-slate-500">{job.status.toLowerCase()}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-white">{job.applications}</p>
                    <p className="text-xs text-slate-500">applicants</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Email Stats */}
      <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-8">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2 mb-6">
          <Mail className="w-5 h-5 text-pink-400" />
          Email Performance
        </h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="text-center">
            <p className="text-3xl font-bold text-white">{data.emails.total}</p>
            <p className="text-sm text-slate-400 mt-1">Total Sent</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-emerald-400">{data.emails.opened}</p>
            <p className="text-sm text-slate-400 mt-1">Opened</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-pink-400">{data.emails.openRate}%</p>
            <p className="text-sm text-slate-400 mt-1">Open Rate</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-blue-400">{data.emails.thisMonth}</p>
            <p className="text-sm text-slate-400 mt-1">This Month</p>
          </div>
        </div>
        <div className="mt-6 h-2 w-full rounded-full bg-white/5">
          <div
            className="h-2 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 transition-all"
            style={{ width: `${data.emails.openRate}%` }}
          />
        </div>
        <div className="flex justify-between mt-1.5 text-xs text-slate-600">
          <span>0%</span>
          <span>Open Rate</span>
          <span>100%</span>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-8">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2 mb-6">
          <Clock className="w-5 h-5 text-slate-400" />
          Recent Activity
          <span className="ml-auto text-xs text-slate-500 font-normal">Last 20 actions</span>
        </h3>
        {data.recentActivity.length === 0 ? (
          <div className="text-center py-8">
            <Clock className="w-10 h-10 text-slate-700 mx-auto mb-3" />
            <p className="text-slate-500 text-sm">No activity yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {data.recentActivity.map((activity: any) => {
              const Icon = activityIcons[activity.type] || Zap;
              const colorClass = activityColors[activity.type] || "text-slate-400 bg-slate-500/10";
              const [textColor, bgColor] = colorClass.split(" ");
              return (
                <div key={activity.id} className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-lg ${bgColor} flex items-center justify-center shrink-0 mt-0.5`}>
                    <Icon className={`w-4 h-4 ${textColor}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white">{activity.title}</p>
                    {activity.description && (
                      <p className="text-xs text-slate-400 mt-0.5">{activity.description}</p>
                    )}
                  </div>
                  <span className="text-xs text-slate-600 shrink-0">
                    {new Date(activity.createdAt).toLocaleDateString("en-NG", {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
