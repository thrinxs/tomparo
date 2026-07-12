"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  MessageSquare, Clock, CheckCircle, XCircle, Loader2,
  Plus, Search, ArrowRight, Lock, Users, Briefcase,
  AlertTriangle, Trophy, Star, Mic, Video, Type,
  Radio, Copy, Trash2, ChevronDown, SortAsc, SortDesc,
  CornerDownRight, TrendingUp, TrendingDown, Minus,
  RefreshCw, ExternalLink,
} from "lucide-react";
import toast from "react-hot-toast";

// ── Helpers ────────────────────────────────────────────────────────────────────
function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 30) return `${days}d ago`;
  return new Date(date).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" });
}

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
}

function getAvatarColor(name: string) {
  const colors = [
    "bg-purple-500/30 text-purple-300",
    "bg-blue-500/30 text-blue-300",
    "bg-emerald-500/30 text-emerald-300",
    "bg-amber-500/30 text-amber-300",
    "bg-pink-500/30 text-pink-300",
    "bg-indigo-500/30 text-indigo-300",
    "bg-cyan-500/30 text-cyan-300",
    "bg-rose-500/30 text-rose-300",
  ];
  const idx = name.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % colors.length;
  return colors[idx];
}

function getScoreColor(score: number) {
  if (score >= 70) return "text-emerald-400";
  if (score >= 50) return "text-amber-400";
  return "text-red-400";
}

function getScoreDot(score: number) {
  if (score >= 70) return "bg-emerald-400";
  if (score >= 50) return "bg-amber-400";
  return "bg-red-400";
}

// ── Config ─────────────────────────────────────────────────────────────────────
const statusConfig = {
  PENDING: { label: "Pending", color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20", icon: Clock },
  IN_PROGRESS: { label: "In Progress", color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20", icon: MessageSquare },
  COMPLETED: { label: "Completed", color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20", icon: CheckCircle },
  CANCELLED: { label: "Cancelled", color: "text-slate-400", bg: "bg-slate-500/10", border: "border-slate-500/20", icon: XCircle },
};

const typeConfig = {
  TEXT: { label: "Text", color: "text-indigo-400", bg: "bg-indigo-500/10", border: "border-indigo-500/20", icon: Type },
  VOICE: { label: "Voice", color: "text-violet-400", bg: "bg-violet-500/10", border: "border-violet-500/20", icon: Mic },
  VIDEO: { label: "Video", color: "text-pink-400", bg: "bg-pink-500/10", border: "border-pink-500/20", icon: Video },
};

const modeConfig = {
  ASYNC: { label: "Async", color: "text-purple-400", bg: "bg-purple-500/10" },
  LIVE: { label: "Live", color: "text-blue-400", bg: "bg-blue-500/10" },
};

const recommendationConfig: Record<string, { color: string; bg: string; icon: any }> = {
  "Strong Hire": { color: "text-emerald-400", bg: "bg-emerald-500/10", icon: Trophy },
  "Hire": { color: "text-blue-400", bg: "bg-blue-500/10", icon: CheckCircle },
  "Maybe": { color: "text-amber-400", bg: "bg-amber-500/10", icon: AlertTriangle },
  "No Hire": { color: "text-red-400", bg: "bg-red-500/10", icon: XCircle },
};

const emptyMessages: Record<string, { title: string; desc: string }> = {
  ALL: { title: "No interviews yet", desc: "Go to a candidate profile and click the ⚡ Interview button to begin." },
  PENDING: { title: "No pending interviews", desc: "All candidates have responded or no interviews have been sent yet." },
  IN_PROGRESS: { title: "No active interviews", desc: "No interviews are currently in progress." },
  COMPLETED: { title: "No completed interviews", desc: "Completed interviews with AI scores and summaries will appear here." },
  CANCELLED: { title: "No cancelled interviews", desc: "You have no cancelled interviews." },
};

const sortOptions = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "score_high", label: "Highest score" },
  { value: "score_low", label: "Lowest score" },
  { value: "name_az", label: "Name A–Z" },
];

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function InterviewsPage() {
  const [interviews, setInterviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [locked, setLocked] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [sortBy, setSortBy] = useState("newest");
  const [showSort, setShowSort] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [liveInterviews, setLiveInterviews] = useState<any[]>([]);

  const fetchInterviews = useCallback(async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const res = await fetch("/api/recruiter/interviews");
      if (res.status === 403) { setLocked(true); return; }
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      const list = data.interviews || [];
      setInterviews(list);
      setLiveInterviews(list.filter((i: any) => i.isLive));
    } catch (err: any) {
      toast.error(err.message || "Failed to load interviews");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchInterviews(); }, [fetchInterviews]);

  // ── Stats ──
  const stats = {
    total: interviews.length,
    active: interviews.filter((i) => i.status === "IN_PROGRESS").length,
    completed: interviews.filter((i) => i.status === "COMPLETED").length,
    avgScore: (() => {
      const scored = interviews.filter((i) => i.finalScore != null);
      if (!scored.length) return null;
      return Math.round(scored.reduce((a, i) => a + i.finalScore, 0) / scored.length);
    })(),
  };

  // ── Filter + Sort ──
  const filtered = interviews
    .filter((i) => {
      const matchSearch = !search ||
        i.candidateName?.toLowerCase().includes(search.toLowerCase()) ||
        i.jobTitle?.toLowerCase().includes(search.toLowerCase()) ||
        i.candidateEmail?.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === "ALL" || i.status === statusFilter;
      return matchSearch && matchStatus;
    })
    .sort((a, b) => {
      if (sortBy === "newest") return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      if (sortBy === "oldest") return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      if (sortBy === "score_high") return (b.finalScore ?? -1) - (a.finalScore ?? -1);
      if (sortBy === "score_low") return (a.finalScore ?? 999) - (b.finalScore ?? 999);
      if (sortBy === "name_az") return a.candidateName.localeCompare(b.candidateName);
      return 0;
    });

  const counts = {
    ALL: interviews.length,
    PENDING: interviews.filter((i) => i.status === "PENDING").length,
    IN_PROGRESS: interviews.filter((i) => i.status === "IN_PROGRESS").length,
    COMPLETED: interviews.filter((i) => i.status === "COMPLETED").length,
    CANCELLED: interviews.filter((i) => i.status === "CANCELLED").length,
  };

  // ── Selection ──
  const toggleSelect = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map((i) => i.id)));
    }
  };

  // ── Copy share link ──
  const copyLink = (shareToken: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(`${window.location.origin}/interview/${shareToken}`);
    toast.success("Interview link copied!");
  };

  // ── Delete ──
  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm("Delete this interview? This cannot be undone.")) return;
    try {
      const res = await fetch(`/api/recruiter/interviews/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      setInterviews((prev) => prev.filter((i) => i.id !== id));
      setSelectedIds((prev) => { const next = new Set(prev); next.delete(id); return next; });
      toast.success("Interview deleted");
    } catch { toast.error("Failed to delete interview"); }
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Delete ${selectedIds.size} interviews? This cannot be undone.`)) return;
    setDeleting(true);
    let deleted = 0;
    for (const id of selectedIds) {
      try {
        const res = await fetch(`/api/recruiter/interviews/${id}`, { method: "DELETE" });
        if (res.ok) deleted++;
      } catch {}
    }
    setInterviews((prev) => prev.filter((i) => !selectedIds.has(i.id)));
    setSelectedIds(new Set());
    setDeleting(false);
    toast.success(`${deleted} interview${deleted !== 1 ? "s" : ""} deleted`);
  };

  // ── Locked screen ──
  if (locked) {
    return (
      <div className="max-w-2xl mx-auto py-20 text-center">
        <div className="w-16 h-16 rounded-2xl bg-purple-500/10 flex items-center justify-center mx-auto mb-6">
          <Lock className="w-8 h-8 text-purple-400" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-3">AI Interviews — Business+</h2>
        <p className="text-slate-400 mb-8">Upgrade to Business plan or higher to conduct AI-powered interviews.</p>
        <Link href="/recruiter-pricing" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-purple-600 text-white font-semibold hover:bg-purple-500 transition">
          View Plans <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">

      {/* ── Live Alert ── */}
      {liveInterviews.length > 0 && (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-400" />
            </span>
            <p className="text-sm font-semibold text-red-400">
              {liveInterviews.length} interview{liveInterviews.length > 1 ? "s" : ""} live right now
            </p>
            <p className="text-xs text-slate-400 hidden sm:block">
              {liveInterviews.map((i) => i.candidateName).join(", ")}
            </p>
          </div>
          <div className="flex gap-2">
            {liveInterviews.slice(0, 2).map((i) => (
              <Link key={i.id} href={`/recruiter/interviews/${i.id}`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/20 text-red-400 text-xs font-semibold hover:bg-red-500/30 transition">
                <Radio className="w-3 h-3" /> Join
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ── Header ── */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">AI Interviews</h1>
          <p className="text-slate-400 mt-1 text-sm">
            {interviews.length} total · {counts.IN_PROGRESS} in progress · {counts.COMPLETED} completed
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => fetchInterviews(true)} disabled={refreshing}
            className="p-2.5 rounded-xl border border-white/10 bg-white/[0.02] text-slate-400 hover:text-white hover:bg-white/5 transition disabled:opacity-50">
            <RefreshCw className={`w-4 h-4 transition-transform duration-700 ${refreshing ? "animate-spin" : ""}`} />
          </button>
          <Link href="/recruiter/candidates"
            className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-purple-500 transition">
            <Plus className="w-4 h-4" /> Start Interview
          </Link>
        </div>
      </div>

      {/* ── Stats Bar ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total", value: stats.total, icon: MessageSquare, color: "text-purple-400", bg: "bg-purple-500/10" },
          { label: "Active", value: stats.active, icon: Radio, color: "text-blue-400", bg: "bg-blue-500/10" },
          { label: "Completed", value: stats.completed, icon: CheckCircle, color: "text-emerald-400", bg: "bg-emerald-500/10" },
          {
            label: "Avg Score",
            value: stats.avgScore != null ? `${stats.avgScore}/100` : "—",
            icon: stats.avgScore != null ? (stats.avgScore >= 70 ? TrendingUp : stats.avgScore >= 50 ? Minus : TrendingDown) : Star,
            color: stats.avgScore != null ? getScoreColor(stats.avgScore) : "text-slate-400",
            bg: "bg-white/[0.02]",
          },
        ].map((stat) => (
          <div key={stat.label} className="rounded-2xl border border-white/5 bg-white/[0.02] p-4 flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl ${stat.bg} flex items-center justify-center shrink-0`}>
              <stat.icon className={`w-4 h-4 ${stat.color}`} />
            </div>
            <div>
              <p className="text-xs text-slate-500">{stat.label}</p>
              <p className={`text-lg font-bold ${stat.color}`}>{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Search + Sort ── */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by candidate, job or email..."
            className="w-full rounded-xl border border-white/10 bg-white/[0.02] pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-purple-500/50 transition"
          />
        </div>
        <div className="relative">
          <button onClick={() => setShowSort(!showSort)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/10 bg-white/[0.02] text-sm text-slate-400 hover:text-white transition">
            <SortAsc className="w-4 h-4" />
            {sortOptions.find((s) => s.value === sortBy)?.label}
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
          {showSort && (
            <div className="absolute right-0 top-full mt-1 w-44 rounded-xl border border-white/10 bg-slate-900 shadow-xl z-20 overflow-hidden">
              {sortOptions.map((opt) => (
                <button key={opt.value} onClick={() => { setSortBy(opt.value); setShowSort(false); }}
                  className={`w-full text-left px-4 py-2.5 text-sm transition ${sortBy === opt.value ? "bg-purple-600 text-white" : "text-slate-400 hover:bg-white/5 hover:text-white"}`}>
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Status Tabs ── */}
      <div className="flex gap-2 flex-wrap">
        {(["ALL", "PENDING", "IN_PROGRESS", "COMPLETED", "CANCELLED"] as const).map((s) => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition ${statusFilter === s ? "bg-purple-600 text-white" : "bg-white/5 border border-white/10 text-slate-400 hover:text-white"}`}>
            {s === "ALL" ? "All" : s === "IN_PROGRESS" ? "In Progress" : s.charAt(0) + s.slice(1).toLowerCase()}
            <span className="ml-2 text-xs opacity-70">{counts[s]}</span>
          </button>
        ))}
      </div>

      {/* ── Bulk Action Bar ── */}
      {selectedIds.size > 0 && (
        <div className="rounded-xl border border-white/10 bg-slate-900 px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <input type="checkbox" checked={selectedIds.size === filtered.length}
              onChange={selectAll}
              className="w-4 h-4 rounded accent-purple-600 cursor-pointer"
            />
            <p className="text-sm text-white font-medium">{selectedIds.size} selected</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setSelectedIds(new Set())}
              className="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white border border-white/10 hover:bg-white/5 transition">
              Clear
            </button>
            <button onClick={handleBulkDelete} disabled={deleting}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-red-400 border border-red-500/20 bg-red-500/10 hover:bg-red-500/20 transition disabled:opacity-50">
              {deleting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
              Delete {selectedIds.size}
            </button>
          </div>
        </div>
      )}

      {/* ── Select All Row ── */}
      {filtered.length > 0 && selectedIds.size === 0 && (
        <div className="flex items-center gap-3 px-1">
          <input type="checkbox" onChange={selectAll} checked={false}
            className="w-4 h-4 rounded accent-purple-600 cursor-pointer"
          />
          <p className="text-xs text-slate-500">Select all {filtered.length} interviews</p>
        </div>
      )}

      {/* ── List ── */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-slate-500" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-16 text-center">
          <MessageSquare className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">
            {emptyMessages[statusFilter]?.title || "No interviews"}
          </h3>
          <p className="text-slate-400 text-sm mb-6">
            {emptyMessages[statusFilter]?.desc || ""}
          </p>
          {statusFilter === "ALL" && (
            <Link href="/recruiter/candidates"
              className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-purple-500 transition">
              <Users className="w-4 h-4" /> View Candidates
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((interview) => {
            const status = statusConfig[interview.status as keyof typeof statusConfig];
            const StatusIcon = status?.icon || Clock;
            const type = typeConfig[interview.interviewType as keyof typeof typeConfig];
            const TypeIcon = type?.icon || MessageSquare;
            const mode = modeConfig[interview.mode as keyof typeof modeConfig];
            const rec = interview.finalRecommendation ? recommendationConfig[interview.finalRecommendation] : null;
            const RecIcon = rec?.icon;
            const progress = interview.totalQuestions > 0
              ? Math.round((interview.answeredQuestions / interview.totalQuestions) * 100) : 0;
            const isSelected = selectedIds.has(interview.id);
            const isLive = interview.isLive;
            const avatarColor = getAvatarColor(interview.candidateName);

            return (
              <div key={interview.id}
                className={`relative rounded-2xl border transition group ${
                  isSelected ? "border-purple-500/40 bg-purple-500/5" :
                  isLive ? "border-red-500/20 bg-red-500/5" :
                  "border-white/5 bg-white/[0.02] hover:border-white/10"
                }`}>

                {/* Live pulse */}
                {isLive && (
                  <div className="absolute top-3 right-3 flex items-center gap-1.5">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-400" />
                    </span>
                    <span className="text-xs font-semibold text-red-400">LIVE</span>
                  </div>
                )}

                <div className="p-5">
                  <div className="flex items-start gap-4">

                    {/* Checkbox */}
                    <div className="pt-0.5 shrink-0" onClick={(e) => e.preventDefault()}>
                      <input type="checkbox" checked={isSelected}
                        onChange={(e) => { e.stopPropagation(); toggleSelect(interview.id, e as any); }}
                        className="w-4 h-4 rounded accent-purple-600 cursor-pointer"
                      />
                    </div>

                    {/* Avatar */}
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 font-bold text-sm ${avatarColor}`}>
                      {getInitials(interview.candidateName)}
                    </div>

                    {/* Content */}
                    <Link href={`/recruiter/interviews/${interview.id}`} className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <h3 className="text-base font-semibold text-white group-hover:text-purple-300 transition">
                          {interview.candidateName}
                        </h3>

                        {/* Status badge */}
                        {status && (
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${status.bg} ${status.border} ${status.color}`}>
                            <StatusIcon className="w-3 h-3" />
                            {status.label}
                          </span>
                        )}

                        {/* Type badge */}
                        {type && (
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${type.bg} ${type.border} ${type.color}`}>
                            <TypeIcon className="w-3 h-3" />
                            {type.label}
                          </span>
                        )}

                        {/* Mode badge */}
                        {mode && (
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${mode.bg} ${mode.color}`}>
                            {mode.label}
                          </span>
                        )}

                        {/* Follow-ups badge */}
                        {interview.followUpCount > 0 && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                            <CornerDownRight className="w-3 h-3" />
                            +{interview.followUpCount} follow-up{interview.followUpCount > 1 ? "s" : ""}
                          </span>
                        )}
                      </div>

                      {/* Email + meta */}
                      <div className="flex flex-wrap gap-3 text-xs text-slate-400 mb-3">
                        {interview.candidateEmail && (
                          <span className="text-slate-500">{interview.candidateEmail}</span>
                        )}
                        {interview.jobTitle && (
                          <span className="flex items-center gap-1">
                            <Briefcase className="w-3 h-3" />
                            {interview.jobTitle}
                          </span>
                        )}
                        <span>{timeAgo(interview.createdAt)}</span>
                        <span>{interview.answeredQuestions}/{interview.totalQuestions} answered</span>
                      </div>

                      {/* Progress bar */}
                      {interview.status !== "PENDING" && (
                        <div className="flex items-center gap-3">
                          <div className="flex-1 h-1.5 rounded-full bg-white/5">
                            <div className="h-1.5 rounded-full bg-purple-500 transition-all"
                              style={{ width: `${progress}%` }} />
                          </div>
                          <span className="text-xs text-slate-500 w-8 text-right">{progress}%</span>
                        </div>
                      )}
                    </Link>

                    {/* Right side */}
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      {/* Score */}
                      {interview.finalScore != null && (
                        <div className="flex items-center gap-1.5">
                          <div className={`w-2 h-2 rounded-full ${getScoreDot(interview.finalScore)}`} />
                          <span className={`text-sm font-bold ${getScoreColor(interview.finalScore)}`}>
                            {interview.finalScore}/100
                          </span>
                        </div>
                      )}

                      {/* Recommendation */}
                      {rec && RecIcon && (
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${rec.bg} ${rec.color}`}>
                          <RecIcon className="w-3 h-3" />
                          {interview.finalRecommendation}
                        </span>
                      )}

                      {/* Quick actions — visible on hover */}
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition mt-1">
                        <button onClick={(e) => copyLink(interview.shareToken, e)}
                          title="Copy interview link"
                          className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/10 transition">
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <Link href={`/recruiter/interviews/${interview.id}`}
                          onClick={(e) => e.stopPropagation()}
                          title="Open interview"
                          className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/10 transition">
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Link>
                        <button onClick={(e) => handleDelete(interview.id, e)}
                          title="Delete interview"
                          className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
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
