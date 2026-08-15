"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import ResumeUploader from "@/components/resume/ResumeUploader";
import {
  Sparkles, AlertCircle, Search, Brain, Target, Zap, TrendingUp,
  User, Mail, Phone, MapPin, Star, AlertTriangle, Trophy,
  CheckCircle, XCircle, ChevronDown, ChevronUp, BarChart3,
  Briefcase, GraduationCap, Globe, Upload, PenLine, Loader2,
  FileX, FileText,
} from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";

const recommendationConfig = {
  "Strong Hire": { color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/30", icon: CheckCircle, bar: "bg-emerald-500" },
  Hire: { color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/30", icon: CheckCircle, bar: "bg-blue-500" },
  Maybe: { color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/30", icon: AlertTriangle, bar: "bg-amber-500" },
  "No Hire": { color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/30", icon: XCircle, bar: "bg-red-500" },
};

const NON_CV_LABELS: Record<string, string> = {
  COVER_LETTER: "Cover Letter",
  REFERENCE_LETTER: "Reference Letter",
  TRANSCRIPT: "Academic Transcript",
  PORTFOLIO: "Portfolio",
  OTHER: "Unknown Document",
};

interface JobPost {
  id: string;
  title: string;
  description: string;
  requirements: string;
  location: string;
  type: string;
}

export default function RecruiterUploadPage() {
  const { data: session } = useSession();
  const [stage, setStage] = useState<"upload" | "job" | "analyzing" | "result">("upload");
  const [pendingText, setPendingText] = useState("");
  const [pendingFileName, setPendingFileName] = useState("");
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [detectedDocType, setDetectedDocType] = useState<any>(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<any>(null);
  const [candidateId, setCandidateId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [showAllStrengths, setShowAllStrengths] = useState(false);
  const [showAllRedFlags, setShowAllRedFlags] = useState(false);
  const [usage, setUsage] = useState<{ used: number; limit: number; remaining: number } | null>(null);

  // Position matching
  const [positionMatches, setPositionMatches] = useState<any>(null);
  const [loadingMatches, setLoadingMatches] = useState(false);

  // Job context
  const [jobPosts, setJobPosts] = useState<JobPost[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [jobMode, setJobMode] = useState<"select" | "manual">("select");
  const [manualJobTitle, setManualJobTitle] = useState("");
  const [manualJobRequirements, setManualJobRequirements] = useState("");
  const [loadingJobs, setLoadingJobs] = useState(false);

  const analysisSteps = [
    { icon: Search, label: "Reading candidate CV", duration: 5 },
    { icon: Brain, label: "Extracting candidate details", duration: 5 },
    { icon: Target, label: "Evaluating skills & experience", duration: 8 },
    { icon: TrendingUp, label: "Identifying strengths & red flags", duration: 7 },
    { icon: Zap, label: "Generating hire recommendation", duration: 5 },
  ];
  const TOTAL_DURATION = 30;

  useEffect(() => {
    if (!isAnalyzing) { setProgress(0); setCurrentStep(0); return; }
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = (Date.now() - startTime) / 1000;
      setProgress(Math.min((elapsed / TOTAL_DURATION) * 100, 99));
      let acc = 0;
      for (let i = 0; i < analysisSteps.length; i++) {
        acc += analysisSteps[i].duration;
        if (elapsed < acc) { setCurrentStep(i); break; }
      }
    }, 100);
    return () => clearInterval(interval);
  }, [isAnalyzing]);

  useEffect(() => {
    if (stage === "job") {
      setLoadingJobs(true);
      fetch("/api/recruiter/jobs?status=ACTIVE")
        .then((r) => r.json())
        .then((d) => setJobPosts(d.jobs || []))
        .catch(() => {})
        .finally(() => setLoadingJobs(false));
    }
  }, [stage]);

  useEffect(() => {
    const title = jobMode === "select" && selectedJobId
      ? jobPosts.find((j) => j.id === selectedJobId)?.title || ""
      : manualJobTitle;
    if (!title || title.length < 3) { setPositionMatches(null); return; }
    const t = setTimeout(async () => {
      setLoadingMatches(true);
      try {
        const res = await fetch("/api/recruiter/candidates/match", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ jobTitle: title, requirements: manualJobRequirements }),
        });
        const data = await res.json();
        setPositionMatches(data.total > 0 ? data : null);
      } catch {}
      finally { setLoadingMatches(false); }
    }, 800);
    return () => clearTimeout(t);
  }, [selectedJobId, manualJobTitle, manualJobRequirements, jobMode, jobPosts]);

  const handleFileReady = async (text: string, fileName?: string, file?: File | null) => {
    setPendingText(text);
    setPendingFileName(fileName || "");
    setPendingFile(file || null);
    setIsDetecting(true);
    setError("");

    try {
      const res = await fetch("/api/recruiter/cv/detect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      setDetectedDocType(data.detection);

      if (data.detection?.type === "CV") {
        setStage("job");
      } else {
        setStage("upload");
        setError(`This file appears to be a ${data.detection?.typeName || "non-CV document"}, not a CV. Please upload a CV or resume.`);
      }
    } catch {
      // If detection fails, proceed anyway
      setStage("job");
    } finally {
      setIsDetecting(false);
    }
  };

  const getJobContext = () => {
    if (jobMode === "select" && selectedJobId) {
      const job = jobPosts.find((j) => j.id === selectedJobId);
      if (job) return { title: job.title, requirements: job.requirements || job.description };
    }
    if (jobMode === "manual" && manualJobTitle.trim()) {
      return { title: manualJobTitle.trim(), requirements: manualJobRequirements.trim() };
    }
    return null;
  };

  const handleAnalyze = async () => {
    const jobContext = getJobContext();
    const selectedJobPost = selectedJobId ? jobPosts.find((j) => j.id === selectedJobId) : null;

    setIsAnalyzing(true);
    setStage("analyzing");
    setError("");
    setAnalysis(null);
    setCandidateId(null);
    setProgress(0);
    setCurrentStep(0);

    try {
      // Send as FormData so we can include the actual file for storage
      const formData = new FormData();
      formData.append("resumeText", pendingText);
      formData.append("fileName", pendingFileName);
      if (selectedJobPost?.id) formData.append("jobId", selectedJobPost.id);
      if (jobContext) formData.append("jobContext", JSON.stringify(jobContext));
      if (pendingFile) formData.append("file", pendingFile);

      const response = await fetch("/api/recruiter/cv/analyze", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.upgradeRequired) throw new Error("You need a recruiter plan to analyse CVs. Please upgrade.");
        if (data.limitReached) throw new Error(data.error);
        throw new Error(data.error || "Analysis failed");
      }

      setProgress(100);
      setUsage(data.usage);
      setTimeout(() => {
        setAnalysis(data.analysis);
        setCandidateId(data.candidateId);
        setIsAnalyzing(false);
        setStage("result");
      }, 500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setIsAnalyzing(false);
      setStage("upload");
    }
  };

  const resetAll = () => {
    setStage("upload");
    setPendingText("");
    setPendingFileName("");
    setPendingFile(null);
    setPendingFile(null);
    setDetectedDocType(null);
    setAnalysis(null);
    setCandidateId(null);
    setError("");
    setUsage(null);
    setSelectedJobId(null);
    setManualJobTitle("");
    setManualJobRequirements("");
  };

  const secondsRemaining = Math.max(0, Math.ceil(TOTAL_DURATION - (progress / 100) * TOTAL_DURATION));
  const recommendation = analysis?.hiringRecommendation as keyof typeof recommendationConfig | undefined;
  const config = recommendation ? recommendationConfig[recommendation] || recommendationConfig["Maybe"] : null;

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      {/* Header */}
      <div>
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-purple-500/20 bg-purple-500/10 px-3 py-1 text-xs font-medium text-purple-400">
          <Sparkles className="h-3 w-3" />AI Candidate Analysis
        </div>
        <h1 className="text-3xl font-semibold text-white">Upload CV</h1>
        <p className="mt-2 text-slate-400">Upload a candidate's CV. AI detects the document type, then scores it against your chosen role.</p>
      </div>

      {/* Usage bar */}
      {usage && (
        <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-slate-400">Monthly CV usage</p>
            <p className="text-sm font-medium text-white">{usage.used} / {usage.limit}</p>
          </div>
          <div className="h-1.5 w-full rounded-full bg-white/5">
            <div className={`h-1.5 rounded-full transition-all ${(usage.used / usage.limit) > 0.8 ? "bg-red-500" : (usage.used / usage.limit) > 0.5 ? "bg-amber-500" : "bg-purple-500"}`}
              style={{ width: `${Math.min(100, (usage.used / usage.limit) * 100)}%` }} />
          </div>
          <p className="text-xs text-slate-500 mt-1">{usage.remaining} CVs remaining this month</p>
        </div>
      )}

      {/* Stage: Upload */}
      {(stage === "upload") && (
        <>
          <ResumeUploader onAnalyze={handleFileReady} isAnalyzing={isDetecting} />
          {isDetecting && (
            <div className="flex items-center gap-3 p-4 rounded-2xl border border-purple-500/20 bg-purple-500/5">
              <Loader2 className="w-5 h-5 text-purple-400 animate-spin" />
              <p className="text-sm text-purple-300">AI is identifying document type...</p>
            </div>
          )}
          {error && (
            <div className="flex items-start gap-3 rounded-3xl border border-red-500/20 bg-red-500/5 p-6">
              <AlertCircle className="h-5 w-5 shrink-0 text-red-400 mt-0.5" />
              <div>
                <h3 className="font-semibold text-white">Wrong Document Type</h3>
                <p className="mt-1 text-sm text-red-400">{error}</p>
              </div>
            </div>
          )}
        </>
      )}

      {/* Stage: Job Context */}
      {stage === "job" && (
        <div className="space-y-6">
          {detectedDocType && (
            <div className="flex items-center gap-3 p-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/5">
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
              <p className="text-sm text-emerald-300">
                <span className="font-semibold">CV detected</span> — {pendingFileName} ({detectedDocType.confidence}% confidence)
              </p>
            </div>
          )}

          <div>
            <h2 className="text-xl font-bold text-white">Set Job Context</h2>
            <p className="text-slate-400 text-sm mt-1">AI will score this CV specifically against the role you choose for more accurate results.</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => setJobMode("select")}
              className={`p-4 rounded-2xl border text-left transition ${jobMode === "select" ? "border-purple-500/40 bg-purple-500/10" : "border-white/10 bg-white/[0.02] hover:border-white/20"}`}>
              <Briefcase className={`w-5 h-5 mb-2 ${jobMode === "select" ? "text-purple-400" : "text-slate-400"}`} />
              <p className={`text-sm font-semibold ${jobMode === "select" ? "text-white" : "text-slate-300"}`}>Select Job Post</p>
              <p className="text-xs text-slate-500 mt-0.5">Choose from your active job postings</p>
            </button>
            <button onClick={() => setJobMode("manual")}
              className={`p-4 rounded-2xl border text-left transition ${jobMode === "manual" ? "border-purple-500/40 bg-purple-500/10" : "border-white/10 bg-white/[0.02] hover:border-white/20"}`}>
              <PenLine className={`w-5 h-5 mb-2 ${jobMode === "manual" ? "text-purple-400" : "text-slate-400"}`} />
              <p className={`text-sm font-semibold ${jobMode === "manual" ? "text-white" : "text-slate-300"}`}>Enter Manually</p>
              <p className="text-xs text-slate-500 mt-0.5">Type in the job title and requirements</p>
            </button>
          </div>

          {jobMode === "select" && (
            <div className="space-y-3">
              {loadingJobs ? (
                <div className="flex items-center gap-2 text-slate-400 text-sm"><Loader2 className="w-4 h-4 animate-spin" />Loading your job posts...</div>
              ) : jobPosts.length === 0 ? (
                <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 text-center space-y-3">
                  <Briefcase className="w-8 h-8 text-slate-500 mx-auto" />
                  <p className="text-sm text-slate-400">No active job posts found.</p>
                  <button onClick={() => setJobMode("manual")} className="text-xs text-purple-400 hover:text-purple-300 transition">Enter job details manually →</button>
                </div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {jobPosts.map((job) => (
                    <div key={job.id} onClick={() => setSelectedJobId(job.id)}
                      className={`p-4 rounded-xl border cursor-pointer transition ${selectedJobId === job.id ? "border-purple-500/40 bg-purple-500/10" : "border-white/10 bg-white/[0.02] hover:border-white/20"}`}>
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-white">{job.title}</p>
                          <p className="text-xs text-slate-500 mt-0.5">{job.location} · {job.type}</p>
                        </div>
                        {selectedJobId === job.id && <CheckCircle className="w-4 h-4 text-purple-400 shrink-0" />}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {jobMode === "manual" && (
            <div className="space-y-4 rounded-2xl border border-white/10 bg-white/[0.02] p-5">
              <div>
                <label className="text-xs text-slate-500 mb-1.5 block">Job Title *</label>
                <input value={manualJobTitle} onChange={(e) => setManualJobTitle(e.target.value)}
                  placeholder="e.g. Senior Product Designer"
                  className="w-full rounded-xl border border-white/10 bg-slate-900/50 px-4 py-2.5 text-sm text-white placeholder-slate-600 outline-none focus:border-purple-500/50 transition" />
              </div>
              <div>
                <label className="text-xs text-slate-500 mb-1.5 block">Key Requirements</label>
                <textarea value={manualJobRequirements} onChange={(e) => setManualJobRequirements(e.target.value)}
                  placeholder="List the key skills, experience, and qualifications..." rows={4}
                  className="w-full rounded-xl border border-white/10 bg-slate-900/50 px-4 py-3 text-sm text-white placeholder-slate-600 outline-none focus:border-purple-500/50 resize-none transition" />
              </div>
            </div>
          )}

          <p className="text-xs text-slate-500 text-center">
            No job context?{" "}
            <button onClick={handleAnalyze} className="text-slate-400 hover:text-white transition underline underline-offset-2">
              Skip and analyse without role context
            </button>
          </p>

          <div className="flex gap-4">
            <button onClick={resetAll} className="px-6 py-3 rounded-xl border border-white/10 bg-white/5 text-white font-semibold hover:bg-white/10 transition">← Back</button>
            <button onClick={handleAnalyze}
              disabled={(jobMode === "select" && !selectedJobId) || (jobMode === "manual" && !manualJobTitle.trim())}
              className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-purple-600 text-white font-semibold hover:bg-purple-500 transition disabled:opacity-50">
              <Zap className="w-4 h-4" />Analyse CV with AI
            </button>
          </div>
        </div>
      )}

      {/* Stage: Analyzing */}
      {stage === "analyzing" && (
        <div className="rounded-3xl border border-purple-500/20 bg-gradient-to-br from-slate-900/80 to-slate-900/40 p-8 backdrop-blur-xl">
          <div className="mb-8 flex flex-col items-center">
            <div className="relative flex h-32 w-32 items-center justify-center">
              <svg className="absolute -rotate-90" width="128" height="128" viewBox="0 0 128 128">
                <circle cx="64" cy="64" r="56" stroke="rgb(30 41 59)" strokeWidth="8" fill="none" />
                <circle cx="64" cy="64" r="56" strokeWidth="8" fill="none" strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 56}
                  strokeDashoffset={2 * Math.PI * 56 - (progress / 100) * (2 * Math.PI * 56)}
                  className="stroke-purple-500 transition-all duration-100 ease-linear" />
              </svg>
              <div className="text-center">
                <div className="text-3xl font-bold text-white">{secondsRemaining}s</div>
                <div className="text-xs text-slate-500">remaining</div>
              </div>
            </div>
            <h3 className="mt-4 text-lg font-semibold text-white">Analysing candidate CV</h3>
            <p className="mt-1 text-sm text-slate-400">This typically takes 15–30 seconds</p>
          </div>
          <div className="space-y-3">
            {analysisSteps.map((step, i) => {
              const StepIcon = step.icon;
              const isActive = i === currentStep;
              const isComplete = i < currentStep;
              return (
                <div key={i} className={`flex items-center gap-3 rounded-xl border p-3 transition-all ${isActive ? "border-purple-500/30 bg-purple-500/10" : isComplete ? "border-emerald-500/20 bg-emerald-500/5" : "border-white/5 bg-slate-900/40"}`}>
                  <div className={`flex h-8 w-8 items-center justify-center rounded-lg transition ${isActive ? "bg-purple-500/20 text-purple-400" : isComplete ? "bg-emerald-500/20 text-emerald-400" : "bg-slate-800 text-slate-600"}`}>
                    {isComplete ? <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                     : isActive ? <StepIcon className="h-4 w-4 animate-pulse" /> : <StepIcon className="h-4 w-4" />}
                  </div>
                  <span className={`text-sm font-medium ${isActive ? "text-white" : isComplete ? "text-emerald-300" : "text-slate-500"}`}>{step.label}</span>
                  {isActive && <div className="ml-auto flex gap-1">{[0,1,2].map((j) => <div key={j} className="h-1.5 w-1.5 animate-pulse rounded-full bg-purple-500" style={{ animationDelay: `${j * 200}ms` }} />)}</div>}
                  {isComplete && <span className="ml-auto text-xs text-emerald-400">Done</span>}
                </div>
              );
            })}
          </div>
          <div className="mt-6">
            <div className="mb-2 flex items-center justify-between text-xs">
              <span className="text-slate-500">Overall Progress</span>
              <span className="text-purple-400">{Math.round(progress)}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
              <div className="h-full rounded-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-100 ease-linear" style={{ width: `${progress}%` }} />
            </div>
          </div>
        </div>
      )}

      {/* Stage: Result */}
      {stage === "result" && analysis && (
        <div className="space-y-6">
          <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-8">
            <div className="flex flex-col lg:flex-row gap-8">
              <div className="flex-1">
                <div className="flex items-start gap-4 mb-6">
                  <div className="w-14 h-14 rounded-2xl bg-purple-500/20 flex items-center justify-center shrink-0">
                    <User className="w-7 h-7 text-purple-400" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">{analysis.candidateName || "Unknown Candidate"}</h2>
                    <p className="text-slate-400 text-sm mt-0.5">
                      {analysis.currentRole || "Role not specified"}
                      {analysis.currentCompany && ` at ${analysis.currentCompany}`}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                  {analysis.candidateEmail && <div className="flex items-center gap-2 text-sm text-slate-300"><Mail className="w-4 h-4 text-slate-500 shrink-0" />{analysis.candidateEmail}</div>}
                  {analysis.candidatePhone && <div className="flex items-center gap-2 text-sm text-slate-300"><Phone className="w-4 h-4 text-slate-500 shrink-0" />{analysis.candidatePhone}</div>}
                  {analysis.candidateLocation && <div className="flex items-center gap-2 text-sm text-slate-300"><MapPin className="w-4 h-4 text-slate-500 shrink-0" />{analysis.candidateLocation}</div>}
                  {analysis.totalExperienceYears != null && <div className="flex items-center gap-2 text-sm text-slate-300"><Briefcase className="w-4 h-4 text-slate-500 shrink-0" />{analysis.totalExperienceYears} years experience</div>}
                </div>
                <div className="flex flex-wrap gap-2">
                  {analysis.experienceLevel && <span className="px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-xs text-purple-400 font-medium">{analysis.experienceLevel}</span>}
                  {analysis.industryBackground?.map((ind: string) => <span key={ind} className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-slate-300">{ind}</span>)}
                </div>
              </div>
              <div className="flex flex-col gap-4 lg:w-64">
                {config && (
                  <div className={`rounded-2xl border ${config.border} ${config.bg} p-5 text-center`}>
                    <p className="text-xs text-slate-400 mb-2 uppercase tracking-wider font-medium">Hire Recommendation</p>
                    <div className={`text-2xl font-bold ${config.color} mb-1`}>{analysis.hiringRecommendation}</div>
                    <p className="text-xs text-slate-500">{analysis.confidenceScore}% confidence</p>
                  </div>
                )}
                <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs text-slate-400 uppercase tracking-wider font-medium">ATS Score</p>
                    <p className="text-2xl font-bold text-white">{analysis.atsScore}<span className="text-sm text-slate-500">/100</span></p>
                  </div>
                  <div className="h-2 w-full rounded-full bg-white/5">
                    <div className={`h-2 rounded-full transition-all ${analysis.atsScore >= 80 ? "bg-emerald-500" : analysis.atsScore >= 60 ? "bg-amber-500" : "bg-red-500"}`}
                      style={{ width: `${analysis.atsScore}%` }} />
                  </div>
                </div>
                {analysis.cvQuality && (
                  <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
                    <p className="text-xs text-slate-400 uppercase tracking-wider font-medium mb-3">CV Quality</p>
                    <div className="space-y-1.5 text-xs">
                      {[{ label: "Formatting", value: analysis.cvQuality.formatting }, { label: "Completeness", value: analysis.cvQuality.completeness }, { label: "Clarity", value: analysis.cvQuality.clarity }].map((q) => (
                        <div key={q.label} className="flex justify-between"><span className="text-slate-500">{q.label}</span><span className="text-white font-medium">{q.value}</span></div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
            {analysis.summary && (
              <div className="mt-6 pt-6 border-t border-white/5">
                <p className="text-xs text-purple-400 font-semibold uppercase tracking-wider mb-2">AI Summary</p>
                <p className="text-slate-300 text-sm leading-relaxed">{analysis.summary}</p>
              </div>
            )}
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-8">
            <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2"><BarChart3 className="w-5 h-5 text-purple-400" />Skills</h3>
            <div className="space-y-5">
              {analysis.topSkills?.length > 0 && <div><p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-3">Top Skills</p><div className="flex flex-wrap gap-2">{analysis.topSkills.map((s: string) => <span key={s} className="px-3 py-1.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-sm text-purple-300">{s}</span>)}</div></div>}
              {analysis.technicalSkills?.length > 0 && <div><p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-3">Technical</p><div className="flex flex-wrap gap-2">{analysis.technicalSkills.map((s: string) => <span key={s} className="px-3 py-1.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-sm text-blue-300">{s}</span>)}</div></div>}
              {analysis.softSkills?.length > 0 && <div><p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-3">Soft Skills</p><div className="flex flex-wrap gap-2">{analysis.softSkills.map((s: string) => <span key={s} className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-sm text-emerald-300">{s}</span>)}</div></div>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="rounded-3xl border border-emerald-500/20 bg-emerald-500/5 p-8">
              <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2"><Star className="w-5 h-5 text-emerald-400" />Strengths</h3>
              <div className="space-y-4">
                {(showAllStrengths ? analysis.strengths : analysis.strengths?.slice(0, 3))?.map((s: any, i: number) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0 mt-0.5"><CheckCircle className="w-3.5 h-3.5 text-emerald-400" /></div>
                    <div><p className="text-sm font-semibold text-white">{s.title}</p><p className="text-xs text-slate-400 mt-0.5">{s.detail}</p></div>
                  </div>
                ))}
              </div>
              {analysis.strengths?.length > 3 && <button onClick={() => setShowAllStrengths(!showAllStrengths)} className="mt-4 flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 transition">{showAllStrengths ? <><ChevronUp className="w-3 h-3" />Show less</> : <><ChevronDown className="w-3 h-3" />{analysis.strengths.length - 3} more strengths</>}</button>}
            </div>
            <div className="rounded-3xl border border-red-500/20 bg-red-500/5 p-8">
              <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-red-400" />Red Flags</h3>
              {analysis.redFlags?.length === 0 ? (
                <div className="flex items-center gap-3 text-emerald-400"><CheckCircle className="w-5 h-5" /><p className="text-sm">No red flags detected</p></div>
              ) : (
                <div className="space-y-4">
                  {(showAllRedFlags ? analysis.redFlags : analysis.redFlags?.slice(0, 3))?.map((f: any, i: number) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-red-500/20 flex items-center justify-center shrink-0 mt-0.5"><AlertTriangle className="w-3.5 h-3.5 text-red-400" /></div>
                      <div><p className="text-sm font-semibold text-white">{f.title}</p><p className="text-xs text-slate-400 mt-0.5">{f.detail}</p></div>
                    </div>
                  ))}
                </div>
              )}
              {analysis.redFlags?.length > 3 && <button onClick={() => setShowAllRedFlags(!showAllRedFlags)} className="mt-4 flex items-center gap-1 text-xs text-red-400 hover:text-red-300 transition">{showAllRedFlags ? <><ChevronUp className="w-3 h-3" />Show less</> : <><ChevronDown className="w-3 h-3" />{analysis.redFlags.length - 3} more flags</>}</button>}
            </div>
          </div>

          {analysis.keyAchievements?.length > 0 && (
            <div className="rounded-3xl border border-amber-500/20 bg-amber-500/5 p-8">
              <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2"><Trophy className="w-5 h-5 text-amber-400" />Key Achievements</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {analysis.keyAchievements.map((a: string, i: number) => (
                  <div key={i} className="flex items-start gap-3"><div className="w-6 h-6 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0 mt-0.5"><Star className="w-3.5 h-3.5 text-amber-400" /></div><p className="text-sm text-slate-300">{a}</p></div>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {analysis.education && (
              <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-6">
                <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2"><GraduationCap className="w-4 h-4 text-purple-400" />Education</h3>
                <p className="text-white font-medium text-sm">{analysis.education.highestDegree}</p>
                {analysis.education.institution && <p className="text-slate-400 text-xs mt-1">{analysis.education.institution}</p>}
                {analysis.education.graduationYear && <p className="text-slate-500 text-xs mt-0.5">{analysis.education.graduationYear}</p>}
              </div>
            )}
            {analysis.languagesSpoken?.length > 0 && (
              <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-6">
                <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2"><Globe className="w-4 h-4 text-blue-400" />Languages</h3>
                <div className="flex flex-wrap gap-2">{analysis.languagesSpoken.map((lang: string) => <span key={lang} className="px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-xs text-blue-300">{lang}</span>)}</div>
              </div>
            )}
            {analysis.salaryExpectation && (
              <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-6">
                <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-emerald-400" />Est. Salary Range</h3>
                <p className="text-emerald-400 font-semibold text-sm">{analysis.salaryExpectation}</p>
                <p className="text-slate-500 text-xs mt-1">Based on experience level</p>
              </div>
            )}
          </div>

          {analysis.interviewRecommendation && (
            <div className="rounded-3xl border border-purple-500/20 bg-purple-500/5 p-8">
              <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2"><Zap className="w-5 h-5 text-purple-400" />Interview Recommendation</h3>
              <p className="text-slate-300 text-sm leading-relaxed">{analysis.interviewRecommendation}</p>
            </div>
          )}

          <div className="flex flex-wrap gap-4 pt-2 pb-8">
            <Link href="/recruiter/candidates"
              className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-6 py-3 text-sm font-semibold text-white hover:bg-purple-500 transition">
              <User className="w-4 h-4" />View All Candidates
            </Link>
            <button onClick={resetAll}
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-6 py-3 text-sm font-semibold text-white hover:bg-white/10 transition">
              <Upload className="w-4 h-4" />Analyse Another CV
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
