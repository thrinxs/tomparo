"use client";

import {
  CheckCircle2,
  AlertCircle,
  Lightbulb,
  Tag,
  TrendingUp,
  User,
  Mail,
  Phone,
  MapPin,
  Linkedin,
  Zap,
  XCircle,
} from "lucide-react";

interface ResumeAnalysisProps {
  analysis: {
    atsScore: number;
    scoreLabel: string;
    scoreDescription: string;
    strengths: string[];
    weaknesses: string[];
    suggestions: string[];
    keywords: string[];
    missingKeywords: string[];
    sections: {
      hasSummary: boolean;
      hasExperience: boolean;
      hasEducation: boolean;
      hasSkills: boolean;
      hasCertifications: boolean;
      hasContactInfo: boolean;
    };
    contactInfo: {
      name: string;
      email: string;
      phone: string;
      location: string;
      linkedin: string;
    };
    quickWins: string[];
  };
}

export default function ResumeAnalysis({ analysis }: ResumeAnalysisProps) {
  const getScoreColor = (score: number) => {
    if (score >= 85) return "text-emerald-400";
    if (score >= 70) return "text-blue-400";
    if (score >= 50) return "text-amber-400";
    return "text-red-400";
  };

  const getScoreRing = (score: number) => {
    if (score >= 85) return "stroke-emerald-500";
    if (score >= 70) return "stroke-blue-500";
    if (score >= 50) return "stroke-amber-500";
    return "stroke-red-500";
  };

  const circumference = 2 * Math.PI * 70;
  const strokeDashoffset =
    circumference - (analysis.atsScore / 100) * circumference;

  return (
    <div className="mt-8 space-y-6">
      {/* ATS Score Card */}
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
              {/* Background circle */}
              <circle
                cx="96"
                cy="96"
                r="70"
                stroke="rgb(30 41 59)"
                strokeWidth="12"
                fill="none"
              />
              {/* Progress circle */}
              <circle
                cx="96"
                cy="96"
                r="70"
                strokeWidth="12"
                fill="none"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                className={`${getScoreRing(analysis.atsScore)} transition-all duration-1000 ease-out`}
              />
            </svg>
            <div className="text-center">
              <div
                className={`text-5xl font-bold ${getScoreColor(analysis.atsScore)}`}
              >
                {analysis.atsScore}
              </div>
              <div className="mt-1 text-xs uppercase tracking-wider text-slate-500">
                out of 100
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="text-center md:text-left">
            <div className="mb-2 text-xs uppercase tracking-wider text-blue-400">
              ATS Compatibility Score
            </div>
            <h2
              className={`text-3xl font-bold ${getScoreColor(analysis.atsScore)}`}
            >
              {analysis.scoreLabel}
            </h2>
            <p className="mt-3 max-w-md text-slate-400">
              {analysis.scoreDescription}
            </p>
          </div>
        </div>
      </div>

      {/* Contact Info Detected */}
      {analysis.contactInfo.name && (
        <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-6 backdrop-blur-xl">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-slate-400">
            <User className="h-4 w-4" />
            Contact Information Detected
          </h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {analysis.contactInfo.name && (
              <div className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4 shrink-0 text-slate-500" />
                <span className="text-white">{analysis.contactInfo.name}</span>
              </div>
            )}
            {analysis.contactInfo.email && (
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 shrink-0 text-slate-500" />
                <span className="text-slate-300">
                  {analysis.contactInfo.email}
                </span>
              </div>
            )}
            {analysis.contactInfo.phone && (
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 shrink-0 text-slate-500" />
                <span className="text-slate-300">
                  {analysis.contactInfo.phone}
                </span>
              </div>
            )}
            {analysis.contactInfo.location && (
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 shrink-0 text-slate-500" />
                <span className="text-slate-300">
                  {analysis.contactInfo.location}
                </span>
              </div>
            )}
            {analysis.contactInfo.linkedin && (
              <div className="flex items-center gap-2 text-sm">
                <Linkedin className="h-4 w-4 shrink-0 text-slate-500" />
                <span className="text-slate-300">
                  {analysis.contactInfo.linkedin}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Section Coverage */}
      <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-6 backdrop-blur-xl">
        <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-slate-400">
          <TrendingUp className="h-4 w-4" />
          Section Coverage
        </h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-6">
          {Object.entries(analysis.sections).map(([key, present]) => {
            const label = key
              .replace(/^has/, "")
              .replace(/([A-Z])/g, " $1")
              .trim();
            return (
              <div
                key={key}
                className={`flex items-center gap-2 rounded-xl border p-3 ${
                  present
                    ? "border-emerald-500/20 bg-emerald-500/5"
                    : "border-red-500/20 bg-red-500/5"
                }`}
              >
                {present ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                ) : (
                  <XCircle className="h-4 w-4 shrink-0 text-red-400" />
                )}
                <span className="text-xs text-slate-300">{label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick Wins */}
      {analysis.quickWins.length > 0 && (
        <div className="rounded-3xl border border-amber-500/20 bg-gradient-to-br from-amber-500/10 to-orange-500/5 p-6 backdrop-blur-xl">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-amber-400">
            <Zap className="h-4 w-4" />
            Quick Wins (Under 15 mins)
          </h3>
          <div className="space-y-3">
            {analysis.quickWins.map((win, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-500/20 text-xs font-semibold text-amber-400">
                  {i + 1}
                </div>
                <p className="text-sm text-slate-200">{win}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Strengths & Weaknesses Side-by-Side */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Strengths */}
        <div className="rounded-3xl border border-emerald-500/20 bg-emerald-500/5 p-6 backdrop-blur-xl">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-emerald-400">
            <CheckCircle2 className="h-4 w-4" />
            Strengths ({analysis.strengths.length})
          </h3>
          <ul className="space-y-3">
            {analysis.strengths.map((strength, i) => (
              <li key={i} className="flex items-start gap-3 text-sm">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                <span className="text-slate-300">{strength}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Weaknesses */}
        <div className="rounded-3xl border border-red-500/20 bg-red-500/5 p-6 backdrop-blur-xl">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-red-400">
            <AlertCircle className="h-4 w-4" />
            Weaknesses ({analysis.weaknesses.length})
          </h3>
          <ul className="space-y-3">
            {analysis.weaknesses.map((weakness, i) => (
              <li key={i} className="flex items-start gap-3 text-sm">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
                <span className="text-slate-300">{weakness}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* AI Suggestions */}
      <div className="rounded-3xl border border-blue-500/20 bg-blue-500/5 p-6 backdrop-blur-xl">
        <h3 className="mb-5 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-blue-400">
          <Lightbulb className="h-4 w-4" />
          AI Improvement Suggestions
        </h3>
        <div className="space-y-3">
          {analysis.suggestions.map((suggestion, i) => (
            <div
              key={i}
              className="flex items-start gap-4 rounded-2xl border border-white/5 bg-slate-900/40 p-4"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-500/10 text-sm font-semibold text-blue-400 ring-1 ring-blue-500/20">
                {i + 1}
              </div>
              <p className="text-sm text-slate-200">{suggestion}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Keywords Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Keywords Found */}
        <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-6 backdrop-blur-xl">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-slate-400">
            <Tag className="h-4 w-4" />
            Keywords Found ({analysis.keywords.length})
          </h3>
          <div className="flex flex-wrap gap-2">
            {analysis.keywords.map((keyword, i) => (
              <span
                key={i}
                className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-300"
              >
                {keyword}
              </span>
            ))}
          </div>
        </div>

        {/* Missing Keywords */}
        <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-6 backdrop-blur-xl">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-slate-400">
            <AlertCircle className="h-4 w-4" />
            Recommended Keywords ({analysis.missingKeywords.length})
          </h3>
          <div className="flex flex-wrap gap-2">
            {analysis.missingKeywords.map((keyword, i) => (
              <span
                key={i}
                className="rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1.5 text-xs font-medium text-amber-300"
              >
                + {keyword}
              </span>
            ))}
          </div>
          <p className="mt-4 text-xs text-slate-500">
            Adding these keywords could improve your ATS match score.
          </p>
        </div>
      </div>
    </div>
  );
}