"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Users, Search, Upload, ArrowRight,
  CheckCircle, XCircle, AlertTriangle, Clock, Star, Trophy,
  Mail, Send, Loader2, X, ChevronDown, Wand2,
} from "lucide-react";
import toast from "react-hot-toast";

const statusConfig = {
  NEW: { label: "New", color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20", dot: "bg-blue-400" },
  REVIEWED: { label: "Reviewed", color: "text-purple-400", bg: "bg-purple-500/10", border: "border-purple-500/20", dot: "bg-purple-400" },
  SHORTLISTED: { label: "Shortlisted", color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20", dot: "bg-amber-400" },
  REJECTED: { label: "Rejected", color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/20", dot: "bg-red-400" },
  HIRED: { label: "Hired", color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20", dot: "bg-emerald-400" },
};

const recommendationConfig = {
  "Strong Hire": { color: "text-emerald-400", icon: CheckCircle },
  "Hire": { color: "text-blue-400", icon: CheckCircle },
  "Maybe": { color: "text-amber-400", icon: AlertTriangle },
  "No Hire": { color: "text-red-400", icon: XCircle },
};

const emailTypes = [
  { value: "interview_invite", label: "Interview Invite", icon: "📅" },
  { value: "rejection", label: "Rejection", icon: "❌" },
  { value: "offer", label: "Job Offer", icon: "🎉" },
  { value: "followup", label: "Follow Up", icon: "👋" },
  { value: "waitlist", label: "Waitlist", icon: "⏳" },
];

function CandidatesInner() {
  const searchParams = useSearchParams();
  const jobFilter = searchParams.get("job") || "";

  const [candidates, setCandidates] = useState<any[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [jobId, setJobId] = useState(jobFilter);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // ── Bulk email state ──
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectMode, setSelectMode] = useState(false);
  const [bulkEmailType, setBulkEmailType] = useState("interview_invite");
  const [bulkJobTitle, setBulkJobTitle] = useState("");
  const [bulkMessage, setBulkMessage] = useState("");
  const [bulkGenerating, setBulkGenerating] = useState(false);
  const [bulkSending, setBulkSending] = useState(false);
  const [bulkResults, setBulkResults] = useState<any[] | null>(null);
  const [showBulkPanel, setShowBulkPanel] = useState(false);

  const fetchCandidates = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "ALL") params.set("status", statusFilter);
      if (jobId) params.set("jobId", jobId);
      if (search) params.set("search", search);
      const res = await fetch(`/api/recruiter/candidates?${params}`);
      const data = await res.json();
      if (data.candidates) setCandidates(data.candidates);
    } catch {
      toast.error("Failed to load candidates");
    } finally {
      setLoading(false);
    }
  }, [statusFilter, jobId, search]);

  const fetchJobs = async () => {
    try {
      const res = await fetch("/api/recruiter/jobs");
      const data = await res.json();
      if (data.jobs) setJobs(data.jobs);
    } catch {}
  };

  useEffect(() => { fetchJobs(); }, []);
  useEffect(() => { fetchCandidates(); }, [fetchCandidates]);

  const updateStatus = async (candidateId: string, status: string) => {
    setUpdatingId(candidateId);
    try {
      const res = await fetch(`/api/recruiter/candidates/${candidateId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error();
      setCandidates((prev) => prev.map((c) => c.id === candidateId ? { ...c, status } : c));
      toast.success(`Candidate ${status.toLowerCase()}`);
    } catch {
      toast.error("Failed to update status");
    } finally {
      setUpdatingId(null);
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    const withEmail = candidates
      .filter((c) => c.candidateEmail)
      .map((c) => c.id);
    setSelectedIds(new Set(withEmail));
  };

  const deselectAll = () => setSelectedIds(new Set());

  const handleGenerateBulkMessage = async () => {
    if (!bulkJobTitle.trim()) {
      toast.error("Enter a job title first");
      return;
    }
    setBulkGenerating(true);
    try {
      const res = await fetch("/api/recruiter/emails/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: bulkEmailType,
          candidateName: "the candidate",
          jobTitle: bulkJobTitle,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setBulkMessage(data.result?.message || "");
      toast.success("Message generated!");
    } catch (err: any) {
      toast.error(err.message || "Failed to generate");
    } finally {
      setBulkGenerating(false);
    }
  };

  const handleBulkSend = async () => {
    if (selectedIds.size === 0) {
      toast.error("Select at least one candidate");
      return;
    }

    setBulkSending(true);
    setBulkResults(null);

    try {
      const res = await fetch("/api/recruiter/emails/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: bulkEmailType,
          candidateIds: Array.from(selectedIds),
          jobTitle: bulkJobTitle || undefined,
          customMessage: bulkMessage || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.upgradeRequired) {
          toast.error("Bulk email requires Business plan or higher");
          return;
        }
        throw new Error(data.error);
      }

      setBulkResults(data.results);
      toast.success(`${data.summary.successful} of ${data.summary.total} emails sent!`);
      setSelectedIds(new Set());
      setSelectMode(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to send bulk emails");
    } finally {
      setBulkSending(false);
    }
  };

  const counts = {
    ALL: candidates.length,
    NEW: candidates.filter((c) => c.status === "NEW").length,
    REVIEWED: candidates.filter((c) => c.status === "REVIEWED").length,
    SHORTLISTED: candidates.filter((c) => c.status === "SHORTLISTED").length,
    REJECTED: candidates.filter((c) => c.status === "REJECTED").length,
    HIRED: candidates.filter((c) => c.status === "HIRED").length,
  };

  const getAtsColor = (score: number) =>
    score >= 80 ? "text-emerald-400" : score >= 60 ? "text-amber-400" : "text-red-400";

  const candidatesWithEmail = candidates.filter((c) => c.candidateEmail).length;

  return (
    <div className="max-w-6xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Candidates</h1>
          <p className="text-slate-400 mt-1">
            {candidates.length} total · {counts.SHORTLISTED} shortlisted · {counts.HIRED} hired
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Bulk email toggle */}
          <button
            onClick={() => {
              setSelectMode(!selectMode);
              if (selectMode) {
                setSelectedIds(new Set());
                setShowBulkPanel(false);
              }
            }}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
              selectMode
                ? "bg-blue-600 text-white hover:bg-blue-500"
                : "border border-white/10 bg-white/5 text-slate-400 hover:text-white hover:bg-white/10"
            }`}
          >
            <Mail className="w-4 h-4" />
            {selectMode ? `${selectedIds.size} selected` : "Bulk Email"}
          </button>
          <Link
            href="/recruiter/upload"
            className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-purple-500 transition"
          >
            <Upload className="w-4 h-4" />
            Upload CV
          </Link>
        </div>
      </div>

      {/* Bulk email panel */}
      {selectMode && (
        <div className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-white">
                Bulk Email — {selectedIds.size} candidate{selectedIds.size !== 1 ? "s" : ""} selected
              </p>
              <p className="text-xs text-slate-400 mt-0.5">
                {candidatesWithEmail} candidates have email addresses
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={selectAll}
                className="px-3 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-medium hover:bg-blue-500/20 transition"
              >
                Select All ({candidatesWithEmail})
              </button>
              <button
                onClick={deselectAll}
                className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-slate-400 text-xs font-medium hover:bg-white/10 transition"
              >
                Deselect All
              </button>
              <button
                onClick={() => setShowBulkPanel(!showBulkPanel)}
                disabled={selectedIds.size === 0}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600 text-white text-xs font-semibold hover:bg-purple-500 transition disabled:opacity-50"
              >
                Compose Email
                <ChevronDown className={`w-3 h-3 transition-transform ${showBulkPanel ? "rotate-180" : ""}`} />
              </button>
            </div>
          </div>

          {/* Compose panel */}
          {showBulkPanel && selectedIds.size > 0 && (
            <div className="space-y-4 pt-4 border-t border-white/5">

              {/* Email type */}
              <div>
                <p className="text-xs font-semibold text-white uppercase tracking-wider mb-3">
                  Email Type
                </p>
                <div className="flex flex-wrap gap-2">
                  {emailTypes.map((t) => (
                    <button
                      key={t.value}
                      onClick={() => setBulkEmailType(t.value)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition border ${
                        bulkEmailType === t.value
                          ? "bg-purple-600 border-purple-600 text-white"
                          : "border-white/10 bg-white/[0.02] text-slate-400 hover:border-white/20"
                      }`}
                    >
                      <span>{t.icon}</span>
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Job title */}
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-2">
                  Job Title <span className="text-slate-600">(used to personalize each email)</span>
                </label>
                <input
                  type="text"
                  value={bulkJobTitle}
                  onChange={(e) => setBulkJobTitle(e.target.value)}
                  placeholder="e.g. Senior React Developer"
                  className="w-full rounded-xl border border-white/10 bg-slate-900/50 px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-blue-500/50 transition"
                />
              </div>

              {/* Message */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-medium text-slate-400">
                    Message <span className="text-slate-600">(optional — AI generates if empty)</span>
                  </label>
                  <button
                    onClick={handleGenerateBulkMessage}
                    disabled={bulkGenerating || !bulkJobTitle.trim()}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs font-semibold hover:opacity-90 transition disabled:opacity-50"
                  >
                    {bulkGenerating ? (
                      <><Loader2 className="w-3 h-3 animate-spin" />Generating...</>
                    ) : (
                      <><Wand2 className="w-3 h-3" />Write with AI</>
                    )}
                  </button>
                </div>
                <textarea
                  value={bulkMessage}
                  onChange={(e) => setBulkMessage(e.target.value)}
                  placeholder="Leave empty to let AI write a personalized message for each candidate..."
                  rows={4}
                  className="w-full rounded-xl border border-white/10 bg-slate-900/50 px-4 py-3 text-sm text-white placeholder-slate-500 outline-none focus:border-blue-500/50 resize-none transition"
                />
              </div>

              {/* Send button */}
              <div className="flex items-center justify-between gap-4">
                <p className="text-xs text-slate-500">
                  Will send to{" "}
                  <span className="text-white font-semibold">{selectedIds.size}</span>{" "}
                  candidate{selectedIds.size !== 1 ? "s" : ""}
                  {!bulkMessage && " · AI will personalize each email"}
                </p>
                <button
                  onClick={handleBulkSend}
                  disabled={bulkSending || selectedIds.size === 0}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-500 transition disabled:opacity-50"
                >
                  {bulkSending ? (
                    <><Loader2 className="w-4 h-4 animate-spin" />Sending...</>
                  ) : (
                    <><Send className="w-4 h-4" />Send to {selectedIds.size} Candidates</>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Bulk results */}
          {bulkResults && (
            <div className="pt-4 border-t border-white/5">
              <p className="text-xs font-semibold text-white uppercase tracking-wider mb-3">
                Results — {bulkResults.filter((r) => r.success).length} sent · {bulkResults.filter((r) => !r.success).length} failed
              </p>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {bulkResults.map((result, i) => (
                  <div key={i} className={`flex items-center justify-between gap-3 px-3 py-2 rounded-lg text-xs ${
                    result.success
                      ? "bg-emerald-500/5 border border-emerald-500/20"
                      : "bg-red-500/5 border border-red-500/20"
                  }`}>
                    <span className={result.success ? "text-emerald-400" : "text-red-400"}>
                      {result.success ? "✅" : "❌"} {result.candidateName}
                    </span>
                    <span className="text-slate-500">{result.email}</span>
                    {result.error && <span className="text-red-400">{result.error}</span>}
                  </div>
                ))}
              </div>
              <button
                onClick={() => setBulkResults(null)}
                className="mt-3 text-xs text-slate-500 hover:text-white transition"
              >
                Dismiss results
              </button>
            </div>
          )}
        </div>
      )}

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
            value={jobId}
            onChange={(e) => setJobId(e.target.value)}
            className="rounded-xl border border-white/10 bg-white/[0.02] px-4 py-2.5 text-sm text-white outline-none focus:border-purple-500/50 transition"
          >
            <option value="" className="bg-slate-900">All Jobs</option>
            {jobs.map((j) => (
              <option key={j.id} value={j.id} className="bg-slate-900">{j.title}</option>
            ))}
          </select>
        )}
      </div>

      {/* Status tabs */}
      <div className="flex gap-2 flex-wrap">
        {(["ALL", "NEW", "REVIEWED", "SHORTLISTED", "REJECTED", "HIRED"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
              statusFilter === s
                ? "bg-purple-600 text-white"
                : "bg-white/5 border border-white/10 text-slate-400 hover:text-white"
            }`}
          >
            {s === "ALL" ? "All" : statusConfig[s].label}
            <span className="ml-2 text-xs opacity-70">{counts[s]}</span>
          </button>
        ))}
      </div>

      {/* Candidate List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="rounded-2xl border border-white/5 bg-white/[0.02] p-5 animate-pulse">
              <div className="h-4 bg-white/5 rounded w-1/3 mb-2" />
              <div className="h-3 bg-white/5 rounded w-1/4" />
            </div>
          ))}
        </div>
      ) : candidates.length === 0 ? (
        <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-16 text-center">
          <Users className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">No candidates yet</h3>
          <p className="text-slate-400 text-sm mb-6">Upload a CV to start building your candidate list.</p>
          <Link
            href="/recruiter/upload"
            className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-purple-500 transition"
          >
            <Upload className="w-4 h-4" />
            Upload First CV
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {candidates.map((candidate) => {
            const status = statusConfig[candidate.status as keyof typeof statusConfig] || statusConfig.NEW;
            const analysis = candidate.aiAnalysis ? JSON.parse(candidate.aiAnalysis) : null;
            const recommendation = analysis?.hiringRecommendation as keyof typeof recommendationConfig | undefined;
            const recConfig = recommendation ? recommendationConfig[recommendation] : null;
            const RecIcon = recConfig?.icon;
            const isSelected = selectedIds.has(candidate.id);
            const hasEmail = !!candidate.candidateEmail;

            return (
              <div
                key={candidate.id}
                className={`rounded-2xl border transition ${
                  isSelected
                    ? "border-blue-500/40 bg-blue-500/5"
                    : "border-white/5 bg-white/[0.02] hover:border-white/10"
                }`}
              >
                <div className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1 min-w-0">

                      {/* Checkbox (select mode) or Avatar */}
                      {selectMode ? (
                        <button
                          onClick={() => hasEmail && toggleSelect(candidate.id)}
                          disabled={!hasEmail}
                          className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition ${
                            !hasEmail
                              ? "bg-white/5 opacity-30 cursor-not-allowed"
                              : isSelected
                              ? "bg-blue-500 border-2 border-blue-400"
                              : "bg-white/5 border-2 border-white/20 hover:border-blue-400"
                          }`}
                        >
                          {isSelected && <CheckCircle className="w-5 h-5 text-white" />}
                        </button>
                      ) : (
                        <div className="w-11 h-11 rounded-xl bg-purple-500/20 flex items-center justify-center shrink-0">
                          <span className="text-purple-400 font-bold text-sm">
                            {(candidate.candidateName || candidate.fileName || "?")
                              .split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)}
                          </span>
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <h3 className="text-base font-semibold text-white truncate">
                            {candidate.candidateName || "Unknown Candidate"}
                          </h3>
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${status.bg} ${status.border} ${status.color}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                            {status.label}
                          </span>
                        </div>

                        <div className="flex flex-wrap gap-3 text-xs text-slate-400 mb-3">
                          {candidate.candidateEmail && <span>{candidate.candidateEmail}</span>}
                          {candidate.job && <span className="text-purple-400">📋 {candidate.job.title}</span>}
                          <span className="text-slate-600">
                            {new Date(candidate.createdAt).toLocaleDateString("en-NG", {
                              day: "numeric", month: "short", year: "numeric",
                            })}
                          </span>
                        </div>

                        <div className="flex flex-wrap gap-3">
                          <div className="flex items-center gap-1.5">
                            <Star className="w-3.5 h-3.5 text-slate-500" />
                            <span className="text-xs text-slate-400">ATS:</span>
                            <span className={`text-xs font-bold ${getAtsColor(candidate.atsScore || 0)}`}>
                              {candidate.atsScore || 0}/100
                            </span>
                          </div>
                          {recConfig && RecIcon && (
                            <div className="flex items-center gap-1.5">
                              <RecIcon className={`w-3.5 h-3.5 ${recConfig.color}`} />
                              <span className={`text-xs font-semibold ${recConfig.color}`}>{recommendation}</span>
                            </div>
                          )}
                          {analysis?.totalExperienceYears != null && (
                            <div className="flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5 text-slate-500" />
                              <span className="text-xs text-slate-400">{analysis.totalExperienceYears} yrs exp</span>
                            </div>
                          )}
                          {analysis?.experienceLevel && (
                            <span className="px-2 py-0.5 rounded-full bg-white/5 text-xs text-slate-400">
                              {analysis.experienceLevel}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    {!selectMode && (
                      <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2 shrink-0">
                        <div className="flex gap-1.5">
                          {candidate.status !== "SHORTLISTED" && (
                            <button
                              onClick={() => updateStatus(candidate.id, "SHORTLISTED")}
                              disabled={updatingId === candidate.id}
                              className="px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-medium hover:bg-amber-500/20 transition disabled:opacity-50"
                            >
                              Shortlist
                            </button>
                          )}
                          {candidate.status !== "REJECTED" && (
                            <button
                              onClick={() => updateStatus(candidate.id, "REJECTED")}
                              disabled={updatingId === candidate.id}
                              className="px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium hover:bg-red-500/20 transition disabled:opacity-50"
                            >
                              Reject
                            </button>
                          )}
                          {candidate.status === "SHORTLISTED" && (
                            <button
                              onClick={() => updateStatus(candidate.id, "HIRED")}
                              disabled={updatingId === candidate.id}
                              className="px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium hover:bg-emerald-500/20 transition disabled:opacity-50"
                            >
                              <Trophy className="w-3 h-3 inline mr-1" />
                              Hire
                            </button>
                          )}
                        </div>

                        {candidate.candidateEmail && (
                          <Link
                            href={`/recruiter/candidates/${candidate.id}#email`}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-medium hover:bg-blue-500/20 transition"
                          >
                            <Mail className="w-3 h-3" />
                            Email
                          </Link>
                        )}

                        <Link
                          href={`/recruiter/candidates/${candidate.id}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-medium hover:bg-purple-500/20 transition"
                        >
                          View
                          <ArrowRight className="w-3 h-3" />
                        </Link>
                      </div>
                    )}

                    {/* Select mode indicator */}
                    {selectMode && !hasEmail && (
                      <span className="text-xs text-slate-600 shrink-0">No email</span>
                    )}
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

export default function CandidatesPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-purple-500 border-t-transparent" />
      </div>
    }>
      <CandidatesInner />
    </Suspense>
  );
}