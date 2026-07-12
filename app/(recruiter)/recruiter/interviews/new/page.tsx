"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, ChevronRight, MessageSquare, Video, Zap,
  Loader2, Briefcase, User, CheckCircle, AlertTriangle,
  Mic, Type, Plus, Trash2, ChevronDown, ChevronUp, Play,
} from "lucide-react";
import toast from "react-hot-toast";
import { ELEVENLABS_VOICES, DEFAULT_MALE_VOICE_ID, DEFAULT_FEMALE_VOICE_ID } from "@/lib/ai/interview-engine";

const ELEVENLABS_PLANS = [
  "RECRUITER_BUSINESS", "RECRUITER_ENTERPRISE", "RECRUITER_SCALE",
  "RECRUITER_CUSTOM", "ADMIN",
];

const interviewTypes = [
  {
    value: "TEXT", label: "Text", icon: Type, color: "indigo",
    description: "Candidate types answers. Works on any device, any browser.",
    perks: ["✍️ Any device", "🌐 Any browser", "📝 Full control"],
  },
  {
    value: "VOICE", label: "Voice", icon: Mic, color: "violet",
    description: "AI reads questions aloud. Candidate speaks answers. Like a real phone interview.",
    perks: ["🎙️ AI voice reads questions", "👂 Candidate speaks answers", "🔇 Silence detection"],
  },
  {
    value: "VIDEO", label: "Video", icon: Video, color: "pink",
    description: "Candidate records a short video answer per question.",
    perks: ["📹 Camera + mic", "👁️ Body language visible", "🎬 Recorded per question"],
  },
];

const colorMap: Record<string, { border: string; bg: string; icon: string; check: string }> = {
  indigo: { border: "border-indigo-500", bg: "bg-indigo-500/10", icon: "bg-indigo-500/20", check: "text-indigo-400" },
  violet: { border: "border-violet-500", bg: "bg-violet-500/10", icon: "bg-violet-500/20", check: "text-violet-400" },
  pink: { border: "border-pink-500", bg: "bg-pink-500/10", icon: "bg-pink-500/20", check: "text-pink-400" },
};

const triggerOptions = [
  { value: "before_question", label: "Before a specific question number" },
  { value: "question_type", label: "Before every question of a type" },
  { value: "timed", label: "After a set number of minutes" },
];

const questionTypeOptions = [
  { value: "CV_VERIFICATION", label: "CV Verification" },
  { value: "LOCATION_BASED", label: "Location Based" },
  { value: "JOB_SPECIFIC", label: "Job Specific" },
  { value: "BEHAVIOURAL", label: "Behavioural" },
];

interface Instruction {
  id: string;
  trigger: "before_question" | "question_type" | "timed";
  questionIndex?: number;
  questionType?: string;
  afterMinutes?: number;
  message: string;
}

function NewInterviewInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const candidateId = searchParams.get("candidateId") || "";
  const initialMode = (searchParams.get("mode") as "ASYNC" | "LIVE") || "ASYNC";

  const [mode, setMode] = useState<"ASYNC" | "LIVE">(initialMode);
  const [interviewType, setInterviewType] = useState<"TEXT" | "VOICE" | "VIDEO">("TEXT");
  const [candidate, setCandidate] = useState<any>(null);
  const [jobs, setJobs] = useState<any[]>([]);
  const [selectedJobId, setSelectedJobId] = useState("");
  const [loadingCandidate, setLoadingCandidate] = useState(true);
  const [creating, setCreating] = useState(false);

  // Plan
  const [recruiterPlan, setRecruiterPlan] = useState<string>("");
  const isElevenLabsPlan = ELEVENLABS_PLANS.includes(recruiterPlan);

  // Follow-up toggle
  const [allowFollowUps, setAllowFollowUps] = useState(true);

  // Voice picker (Business+ only)
  const [selectedVoiceId, setSelectedVoiceId] = useState<string>(DEFAULT_MALE_VOICE_ID);
  const [previewingVoiceId, setPreviewingVoiceId] = useState<string | null>(null);

  // Messages
  const [openingMessage, setOpeningMessage] = useState("");
  const [closingMessage, setClosingMessage] = useState("");
  const [instructions, setInstructions] = useState<Instruction[]>([]);
  const [showMessages, setShowMessages] = useState(false);
  const [globalSettings, setGlobalSettings] = useState<any>(null);

  // Fetch candidate
  useEffect(() => {
    if (!candidateId) return;
    const fetch_ = async () => {
      try {
        const res = await fetch(`/api/recruiter/candidates/${candidateId}`);
        const data = await res.json();
        if (data.candidate) setCandidate(data.candidate);
      } catch { toast.error("Failed to load candidate"); }
      finally { setLoadingCandidate(false); }
    };
    fetch_();
  }, [candidateId]);

  // Fetch jobs + plan + settings
  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [jobsRes, profileRes, settingsRes] = await Promise.all([
          fetch("/api/recruiter/jobs"),
          fetch("/api/user/profile"),
          fetch("/api/recruiter/interview-settings"),
        ]);
        const [jobsData, profileData, settingsData] = await Promise.all([
          jobsRes.json(), profileRes.json(), settingsRes.json(),
        ]);
        if (jobsData.jobs) {
          setJobs(jobsData.jobs.filter((j: any) => j.status === "ACTIVE"));
          if (candidate?.job?.id) setSelectedJobId(candidate.job.id);
        }
        if (profileData.user?.role) setRecruiterPlan(profileData.user.role);
        if (settingsData.settings) {
          setGlobalSettings(settingsData.settings);
          if (settingsData.settings.defaultVoiceId) setSelectedVoiceId(settingsData.settings.defaultVoiceId);
        }
      } catch {}
    };
    fetchAll();
  }, [candidate]);

  // Preview voice
  const handlePreviewVoice = async (voiceId: string) => {
    if (previewingVoiceId === voiceId) { setPreviewingVoiceId(null); return; }
    setPreviewingVoiceId(voiceId);
    try {
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: "Hello! I'm your AI interviewer for today.", voiceId }),
      });
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const audio = new Audio(URL.createObjectURL(blob));
      audio.onended = () => setPreviewingVoiceId(null);
      audio.play();
    } catch { setPreviewingVoiceId(null); }
  };

  const addInstruction = () => {
    setInstructions((prev) => [...prev, {
      id: Math.random().toString(36).slice(2),
      trigger: "before_question", questionIndex: 2, message: "",
    }]);
  };

  const updateInstruction = (id: string, updates: Partial<Instruction>) => {
    setInstructions((prev) => prev.map((ins) => ins.id === id ? { ...ins, ...updates } : ins));
  };

  const removeInstruction = (id: string) => {
    setInstructions((prev) => prev.filter((ins) => ins.id !== id));
  };

  const handleCreate = async () => {
    if (!candidateId) { toast.error("No candidate selected"); return; }
    setCreating(true);
    try {
      const res = await fetch("/api/recruiter/interviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          candidateId,
          mode,
          interviewType,
          jobId: selectedJobId || undefined,
          allowFollowUps,
          voiceId: isElevenLabsPlan && interviewType === "VOICE" ? selectedVoiceId : undefined,
          openingMessage: openingMessage.trim() || undefined,
          closingMessage: closingMessage.trim() || undefined,
          customInstructions: instructions.length > 0 ? instructions : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success("Interview created! AI generated the questions.");
      router.push(`/recruiter/interviews/${data.interview.id}`);
    } catch (err: any) {
      toast.error(err.message || "Failed to create interview");
    } finally {
      setCreating(false);
    }
  };

  const analysis = candidate?.aiAnalysis
    ? (() => { try { return JSON.parse(candidate.aiAnalysis); } catch { return null; } })()
    : null;

  const selectedTypeConfig = interviewTypes.find((t) => t.value === interviewType)!;
  const selectedColor = colorMap[selectedTypeConfig.color];

  const defaultOpening = `Hi ${candidate?.candidateName?.split(" ")[0] || "[Name]"}! Welcome to your interview${selectedJobId && jobs.find(j => j.id === selectedJobId) ? ` for the ${jobs.find(j => j.id === selectedJobId)?.title} position` : ""}. I'm your AI interviewer today. Let's begin.`;
  const defaultClosing = `That's all for today, ${candidate?.candidateName?.split(" ")[0] || "[Name]"}. Thank you for your time. The team will review your responses and be in touch soon. Good luck!`;

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-12">

      {/* Breadcrumb */}
      <div>
        <div className="flex items-center gap-2 text-sm text-slate-500 mb-3">
          <Link href="/recruiter/interviews" className="hover:text-white transition">Interviews</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-white">New Interview</span>
        </div>
        <Link href="/recruiter/interviews" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition">
          <ArrowLeft className="w-4 h-4" /> Back to Interviews
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-white">Start AI Interview</h1>
        <p className="text-slate-400 mt-1 text-sm">AI generates tailored questions and scores every answer.</p>
      </div>

      {/* Candidate card */}
      <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-6">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">Candidate</p>
        {loadingCandidate ? (
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white/5 animate-pulse" />
            <div className="space-y-2">
              <div className="h-4 w-40 rounded bg-white/5 animate-pulse" />
              <div className="h-3 w-28 rounded bg-white/5 animate-pulse" />
            </div>
          </div>
        ) : candidate ? (
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center shrink-0">
              <span className="text-purple-400 font-bold text-sm">
                {(candidate.candidateName || "?").split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-base font-semibold text-white">{candidate.candidateName || "Unknown"}</h2>
              <div className="flex flex-wrap gap-3 mt-1 text-xs text-slate-400">
                {candidate.candidateEmail && <span>{candidate.candidateEmail}</span>}
                {analysis?.totalExperienceYears != null && <span>{analysis.totalExperienceYears} yrs exp</span>}
                {analysis?.experienceLevel && <span className="px-2 py-0.5 rounded-full bg-white/5">{analysis.experienceLevel}</span>}
              </div>
              {candidate.atsScore != null && (
                <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 border border-white/10">
                  <span className="text-xs text-slate-400">ATS:</span>
                  <span className={`text-xs font-bold ${candidate.atsScore >= 80 ? "text-emerald-400" : candidate.atsScore >= 60 ? "text-amber-400" : "text-red-400"}`}>
                    {candidate.atsScore}/100
                  </span>
                  {analysis?.hiringRecommendation && (
                    <>
                      <span className="text-slate-700">·</span>
                      <span className={`text-xs font-semibold ${analysis.hiringRecommendation === "Strong Hire" ? "text-emerald-400" : analysis.hiringRecommendation === "Hire" ? "text-blue-400" : analysis.hiringRecommendation === "Maybe" ? "text-amber-400" : "text-red-400"}`}>
                        {analysis.hiringRecommendation}
                      </span>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 text-amber-400">
            <AlertTriangle className="w-5 h-5" />
            <p className="text-sm">Candidate not found. Please go back and try again.</p>
          </div>
        )}
      </div>

      {/* Interview Type */}
      <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-6 space-y-4">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Interview Type — How will the candidate answer?</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {interviewTypes.map((type) => {
            const isSelected = interviewType === type.value;
            const colors = colorMap[type.color];
            const Icon = type.icon;
            return (
              <button key={type.value} onClick={() => setInterviewType(type.value as any)}
                className={`text-left rounded-2xl border p-4 transition ${isSelected ? `${colors.border} ${colors.bg}` : "border-white/10 bg-white/[0.02] hover:border-white/20"}`}>
                <div className="flex items-center justify-between mb-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${isSelected ? colors.icon : "bg-white/5"}`}>
                    <Icon className={`w-4 h-4 ${isSelected ? colors.check : "text-slate-500"}`} />
                  </div>
                  {isSelected && <CheckCircle className={`w-4 h-4 ${colors.check}`} />}
                </div>
                <p className={`text-sm font-semibold mb-1.5 ${isSelected ? "text-white" : "text-slate-300"}`}>{type.label}</p>
                <p className="text-[11px] text-slate-400 leading-relaxed mb-2">{type.description}</p>
                <div className="flex flex-col gap-0.5">
                  {type.perks.map((p) => <span key={p} className="text-[10px] text-slate-500">{p}</span>)}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Interview Mode */}
      <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-6 space-y-4">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Interview Mode — Who's present?</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button onClick={() => setMode("ASYNC")} className={`text-left rounded-2xl border p-5 transition ${mode === "ASYNC" ? "border-indigo-500 bg-indigo-500/10" : "border-white/10 bg-white/[0.02] hover:border-white/20"}`}>
            <div className="flex items-center justify-between mb-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${mode === "ASYNC" ? "bg-indigo-500/20" : "bg-white/5"}`}>
                <MessageSquare className={`w-5 h-5 ${mode === "ASYNC" ? "text-indigo-400" : "text-slate-500"}`} />
              </div>
              {mode === "ASYNC" && <CheckCircle className="w-4 h-4 text-indigo-400" />}
            </div>
            <div className="flex items-center gap-2 mb-1">
              <p className={`text-sm font-semibold ${mode === "ASYNC" ? "text-white" : "text-slate-300"}`}>Async</p>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-indigo-500/20 text-indigo-400 uppercase">Recommended</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">Candidate answers on their own time via a private link. You can go live anytime.</p>
          </button>
          <button onClick={() => setMode("LIVE")} className={`text-left rounded-2xl border p-5 transition ${mode === "LIVE" ? "border-violet-500 bg-violet-500/10" : "border-white/10 bg-white/[0.02] hover:border-white/20"}`}>
            <div className="flex items-center justify-between mb-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${mode === "LIVE" ? "bg-violet-500/20" : "bg-white/5"}`}>
                <Video className={`w-5 h-5 ${mode === "LIVE" ? "text-violet-400" : "text-slate-500"}`} />
              </div>
              {mode === "LIVE" && <CheckCircle className="w-4 h-4 text-violet-400" />}
            </div>
            <p className={`text-sm font-semibold mb-1 ${mode === "LIVE" ? "text-white" : "text-slate-300"}`}>Live</p>
            <p className="text-xs text-slate-400 leading-relaxed">You conduct the interview in real time. AI scores answers as you go.</p>
          </button>
        </div>
      </div>

      {/* Job context */}
      <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-6 space-y-4">
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
            Job Context <span className="ml-2 text-slate-600 normal-case font-normal">(optional but recommended)</span>
          </p>
          <p className="text-xs text-slate-500">Adds role-specific questions from the job description.</p>
        </div>
        <div className="space-y-2">
          <button onClick={() => setSelectedJobId("")} className={`w-full text-left rounded-xl border px-4 py-3 transition flex items-center justify-between ${selectedJobId === "" ? "border-purple-500/40 bg-purple-500/5" : "border-white/10 bg-white/[0.02] hover:border-white/20"}`}>
            <div className="flex items-center gap-3">
              <User className={`w-4 h-4 ${selectedJobId === "" ? "text-purple-400" : "text-slate-500"}`} />
              <span className={`text-sm ${selectedJobId === "" ? "text-white" : "text-slate-400"}`}>General — no specific job</span>
            </div>
            {selectedJobId === "" && <CheckCircle className="w-4 h-4 text-purple-400" />}
          </button>
          {jobs.map((job) => (
            <button key={job.id} onClick={() => setSelectedJobId(job.id)} className={`w-full text-left rounded-xl border px-4 py-3 transition flex items-center justify-between ${selectedJobId === job.id ? "border-purple-500/40 bg-purple-500/5" : "border-white/10 bg-white/[0.02] hover:border-white/20"}`}>
              <div className="flex items-center gap-3 min-w-0">
                <Briefcase className={`w-4 h-4 shrink-0 ${selectedJobId === job.id ? "text-purple-400" : "text-slate-500"}`} />
                <div className="min-w-0">
                  <p className={`text-sm truncate ${selectedJobId === job.id ? "text-white" : "text-slate-300"}`}>{job.title}</p>
                  {job.location && <p className="text-xs text-slate-500 truncate">{job.location}</p>}
                </div>
              </div>
              {selectedJobId === job.id && <CheckCircle className="w-4 h-4 text-purple-400 shrink-0" />}
            </button>
          ))}
        </div>
      </div>

      {/* ── Follow-Up Questions Toggle ── */}
      <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-white">AI Follow-Up Questions</p>
            <p className="text-xs text-slate-500 mt-1">
              AI will ask up to 3 natural follow-up questions during the interview
              when a candidate's answer reveals something worth exploring deeper.
            </p>
          </div>
          <button
            onClick={() => setAllowFollowUps(!allowFollowUps)}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${allowFollowUps ? "bg-purple-600" : "bg-white/10"}`}
          >
            <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${allowFollowUps ? "translate-x-5" : "translate-x-0"}`} />
          </button>
        </div>
        {allowFollowUps && (
          <div className="mt-4 rounded-xl border border-purple-500/20 bg-purple-500/5 p-3">
            <p className="text-xs text-purple-300 leading-relaxed">
              ✨ Follow-ups are asked naturally — candidates won't know it's AI deciding.
              Max 3 per interview · Never on skipped questions · Included in AI summary
            </p>
          </div>
        )}
      </div>

      {/* ── Voice Picker (Business+ + VOICE type only) ── */}
      {interviewType === "VOICE" && isElevenLabsPlan && (
        <div className="rounded-3xl border border-violet-500/20 bg-violet-500/5 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-white flex items-center gap-2">
                <Mic className="w-4 h-4 text-violet-400" />
                AI Interview Voice
              </p>
              <p className="text-xs text-slate-400 mt-1">✨ Human-like ElevenLabs voice — candidate can change on their setup screen</p>
            </div>
          </div>
          <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
            {ELEVENLABS_VOICES.map((v) => (
              <div
                key={v.id}
                onClick={() => setSelectedVoiceId(v.id)}
                className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs transition border cursor-pointer ${selectedVoiceId === v.id ? "bg-violet-600 border-violet-600 text-white" : "border-white/10 bg-white/[0.02] text-slate-400 hover:border-white/20 hover:text-white"}`}
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium">{v.name}</p>
                  <p className={`text-[10px] truncate ${selectedVoiceId === v.id ? "text-violet-200" : "text-slate-600"}`}>{v.desc}</p>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); handlePreviewVoice(v.id); }}
                  className={`ml-3 p-1.5 rounded-lg shrink-0 transition ${selectedVoiceId === v.id ? "hover:bg-white/20 text-white" : "hover:bg-white/10 text-slate-500 hover:text-white"}`}
                >
                  {previewingVoiceId === v.id
                    ? <Loader2 className="w-3 h-3 animate-spin" />
                    : <Play className="w-3 h-3" />
                  }
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Custom Messages (collapsible) ── */}
      <div className="rounded-3xl border border-white/10 bg-white/[0.02] overflow-hidden">
        <button onClick={() => setShowMessages(!showMessages)} className="w-full flex items-center justify-between p-6 hover:bg-white/[0.02] transition">
          <div>
            <p className="text-sm font-semibold text-white text-left">
              Custom Interview Messages
              <span className="ml-2 text-xs text-slate-500 font-normal">(optional)</span>
            </p>
            <p className="text-xs text-slate-500 mt-0.5 text-left">
              {globalSettings?.globalOpening
                ? "Global template active — override here for this interview"
                : "Add a personal opening, closing, or mid-interview instructions"}
            </p>
          </div>
          {showMessages ? <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" /> : <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />}
        </button>

        {showMessages && (
          <div className="px-6 pb-6 space-y-6 border-t border-white/5 pt-6">
            {/* Opening */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-white">Opening Message</label>
              <p className="text-[11px] text-slate-500">
                AI reads this at the start.
                {globalSettings?.globalOpening && <span className="text-indigo-400"> Global template active — leave blank to use it.</span>}
              </p>
              <textarea value={openingMessage} onChange={(e) => setOpeningMessage(e.target.value)} placeholder={globalSettings?.globalOpening || defaultOpening} rows={3}
                className="w-full rounded-xl border border-white/10 bg-slate-900/50 px-4 py-3 text-sm text-white placeholder-slate-600 outline-none focus:border-purple-500/50 resize-none transition" />
              <p className="text-[10px] text-slate-600">Use [Name] [Job] [Company] as placeholders.</p>
            </div>

            {/* Closing */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-white">Closing Message</label>
              <p className="text-[11px] text-slate-500">
                AI reads this after all questions.
                {globalSettings?.globalClosing && <span className="text-indigo-400"> Global template active — leave blank to use it.</span>}
              </p>
              <textarea value={closingMessage} onChange={(e) => setClosingMessage(e.target.value)} placeholder={globalSettings?.globalClosing || defaultClosing} rows={3}
                className="w-full rounded-xl border border-white/10 bg-slate-900/50 px-4 py-3 text-sm text-white placeholder-slate-600 outline-none focus:border-purple-500/50 resize-none transition" />
            </div>

            {/* Mid-interview instructions */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <label className="block text-xs font-semibold text-white">Mid-Interview Instructions</label>
                  <p className="text-[11px] text-slate-500 mt-0.5">AI says these at specific points.</p>
                </div>
                <button onClick={addInstruction} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600 text-white text-xs font-semibold hover:bg-purple-500 transition">
                  <Plus className="w-3.5 h-3.5" /> Add
                </button>
              </div>

              {instructions.length === 0 && (
                <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4 text-center">
                  <p className="text-xs text-slate-500">No instructions yet.</p>
                </div>
              )}

              {instructions.map((ins, idx) => (
                <div key={ins.id} className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-white">Instruction {idx + 1}</p>
                    <button onClick={() => removeInstruction(ins.id)} className="p-1 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">When</label>
                    <div className="flex flex-col gap-1.5">
                      {triggerOptions.map((opt) => (
                        <button key={opt.value} onClick={() => updateInstruction(ins.id, { trigger: opt.value as any })}
                          className={`text-left px-3 py-2 rounded-lg text-xs transition ${ins.trigger === opt.value ? "bg-purple-500/10 border border-purple-500/20 text-purple-400" : "bg-white/[0.02] border border-white/5 text-slate-400 hover:border-white/10"}`}>
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  {ins.trigger === "before_question" && (
                    <div className="space-y-1">
                      <label className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">Before question number</label>
                      <input type="number" min={1} max={10} value={ins.questionIndex || 2} onChange={(e) => updateInstruction(ins.id, { questionIndex: parseInt(e.target.value) })}
                        className="w-24 rounded-lg border border-white/10 bg-slate-900/50 px-3 py-1.5 text-sm text-white outline-none focus:border-purple-500/50 transition" />
                    </div>
                  )}
                  {ins.trigger === "question_type" && (
                    <div className="space-y-1">
                      <label className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">Question type</label>
                      <div className="flex flex-wrap gap-1.5">
                        {questionTypeOptions.map((opt) => (
                          <button key={opt.value} onClick={() => updateInstruction(ins.id, { questionType: opt.value })}
                            className={`px-2.5 py-1.5 rounded-lg text-xs transition ${ins.questionType === opt.value ? "bg-purple-500/10 border border-purple-500/20 text-purple-400" : "bg-white/[0.02] border border-white/5 text-slate-400 hover:border-white/10"}`}>
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  {ins.trigger === "timed" && (
                    <div className="space-y-1">
                      <label className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">After minutes</label>
                      <input type="number" min={1} max={60} value={ins.afterMinutes || 5} onChange={(e) => updateInstruction(ins.id, { afterMinutes: parseInt(e.target.value) })}
                        className="w-24 rounded-lg border border-white/10 bg-slate-900/50 px-3 py-1.5 text-sm text-white outline-none focus:border-purple-500/50 transition" />
                    </div>
                  )}
                  <div className="space-y-1">
                    <label className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">What AI should say</label>
                    <textarea value={ins.message} onChange={(e) => updateInstruction(ins.id, { message: e.target.value })}
                      placeholder='e.g. "Great work so far. We are now moving to the technical section."'
                      rows={2}
                      className="w-full rounded-lg border border-white/10 bg-slate-900/50 px-3 py-2 text-xs text-white placeholder-slate-600 outline-none focus:border-purple-500/50 resize-none transition" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Question sources */}
      <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">AI Will Generate Questions From</p>
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: "CV Verification", desc: "Verify experience & claims", color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20" },
            { label: "Location Based", desc: "Relevant to candidate's region", color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
            { label: "Job Specific", desc: selectedJobId ? "From selected job description" : "General role questions", color: "text-purple-400", bg: "bg-purple-500/10", border: "border-purple-500/20" },
            { label: "Behavioural", desc: "Culture fit & soft skills", color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20" },
          ].map((q) => (
            <div key={q.label} className={`rounded-xl border ${q.border} ${q.bg} p-3`}>
              <p className={`text-xs font-semibold ${q.color} mb-0.5`}>{q.label}</p>
              <p className="text-[10px] text-slate-500">{q.desc}</p>
            </div>
          ))}
        </div>
        <p className="text-xs text-slate-600 mt-3">
          8–10 questions · Per-answer AI scoring · Final summary + hire recommendation ·{" "}
          <span className={`font-semibold ${selectedColor.check}`}>{selectedTypeConfig.label} format</span>
          {allowFollowUps && <span className="text-purple-400"> · Up to 3 follow-ups</span>}
        </p>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <Link href="/recruiter/interviews" className="flex-1 inline-flex items-center justify-center px-4 py-3 rounded-xl border border-white/10 bg-white/5 text-slate-400 text-sm font-medium hover:text-white hover:bg-white/10 transition">
          Cancel
        </Link>
        <button
          onClick={handleCreate}
          disabled={creating || !candidate || loadingCandidate}
          className={`flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-white text-sm font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed ${interviewType === "VIDEO" ? "bg-pink-600 hover:bg-pink-500" : interviewType === "VOICE" ? "bg-violet-600 hover:bg-violet-500" : "bg-indigo-600 hover:bg-indigo-500"}`}
        >
          {creating ? <><Loader2 className="w-4 h-4 animate-spin" />Generating Questions...</> : <><Zap className="w-4 h-4" />Create {interviewType.charAt(0) + interviewType.slice(1).toLowerCase()} Interview</>}
        </button>
      </div>
    </div>
  );
}

export default function NewInterviewPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-2 border-purple-500 border-t-transparent" /></div>}>
      <NewInterviewInner />
    </Suspense>
  );
}
