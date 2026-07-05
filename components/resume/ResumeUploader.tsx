"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import {
  FileText,
  Upload,
  X,
  Loader2,
  Type,
  FileCheck2,
  AlertCircle,
} from "lucide-react";

interface ResumeUploaderProps {
  onAnalyze: (text: string, fileName?: string) => void;
  isAnalyzing?: boolean;
}

type InputMode = "upload" | "paste";

export default function ResumeUploader({
  onAnalyze,
  isAnalyzing = false,
}: ResumeUploaderProps) {
  const [mode, setMode] = useState<InputMode>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [fileText, setFileText] = useState("");
  const [pastedText, setPastedText] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const selectedFile = acceptedFiles[0];
    if (!selectedFile) return;

    setError("");
    setUploading(true);
    setFile(selectedFile);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const response = await fetch("/api/resume/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to process file");
      }

      setFileText(data.text);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Upload failed";
      setError(message);
      setFile(null);
    } finally {
      setUploading(false);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "application/msword": [".doc"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        [".docx"],
    },
    maxFiles: 1,
    maxSize: 5 * 1024 * 1024, // 5MB
    disabled: uploading || isAnalyzing,
  });

  const clearFile = () => {
    setFile(null);
    setFileText("");
    setError("");
  };

  const handleAnalyze = () => {
    const text = mode === "upload" ? fileText : pastedText;
    if (!text.trim()) {
      setError(
        mode === "upload"
          ? "Please upload a CV first"
          : "Please paste your CV text"
      );
      return;
    }

    if (text.trim().length < 100) {
      setError("Your CV is too short. Please provide more content.");
      return;
    }

    onAnalyze(text, file?.name);
  };

  const canAnalyze =
    !uploading &&
    !isAnalyzing &&
    ((mode === "upload" && fileText.trim().length > 0) ||
      (mode === "paste" && pastedText.trim().length > 0));

  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-6 backdrop-blur-xl">
      {/* Mode Toggle */}
      <div className="mb-6 inline-flex rounded-xl border border-white/10 bg-slate-900/60 p-1">
        <button
          onClick={() => {
            setMode("upload");
            setError("");
          }}
          disabled={isAnalyzing}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition ${
            mode === "upload"
              ? "bg-blue-600 text-white shadow-lg shadow-blue-700/25"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <Upload className="h-4 w-4" />
          Upload File
        </button>
        <button
          onClick={() => {
            setMode("paste");
            setError("");
          }}
          disabled={isAnalyzing}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition ${
            mode === "paste"
              ? "bg-blue-600 text-white shadow-lg shadow-blue-700/25"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <Type className="h-4 w-4" />
          Paste Text
        </button>
      </div>

      {/* Upload Mode */}
      {mode === "upload" && (
        <div>
          {!file ? (
            <div
              {...getRootProps()}
              className={`relative cursor-pointer rounded-2xl border-2 border-dashed p-12 text-center transition ${
                isDragActive
                  ? "border-blue-500 bg-blue-500/5"
                  : "border-white/10 bg-slate-900/40 hover:border-white/20 hover:bg-slate-900/60"
              } ${uploading ? "pointer-events-none opacity-50" : ""}`}
            >
              <input {...getInputProps()} />

              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-500/10 ring-1 ring-blue-500/20">
                <Upload className="h-6 w-6 text-blue-400" />
              </div>

              {uploading ? (
                <div>
                  <p className="text-base font-medium text-white">
                    Processing your CV...
                  </p>
                  <Loader2 className="mx-auto mt-3 h-5 w-5 animate-spin text-blue-400" />
                </div>
              ) : isDragActive ? (
                <p className="text-base font-medium text-blue-400">
                  Drop your CV here...
                </p>
              ) : (
                <>
                  <p className="text-base font-medium text-white">
                    Drag & drop your CV here, or{" "}
                    <span className="text-blue-400">browse</span>
                  </p>
                  <p className="mt-2 text-sm text-slate-500">
                    PDF, DOC, or DOCX • Max 5MB
                  </p>
                </>
              )}
            </div>
          ) : (
            <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 ring-1 ring-emerald-500/20">
                    <FileCheck2 className="h-6 w-6 text-emerald-400" />
                  </div>
                  <div>
                    <p className="font-medium text-white">{file.name}</p>
                    <p className="mt-1 text-sm text-slate-500">
                      {(file.size / 1024).toFixed(1)} KB •{" "}
                      {fileText.length.toLocaleString()} characters extracted
                    </p>
                    <p className="mt-2 text-xs text-emerald-400">
                      ✓ Ready to analyze
                    </p>
                  </div>
                </div>
                <button
                  onClick={clearFile}
                  disabled={isAnalyzing}
                  className="rounded-lg border border-white/10 bg-white/5 p-2 text-slate-400 transition hover:bg-white/10 hover:text-white disabled:opacity-50"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Paste Mode */}
      {mode === "paste" && (
        <div>
          <textarea
            value={pastedText}
            onChange={(e) => {
              setPastedText(e.target.value);
              setError("");
            }}
            disabled={isAnalyzing}
            placeholder="Paste your CV content here...

Include your name, contact info, work experience, education, skills, and any certifications."
            className="h-72 w-full resize-none rounded-2xl border border-white/10 bg-slate-900/60 p-5 text-sm text-white placeholder-slate-500 outline-none transition focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50"
          />
          <p className="mt-2 text-xs text-slate-500">
            {pastedText.length.toLocaleString()} characters
          </p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mt-4 flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/10 p-4">
          <AlertCircle className="h-5 w-5 shrink-0 text-red-400" />
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {/* Analyze Button */}
      <button
        onClick={handleAnalyze}
        disabled={!canAnalyze}
        className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3.5 text-sm font-medium text-white shadow-lg shadow-blue-700/25 transition hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isAnalyzing ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Analyzing your CV...
          </>
        ) : (
          <>
            <FileText className="h-4 w-4" />
            Analyze My CV
          </>
        )}
      </button>
    </div>
  );
}