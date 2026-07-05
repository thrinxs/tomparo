"use client";

import { useState } from "react";
import { Toaster } from "react-hot-toast";
import ResumeUploader from "@/components/resume/ResumeUploader";
import CoverLetter from "@/components/application/CoverLetter";
import EmailGenerator from "@/components/application/EmailGenerator";
import { Mail, Sparkles, Briefcase } from "lucide-react";

export default function ApplyPage() {
  const [resumeText, setResumeText] = useState("");
  const [jobDescription, setJobDescription] = useState("");

  const isReady = resumeText.length > 100 && jobDescription.length > 50;

  return (
    <div className="mx-auto max-w-5xl">
      <Toaster position="top-right" />

      {/* Header */}
      <div className="mb-8">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-400">
          <Sparkles className="h-3 w-3" />
          AI Application Generator
        </div>
        <h1 className="text-3xl font-semibold text-white">
          Cover Letter & Email
        </h1>
        <p className="mt-2 text-slate-400">
          Generate tailored cover letters and application emails in seconds.
          Ready to copy, paste, and send.
        </p>
      </div>

      {/* Step 1: CV */}
      {!resumeText && (
        <div className="mb-6">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500/10 text-sm font-bold text-blue-400 ring-1 ring-blue-500/20">
              1
            </div>
            <h2 className="text-lg font-semibold text-white">
              Provide Your CV
            </h2>
          </div>
          <ResumeUploader onAnalyze={setResumeText} isAnalyzing={false} />
        </div>
      )}

      {/* CV Ready */}
      {resumeText && (
        <div className="mb-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20">
                ✓
              </div>
              <div>
                <p className="text-sm font-medium text-white">CV Ready</p>
                <p className="text-xs text-slate-400">
                  {resumeText.length.toLocaleString()} characters loaded
                </p>
              </div>
            </div>
            <button
              onClick={() => setResumeText("")}
              className="text-xs text-slate-400 transition hover:text-white"
            >
              Change CV
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Job Description */}
      <div className="mb-6">
        <div className="mb-4 flex items-center gap-3">
          <div
            className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ring-1 ${
              resumeText
                ? "bg-cyan-500/10 text-cyan-400 ring-cyan-500/20"
                : "bg-slate-800 text-slate-500 ring-slate-700"
            }`}
          >
            2
          </div>
          <h2 className="text-lg font-semibold text-white">
            Paste Job Description
          </h2>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-6 backdrop-blur-xl">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-500/10 ring-1 ring-cyan-500/20">
              <Briefcase className="h-5 w-5 text-cyan-400" />
            </div>
            <div>
              <h3 className="font-semibold text-white">Job Description</h3>
              <p className="text-sm text-slate-400">
                The more details, the better the output
              </p>
            </div>
          </div>

          <textarea
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            disabled={!resumeText}
            placeholder="Paste the job description here..."
            className="h-48 w-full resize-none rounded-2xl border border-white/10 bg-slate-900/60 p-5 text-sm text-white placeholder-slate-500 outline-none transition focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 disabled:opacity-50"
          />

          <div className="mt-2 text-xs text-slate-500">
            {jobDescription.length.toLocaleString()} characters
          </div>
        </div>
      </div>

      {/* Step 3: Generate */}
      <div className="mb-6">
        <div className="mb-4 flex items-center gap-3">
          <div
            className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ring-1 ${
              isReady
                ? "bg-amber-500/10 text-amber-400 ring-amber-500/20"
                : "bg-slate-800 text-slate-500 ring-slate-700"
            }`}
          >
            3
          </div>
          <h2 className="text-lg font-semibold text-white">
            Generate Your Application
          </h2>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <CoverLetter
            resumeText={resumeText}
            jobDescription={jobDescription}
            disabled={!isReady}
          />
          <EmailGenerator
            resumeText={resumeText}
            jobDescription={jobDescription}
            disabled={!isReady}
          />
        </div>
      </div>

      {!isReady && (
        <div className="mt-6 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 text-center text-sm text-amber-400">
          💡 Complete steps 1 and 2 to generate your application
        </div>
      )}
    </div>
  );
}