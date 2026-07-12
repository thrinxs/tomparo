"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, MessageSquare, CheckCircle, XCircle, Clock,
  Loader2, AlertTriangle, ChevronRight, Copy, Send, Zap,
  Users, Briefcase, MapPin, Mic, MicOff, Video, Type,
  Radio, StopCircle, Play, Download, SkipForward,
  Star, Flag, Trophy, ThumbsUp, ThumbsDown,
  FileText, RefreshCw, StickyNote, Trash2,
  TrendingUp, TrendingDown, Minus, CornerDownRight,
  Mail, GitBranch, Eye, EyeOff, Maximize2, User,
} from "lucide-react";
import toast from "react-hot-toast";
import InterviewMonitorModal from "@/components/recruiter/InterviewMonitorModal";

// ── Config ─────────────────────────────────────────────────────────────────────
const questionTypeConfig: Record<string, { label: string; color: string; bg: string; border: string }> = {
  CV_VERIFICATION: { label: "CV Verification", color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20" },
  LOCATION_BASED: { label: "Location Based", color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
  JOB_SPECIFIC: { label: "Job Specific", color: "text-purple-400", bg: "bg-purple-500/10", border: "border-purple-500/20" },
  BEHAVIOURAL: { label: "Behavioural", color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20" },
};

const recommendationConfig: Record<string, { color: string; bg: string; border: string; icon: any }> = {
  "Strong Hire": { color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/30", icon: Trophy },
  "Hire": { color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/30", icon: CheckCircle },
  "Maybe": { color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/30", icon: AlertTriangle },
  "No Hire": { color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/30", icon: XCircle },
};

const interviewTypeConfig: Record<string, { label: string; icon: any; color: string; bg: string; border: string }> = {
  TEXT: { label: "Text", icon: Type, color: "text-indigo-400", bg: "bg-indigo-500/10", border: "border-indigo-500/20" },
  VOICE: { label: "Voice", icon: Mic, color: "text-violet-400", bg: "bg-violet-500/10", border: "border-violet-500/20" },
  VIDEO: { label: "Video", icon: Video, color: "text-pink-400", bg: "bg-pink-500/10", border: "border-pink-500/20" },
};

const scoreColor = (s: number) => s >= 8 ? "text-emerald-400" : s >= 5 ? "text-amber-400" : "text-red-400";
const scoreDot = (s: number) => s >= 8 ? "bg-emerald-400" : s >= 5 ? "bg-amber-400" : "bg-red-400";

function getHealthIndicator(avgScore: number | null, completion: number) {
  if (avgScore === null) return { label: "Pending", color: "text-slate-400", bg: "bg-slate-500/10", icon: Clock };
  if (avgScore >= 7 && completion >= 80) return { label: "Strong Performance", color: "text-emerald-400", bg: "bg-emerald-500/10", icon: TrendingUp };
  if (avgScore >= 5 && completion >= 60) return { label: "Average Performance", color: "text-amber-400", bg: "bg-amber-500/10", icon: Minus };
  return { label: "Weak Performance", color: "text-red-400", bg: "bg-red-500/10", icon: TrendingDown };
}

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

export default function InterviewDetailPage() {
  const params = useParams();
  const router = useRouter();
  const interviewId = params.id as string;

  const [interview, setInterview] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [activeQuestion, setActiveQuestion] = useState<string | null>(null);
  const [liveAnswer, setLiveAnswer] = useState("");
  const [submittingAnswer, setSubmittingAnswer] = useState(false);
  const [copied, setCopied] = useState(false);
  const [goingLive, setGoingLive] = useState(false);
  const [liveMessage, setLiveMessage] = useState("");
  const [sendingLiveMessage, setSendingLiveMessage] = useState(false);
  const [recordingUrl, setRecordingUrl] = useState<string | null>(null);
  const [loadingRecording, setLoadingRecording] = useState(false);
  const [isLiveRecording, setIsLiveRecording] = useState(false);
  const [isSpeechSupported, setIsSpeechSupported] = useState(false);
  const [showMonitorModal, setShowMonitorModal] = useState(false);

  // Notes
  const [notes, setNotes] = useState<any[]>([]);
  const [newNote, setNewNote] = useState("");
  const [savingNote, setSavingNote] = useState(false);
  const [showNotes, setShowNotes] = useState(false);

  // Per-question actions
  const [ratingQuestion, setRatingQuestion] = useState<string | null>(null);
  const [flagging, setFlagging] = useState<string | null>(null);

  const liveRecognitionRef = useRef<any>(null);
  const autoRefreshRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setIsSpeechSupported(!!(
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    ));
  }, []);

  const fetchInterview = useCallback(async (silent = false) => {
    if (!silent) setRefreshing(true);
    try {
      const res = await fetch(`/api/recruiter/interviews/${interviewId}`);
      const data = await res.json();
      if (!res.ok) {
        if (!silent) { toast.error("Interview not found"); router.push("/recruiter/interviews"); }
        return;
      }
      setInterview(data.interview);
    } catch {
      if (!silent) toast.error("Failed to load interview");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [interviewId, router]);

  useEffect(() => { fetchInterview(); }, [fetchInterview]);

  // Auto-refresh every 30s when in progress
  useEffect(() => {
    if (interview?.status === "IN_PROGRESS") {
      autoRefreshRef.current = setInterval(() => fetchInterview(true), 30000);
    }
    return () => { if (autoRefreshRef.current) clearInterval(autoRefreshRef.current); };
  }, [interview?.status, fetchInterview]);

  // Fetch recording
  useEffect(() => {
    if (!interview?.recordingUrl || recordingUrl) return;
    const fetchRecording = async () => {
      setLoadingRecording(true);
      try {
        const res = await fetch(`/api/recruiter/interviews/${interviewId}/recording`);
        const data = await res.json();
        if (res.ok && data.url) setRecordingUrl(data.url);
      } catch {}
      finally { setLoadingRecording(false); }
    };
    fetchRecording();
  }, [interview?.recordingUrl, interviewId, recordingUrl]);

  // Fetch notes
  useEffect(() => {
    if (!interview) return;
    fetch(`/api/recruiter/interviews/${interviewId}/notes`)
      .then((r) => r.json())
      .then((d) => { if (d.notes) setNotes(d.notes); })
      .catch(() => {});
  }, [interview, interviewId]);

  const handleCopyLink = () => {
    const link = `${window.location.origin}/interview/${interview.shareToken}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Interview link copied!");
  };

  const handleGoLive = async () => {
    setGoingLive(true);
    try {
      const res = await fetch(`/api/recruiter/interviews/${interviewId}/go-live`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isLive: !interview.isLive }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setInterview((prev: any) => ({ ...prev, isLive: data.interview.isLive }));
      toast.success(data.interview.isLive ? "You've gone live!" : "Returned to async mode.");
    } catch (err: any) { toast.error(err.message || "Failed"); }
    finally { setGoingLive(false); }
  };

  const handleSendLiveMessage = async () => {
    if (!liveMessage.trim()) return;
    setSendingLiveMessage(true);
    try {
      const res = await fetch(`/api/recruiter/interviews/${interviewId}/go-live`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ liveMessage: liveMessage.trim() }),
      });
      if (!res.ok) throw new Error();
      toast.success("Message sent — AI reading to candidate.");
      setLiveMessage("");
    } catch { toast.error("Failed to send message"); }
    finally { setSendingLiveMessage(false); }
  };

  const handleToggleLiveRecording = () => {
    if (isLiveRecording) { liveRecognitionRef.current?.stop(); setIsLiveRecording(false); return; }
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;
    const r = new SR();
    r.continuous = true; r.interimResults = false; r.lang = "en-US";
    r.onresult = (e: any) => {
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) setLiveAnswer((p) => p + e.results[i][0].transcript + " ");
      }
    };
    r.onend = () => setIsLiveRecording(false);
    r.onerror = () => setIsLiveRecording(false);
    liveRecognitionRef.current = r;
    r.start();
    setIsLiveRecording(true);
  };

  const handleSubmitLiveAnswer = async (questionId: string) => {
    if (!liveAnswer.trim()) { toast.error("Please enter an answer"); return; }
    if (isLiveRecording) { liveRecognitionRef.current?.stop(); setIsLiveRecording(false); }
    setSubmittingAnswer(true);
    try {
      const res = await fetch(`/api/recruiter/interviews/${interviewId}/answer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionId, answer: liveAnswer, shareToken: interview.shareToken }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setLiveAnswer(""); setActiveQuestion(null);
      toast.success(`Scored ${data.score}/10`);
      fetchInterview();
    } catch (err: any) { toast.error(err.message || "Failed"); }
    finally { setSubmittingAnswer(false); }
  };

  const handleComplete = async () => {
    setCompleting(true);
    try {
      const res = await fetch(`/api/recruiter/interviews/${interviewId}/complete`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success("Interview completed! AI summary generated.");
      fetchInterview();
    } catch (err: any) { toast.error(err.message || "Failed"); }
    finally { setCompleting(false); }
  };

  // Notes
  const handleAddNote = async () => {
    if (!newNote.trim()) return;
    setSavingNote(true);
    try {
      const res = await fetch(`/api/recruiter/interviews/${interviewId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note: newNote }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setNotes((prev) => [data.note, ...prev]);
      setNewNote("");
      toast.success("Note saved");
    } catch { toast.error("Failed to save note"); }
    finally { setSavingNote(false); }
  };

  const handleDeleteNote = async (noteId: string) => {
    try {
      await fetch(`/api/recruiter/interviews/${interviewId}/notes`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ noteId }),
      });
      setNotes((prev) => prev.filter((n) => n.id !== noteId));
      toast.success("Note deleted");
    } catch { toast.error("Failed to delete note"); }
  };

  // Rate / Flag
  const handleRate = async (questionId: string, rating: number) => {
    setRatingQuestion(questionId);
    try {
      await fetch(`/api/recruiter/interviews/${interviewId}/rate`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionId, rating }),
      });
      setInterview((prev: any) => ({
        ...prev,
        questions: prev.questions.map((q: any) =>
          q.id === questionId ? { ...q, recruiterRating: rating } : q
        ),
      }));
    } catch { toast.error("Failed to rate"); }
    finally { setRatingQuestion(null); }
  };

  const handleFlag = async (questionId: string, flagged: boolean) => {
    setFlagging(questionId);
    try {
      await fetch(`/api/recruiter/interviews/${interviewId}/rate`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionId, flagged }),
      });
      setInterview((prev: any) => ({
        ...prev,
        questions: prev.questions.map((q: any) =>
          q.id === questionId ? { ...q, flagged } : q
        ),
      }));
      toast.success(flagged ? "Answer flagged for review" : "Flag removed");
    } catch { toast.error("Failed to flag"); }
    finally { setFlagging(null); }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-slate-500" />
      </div>
    );
  }

  if (!interview) return null;

  const progress = interview.totalQuestions > 0
    ? Math.round((interview.answeredQuestions / interview.totalQuestions) * 100) : 0;
  const rec = interview.finalRecommendation ? recommendationConfig[interview.finalRecommendation] : null;
  const RecIcon = rec?.icon;
  const isCompleted = interview.status === "COMPLETED";
  const canComplete = interview.answeredQuestions > 0 && !isCompleted && interview.status !== "CANCELLED";
  const shareLink = `${typeof window !== "undefined" ? window.location.origin : "https://www.tomparo.com"}/interview/${interview.shareToken}`;
  const typeConf = interviewTypeConfig[interview.interviewType as keyof typeof interviewTypeConfig] || interviewTypeConfig.TEXT;
  const TypeIcon = typeConf.icon;

  // Stats
  const mainQuestions = interview.questions.filter((q: any) => !q.isFollowUp);
  const skippedCount = interview.questions.filter((q: any) => q.skipped).length;
  const followUpCount = interview.questions.filter((q: any) => q.isFollowUp).length;
  const scoredQuestions = interview.questions.filter((q: any) => q.aiScore != null);
  const avgScore = scoredQuestions.length
    ? (scoredQuestions.reduce((a: number, q: any) => a + q.aiScore, 0) / scoredQuestions.length)
    : null;
  const avgScoreByType: Record<string, number[]> = {};
  interview.questions.forEach((q: any) => {
    if (q.aiScore != null) {
      if (!avgScoreByType[q.questionType]) avgScoreByType[q.questionType] = [];
      avgScoreByType[q.questionType].push(q.aiScore);
    }
  });
  const health = getHealthIndicator(avgScore, progress);
  const HealthIcon = health.icon;

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">

      {/* ── Monitor Modal ── */}
      {showMonitorModal && (
        <InterviewMonitorModal
          interviewId={interviewId}
          shareToken={interview.shareToken}
          candidateName={interview.candidateName}
          isLive={interview.isLive}
          stealthMode={interview.stealthMode || false}
          onClose={() => setShowMonitorModal(false)}
          onGoLive={() => setInterview((p: any) => ({ ...p, isLive: true }))}
          onEndLive={() => setInterview((p: any) => ({ ...p, isLive: false }))}
        />
      )}

      {/* ── Breadcrumb ── */}
      <div>
        <div className="flex items-center gap-2 text-sm text-slate-500 mb-3">
          <Link href="/recruiter/interviews" className="hover:text-white transition">Interviews</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-white">{interview.candidateName}</span>
        </div>
        <div className="flex items-center justify-between">
          <Link href="/recruiter/interviews" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition">
            <ArrowLeft className="w-4 h-4" /> Back to Interviews
          </Link>
          <div className="flex items-center gap-2">
            {/* Join Monitor */}
            <button onClick={() => setShowMonitorModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-500 transition">
              <Maximize2 className="w-4 h-4" />
              Monitor Interview
            </button>
            {/* Refresh */}
            <button onClick={() => fetchInterview()} disabled={refreshing}
              className="p-2.5 rounded-xl border border-white/10 bg-white/[0.02] text-slate-400 hover:text-white transition disabled:opacity-50">
              <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>
      </div>

      {/* ── Live Alert ── */}
      {interview.isLive && (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-4 flex items-center gap-3">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-400" />
          </span>
          <p className="text-sm font-semibold text-red-400">You are live — Candidate has been notified</p>
        </div>
      )}

      {/* ── Stats Bar ── */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { label: "Total Q", value: interview.totalQuestions, color: "text-white" },
          { label: "Answered", value: interview.answeredQuestions, color: "text-emerald-400" },
          { label: "Skipped", value: skippedCount, color: skippedCount > 0 ? "text-amber-400" : "text-slate-500" },
          { label: "Follow-ups", value: followUpCount, color: "text-indigo-400" },
          { label: "Progress", value: `${progress}%`, color: progress >= 70 ? "text-emerald-400" : progress >= 40 ? "text-amber-400" : "text-slate-400" },
        ].map((stat) => (
          <div key={stat.label} className="rounded-2xl border border-white/5 bg-white/[0.02] p-4 text-center">
            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            <p className="text-xs text-slate-500 mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* ── Main 2-column layout ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── LEFT — Questions (2/3) ── */}
        <div className="lg:col-span-2 space-y-4">

          {/* AI Summary */}
          {isCompleted && interview.summary && (
            <div className="rounded-3xl border border-purple-500/20 bg-purple-500/5 p-6 space-y-3">
              <h3 className="text-base font-semibold text-white flex items-center gap-2">
                <Zap className="w-4 h-4 text-purple-400" /> AI Interview Summary
              </h3>
              <p className="text-slate-300 text-sm leading-relaxed">{interview.summary}</p>
            </div>
          )}

          {/* Live panel */}
          {interview.isLive && !isCompleted && (
            <div className="rounded-3xl border border-blue-500/20 bg-blue-500/5 p-6 space-y-4">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-500" />
                </span>
                <h3 className="text-sm font-semibold text-white">You are live</h3>
              </div>
              <div className="space-y-2">
                <p className="text-xs text-slate-400">Send a message — AI reads aloud to candidate:</p>
                {isSpeechSupported && (
                  <button onClick={() => {
                    if (isLiveRecording) { liveRecognitionRef.current?.stop(); setIsLiveRecording(false); return; }
                    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
                    if (!SR) return;
                    const r = new SR();
                    r.continuous = true; r.interimResults = false; r.lang = "en-US";
                    r.onresult = (e: any) => {
                      for (let i = e.resultIndex; i < e.results.length; i++) {
                        if (e.results[i].isFinal) setLiveMessage((p) => p + e.results[i][0].transcript + " ");
                      }
                    };
                    r.onend = () => setIsLiveRecording(false);
                    r.onerror = () => setIsLiveRecording(false);
                    liveRecognitionRef.current = r; r.start(); setIsLiveRecording(true);
                  }}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition border ${isLiveRecording ? "bg-red-500/20 border-red-500/40 text-red-400" : "bg-white/5 border-white/10 text-slate-400 hover:text-white"}`}>
                    {isLiveRecording ? <><MicOff className="w-3.5 h-3.5" />Stop Dictating</> : <><Mic className="w-3.5 h-3.5" />Dictate</>}
                  </button>
                )}
                <textarea value={liveMessage} onChange={(e) => setLiveMessage(e.target.value)}
                  placeholder="Type a message for the candidate..." rows={2}
                  className="w-full rounded-xl border border-white/10 bg-slate-900/50 px-4 py-3 text-sm text-white placeholder-slate-500 outline-none focus:border-blue-500/50 resize-none transition"
                />
                <button onClick={handleSendLiveMessage} disabled={sendingLiveMessage || !liveMessage.trim()}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-500 transition disabled:opacity-50">
                  {sendingLiveMessage ? <><Loader2 className="w-4 h-4 animate-spin" />Sending...</> : <><Send className="w-4 h-4" />Send to Candidate</>}
                </button>
              </div>
            </div>
          )}

          {/* Recording */}
          {interview.recordingUrl && (
            <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Play className="w-4 h-4 text-purple-400" /> Interview Recording
                </h3>
                {interview.recordingUploadedAt && (
                  <span className="text-xs text-slate-500">{timeAgo(interview.recordingUploadedAt)}</span>
                )}
              </div>
              {loadingRecording ? (
                <div className="flex items-center gap-2 text-slate-500 text-sm"><Loader2 className="w-4 h-4 animate-spin" />Loading...</div>
              ) : recordingUrl ? (
                <div className="space-y-3">
                  <audio controls src={recordingUrl} className="w-full rounded-xl" style={{ colorScheme: "dark" }} />
                  <a href={recordingUrl} download={`interview-${interview.candidateName}.webm`}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 bg-white/5 text-slate-400 text-xs font-medium hover:text-white transition">
                    <Download className="w-3.5 h-3.5" /> Download Recording
                  </a>
                </div>
              ) : (
                <p className="text-xs text-slate-500">Processing...</p>
              )}
            </div>
          )}

          {/* Questions */}
          <div className="space-y-3">
            <h3 className="text-base font-semibold text-white flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-slate-400" />
              Questions & Answers
            </h3>

            {mainQuestions.map((q: any, i: number) => {
              const typeConf = questionTypeConfig[q.questionType as keyof typeof questionTypeConfig];
              const isAnswered = !!q.candidateAnswer;
              const isSkipped = q.skipped;
              const isActive = activeQuestion === q.id;
              // Find follow-ups for this question
              const followUps = interview.questions.filter((fq: any) => fq.isFollowUp && fq.parentQuestionId === q.id);

              return (
                <div key={q.id} className={`rounded-2xl border p-6 transition ${
                  isSkipped ? "border-slate-700/50 bg-slate-800/20"
                  : isAnswered ? "border-emerald-500/20 bg-emerald-500/5"
                  : isActive ? "border-purple-500/30 bg-purple-500/5"
                  : "border-white/10 bg-white/[0.02]"
                } ${q.flagged ? "ring-2 ring-red-500/30" : ""}`}>

                  {/* Question header */}
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center shrink-0 mt-0.5">
                        <span className="text-xs font-bold text-slate-400">Q{i + 1}</span>
                      </div>
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          {typeConf && (
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${typeConf.bg} ${typeConf.border} ${typeConf.color}`}>
                              {typeConf.label}
                            </span>
                          )}
                          {isAnswered && !isSkipped && <CheckCircle className="w-4 h-4 text-emerald-400" />}
                          {isSkipped && (
                            <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                              <SkipForward className="w-3.5 h-3.5" /> Skipped
                            </span>
                          )}
                          {q.flagged && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-red-500/10 border border-red-500/20 text-red-400">
                              <Flag className="w-3 h-3" /> Flagged
                            </span>
                          )}
                          {followUps.length > 0 && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                              <CornerDownRight className="w-3 h-3" /> +{followUps.length} follow-up
                            </span>
                          )}
                        </div>
                        <p className="text-white text-sm font-medium leading-relaxed">{q.question}</p>
                      </div>
                    </div>

                    {/* Score + actions */}
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      {isAnswered && !isSkipped && q.aiScore != null && (
                        <div className="text-right">
                          <div className="flex items-center gap-1.5">
                            <div className={`w-2 h-2 rounded-full ${scoreDot(q.aiScore)}`} />
                            <p className={`text-xl font-bold ${scoreColor(q.aiScore)}`}>{q.aiScore}</p>
                            <p className="text-xs text-slate-500">/10</p>
                          </div>
                        </div>
                      )}
                      {/* Recruiter rating */}
                      {isAnswered && !isSkipped && (
                        <div className="flex items-center gap-1">
                          <button onClick={() => handleRate(q.id, q.recruiterRating === 1 ? null : 1)}
                            disabled={ratingQuestion === q.id}
                            className={`p-1 rounded-lg transition ${q.recruiterRating === 1 ? "text-emerald-400 bg-emerald-500/10" : "text-slate-500 hover:text-emerald-400"}`}>
                            <ThumbsUp className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => handleRate(q.id, q.recruiterRating === -1 ? null : -1)}
                            disabled={ratingQuestion === q.id}
                            className={`p-1 rounded-lg transition ${q.recruiterRating === -1 ? "text-red-400 bg-red-500/10" : "text-slate-500 hover:text-red-400"}`}>
                            <ThumbsDown className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => handleFlag(q.id, !q.flagged)}
                            disabled={flagging === q.id}
                            className={`p-1 rounded-lg transition ${q.flagged ? "text-red-400 bg-red-500/10" : "text-slate-500 hover:text-red-400"}`}>
                            <Flag className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Answer */}
                  {isAnswered && !isSkipped ? (
                    <div className="space-y-3 ml-10">
                      <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
                        <p className="text-xs text-slate-500 font-medium mb-2 uppercase tracking-wider">Candidate Answer</p>
                        <p className="text-slate-300 text-sm leading-relaxed">{q.candidateAnswer}</p>
                      </div>
                      {q.aiFeedback && (
                        <div className="rounded-xl border border-purple-500/20 bg-purple-500/5 p-4">
                          <p className="text-xs text-purple-400 font-medium mb-2 uppercase tracking-wider">AI Feedback</p>
                          <p className="text-slate-300 text-sm leading-relaxed">{q.aiFeedback}</p>
                        </div>
                      )}

                      {/* ── Follow-up questions nested ── */}
                      {followUps.map((fq: any) => (
                        <div key={fq.id} className="ml-4 rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-4 relative">
                          <div className="absolute -left-4 top-5 w-4 h-0.5 bg-indigo-500/30" />
                          <div className="flex items-center gap-2 mb-2">
                            <CornerDownRight className="w-3.5 h-3.5 text-indigo-400" />
                            <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">Follow-up</span>
                            {fq.aiScore != null && (
                              <span className={`ml-auto text-sm font-bold ${scoreColor(fq.aiScore)}`}>{fq.aiScore}/10</span>
                            )}
                          </div>
                          <p className="text-sm text-white font-medium mb-3">{fq.question}</p>
                          {fq.candidateAnswer ? (
                            <>
                              <p className="text-xs text-slate-500 mb-1">Answer</p>
                              <p className="text-slate-300 text-sm leading-relaxed">{fq.candidateAnswer}</p>
                              {fq.aiFeedback && (
                                <div className="mt-2 pt-2 border-t border-indigo-500/20">
                                  <p className="text-xs text-indigo-400 mb-1">AI Feedback</p>
                                  <p className="text-slate-300 text-xs leading-relaxed">{fq.aiFeedback}</p>
                                </div>
                              )}
                            </>
                          ) : (
                            <p className="text-xs text-slate-500">Waiting for answer...</p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : isSkipped ? (
                    <div className="ml-10">
                      <p className="text-xs text-slate-600 flex items-center gap-2">
                        <SkipForward className="w-3.5 h-3.5" />
                        No response — skipped automatically
                      </p>
                    </div>
                  ) : interview.mode === "LIVE" || interview.isLive ? (
                    <div className="ml-10 space-y-3">
                      {isActive ? (
                        <>
                          {isSpeechSupported && (
                            <button onClick={handleToggleLiveRecording}
                              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition border ${isLiveRecording ? "bg-red-500/20 border-red-500/40 text-red-400" : "bg-white/5 border-white/10 text-slate-400 hover:text-white"}`}>
                              {isLiveRecording ? <><MicOff className="w-3.5 h-3.5" />Stop Dictating</> : <><Mic className="w-3.5 h-3.5" />Dictate Answer</>}
                            </button>
                          )}
                          <textarea value={liveAnswer} onChange={(e) => setLiveAnswer(e.target.value)}
                            placeholder="Type or dictate the candidate's answer..." rows={4}
                            className="w-full rounded-xl border border-white/10 bg-slate-900/50 px-4 py-3 text-sm text-white placeholder-slate-500 outline-none focus:border-purple-500/50 resize-none transition"
                          />
                          <div className="flex gap-2">
                            <button onClick={() => handleSubmitLiveAnswer(q.id)} disabled={submittingAnswer}
                              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 text-white text-sm font-semibold hover:bg-purple-500 transition disabled:opacity-50">
                              {submittingAnswer ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />Scoring...</> : <><Send className="w-3.5 h-3.5" />Submit & Score</>}
                            </button>
                            <button onClick={() => { liveRecognitionRef.current?.stop(); setIsLiveRecording(false); setActiveQuestion(null); setLiveAnswer(""); }}
                              className="px-4 py-2 rounded-xl border border-white/10 bg-white/5 text-slate-400 text-sm hover:text-white transition">
                              Cancel
                            </button>
                          </div>
                        </>
                      ) : (
                        <button onClick={() => setActiveQuestion(q.id)}
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-slate-400 text-sm hover:text-white hover:bg-white/10 transition">
                          Enter Answer
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="ml-10">
                      <p className="text-xs text-slate-500 flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5" />
                        Waiting for candidate to answer
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ── RIGHT sidebar (1/3) ── */}
        <div className="space-y-4">

          {/* Candidate Info */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 space-y-4">
            <h4 className="text-sm font-semibold text-white flex items-center gap-2">
              <User className="w-4 h-4 text-slate-400" /> Candidate
            </h4>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center text-lg font-bold text-purple-300">
                {interview.candidateName.split(" ").map((n: string) => n[0]).slice(0, 2).join("")}
              </div>
              <div>
                <p className="text-white font-semibold text-sm">{interview.candidateName}</p>
                {interview.candidateEmail && <p className="text-xs text-slate-400">{interview.candidateEmail}</p>}
              </div>
            </div>
            <div className="space-y-2 text-xs text-slate-400">
              {interview.jobTitle && (
                <div className="flex items-center gap-2">
                  <Briefcase className="w-3.5 h-3.5 shrink-0" />
                  <span>{interview.jobTitle}</span>
                </div>
              )}
              {interview.candidateLocation && (
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 shrink-0" />
                  <span>{interview.candidateLocation}</span>
                </div>
              )}
            </div>

            {/* Badges */}
            <div className="flex flex-wrap gap-2 pt-1">
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${typeConf.bg} ${typeConf.border} ${typeConf.color}`}>
                <TypeIcon className="w-3 h-3" /> {typeConf.label}
              </span>
              <span className="px-2.5 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-xs text-purple-400 font-medium">
                {interview.isLive ? "🔴 Live" : interview.mode}
              </span>
              <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${
                isCompleted ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                : interview.status === "IN_PROGRESS" ? "bg-blue-500/10 border-blue-500/20 text-blue-400"
                : interview.status === "CANCELLED" ? "bg-slate-500/10 border-slate-500/20 text-slate-400"
                : "bg-amber-500/10 border-amber-500/20 text-amber-400"
              }`}>
                {interview.status === "IN_PROGRESS" ? "In Progress" : interview.status.charAt(0) + interview.status.slice(1).toLowerCase()}
              </span>
            </div>

            {/* Quick actions */}
            <div className="flex gap-2 pt-1">
              <Link href={`/recruiter/candidates/${interview.candidateId || ""}`}
                className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-slate-400 text-xs hover:text-white transition">
                <User className="w-3.5 h-3.5" /> Profile
              </Link>
              <Link href={`/recruiter/candidates?email=${interview.candidateEmail}`}
                className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-slate-400 text-xs hover:text-white transition">
                <Mail className="w-3.5 h-3.5" /> Email
              </Link>
            </div>
          </div>

          {/* AI Recommendation + Pipeline */}
          {isCompleted && rec && RecIcon && (
            <div className={`rounded-2xl border ${rec.border} ${rec.bg} p-5 space-y-4`}>
              <div className="text-center">
                <p className="text-xs text-slate-400 mb-1 uppercase tracking-wider">AI Recommendation</p>
                <div className={`inline-flex items-center gap-2 text-lg font-bold ${rec.color}`}>
                  <RecIcon className="w-5 h-5" />
                  {interview.finalRecommendation}
                </div>
                {interview.finalScore != null && (
                  <p className="text-3xl font-bold text-white mt-2">
                    {interview.finalScore}<span className="text-sm text-slate-500">/100</span>
                  </p>
                )}
              </div>
              {/* Pipeline actions */}
              <div className="space-y-2 pt-2 border-t border-white/10">
                <p className="text-xs text-slate-500 font-medium uppercase tracking-wider flex items-center gap-1.5">
                  <GitBranch className="w-3 h-3" /> Move to Pipeline
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: "Shortlist", color: "bg-emerald-600 hover:bg-emerald-500" },
                    { label: "Reject", color: "bg-red-600/80 hover:bg-red-600" },
                    { label: "Send Offer", color: "bg-blue-600 hover:bg-blue-500" },
                    { label: "Follow Up", color: "bg-amber-600 hover:bg-amber-500" },
                  ].map((action) => (
                    <button key={action.label}
                      className={`px-3 py-2 rounded-xl ${action.color} text-white text-xs font-semibold transition`}>
                      {action.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Health Indicator */}
          <div className={`rounded-2xl border border-white/10 p-4 ${health.bg}`}>
            <div className="flex items-center gap-2">
              <HealthIcon className={`w-4 h-4 ${health.color}`} />
              <p className={`text-sm font-semibold ${health.color}`}>{health.label}</p>
            </div>
            {avgScore != null && (
              <p className="text-xs text-slate-500 mt-1">Avg score: {avgScore.toFixed(1)}/10 · {progress}% complete</p>
            )}
          </div>

          {/* Score Breakdown */}
          {Object.keys(avgScoreByType).length > 0 && (
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 space-y-3">
              <h4 className="text-xs font-semibold text-white uppercase tracking-wider">Score Breakdown</h4>
              {Object.entries(avgScoreByType).map(([type, scores]) => {
                const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
                const typeConf = questionTypeConfig[type as keyof typeof questionTypeConfig];
                return (
                  <div key={type}>
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-xs font-medium ${typeConf?.color || "text-slate-400"}`}>
                        {typeConf?.label || type}
                      </span>
                      <span className={`text-xs font-bold ${scoreColor(avg)}`}>{avg.toFixed(1)}/10</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/5">
                      <div className={`h-1.5 rounded-full transition-all ${avg >= 8 ? "bg-emerald-500" : avg >= 5 ? "bg-amber-500" : "bg-red-500"}`}
                        style={{ width: `${(avg / 10) * 100}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Interview Timeline */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 space-y-3">
            <h4 className="text-xs font-semibold text-white uppercase tracking-wider">Timeline</h4>
            <div className="space-y-3">
              {[
                { label: "Created", date: interview.createdAt, done: true },
                { label: "Started", date: interview.startedAt, done: !!interview.startedAt },
                { label: "Completed", date: interview.completedAt, done: !!interview.completedAt },
              ].map((event, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${event.done ? "bg-emerald-500/20" : "bg-white/5"}`}>
                    {event.done ? <CheckCircle className="w-3 h-3 text-emerald-400" /> : <Clock className="w-3 h-3 text-slate-600" />}
                  </div>
                  <div>
                    <p className={`text-xs font-medium ${event.done ? "text-white" : "text-slate-600"}`}>{event.label}</p>
                    {event.date && (
                      <p className="text-[10px] text-slate-500">
                        {new Date(event.date).toLocaleDateString("en-NG", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Share Link */}
          {!isCompleted && (
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 space-y-3">
              <h4 className="text-xs font-semibold text-white uppercase tracking-wider">Share Link</h4>
              <p className="text-xs text-slate-500 break-all">{shareLink}</p>
              <button onClick={handleCopyLink}
                className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-purple-600 text-white text-xs font-semibold hover:bg-purple-500 transition">
                <Copy className="w-3.5 h-3.5" />
                {copied ? "Copied!" : "Copy Link"}
              </button>
            </div>
          )}

          {/* Go Live / End Live */}
          {!isCompleted && interview.mode === "ASYNC" && (
            <button onClick={handleGoLive} disabled={goingLive}
              className={`w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold transition disabled:opacity-50 ${
                interview.isLive
                  ? "bg-red-600/20 border border-red-500/40 text-red-400 hover:bg-red-600/30"
                  : "bg-blue-600 hover:bg-blue-500 text-white"
              }`}>
              {goingLive ? <><Loader2 className="w-4 h-4 animate-spin" />Switching...</>
                : interview.isLive ? <><StopCircle className="w-4 h-4" />End Live Session</>
                : <><Radio className="w-4 h-4" />Go Live — Take Over</>}
            </button>
          )}

          {/* Complete */}
          {canComplete && (
            <button onClick={handleComplete} disabled={completing}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-500 transition disabled:opacity-50">
              {completing ? <><Loader2 className="w-4 h-4 animate-spin" />Generating Summary...</> : <><Zap className="w-4 h-4" />Complete & Get AI Summary</>}
            </button>
          )}

          {/* Notes */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 space-y-3">
            <button onClick={() => setShowNotes(!showNotes)}
              className="w-full flex items-center justify-between text-xs font-semibold text-white uppercase tracking-wider">
              <span className="flex items-center gap-2">
                <StickyNote className="w-3.5 h-3.5 text-slate-400" />
                My Notes {notes.length > 0 && <span className="text-slate-500">({notes.length})</span>}
              </span>
              <ChevronRight className={`w-3.5 h-3.5 text-slate-500 transition ${showNotes ? "rotate-90" : ""}`} />
            </button>
            {showNotes && (
              <div className="space-y-3">
                <div className="flex gap-2">
                  <textarea value={newNote} onChange={(e) => setNewNote(e.target.value)}
                    placeholder="Add a private note..." rows={2}
                    className="flex-1 rounded-xl border border-white/10 bg-slate-900/50 px-3 py-2 text-xs text-white placeholder-slate-500 outline-none focus:border-purple-500/50 resize-none transition"
                  />
                  <button onClick={handleAddNote} disabled={savingNote || !newNote.trim()}
                    className="px-3 py-2 rounded-xl bg-purple-600 text-white hover:bg-purple-500 transition disabled:opacity-50 shrink-0">
                    {savingNote ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  </button>
                </div>
                {notes.map((note) => (
                  <div key={note.id} className="rounded-xl border border-white/5 bg-white/[0.02] p-3 group">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-xs text-slate-300 leading-relaxed flex-1">{note.note}</p>
                      <button onClick={() => handleDeleteNote(note.id)}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded-lg text-slate-500 hover:text-red-400 transition shrink-0">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                    <p className="text-[10px] text-slate-600 mt-1.5">{timeAgo(note.createdAt)}</p>
                  </div>
                ))}
                {notes.length === 0 && (
                  <p className="text-xs text-slate-600 text-center py-2">No notes yet</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Async link reminder */}
      {!isCompleted && !interview.isLive && (
        <div className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-6">
          <h4 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-400" />
            Send this link to {interview.candidateName}
          </h4>
          <p className="text-xs text-slate-400 mb-3">
            The candidate opens this link and completes the interview on their own time. AI scores every answer automatically.
          </p>
          <div className="flex items-center gap-3">
            <code className="flex-1 rounded-lg bg-slate-900/50 border border-white/10 px-3 py-2 text-xs text-slate-300 truncate">{shareLink}</code>
            <button onClick={handleCopyLink}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 text-white text-xs font-semibold hover:bg-purple-500 transition shrink-0">
              <Copy className="w-3.5 h-3.5" />
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
