"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Inbox, Search, Mail, Globe, CheckCircle, XCircle,
  AlertTriangle, Star, Clock, Briefcase, ArrowRight,
  Trash2, Eye, Users, Upload, ChevronDown,
  Sparkles, RefreshCw, Loader2, FileText, Download,
} from "lucide-react";
import toast from "react-hot-toast";

const statusConfig = {
  UNREAD: { label: "Unread", color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20", dot: "bg-blue-400" },
  READ: { label: "Read", color: "text-slate-400", bg: "bg-white/5", border: "border-white/10", dot: "bg-slate-400" },
  SHORTLISTED: { label: "Shortlisted", color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20", dot: "bg-amber-400" },
  REJECTED: { label: "Rejected", color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/20", dot: "bg-red-400" },
  HIRED: { label: "Hired", color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20", dot: "bg-emerald-400" },
};

const recommendationConfig: Record<string, { color: string; icon: any }> = {
  "Strong Hire": { color: "text-emerald-400", icon: CheckCircle },
  "Hire": { color: "text-blue-400", icon: CheckCircle },
  "Maybe": { color: "text-amber-400", icon: AlertTriangle },
  "No Hire": { color: "text-red-400", icon: XCircle },
};

const sourceConfig = {
  form: { label: "Apply Form", icon: Globe, color: "text-purple-400" },
  email: { label: "Email", icon: Mail, color: "text-blue-400" },
};

export default function TalentPoolPage() {
  const [applications, setApplications] = useState<any[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [jobFilter, setJobFilter] = useState("");
  const [sourceFilter, setSourceFilter] = useState("ALL");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [cvLoading, setCvLoading] = useState<string | null>(null);

  const fetchApplications = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "ALL") params.set("status", statusFilter);
      if (jobFilter) params.set("jobId", jobFilter);
      if (sourceFilter !== "ALL") params.set("source", sourceFilter);
      if (search) params.set("search", search);

      const res = await fetch(`/api/recruiter/talent-pool?${params}`);
      const data = await res.json();
      if (data.applications) {
        setApplications(data.applications);
        setCounts(data.counts || {});
      }
    } catch {
      toast.error("Failed to load applications");
    } finally {
      setLoading(false);
    }
  }, [statusFilter, jobFilter, sourceFilter, search]);

  const fetchJobs = async () => {
    try {
      const res = await fetch("/api/recruiter/jobs");
      const data = await res.json();
      if (data.jobs) setJobs(data.jobs);
    } catch {}
  };

  useEffect(() => { fetchJobs(); }, []);
  useEffect(() => { fetchApplications(); }, [fetchApplications]);

  const updateStatus = async (id: string, status: string) => {
    setUpdatingId(id);
    try {
      const res = await fetch(`/api/recruiter/talent-pool/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error();
      setApplications((prev) => prev.map((a) => a.id === id ? { ...a, status } : a));
      toast.success(`Application ${status.toLowerCase()}`);
    } catch {
      toast.error("Failed to update");
    } finally {
      setUpdatingId(null);
    }
  };

  const deleteApplication = async (id: string) => {
    if (!confirm("Delete this application? This cannot be undone.")) return;
    try {
      const res = await fetch(`/api/recruiter/talent-pool/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setApplications((prev) => prev.filter((a) => a.id !== id));
      toast.success("Application deleted");
    } catch {
      toast.error("Failed to delete");
    }
  };

  const toggleExpand = async (id: string) => {
    if (expandedId === id) { setExpandedId(null); return; }
    setExpandedId(id);
    const app = applications.find((a) => a.id === id);
    if (app?.status === "UNREAD") await updateStatus(id, "READ");
  };

  const handleViewCV = async (applicationId: string, download = false) => {
    setCvLoading(applicationId);
    try {
      const res = await fetch(`/api/recruiter/talent-pool/${applicationId}/cv`);
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || "CV not available"); return; }
      if (download) {
        const a = document.createElement("a");
        a.href = data.url;
        a.download = data.fileName;
        a.click();
      } else {
        window.open(data.url, "_blank");
      }
    } catch {
      toast.error("Failed to load CV");
    } finally {
      setCvLoading(null);
    }
  };

  const getAtsColor = (score: number) =>
    score >= 80 ? "text-emerald-400" : score >= 60 ? "text-amber-400" : "text-red-400";

  const unreadCount = counts.UNREAD || 0;

  return (
    <div className="max-w-6xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-white">Talent Pool</h1>
            {unreadCount > 0 && (
              <span className="px-2.5 py-0.5 rounded-full bg-blue-500 text-white text-xs font-bold">
                {unreadCount} new
              </span>
            )}
          </div>
          <p className="text-slate-400 mt-1">
            {counts.ALL || 0} applications · {counts.SHORTLISTED || 0} shortlisted · {counts.HIRED || 0} hired
          </p>
        </div>
        <button
          onClick={() => { setLoading(true); fetchApplications(); }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 bg-white/5 text-sm text-slate-400 hover:text-white hover:bg-white/10 transition"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* How applications come in */}
      <div className="rounded-2xl border border-purple-500/20 bg-purple-500/5 p-5">
        <div className="flex items-start gap-3">
          <Sparkles className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-white mb-1">
              How applications arrive in your Talent Pool
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-400">
              <div className="flex items-start gap-2">
                <Globe className="w-3.5 h-3.5 text-purple-400 shrink-0 mt-0.5" />
                <span>
                  Candidates apply via your public job page at{" "}
                  <span className="text-purple-400">tomparo.com/jobs</span>
                </span>
              </div>
              <div className="flex items-start gap-2">
                <Mail className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
                <span>
                  Candidates email their CV to your apply address and it appears here automatically
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search + Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email..."
            className="w-full rounded-xl border border-white/10 bg-white/[0.02] pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition"
          />
        </div>
        {jobs.length > 0 && (
          <select
            value={jobFilter}
            onChange={(e) => setJobFilter(e.target.value)}
            className="rounded-xl border border-white/10 bg-white/[0.02] px-4 py-2.5 text-sm text-white outline-none focus:border-purple-500/50 transition"
          >
            <option value="" className="bg-slate-900">All Jobs</option>
            {jobs.map((j) => (
              <option key={j.id} value={j.id} className="bg-slate-900">{j.title}</option>
            ))}
          </select>
        )}
        <select
          value={sourceFilter}
          onChange={(e) => setSourceFilter(e.target.value)}
          className="rounded-xl border border-white/10 bg-white/[0.02] px-4 py-2.5 text-sm text-white outline-none focus:border-purple-500/50 transition"
        >
          <option value="ALL" className="bg-slate-900">All Sources</option>
          <option value="form" className="bg-slate-900">Apply Form</option>
          <option value="email" className="bg-slate-900">Email</option>
        </select>
      </div>

      {/* Status tabs */}
      <div className="flex gap-2 flex-wrap">
        {(["ALL", "UNREAD", "READ", "SHORTLISTED", "REJECTED", "HIRED"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition relative ${
              statusFilter === s
                ? "bg-purple-600 text-white"
                : "bg-white/5 border border-white/10 text-slate-400 hover:text-white"
            }`}
          >
            {s === "ALL" ? "All" : statusConfig[s as keyof typeof statusConfig]?.label}
            <span className="ml-2 text-xs opacity-70">
              {s === "ALL" ? counts.ALL || 0 : counts[s] || 0}
            </span>
            {s === "UNREAD" && (counts.UNREAD || 0) > 0 && (
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-blue-500" />
            )}
          </button>
        ))}
      </div>

      {/* Applications List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-2xl border border-white/5 bg-white/[0.02] p-5 animate-pulse">
              <div className="h-4 bg-white/5 rounded w-1/3 mb-2" />
              <div className="h-3 bg-white/5 rounded w-1/4" />
            </div>
          ))}
        </div>
      ) : applications.length === 0 ? (
        <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-16 text-center">
          <Inbox className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">
            {statusFilter === "ALL" ? "No applications yet" : `No ${statusFilter.toLowerCase()} applications`}
          </h3>
          <p className="text-slate-400 text-sm mb-6 max-w-sm mx-auto">
            {statusFilter === "ALL"
              ? "Applications will appear here when candidates apply via your job form or send their CV to your apply email."
              : "No applications match this filter."}
          </p>
          {statusFilter === "ALL" && (
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/recruiter/jobs"
                className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-purple-500 transition"
              >
                <Briefcase className="w-4 h-4" />
                Post a Job
              </Link>
              <Link
                href="/recruiter/upload"
                className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-semibold text-white hover:bg-white/10 transition"
              >
                <Upload className="w-4 h-4" />
                Upload CVs Manually
              </Link>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {applications.map((app) => {
            const status = statusConfig[app.status as keyof typeof statusConfig] || statusConfig.READ;
            const aiAnalysis = app.aiAnalysis ? JSON.parse(app.aiAnalysis) : null;
            const recommendation = aiAnalysis?.hiringRecommendation as string | undefined;
            const recConfig = recommendation ? recommendationConfig[recommendation] : null;
            const RecIcon = recConfig?.icon;
            const src = sourceConfig[app.source as keyof typeof sourceConfig] || sourceConfig.form;
            const SrcIcon = src.icon;
            const isExpanded = expandedId === app.id;
            const isUnread = app.status === "UNREAD";

            return (
              <div
                key={app.id}
                className={`rounded-2xl border transition ${
                  isUnread ? "border-blue-500/30 bg-blue-500/5" : "border-white/5 bg-white/[0.02]"
                } hover:border-white/10`}
              >
                {/* Main row */}
                <div className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1 min-w-0">

                      {/* Avatar */}
                      <div className="w-11 h-11 rounded-xl bg-purple-500/20 flex items-center justify-center shrink-0">
                        <span className="text-purple-400 font-bold text-sm">
                          {(app.candidateName || "?").split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)}
                        </span>
                      </div>

                      <div className="flex-1 min-w-0">
                        {/* Name + badges */}
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <h3 className="text-base font-semibold text-white truncate">
                            {app.candidateName || "Unknown Applicant"}
                          </h3>
                          {isUnread && (
                            <span className="px-2 py-0.5 rounded-full bg-blue-500 text-white text-xs font-bold">NEW</span>
                          )}
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${status.bg} ${status.border} ${status.color}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                            {status.label}
                          </span>
                        </div>

                        {/* Meta */}
                        <div className="flex flex-wrap gap-3 text-xs text-slate-400 mb-3">
                          {app.candidateEmail && <span>{app.candidateEmail}</span>}
                          {app.candidatePhone && <span>{app.candidatePhone}</span>}
                          {app.job && <span className="text-purple-400">📋 {app.job.title}</span>}
                          <span className="flex items-center gap-1">
                            <SrcIcon className={`w-3 h-3 ${src.color}`} />
                            <span className={src.color}>{src.label}</span>
                          </span>
                          <span className="text-slate-600">
                            {new Date(app.createdAt).toLocaleDateString("en-NG", {
                              day: "numeric", month: "short", year: "numeric",
                              hour: "2-digit", minute: "2-digit",
                            })}
                          </span>
                        </div>

                        {/* AI scores */}
                        {aiAnalysis && (
                          <div className="flex flex-wrap gap-3">
                            <div className="flex items-center gap-1.5">
                              <Star className="w-3.5 h-3.5 text-slate-500" />
                              <span className="text-xs text-slate-400">ATS:</span>
                              <span className={`text-xs font-bold ${getAtsColor(app.atsScore || 0)}`}>
                                {app.atsScore || 0}/100
                              </span>
                            </div>
                            {recConfig && RecIcon && (
                              <div className="flex items-center gap-1.5">
                                <RecIcon className={`w-3.5 h-3.5 ${recConfig.color}`} />
                                <span className={`text-xs font-semibold ${recConfig.color}`}>{recommendation}</span>
                              </div>
                            )}
                            {aiAnalysis.experienceLevel && (
                              <span className="px-2 py-0.5 rounded-full bg-white/5 text-xs text-slate-400">
                                {aiAnalysis.experienceLevel}
                              </span>
                            )}
                            {aiAnalysis.totalExperienceYears != null && (
                              <div className="flex items-center gap-1.5">
                                <Clock className="w-3 h-3 text-slate-500" />
                                <span className="text-xs text-slate-400">{aiAnalysis.totalExperienceYears} yrs exp</span>
                              </div>
                            )}
                          </div>
                        )}

                        {!aiAnalysis && app.cvText && (
                          <span className="text-xs text-amber-400 flex items-center gap-1">
                            <Sparkles className="w-3 h-3" />
                            AI analysis pending
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2 shrink-0">
                      <div className="flex gap-1.5">
                        {app.status !== "SHORTLISTED" && app.status !== "HIRED" && (
                          <button
                            onClick={() => updateStatus(app.id, "SHORTLISTED")}
                            disabled={updatingId === app.id}
                            className="px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-medium hover:bg-amber-500/20 transition disabled:opacity-50"
                          >
                            Shortlist
                          </button>
                        )}
                        {app.status !== "REJECTED" && app.status !== "HIRED" && (
                          <button
                            onClick={() => updateStatus(app.id, "REJECTED")}
                            disabled={updatingId === app.id}
                            className="px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium hover:bg-red-500/20 transition disabled:opacity-50"
                          >
                            Reject
                          </button>
                        )}
                        {app.status === "SHORTLISTED" && (
                          <button
                            onClick={() => updateStatus(app.id, "HIRED")}
                            disabled={updatingId === app.id}
                            className="px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium hover:bg-emerald-500/20 transition disabled:opacity-50"
                          >
                            ✅ Hire
                          </button>
                        )}
                      </div>

                      <button
                        onClick={() => toggleExpand(app.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-medium hover:bg-purple-500/20 transition"
                      >
                        <Eye className="w-3 h-3" />
                        {isExpanded ? "Hide" : "View"}
                        <ChevronDown className={`w-3 h-3 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                      </button>

                      <button
                        onClick={() => deleteApplication(app.id)}
                        className="p-1.5 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition"
                        title="Delete application"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Expanded detail */}
                {isExpanded && (
                  <div className="border-t border-white/5 p-5 space-y-4">

                    {/* AI Summary */}
                    {aiAnalysis?.summary && (
                      <div>
                        <p className="text-xs text-purple-400 font-semibold uppercase tracking-wider mb-2">AI Summary</p>
                        <p className="text-sm text-slate-300 leading-relaxed">{aiAnalysis.summary}</p>
                      </div>
                    )}

                    {/* Skills */}
                    {aiAnalysis?.topSkills?.length > 0 && (
                      <div>
                        <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-2">Top Skills</p>
                        <div className="flex flex-wrap gap-2">
                          {aiAnalysis.topSkills.map((skill: string) => (
                            <span key={skill} className="px-3 py-1 rounded-xl bg-purple-500/10 border border-purple-500/20 text-xs text-purple-300">
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Cover letter */}
                    {app.coverLetter && (
                      <div>
                        <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-2">Cover Letter</p>
                        <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-line">{app.coverLetter}</p>
                      </div>
                    )}

                    {/* CV text preview */}
                    {app.cvText && (
                      <div>
                        <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-2">CV Content</p>
                        <div className="rounded-xl bg-white/[0.02] border border-white/5 p-4 max-h-64 overflow-y-auto">
                          <p className="text-xs text-slate-400 leading-relaxed whitespace-pre-line font-mono">
                            {app.cvText.slice(0, 3000)}
                            {app.cvText.length > 3000 && (
                              <span className="text-slate-600">
                                {"\n\n"}... [{app.cvText.length - 3000} more characters]
                              </span>
                            )}
                          </p>
                        </div>
                        {app.cvFileName && (
                          <p className="text-xs text-slate-600 mt-1">📎 {app.cvFileName}</p>
                        )}
                      </div>
                    )}

                    {/* Red flags */}
                    {aiAnalysis?.redFlags?.length > 0 && (
                      <div>
                        <p className="text-xs text-red-400 font-semibold uppercase tracking-wider mb-2">Red Flags</p>
                        <div className="space-y-2">
                          {aiAnalysis.redFlags.slice(0, 3).map((flag: any, i: number) => (
                            <div key={i} className="flex items-start gap-2">
                              <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />
                              <div>
                                <p className="text-xs font-semibold text-white">{flag.title}</p>
                                <p className="text-xs text-slate-400">{flag.detail}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Interview recommendation */}
                    {aiAnalysis?.interviewRecommendation && (
                      <div>
                        <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-2">
                          Interview Recommendation
                        </p>
                        <p className="text-xs text-slate-300">{aiAnalysis.interviewRecommendation}</p>
                      </div>
                    )}

                    {/* Action bar */}
                    <div className="flex flex-wrap gap-3 pt-2 border-t border-white/5">

                      {/* Preview CV */}
                      {app.cvFileUrl && (
                        <button
                          onClick={() => handleViewCV(app.id, false)}
                          disabled={cvLoading === app.id}
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-semibold hover:bg-purple-500/20 transition disabled:opacity-50"
                        >
                          {cvLoading === app.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Eye className="w-3.5 h-3.5" />
                          )}
                          Preview CV
                        </button>
                      )}

                      {/* Download CV */}
                      {app.cvFileUrl && (
                        <button
                          onClick={() => handleViewCV(app.id, true)}
                          disabled={cvLoading === app.id}
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold hover:bg-blue-500/20 transition disabled:opacity-50"
                        >
                          <Download className="w-3.5 h-3.5" />
                          Download CV
                        </button>
                      )}

                      {/* No file stored indicator */}
                      {!app.cvFileUrl && app.cvFileName && (
                        <span className="text-xs text-slate-600 flex items-center gap-1">
                          <FileText className="w-3.5 h-3.5" />
                          CV text only (no file stored)
                        </span>
                      )}

                      {/* Email Candidate */}
                      {app.candidateEmail && (
                        <a
                          href={`mailto:${app.candidateEmail}`}
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold hover:bg-blue-500/20 transition"
                        >
                          <Mail className="w-3.5 h-3.5" />
                          Email Candidate
                        </a>
                      )}

                      <Link
                        href="/recruiter/candidates"
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 text-xs font-semibold hover:bg-white/10 transition"
                      >
                        <Users className="w-3.5 h-3.5" />
                        View All Candidates
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}