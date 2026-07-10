"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import Link from "next/link";
import {
  Upload, FileText, CheckSquare, Square, AlertCircle,
  Loader2, Sparkles, Users, ArrowRight, Crown,
  CheckCircle, XCircle, BarChart3, Zap,
} from "lucide-react";
import toast from "react-hot-toast";

interface CVFile {
  id: string;
  fileName: string;
  size: number;
  text: string;
  error?: string;
}

interface AnalysisResult {
  fileName: string;
  success: boolean;
  candidateId?: string;
  analysis?: any;
  error?: string;
}

type Stage = "upload" | "select" | "analyzing" | "done";

export default function BulkUploadPage() {
  const [stage, setStage] = useState<Stage>("upload");
  const [uploading, setUploading] = useState(false);
  const [cvFiles, setCvFiles] = useState<CVFile[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [remaining, setRemaining] = useState(0);
  const [limit, setLimit] = useState(0);
  const [used, setUsed] = useState(0);
  const [analyzing, setAnalyzing] = useState(false);
  const [currentFile, setCurrentFile] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [results, setResults] = useState<AnalysisResult[]>([]);
  const [error, setError] = useState("");

  // ── Dropzone ──
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setUploading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/recruiter/bulk", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.limitReached) {
          setError(data.error);
          return;
        }
        throw new Error(data.error || "Failed to process ZIP");
      }

      setCvFiles(data.cvFiles);
      setRemaining(data.remaining);
      setLimit(data.limit);
      setUsed(data.used);

      // Auto-select up to remaining quota
      const validCVs = data.cvFiles.filter((cv: CVFile) => cv.text && !cv.error);
      const autoSelected = new Set<string>(
        validCVs.slice(0, data.remaining).map((cv: CVFile) => cv.id)
      );
      setSelected(autoSelected);

      setStage("select");
      toast.success(`Found ${data.cvFiles.length} CV${data.cvFiles.length !== 1 ? "s" : ""} in ZIP`);
    } catch (err: any) {
      setError(err.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/zip": [".zip"], "application/x-zip-compressed": [".zip"] },
    maxFiles: 1,
    disabled: uploading,
  });

  // ── Select / deselect ──
  const toggleSelect = (id: string) => {
    const cv = cvFiles.find((c) => c.id === id);
    if (!cv || cv.error || !cv.text) return;

    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        if (next.size >= remaining) {
          toast.error(`You can only select up to ${remaining} CV${remaining !== 1 ? "s" : ""}`);
          return prev;
        }
        next.add(id);
      }
      return next;
    });
  };

  const selectAll = () => {
    const validCVs = cvFiles.filter((cv) => cv.text && !cv.error);
    const toSelect = validCVs.slice(0, remaining).map((cv) => cv.id);
    setSelected(new Set(toSelect));
  };

  const deselectAll = () => setSelected(new Set());

  // ── Analyse selected ──
  const handleAnalyze = async () => {
    if (selected.size === 0) {
      toast.error("Select at least one CV");
      return;
    }

    const selectedCVs = cvFiles.filter((cv) => selected.has(cv.id));
    setAnalyzing(true);
    setCurrentIndex(0);
    setStage("analyzing");

    const allResults: AnalysisResult[] = [];

    for (let i = 0; i < selectedCVs.length; i++) {
      const cv = selectedCVs[i];
      setCurrentFile(cv.fileName);
      setCurrentIndex(i + 1);

      try {
        const res = await fetch("/api/recruiter/bulk/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ selectedCVs: [cv] }),
        });

        const data = await res.json();

        if (!res.ok) {
          allResults.push({ fileName: cv.fileName, success: false, error: data.error });
        } else {
          allResults.push(...data.results);
        }
      } catch {
        allResults.push({ fileName: cv.fileName, success: false, error: "Failed" });
      }
    }

    setResults(allResults);
    setStage("done");
    setAnalyzing(false);

    const successful = allResults.filter((r) => r.success).length;
    toast.success(`${successful} of ${allResults.length} CVs analysed successfully!`);
  };

  const resetAll = () => {
    setStage("upload");
    setCvFiles([]);
    setSelected(new Set());
    setResults([]);
    setError("");
    setCurrentFile("");
    setCurrentIndex(0);
  };

  const validCVCount = cvFiles.filter((cv) => cv.text && !cv.error).length;
  const canSelectMore = selected.size < remaining;

  return (
    <div className="max-w-4xl mx-auto space-y-8">

      {/* Header */}
      <div>
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-purple-500/20 bg-purple-500/10 px-3 py-1 text-xs font-medium text-purple-400">
          <Sparkles className="h-3 w-3" />
          Bulk CV Upload
        </div>
        <h1 className="text-2xl font-bold text-white">Bulk Upload CVs</h1>
        <p className="text-slate-400 mt-1">
          Upload a ZIP file containing multiple CVs. AI will analyse and rank all selected candidates automatically.
        </p>
      </div>

      {/* ── Stage 1: Upload ZIP ── */}
      {stage === "upload" && (
        <div className="space-y-6">
          <div
            {...getRootProps()}
            className={`relative cursor-pointer rounded-2xl border-2 border-dashed p-16 text-center transition ${
              isDragActive
                ? "border-purple-500 bg-purple-500/5"
                : "border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.03]"
            } ${uploading ? "pointer-events-none opacity-50" : ""}`}
          >
            <input {...getInputProps()} />
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-purple-500/10 ring-1 ring-purple-500/20">
              <Upload className="h-7 w-7 text-purple-400" />
            </div>

            {uploading ? (
              <div>
                <p className="text-base font-medium text-white">Extracting CVs from ZIP...</p>
                <Loader2 className="mx-auto mt-3 h-5 w-5 animate-spin text-purple-400" />
                <p className="mt-2 text-sm text-slate-500">This may take a moment for large ZIPs</p>
              </div>
            ) : isDragActive ? (
              <p className="text-base font-medium text-purple-400">Drop your ZIP here...</p>
            ) : (
              <>
                <p className="text-base font-medium text-white">
                  Drag & drop a ZIP file, or <span className="text-purple-400">browse</span>
                </p>
                <p className="mt-2 text-sm text-slate-500">
                  ZIP containing PDF, DOC, or DOCX files • No size limit
                </p>
              </>
            )}
          </div>

          {error && (
            <div className="flex items-start gap-3 rounded-2xl border border-red-500/20 bg-red-500/5 p-5">
              <AlertCircle className="h-5 w-5 shrink-0 text-red-400 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-white">Upload Failed</p>
                <p className="text-sm text-red-400 mt-0.5">{error}</p>
                {error.includes("limit") && (
                  <Link
                    href="/recruiter-pricing"
                    className="mt-3 inline-flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-500 transition"
                  >
                    <Crown className="w-3.5 h-3.5" />
                    Upgrade Plan
                  </Link>
                )}
              </div>
            </div>
          )}

          {/* How it works */}
          <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-6">
            <p className="text-sm font-semibold text-white mb-4">How it works</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { step: "1", icon: Upload, title: "Upload ZIP", desc: "Drag your ZIP file containing all candidate CVs" },
                { step: "2", icon: CheckSquare, title: "Select CVs", desc: "Choose which CVs to analyse (up to your monthly quota)" },
                { step: "3", icon: Zap, title: "AI Analyses", desc: "AI scores, ranks, and saves all candidates automatically" },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.step} className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shrink-0">
                      <span className="text-xs font-bold text-purple-400">{item.step}</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{item.title}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── Stage 2: Select CVs ── */}
      {stage === "select" && (
        <div className="space-y-6">

          {/* Quota info */}
          <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-white">
                  Found {cvFiles.length} CV{cvFiles.length !== 1 ? "s" : ""} in ZIP
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  You can analyse up to{" "}
                  <span className="text-purple-400 font-semibold">{remaining}</span> more CV
                  {remaining !== 1 ? "s" : ""} this month
                </p>
              </div>
              <div className="flex items-center gap-2 text-sm font-semibold">
                <span className="text-purple-400">{selected.size}</span>
                <span className="text-slate-500">/ {Math.min(remaining, validCVCount)} selected</span>
              </div>
            </div>

            {/* Usage bar */}
            <div className="mt-4">
              <div className="h-1.5 w-full rounded-full bg-white/5">
                <div
                  className="h-1.5 rounded-full bg-purple-500 transition-all"
                  style={{ width: `${limit > 0 ? Math.min(100, ((used + selected.size) / limit) * 100) : 0}%` }}
                />
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {used + selected.size} / {limit} CVs used this month
              </p>
            </div>

            {/* Upgrade CTA if they have more CVs than quota */}
            {cvFiles.length > remaining && (
              <div className="mt-4 flex items-center justify-between rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3">
                <p className="text-xs text-amber-300">
                  <span className="font-semibold">{cvFiles.length - remaining} CVs</span> can't be analysed with your current plan
                </p>
                <Link
                  href="/recruiter-pricing"
                  className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/20 border border-amber-500/30 text-amber-400 text-xs font-semibold hover:bg-amber-500/30 transition"
                >
                  <Crown className="w-3 h-3" />
                  Upgrade
                </Link>
              </div>
            )}
          </div>

          {/* Select all / deselect all */}
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-white">Select CVs to Analyse</p>
            <div className="flex gap-2">
              <button
                onClick={selectAll}
                className="px-3 py-1.5 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-medium hover:bg-purple-500/20 transition"
              >
                Select All ({Math.min(remaining, validCVCount)})
              </button>
              <button
                onClick={deselectAll}
                className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-slate-400 text-xs font-medium hover:bg-white/10 transition"
              >
                Deselect All
              </button>
            </div>
          </div>

          {/* CV List */}
          <div className="space-y-2">
            {cvFiles.map((cv) => {
              const isSelected = selected.has(cv.id);
              const hasError = !!cv.error || !cv.text;
              const isDisabled = hasError || (!isSelected && !canSelectMore);

              return (
                <div
                  key={cv.id}
                  onClick={() => !isDisabled && toggleSelect(cv.id)}
                  className={`flex items-center gap-4 rounded-xl border p-4 transition ${
                    hasError
                      ? "border-red-500/20 bg-red-500/5 cursor-not-allowed opacity-60"
                      : isSelected
                      ? "border-purple-500/30 bg-purple-500/10 cursor-pointer"
                      : isDisabled
                      ? "border-white/5 bg-white/[0.01] cursor-not-allowed opacity-50"
                      : "border-white/10 bg-white/[0.02] cursor-pointer hover:border-white/20"
                  }`}
                >
                  {/* Checkbox */}
                  <div className="shrink-0">
                    {hasError ? (
                      <XCircle className="w-5 h-5 text-red-400" />
                    ) : isSelected ? (
                      <CheckSquare className="w-5 h-5 text-purple-400" />
                    ) : (
                      <Square className="w-5 h-5 text-slate-600" />
                    )}
                  </div>

                  {/* File icon */}
                  <div className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
                    <FileText className={`w-4 h-4 ${hasError ? "text-red-400" : "text-slate-400"}`} />
                  </div>

                  {/* File info */}
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${hasError ? "text-red-300" : "text-white"}`}>
                      {cv.fileName}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {hasError
                        ? cv.error
                        : `${(cv.size / 1024).toFixed(1)} KB · ${cv.text.length.toLocaleString()} chars`}
                    </p>
                  </div>

                  {/* Selected badge */}
                  {isSelected && (
                    <span className="shrink-0 px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400 text-xs font-medium">
                      Selected
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={handleAnalyze}
              disabled={selected.size === 0}
              className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-purple-600 text-white font-semibold hover:bg-purple-500 transition disabled:opacity-50"
            >
              <Zap className="w-4 h-4" />
              Analyse {selected.size} Selected CV{selected.size !== 1 ? "s" : ""} with AI
            </button>
            <button
              onClick={resetAll}
              className="px-6 py-4 rounded-xl border border-white/10 bg-white/5 text-white font-semibold hover:bg-white/10 transition"
            >
              Start Over
            </button>
          </div>
        </div>
      )}

      {/* ── Stage 3: Analyzing ── */}
      {stage === "analyzing" && (
        <div className="rounded-2xl border border-purple-500/20 bg-purple-500/5 p-10 text-center space-y-6">
          <div className="relative flex h-24 w-24 items-center justify-center mx-auto">
            <svg className="absolute -rotate-90" width="96" height="96" viewBox="0 0 96 96">
              <circle cx="48" cy="48" r="40" stroke="rgb(30 41 59)" strokeWidth="6" fill="none" />
              <circle
                cx="48" cy="48" r="40"
                strokeWidth="6" fill="none" strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 40}
                strokeDashoffset={2 * Math.PI * 40 - (currentIndex / selected.size) * (2 * Math.PI * 40)}
                className="stroke-purple-500 transition-all duration-500"
              />
            </svg>
            <div className="text-center">
              <p className="text-xl font-bold text-white">{currentIndex}</p>
              <p className="text-xs text-slate-500">of {selected.size}</p>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-white">Analysing CVs with AI</h3>
            <p className="text-sm text-slate-400 mt-1">
              Currently analysing: <span className="text-purple-400">{currentFile}</span>
            </p>
          </div>

          <div className="w-full rounded-full bg-white/5 h-2">
            <div
              className="h-2 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500"
              style={{ width: `${(currentIndex / selected.size) * 100}%` }}
            />
          </div>

          <p className="text-xs text-slate-500">
            Please wait — AI is scoring, ranking, and saving each candidate
          </p>
        </div>
      )}

      {/* ── Stage 4: Done ── */}
      {stage === "done" && (
        <div className="space-y-6">
          {/* Summary */}
          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Analysis Complete!</h3>
                <p className="text-sm text-slate-400">
                  {results.filter((r) => r.success).length} of {results.length} CVs analysed successfully
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              {[
                { label: "Analysed", value: results.filter((r) => r.success).length, color: "text-emerald-400" },
                { label: "Failed", value: results.filter((r) => !r.success).length, color: "text-red-400" },
                { label: "Total", value: results.length, color: "text-white" },
              ].map((stat) => (
                <div key={stat.label} className="text-center">
                  <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                  <p className="text-xs text-slate-500">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Results list */}
          <div className="space-y-2">
            {results.map((result, i) => (
              <div
                key={i}
                className={`flex items-center justify-between gap-4 rounded-xl border p-4 ${
                  result.success
                    ? "border-emerald-500/20 bg-emerald-500/5"
                    : "border-red-500/20 bg-red-500/5"
                }`}
              >
                <div className="flex items-center gap-3">
                  {result.success ? (
                    <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-400 shrink-0" />
                  )}
                  <div>
                    <p className="text-sm font-medium text-white">{result.fileName}</p>
                    {result.success && result.analysis && (
                      <p className="text-xs text-slate-400 mt-0.5">
                        {result.analysis.candidateName || "Unknown"} ·
                        ATS {result.analysis.atsScore}/100 ·{" "}
                        <span className={
                          result.analysis.hiringRecommendation === "Strong Hire" ? "text-emerald-400" :
                          result.analysis.hiringRecommendation === "Hire" ? "text-blue-400" :
                          result.analysis.hiringRecommendation === "Maybe" ? "text-amber-400" :
                          "text-red-400"
                        }>
                          {result.analysis.hiringRecommendation}
                        </span>
                      </p>
                    )}
                    {!result.success && (
                      <p className="text-xs text-red-400 mt-0.5">{result.error}</p>
                    )}
                  </div>
                </div>

                {result.success && result.candidateId && (
                  <Link
                    href={`/recruiter/candidates/${result.candidateId}`}
                    className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-medium hover:bg-purple-500/20 transition"
                  >
                    View
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                )}
              </div>
            ))}
          </div>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              href="/recruiter/candidates"
              className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-purple-600 text-white font-semibold hover:bg-purple-500 transition"
            >
              <Users className="w-4 h-4" />
              View All Candidates
            </Link>
            <button
              onClick={resetAll}
              className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-4 rounded-xl border border-white/10 bg-white/5 text-white font-semibold hover:bg-white/10 transition"
            >
              <Upload className="w-4 h-4" />
              Upload Another ZIP
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
