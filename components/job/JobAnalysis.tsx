"use client";

import {
  Building2,
  MapPin,
  Briefcase,
  DollarSign,
  Wifi,
  GraduationCap,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Lightbulb,
  ThumbsUp,
  ThumbsDown,
  Target,
  MessageSquare,
  Tag,
  TrendingUp,
} from "lucide-react";

interface JobAnalysisProps {
  matchResult: {
    matchScore: number;
    matchLabel: string;
    overallAssessment: string;
    jobDetails: {
      title: string;
      company: string;
      location: string;
      employmentType: string;
      experienceLevel: string;
      salaryRange: string;
      remoteType: string;
    };
    matchedSkills: string[];
    missingSkills: Array<{
      skill: string;
      importance: string;
      matchImprovement: number;
    }>;
    matchedRequirements: string[];
    missingRequirements: string[];
    experienceMatch: {
      hasEnoughExperience: boolean;
      description: string;
    };
    educationMatch: {
      meetsRequirements: boolean;
      description: string;
    };
    applicationAdvice: {
      shouldApply: boolean;
      reasoning: string;
      keyPoints: string[];
      redFlags: string[];
      strengths: string[];
    };
    interviewFocus: string[];
    keywordsToInclude: string[];
    cvTweaks: string[];
  };
}

export default function JobAnalysis({ matchResult }: JobAnalysisProps) {
  const getScoreColor = (score: number) => {
    if (score >= 85) return "text-emerald-400";
    if (score >= 70) return "text-cyan-400";
    if (score >= 50) return "text-amber-400";
    return "text-red-400";
  };

  const getScoreRing = (score: number) => {
    if (score >= 85) return "stroke-emerald-500";
    if (score >= 70) return "stroke-cyan-500";
    if (score >= 50) return "stroke-amber-500";
    return "stroke-red-500";
  };

  const getImportanceColor = (importance: string) => {
    if (importance === "critical")
      return "border-red-500/20 bg-red-500/10 text-red-300";
    if (importance === "important")
      return "border-amber-500/20 bg-amber-500/10 text-amber-300";
    return "border-blue-500/20 bg-blue-500/10 text-blue-300";
  };

  const circumference = 2 * Math.PI * 70;
  const strokeDashoffset =
    circumference - (matchResult.matchScore / 100) * circumference;

  return (
    <div className="mt-8 space-y-6">
      {/* Match Score Card */}
      <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900/80 to-slate-900/40 p-8 backdrop-blur-xl">
        <div className="flex flex-col items-center gap-6 md:flex-row md:justify-around">
          {/* Circular Score */}
          <div className="relative flex h-48 w-48 items-center justify-center">
            <svg
              className="absolute -rotate-90"
              width="192"
              height="192"
              viewBox="0 0 192 192"
            >
              <circle
                cx="96"
                cy="96"
                r="70"
                stroke="rgb(30 41 59)"
                strokeWidth="12"
                fill="none"
              />
              <circle
                cx="96"
                cy="96"
                r="70"
                strokeWidth="12"
                fill="none"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                className={`${getScoreRing(matchResult.matchScore)} transition-all duration-1000 ease-out`}
              />
            </svg>
            <div className="text-center">
              <div
                className={`text-5xl font-bold ${getScoreColor(matchResult.matchScore)}`}
              >
                {matchResult.matchScore}%
              </div>
              <div className="mt-1 text-xs uppercase tracking-wider text-slate-500">
                Match Score
              </div>
            </div>
          </div>

          <div className="text-center md:text-left">
            <div className="mb-2 text-xs uppercase tracking-wider text-cyan-400">
              Job Compatibility
            </div>
            <h2
              className={`text-3xl font-bold ${getScoreColor(matchResult.matchScore)}`}
            >
              {matchResult.matchLabel}
            </h2>
            <p className="mt-3 max-w-md text-slate-400">
              {matchResult.overallAssessment}
            </p>
          </div>
        </div>
      </div>

      {/* Job Details Card */}
      <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-6 backdrop-blur-xl">
        <h3 className="mb-5 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-slate-400">
          <Briefcase className="h-4 w-4" />
          Job Details
        </h3>

        <div className="mb-4">
          <h2 className="text-xl font-bold text-white">
            {matchResult.jobDetails.title}
          </h2>
          <p className="mt-1 text-sm text-cyan-400">
            {matchResult.jobDetails.company}
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {matchResult.jobDetails.location && (
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4 shrink-0 text-slate-500" />
              <span className="text-slate-300">
                {matchResult.jobDetails.location}
              </span>
            </div>
          )}
          {matchResult.jobDetails.employmentType && (
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 shrink-0 text-slate-500" />
              <span className="text-slate-300">
                {matchResult.jobDetails.employmentType}
              </span>
            </div>
          )}
          {matchResult.jobDetails.experienceLevel && (
            <div className="flex items-center gap-2 text-sm">
              <TrendingUp className="h-4 w-4 shrink-0 text-slate-500" />
              <span className="text-slate-300">
                {matchResult.jobDetails.experienceLevel} Level
              </span>
            </div>
          )}
          {matchResult.jobDetails.remoteType && (
            <div className="flex items-center gap-2 text-sm">
              <Wifi className="h-4 w-4 shrink-0 text-slate-500" />
              <span className="text-slate-300">
                {matchResult.jobDetails.remoteType}
              </span>
            </div>
          )}
          {matchResult.jobDetails.salaryRange &&
            matchResult.jobDetails.salaryRange !== "Not specified" && (
              <div className="flex items-center gap-2 text-sm">
                <DollarSign className="h-4 w-4 shrink-0 text-slate-500" />
                <span className="text-slate-300">
                  {matchResult.jobDetails.salaryRange}
                </span>
              </div>
            )}
        </div>
      </div>

      {/* Should You Apply? */}
      <div
        className={`rounded-3xl border p-6 backdrop-blur-xl ${
          matchResult.applicationAdvice.shouldApply
            ? "border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 to-emerald-500/5"
            : "border-amber-500/20 bg-gradient-to-br from-amber-500/10 to-amber-500/5"
        }`}
      >
        <div className="mb-4 flex items-center gap-3">
          {matchResult.applicationAdvice.shouldApply ? (
            <ThumbsUp className="h-6 w-6 text-emerald-400" />
          ) : (
            <ThumbsDown className="h-6 w-6 text-amber-400" />
          )}
          <div>
            <h3 className="text-lg font-bold text-white">
              {matchResult.applicationAdvice.shouldApply
                ? "You Should Apply! 🚀"
                : "Consider Carefully"}
            </h3>
            <p className="text-sm text-slate-400">
              {matchResult.applicationAdvice.reasoning}
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {matchResult.applicationAdvice.strengths.length > 0 && (
            <div>
              <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-emerald-400">
                💪 Your Strengths
              </h4>
              <ul className="space-y-1.5">
                {matchResult.applicationAdvice.strengths.map((s, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-sm text-slate-300"
                  >
                    <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" />
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {matchResult.applicationAdvice.redFlags.length > 0 && (
            <div>
              <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-red-400">
                ⚠️ Red Flags
              </h4>
              <ul className="space-y-1.5">
                {matchResult.applicationAdvice.redFlags.map((r, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-sm text-slate-300"
                  >
                    <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-400" />
                    {r}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {matchResult.applicationAdvice.keyPoints.length > 0 && (
          <div className="mt-4">
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-blue-400">
              🎯 Key Points to Emphasize
            </h4>
            <ul className="space-y-1.5">
              {matchResult.applicationAdvice.keyPoints.map((p, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2 text-sm text-slate-300"
                >
                  <span className="mt-0.5 text-blue-400">→</span>
                  {p}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Experience & Education Match */}
      <div className="grid gap-6 md:grid-cols-2">
        <div
          className={`rounded-3xl border p-6 backdrop-blur-xl ${
            matchResult.experienceMatch.hasEnoughExperience
              ? "border-emerald-500/20 bg-emerald-500/5"
              : "border-amber-500/20 bg-amber-500/5"
          }`}
        >
          <div className="mb-3 flex items-center gap-2">
            <TrendingUp
              className={`h-5 w-5 ${
                matchResult.experienceMatch.hasEnoughExperience
                  ? "text-emerald-400"
                  : "text-amber-400"
              }`}
            />
            <h3 className="font-semibold text-white">Experience Match</h3>
          </div>
          <p className="text-sm text-slate-300">
            {matchResult.experienceMatch.description}
          </p>
        </div>

        <div
          className={`rounded-3xl border p-6 backdrop-blur-xl ${
            matchResult.educationMatch.meetsRequirements
              ? "border-emerald-500/20 bg-emerald-500/5"
              : "border-amber-500/20 bg-amber-500/5"
          }`}
        >
          <div className="mb-3 flex items-center gap-2">
            <GraduationCap
              className={`h-5 w-5 ${
                matchResult.educationMatch.meetsRequirements
                  ? "text-emerald-400"
                  : "text-amber-400"
              }`}
            />
            <h3 className="font-semibold text-white">Education Match</h3>
          </div>
          <p className="text-sm text-slate-300">
            {matchResult.educationMatch.description}
          </p>
        </div>
      </div>

      {/* Skills Match */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Matched Skills */}
        <div className="rounded-3xl border border-emerald-500/20 bg-emerald-500/5 p-6 backdrop-blur-xl">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-emerald-400">
            <CheckCircle2 className="h-4 w-4" />
            Skills You Have ({matchResult.matchedSkills.length})
          </h3>
          <div className="flex flex-wrap gap-2">
            {matchResult.matchedSkills.map((skill, i) => (
              <span
                key={i}
                className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-300"
              >
                ✓ {skill}
              </span>
            ))}
          </div>
        </div>

        {/* Missing Skills */}
        <div className="rounded-3xl border border-red-500/20 bg-red-500/5 p-6 backdrop-blur-xl">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-red-400">
            <XCircle className="h-4 w-4" />
            Skills You're Missing ({matchResult.missingSkills.length})
          </h3>
          <div className="space-y-2">
            {matchResult.missingSkills.map((skill, i) => (
              <div
                key={i}
                className={`flex items-center justify-between rounded-xl border p-3 ${getImportanceColor(
                  skill.importance
                )}`}
              >
                <div>
                  <span className="font-medium">{skill.skill}</span>
                  <span className="ml-2 text-xs opacity-75">
                    ({skill.importance})
                  </span>
                </div>
                <span className="text-xs font-semibold">
                  +{skill.matchImprovement}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Requirements Comparison */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-6 backdrop-blur-xl">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-emerald-400">
            <CheckCircle2 className="h-4 w-4" />
            Requirements You Meet
          </h3>
          <ul className="space-y-2">
            {matchResult.matchedRequirements.map((req, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                <span className="text-slate-300">{req}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-6 backdrop-blur-xl">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-red-400">
            <XCircle className="h-4 w-4" />
            Requirements You Don't Meet
          </h3>
          <ul className="space-y-2">
            {matchResult.missingRequirements.map((req, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
                <span className="text-slate-300">{req}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Interview Focus */}
      {matchResult.interviewFocus.length > 0 && (
        <div className="rounded-3xl border border-blue-500/20 bg-blue-500/5 p-6 backdrop-blur-xl">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-blue-400">
            <MessageSquare className="h-4 w-4" />
            Interview Focus Areas
          </h3>
          <div className="space-y-3">
            {matchResult.interviewFocus.map((topic, i) => (
              <div
                key={i}
                className="flex items-start gap-3 rounded-xl border border-white/5 bg-slate-900/40 p-4"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-500/10 text-sm font-semibold text-blue-400 ring-1 ring-blue-500/20">
                  {i + 1}
                </div>
                <p className="text-sm text-slate-200">{topic}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CV Improvements */}
      <div className="rounded-3xl border border-amber-500/20 bg-gradient-to-br from-amber-500/10 to-orange-500/5 p-6 backdrop-blur-xl">
        <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-amber-400">
          <Lightbulb className="h-4 w-4" />
          CV Tweaks for This Job
        </h3>
        <ul className="space-y-3">
          {matchResult.cvTweaks.map((tweak, i) => (
            <li key={i} className="flex items-start gap-3 text-sm">
              <span className="mt-0.5 text-amber-400">→</span>
              <span className="text-slate-200">{tweak}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Keywords to Include */}
      <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-6 backdrop-blur-xl">
        <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-slate-400">
          <Tag className="h-4 w-4" />
          Add These Keywords to Your CV
        </h3>
        <div className="flex flex-wrap gap-2">
          {matchResult.keywordsToInclude.map((keyword, i) => (
            <span
              key={i}
              className="rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1.5 text-xs font-medium text-cyan-300"
            >
              + {keyword}
            </span>
          ))}
        </div>
        <p className="mt-4 text-xs text-slate-500">
          Including these keywords will help your CV pass ATS filters for this
          specific role.
        </p>
      </div>
    </div>
  );
}