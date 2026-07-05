"use client";

import { useState, useEffect } from "react";
import ResumeUploader from "@/components/resume/ResumeUploader";
import ResumeAnalysis from "@/components/resume/ResumeAnalysis";
import {
  Sparkles,
  AlertCircle,
  Search,
  Brain,
  Target,
  Zap,
  TrendingUp,
} from "lucide-react";

export default function ResumePage() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<any>(null);
  const [error, setError] = useState("");
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);

  const analysisSteps = [
    { icon: Search, label: "Reading your CV", duration: 5 },
    { icon: Brain, label: "Extracting contact info & sections", duration: 5 },
    { icon: Target, label: "Analyzing ATS compatibility", duration: 10 },
    { icon: TrendingUp, label: "Identifying strengths & weaknesses", duration: 5 },
    { icon: Zap, label: "Generating improvement suggestions", duration: 5 },
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

  const handleAnalyze = async (text: string) => {
    setIsAnalyzing(true);
    setError("");
    setAnalysis(null);
    setProgress(0);
    setCurrentStep(0);

    try {
      const response = await fetch("/api/resume/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeText: text }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Analysis failed");
      }

      setProgress(100);
      setTimeout(() => {
        setAnalysis(data.analysis);
      }, 500);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Something went wrong";
      setError(message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const secondsRemaining = Math.max(
    0,
    Math.ceil(TOTAL_DURATION - (progress / 100) * TOTAL_DURATION)
  );

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-8">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-xs font-medium text-blue-400">
          <Sparkles className="h-3 w-3" />
          AI-Powered Analysis
        </div>
        <h1 className="text-3xl font-semibold text-white">Resume Analyzer</h1>
        <p className="mt-2 text-slate-400">
          Upload your CV and get instant ATS scoring, keyword analysis, and
          improvement suggestions powered by AI.
        </p>
      </div>

      <ResumeUploader onAnalyze={handleAnalyze} isAnalyzing={isAnalyzing} />

      {/* Loading with Countdown */}
      {isAnalyzing && (
        <div className="mt-8 rounded-3xl border border-blue-500/20 bg-gradient-to-br from-slate-900/80 to-slate-900/40 p-8 backdrop-blur-xl">
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
                  className="stroke-blue-500 transition-all duration-100 ease-linear"
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
              Analyzing your resume
            </h3>
            <p className="mt-1 text-sm text-slate-400">
              This typically takes 15-30 seconds
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
                      ? "border-blue-500/30 bg-blue-500/10"
                      : isComplete
                        ? "border-emerald-500/20 bg-emerald-500/5"
                        : "border-white/5 bg-slate-900/40"
                  }`}
                >
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-lg transition ${
                      isActive
                        ? "bg-blue-500/20 text-blue-400"
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
                      <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-blue-500" />
                      <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-blue-500 [animation-delay:200ms]" />
                      <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-blue-500 [animation-delay:400ms]" />
                    </div>
                  )}
                  {isComplete && (
                    <span className="ml-auto text-xs text-emerald-400">
                      Done
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-6">
            <div className="mb-2 flex items-center justify-between text-xs">
              <span className="text-slate-500">Overall Progress</span>
              <span className="text-blue-400">{Math.round(progress)}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
              <div
                className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-all duration-100 ease-linear"
                style={{ width: `${progress}%` }}
              />
            </div>
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

      {analysis && !isAnalyzing && <ResumeAnalysis analysis={analysis} />}
    </div>
  );
}