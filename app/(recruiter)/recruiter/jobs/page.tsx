"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Briefcase,
  Plus,
  MapPin,
  Clock,
  Users,
  MoreVertical,
  Pause,
  Play,
  Trash2,
  Eye,
  Calendar,
  ChevronDown,
} from "lucide-react";
import toast from "react-hot-toast";

const statusConfig = {
  ACTIVE: {
    label: "Active",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
    dot: "bg-emerald-400",
  },
  DRAFT: {
    label: "Draft",
    color: "text-amber-400",
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
    dot: "bg-amber-400",
  },
  PAUSED: {
    label: "Paused",
    color: "text-blue-400",
    bg: "bg-blue-500/10",
    border: "border-blue-500/20",
    dot: "bg-blue-400",
  },
  CLOSED: {
    label: "Closed",
    color: "text-slate-400",
    bg: "bg-slate-500/10",
    border: "border-slate-500/20",
    dot: "bg-slate-400",
  },
};

const typeLabels: Record<string, string> = {
  FULL_TIME: "Full Time",
  PART_TIME: "Part Time",
  CONTRACT: "Contract",
  REMOTE: "Remote",
  HYBRID: "Hybrid",
};

export default function RecruiterJobsPage() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("ALL");

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      const res = await fetch("/api/recruiter/jobs");
      const data = await res.json();
      if (data.jobs) setJobs(data.jobs);
    } catch {
      toast.error("Failed to load jobs");
    } finally {
      setLoading(false);
    }
  };

  const updateJobStatus = async (
    jobId: string,
    status: string
  ) => {
    try {
      const res = await fetch(`/api/recruiter/jobs/${jobId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (!res.ok) throw new Error();

      setJobs((prev) =>
        prev.map((j) => (j.id === jobId ? { ...j, status } : j))
      );
      toast.success(`Job ${status.toLowerCase()}`);
    } catch {
      toast.error("Failed to update job");
    }
    setOpenMenuId(null);
  };

  const deleteJob = async (jobId: string) => {
    if (!confirm("Delete this job? This cannot be undone.")) return;

    try {
      const res = await fetch(`/api/recruiter/jobs/${jobId}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error();

      setJobs((prev) => prev.filter((j) => j.id !== jobId));
      toast.success("Job deleted");
    } catch {
      toast.error("Failed to delete job");
    }
    setOpenMenuId(null);
  };

  const filteredJobs =
    filter === "ALL" ? jobs : jobs.filter((j) => j.status === filter);

  const counts = {
    ALL: jobs.length,
    ACTIVE: jobs.filter((j) => j.status === "ACTIVE").length,
    DRAFT: jobs.filter((j) => j.status === "DRAFT").length,
    PAUSED: jobs.filter((j) => j.status === "PAUSED").length,
    CLOSED: jobs.filter((j) => j.status === "CLOSED").length,
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Job Postings</h1>
          <p className="text-slate-400 mt-1">
            {jobs.length} total job{jobs.length !== 1 ? "s" : ""} ·{" "}
            {counts.ACTIVE} active
          </p>
        </div>
        <Link
          href="/recruiter/jobs/new"
          className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-purple-500 transition"
        >
          <Plus className="w-4 h-4" />
          Post a Job
        </Link>
      </div>

      {/* ── Filter tabs ── */}
      <div className="flex gap-2 flex-wrap">
        {(["ALL", "ACTIVE", "DRAFT", "PAUSED", "CLOSED"] as const).map(
          (status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
                filter === status
                  ? "bg-purple-600 text-white"
                  : "bg-white/5 border border-white/10 text-slate-400 hover:text-white"
              }`}
            >
              {status === "ALL" ? "All" : statusConfig[status as keyof typeof statusConfig]?.label}
              <span className="ml-2 text-xs opacity-70">
                {counts[status]}
              </span>
            </button>
          )
        )}
      </div>

      {/* ── Jobs List ── */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="rounded-2xl border border-white/5 bg-white/[0.02] p-6 animate-pulse"
            >
              <div className="h-5 bg-white/5 rounded w-1/3 mb-3" />
              <div className="h-4 bg-white/5 rounded w-1/4" />
            </div>
          ))}
        </div>
      ) : filteredJobs.length === 0 ? (
        <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-16 text-center">
          <Briefcase className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">
            {filter === "ALL" ? "No jobs posted yet" : `No ${filter.toLowerCase()} jobs`}
          </h3>
          <p className="text-slate-400 text-sm mb-6">
            {filter === "ALL"
              ? "Create your first job posting to start receiving applications."
              : "No jobs with this status."}
          </p>
          {filter === "ALL" && (
            <Link
              href="/recruiter/jobs/new"
              className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-purple-500 transition"
            >
              <Plus className="w-4 h-4" />
              Post Your First Job
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredJobs.map((job) => {
            const config =
              statusConfig[job.status as keyof typeof statusConfig] ||
              statusConfig.DRAFT;

            return (
              <div
                key={job.id}
                className="relative rounded-2xl border border-white/5 bg-white/[0.02] p-6 hover:border-white/10 transition"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">

                    {/* Title + Status */}
                    <div className="flex flex-wrap items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-white">
                        {job.title}
                      </h3>
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.bg} ${config.border} ${config.color}`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${config.dot}`}
                        />
                        {config.label}
                      </span>
                    </div>

                    {/* Meta */}
                    <div className="flex flex-wrap gap-4 text-sm text-slate-400 mb-4">
                      {job.location && (
                        <span className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5" />
                          {job.location}
                        </span>
                      )}
                      <span className="flex items-center gap-1.5">
                        <Briefcase className="w-3.5 h-3.5" />
                        {typeLabels[job.type] || job.type}
                      </span>
                      {job.salaryMin && job.salaryMax && (
                        <span className="flex items-center gap-1.5 text-emerald-400">
                          ₦{job.salaryMin.toLocaleString()} –{" "}
                          ₦{job.salaryMax.toLocaleString()}
                        </span>
                      )}
                      {job.deadline && (
                        <span className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5" />
                          Closes{" "}
                          {new Date(job.deadline).toLocaleDateString("en-NG", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                      )}
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        Posted{" "}
                        {new Date(job.createdAt).toLocaleDateString("en-NG", {
                          day: "numeric",
                          month: "short",
                        })}
                      </span>
                    </div>

                    {/* Candidates count */}
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-xs text-purple-400">
                        <Users className="w-3 h-3" />
                        {job._count?.candidates ?? 0} candidate
                        {(job._count?.candidates ?? 0) !== 1 ? "s" : ""}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <Link
                      href={`/recruiter/candidates?job=${job.id}`}
                      className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-xs text-slate-300 hover:bg-white/10 transition"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      View Candidates
                    </Link>

                    {/* 3-dot menu */}
                    <div className="relative">
                      <button
                        onClick={() =>
                          setOpenMenuId(
                            openMenuId === job.id ? null : job.id
                          )
                        }
                        className="p-2 rounded-xl border border-white/10 bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white transition"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>

                      {openMenuId === job.id && (
                        <>
                          <div
                            className="fixed inset-0 z-10"
                            onClick={() => setOpenMenuId(null)}
                          />
                          <div className="absolute right-0 top-full z-20 mt-2 w-48 rounded-2xl border border-white/10 bg-slate-900 p-1.5 shadow-xl">
                            <Link
                              href={`/recruiter/jobs/${job.id}/edit`}
                              className="flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm text-slate-300 hover:bg-white/5 hover:text-white transition"
                              onClick={() => setOpenMenuId(null)}
                            >
                              ✏️ Edit Job
                            </Link>

                            {job.status === "ACTIVE" ? (
                              <button
                                onClick={() =>
                                  updateJobStatus(job.id, "PAUSED")
                                }
                                className="w-full flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm text-slate-300 hover:bg-white/5 hover:text-white transition"
                              >
                                <Pause className="w-4 h-4" />
                                Pause Job
                              </button>
                            ) : job.status === "PAUSED" ? (
                              <button
                                onClick={() =>
                                  updateJobStatus(job.id, "ACTIVE")
                                }
                                className="w-full flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm text-emerald-400 hover:bg-emerald-500/10 transition"
                              >
                                <Play className="w-4 h-4" />
                                Activate Job
                              </button>
                            ) : job.status === "DRAFT" ? (
                              <button
                                onClick={() =>
                                  updateJobStatus(job.id, "ACTIVE")
                                }
                                className="w-full flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm text-emerald-400 hover:bg-emerald-500/10 transition"
                              >
                                <Play className="w-4 h-4" />
                                Publish Job
                              </button>
                            ) : null}

                            <button
                              onClick={() =>
                                updateJobStatus(job.id, "CLOSED")
                              }
                              className="w-full flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm text-slate-300 hover:bg-white/5 hover:text-white transition"
                            >
                              ✅ Close Job
                            </button>

                            <div className="my-1 border-t border-white/5" />

                            <button
                              onClick={() => deleteJob(job.id)}
                              className="w-full flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition"
                            >
                              <Trash2 className="w-4 h-4" />
                              Delete Job
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}