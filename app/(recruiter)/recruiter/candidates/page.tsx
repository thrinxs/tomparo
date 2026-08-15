"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import {
  Users, Search, Upload, ArrowRight,
  CheckCircle, XCircle, AlertTriangle, Clock, Star, Trophy,
  Mail, Send, Loader2, X, ChevronDown, Wand2,
  Video, MessageSquare, Mic, Zap,
  FileText,
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

// ── Interview Mode Modal ──────────────────────────────────────────────────────
function InterviewModeModal({
  candidate,
  onClose,
  onConfirm,
}: {
  candidate: any;
  onClose: () => void;
  onConfirm: (mode: "ASYNC" | "LIVE") => void;
}) {
  const [selected, setSelected] = useState<"ASYNC" | "LIVE" | null>(null);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl">
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/10 transition"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <Zap className="w-5 h-5 text-indigo-400" />
            <h2 className="text-lg font-bold text-white">Start AI Interview</h2>
          </div>
          <p className="text-sm text-slate-400">
            Interviewing{" "}
            <span className="text-white font-semibold">
              {candidate.candidateName || "this candidate"}
            </span>
          </p>
        </div>

        {/* Mode options */}
        <div className="space-y-3 mb-6">

          {/* ASYNC */}
          <button
            onClick={() => setSelected("ASYNC")}
            className={`w-full text-left rounded-xl border p-4 transition ${
              selected === "ASYNC"
                ? "border-indigo-500 bg-indigo-500/10"
                : "border-white/10 bg-white/[0.02] hover:border-white/20"
            }`}
          >
            <div className="flex items-start gap-3">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                selected === "ASYNC" ? "bg-indigo-500/20" : "bg-white/5"
              }`}>
                <MessageSquare className={`w-4 h-4 ${selected === "ASYNC" ? "text-indigo-400" : "text-slate-500"}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className={`text-sm font-semibold ${selected === "ASYNC" ? "text-white" : "text-slate-300"}`}>
                    Async Interview
                  </p>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-indigo-500/20 text-indigo-400 uppercase tracking-wide">
                    Recommended
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  AI generates questions and sends the candidate a private link.
                  They answer on their own time — you review the scored report when ready.
                </p>
                <div className="flex gap-3 mt-2">
                  <span className="text-[10px] text-slate-500">⏱ No scheduling needed</span>
                  <span className="text-[10px] text-slate-500">🔗 Shareable link</span>
                  <span className="text-[10px] text-slate-500">📊 AI scores every answer</span>
                </div>
              </div>
              {selected === "ASYNC" && (
                <CheckCircle className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
              )}
            </div>
          </button>

          {/* LIVE */}
          <button
            onClick={() => setSelected("LIVE")}
            className={`w-full text-left rounded-xl border p-4 transition ${
              selected === "LIVE"
                ? "border-violet-500 bg-violet-500/10"
                : "border-white/10 bg-white/[0.02] hover:border-white/20"
            }`}
          >
            <div className="flex items-start gap-3">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                selected === "LIVE" ? "bg-violet-500/20" : "bg-white/5"
              }`}>
                <Video className={`w-4 h-4 ${selected === "LIVE" ? "text-violet-400" : "text-slate-500"}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold mb-1 ${selected === "LIVE" ? "text-white" : "text-slate-300"}`}>
                  Live Interview
                </p>
                <p className="text-xs text-slate-400 leading-relaxed">
                  You conduct the interview in real time. AI surfaces questions,
                  scores answers instantly, and generates a summary when you finish.
                </p>
                <div className="flex gap-3 mt-2">
                  <span className="text-[10px] text-slate-500">🎙 Real-time scoring</span>
                  <span className="text-[10px] text-slate-500">📅 Schedule first</span>
                  <span className="text-[10px] text-slate-500">📝 AI summary</span>
                </div>
              </div>
              {selected === "LIVE" && (
                <CheckCircle className="w-4 h-4 text-violet-400 shrink-0 mt-0.5" />
              )}
            </div>
          </button>
        </div>

        {/* Confirm */}
        <button
          onClick={() => selected && onConfirm(selected)}
          disabled={!selected}
          className={`w-full py-3 rounded-xl text-sm font-semibold transition disabled:opacity-40 disabled:cursor-not-allowed ${
            selected === "LIVE"
              ? "bg-violet-600 hover:bg-violet-500 text-white"
              : "bg-indigo-600 hover:bg-indigo-500 text-white"
          }`}
        >
          {selected === "ASYNC"
            ? "Generate Questions & Send Link →"
            : selected === "LIVE"
            ? "Set Up Live Interview →"
            : "Choose an interview type"}
        </button>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
function CandidatesInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const jobFilter = searchParams.get("job") || "";

  const [candidates, setCandidates] = useState<any[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [jobId, setJobId] = useState(jobFilter);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // ── Select mode: 'email' | 'interview' | null ──
  const [selectMode, setSelectMode] = useState<"email" | "interview" | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // ── Bulk email state ──
  const [bulkEmailType, setBulkEmailType] = useState("interview_invite");
  const [bulkJobTitle, setBulkJobTitle] = useState("");
  const [bulkMessage, setBulkMessage] = useState("");
  const [bulkGenerating, setBulkGenerating] = useState(false);
  const [bulkSending, setBulkSending] = useState(false);
  const [bulkResults, setBulkResults] = useState<any[] | null>(null);
  const [showBulkPanel, setShowBulkPanel] = useState(false);

  // ── Bulk interview state ──
  const [bulkInterviewMode, setBulkInterviewMode] = useState<"ASYNC" | "LIVE" | null>(null);
  const [bulkInterviewSending, setBulkInterviewSending] = useState(false);

  // ── Single interview modal ──
  const [interviewModal, setInterviewModal] = useState<{ open: boolean; candidate: any | null }>({
    open: false,
    candidate: null,
  });

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

  // ── Filtered candidates (what's visible in current tab) ──
  const visibleCandidates = candidates.filter((c) =>
    statusFilter === "ALL" ? true : c.status === statusFilter
  );

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

  // ── Selection helpers ──
  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Select all in current visible tab that have email
  const selectAllInTab = () => {
    const eligible = visibleCandidates
      .filter((c) => c.candidateEmail)
      .map((c) => c.id);
    setSelectedIds(new Set(eligible));
  };

  // Select all by a specific status (regardless of current tab)
  const selectAllByStatus = (status: string) => {
    const eligible = candidates
      .filter((c) => (status === "ALL" || c.status === status) && c.candidateEmail)
      .map((c) => c.id);
    setSelectedIds(new Set(eligible));
  };

  const deselectAll = () => setSelectedIds(new Set());

  const exitSelectMode = () => {
    setSelectMode(null);
    setSelectedIds(new Set());
    setShowBulkPanel(false);
    setBulkResults(null);
    setBulkInterviewMode(null);
  };

  // ── Single interview click ──
  const handleInterviewClick = (candidate: any) => {
    setInterviewModal({ open: true, candidate });
  };

  const handleInterviewConfirm = (mode: "ASYNC" | "LIVE") => {
    const candidate = interviewModal.candidate;
    setInterviewModal({ open: false, candidate: null });
    // Navigate to interview creation with candidate + mode pre-filled
    router.push(
      `/recruiter/interviews/new?candidateId=${candidate.id}&mode=${mode}&name=${encodeURIComponent(candidate.candidateName || "")}`
    );
  };

  // ── Bulk email handlers ──
  const handleGenerateBulkMessage = async () => {
    if (!bulkJobTitle.trim()) { toast.error("Enter a job title first"); return; }
    setBulkGenerating(true);
    try {
      const res = await fetch("/api/recruiter/emails/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: bulkEmailType, candidateName: "the candidate", jobTitle: bulkJobTitle }),
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
    if (selectedIds.size === 0) { toast.error("Select at least one candidate"); return; }
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
        if (data.upgradeRequired) { toast.error("Bulk email requires Business plan or higher"); return; }
        throw new Error(data.error);
      }
      setBulkResults(data.results);
      toast.success(`${data.summary.successful} of ${data.summary.total} emails sent!`);
      setSelectedIds(new Set());
      setSelectMode(null);
    } catch (err: any) {
      toast.error(err.message || "Failed to send bulk emails");
    } finally {
      setBulkSending(false);
    }
  };

  // ── Bulk interview handler ──
  const handleBulkInterview = async () => {
    if (!bulkInterviewMode) { toast.error("Choose ASYNC or LIVE first"); return; }
    if (selectedIds.size === 0) { toast.error("Select at least one candidate"); return; }
    setBulkInterviewSending(true);
    try {
      // Navigate to bulk interview creation — Phase 5 route
      router.push(
        `/recruiter/interviews/bulk?ids=${Array.from(selectedIds).join(",")}&mode=${bulkInterviewMode}`
      );
    } catch {
      toast.error("Failed to start interviews");
    } finally {
      setBulkInterviewSending(false);
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

  const eligibleInTab = visibleCandidates.filter((c) => c.candidateEmail).length;

  return (
    <div className="max-w-6xl mx-auto space-y-6">

      {/* Interview mode modal */}
      {interviewModal.open && interviewModal.candidate && (
        <InterviewModeModal
          candidate={interviewModal.candidate}
          onClose={() => setInterviewModal({ open: false, candidate: null })}
          onConfirm={handleInterviewConfirm}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Candidates</h1>
          <p className="text-slate-400 mt-1">
            {candidates.length} total · {counts.SHORTLISTED} shortlisted · {counts.HIRED} hired
          </p>
        </div>
        <div className="flex items-center gap-3">

          {/* Bulk Interview toggle */}
          <button
            onClick={() => {
              if (selectMode === "interview") { exitSelectMode(); }
              else { setSelectMode("interview"); setShowBulkPanel(false); }
            }}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
              selectMode === "interview"
                ? "bg-indigo-600 text-white hover:bg-indigo-500"
                : "border border-white/10 bg-white/5 text-slate-400 hover:text-white hover:bg-white/10"
            }`}
          >
            <Zap className="w-4 h-4" />
            {selectMode === "interview" ? `${selectedIds.size} selected` : "Bulk Interview"}
          </button>

          {/* Bulk Email toggle */}
          <button
            onClick={() => {
              if (selectMode === "email") { exitSelectMode(); }
              else { setSelectMode("email"); setShowBulkPanel(false); }
            }}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
              selectMode === "email"
                ? "bg-blue-600 text-white hover:bg-blue-500"
                : "border border-white/10 bg-white/5 text-slate-400 hover:text-white hover:bg-white/10"
            }`}
          >
            <Mail className="w-4 h-4" />
            {selectMode === "email" ? `${selectedIds.size} selected` : "Bulk Email"}
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

      {/* ── Bulk Email Panel ── */}
      {selectMode === "email" && (
        <div className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-6 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <p className="text-sm font-semibold text-white">
                Bulk Email — {selectedIds.size} candidate{selectedIds.size !== 1 ? "s" : ""} selected
              </p>
              <p className="text-xs text-slate-400 mt-0.5">
                {eligibleInTab} candidates with email in current view
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {/* Select all in current tab */}
              <button
                onClick={selectAllInTab}
                className="px-3 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-medium hover:bg-blue-500/20 transition"
              >
                Select All in Tab ({eligibleInTab})
              </button>
              {/* Quick select by category */}
              <div className="flex gap-1">
                {(["NEW", "REVIEWED", "SHORTLISTED"] as const).map((s) => {
                  const n = candidates.filter((c) => c.status === s && c.candidateEmail).length;
                  if (!n) return null;
                  return (
                    <button
                      key={s}
                      onClick={() => selectAllByStatus(s)}
                      className="px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 text-slate-400 text-xs font-medium hover:bg-white/10 transition"
                    >
                      All {statusConfig[s].label} ({n})
                    </button>
                  );
                })}
              </div>
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
              <div>
                <p className="text-xs font-semibold text-white uppercase tracking-wider mb-3">Email Type</p>
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
                      <span>{t.icon}</span>{t.label}
                    </button>
                  ))}
                </div>
              </div>
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
                    {bulkGenerating ? <><Loader2 className="w-3 h-3 animate-spin" />Generating...</> : <><Wand2 className="w-3 h-3" />Write with AI</>}
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
              <div className="flex items-center justify-between gap-4">
                <p className="text-xs text-slate-500">
                  Will send to <span className="text-white font-semibold">{selectedIds.size}</span> candidate{selectedIds.size !== 1 ? "s" : ""}
                  {!bulkMessage && " · AI will personalize each email"}
                </p>
                <button
                  onClick={handleBulkSend}
                  disabled={bulkSending || selectedIds.size === 0}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-500 transition disabled:opacity-50"
                >
                  {bulkSending ? <><Loader2 className="w-4 h-4 animate-spin" />Sending...</> : <><Send className="w-4 h-4" />Send to {selectedIds.size} Candidates</>}
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
                    result.success ? "bg-emerald-500/5 border border-emerald-500/20" : "bg-red-500/5 border border-red-500/20"
                  }`}>
                    <span className={result.success ? "text-emerald-400" : "text-red-400"}>
                      {result.success ? "✅" : "❌"} {result.candidateName}
                    </span>
                    <span className="text-slate-500">{result.email}</span>
                    {result.error && <span className="text-red-400">{result.error}</span>}
                  </div>
                ))}
              </div>
              <button onClick={() => setBulkResults(null)} className="mt-3 text-xs text-slate-500 hover:text-white transition">
                Dismiss results
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Bulk Interview Panel ── */}
      {selectMode === "interview" && (
        <div className="rounded-2xl border border-indigo-500/20 bg-indigo-500/5 p-6 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <p className="text-sm font-semibold text-white">
                Bulk Interview — {selectedIds.size} candidate{selectedIds.size !== 1 ? "s" : ""} selected
              </p>
              <p className="text-xs text-slate-400 mt-0.5">
                AI will generate tailored questions for each candidate
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {/* Select all in current tab */}
              <button
                onClick={selectAllInTab}
                className="px-3 py-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-medium hover:bg-indigo-500/20 transition"
              >
                Select All in Tab ({eligibleInTab})
              </button>
              {/* Quick select by category */}
              <div className="flex gap-1">
                {(["NEW", "REVIEWED", "SHORTLISTED"] as const).map((s) => {
                  const n = candidates.filter((c) => c.status === s && c.candidateEmail).length;
                  if (!n) return null;
                  return (
                    <button
                      key={s}
                      onClick={() => selectAllByStatus(s)}
                      className="px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 text-slate-400 text-xs font-medium hover:bg-white/10 transition"
                    >
                      All {statusConfig[s].label} ({n})
                    </button>
                  );
                })}
              </div>
              <button
                onClick={deselectAll}
                className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-slate-400 text-xs font-medium hover:bg-white/10 transition"
              >
                Deselect All
              </button>
            </div>
          </div>

          {/* Mode picker */}
          <div className="pt-4 border-t border-white/5">
            <p className="text-xs font-semibold text-white uppercase tracking-wider mb-3">Interview Mode</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">

              {/* ASYNC */}
              <button
                onClick={() => setBulkInterviewMode("ASYNC")}
                className={`text-left rounded-xl border p-4 transition ${
                  bulkInterviewMode === "ASYNC"
                    ? "border-indigo-500 bg-indigo-500/10"
                    : "border-white/10 bg-white/[0.02] hover:border-white/20"
                }`}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <MessageSquare className={`w-4 h-4 ${bulkInterviewMode === "ASYNC" ? "text-indigo-400" : "text-slate-500"}`} />
                  <span className={`text-sm font-semibold ${bulkInterviewMode === "ASYNC" ? "text-white" : "text-slate-300"}`}>
                    Async
                  </span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-indigo-500/20 text-indigo-400 uppercase">
                    Recommended
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Each candidate gets a private link. They answer on their own time.
                </p>
              </button>

              {/* LIVE */}
              <button
                onClick={() => setBulkInterviewMode("LIVE")}
                className={`text-left rounded-xl border p-4 transition ${
                  bulkInterviewMode === "LIVE"
                    ? "border-violet-500 bg-violet-500/10"
                    : "border-white/10 bg-white/[0.02] hover:border-white/20"
                }`}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <Video className={`w-4 h-4 ${bulkInterviewMode === "LIVE" ? "text-violet-400" : "text-slate-500"}`} />
                  <span className={`text-sm font-semibold ${bulkInterviewMode === "LIVE" ? "text-white" : "text-slate-300"}`}>
                    Live
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Schedule and conduct each interview with you present in real time.
                </p>
              </button>
            </div>

            <div className="flex items-center justify-between gap-4">
              <p className="text-xs text-slate-500">
                {bulkInterviewMode === "ASYNC"
                  ? `AI will generate questions + send ${selectedIds.size} candidate${selectedIds.size !== 1 ? "s" : ""} a private interview link`
                  : bulkInterviewMode === "LIVE"
                  ? `${selectedIds.size} live interview${selectedIds.size !== 1 ? "s" : ""} will be queued for scheduling`
                  : "Choose a mode to continue"}
              </p>
              <button
                onClick={handleBulkInterview}
                disabled={bulkInterviewSending || selectedIds.size === 0 || !bulkInterviewMode}
                className={`inline-flex items-center gap-2 px-6 py-3 rounded-xl text-white text-sm font-semibold transition disabled:opacity-50 ${
                  bulkInterviewMode === "LIVE" ? "bg-violet-600 hover:bg-violet-500" : "bg-indigo-600 hover:bg-indigo-500"
                }`}
              >
                {bulkInterviewSending
                  ? <><Loader2 className="w-4 h-4 animate-spin" />Starting...</>
                  : <><Zap className="w-4 h-4" />Interview {selectedIds.size} Candidate{selectedIds.size !== 1 ? "s" : ""}</>
                }
              </button>
            </div>
          </div>
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
            const inSelectMode = selectMode !== null;

            return (
              <div
                key={candidate.id}
                className={`rounded-2xl border transition ${
                  isSelected
                    ? selectMode === "interview"
                      ? "border-indigo-500/40 bg-indigo-500/5"
                      : "border-blue-500/40 bg-blue-500/5"
                    : "border-white/5 bg-white/[0.02] hover:border-white/10"
                }`}
              >
                <div className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1 min-w-0">

                      {/* Checkbox (select mode) or Avatar */}
                      {inSelectMode ? (
                        <button
                          onClick={() => hasEmail && toggleSelect(candidate.id)}
                          disabled={!hasEmail}
                          className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition ${
                            !hasEmail
                              ? "bg-white/5 opacity-30 cursor-not-allowed"
                              : isSelected
                              ? selectMode === "interview"
                                ? "bg-indigo-500 border-2 border-indigo-400"
                                : "bg-blue-500 border-2 border-blue-400"
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
                    {!inSelectMode && (
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

                        {/* Interview button ← NEW */}
                        <button
                          onClick={() => handleInterviewClick(candidate)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-medium hover:bg-indigo-500/20 transition"
                        >
                          <Zap className="w-3 h-3" />
                          Interview
                        </button>

                        {candidate.candidateEmail && (
                          <Link
                            href={`/recruiter/candidates/${candidate.id}#email`}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-medium hover:bg-blue-500/20 transition"
                          >
                            <Mail className="w-3 h-3" />
                            Email
                          </Link>
                        )}

                        <button
                          onClick={async () => {
                            const res = await fetch(`/api/recruiter/candidates/${candidate.id}/cv`);
                            const data = await res.json();
                            if (data.signedUrl) {
                              window.open(data.signedUrl, "_blank");
                            } else if (data.rawText) {
                              const blob = new Blob([data.rawText], { type: "text/plain" });
                              const url = URL.createObjectURL(blob);
                              const a = document.createElement("a");
                              a.href = url; a.download = `${candidate.candidateName || "CV"}.txt`;
                              a.click(); URL.revokeObjectURL(url);
                            } else {
                              toast.error("No CV file available");
                            }
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-500/10 border border-slate-500/20 text-slate-400 text-xs font-medium hover:bg-slate-500/20 transition"
                        >
                          <FileText className="w-3 h-3" />
                          CV
                        </button>

                        <Link
                          href={`/recruiter/candidates/${candidate.id}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-medium hover:bg-purple-500/20 transition"
                        >
                          View
                          <ArrowRight className="w-3 h-3" />
                        </Link>
                      </div>
                    )}

                    {/* Select mode — no email indicator */}
                    {inSelectMode && !hasEmail && (
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