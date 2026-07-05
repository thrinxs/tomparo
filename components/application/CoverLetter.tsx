"use client";

import { useState, useEffect } from "react";
import {
  FileText,
  Copy,
  Check,
  Download,
  Sparkles,
  Zap,
  Search,
  Brain,
  Target,
  PenLine,
} from "lucide-react";
import toast from "react-hot-toast";

import {
    Document,
    Packer,
    Paragraph,
    TextRun,
    HeadingLevel,
    AlignmentType,
  } from "docx";
  import { saveAs } from "file-saver";

interface CoverLetterProps {
  resumeText: string;
  jobDescription: string;
  disabled?: boolean;
}

export default function CoverLetter({
  resumeText,
  jobDescription,
  disabled = false,
}: CoverLetterProps) {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [editedContent, setEditedContent] = useState("");
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    { icon: Search, label: "Reading your CV", duration: 4 },
    { icon: Target, label: "Analyzing the job", duration: 4 },
    { icon: Brain, label: "Crafting your story", duration: 7 },
    { icon: PenLine, label: "Writing the letter", duration: 5 },
  ];

  const TOTAL_DURATION = 20;

  useEffect(() => {
    if (!loading) {
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
  }, [loading]);

  const generate = async () => {
    setLoading(true);
    setError("");
    setResult(null);
    setProgress(0);
    setCurrentStep(0);

    try {
      const response = await fetch("/api/application/cover-letter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeText, jobDescription }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate");
      }

      setProgress(100);
      setTimeout(() => {
        setResult(data.result);
        setEditedContent(data.result.coverLetter);
      }, 300);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(editedContent);
    setCopied(true);
    toast.success("Cover letter copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadAsDocx = async () => {
    try {
      // Split content into paragraphs
      const paragraphs = editedContent
        .split("\n")
        .filter((line) => line.trim() !== "")
        .map((line) => {
          return new Paragraph({
            children: [
              new TextRun({
                text: line,
                size: 22, // 11pt
                font: "Calibri",
              }),
            ],
            spacing: {
              after: 200,
            },
          });
        });
  
      const doc = new Document({
        creator: "TomParo",
        title: "Cover Letter",
        description: "AI-generated cover letter",
        styles: {
          default: {
            document: {
              run: {
                font: "Calibri",
                size: 22,
              },
            },
          },
        },
        sections: [
          {
            properties: {
              page: {
                margin: {
                  top: 1440,
                  right: 1440,
                  bottom: 1440,
                  left: 1440,
                },
              },
            },
            children: paragraphs,
          },
        ],
      });
  
      const blob = await Packer.toBlob(doc);
      saveAs(blob, "Cover-Letter.docx");
      toast.success("Downloaded as Word document!");
    } catch (error) {
      console.error("Download error:", error);
      toast.error("Failed to download");
    }
  };
  const secondsRemaining = Math.max(
    0,
    Math.ceil(TOTAL_DURATION - (progress / 100) * TOTAL_DURATION)
  );

  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-6 backdrop-blur-xl">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/10 ring-1 ring-emerald-500/20">
            <FileText className="h-5 w-5 text-emerald-400" />
          </div>
          <div>
            <h2 className="font-semibold text-white">Cover Letter</h2>
            <p className="text-sm text-slate-400">
              AI-crafted, personalized to the job
            </p>
          </div>
        </div>

        {result && (
          <div className="text-right">
            <div className="text-2xl font-bold text-emerald-400">
              {result.qualityScore}
            </div>
            <div className="text-xs text-slate-500">quality score</div>
          </div>
        )}
      </div>

      {!result && !loading && (
        <button
          onClick={generate}
          disabled={disabled}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-5 py-3.5 text-sm font-medium text-white shadow-lg shadow-emerald-700/25 transition hover:from-emerald-500 hover:to-teal-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Sparkles className="h-4 w-4" />
          Generate Cover Letter
        </button>
      )}

      {/* Loading with Countdown */}
      {loading && (
        <div className="rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-slate-900/80 to-slate-900/40 p-6 backdrop-blur-xl">
          {/* Timer Circle */}
          <div className="mb-6 flex flex-col items-center">
            <div className="relative flex h-24 w-24 items-center justify-center">
              <svg
                className="absolute -rotate-90"
                width="96"
                height="96"
                viewBox="0 0 96 96"
              >
                <circle
                  cx="48"
                  cy="48"
                  r="42"
                  stroke="rgb(30 41 59)"
                  strokeWidth="6"
                  fill="none"
                />
                <circle
                  cx="48"
                  cy="48"
                  r="42"
                  strokeWidth="6"
                  fill="none"
                  strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 42}
                  strokeDashoffset={
                    2 * Math.PI * 42 - (progress / 100) * (2 * Math.PI * 42)
                  }
                  className="stroke-emerald-500 transition-all duration-100 ease-linear"
                />
              </svg>
              <div className="text-center">
                <div className="text-2xl font-bold text-white">
                  {secondsRemaining}s
                </div>
                <div className="text-[10px] text-slate-500">remaining</div>
              </div>
            </div>

            <h3 className="mt-3 text-sm font-semibold text-white">
              Writing your cover letter
            </h3>
            <p className="mt-1 text-xs text-slate-400">
              Takes about {TOTAL_DURATION} seconds
            </p>
          </div>

          {/* Progress Steps */}
          <div className="space-y-2">
            {steps.map((step, i) => {
              const StepIcon = step.icon;
              const isActive = i === currentStep;
              const isComplete = i < currentStep;

              return (
                <div
                  key={i}
                  className={`flex items-center gap-3 rounded-lg border p-2.5 transition-all ${
                    isActive
                      ? "border-emerald-500/30 bg-emerald-500/10"
                      : isComplete
                        ? "border-emerald-500/20 bg-emerald-500/5"
                        : "border-white/5 bg-slate-900/40"
                  }`}
                >
                  <div
                    className={`flex h-7 w-7 items-center justify-center rounded-lg transition ${
                      isActive
                        ? "bg-emerald-500/20 text-emerald-400"
                        : isComplete
                          ? "bg-emerald-500/20 text-emerald-400"
                          : "bg-slate-800 text-slate-600"
                    }`}
                  >
                    {isComplete ? (
                      <Check className="h-3.5 w-3.5" strokeWidth={3} />
                    ) : isActive ? (
                      <StepIcon className="h-3.5 w-3.5 animate-pulse" />
                    ) : (
                      <StepIcon className="h-3.5 w-3.5" />
                    )}
                  </div>
                  <span
                    className={`text-xs font-medium ${
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

          <div className="mt-4">
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-100 ease-linear"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">
          {error}
        </div>
      )}

      {result && (
        <>
          {result.keyHighlights && result.keyHighlights.length > 0 && (
            <div className="mb-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4">
              <h4 className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-400">
                <Zap className="h-3 w-3" />
                Key Highlights
              </h4>
              <ul className="space-y-1">
                {result.keyHighlights.map((h: string, i: number) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-xs text-slate-300"
                  >
                    <span className="text-emerald-400">•</span>
                    {h}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <textarea
            value={editedContent}
            onChange={(e) => setEditedContent(e.target.value)}
            className="h-96 w-full resize-none rounded-2xl border border-white/10 bg-slate-900/60 p-5 text-sm text-white outline-none transition focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20"
          />

          <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
            <span>{editedContent.length.toLocaleString()} characters</span>
            <span>
              {result.wordCount} words • Tone: {result.tone}
            </span>
          </div>

          <div className="mt-4 flex gap-3">
            <button
              onClick={copyToClipboard}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-white/10"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4 text-emerald-400" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  Copy
                </>
              )}
            </button>

            <button
              onClick={downloadAsDocx}
              className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-white/10"
            >
              <Download className="h-4 w-4" />
              Download
            </button>

            <button
              onClick={generate}
              className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-emerald-700/25 transition hover:bg-emerald-500"
            >
              <Sparkles className="h-4 w-4" />
              Regenerate
            </button>
          </div>
        </>
      )}
    </div>
  );
}