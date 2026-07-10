"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import toast, { Toaster } from "react-hot-toast";
import {
  FileText,
  Target,
  Mail,
  Loader2,
  Trash2,
  Eye,
  Calendar,
  Building2,
  Sparkles,
  TrendingUp,
  Inbox,
} from "lucide-react";

type Tab = "resumes" | "jobs" | "applications";

export default function HistoryPage() {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("resumes");
  const [data, setData] = useState<any>({
    resumes: [],
    jobAnalyses: [],
    applications: [],
    stats: { totalResumes: 0, totalJobMatches: 0, totalApplications: 0 },
  });

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const res = await fetch("/api/user/history");
      const result = await res.json();
      if (result.success) {
        setData(result);
      }
    } catch (error) {
      console.error("Failed to fetch history:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (type: string, id: string) => {
    if (!confirm("Are you sure you want to delete this?")) return;

    try {
      const res = await fetch(`/api/user/history?type=${type}&id=${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        toast.success("Deleted successfully");
        fetchHistory();
      } else {
        toast.error("Failed to delete");
      }
    } catch (error) {
      toast.error("Something went wrong");
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString();
  };

  const getScoreColor = (score: number | null) => {
    if (!score) return "text-slate-500";
    if (score >= 85) return "text-emerald-400";
    if (score >= 70) return "text-cyan-400";
    if (score >= 50) return "text-amber-400";
    return "text-red-400";
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl">
        <div className="flex h-96 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
        </div>
      </div>
    );
  }

  const totalItems =
    data.stats.totalResumes +
    data.stats.totalJobMatches +
    data.stats.totalApplications;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <Toaster position="top-right" />

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Your History</h1>
        <p className="mt-2 text-slate-400">
          All your past analyses, job matches, and applications
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
          <div className="flex items-center justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10">
              <FileText className="h-5 w-5 text-blue-400" />
            </div>
            <span className="text-2xl font-bold text-white">
              {data.stats.totalResumes}
            </span>
          </div>
          <p className="mt-3 text-sm text-slate-400">CV Analyses</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
          <div className="flex items-center justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10">
              <Target className="h-5 w-5 text-cyan-400" />
            </div>
            <span className="text-2xl font-bold text-white">
              {data.stats.totalJobMatches}
            </span>
          </div>
          <p className="mt-3 text-sm text-slate-400">Job Matches</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
          <div className="flex items-center justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10">
              <Mail className="h-5 w-5 text-emerald-400" />
            </div>
            <span className="text-2xl font-bold text-white">
              {data.stats.totalApplications}
            </span>
          </div>
          <p className="mt-3 text-sm text-slate-400">Applications</p>
        </div>
      </div>

      {/* Empty State */}
      {totalItems === 0 ? (
        <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-12 text-center">
          <Inbox className="mx-auto mb-4 h-16 w-16 text-slate-600" />
          <h3 className="text-lg font-semibold text-white">No History Yet</h3>
          <p className="mt-2 text-slate-400">
            Start by analyzing your CV or matching a job description!
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Link
              href="/dashboard/resume"
              className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-blue-500"
            >
              Analyze CV
            </Link>
            <Link
              href="/dashboard/job"
              className="rounded-xl border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-white/10"
            >
              Match Job
            </Link>
          </div>
        </div>
      ) : (
        <>
          {/* Tabs */}
          <div className="flex gap-2 border-b border-white/10">
            <button
              onClick={() => setActiveTab("resumes")}
              className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition ${
                activeTab === "resumes"
                  ? "border-blue-500 text-blue-400"
                  : "border-transparent text-slate-400 hover:text-white"
              }`}
            >
              <FileText className="h-4 w-4" />
              CV Analyses ({data.stats.totalResumes})
            </button>
            <button
              onClick={() => setActiveTab("jobs")}
              className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition ${
                activeTab === "jobs"
                  ? "border-cyan-500 text-cyan-400"
                  : "border-transparent text-slate-400 hover:text-white"
              }`}
            >
              <Target className="h-4 w-4" />
              Job Matches ({data.stats.totalJobMatches})
            </button>
            <button
              onClick={() => setActiveTab("applications")}
              className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition ${
                activeTab === "applications"
                  ? "border-emerald-500 text-emerald-400"
                  : "border-transparent text-slate-400 hover:text-white"
              }`}
            >
              <Mail className="h-4 w-4" />
              Applications ({data.stats.totalApplications})
            </button>
          </div>

          {/* Content */}
          <div className="space-y-3">
            {activeTab === "resumes" && (
              <>
                {data.resumes.length === 0 ? (
                  <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-8 text-center">
                    <p className="text-slate-400">No CV analyses yet</p>
                    <Link
                      href="/dashboard/resume"
                      className="mt-4 inline-flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300"
                    >
                      Analyze your first CV <Sparkles className="h-4 w-4" />
                    </Link>
                  </div>
                ) : (
                  data.resumes.map((resume: any) => (
                    <div
                      key={resume.id}
                      className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.02] p-5 transition hover:bg-white/[0.04]"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10">
                          <FileText className="h-6 w-6 text-blue-400" />
                        </div>
                        <div>
                          <h3 className="font-medium text-white">
                            {resume.title || "Untitled CV"}
                          </h3>
                          <div className="mt-1 flex items-center gap-3 text-xs text-slate-500">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {formatDate(resume.createdAt)}
                            </span>
                            {resume.fileName && (
                              <span>{resume.fileName}</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div
                            className={`text-2xl font-bold ${getScoreColor(resume.atsScore)}`}
                          >
                            {resume.atsScore || "N/A"}
                          </div>
                          <div className="text-xs text-slate-500">
                            ATS Score
                          </div>
                        </div>

                        <button
                          onClick={() => handleDelete("resume", resume.id)}
                          className="rounded-lg border border-red-500/20 bg-red-500/5 p-2 text-red-400 transition hover:bg-red-500/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </>
            )}

            {activeTab === "jobs" && (
              <>
                {data.jobAnalyses.length === 0 ? (
                  <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-8 text-center">
                    <p className="text-slate-400">No job matches yet</p>
                    <Link
                      href="/dashboard/job"
                      className="mt-4 inline-flex items-center gap-2 text-sm text-cyan-400 hover:text-cyan-300"
                    >
                      Match your first job <Target className="h-4 w-4" />
                    </Link>
                  </div>
                ) : (
                  data.jobAnalyses.map((job: any) => (
                    <div
                      key={job.id}
                      className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.02] p-5 transition hover:bg-white/[0.04]"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-500/10">
                          <Target className="h-6 w-6 text-cyan-400" />
                        </div>
                        <div>
                          <h3 className="font-medium text-white">
                            {job.jobTitle || "Untitled Job"}
                          </h3>
                          <div className="mt-1 flex items-center gap-3 text-xs text-slate-500">
                            {job.company && (
                              <span className="flex items-center gap-1">
                                <Building2 className="h-3 w-3" />
                                {job.company}
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {formatDate(job.createdAt)}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div
                            className={`text-2xl font-bold ${getScoreColor(job.matchScore)}`}
                          >
                            {job.matchScore || "N/A"}%
                          </div>
                          <div className="text-xs text-slate-500">
                            Match
                          </div>
                        </div>

                        <button
                          onClick={() => handleDelete("job", job.id)}
                          className="rounded-lg border border-red-500/20 bg-red-500/5 p-2 text-red-400 transition hover:bg-red-500/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </>
            )}

            {activeTab === "applications" && (
              <>
                {data.applications.length === 0 ? (
                  <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-8 text-center">
                    <p className="text-slate-400">No applications yet</p>
                    <Link
                      href="/dashboard/apply"
                      className="mt-4 inline-flex items-center gap-2 text-sm text-emerald-400 hover:text-emerald-300"
                    >
                      Generate your first application <Sparkles className="h-4 w-4" />
                    </Link>
                  </div>
                ) : (
                  data.applications.map((app: any) => (
                    <div
                      key={app.id}
                      className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.02] p-5 transition hover:bg-white/[0.04]"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10">
                          <Mail className="h-6 w-6 text-emerald-400" />
                        </div>
                        <div>
                          <h3 className="font-medium text-white">
                            {app.emailSubject || "Application"}
                          </h3>
                          <div className="mt-1 flex items-center gap-3 text-xs text-slate-500">
                            {app.emailStyle && (
                              <span className="rounded-full bg-white/5 px-2 py-0.5">
                                {app.emailStyle}
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {formatDate(app.createdAt)}
                            </span>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => handleDelete("application", app.id)}
                        className="rounded-lg border border-red-500/20 bg-red-500/5 p-2 text-red-400 transition hover:bg-red-500/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))
                )}
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}