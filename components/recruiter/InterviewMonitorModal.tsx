"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  X, Minus, Maximize2, Minimize2, Radio, Eye, EyeOff,
  Send, SkipForward, RotateCcw, MessageSquare, Mic,
  MicOff, Clock, CheckCircle, Volume2, User,
  ChevronRight, Loader2, Zap,
} from "lucide-react";
import toast from "react-hot-toast";

interface InterviewMonitorModalProps {
  interviewId: string;
  shareToken: string;
  candidateName: string;
  isLive: boolean;
  stealthMode: boolean;
  onClose: () => void;
  onGoLive: () => void;
  onEndLive: () => void;
}

type ModalSize = "corner" | "maximized" | "minimized";

const questionTypeColors: Record<string, string> = {
  CV_VERIFICATION: "text-blue-400",
  LOCATION_BASED: "text-emerald-400",
  JOB_SPECIFIC: "text-purple-400",
  BEHAVIOURAL: "text-amber-400",
};

export default function InterviewMonitorModal({
  interviewId, shareToken, candidateName,
  isLive: initialIsLive, stealthMode: initialStealthMode,
  onClose, onGoLive, onEndLive,
}: InterviewMonitorModalProps) {
  const [size, setSize] = useState<ModalSize>("corner");
  const [isLive, setIsLive] = useState(initialIsLive);
  const [stealthMode, setStealthMode] = useState(initialStealthMode);
  const [liveTranscript, setLiveTranscript] = useState("");
  const [questions, setQuestions] = useState<any[]>([]);
  const [answeredQuestions, setAnsweredQuestions] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [status, setStatus] = useState("PENDING");
  const [message, setMessage] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const [isDictating, setIsDictating] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isTogglingLive, setIsTogglingLive] = useState(false);
  const [isTogglingStealthMode, setIsTogglingStealthMode] = useState(false);
  const [pos, setPos] = useState({ x: 20, y: 20 });
  const [dragging, setDragging] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  const modalRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<NodeJS.Timeout | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const recognitionRef = useRef<any>(null);
  const transcriptRef = useRef<HTMLDivElement>(null);

  // ── Timer ──
  useEffect(() => {
    timerRef.current = setInterval(() => setElapsedSeconds((s) => s + 1), 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  // ── Poll live data every 1s ──
  const pollLiveData = useCallback(async () => {
    try {
      const res = await fetch(`/api/recruiter/interviews/${interviewId}/live-transcript`);
      if (!res.ok) return;
      const data = await res.json();
      setLiveTranscript(data.liveTranscript || "");
      setIsLive(data.isLive);
      setStealthMode(data.stealthMode);
      setStatus(data.status);
      setAnsweredQuestions(data.answeredQuestions || 0);
      setTotalQuestions(data.totalQuestions || 0);
      if (data.questions) setQuestions(data.questions);
      // Auto-scroll transcript
      if (transcriptRef.current) {
        transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight;
      }
    } catch {}
  }, [interviewId]);

  useEffect(() => {
    pollLiveData();
    pollRef.current = setInterval(pollLiveData, 1000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [pollLiveData]);

  // ── Current question (first unanswered) ──
  const mainQuestions = questions.filter((q) => !q.isFollowUp);
  const currentQuestion = mainQuestions.find((q) => !q.candidateAnswer && !q.skipped);
  const currentQIndex = currentQuestion ? mainQuestions.indexOf(currentQuestion) : -1;

  // ── Dragging (corner mode only) ──
  const handleMouseDown = (e: React.MouseEvent) => {
    if (size !== "corner") return;
    setDragging(true);
    dragOffset.current = {
      x: e.clientX - pos.x,
      y: e.clientY - pos.y,
    };
  };

  useEffect(() => {
    if (!dragging) return;
    const handleMouseMove = (e: MouseEvent) => {
      setPos({ x: e.clientX - dragOffset.current.x, y: e.clientY - dragOffset.current.y });
    };
    const handleMouseUp = () => setDragging(false);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [dragging]);

  // ── Send message to candidate ──
  const handleSendMessage = async () => {
    if (!message.trim()) return;
    setSendingMessage(true);
    try {
      const res = await fetch(`/api/recruiter/interviews/${interviewId}/go-live`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ liveMessage: message.trim() }),
      });
      if (!res.ok) throw new Error("Failed");
      toast.success("Message sent — AI reading to candidate");
      setMessage("");
    } catch { toast.error("Failed to send message"); }
    finally { setSendingMessage(false); }
  };

  // ── Toggle live ──
  const handleToggleLive = async () => {
    setIsTogglingLive(true);
    try {
      const res = await fetch(`/api/recruiter/interviews/${interviewId}/go-live`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isLive: !isLive }),
      });
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setIsLive(data.interview.isLive);
      toast.success(data.interview.isLive ? "You're live! Candidate notified." : "Returned to async mode.");
      if (data.interview.isLive) onGoLive();
      else onEndLive();
    } catch { toast.error("Failed to toggle live mode"); }
    finally { setIsTogglingLive(false); }
  };

  // ── Toggle stealth mode ──
  const handleToggleStealth = async () => {
    setIsTogglingStealthMode(true);
    try {
      const res = await fetch(`/api/recruiter/interviews/${interviewId}/live-transcript`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stealthMode: !stealthMode }),
      });
      if (!res.ok) throw new Error("Failed");
      setStealthMode(!stealthMode);
      toast.success(!stealthMode ? "Stealth mode on — candidate won't be notified" : "Stealth mode off");
    } catch { toast.error("Failed to toggle stealth mode"); }
    finally { setIsTogglingStealthMode(false); }
  };

  // ── Voice dictation ──
  const handleToggleDictation = () => {
    if (isDictating) {
      recognitionRef.current?.stop();
      setIsDictating(false);
      return;
    }
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { toast.error("Speech recognition not supported"); return; }
    const r = new SR();
    r.continuous = true;
    r.interimResults = false;
    r.lang = "en-US";
    r.onresult = (e: any) => {
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) setMessage((p) => p + e.results[i][0].transcript + " ");
      }
    };
    r.onend = () => setIsDictating(false);
    r.onerror = () => setIsDictating(false);
    recognitionRef.current = r;
    r.start();
    setIsDictating(true);
  };

  // ── Skip question ──
  const handleSkipQuestion = async () => {
    if (!currentQuestion) return;
    try {
      await fetch(`/api/recruiter/interviews/${interviewId}/answer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionId: currentQuestion.id,
          answer: "[No response — question skipped by recruiter]",
          shareToken,
          skipped: true,
        }),
      });
      toast.success("Question skipped");
    } catch { toast.error("Failed to skip"); }
  };

  // ── Announce presence (exit stealth) ──
  const handleAnnouncePresence = async () => {
    try {
      // Turn off stealth, go live, send announcement
      await fetch(`/api/recruiter/interviews/${interviewId}/live-transcript`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stealthMode: false }),
      });
      setStealthMode(false);
      if (!isLive) {
        await fetch(`/api/recruiter/interviews/${interviewId}/go-live`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            isLive: true,
            liveMessage: `Hi ${candidateName.split(" ")[0]}! Your interviewer has joined and would like to speak with you.`,
          }),
        });
        setIsLive(true);
        onGoLive();
      }
      toast.success("Presence announced to candidate");
    } catch { toast.error("Failed to announce"); }
  };

  const progress = totalQuestions > 0 ? Math.round((answeredQuestions / totalQuestions) * 100) : 0;

  // ── Minimized bar ──
  if (size === "minimized") {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <div className="flex items-center gap-3 px-4 py-3 rounded-2xl border border-white/10 bg-slate-900/95 backdrop-blur-xl shadow-2xl">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-400" />
          </span>
          <p className="text-sm text-white font-semibold">{candidateName.split(" ")[0]} — {formatTime(elapsedSeconds)}</p>
          <p className="text-xs text-slate-400">{progress}% complete</p>
          <button onClick={() => setSize("corner")} className="p-1 rounded-lg text-slate-400 hover:text-white transition">
            <Maximize2 className="w-4 h-4" />
          </button>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-red-400 transition">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  const isFullScreen = size === "maximized";

  return (
    <div
      ref={modalRef}
      className={`z-50 flex flex-col border border-white/10 bg-slate-900/98 backdrop-blur-xl shadow-2xl rounded-2xl overflow-hidden transition-all ${
        isFullScreen
          ? "fixed inset-4"
          : "fixed w-[420px]"
      }`}
      style={isFullScreen ? {} : { left: pos.x, top: pos.y, bottom: "auto", right: "auto" }}
    >
      {/* ── Title Bar ── */}
      <div
        className={`flex items-center justify-between px-4 py-3 border-b border-white/10 bg-slate-900 ${size === "corner" ? "cursor-grab active:cursor-grabbing" : ""}`}
        onMouseDown={handleMouseDown}
      >
        <div className="flex items-center gap-2.5">
          <span className="relative flex h-2.5 w-2.5">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isLive ? "bg-red-400" : "bg-slate-400"}`} />
            <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isLive ? "bg-red-400" : "bg-slate-500"}`} />
          </span>
          <p className="text-sm font-semibold text-white">{candidateName}</p>
          {stealthMode && (
            <span className="px-2 py-0.5 rounded-full bg-slate-700 text-[10px] text-slate-400 font-medium">
              👁 Stealth
            </span>
          )}
          <span className="text-xs text-slate-500 font-mono">{formatTime(elapsedSeconds)}</span>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => setSize("minimized")} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition">
            <Minus className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => setSize(isFullScreen ? "corner" : "maximized")} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition">
            {isFullScreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ── Progress Bar ── */}
      <div className="h-1 bg-white/5">
        <div className="h-1 bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500" style={{ width: `${progress}%` }} />
      </div>

      {/* ── Body ── */}
      <div className={`flex-1 overflow-y-auto p-4 space-y-4 ${isFullScreen ? "grid grid-cols-2 gap-4 space-y-0" : ""}`}>

        {/* Left column (or full in corner) */}
        <div className="space-y-4">

          {/* Current question */}
          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-[10px] text-slate-500 uppercase tracking-wider font-medium">
                {currentQuestion ? `Question ${currentQIndex + 1} of ${mainQuestions.length}` : "All questions answered"}
              </p>
              <span className="text-xs text-slate-400 font-mono">{progress}%</span>
            </div>
            {currentQuestion ? (
              <>
                <p className={`text-xs font-semibold ${questionTypeColors[currentQuestion.questionType] || "text-slate-400"}`}>
                  {currentQuestion.questionType?.replace("_", " ")}
                </p>
                <p className="text-sm text-white font-medium leading-relaxed">{currentQuestion.question}</p>
              </>
            ) : (
              <div className="flex items-center gap-2 text-emerald-400">
                <CheckCircle className="w-4 h-4" />
                <p className="text-sm font-medium">Interview complete</p>
              </div>
            )}
          </div>

          {/* Live transcript */}
          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
            <div className="flex items-center gap-2 mb-2">
              <Volume2 className="w-3.5 h-3.5 text-indigo-400" />
              <p className="text-[10px] text-slate-500 uppercase tracking-wider font-medium">Live Transcript</p>
              <span className="ml-auto">
                {liveTranscript ? (
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-400" />
                  </span>
                ) : (
                  <span className="text-[10px] text-slate-600">Waiting...</span>
                )}
              </span>
            </div>
            <div ref={transcriptRef} className="min-h-[60px] max-h-[100px] overflow-y-auto">
              {liveTranscript ? (
                <p className="text-sm text-slate-300 leading-relaxed">{liveTranscript}</p>
              ) : (
                <p className="text-xs text-slate-600 italic">Candidate not speaking yet...</p>
              )}
            </div>
          </div>

          {/* Mode controls */}
          <div className="space-y-2">
            {/* Stealth / Live toggle */}
            {!isLive && (
              <div className="flex gap-2">
                <button onClick={handleToggleLive} disabled={isTogglingLive}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-500 transition disabled:opacity-50">
                  {isTogglingLive ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Radio className="w-3.5 h-3.5" />}
                  Go Live
                </button>
                <button onClick={handleToggleStealth} disabled={isTogglingStealthMode}
                  className={`flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-semibold transition disabled:opacity-50 border ${
                    stealthMode
                      ? "bg-slate-700 border-slate-600 text-white"
                      : "border-white/10 bg-white/5 text-slate-400 hover:text-white"
                  }`}>
                  {stealthMode ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  {stealthMode ? "Stealth On" : "Go Stealth"}
                </button>
              </div>
            )}

            {/* Stealth announce button */}
            {stealthMode && !isLive && (
              <button onClick={handleAnnouncePresence}
                className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-400 text-xs font-semibold hover:bg-amber-500/30 transition">
                <User className="w-3.5 h-3.5" />
                Announce My Presence
              </button>
            )}

            {/* End live */}
            {isLive && (
              <button onClick={handleToggleLive} disabled={isTogglingLive}
                className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-red-500/20 border border-red-500/30 text-red-400 text-xs font-semibold hover:bg-red-500/30 transition disabled:opacity-50">
                {isTogglingLive ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <X className="w-3.5 h-3.5" />}
                End Live Session
              </button>
            )}
          </div>

          {/* Question controls */}
          {currentQuestion && (
            <div className="flex gap-2">
              <button onClick={handleSkipQuestion}
                className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-slate-400 text-xs font-medium hover:text-white transition">
                <SkipForward className="w-3.5 h-3.5" /> Skip Q
              </button>
              <button onClick={() => setMessage(currentQuestion.question)}
                className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-slate-400 text-xs font-medium hover:text-white transition">
                <RotateCcw className="w-3.5 h-3.5" /> Repeat Q
              </button>
            </div>
          )}

          {/* Send message */}
          {(isLive || stealthMode) && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-[10px] text-slate-500 uppercase tracking-wider font-medium">
                  {isLive ? "Send message → AI reads aloud" : "Prepare message for when you go live"}
                </p>
                <button onClick={handleToggleDictation}
                  className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium transition border ${
                    isDictating
                      ? "bg-red-500/20 border-red-500/30 text-red-400"
                      : "border-white/10 bg-white/5 text-slate-500 hover:text-white"
                  }`}>
                  {isDictating ? <MicOff className="w-3 h-3" /> : <Mic className="w-3 h-3" />}
                  {isDictating ? "Stop" : "Dictate"}
                </button>
              </div>
              <div className="flex gap-2">
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder='e.g. "Tell me more about that project..."'
                  rows={2}
                  className="flex-1 rounded-xl border border-white/10 bg-slate-900/50 px-3 py-2 text-xs text-white placeholder-slate-500 outline-none focus:border-blue-500/50 resize-none transition"
                />
                <button onClick={handleSendMessage} disabled={sendingMessage || !message.trim() || !isLive}
                  className="px-3 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-500 transition disabled:opacity-50 shrink-0">
                  {sendingMessage ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </button>
              </div>
              {!isLive && message && (
                <p className="text-[10px] text-slate-600">Go live first to send this message</p>
              )}
            </div>
          )}
        </div>

        {/* Right column (full screen only) */}
        {isFullScreen && (
          <div className="space-y-4">
            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
              <p className="text-[10px] text-slate-500 uppercase tracking-wider font-medium mb-3">Questions Progress</p>
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {mainQuestions.map((q, i) => (
                  <div key={q.id} className={`flex items-start gap-2 p-2 rounded-lg text-xs ${
                    q.candidateAnswer ? "bg-emerald-500/5" : q.skipped ? "bg-slate-700/20" : i === currentQIndex ? "bg-purple-500/10 border border-purple-500/20" : "opacity-50"
                  }`}>
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold mt-0.5 ${
                      q.candidateAnswer ? "bg-emerald-500/20 text-emerald-400" :
                      q.skipped ? "bg-slate-500/20 text-slate-500" :
                      i === currentQIndex ? "bg-purple-500/20 text-purple-400" :
                      "bg-white/5 text-slate-500"
                    }`}>
                      {q.candidateAnswer ? "✓" : q.skipped ? "—" : i + 1}
                    </div>
                    <p className="text-slate-300 leading-relaxed line-clamp-2">{q.question}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick message templates */}
            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
              <p className="text-[10px] text-slate-500 uppercase tracking-wider font-medium mb-3">Quick Messages</p>
              <div className="space-y-1.5">
                {[
                  "Tell me more about that.",
                  "Can you give a specific example?",
                  "How did that make you feel?",
                  "What was the outcome?",
                  "Thank you! Moving to the next question.",
                ].map((template) => (
                  <button key={template} onClick={() => setMessage(template)}
                    className="w-full text-left px-3 py-2 rounded-lg text-xs text-slate-400 hover:text-white hover:bg-white/5 border border-white/5 transition">
                    "{template}"
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
