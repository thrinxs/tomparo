"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, MessageSquare, CheckCircle, XCircle, Clock,
  Loader2, AlertTriangle, ChevronRight, Copy, Send, Zap,
  Users, Briefcase, MapPin, Mic, MicOff, Video, Type,
  Radio, StopCircle, Play, Download, SkipForward,
} from "lucide-react";
import toast from "react-hot-toast";

const questionTypeConfig = {
  CV_VERIFICATION: { label: "CV Verification", color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20" },
  LOCATION_BASED: { label: "Location Based", color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
  JOB_SPECIFIC: { label: "Job Specific", color: "text-purple-400", bg: "bg-purple-500/10", border: "border-purple-500/20" },
  BEHAVIOURAL: { label: "Behavioural", color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20" },
};

const recommendationConfig: Record<string, { color: string; bg: string; border: string }> = {
  "Strong Hire": { color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/30" },
  "Hire": { color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/30" },
  "Maybe": { color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/30" },
  "No Hire": { color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/30" },
};

const scoreColor = (score: number) =>
  score >= 8 ? "text-emerald-400" : score >= 5 ? "text-amber-400" : "text-red-400";

const interviewTypeConfig = {
  TEXT: { label: "Text", icon: Type, color: "text-indigo-400", bg: "bg-indigo-500/10", border: "border-indigo-500/20" },
  VOICE: { label: "Voice", icon: Mic, color: "text-violet-400", bg: "bg-violet-500/10", border: "border-violet-500/20" },
  VIDEO: { label: "Video", icon: Video, color: "text-pink-400", bg: "bg-pink-500/10", border: "border-pink-500/20" },
};

export default function InterviewDetailPage() {
  const params = useParams();
  const router = useRouter();
  const interviewId = params.id as string;

  const [interview, setInterview] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);
  const [activeQuestion, setActiveQuestion] = useState<string | null>(null);
  const [liveAnswer, setLiveAnswer] = useState("");
  const [submittingAnswer, setSubmittingAnswer] = useState(false);
  const [copied, setCopied] = useState(false);

  // ── Go Live state ──
  const [goingLive, setGoingLive] = useState(false);
  const [liveMessage, setLiveMessage] = useState("");
  const [sendingLiveMessage, setSendingLiveMessage] = useState(false);

  // ── Recording state ──
  const [recordingUrl, setRecordingUrl] = useState<string | null>(null);
  const [loadingRecording, setLoadingRecording] = useState(false);

  // ── Voice dictation for LIVE mode ──
  const [isLiveRecording, setIsLiveRecording] = useState(false);
  const [isSpeechSupported, setIsSpeechSupported] = useState(false);
  const liveRecognitionRef = useRef<any>(null);

  useEffect(() => {
    setIsSpeechSupported(
      !!(window.SpeechRecognition || (window as any).webkitSpeechRecognition)
    );
  }, []);

  const fetchInterview = useCallback(async () => {
    try {
      const res = await fetch(`/api/recruiter/interviews/${interviewId}`);
      const data = await res.json();
      if (!res.ok) {
        toast.error("Interview not found");
        router.push("/recruiter/interviews");
        return;
      }
      setInterview(data.interview);
    } catch {
      toast.error("Failed to load interview");
    } finally {
      setLoading(false);
    }
  }, [interviewId, router]);

  useEffect(() => { fetchInterview(); }, [fetchInterview]);

  // ── Fetch recording URL if available ──
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

  const handleCopyLink = () => {
    const link = `${window.location.origin}/interview/${interview.shareToken}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Interview link copied!");
  };

  // ── Go Live ──
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
      toast.success(data.interview.isLive ? "You've gone live! Candidate has been notified." : "Returned to async mode.");
    } catch (err: any) {
      toast.error(err.message || "Failed to switch mode");
    } finally {
      setGoingLive(false);
    }
  };

  // ── Send live message (recruiter types → AI reads to candidate) ──
  const handleSendLiveMessage = async () => {
    if (!liveMessage.trim()) return;
    setSendingLiveMessage(true);
    try {
      const res = await fetch(`/api/recruiter/interviews/${interviewId}/go-live`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ liveMessage: liveMessage.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success("Message sent — AI will read it to the candidate.");
      setLiveMessage("");
    } catch (err: any) {
      toast.error(err.message || "Failed to send message");
    } finally {
      setSendingLiveMessage(false);
    }
  };

  // ── Voice dictation toggle ──
  const handleToggleLiveRecording = () => {
    if (isLiveRecording) {
      liveRecognitionRef.current?.stop();
      setIsLiveRecording(false);
      return;
    }
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = "en-US";
    recognition.onresult = (event: any) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          setLiveAnswer((prev) => prev + event.results[i][0].transcript + " ");
        }
      }
    };
    recognition.onend = () => setIsLiveRecording(false);
    recognition.onerror = () => setIsLiveRecording(false);
    liveRecognitionRef.current = recognition;
    recognition.start();
    setIsLiveRecording(true);
  };

  // ── Submit live answer ──
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
      setLiveAnswer("");
      setActiveQuestion(null);
      toast.success(`Scored ${data.score}/10`);
      fetchInterview();
    } catch (err: any) {
      toast.error(err.message || "Failed to submit answer");
    } finally {
      setSubmittingAnswer(false);
    }
  };

  // ── Complete interview ──
  const handleComplete = async () => {
    setCompleting(true);
    try {
      const res = await fetch(`/api/recruiter/interviews/${interviewId}/complete`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success("Interview completed! AI summary generated.");
      fetchInterview();
    } catch (err: any) {
      toast.error(err.message || "Failed to complete interview");
    } finally {
      setCompleting(false);
    }
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
    ? Math.round((interview.answeredQuestions / interview.totalQuestions) * 100)
    : 0;

  const rec = interview.finalRecommendation
    ? recommendationConfig[interview.finalRecommendation]
    : null;

  const isCompleted = interview.status === "COMPLETED";
  const canComplete = interview.answeredQuestions > 0 && !isCompleted && interview.status !== "CANCELLED";
  const shareLink = `${typeof window !== "undefined" ? window.location.origin : "https://www.tomparo.com"}/interview/${interview.shareToken}`;

  const typeConf = interviewTypeConfig[interview.interviewType as keyof typeof interviewTypeConfig] || interviewTypeConfig.TEXT;
  const TypeIcon = typeConf.icon;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">

      {/* Breadcrumb */}
      <div>
        <div className="flex items-center gap-2 text-sm text-slate-500 mb-3">
          <Link href="/recruiter/interviews" className="hover:text-white transition">Interviews</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-white">{interview.candidateName}</span>
        </div>
        <Link href="/recruiter/interviews" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition">
          <ArrowLeft className="w-4 h-4" /> Back to Interviews
        </Link>
      </div>

      {/* Header Card */}
      <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-8">
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-14 h-14 rounded-2xl bg-purple-500/20 flex items-center justify-center shrink-0">
                <MessageSquare className="w-7 h-7 text-purple-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">{interview.candidateName}</h1>
                <div className="flex flex-wrap gap-3 mt-1 text-sm text-slate-400">
                  {interview.jobTitle && (
                    <span className="flex items-center gap-1">
                      <Briefcase className="w-3.5 h-3.5" /> {interview.jobTitle}
                    </span>
                  )}
                  {interview.candidateLocation && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" /> {interview.candidateLocation}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Progress */}
            <div className="space-y-2 mb-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">
                  {interview.answeredQuestions} of {interview.totalQuestions} questions answered
                </span>
                <span className="text-white font-semibold">{progress}%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-white/5">
                <div
                  className="h-2 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {/* Badges */}
            <div className="flex flex-wrap gap-2">
              {/* Interview type */}
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${typeConf.bg} ${typeConf.border} ${typeConf.color}`}>
                <TypeIcon className="w-3 h-3" />
                {typeConf.label} Interview
              </span>

              {/* Mode */}
              <span className="px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-xs text-purple-400 font-medium">
                {interview.isLive ? "🔴 Live" : interview.mode === "ASYNC" ? "Async" : "Live"}
              </span>

              {/* Status */}
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                isCompleted ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"
                : interview.status === "IN_PROGRESS" ? "bg-blue-500/10 border border-blue-500/20 text-blue-400"
                : interview.status === "CANCELLED" ? "bg-slate-500/10 border border-slate-500/20 text-slate-400"
                : "bg-amber-500/10 border border-amber-500/20 text-amber-400"
              }`}>
                {interview.status === "IN_PROGRESS" ? "In Progress"
                  : interview.status.charAt(0) + interview.status.slice(1).toLowerCase()}
              </span>
            </div>
          </div>

          {/* Right column */}
          <div className="flex flex-col gap-3 lg:w-56">

            {/* Final recommendation */}
            {isCompleted && rec && (
              <div className={`rounded-2xl border ${rec.border} ${rec.bg} p-5 text-center`}>
                <p className="text-xs text-slate-400 mb-1 uppercase tracking-wider">Final Recommendation</p>
                <p className={`text-xl font-bold ${rec.color}`}>{interview.finalRecommendation}</p>
                {interview.finalScore != null && (
                  <p className="text-2xl font-bold text-white mt-2">
                    {interview.finalScore}<span className="text-sm text-slate-500">/100</span>
                  </p>
                )}
              </div>
            )}

            {/* Share link */}
            {!isCompleted && (
              <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 space-y-2">
                <p className="text-xs font-semibold text-white">Candidate Interview Link</p>
                <p className="text-xs text-slate-500 break-all truncate">{shareLink}</p>
                <button
                  onClick={handleCopyLink}
                  className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-purple-600 text-white text-xs font-semibold hover:bg-purple-500 transition"
                >
                  <Copy className="w-3.5 h-3.5" />
                  {copied ? "Copied!" : "Copy Link"}
                </button>
              </div>
            )}

            {/* Go Live button */}
            {!isCompleted && interview.mode === "ASYNC" && (
              <button
                onClick={handleGoLive}
                disabled={goingLive}
                className={`w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold transition disabled:opacity-50 ${
                  interview.isLive
                    ? "bg-red-600/20 border border-red-500/40 text-red-400 hover:bg-red-600/30"
                    : "bg-blue-600 hover:bg-blue-500 text-white"
                }`}
              >
                {goingLive ? (
                  <><Loader2 className="w-4 h-4 animate-spin" />Switching...</>
                ) : interview.isLive ? (
                  <><StopCircle className="w-4 h-4" />End Live Session</>
                ) : (
                  <><Radio className="w-4 h-4" />Go Live — Take Over</>
                )}
              </button>
            )}

            {/* Complete button */}
            {canComplete && (
              <button
                onClick={handleComplete}
                disabled={completing}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-500 transition disabled:opacity-50"
              >
                {completing ? (
                  <><Loader2 className="w-4 h-4 animate-spin" />Generating Summary...</>
                ) : (
                  <><Zap className="w-4 h-4" />Complete & Get AI Summary</>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── LIVE panel — recruiter sends messages to candidate ── */}
      {interview.isLive && !isCompleted && (
        <div className="rounded-3xl border border-blue-500/20 bg-blue-500/5 p-6 space-y-4">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-500" />
            </span>
            <h3 className="text-sm font-semibold text-white">You are live</h3>
            <span className="text-xs text-slate-400">— Candidate has been notified</span>
          </div>

          <div className="space-y-2">
            <p className="text-xs text-slate-400 font-medium">
              Send a message — AI will read it aloud to the candidate:
            </p>

            {/* Voice dictation for message */}
            {isSpeechSupported && (
              <button
                type="button"
                onClick={() => {
                  if (isLiveRecording) {
                    liveRecognitionRef.current?.stop();
                    setIsLiveRecording(false);
                  } else {
                    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
                    if (!SR) return;
                    const r = new SR();
                    r.continuous = true;
                    r.interimResults = false;
                    r.lang = "en-US";
                    r.onresult = (e: any) => {
                      for (let i = e.resultIndex; i < e.results.length; i++) {
                        if (e.results[i].isFinal) setLiveMessage((p) => p + e.results[i][0].transcript + " ");
                      }
                    };
                    r.onend = () => setIsLiveRecording(false);
                    r.onerror = () => setIsLiveRecording(false);
                    liveRecognitionRef.current = r;
                    r.start();
                    setIsLiveRecording(true);
                  }
                }}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                  isLiveRecording
                    ? "bg-red-500/20 border border-red-500/40 text-red-400"
                    : "bg-white/5 border border-white/10 text-slate-400 hover:text-white"
                }`}
              >
                {isLiveRecording ? (
                  <>
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
                    </span>
                    <MicOff className="w-3.5 h-3.5" /> Stop Dictating
                  </>
                ) : (
                  <><Mic className="w-3.5 h-3.5" /> Dictate Message</>
                )}
              </button>
            )}

            <textarea
              value={liveMessage}
              onChange={(e) => setLiveMessage(e.target.value)}
              placeholder='e.g. "Tell me more about your experience with React" or "We are moving to the next section."'
              rows={3}
              className="w-full rounded-xl border border-white/10 bg-slate-900/50 px-4 py-3 text-sm text-white placeholder-slate-500 outline-none focus:border-blue-500/50 resize-none transition"
            />
            <button
              onClick={handleSendLiveMessage}
              disabled={sendingLiveMessage || !liveMessage.trim()}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-500 transition disabled:opacity-50"
            >
              {sendingLiveMessage
                ? <><Loader2 className="w-4 h-4 animate-spin" />Sending...</>
                : <><Send className="w-4 h-4" />Send to Candidate</>
              }
            </button>
          </div>
        </div>
      )}

      {/* ── Recording Player ── */}
      {interview.recordingUrl && (
        <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Play className="w-4 h-4 text-purple-400" />
              Interview Recording
            </h3>
            {interview.recordingUploadedAt && (
              <span className="text-xs text-slate-500">
                Recorded {new Date(interview.recordingUploadedAt).toLocaleDateString("en-NG", {
                  day: "numeric", month: "short", year: "numeric",
                })}
              </span>
            )}
          </div>

          {loadingRecording ? (
            <div className="flex items-center gap-2 text-slate-500 text-sm">
              <Loader2 className="w-4 h-4 animate-spin" /> Loading recording...
            </div>
          ) : recordingUrl ? (
            <div className="space-y-3">
              <audio
                controls
                src={recordingUrl}
                className="w-full rounded-xl"
                style={{ colorScheme: "dark" }}
              />
              <a
                href={recordingUrl}
                download={`interview-${interview.candidateName}-${interviewId}.webm`}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 bg-white/5 text-slate-400 text-xs font-medium hover:text-white hover:bg-white/10 transition"
              >
                <Download className="w-3.5 h-3.5" /> Download Recording
              </a>
            </div>
          ) : (
            <p className="text-xs text-slate-500">Recording is being processed...</p>
          )}
        </div>
      )}

      {/* AI Summary */}
      {isCompleted && interview.summary && (
        <div className="rounded-3xl border border-purple-500/20 bg-purple-500/5 p-8 space-y-4">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Zap className="w-5 h-5 text-purple-400" /> AI Interview Summary
          </h3>
          <p className="text-slate-300 text-sm leading-relaxed">{interview.summary}</p>
        </div>
      )}

      {/* Questions */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-slate-400" />
          Questions & Answers
        </h3>

        {interview.questions.map((q: any, i: number) => {
          const typeConf = questionTypeConfig[q.questionType as keyof typeof questionTypeConfig];
          const isAnswered = !!q.candidateAnswer;
          const isSkipped = q.skipped;
          const isActive = activeQuestion === q.id;

          return (
            <div
              key={q.id}
              className={`rounded-2xl border p-6 transition ${
                isSkipped ? "border-slate-700/50 bg-slate-800/20"
                : isAnswered ? "border-emerald-500/20 bg-emerald-500/5"
                : isActive ? "border-purple-500/30 bg-purple-500/5"
                : "border-white/10 bg-white/[0.02]"
              }`}
            >
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
                    </div>
                    <p className="text-white text-sm font-medium leading-relaxed">{q.question}</p>
                  </div>
                </div>

                {/* Score — only shown to recruiter */}
                {isAnswered && !isSkipped && q.aiScore != null && (
                  <div className="text-right shrink-0">
                    <p className={`text-2xl font-bold ${scoreColor(q.aiScore)}`}>{q.aiScore}</p>
                    <p className="text-xs text-slate-500">/10</p>
                  </div>
                )}
              </div>

              {/* Answer section */}
              {isAnswered && !isSkipped ? (
                <div className="space-y-3 ml-10">
                  <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
                    <p className="text-xs text-slate-500 font-medium mb-2 uppercase tracking-wider">
                      Candidate Answer
                    </p>
                    <p className="text-slate-300 text-sm leading-relaxed">{q.candidateAnswer}</p>
                  </div>
                  {q.aiFeedback && (
                    <div className="rounded-xl border border-purple-500/20 bg-purple-500/5 p-4">
                      <p className="text-xs text-purple-400 font-medium mb-2 uppercase tracking-wider">
                        AI Feedback
                      </p>
                      <p className="text-slate-300 text-sm leading-relaxed">{q.aiFeedback}</p>
                    </div>
                  )}
                </div>
              ) : isSkipped ? (
                <div className="ml-10">
                  <p className="text-xs text-slate-600 flex items-center gap-2">
                    <SkipForward className="w-3.5 h-3.5" />
                    No response received — question was skipped automatically
                  </p>
                </div>
              ) : interview.mode === "LIVE" || interview.isLive ? (
                <div className="ml-10 space-y-3">
                  {isActive ? (
                    <>
                      {isSpeechSupported && (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={handleToggleLiveRecording}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                              isLiveRecording
                                ? "bg-red-500/20 border border-red-500/40 text-red-400"
                                : "bg-white/5 border border-white/10 text-slate-400 hover:text-white"
                            }`}
                          >
                            {isLiveRecording ? (
                              <>
                                <span className="relative flex h-2 w-2">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
                                </span>
                                <MicOff className="w-3.5 h-3.5" /> Stop Dictating
                              </>
                            ) : (
                              <><Mic className="w-3.5 h-3.5" /> Dictate Answer</>
                            )}
                          </button>
                          <span className="text-[10px] text-slate-600">
                            Speak the candidate's answer aloud
                          </span>
                        </div>
                      )}
                      <textarea
                        value={liveAnswer}
                        onChange={(e) => setLiveAnswer(e.target.value)}
                        placeholder={isLiveRecording ? "Listening..." : "Type or dictate the candidate's answer..."}
                        rows={4}
                        className={`w-full rounded-xl border bg-slate-900/50 px-4 py-3 text-sm text-white placeholder-slate-500 outline-none focus:border-purple-500/50 resize-none transition ${
                          isLiveRecording ? "border-red-500/30" : "border-white/10"
                        }`}
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleSubmitLiveAnswer(q.id)}
                          disabled={submittingAnswer || isLiveRecording}
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 text-white text-sm font-semibold hover:bg-purple-500 transition disabled:opacity-50"
                        >
                          {submittingAnswer
                            ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />Scoring...</>
                            : <><Send className="w-3.5 h-3.5" />Submit & Score</>
                          }
                        </button>
                        <button
                          onClick={() => {
                            liveRecognitionRef.current?.stop();
                            setIsLiveRecording(false);
                            setActiveQuestion(null);
                            setLiveAnswer("");
                          }}
                          className="px-4 py-2 rounded-xl border border-white/10 bg-white/5 text-slate-400 text-sm hover:text-white transition"
                        >
                          Cancel
                        </button>
                      </div>
                    </>
                  ) : (
                    <button
                      onClick={() => setActiveQuestion(q.id)}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-slate-400 text-sm hover:text-white hover:bg-white/10 transition"
                    >
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

      {/* Async link reminder */}
      {!isCompleted && !interview.isLive && (
        <div className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-6">
          <h4 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-400" />
            Send this link to {interview.candidateName}
          </h4>
          <p className="text-xs text-slate-400 mb-3">
            The candidate opens this link and completes the interview on their own time.
            AI scores every answer automatically.
          </p>
          <div className="flex items-center gap-3">
            <code className="flex-1 rounded-lg bg-slate-900/50 border border-white/10 px-3 py-2 text-xs text-slate-300 truncate">
              {shareLink}
            </code>
            <button
              onClick={handleCopyLink}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 text-white text-xs font-semibold hover:bg-purple-500 transition shrink-0"
            >
              <Copy className="w-3.5 h-3.5" />
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
