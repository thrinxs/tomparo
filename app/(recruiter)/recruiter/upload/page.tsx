"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import ResumeUploader from "@/components/resume/ResumeUploader";
import {
  Sparkles,
  AlertCircle,
  Search,
  Brain,
  Target,
  Zap,
  TrendingUp,
  User,
  Mail,
  Phone,
  MapPin,
  Star,
  AlertTriangle,
  Trophy,
  CheckCircle,
  XCircle,
  ChevronDown,
  ChevronUp,
  BarChart3,
  Briefcase,
  GraduationCap,
  Globe,
  Upload,
} from "lucide-react";
import Link from "next/link";

// ── Hire recommendation config ─────────────────────────────────────────────────

const recommendationConfig = {
  "Strong Hire": {
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/30",
    icon: CheckCircle,
    bar: "bg-emerald-500",
  },
  Hire: {
    color: "text-blue-400",
    bg: "bg-blue-500/10",
    border: "border-blue-500/30",
    icon: CheckCircle,
    bar: "bg-blue-500",
  },
  Maybe: {
    color: "text-amber-400",
    bg: "bg-amber-500/10",
    border: "border-amber-500/30",
    icon: AlertTriangle,
    bar: "bg-amber-500",
  },
  "No Hire": {
    color: "text-red-400",
    bg: "bg-red-500/10",
    border: "border-red-500/30",
    icon: XCircle,
    bar: "bg-red-500",
  },
};

export default function RecruiterUploadPage() {
  const { data: session } = useSession();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<any>(null);
  const [candidateId, setCandidateId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [showAllStrengths, setShowAllStrengths] = useState(false);
  const [showAllRedFlags, setShowAllRedFlags] = useState(false);
  const [usage, setUsage] = useState<{
    used: number;
    limit: number;
    remaining: number;
  } | null>(null);

  const analysisSteps = [
    { icon: Search, label: "Reading candidate CV", duration: 5 },
    { icon: Brain, label: "Extracting candidate details", duration: 5 },
    { icon: Target, label: "Evaluating skills & experience", duration: 8 },
    { icon: TrendingUp, label: "Identifying strengths & red flags", duration: 7 },
    { icon: Zap, label: "Generating hire recommendation", duration: 5 },
  ];

  const TOTAL_DURATION = 30;

  useEffect(() => {
    if (!isAnalyzing) {
      setProgress(0);
      setCurrentStep(0);
      return;
    }

    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = (Date.now() - startTime) / 1000;
      const newProgress = Math.min((elapsed / TOTAL_DURATION) * 100, 99);
      setProgress(newProgress);

      let accumulatedTime = 0;
      for (let i = 0; i < analysisSteps.length; i++) {
        accumulatedTime += analysisSteps[i].duration;
        if (elapsed < accumulatedTime) {
          setCurrentStep(i);
          break;
        }
      }
    }, 100);

    return () => clearInterval(interval);
  }, [isAnalyzing]);

  const handleAnalyze = async (text: string, fileName?: string) => {
    setIsAnalyzing(true);
    setError("");
    setAnalysis(null);
    setCandidateId(null);
    setProgress(0);
    setCurrentStep(0);

    try {
      const response = await fetch("/api/recruiter/cv/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeText: text, fileName }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.upgradeRequired) {
          throw new Error(
            "You need a recruiter plan to analyse CVs. Please upgrade."
          );
        }
        if (data.limitReached) {
          throw new Error(data.error);
        }
        throw new Error(data.error || "Analysis failed");
      }

      setProgress(100);
      setUsage(data.usage);

      setTimeout(() => {
        setAnalysis(data.analysis);
        setCandidateId(data.candidateId);
        setIsAnalyzing(false);
      }, 500);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Something went wrong";
      setError(message);
      setIsAnalyzing(false);
    }
  };

  const secondsRemaining = Math.max(
    0,
    Math.ceil(TOTAL_DURATION - (progress / 100) * TOTAL_DURATION)
  );

  const recommendation = analysis?.hiringRecommendation as
    | keyof typeof recommendationConfig
    | undefined;
  const config = recommendation
    ? recommendationConfig[recommendation] ||
      recommendationConfig["Maybe"]
    : null;

  return (
    <div className="mx-auto max-w-5xl space-y-8">

      {/* ── Header ── */}
      <div>
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-purple-500/20 bg-purple-500/10 px-3 py-1 text-xs font-medium text-purple-400">
          <Sparkles className="h-3 w-3" />
          AI Candidate Analysis
        </div>
        <h1 className="text-3xl font-semibold text-white">Upload CV</h1>
        <p className="mt-2 text-slate-400">
          Upload a candidate&apos;s CV and get an instant AI-powered hiring
          assessment — ATS score, strengths, red flags, and hire recommendation.
        </p>
      </div>

      {/* ── Usage bar ── */}
      {usage && (
        <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-slate-400">
              Monthly CV usage
            </p>
            <p className="text-sm font-medium text-white">
              {usage.used} / {usage.limit}
            </p>
          </div>
          <div className="h-1.5 w-full rounded-full bg-white/5">
            <div
              className={`h-1.5 rounded-full transition-all ${
                (usage.used / usage.limit) > 0.8
                  ? "bg-red-500"
                  : (usage.used / usage.limit) > 0.5
                  ? "bg-amber-500"
                  : "bg-purple-500"
              }`}
              style={{ width: `${Math.min(100, (usage.used / usage.limit) * 100)}%` }}
            />
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {usage.remaining} CVs remaining this month
          </p>
        </div>
      )}

      {/* ── CV Uploader ── */}
      <ResumeUploader onAnalyze={handleAnalyze} isAnalyzing={isAnalyzing} />

      {/* ── Loading ── */}
      {isAnalyzing && (
        <div className="rounded-3xl border border-purple-500/20 bg-gradient-to-br from-slate-900/80 to-slate-900/40 p-8 backdrop-blur-xl">
          <div className="mb-8 flex flex-col items-center">
            <div className="relative flex h-32 w-32 items-center justify-center">
              <svg
                className="absolute -rotate-90"
                width="128"
                height="128"
                viewBox="0 0 128 128"
              >
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  stroke="rgb(30 41 59)"
                  strokeWidth="8"
                  fill="none"
                />
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  strokeWidth="8"
                  fill="none"
                  strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 56}
                  strokeDashoffset={
                    2 * Math.PI * 56 -
                    (progress / 100) * (2 * Math.PI * 56)
                  }
                  className="stroke-purple-500 transition-all duration-100 ease-linear"
                />
              </svg>
              <div className="text-center">
                <div className="text-3xl font-bold text-white">
                  {secondsRemaining}s
                </div>
                <div className="text-xs text-slate-500">remaining</div>
              </div>
            </div>
            <h3 className="mt-4 text-lg font-semibold text-white">
              Analysing candidate CV
            </h3>
            <p className="mt-1 text-sm text-slate-400">
              This typically takes 15–30 seconds
            </p>
          </div>

          <div className="space-y-3">
            {analysisSteps.map((step, i) => {
              const StepIcon = step.icon;
              const isActive = i === currentStep;
              const isComplete = i < currentStep;
              return (
                <div
                  key={i}
                  className={`flex items-center gap-3 rounded-xl border p-3 transition-all ${
                    isActive
                      ? "border-purple-500/30 bg-purple-500/10"
                      : isComplete
                      ? "border-emerald-500/20 bg-emerald-500/5"
                      : "border-white/5 bg-slate-900/40"
                  }`}
                >
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-lg transition ${
                      isActive
                        ? "bg-purple-500/20 text-purple-400"
                        : isComplete
                        ? "bg-emerald-500/20 text-emerald-400"
                        : "bg-slate-800 text-slate-600"
                    }`}
                  >
                    {isComplete ? (
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={3}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    ) : isActive ? (
                      <StepIcon className="h-4 w-4 animate-pulse" />
                    ) : (
                      <StepIcon className="h-4 w-4" />
                    )}
                  </div>
                  <span
                    className={`text-sm font-medium ${
                      isActive
                        ? "text-white"
                        : isComplete
                        ? "text-emerald-300"
                        : "text-slate-500"
                    }`}
                  >
                    {step.label}
                  </span>
                  {isActive && (
                    <div className="ml-auto flex gap-1">
                      <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-purple-500" />
                      <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-purple-500 [animation-delay:200ms]" />
                      <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-purple-500 [animation-delay:400ms]" />
                    </div>
                  )}
                  {isComplete && (
                    <span className="ml-auto text-xs text-emerald-400">Done</span>
                  )}
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
              <div
                className="h-full rounded-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-100 ease-linear"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* ── Error ── */}
      {error && (
        <div className="flex items-start gap-3 rounded-3xl border border-red-500/20 bg-red-500/5 p-6">
          <AlertCircle className="h-5 w-5 shrink-0 text-red-400 mt-0.5" />
          <div>
            <h3 className="font-semibold text-white">Analysis Failed</h3>
            <p className="mt-1 text-sm text-red-400">{error}</p>
            {error.includes("plan") && (
              <Link
                href="/recruiter-pricing"
                className="mt-3 inline-flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-500 transition"
              >
                View Plans
              </Link>
            )}
          </div>
        </div>
      )}

      {/* ── Analysis Results ── */}
      {analysis && !isAnalyzing && (
        <div className="space-y-6">

          {/* ── Top bar: Candidate info + Hire recommendation ── */}
          <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-8">
            <div className="flex flex-col lg:flex-row gap-8">

              {/* Candidate Info */}
              <div className="flex-1">
                <div className="flex items-start gap-4 mb-6">
                  <div className="w-14 h-14 rounded-2xl bg-purple-500/20 flex items-center justify-center shrink-0">
                    <User className="w-7 h-7 text-purple-400" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">
                      {analysis.candidateName || "Unknown Candidate"}
                    </h2>
                    <p className="text-slate-400 text-sm mt-0.5">
                      {analysis.currentRole || "Role not specified"}
                      {analysis.currentCompany && ` at ${analysis.currentCompany}`}
                    </p>
                  </div>
                </div>

                {/* Contact details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                  {analysis.candidateEmail && (
                    <div className="flex items-center gap-2 text-sm text-slate-300">
                      <Mail className="w-4 h-4 text-slate-500 shrink-0" />
                      {analysis.candidateEmail}
                    </div>
                  )}
                  {analysis.candidatePhone && (
                    <div className="flex items-center gap-2 text-sm text-slate-300">
                      <Phone className="w-4 h-4 text-slate-500 shrink-0" />
                      {analysis.candidatePhone}
                    </div>
                  )}
                  {analysis.candidateLocation && (
                    <div className="flex items-center gap-2 text-sm text-slate-300">
                      <MapPin className="w-4 h-4 text-slate-500 shrink-0" />
                      {analysis.candidateLocation}
                    </div>
                  )}
                  {analysis.totalExperienceYears != null && (
                    <div className="flex items-center gap-2 text-sm text-slate-300">
                      <Briefcase className="w-4 h-4 text-slate-500 shrink-0" />
                      {analysis.totalExperienceYears} years experience
                    </div>
                  )}
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-2">
                  {analysis.experienceLevel && (
                    <span className="px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-xs text-purple-400 font-medium">
                      {analysis.experienceLevel}
                    </span>
                  )}
                  {analysis.industryBackground?.map((ind: string) => (
                    <span
                      key={ind}
                      className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-slate-300"
                    >
                      {ind}
                    </span>
                  ))}
                </div>
              </div>

              {/* Scores */}
              <div className="flex flex-col gap-4 lg:w-64">

                {/* Hire Recommendation */}
                {config && (
                  <div
                    className={`rounded-2xl border ${config.border} ${config.bg} p-5 text-center`}
                  >
                    <p className="text-xs text-slate-400 mb-2 uppercase tracking-wider font-medium">
                      Hire Recommendation
                    </p>
                    <div className={`text-2xl font-bold ${config.color} mb-1`}>
                      {analysis.hiringRecommendation}
                    </div>
                    <p className="text-xs text-slate-500">
                      {analysis.confidenceScore}% confidence
                    </p>
                  </div>
                )}

                {/* ATS Score */}
                <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs text-slate-400 uppercase tracking-wider font-medium">
                      ATS Score
                    </p>
                    <p className="text-2xl font-bold text-white">
                      {analysis.atsScore}
                      <span className="text-sm text-slate-500">/100</span>
                    </p>
                  </div>
                  <div className="h-2 w-full rounded-full bg-white/5">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        analysis.atsScore >= 80
                          ? "bg-emerald-500"
                          : analysis.atsScore >= 60
                          ? "bg-amber-500"
                          : "bg-red-500"
                      }`}
                      style={{ width: `${analysis.atsScore}%` }}
                    />
                  </div>
                </div>

                {/* CV Quality */}
                {analysis.cvQuality && (
                  <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
                    <p className="text-xs text-slate-400 uppercase tracking-wider font-medium mb-3">
                      CV Quality
                    </p>
                    <div className="space-y-1.5 text-xs">
                      {[
                        { label: "Formatting", value: analysis.cvQuality.formatting },
                        { label: "Completeness", value: analysis.cvQuality.completeness },
                        { label: "Clarity", value: analysis.cvQuality.clarity },
                      ].map((q) => (
                        <div key={q.label} className="flex justify-between">
                          <span className="text-slate-500">{q.label}</span>
                          <span className="text-white font-medium">{q.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* AI Summary */}
            {analysis.summary && (
              <div className="mt-6 pt-6 border-t border-white/5">
                <p className="text-xs text-purple-400 font-semibold uppercase tracking-wider mb-2">
                  AI Summary
                </p>
                <p className="text-slate-300 text-sm leading-relaxed">
                  {analysis.summary}
                </p>
              </div>
            )}
          </div>

          {/* ── Skills ── */}
          <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-8">
            <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-purple-400" />
              Skills
            </h3>
            <div className="space-y-5">
              {analysis.topSkills?.length > 0 && (
                <div>
                  <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-3">
                    Top Skills
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {analysis.topSkills.map((skill: string) => (
                      <span
                        key={skill}
                        className="px-3 py-1.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-sm text-purple-300"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {analysis.technicalSkills?.length > 0 && (
                <div>
                  <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-3">
                    Technical
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {analysis.technicalSkills.map((skill: string) => (
                      <span
                        key={skill}
                        className="px-3 py-1.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-sm text-blue-300"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {analysis.softSkills?.length > 0 && (
                <div>
                  <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-3">
                    Soft Skills
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {analysis.softSkills.map((skill: string) => (
                      <span
                        key={skill}
                        className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-sm text-emerald-300"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── Strengths + Red Flags ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Strengths */}
            <div className="rounded-3xl border border-emerald-500/20 bg-emerald-500/5 p-8">
              <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                <Star className="w-5 h-5 text-emerald-400" />
                Strengths
              </h3>
              <div className="space-y-4">
                {(showAllStrengths
                  ? analysis.strengths
                  : analysis.strengths?.slice(0, 3)
                )?.map((s: any, i: number) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0 mt-0.5">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">{s.title}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{s.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
              {analysis.strengths?.length > 3 && (
                <button
                  onClick={() => setShowAllStrengths(!showAllStrengths)}
                  className="mt-4 flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 transition"
                >
                  {showAllStrengths ? (
                    <>
                      <ChevronUp className="w-3 h-3" /> Show less
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-3 h-3" />
                      {analysis.strengths.length - 3} more strengths
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Red Flags */}
            <div className="rounded-3xl border border-red-500/20 bg-red-500/5 p-8">
              <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-400" />
                Red Flags
              </h3>
              {analysis.redFlags?.length === 0 ? (
                <div className="flex items-center gap-3 text-emerald-400">
                  <CheckCircle className="w-5 h-5" />
                  <p className="text-sm">No red flags detected</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {(showAllRedFlags
                    ? analysis.redFlags
                    : analysis.redFlags?.slice(0, 3)
                  )?.map((f: any, i: number) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-red-500/20 flex items-center justify-center shrink-0 mt-0.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white">{f.title}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{f.detail}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {analysis.redFlags?.length > 3 && (
                <button
                  onClick={() => setShowAllRedFlags(!showAllRedFlags)}
                  className="mt-4 flex items-center gap-1 text-xs text-red-400 hover:text-red-300 transition"
                >
                  {showAllRedFlags ? (
                    <>
                      <ChevronUp className="w-3 h-3" /> Show less
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-3 h-3" />
                      {analysis.redFlags.length - 3} more flags
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* ── Key Achievements ── */}
          {analysis.keyAchievements?.length > 0 && (
            <div className="rounded-3xl border border-amber-500/20 bg-amber-500/5 p-8">
              <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-400" />
                Key Achievements
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {analysis.keyAchievements.map((a: string, i: number) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0 mt-0.5">
                      <Star className="w-3.5 h-3.5 text-amber-400" />
                    </div>
                    <p className="text-sm text-slate-300">{a}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Education + Languages + Interview Recommendation ── */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

            {/* Education */}
            {analysis.education && (
              <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-6">
                <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-purple-400" />
                  Education
                </h3>
                <p className="text-white font-medium text-sm">
                  {analysis.education.highestDegree}
                </p>
                {analysis.education.institution && (
                  <p className="text-slate-400 text-xs mt-1">
                    {analysis.education.institution}
                  </p>
                )}
                {analysis.education.graduationYear && (
                  <p className="text-slate-500 text-xs mt-0.5">
                    {analysis.education.graduationYear}
                  </p>
                )}
              </div>
            )}

            {/* Languages */}
            {analysis.languagesSpoken?.length > 0 && (
              <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-6">
                <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                  <Globe className="w-4 h-4 text-blue-400" />
                  Languages
                </h3>
                <div className="flex flex-wrap gap-2">
                  {analysis.languagesSpoken.map((lang: string) => (
                    <span
                      key={lang}
                      className="px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-xs text-blue-300"
                    >
                      {lang}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Salary Expectation */}
            {analysis.salaryExpectation && (
              <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-6">
                <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                  Est. Salary Range
                </h3>
                <p className="text-emerald-400 font-semibold text-sm">
                  {analysis.salaryExpectation}
                </p>
                <p className="text-slate-500 text-xs mt-1">
                  Based on experience level
                </p>
              </div>
            )}
          </div>

          {/* ── Interview Recommendation ── */}
          {analysis.interviewRecommendation && (
            <div className="rounded-3xl border border-purple-500/20 bg-purple-500/5 p-8">
              <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                <Zap className="w-5 h-5 text-purple-400" />
                Interview Recommendation
              </h3>
              <p className="text-slate-300 text-sm leading-relaxed">
                {analysis.interviewRecommendation}
              </p>
            </div>
          )}

          {/* ── Actions ── */}
          <div className="flex flex-wrap gap-4 pt-2 pb-8">
            <Link
              href="/recruiter/candidates"
              className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-6 py-3 text-sm font-semibold text-white hover:bg-purple-500 transition"
            >
              <User className="w-4 h-4" />
              View All Candidates
            </Link>
            <button
              onClick={() => {
                setAnalysis(null);
                setCandidateId(null);
                setError("");
                setUsage(null);
              }}
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-6 py-3 text-sm font-semibold text-white hover:bg-white/10 transition"
            >
              <Upload className="w-4 h-4" />
              Analyse Another CV
            </button>
          </div>
        </div>
      )}
    </div>
  );
}