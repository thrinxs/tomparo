"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import toast, { Toaster } from "react-hot-toast";
import LockedFeature from "@/components/dashboard/LockedFeature";
import ResumeUploader from "@/components/resume/ResumeUploader";
import {
  Brain,
  Sparkles,
  AlertCircle,
  TrendingUp,
  Target,
  Award,
  DollarSign,
  Clock,
  Zap,
  Search,
  Loader2,
  CheckCircle2,
  ExternalLink,
  ArrowRight,
  Briefcase,
  BookOpen,
  BarChart3,
  Rocket,
  Shield,
  Star,
} from "lucide-react";

export default function CareerPage() {
  const { data: session } = useSession();
  const isPremium = (session?.user as any)?.isPremium || false;

  const [resumeText, setResumeText] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<any>(null);
  const [error, setError] = useState("");
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    { icon: Search, label: "Analyzing your career profile", duration: 6 },
    { icon: Brain, label: "Determining career level", duration: 6 },
    { icon: Target, label: "Identifying growth opportunities", duration: 8 },
    { icon: TrendingUp, label: "Analyzing market demand", duration: 7 },
    { icon: Rocket, label: "Building action plan", duration: 7 },
  ];

  const TOTAL_DURATION = 34;

  useEffect(() => {
    if (!analyzing) {
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
      for (let i = 0; i < steps.length; i++) {
        accumulatedTime += steps[i].duration;
        if (elapsed < accumulatedTime) {
          setCurrentStep(i);
          break;
        }
      }
    }, 100);

    return () => clearInterval(interval);
  }, [analyzing]);

  if (!isPremium) {
    return (
      <LockedFeature
        feature="Career Intelligence AI"
        description="Get personalized career insights based on your CV. Discover skills to acquire, certifications to pursue, and your next career move."
        icon={Brain}
        color="cyan"
        benefits={[
          "AI analyzes your entire career trajectory",
          "Discover skills you should acquire next",
          "Get certification recommendations",
          "Identify experience gaps holding you back",
          "See your current vs target career level",
          "Understand market demand for your profile",
          "Personalized action plan to next career level",
          "Salary insights based on your skills",
        ]}
      />
    );
  }

  const handleAnalyze = async () => {
    if (!resumeText) {
      setError("Please provide your CV first");
      return;
    }

    setAnalyzing(true);
    setError("");
    setAnalysis(null);

    try {
      const res = await fetch("/api/career/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeText }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Analysis failed");
      }

      setProgress(100);
      setTimeout(() => {
        setAnalysis(data.analysis);
      }, 500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setAnalyzing(false);
    }
  };

  const secondsRemaining = Math.max(
    0,
    Math.ceil(TOTAL_DURATION - (progress / 100) * TOTAL_DURATION)
  );

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-emerald-400";
    if (score >= 60) return "text-cyan-400";
    if (score >= 40) return "text-amber-400";
    return "text-red-400";
  };

  const getPriorityColor = (priority: string) => {
    if (priority === "critical" || priority === "high")
      return "border-red-500/20 bg-red-500/10 text-red-300";
    if (priority === "medium")
      return "border-amber-500/20 bg-amber-500/10 text-amber-300";
    return "border-blue-500/20 bg-blue-500/10 text-blue-300";
  };

  return (
    <div className="mx-auto max-w-6xl">
      <Toaster position="top-right" />

      <div className="mb-8">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 text-xs font-medium text-cyan-400">
          <Sparkles className="h-3 w-3" />
          Career Intelligence AI
        </div>
        <h1 className="text-3xl font-semibold text-white">Career AI</h1>
        <p className="mt-2 text-slate-400">
          Get deep insights into your career trajectory with personalized recommendations for growth.
        </p>
      </div>

      {/* Step 1: CV */}
      {!resumeText && (
        <div className="mb-6">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-cyan-500/10 text-sm font-bold text-cyan-400 ring-1 ring-cyan-500/20">
              1
            </div>
            <h2 className="text-lg font-semibold text-white">Provide Your CV</h2>
          </div>
          <ResumeUploader onAnalyze={setResumeText} isAnalyzing={false} />
        </div>
      )}

      {resumeText && !analysis && !analyzing && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                <span className="text-sm text-white">
                  CV Ready ({resumeText.length.toLocaleString()} characters)
                </span>
              </div>
              <button
                onClick={() => setResumeText("")}
                className="text-xs text-slate-400 hover:text-white"
              >
                Change CV
              </button>
            </div>
          </div>

          <button
            onClick={handleAnalyze}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 px-6 py-4 text-base font-medium text-white shadow-lg shadow-cyan-700/25 transition hover:from-cyan-500 hover:to-blue-500"
          >
            <Brain className="h-5 w-5" />
            Analyze My Career
            <ArrowRight className="h-5 w-5" />
          </button>
        </div>
      )}

      {/* Loading */}
      {analyzing && (
        <div className="mt-8 rounded-3xl border border-cyan-500/20 bg-gradient-to-br from-slate-900/80 to-slate-900/40 p-8 backdrop-blur-xl">
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
                    2 * Math.PI * 56 - (progress / 100) * (2 * Math.PI * 56)
                  }
                  className="stroke-cyan-500 transition-all duration-100 ease-linear"
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
              Analyzing your career
            </h3>
            <p className="mt-1 text-sm text-slate-400">
              Deep analysis takes about {TOTAL_DURATION} seconds
            </p>
          </div>

          <div className="space-y-3">
            {steps.map((step, i) => {
              const StepIcon = step.icon;
              const isActive = i === currentStep;
              const isComplete = i < currentStep;

              return (
                <div
                  key={i}
                  className={`flex items-center gap-3 rounded-xl border p-3 transition-all ${
                    isActive
                      ? "border-cyan-500/30 bg-cyan-500/10"
                      : isComplete
                        ? "border-emerald-500/20 bg-emerald-500/5"
                        : "border-white/5 bg-slate-900/40"
                  }`}
                >
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-lg transition ${
                      isActive
                        ? "bg-cyan-500/20 text-cyan-400"
                        : isComplete
                          ? "bg-emerald-500/20 text-emerald-400"
                          : "bg-slate-800 text-slate-600"
                    }`}
                  >
                    {isComplete ? (
                      <CheckCircle2 className="h-4 w-4" />
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
                </div>
              );
            })}
          </div>
        </div>
      )}

      {error && (
        <div className="mt-8 flex items-start gap-3 rounded-3xl border border-red-500/20 bg-red-500/5 p-6">
          <AlertCircle className="h-5 w-5 shrink-0 text-red-400" />
          <div>
            <h3 className="font-semibold text-white">Analysis Failed</h3>
            <p className="mt-1 text-sm text-red-400">{error}</p>
          </div>
        </div>
      )}

      {/* Results */}
      {analysis && !analyzing && (
        <div className="mt-8 space-y-6">
          {/* Career Level Card */}
          <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900/80 to-slate-900/40 p-8 backdrop-blur-xl">
            <div className="flex flex-col items-center gap-6 md:flex-row md:justify-around">
              <div className="relative flex h-40 w-40 items-center justify-center">
                <svg className="absolute -rotate-90" width="160" height="160" viewBox="0 0 160 160">
                  <circle cx="80" cy="80" r="60" stroke="rgb(30 41 59)" strokeWidth="10" fill="none" />
                  <circle
                    cx="80"
                    cy="80"
                    r="60"
                    strokeWidth="10"
                    fill="none"
                    strokeLinecap="round"
                    strokeDasharray={2 * Math.PI * 60}
                    strokeDashoffset={2 * Math.PI * 60 - (analysis.overallReadiness / 100) * (2 * Math.PI * 60)}
                    className={
                      analysis.overallReadiness >= 80
                        ? "stroke-emerald-500"
                        : analysis.overallReadiness >= 60
                          ? "stroke-cyan-500"
                          : analysis.overallReadiness >= 40
                            ? "stroke-amber-500"
                            : "stroke-red-500"
                    }
                  />
                </svg>
                <div className="text-center">
                  <div className={`text-4xl font-bold ${getScoreColor(analysis.overallReadiness)}`}>
                    {analysis.overallReadiness}
                  </div>
                  <div className="text-xs uppercase text-slate-500">Career Readiness</div>
                </div>
              </div>

              <div className="text-center md:text-left">
                <div className="text-xs uppercase tracking-wider text-cyan-400">Career Path</div>
                <div className="mt-2">
                  <div className="text-sm text-slate-500">Current Level</div>
                  <div className="text-xl font-bold text-white">{analysis.currentLevel}</div>
                  <div className="mt-1 text-xs text-slate-400">
                    {analysis.currentLevelDescription}
                  </div>
                </div>
                <div className="my-3 flex items-center justify-center gap-2 text-slate-600 md:justify-start">
                  <div className="h-px w-8 bg-slate-700" />
                  <TrendingUp className="h-4 w-4" />
                  <div className="h-px w-8 bg-slate-700" />
                </div>
                <div>
                  <div className="text-sm text-slate-500">Target Level</div>
                  <div className="text-xl font-bold text-cyan-400">{analysis.targetLevel}</div>
                  <div className="mt-1 text-xs text-slate-400">
                    {analysis.targetLevelDescription}
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-300">
                    <Clock className="mr-1 inline h-3 w-3" />
                    {analysis.estimatedTimeToTarget}
                  </span>
                  <span className="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-300">
                    <Briefcase className="mr-1 inline h-3 w-3" />
                    {analysis.yearsOfExperience}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Salary Insights */}
          <div className="rounded-3xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 to-green-500/5 p-6">
            <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-emerald-400">
              <DollarSign className="h-5 w-5" />
              Salary Insights
            </h3>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4">
                <div className="text-xs text-slate-500">Current Range</div>
                <div className="mt-2 text-lg font-bold text-white">
                  {analysis.salaryInsights.currentRange}
                </div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4">
                <div className="text-xs text-slate-500">Target Range</div>
                <div className="mt-2 text-lg font-bold text-cyan-400">
                  {analysis.salaryInsights.targetRange}
                </div>
              </div>
              <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4">
                <div className="text-xs text-emerald-400">Potential Increase</div>
                <div className="mt-2 text-lg font-bold text-emerald-300">
                  {analysis.salaryInsights.potentialIncrease}
                </div>
              </div>
            </div>
            <div className="mt-4">
              <div className="text-xs uppercase tracking-wider text-emerald-400">
                Salary Growth Factors
              </div>
              <ul className="mt-2 space-y-1">
                {analysis.salaryInsights.factors.map((factor: string, i: number) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                    <span className="text-emerald-400">→</span>
                    {factor}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Market Demand */}
          <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-6">
            <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
              <BarChart3 className="h-5 w-5 text-blue-400" />
              Market Demand
            </h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm text-slate-400">Demand Level</span>
                  <span className={`text-2xl font-bold ${getScoreColor(analysis.marketDemand.demandScore)}`}>
                    {analysis.marketDemand.demandScore}/100
                  </span>
                </div>
                <div className="h-3 w-full overflow-hidden rounded-full bg-slate-800">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-all"
                    style={{ width: `${analysis.marketDemand.demandScore}%` }}
                  />
                </div>
                <div className="mt-2 text-sm font-medium text-cyan-400">
                  {analysis.marketDemand.demandLevel}
                </div>
              </div>

              <div>
                <div className="mb-2 text-xs uppercase tracking-wider text-slate-500">
                  Trending Skills
                </div>
                <div className="flex flex-wrap gap-2">
                  {analysis.marketDemand.trending.map((skill: string, i: number) => (
                    <span
                      key={i}
                      className="rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-xs text-blue-300"
                    >
                      📈 {skill}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <p className="mt-4 rounded-xl border border-white/10 bg-slate-900/40 p-4 text-sm text-slate-300">
              💡 {analysis.marketDemand.outlook}
            </p>
          </div>

          {/* Skills to Acquire */}
          <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-6">
            <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
              <Zap className="h-5 w-5 text-amber-400" />
              Skills to Acquire ({analysis.skillsToAcquire.length})
            </h3>
            <div className="space-y-3">
              {analysis.skillsToAcquire.map((skill: any, i: number) => (
                <div
                  key={i}
                  className="rounded-2xl border border-white/10 bg-slate-900/40 p-5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="font-medium text-white">{skill.skill}</h4>
                        <span className={`rounded-full border px-2 py-0.5 text-xs ${getPriorityColor(skill.priority)}`}>
                          {skill.priority}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-slate-300">{skill.reason}</p>
                      <div className="mt-3 flex flex-wrap gap-4 text-xs text-slate-400">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {skill.timeToLearn}
                        </span>
                        <span className="text-emerald-400">
                          🚀 {skill.impactOnCareer}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Certifications */}
          <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-6">
            <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
              <Award className="h-5 w-5 text-purple-400" />
              Certifications to Pursue ({analysis.certificationsToPursue.length})
            </h3>
            <div className="grid gap-3 md:grid-cols-2">
              {analysis.certificationsToPursue.map((cert: any, i: number) => (
                <a
                  key={i}
                  href={cert.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group rounded-2xl border border-purple-500/20 bg-purple-500/5 p-5 transition hover:bg-purple-500/10"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="font-medium text-white">{cert.name}</h4>
                        <span className={`rounded-full border px-2 py-0.5 text-xs ${getPriorityColor(cert.priority)}`}>
                          {cert.priority}
                        </span>
                      </div>
                      <div className="mt-2 space-y-1 text-xs text-slate-400">
                        <div>Provider: {cert.provider}</div>
                        <div>Duration: {cert.duration}</div>
                        <div className="font-semibold text-purple-300">Cost: {cert.cost}</div>
                      </div>
                      <p className="mt-2 text-sm text-purple-200">💡 {cert.value}</p>
                    </div>
                    <ExternalLink className="h-4 w-4 shrink-0 text-slate-500 group-hover:text-purple-400" />
                  </div>
                </a>
              ))}
            </div>
          </div>

          {/* Experience Gaps */}
          <div className="rounded-3xl border border-amber-500/20 bg-amber-500/5 p-6">
            <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-amber-400">
              <AlertCircle className="h-5 w-5" />
              Experience Gaps to Fill
            </h3>
            <div className="space-y-3">
              {analysis.experienceGaps.map((gap: any, i: number) => (
                <div
                  key={i}
                  className="rounded-2xl border border-white/10 bg-slate-900/40 p-4"
                >
                  <div className="flex items-start gap-3">
                    <div className={`mt-1 h-2 w-2 shrink-0 rounded-full ${
                      gap.urgency === "high"
                        ? "bg-red-500"
                        : gap.urgency === "medium"
                          ? "bg-amber-500"
                          : "bg-blue-500"
                    }`} />
                    <div className="flex-1">
                      <div className="font-medium text-white">{gap.gap}</div>
                      <p className="mt-1 text-sm text-slate-400">💡 {gap.howToFill}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Strengths */}
          <div className="rounded-3xl border border-emerald-500/20 bg-emerald-500/5 p-6">
            <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-emerald-400">
              <Star className="h-5 w-5" />
              Strengths to Leverage
            </h3>
            <div className="grid gap-2 md:grid-cols-2">
              {analysis.strengthsToLeverage.map((strength: string, i: number) => (
                <div
                  key={i}
                  className="flex items-center gap-2 rounded-xl border border-white/10 bg-slate-900/40 p-3"
                >
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  <span className="text-sm text-slate-200">{strength}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Action Plan */}
          <div className="rounded-3xl border border-cyan-500/20 bg-gradient-to-br from-cyan-500/10 to-blue-500/5 p-6">
            <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-cyan-400">
              <Rocket className="h-5 w-5" />
              Your Action Plan
            </h3>
            <div className="space-y-4">
              {analysis.actionPlan.map((phase: any, i: number) => (
                <div key={i} className="rounded-2xl border border-white/10 bg-slate-900/60 p-5">
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-cyan-500/20 text-sm font-bold text-cyan-400 ring-1 ring-cyan-500/30">
                      {i + 1}
                    </div>
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <h4 className="font-semibold text-white">{phase.phase}</h4>
                        <span className="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-400">
                          {phase.timeframe}
                        </span>
                      </div>
                      <ul className="mt-3 space-y-2">
                        {phase.actions.map((action: string, j: number) => (
                          <li key={j} className="flex items-start gap-2 text-sm text-slate-300">
                            <ArrowRight className="mt-0.5 h-3 w-3 shrink-0 text-cyan-400" />
                            {action}
                          </li>
                        ))}
                      </ul>
                      <div className="mt-3 rounded-lg bg-emerald-500/10 px-3 py-2 text-xs text-emerald-300">
                        🎯 Outcome: {phase.outcome}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Risks & Opportunities */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-3xl border border-red-500/20 bg-red-500/5 p-6">
              <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-red-400">
                <Shield className="h-5 w-5" />
                Career Risks
              </h3>
              <ul className="space-y-2">
                {analysis.careerRisks.map((risk: string, i: number) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                    <span className="text-red-400">⚠️</span>
                    {risk}
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-3xl border border-emerald-500/20 bg-emerald-500/5 p-6">
              <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-emerald-400">
                <Rocket className="h-5 w-5" />
                Opportunities
              </h3>
              <ul className="space-y-2">
                {analysis.careerOpportunities.map((opp: string, i: number) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                    <span className="text-emerald-400">✨</span>
                    {opp}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}