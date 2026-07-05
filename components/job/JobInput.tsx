"use client";

import { useState } from "react";
import { Briefcase, Loader2, AlertCircle, Sparkles } from "lucide-react";

interface JobInputProps {
  onMatch: (jobDescription: string) => void;
  isMatching?: boolean;
  hasResume: boolean;
}

export default function JobInput({
  onMatch,
  isMatching = false,
  hasResume,
}: JobInputProps) {
  const [jobDescription, setJobDescription] = useState("");
  const [error, setError] = useState("");

  const handleMatch = () => {
    if (!jobDescription.trim()) {
      setError("Please paste a job description");
      return;
    }

    if (jobDescription.trim().length < 50) {
      setError("Job description is too short. Please paste the full posting.");
      return;
    }

    setError("");
    onMatch(jobDescription);
  };

  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-6 backdrop-blur-xl">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-500/10 ring-1 ring-cyan-500/20">
          <Briefcase className="h-5 w-5 text-cyan-400" />
        </div>
        <div>
          <h2 className="font-semibold text-white">Paste Job Description</h2>
          <p className="text-sm text-slate-400">
            Copy the entire job posting for the best analysis
          </p>
        </div>
      </div>

      <textarea
        value={jobDescription}
        onChange={(e) => {
          setJobDescription(e.target.value);
          setError("");
        }}
        disabled={isMatching || !hasResume}
        placeholder="Paste the full job description here...

Include:
- Job title
- Company name
- Location and work type
- Required qualifications
- Responsibilities
- Salary (if mentioned)"
        className="h-80 w-full resize-none rounded-2xl border border-white/10 bg-slate-900/60 p-5 text-sm text-white placeholder-slate-500 outline-none transition focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 disabled:opacity-50"
      />

      <div className="mt-2 flex items-center justify-between text-xs">
        <span className="text-slate-500">
          {jobDescription.length.toLocaleString()} characters
        </span>
        {!hasResume && (
          <span className="text-amber-400">
            ⚠️ Analyze your CV first
          </span>
        )}
      </div>

      {error && (
        <div className="mt-4 flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/10 p-4">
          <AlertCircle className="h-5 w-5 shrink-0 text-red-400" />
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      <button
        onClick={handleMatch}
        disabled={isMatching || !hasResume || jobDescription.trim().length < 50}
        className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 px-5 py-3.5 text-sm font-medium text-white shadow-lg shadow-cyan-700/25 transition hover:from-cyan-500 hover:to-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isMatching ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Analyzing job match...
          </>
        ) : (
          <>
            <Sparkles className="h-4 w-4" />
            Match Against My CV
          </>
        )}
      </button>
    </div>
  );
}