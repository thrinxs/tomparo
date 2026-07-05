"use client";

import { useState, useEffect } from "react";
import {
  Mail,
  Copy,
  Check,
  Sparkles,
  Briefcase,
  Rocket,
  Zap,
  Search,
  Brain,
  Target,
  PenLine,
} from "lucide-react";
import toast from "react-hot-toast";

import { Document, Packer, Paragraph, TextRun } from "docx";
import { saveAs } from "file-saver";
import { Download } from "lucide-react";

interface EmailGeneratorProps {
  resumeText: string;
  jobDescription: string;
  disabled?: boolean;
}

type Style = "formal" | "modern" | "concise";

const styles = [
  {
    id: "formal" as Style,
    label: "Formal",
    icon: Briefcase,
    description: "Traditional corporate style",
  },
  {
    id: "modern" as Style,
    label: "Modern",
    icon: Rocket,
    description: "Approachable startup style",
  },
  {
    id: "concise" as Style,
    label: "Concise",
    icon: Zap,
    description: "Brief and direct",
  },
];

export default function EmailGenerator({
  resumeText,
  jobDescription,
  disabled = false,
}: EmailGeneratorProps) {
  const [selectedStyle, setSelectedStyle] = useState<Style>("modern");
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState<"subject" | "email" | null>(null);
  const [editedSubject, setEditedSubject] = useState("");
  const [editedEmail, setEditedEmail] = useState("");
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);

  const generateSteps = [
    { icon: Search, label: "Reading your CV", duration: 3 },
    { icon: Target, label: "Analyzing the job", duration: 3 },
    { icon: Brain, label: "Choosing best angle", duration: 5 },
    { icon: PenLine, label: "Writing the email", duration: 4 },
  ];

  const TOTAL_DURATION = 15;

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
      for (let i = 0; i < generateSteps.length; i++) {
        accumulatedTime += generateSteps[i].duration;
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
      const response = await fetch("/api/application/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resumeText,
          jobDescription,
          style: selectedStyle,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate");
      }

      setProgress(100);
      setTimeout(() => {
        setResult(data.result);
        setEditedSubject(data.result.subject);
        setEditedEmail(data.result.email);
      }, 300);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const copy = (text: string, type: "subject" | "email") => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    toast.success(`${type === "subject" ? "Subject" : "Email"} copied!`);
    setTimeout(() => setCopied(null), 2000);
  };

  const copyAll = () => {
    const full = `Subject: ${editedSubject}\n\n${editedEmail}`;
    navigator.clipboard.writeText(full);
    toast.success("Full email copied!");
  };
    
  const downloadAsDocx = async () => {
    try {
      const paragraphs = [
        // Subject line
        new Paragraph({
          children: [
            new TextRun({
              text: "Subject: ",
              bold: true,
              size: 22,
              font: "Calibri",
            }),
            new TextRun({
              text: editedSubject,
              size: 22,
              font: "Calibri",
            }),
          ],
          spacing: { after: 400 },
        }),
        // Empty line
        new Paragraph({
          children: [new TextRun({ text: "", size: 22 })],
          spacing: { after: 200 },
        }),
      ];
  
      // Add email body paragraphs
      const bodyLines = editedEmail
        .split("\n")
        .filter((line) => line.trim() !== "");
  
      bodyLines.forEach((line) => {
        paragraphs.push(
          new Paragraph({
            children: [
              new TextRun({
                text: line,
                size: 22,
                font: "Calibri",
              }),
            ],
            spacing: { after: 200 },
          })
        );
      });
  
      const doc = new Document({
        creator: "TomParo",
        title: "Application Email",
        description: "AI-generated application email",
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
      saveAs(blob, "Application-Email.docx");
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
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-500/10 ring-1 ring-amber-500/20">
            <Mail className="h-5 w-5 text-amber-400" />
          </div>
          <div>
            <h2 className="font-semibold text-white">Application Email</h2>
            <p className="text-sm text-slate-400">
              Ready-to-send professional emails
            </p>
          </div>
        </div>

        {result && (
          <div className="text-right">
            <div className="text-2xl font-bold text-amber-400">
              {result.qualityScore}
            </div>
            <div className="text-xs text-slate-500">quality score</div>
          </div>
        )}
      </div>

      {/* Style Selector */}
      <div className="mb-4">
        <p className="mb-3 text-xs font-medium uppercase tracking-wider text-slate-400">
          Choose Email Style
        </p>
        <div className="grid grid-cols-3 gap-2">
          {styles.map((style) => {
            const Icon = style.icon;
            const isSelected = selectedStyle === style.id;
            return (
              <button
                key={style.id}
                onClick={() => setSelectedStyle(style.id)}
                disabled={disabled || loading}
                className={`rounded-xl border p-3 transition ${
                  isSelected
                    ? "border-amber-500/30 bg-amber-500/10"
                    : "border-white/10 bg-slate-900/40 hover:border-white/20"
                } disabled:cursor-not-allowed disabled:opacity-50`}
              >
                <Icon
                  className={`mx-auto mb-2 h-5 w-5 ${
                    isSelected ? "text-amber-400" : "text-slate-500"
                  }`}
                />
                <div
                  className={`text-sm font-medium ${
                    isSelected ? "text-white" : "text-slate-400"
                  }`}
                >
                  {style.label}
                </div>
                <div className="mt-0.5 text-xs text-slate-500">
                  {style.description}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {!result && !loading && (
        <button
          onClick={generate}
          disabled={disabled}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 px-5 py-3.5 text-sm font-medium text-white shadow-lg shadow-amber-700/25 transition hover:from-amber-500 hover:to-orange-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Sparkles className="h-4 w-4" />
          Generate Email
        </button>
      )}

      {/* Loading with Countdown */}
      {loading && (
        <div className="rounded-2xl border border-amber-500/20 bg-gradient-to-br from-slate-900/80 to-slate-900/40 p-6 backdrop-blur-xl">
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
                  className="stroke-amber-500 transition-all duration-100 ease-linear"
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
              Writing your email
            </h3>
            <p className="mt-1 text-xs text-slate-400">
              Takes about {TOTAL_DURATION} seconds
            </p>
          </div>

          {/* Progress Steps */}
          <div className="space-y-2">
            {generateSteps.map((step, i) => {
              const StepIcon = step.icon;
              const isActive = i === currentStep;
              const isComplete = i < currentStep;

              return (
                <div
                  key={i}
                  className={`flex items-center gap-3 rounded-lg border p-2.5 transition-all ${
                    isActive
                      ? "border-amber-500/30 bg-amber-500/10"
                      : isComplete
                        ? "border-emerald-500/20 bg-emerald-500/5"
                        : "border-white/5 bg-slate-900/40"
                  }`}
                >
                  <div
                    className={`flex h-7 w-7 items-center justify-center rounded-lg transition ${
                      isActive
                        ? "bg-amber-500/20 text-amber-400"
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
                className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-100 ease-linear"
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
          {/* Subject Line */}
          <div className="mb-4">
            <label className="mb-2 flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-400">
              <span>Subject Line</span>
              <button
                onClick={() => copy(editedSubject, "subject")}
                className="flex items-center gap-1 text-xs text-slate-500 hover:text-white"
              >
                {copied === "subject" ? (
                  <>
                    <Check className="h-3 w-3 text-emerald-400" /> Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3" /> Copy
                  </>
                )}
              </button>
            </label>
            <input
              type="text"
              value={editedSubject}
              onChange={(e) => setEditedSubject(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-slate-900/60 px-4 py-3 text-sm text-white outline-none transition focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/20"
            />
            <p className="mt-1 text-xs text-slate-500">
              {editedSubject.length} characters
            </p>
          </div>

          {/* Email Body */}
          <div className="mb-4">
            <label className="mb-2 flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-400">
              <span>Email Body</span>
              <button
                onClick={() => copy(editedEmail, "email")}
                className="flex items-center gap-1 text-xs text-slate-500 hover:text-white"
              >
                {copied === "email" ? (
                  <>
                    <Check className="h-3 w-3 text-emerald-400" /> Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3" /> Copy
                  </>
                )}
              </button>
            </label>
            <textarea
              value={editedEmail}
              onChange={(e) => setEditedEmail(e.target.value)}
              className="h-72 w-full resize-none rounded-2xl border border-white/10 bg-slate-900/60 p-5 text-sm text-white outline-none transition focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/20"
            />
            <p className="mt-1 text-xs text-slate-500">
              {result.wordCount} words • Tone: {result.tone}
            </p>
          </div>

          {/* Key Points */}
          {result.keyPoints && result.keyPoints.length > 0 && (
            <div className="mb-4 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4">
              <h4 className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-400">
                <Zap className="h-3 w-3" />
                Key Points
              </h4>
              <ul className="space-y-1">
                {result.keyPoints.map((p: string, i: number) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-xs text-slate-300"
                  >
                    <span className="text-amber-400">•</span>
                    {p}
                  </li>
                ))}
              </ul>
            </div>
          )}

<div className="flex gap-2">
  <button
    onClick={copyAll}
    className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-white/10"
  >
    <Copy className="h-4 w-4" />
    Copy All
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
    className="flex items-center justify-center gap-2 rounded-xl bg-amber-600 px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-amber-700/25 transition hover:bg-amber-500"
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