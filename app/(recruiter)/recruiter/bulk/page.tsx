"use client";

import { useState, useCallback, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import Link from "next/link";
import {
  Upload, FileText, CheckSquare, Square, AlertCircle,
  Loader2, Sparkles, Users, ArrowRight, Crown,
  CheckCircle, XCircle, Zap, Briefcase,
  ChevronRight, PenLine, Filter, Trophy, FileX, Mail,
} from "lucide-react";
import toast from "react-hot-toast";
import { useFaviconStore } from "@/lib/favicon-store";

// ── Types ──────────────────────────────────────────────────────────────────

interface DocType {
  type: string;
  typeName: string;
  confidence: number;
  reasoning: string;
  structureClues?: string[];
  languageClues?: string[];
}

interface CVFile {
  id: string;
  fileName: string;
  size: number;
  text: string;
  error?: string;
  docType?: DocType;
}

interface AnalysisResult {
  fileName: string;
  success: boolean;
  candidateId?: string;
  analysis?: any;
  error?: string;
}

interface JobPost {
  id: string;
  title: string;
  description: string;
  requirements: string;
  location: string;
  type: string;
}

interface JobContext {
  title: string;
  requirements: string;
}

interface PositionMatches {
  total: number;
  categorized: {
    topRanked: any[];
    available: any[];
    rejected: any[];
    hired: any[];
  };
}

type Stage = "upload" | "select" | "job" | "analyzing" | "done";

// ── Document type config ────────────────────────────────────────────────────

const DOC_TYPE_CONFIG: Record<string, { color: string; bg: string; border: string; icon: any }> = {
  CV:               { color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20", icon: FileText },
  COVER_LETTER:     { color: "text-blue-400",    bg: "bg-blue-500/10",    border: "border-blue-500/20",    icon: PenLine  },
  REFERENCE_LETTER: { color: "text-amber-400",   bg: "bg-amber-500/10",   border: "border-amber-500/20",   icon: FileText },
  TRANSCRIPT:       { color: "text-purple-400",  bg: "bg-purple-500/10",  border: "border-purple-500/20",  icon: FileText },
  PORTFOLIO:        { color: "text-pink-400",    bg: "bg-pink-500/10",    border: "border-pink-500/20",    icon: FileText },
  OTHER:            { color: "text-slate-400",   bg: "bg-slate-500/10",   border: "border-slate-500/20",   icon: FileX    },
};

const DOC_TYPE_LABELS: Record<string, string> = {
  COVER_LETTER:     "Cover Letters",
  REFERENCE_LETTER: "Reference Letters",
  TRANSCRIPT:       "Academic Transcripts",
  PORTFOLIO:        "Portfolios",
  OTHER:            "Other Documents",
};

// ── Component ───────────────────────────────────────────────────────────────

export default function BulkUploadPage() {
  const [stage, setStage]                         = useState<Stage>("upload");
  const [uploading, setUploading]                 = useState(false);
  const [cvFiles, setCvFiles]                     = useState<CVFile[]>([]);
  const [selected, setSelected]                   = useState<Set<string>>(new Set());
  const [remaining, setRemaining]                 = useState(0);
  const [limit, setLimit]                         = useState(0);
  const [used, setUsed]                           = useState(0);
  const [currentFile, setCurrentFile]             = useState("");
  const [currentIndex, setCurrentIndex]           = useState(0);
  const [results, setResults]                     = useState<AnalysisResult[]>([]);
  const [error, setError]                         = useState("");
  const [detecting, setDetecting]                 = useState(false);
  const [detectionProgress, setDetectionProgress] = useState(0);

  // Job context
  const [jobPosts, setJobPosts]                         = useState<JobPost[]>([]);
  const [selectedJobId, setSelectedJobId]               = useState<string | null>(null);
  const [jobMode, setJobMode]                           = useState<"select" | "manual">("select");
  const [manualJobTitle, setManualJobTitle]             = useState("");
  const [manualJobRequirements, setManualJobRequirements] = useState("");
  const [loadingJobs, setLoadingJobs]                   = useState(false);

  // Top X filter
  const [topX, setTopX]       = useState<number | "">(0);
  const [showTopX, setShowTopX] = useState(false);

  // Position matching
  const [positionMatches, setPositionMatches]   = useState<PositionMatches | null>(null);
  const [loadingMatches, setLoadingMatches]     = useState(false);

  const { setLoading: setFaviconLoading, setSuccess: setFaviconSuccess } = useFaviconStore();

  // ── Load active job posts when entering job stage ──
  useEffect(() => {
    if (stage !== "job") return;
    setLoadingJobs(true);
    fetch("/api/recruiter/jobs?status=ACTIVE")
      .then((r) => r.json())
      .then((d) => setJobPosts(d.jobs || []))
      .catch(() => {})
      .finally(() => setLoadingJobs(false));
  }, [stage]);

  // ── Fetch position matches when job title changes ──
  useEffect(() => {
    const title =
      jobMode === "select" && selectedJobId
        ? jobPosts.find((j) => j.id === selectedJobId)?.title || ""
        : manualJobTitle;

    if (!title || title.length < 3) {
      setPositionMatches(null);
      return;
    }

    const timer = setTimeout(async () => {
      setLoadingMatches(true);
      try {
        const res = await fetch("/api/recruiter/candidates/match", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ jobTitle: title, requirements: manualJobRequirements }),
        });
        const data = await res.json();
        setPositionMatches(data.total > 0 ? data : null);
      } catch {
        setPositionMatches(null);
      } finally {
        setLoadingMatches(false);
      }
    }, 800);

    return () => clearTimeout(timer);
  }, [selectedJobId, manualJobTitle, manualJobRequirements, jobMode, jobPosts]);

  // ── Dropzone ──
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setUploading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/recruiter/bulk", { method: "POST", body: formData });
      const data = await res.json();

      if (!res.ok) {
        if (data.limitReached) { setError(data.error); return; }
        throw new Error(data.error || "Failed to process ZIP");
      }

      const files: CVFile[] = data.cvFiles.map((cv: CVFile) => ({ ...cv, docType: undefined }));
      setCvFiles(files);
      setRemaining(data.remaining);
      setLimit(data.limit);
      setUsed(data.used);
      setStage("select");
      toast.success(`Found ${data.cvFiles.length} file${data.cvFiles.length !== 1 ? "s" : ""} in ZIP`);

      runDetection(files, data.remaining);
    } catch (err: any) {
      setError(err.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  }, []);

  // ── AI document type detection — calls API route (server-side) ──
  const runDetection = async (files: CVFile[], quotaRemaining: number) => {
    setDetecting(true);
    setDetectionProgress(0);

    const updated = [...files];

    for (let i = 0; i < updated.length; i++) {
      const cv = updated[i];

      if (!cv.text || cv.error) {
        updated[i] = {
          ...cv,
          docType: { type: "OTHER", typeName: "Unreadable", confidence: 0, reasoning: "Could not read file" },
        };
      } else {
        try {
          const res = await fetch("/api/recruiter/cv/detect", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text: cv.text }),
          });
          if (!res.ok) throw new Error("Detection failed");
          const data = await res.json();
          updated[i] = { ...cv, docType: data.detection as DocType };
        } catch {
          updated[i] = {
            ...cv,
            docType: { type: "CV", typeName: "CV", confidence: 50, reasoning: "Detection failed — assuming CV" },
          };
        }
      }

      setDetectionProgress(Math.round(((i + 1) / updated.length) * 100));
      setCvFiles([...updated]);
    }

    // Auto-select only detected CVs up to quota
    const cvOnly = updated.filter((cv) => cv.docType?.type === "CV" && cv.text && !cv.error);
    setSelected(new Set(cvOnly.slice(0, quotaRemaining).map((cv) => cv.id)));
    setDetecting(false);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/zip": [".zip"], "application/x-zip-compressed": [".zip"] },
    maxFiles: 1,
    disabled: uploading,
  });

  // ── Selection helpers ──
  const toggleSelect = (id: string) => {
    const cv = cvFiles.find((c) => c.id === id);
    if (!cv || cv.error || !cv.text || cv.docType?.type !== "CV") return;
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

  const selectAllCVs = () => {
    const cvOnly = cvFiles.filter((cv) => cv.docType?.type === "CV" && cv.text && !cv.error);
    setSelected(new Set(cvOnly.slice(0, remaining).map((cv) => cv.id)));
  };

  const deselectAll = () => setSelected(new Set());

  // ── Get job context from current selection ──
  const getJobContext = (): JobContext | null => {
    if (jobMode === "select" && selectedJobId) {
      const job = jobPosts.find((j) => j.id === selectedJobId);
      if (job) return { title: job.title, requirements: job.requirements || job.description };
    }
    if (jobMode === "manual" && manualJobTitle.trim()) {
      return { title: manualJobTitle.trim(), requirements: manualJobRequirements.trim() };
    }
    return null;
  };

  // ── Main analysis handler ──
  const handleAnalyze = async () => {
    if (selected.size === 0) { toast.error("Select at least one CV"); return; }

    const jobContext = getJobContext();
    const selectedJobPost = selectedJobId ? jobPosts.find((j) => j.id === selectedJobId) : null;
    const selectedCVs = cvFiles.filter((cv) => selected.has(cv.id));

    setCurrentIndex(0);
    setStage("analyzing");
    setFaviconLoading();

    const allResults: AnalysisResult[] = [];

    for (let i = 0; i < selectedCVs.length; i++) {
      const cv = selectedCVs[i];
      setCurrentFile(cv.fileName);
      setCurrentIndex(i + 1);

      try {
        const res = await fetch("/api/recruiter/bulk/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            selectedCVs: [cv],
            jobId: selectedJobPost?.id || null,
            jobContext: jobContext || null,
          }),
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

    // Sort by ATS score descending
    allResults.sort((a, b) => (b.analysis?.atsScore || 0) - (a.analysis?.atsScore || 0));

    setResults(allResults);
    setStage("done");

    setFaviconSuccess();
    const successful = allResults.filter((r) => r.success).length;
    toast.success(`${successful} of ${allResults.length} CVs analysed successfully!`);

    // Save all files (CVs + non-CVs) to document library silently
    try {
      const batchName = jobContext?.title
        ? `Bulk Upload — ${jobContext.title}`
        : `Bulk Upload — ${new Date().toLocaleDateString()}`;

      const allFiles = cvFiles.map((cv) => {
        const result = allResults.find((r) => r.fileName === cv.fileName);
        return {
          fileName:     cv.fileName,
          detectedType: cv.docType?.type     || "OTHER",
          typeName:     cv.docType?.typeName  || "Unknown",
          confidence:   cv.docType?.confidence ?? 0,
          reasoning:    cv.docType?.reasoning  || null,
          rawText:      cv.text               || null,
          candidateId:  result?.candidateId   || null,
        };
      });

      await fetch("/api/recruiter/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: batchName, files: allFiles }),
      });
    } catch {
      // Silently fail — never break main flow
    }
  };

  // ── Reset ──
  const resetAll = () => {
    setStage("upload");
    setCvFiles([]);
    setSelected(new Set());
    setResults([]);
    setError("");
    setCurrentFile("");
    setCurrentIndex(0);
    setSelectedJobId(null);
    setManualJobTitle("");
    setManualJobRequirements("");
    setTopX(0);
    setShowTopX(false);
    setPositionMatches(null);
  };

  // ── Derived state ──
  const groupedFiles = cvFiles.reduce((acc, cv) => {
    const type = cv.docType?.type || "DETECTING";
    if (!acc[type]) acc[type] = [];
    acc[type].push(cv);
    return acc;
  }, {} as Record<string, CVFile[]>);

  const cvCount        = groupedFiles["CV"]?.length || 0;
  const nonCVGroups    = Object.entries(groupedFiles).filter(([type]) => type !== "CV" && type !== "DETECTING");
  const canSelectMore  = selected.size < remaining;
  const successfulResults = results.filter((r) => r.success);

  const displayedResults =
    showTopX && typeof topX === "number" && topX > 0
      ? results.slice(0, topX)
      : results;

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-4xl mx-auto space-y-8">

      {/* Header */}
      <div>
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-purple-500/20 bg-purple-500/10 px-3 py-1 text-xs font-medium text-purple-400">
          <Sparkles className="h-3 w-3" />Bulk CV Upload
        </div>
        <h1 className="text-2xl font-bold text-white">Bulk Upload CVs</h1>
        <p className="text-slate-400 mt-1">
          Upload a ZIP file containing multiple documents. AI detects document types, groups them, and analyses only CVs.
        </p>
      </div>

      {/* ── Stage 1: Upload ── */}
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
                <p className="text-base font-medium text-white">Extracting files from ZIP...</p>
                <Loader2 className="mx-auto mt-3 h-5 w-5 animate-spin text-purple-400" />
              </div>
            ) : isDragActive ? (
              <p className="text-base font-medium text-purple-400">Drop your ZIP here...</p>
            ) : (
              <>
                <p className="text-base font-medium text-white">
                  Drag & drop a ZIP file, or <span className="text-purple-400">browse</span>
                </p>
                <p className="mt-2 text-sm text-slate-500">
                  ZIP containing PDF, DOC, or DOCX files · AI auto-detects document types
                </p>
              </>
            )}
          </div>

          {error && (
            <div className="flex items-start gap-3 rounded-2xl border border-red-500/20 bg-red-500/5 p-5">
              <AlertCircle className="h-5 w-5 shrink-0 text-red-400 mt-0.5" />
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-6">
            <p className="text-sm font-semibold text-white mb-4">How it works</p>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              {[
                { step: "1", title: "Upload ZIP",       desc: "Drag your ZIP with all candidate documents" },
                { step: "2", title: "AI Detects Types", desc: "AI identifies CVs, cover letters, etc. and groups them" },
                { step: "3", title: "Set Job Context",  desc: "Pick a job post so AI scores candidates for that role" },
                { step: "4", title: "AI Analyses",      desc: "AI scores and ranks candidates. Filter to top X." },
              ].map((item) => (
                <div key={item.step} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shrink-0">
                    <span className="text-xs font-bold text-purple-400">{item.step}</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{item.title}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Stage 2: Select ── */}
      {stage === "select" && (
        <div className="space-y-6">

          {/* Detection progress */}
          {detecting && (
            <div className="rounded-2xl border border-purple-500/20 bg-purple-500/5 p-5 space-y-3">
              <div className="flex items-center gap-3">
                <Loader2 className="w-4 h-4 text-purple-400 animate-spin" />
                <p className="text-sm font-semibold text-white">
                  AI is detecting document types... {detectionProgress}%
                </p>
              </div>
              <div className="h-1.5 w-full rounded-full bg-white/5">
                <div
                  className="h-1.5 rounded-full bg-purple-500 transition-all"
                  style={{ width: `${detectionProgress}%` }}
                />
              </div>
              <p className="text-xs text-slate-500">
                Analysing each file to identify CVs, cover letters, and other documents
              </p>
            </div>
          )}

          {/* Quota info */}
          <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-white">
                  Found {cvFiles.length} file{cvFiles.length !== 1 ? "s" : ""} in ZIP
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  <span className="text-emerald-400 font-semibold">{cvCount} CVs</span> detected ·{" "}
                  You can analyse up to{" "}
                  <span className="text-purple-400 font-semibold">{remaining}</span> more this month
                </p>
              </div>
              <div className="flex items-center gap-2 text-sm font-semibold">
                <span className="text-purple-400">{selected.size}</span>
                <span className="text-slate-500">/ {Math.min(remaining, cvCount)} selected</span>
              </div>
            </div>
            <div className="mt-4">
              <div className="h-1.5 w-full rounded-full bg-white/5">
                <div
                  className="h-1.5 rounded-full bg-purple-500 transition-all"
                  style={{ width: `${limit > 0 ? Math.min(100, ((used + selected.size) / limit) * 100) : 0}%` }}
                />
              </div>
              <p className="text-xs text-slate-500 mt-1">{used + selected.size} / {limit} CVs used this month</p>
            </div>
          </div>

          {/* CV group */}
          {(cvCount > 0 || detecting) && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  CVs / Resumes ({cvCount})
                </h3>
                <div className="flex gap-2">
                  <button
                    onClick={selectAllCVs}
                    className="px-3 py-1.5 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-medium hover:bg-purple-500/20 transition"
                  >
                    Select All ({Math.min(remaining, cvCount)})
                  </button>
                  <button
                    onClick={deselectAll}
                    className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-slate-400 text-xs font-medium hover:bg-white/10 transition"
                  >
                    Deselect All
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                {groupedFiles["CV"]?.map((cv) => {
                  const isSelected  = selected.has(cv.id);
                  const isDisabled  = !isSelected && !canSelectMore;
                  return (
                    <div
                      key={cv.id}
                      onClick={() => !isDisabled && toggleSelect(cv.id)}
                      className={`flex items-center gap-4 rounded-xl border p-4 transition cursor-pointer ${
                        isSelected
                          ? "border-purple-500/30 bg-purple-500/10"
                          : isDisabled
                          ? "border-white/5 bg-white/[0.01] opacity-50 cursor-not-allowed"
                          : "border-white/10 bg-white/[0.02] hover:border-white/20"
                      }`}
                    >
                      <div className="shrink-0">
                        {isSelected
                          ? <CheckSquare className="w-5 h-5 text-purple-400" />
                          : <Square className="w-5 h-5 text-slate-600" />}
                      </div>
                      <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
                        <FileText className="w-4 h-4 text-emerald-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">{cv.fileName}</p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {(cv.size / 1024).toFixed(1)} KB · {cv.text.length.toLocaleString()} chars
                        </p>
                      </div>
                      {isSelected && (
                        <span className="shrink-0 px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400 text-xs font-medium">
                          Selected
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Non-CV groups */}
          {!detecting && nonCVGroups.length > 0 && (
            <div className="space-y-4">
              <p className="text-xs text-slate-500 uppercase tracking-wider font-medium">
                Other Documents (not included in analysis)
              </p>
              {nonCVGroups.map(([type, files]) => {
                const cfg  = DOC_TYPE_CONFIG[type] || DOC_TYPE_CONFIG["OTHER"];
                const Icon = cfg.icon;
                return (
                  <div key={type} className={`rounded-2xl border ${cfg.border} ${cfg.bg} p-4 space-y-3`}>
                    <h3 className={`text-sm font-semibold flex items-center gap-2 ${cfg.color}`}>
                      <Icon className="w-4 h-4" />
                      {DOC_TYPE_LABELS[type] || "Other Documents"} ({files.length})
                    </h3>
                    <div className="space-y-1.5">
                      {files.map((cv) => (
                        <div key={cv.id} className="flex items-center gap-3 px-3 py-2 rounded-xl bg-black/20">
                          <Icon className={`w-3.5 h-3.5 ${cfg.color} shrink-0`} />
                          <p className="text-sm text-slate-300 truncate flex-1">{cv.fileName}</p>
                          <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.color}`}>
                            {cv.docType?.typeName || type}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={() => setStage("job")}
              disabled={selected.size === 0 || detecting}
              className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-purple-600 text-white font-semibold hover:bg-purple-500 transition disabled:opacity-50"
            >
              {detecting
                ? <><Loader2 className="w-4 h-4 animate-spin" />Detecting types...</>
                : <><ChevronRight className="w-4 h-4" />Continue with {selected.size} CV{selected.size !== 1 ? "s" : ""}</>}
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

      {/* ── Stage 3: Job Context ── */}
      {stage === "job" && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-bold text-white">Set Job Context</h2>
            <p className="text-slate-400 text-sm mt-1">
              AI will score each CV specifically against this role for more accurate results.
            </p>
          </div>

          {/* Mode toggle */}
          <div className="grid grid-cols-2 gap-3">
            {(["select", "manual"] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setJobMode(mode)}
                className={`p-4 rounded-2xl border text-left transition ${
                  jobMode === mode
                    ? "border-purple-500/40 bg-purple-500/10"
                    : "border-white/10 bg-white/[0.02] hover:border-white/20"
                }`}
              >
                {mode === "select"
                  ? <Briefcase className={`w-5 h-5 mb-2 ${jobMode === "select" ? "text-purple-400" : "text-slate-400"}`} />
                  : <PenLine   className={`w-5 h-5 mb-2 ${jobMode === "manual" ? "text-purple-400" : "text-slate-400"}`} />}
                <p className={`text-sm font-semibold ${jobMode === mode ? "text-white" : "text-slate-300"}`}>
                  {mode === "select" ? "Select Job Post" : "Enter Manually"}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {mode === "select" ? "Choose from your active job postings" : "Type in the job title and requirements"}
                </p>
              </button>
            ))}
          </div>

          {/* Select from job posts */}
          {jobMode === "select" && (
            <div className="space-y-3">
              {loadingJobs ? (
                <div className="flex items-center gap-2 text-slate-400 text-sm">
                  <Loader2 className="w-4 h-4 animate-spin" />Loading your job posts...
                </div>
              ) : jobPosts.length === 0 ? (
                <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 text-center space-y-3">
                  <Briefcase className="w-8 h-8 text-slate-500 mx-auto" />
                  <p className="text-sm text-slate-400">No active job posts found.</p>
                  <button
                    onClick={() => setJobMode("manual")}
                    className="text-xs text-purple-400 hover:text-purple-300 transition"
                  >
                    Enter job details manually →
                  </button>
                </div>
              ) : (
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {jobPosts.map((job) => (
                    <div
                      key={job.id}
                      onClick={() => setSelectedJobId(job.id)}
                      className={`p-4 rounded-xl border cursor-pointer transition ${
                        selectedJobId === job.id
                          ? "border-purple-500/40 bg-purple-500/10"
                          : "border-white/10 bg-white/[0.02] hover:border-white/20"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-white">{job.title}</p>
                          <p className="text-xs text-slate-500 mt-0.5">{job.location} · {job.type}</p>
                        </div>
                        {selectedJobId === job.id && (
                          <CheckCircle className="w-4 h-4 text-purple-400 shrink-0" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Manual input */}
          {jobMode === "manual" && (
            <div className="space-y-4 rounded-2xl border border-white/10 bg-white/[0.02] p-5">
              <div>
                <label className="text-xs text-slate-500 mb-1.5 block">Job Title *</label>
                <input
                  value={manualJobTitle}
                  onChange={(e) => setManualJobTitle(e.target.value)}
                  placeholder="e.g. Senior Product Designer"
                  className="w-full rounded-xl border border-white/10 bg-slate-900/50 px-4 py-2.5 text-sm text-white placeholder-slate-600 outline-none focus:border-purple-500/50 transition"
                />
              </div>
              <div>
                <label className="text-xs text-slate-500 mb-1.5 block">Key Requirements</label>
                <textarea
                  value={manualJobRequirements}
                  onChange={(e) => setManualJobRequirements(e.target.value)}
                  placeholder="List the key skills, experience, and qualifications required for this role..."
                  rows={5}
                  className="w-full rounded-xl border border-white/10 bg-slate-900/50 px-4 py-3 text-sm text-white placeholder-slate-600 outline-none focus:border-purple-500/50 resize-none transition"
                />
              </div>
            </div>
          )}

          {/* Position matches */}
          {(loadingMatches || positionMatches) && (
            <div className="rounded-2xl border border-indigo-500/20 bg-indigo-500/5 p-4 space-y-3">
              {loadingMatches ? (
                <div className="flex items-center gap-2 text-slate-400 text-sm">
                  <Loader2 className="w-4 h-4 animate-spin" />Checking existing candidate database...
                </div>
              ) : positionMatches && (
                <>
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <p className="text-sm font-semibold text-indigo-300">
                      {positionMatches.total} previously uploaded CV{positionMatches.total !== 1 ? "s" : ""} match this position
                    </p>
                    <Link
                      href="/recruiter/candidates"
                      className="text-xs text-indigo-400 hover:text-indigo-300 transition underline underline-offset-2"
                    >
                      View matching candidates →
                    </Link>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { label: "Top Ranked", value: positionMatches.categorized.topRanked.length, color: "text-emerald-400" },
                      { label: "Available",  value: positionMatches.categorized.available.length,  color: "text-blue-400"    },
                      { label: "Rejected",   value: positionMatches.categorized.rejected.length,   color: "text-red-400"     },
                      { label: "Hired",      value: positionMatches.categorized.hired.length,      color: "text-amber-400"   },
                    ].map((cat) => (
                      <div key={cat.label} className="rounded-xl bg-black/20 p-2 text-center">
                        <p className={`text-lg font-bold ${cat.color}`}>{cat.value}</p>
                        <p className="text-[10px] text-slate-500">{cat.label}</p>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Skip option */}
          <p className="text-xs text-slate-500 text-center">
            No job context?{" "}
            <button
              onClick={handleAnalyze}
              className="text-slate-400 hover:text-white transition underline underline-offset-2"
            >
              Skip and analyse without role context
            </button>
          </p>

          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={() => setStage("select")}
              className="px-6 py-4 rounded-xl border border-white/10 bg-white/5 text-white font-semibold hover:bg-white/10 transition"
            >
              ← Back
            </button>
            <button
              onClick={handleAnalyze}
              disabled={
                (jobMode === "select" && !selectedJobId) ||
                (jobMode === "manual" && !manualJobTitle.trim())
              }
              className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-purple-600 text-white font-semibold hover:bg-purple-500 transition disabled:opacity-50"
            >
              <Zap className="w-4 h-4" />
              Analyse {selected.size} CV{selected.size !== 1 ? "s" : ""} with AI
            </button>
          </div>
        </div>
      )}

      {/* ── Stage 4: Analyzing ── */}
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
          <p className="text-xs text-slate-500">Please wait — AI is scoring and ranking each candidate</p>
        </div>
      )}

      {/* ── Stage 5: Done ── */}
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
                  {results.filter((r) => r.success).length} of {results.length} CVs analysed · Ranked by ATS score
                </p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: "Analysed", value: results.filter((r) => r.success).length,  color: "text-emerald-400" },
                { label: "Failed",   value: results.filter((r) => !r.success).length, color: "text-red-400"     },
                { label: "Total",    value: results.length,                            color: "text-white"       },
              ].map((stat) => (
                <div key={stat.label} className="text-center">
                  <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                  <p className="text-xs text-slate-500">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Top X filter */}
          {successfulResults.length > 1 && (
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3">
                  <Filter className="w-4 h-4 text-purple-400" />
                  <div>
                    <p className="text-sm font-semibold text-white">Filter Top Candidates</p>
                    <p className="text-xs text-slate-500">Show only the highest ranked applicants</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-slate-400">Show top</span>
                    <input
                      type="number"
                      min={1}
                      max={successfulResults.length}
                      value={topX}
                      onChange={(e) => {
                        const val = parseInt(e.target.value);
                        setTopX(isNaN(val) ? "" : Math.min(val, successfulResults.length));
                      }}
                      placeholder="e.g. 5"
                      className="w-20 rounded-xl border border-white/10 bg-slate-900/50 px-3 py-2 text-sm text-white text-center outline-none focus:border-purple-500/50 transition"
                    />
                    <span className="text-sm text-slate-400">candidates</span>
                  </div>
                  <button
                    onClick={() => {
                      if (!topX || typeof topX !== "number" || topX <= 0) {
                        toast.error("Enter a valid number");
                        return;
                      }
                      setShowTopX(true);
                      toast.success(`Showing top ${topX} candidates`);
                    }}
                    className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-sm font-semibold transition"
                  >
                    Apply
                  </button>
                  {showTopX && (
                    <button
                      onClick={() => { setShowTopX(false); setTopX(0); }}
                      className="px-4 py-2 rounded-xl border border-white/10 bg-white/5 text-slate-400 text-sm font-medium hover:text-white transition"
                    >
                      Show All
                    </button>
                  )}
                </div>
              </div>
              {showTopX && typeof topX === "number" && topX > 0 && (
                <div className="mt-3 flex items-center gap-2 px-3 py-2 rounded-xl bg-purple-500/10 border border-purple-500/20">
                  <Trophy className="w-3.5 h-3.5 text-purple-400" />
                  <p className="text-xs text-purple-300">
                    Showing top {topX} out of {successfulResults.length} candidates by ATS score
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Results list */}
          <div className="space-y-2">
            {displayedResults.map((result, i) => (
              <div
                key={i}
                className={`flex items-center justify-between gap-4 rounded-xl border p-4 ${
                  result.success ? "border-emerald-500/20 bg-emerald-500/5" : "border-red-500/20 bg-red-500/5"
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-7 h-7 rounded-full bg-white/5 flex items-center justify-center shrink-0">
                    <span className="text-xs font-bold text-slate-400">#{i + 1}</span>
                  </div>
                  {result.success
                    ? <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                    : <XCircle    className="w-4 h-4 text-red-400 shrink-0" />}
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-white truncate">
                      {result.success && result.analysis?.candidateName
                        ? result.analysis.candidateName
                        : result.fileName}
                    </p>
                    {result.success && result.analysis && (
                      <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                        <span className="text-xs text-slate-400">
                          ATS <span className="text-white font-medium">{result.analysis.atsScore}/100</span>
                        </span>
                        <span className={`text-xs font-medium ${
                          result.analysis.hiringRecommendation === "Strong Hire" ? "text-emerald-400" :
                          result.analysis.hiringRecommendation === "Hire"        ? "text-blue-400"    :
                          result.analysis.hiringRecommendation === "Maybe"       ? "text-amber-400"   :
                                                                                    "text-red-400"
                        }`}>
                          {result.analysis.hiringRecommendation}
                        </span>
                        {result.analysis.candidateEmail && (
                          <span className="text-xs text-slate-500 flex items-center gap-1">
                            <Mail className="w-3 h-3" />{result.analysis.candidateEmail}
                          </span>
                        )}
                      </div>
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
                    View <ArrowRight className="w-3 h-3" />
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
              <Users className="w-4 h-4" />View All Candidates
            </Link>
            <button
              onClick={resetAll}
              className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-4 rounded-xl border border-white/10 bg-white/5 text-white font-semibold hover:bg-white/10 transition"
            >
              <Upload className="w-4 h-4" />Upload Another ZIP
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
