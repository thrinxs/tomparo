"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Building2, MapPin, Briefcase, Calendar, ArrowLeft,
  Upload, User, Mail, Phone, FileText, Send, Loader2,
  CheckCircle, AlertTriangle, XCircle, Star, Zap,
  ChevronRight, Globe, Check, X, Sparkles,
} from "lucide-react";

const typeLabels: Record<string, string> = {
  FULL_TIME: "Full Time",
  PART_TIME: "Part Time",
  CONTRACT: "Contract",
  REMOTE: "Remote",
  HYBRID: "Hybrid",
};

type Step = "details" | "upload" | "preview" | "form" | "success";

export default function JobApplyPage() {
  const params = useParams();
  const companySlug = params.companySlug as string;
  const jobSlug = params.jobSlug as string;

  const [company, setCompany] = useState<any>(null);
  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [step, setStep] = useState<Step>("details");

  // CV upload
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [analysing, setAnalysing] = useState(false);
  const [preview, setPreview] = useState<any>(null);
  const [previewError, setPreviewError] = useState("");

  // Application form
  const [candidateName, setCandidateName] = useState("");
  const [candidateEmail, setCandidateEmail] = useState("");
  const [candidatePhone, setCandidatePhone] = useState("");
  const [coverLetter, setCoverLetter] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  // ── Fetch job ──
  useEffect(() => {
    const fetchJob = async () => {
      try {
        const res = await fetch(`/api/jobs/${companySlug}/${jobSlug}`);
        if (!res.ok) { setNotFound(true); return; }
        const data = await res.json();
        setCompany(data.company);
        setJob(data.job);
        // Pre-fill name from preview if available
        if (preview?.candidateName) setCandidateName(preview.candidateName);
      } catch {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };
    fetchJob();
  }, [companySlug, jobSlug]);

  // ── Upload + analyse CV ──
  const handleCVUpload = async (file: File) => {
    setCvFile(file);
    setAnalysing(true);
    setPreviewError("");
    setPreview(null);

    try {
      const formData = new FormData();
      formData.append("cv", file);

      const res = await fetch(`/api/jobs/${companySlug}/${jobSlug}/preview`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        setPreviewError(data.error || "Failed to analyse CV");
        setStep("upload");
        return;
      }

      setPreview(data.preview);
      if (data.preview?.candidateName) {
        setCandidateName(data.preview.candidateName);
      }
      setStep("preview");
    } catch {
      setPreviewError("Failed to analyse CV. You can still apply.");
      setStep("upload");
    } finally {
      setAnalysing(false);
    }
  };

  // ── Submit application ──
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!candidateName || !candidateEmail) {
      setSubmitError("Name and email are required");
      return;
    }

    setSubmitting(true);
    setSubmitError("");

    try {
      const formData = new FormData();
      formData.append("candidateName", candidateName);
      formData.append("candidateEmail", candidateEmail);
      formData.append("candidatePhone", candidatePhone);
      formData.append("coverLetter", coverLetter);
      if (cvFile) formData.append("cv", cvFile);

      const res = await fetch(`/api/jobs/${companySlug}/${jobSlug}/apply`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        setSubmitError(data.error || "Failed to submit application");
        return;
      }

      setStep("success");
    } catch {
      setSubmitError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const getMatchColor = (score: number) => {
    if (score >= 85) return "text-emerald-400";
    if (score >= 65) return "text-blue-400";
    if (score >= 45) return "text-amber-400";
    return "text-red-400";
  };

  const getMatchBg = (score: number) => {
    if (score >= 85) return "from-emerald-500/20 to-teal-500/10 border-emerald-500/30";
    if (score >= 65) return "from-blue-500/20 to-cyan-500/10 border-blue-500/30";
    if (score >= 45) return "from-amber-500/20 to-orange-500/10 border-amber-500/30";
    return "from-red-500/20 to-rose-500/10 border-red-500/30";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center text-center px-4">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">Job Not Found</h1>
          <p className="text-slate-400 mb-6">
            This job may have been closed or doesn&apos;t exist.
          </p>
          <Link href="/" className="text-purple-400 hover:text-purple-300 transition">
            Go to TomParo
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">

      {/* Top bar */}
      <div className="border-b border-white/5 bg-slate-950/80 backdrop-blur-xl sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <Link
            href={`/jobs/${companySlug}`}
            className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition"
          >
            <ArrowLeft className="w-4 h-4" />
            {company?.name}
          </Link>
          <p className="text-xs text-slate-500">
            Powered by{" "}
            <Link href="/" className="text-purple-400 hover:text-purple-300 transition">
              TomParo
            </Link>
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-10 space-y-8">

        {/* Job header */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-8">
          <div className="flex items-start gap-4 mb-5">
            <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center shrink-0">
              <Building2 className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">{job?.title}</h1>
              <p className="text-slate-400 text-sm mt-0.5">{company?.name}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 text-sm text-slate-400 mb-5">
            {job?.location && (
              <span className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4" />{job.location}
              </span>
            )}
            <span className="flex items-center gap-1.5">
              <Briefcase className="w-4 h-4" />
              {typeLabels[job?.type] || job?.type}
            </span>
            {job?.salaryMin && job?.salaryMax && (
              <span className="text-emerald-400">
                ₦{job.salaryMin.toLocaleString()} – ₦{job.salaryMax.toLocaleString()}/mo
              </span>
            )}
            {job?.deadline && (
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                Closes {new Date(job.deadline).toLocaleDateString("en-NG", {
                  day: "numeric", month: "short", year: "numeric",
                })}
              </span>
            )}
          </div>

          {/* Description */}
          {job?.description && (
            <div className="prose prose-invert prose-sm max-w-none">
              <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-line">
                {job.description}
              </p>
            </div>
          )}

          {/* Requirements */}
          {job?.requirements && (
            <div className="mt-5 pt-5 border-t border-white/5">
              <p className="text-xs font-semibold text-white uppercase tracking-wider mb-3">
                Requirements
              </p>
              <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-line">
                {job.requirements}
              </p>
            </div>
          )}
        </div>

        {/* ── Step: Details (Apply CTA) ── */}
        {step === "details" && (
          <div className="rounded-2xl border border-purple-500/20 bg-purple-500/5 p-8 text-center">
            <div className="w-14 h-14 rounded-2xl bg-purple-500/20 flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-7 h-7 text-purple-400" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">
              Apply with AI-Powered Matching
            </h2>
            <p className="text-slate-400 text-sm mb-6 max-w-md mx-auto">
              Upload your CV and our AI will instantly tell you how well you
              match this role — before you even apply.
            </p>
            <button
              onClick={() => setStep("upload")}
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold hover:opacity-90 transition"
            >
              <Zap className="w-5 h-5" />
              Apply Now
            </button>
          </div>
        )}

        {/* ── Step: Upload CV ── */}
        {step === "upload" && (
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-8 space-y-5">
            <div>
              <h2 className="text-lg font-semibold text-white mb-1">
                Upload Your CV
              </h2>
              <p className="text-slate-400 text-sm">
                Our AI will analyse your CV and show you your match score for this role
              </p>
            </div>

            {/* Drop zone */}
            <label className={`flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-12 text-center cursor-pointer transition ${
              analysing
                ? "border-purple-500/50 bg-purple-500/5"
                : "border-white/10 hover:border-purple-500/30 hover:bg-purple-500/5"
            }`}>
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                className="hidden"
                disabled={analysing}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleCVUpload(file);
                }}
              />
              {analysing ? (
                <div className="space-y-3">
                  <Loader2 className="w-10 h-10 text-purple-400 animate-spin mx-auto" />
                  <p className="text-white font-medium">Analysing your CV...</p>
                  <p className="text-slate-400 text-sm">
                    AI is calculating your match score for this role
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center mx-auto">
                    <Upload className="w-7 h-7 text-slate-400" />
                  </div>
                  <div>
                    <p className="text-white font-medium">
                      Drop your CV here or <span className="text-purple-400">browse</span>
                    </p>
                    <p className="text-slate-500 text-sm mt-1">PDF, DOC or DOCX</p>
                  </div>
                </div>
              )}
            </label>

            {previewError && (
              <div className="rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-400">
                {previewError}
              </div>
            )}

            <div className="flex items-center justify-between">
              <button
                onClick={() => setStep("details")}
                className="text-sm text-slate-400 hover:text-white transition"
              >
                ← Back
              </button>
              <button
                onClick={() => setStep("form")}
                className="text-sm text-slate-400 hover:text-white transition"
              >
                Skip → Apply without CV match
              </button>
            </div>
          </div>
        )}

        {/* ── Step: Preview / Match Score ── */}
        {step === "preview" && preview && (
          <div className="space-y-6">

            {/* Match score hero */}
            <div className={`rounded-2xl border bg-gradient-to-br ${getMatchBg(preview.matchScore)} p-8 text-center`}>
              <p className="text-sm text-slate-400 uppercase tracking-wider font-medium mb-2">
                Your Match Score
              </p>
              <div className={`text-6xl font-bold ${getMatchColor(preview.matchScore)} mb-2`}>
                {preview.matchScore}%
              </div>
              <p className={`text-lg font-semibold ${getMatchColor(preview.matchScore)} mb-3`}>
                {preview.verdict}
              </p>
              <p className="text-slate-300 text-sm max-w-md mx-auto">
                {preview.summary}
              </p>

              {/* Score bar */}
              <div className="mt-5 h-2 w-full max-w-sm mx-auto rounded-full bg-white/10">
                <div
                  className={`h-2 rounded-full transition-all ${
                    preview.matchScore >= 85 ? "bg-emerald-400" :
                    preview.matchScore >= 65 ? "bg-blue-400" :
                    preview.matchScore >= 45 ? "bg-amber-400" : "bg-red-400"
                  }`}
                  style={{ width: `${preview.matchScore}%` }}
                />
              </div>
            </div>

            {/* Matched + Missing skills */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {preview.matchedSkills?.length > 0 && (
                <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5">
                  <p className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <CheckCircle className="w-3.5 h-3.5" />
                    Matched Skills
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {preview.matchedSkills.map((skill: string) => (
                      <span key={skill} className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/10 text-xs text-emerald-300">
                        <Check className="w-3 h-3" />
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {preview.missingSkills?.length > 0 && (
                <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-5">
                  <p className="text-xs font-semibold text-red-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <XCircle className="w-3.5 h-3.5" />
                    Skills to Develop
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {preview.missingSkills.map((skill: string) => (
                      <span key={skill} className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-500/10 text-xs text-red-300">
                        <X className="w-3 h-3" />
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Suggestions */}
            {preview.suggestions?.length > 0 && (
              <div className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-5">
                <p className="text-xs font-semibold text-blue-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5" />
                  Tips to Improve Your Application
                </p>
                <ul className="space-y-2">
                  {preview.suggestions.map((tip: string, i: number) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                      <span className="text-blue-400 shrink-0">→</span>
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* CTA */}
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={() => setStep("form")}
                className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold hover:opacity-90 transition"
              >
                <Send className="w-4 h-4" />
                Continue & Apply
              </button>
              <button
                onClick={() => { setCvFile(null); setPreview(null); setStep("upload"); }}
                className="px-6 py-4 rounded-xl border border-white/10 bg-white/5 text-white font-semibold hover:bg-white/10 transition"
              >
                Upload Different CV
              </button>
            </div>
          </div>
        )}

        {/* ── Step: Application Form ── */}
        {step === "form" && (
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-8 space-y-5">
            <div>
              <h2 className="text-lg font-semibold text-white mb-1">
                Your Details
              </h2>
              <p className="text-slate-400 text-sm">
                {cvFile
                  ? `Applying with: ${cvFile.name}`
                  : "No CV uploaded — you can still apply"}
              </p>
            </div>

            {submitError && (
              <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                {submitError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">

              {/* Name */}
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-2">
                  Full Name <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                  <input
                    type="text"
                    value={candidateName}
                    onChange={(e) => setCandidateName(e.target.value)}
                    required
                    placeholder="John Doe"
                    className="w-full rounded-xl border border-white/10 bg-slate-900/50 pl-9 pr-4 py-3 text-white placeholder-slate-500 outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition text-sm"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-2">
                  Email Address <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                  <input
                    type="email"
                    value={candidateEmail}
                    onChange={(e) => setCandidateEmail(e.target.value)}
                    required
                    placeholder="you@example.com"
                    className="w-full rounded-xl border border-white/10 bg-slate-900/50 pl-9 pr-4 py-3 text-white placeholder-slate-500 outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition text-sm"
                  />
                </div>
              </div>

              {/* Phone */}
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-2">
                  Phone Number <span className="text-slate-600">(optional)</span>
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                  <input
                    type="tel"
                    value={candidatePhone}
                    onChange={(e) => setCandidatePhone(e.target.value)}
                    placeholder="+234 XXX XXX XXXX"
                    className="w-full rounded-xl border border-white/10 bg-slate-900/50 pl-9 pr-4 py-3 text-white placeholder-slate-500 outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition text-sm"
                  />
                </div>
              </div>

              {/* CV upload (if not already uploaded) */}
              {!cvFile && (
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-2">
                    CV / Resume <span className="text-slate-600">(optional)</span>
                  </label>
                  <label className="flex items-center gap-3 px-4 py-3 rounded-xl border border-white/10 bg-slate-900/50 cursor-pointer hover:border-purple-500/30 transition">
                    <Upload className="w-4 h-4 text-slate-500" />
                    <span className="text-sm text-slate-400">
                      {cvFile ? (cvFile as File).name : "Choose PDF, DOC or DOCX"}
                    </span>
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx"
                      className="hidden"
                      onChange={(e) => setCvFile(e.target.files?.[0] || null)}
                    />
                  </label>
                </div>
              )}

              {/* Cover letter */}
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-2">
                  Cover Letter <span className="text-slate-600">(optional)</span>
                </label>
                <textarea
                  value={coverLetter}
                  onChange={(e) => setCoverLetter(e.target.value)}
                  placeholder="Tell us why you're a great fit for this role..."
                  rows={5}
                  className="w-full rounded-xl border border-white/10 bg-slate-900/50 px-4 py-3 text-white placeholder-slate-500 outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 resize-none transition text-sm"
                />
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full inline-flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold hover:opacity-90 transition disabled:opacity-50"
              >
                {submitting ? (
                  <><Loader2 className="w-4 h-4 animate-spin" />Submitting...</>
                ) : (
                  <><Send className="w-4 h-4" />Submit Application</>
                )}
              </button>
            </form>

            <button
              onClick={() => setStep(preview ? "preview" : "upload")}
              className="w-full text-sm text-slate-500 hover:text-white transition"
            >
              ← Back
            </button>
          </div>
        )}

        {/* ── Step: Success ── */}
        {step === "success" && (
          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-12 text-center">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 flex items-center justify-center mx-auto mb-5">
              <CheckCircle className="w-8 h-8 text-emerald-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">
              Application Submitted! 🎉
            </h2>
            <p className="text-slate-400 mb-2">
              Your application for <span className="text-white font-medium">{job?.title}</span> at{" "}
              <span className="text-white font-medium">{company?.name}</span> has been received.
            </p>
            <p className="text-slate-500 text-sm mb-8">
              The recruiter will review your application and be in touch.
              Good luck!
            </p>

            {/* Match score reminder */}
            {preview && (
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 mb-8">
                <Star className="w-4 h-4 text-amber-400" />
                <span className="text-sm text-slate-300">
                  Your match score:{" "}
                  <span className={`font-bold ${
                    preview.matchScore >= 85 ? "text-emerald-400" :
                    preview.matchScore >= 65 ? "text-blue-400" :
                    preview.matchScore >= 45 ? "text-amber-400" : "text-red-400"
                  }`}>
                    {preview.matchScore}%
                  </span>
                </span>
              </div>
            )}

            <div className="space-y-3">
              <Link
                href={`/jobs/${companySlug}`}
                className="block px-6 py-3 rounded-xl border border-white/10 bg-white/5 text-white text-sm font-semibold hover:bg-white/10 transition"
              >
                View More Jobs at {company?.name}
              </Link>
              <Link
                href="/signup"
                className="block px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white text-sm font-semibold hover:opacity-90 transition"
              >
                Create a TomParo Account — Get AI Career Help
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
