"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  Wand2, Search, AlertCircle, CheckCircle, AlertTriangle,
  ArrowLeft, Loader2, ChevronDown, RotateCcw, Save, Brain, X, Sparkles,
} from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";

interface FieldReview {
  score: number;
  summary: string;
  issues: { type: "error" | "warning" | "suggestion"; title: string; detail: string; fix: string; }[];
  strengths: string[];
  improvedContent: string;
}

const jobTypes = [
  { value: "FULL_TIME", label: "Full Time" },
  { value: "PART_TIME", label: "Part Time" },
  { value: "CONTRACT", label: "Contract" },
  { value: "REMOTE", label: "Remote" },
  { value: "HYBRID", label: "Hybrid" },
];

const issueConfig = {
  error: { icon: AlertCircle, color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/20" },
  warning: { icon: AlertTriangle, color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20" },
  suggestion: { icon: Brain, color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20" },
};

function toSafeString(value: any, field: "description" | "requirements"): string {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) {
    if (field === "requirements") return value.map((r: string) => r.startsWith("-") ? r : `- ${r}`).join("\n");
    return value.join("\n\n");
  }
  return "";
}

function FieldReviewPanel({ review, onApplyFix, onDismiss }: { review: FieldReview; onApplyFix: (improved: string) => void; onDismiss: () => void; }) {
  return (
    <div className="mt-3 rounded-xl border border-blue-500/20 bg-blue-500/5 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="text-center">
            <p className="text-xl font-bold text-white">{review.score}</p>
            <p className="text-xs text-slate-500">score</p>
          </div>
          <p className="text-sm text-slate-300">{review.summary}</p>
        </div>
        <button onClick={onDismiss} className="text-slate-500 hover:text-white transition"><X className="w-4 h-4" /></button>
      </div>
      <div className="h-1.5 w-full rounded-full bg-white/5">
        <div className={`h-1.5 rounded-full transition-all ${review.score >= 80 ? "bg-emerald-500" : review.score >= 60 ? "bg-amber-500" : "bg-red-500"}`} style={{ width: `${review.score}%` }} />
      </div>
      {review.issues?.length > 0 && (
        <div className="space-y-2">
          {review.issues.map((issue, i) => {
            const conf = issueConfig[issue.type] || issueConfig.suggestion;
            const IssueIcon = conf.icon;
            return (
              <div key={i} className={`rounded-lg border ${conf.border} ${conf.bg} p-3`}>
                <div className="flex items-start gap-2">
                  <IssueIcon className={`w-3.5 h-3.5 ${conf.color} shrink-0 mt-0.5`} />
                  <div>
                    <p className={`text-xs font-semibold ${conf.color}`}>{issue.title}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{issue.detail}</p>
                    {issue.fix && <p className="text-xs text-slate-300 mt-1"><span className="text-emerald-400 font-medium">Fix: </span>{issue.fix}</p>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      {review.strengths?.length > 0 && (
        <div className="space-y-1">
          {review.strengths.map((s, i) => (
            <div key={i} className="flex items-start gap-2 text-xs text-slate-300">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />{s}
            </div>
          ))}
        </div>
      )}
      {review.improvedContent && (
        <button onClick={() => onApplyFix(review.improvedContent)} className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-sm font-semibold hover:opacity-90 transition">
          <RotateCcw className="w-3.5 h-3.5" />Auto-Fix This Field
        </button>
      )}
    </div>
  );
}

function AIFieldButton({ hasContent, loading, onGenerate, onReview }: { hasContent: boolean; loading: boolean; onGenerate: () => void; onReview: () => void; }) {
  if (loading) return <div className="flex items-center gap-2 text-xs text-purple-400"><Loader2 className="w-3.5 h-3.5 animate-spin" />{hasContent ? "Reviewing..." : "Writing..."}</div>;
  if (hasContent) return <button type="button" onClick={onReview} className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-400 hover:text-blue-300 transition"><Search className="w-3.5 h-3.5" />Review with AI</button>;
  return <button type="button" onClick={onGenerate} className="inline-flex items-center gap-1.5 text-xs font-medium text-purple-400 hover:text-purple-300 transition"><Sparkles className="w-3.5 h-3.5" />Write with AI</button>;
}

export default function EditJobPage() {
  const router = useRouter();
  const params = useParams();
  const jobId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [requirements, setRequirements] = useState("");
  const [location, setLocation] = useState("");
  const [type, setType] = useState("FULL_TIME");
  const [salaryMin, setSalaryMin] = useState("");
  const [salaryMax, setSalaryMax] = useState("");
  const [deadline, setDeadline] = useState("");
  const [status, setStatus] = useState("DRAFT");
  const [descLoading, setDescLoading] = useState(false);
  const [reqLoading, setReqLoading] = useState(false);
  const [descReview, setDescReview] = useState<FieldReview | null>(null);
  const [reqReview, setReqReview] = useState<FieldReview | null>(null);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchJob = async () => {
      try {
        const res = await fetch("/api/recruiter/jobs");
        const data = await res.json();
        const job = data.jobs?.find((j: any) => j.id === jobId);
        if (!job) { toast.error("Job not found"); router.push("/recruiter/jobs"); return; }
        setTitle(job.title || "");
        setDescription(job.description || "");
        setRequirements(job.requirements || "");
        setLocation(job.location || "");
        setType(job.type || "FULL_TIME");
        setSalaryMin(job.salaryMin ? String(job.salaryMin) : "");
        setSalaryMax(job.salaryMax ? String(job.salaryMax) : "");
        setStatus(job.status || "DRAFT");
        if (job.deadline) setDeadline(new Date(job.deadline).toISOString().split("T")[0]);
      } catch { toast.error("Failed to load job"); }
      finally { setLoading(false); }
    };
    fetchJob();
  }, [jobId]);

  const handleGenerateAll = async () => {
    if (!title.trim()) { toast.error("Enter a job title first"); return; }
    setGenerating(true); setDescReview(null); setReqReview(null);
    try {
      const res = await fetch("/api/recruiter/jobs/generate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      const r = data.result;
      setDescription(toSafeString(r.description, "description"));
      setRequirements(toSafeString(r.requirements, "requirements"));
      if (r.salaryMin) setSalaryMin(String(r.salaryMin));
      if (r.salaryMax) setSalaryMax(String(r.salaryMax));
      if (r.location) setLocation(r.location);
      if (r.type) setType(r.type);
      toast.success("Job description regenerated!");
    } catch (err: any) { toast.error(err.message || "Generation failed"); }
    finally { setGenerating(false); }
  };

  const handleGenerateField = async (field: "description" | "requirements") => {
    if (!title.trim()) { toast.error("Enter a job title first"); return; }
    if (field === "description") setDescLoading(true); else setReqLoading(true);
    try {
      const res = await fetch("/api/recruiter/jobs/generate-field", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ field, title }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      const content = toSafeString(data.result?.content, field);
      if (field === "description") setDescription(content); else setRequirements(content);
      toast.success(`${field === "description" ? "Description" : "Requirements"} written!`);
    } catch (err: any) { toast.error(err.message || "Failed to generate"); }
    finally { if (field === "description") setDescLoading(false); else setReqLoading(false); }
  };

  const handleReviewField = async (field: "description" | "requirements") => {
    const content = field === "description" ? description : requirements;
    if (!title.trim() || !content.trim()) { toast.error("Please fill in the field first"); return; }
    if (field === "description") { setDescLoading(true); setDescReview(null); } else { setReqLoading(true); setReqReview(null); }
    try {
      const res = await fetch("/api/recruiter/jobs/review-field", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ field, content, title }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      if (field === "description") setDescReview(data.review); else setReqReview(data.review);
      toast.success("Review complete!");
    } catch (err: any) { toast.error(err.message || "Review failed"); }
    finally { if (field === "description") setDescLoading(false); else setReqLoading(false); }
  };

  const handleSave = async (saveStatus: "ACTIVE" | "DRAFT") => {
    if (!title.trim() || !description.trim()) { toast.error("Title and description are required"); return; }
    setSaving(true);
    try {
      const res = await fetch(`/api/recruiter/jobs/${jobId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description, requirements, location, type, salaryMin: salaryMin || null, salaryMax: salaryMax || null, deadline: deadline || null, status: saveStatus }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || "Failed to save"); return; }
      toast.success(saveStatus === "ACTIVE" ? "Job published!" : "Draft saved!");
      router.push("/recruiter/jobs");
    } catch { toast.error("Failed to save job"); }
    finally { setSaving(false); }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-slate-500" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">

      <div>
        <Link href="/recruiter/jobs" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition mb-4">
          <ArrowLeft className="w-4 h-4" />Back to Jobs
        </Link>
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Edit Job</h1>
            <p className="text-slate-400 mt-1">Update your job posting — use AI to rewrite or review any section</p>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${status === "ACTIVE" ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : status === "DRAFT" ? "bg-amber-500/10 border-amber-500/20 text-amber-400" : "bg-slate-500/10 border-slate-500/20 text-slate-400"}`}>
            {status}
          </span>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 space-y-4">
        <label className="text-sm font-semibold text-white">Job Title <span className="text-red-400">*</span></label>
        <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Senior React Developer" className="w-full rounded-xl border border-white/10 bg-slate-900/50 px-4 py-3 text-white placeholder-slate-500 outline-none transition focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20" />
        <button onClick={handleGenerateAll} disabled={generating || !title.trim()} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white text-sm font-semibold hover:opacity-90 transition disabled:opacity-50">
          {generating ? <><Loader2 className="w-4 h-4 animate-spin" />Rewriting...</> : <><Wand2 className="w-4 h-4" />Rewrite All Sections with AI</>}
        </button>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-sm font-semibold text-white">Job Description <span className="text-red-400">*</span></label>
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-600">{description.length} chars</span>
            <AIFieldButton hasContent={description.trim().length > 0} loading={descLoading} onGenerate={() => handleGenerateField("description")} onReview={() => handleReviewField("description")} />
          </div>
        </div>
        <textarea value={description} onChange={(e) => { setDescription(e.target.value); setDescReview(null); }} placeholder="Describe the role..." rows={8} className="w-full rounded-xl border border-white/10 bg-slate-900/50 px-4 py-3 text-white placeholder-slate-500 outline-none transition focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 resize-none" />
        {descReview && <FieldReviewPanel review={descReview} onApplyFix={(improved) => { setDescription(toSafeString(improved, "description")); setDescReview(null); toast.success("Description updated!"); }} onDismiss={() => setDescReview(null)} />}
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-sm font-semibold text-white">Requirements</label>
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-600">One per line</span>
            <AIFieldButton hasContent={requirements.trim().length > 0} loading={reqLoading} onGenerate={() => handleGenerateField("requirements")} onReview={() => handleReviewField("requirements")} />
          </div>
        </div>
        <textarea value={requirements} onChange={(e) => { setRequirements(e.target.value); setReqReview(null); }} placeholder="- 3+ years experience..." rows={6} className="w-full rounded-xl border border-white/10 bg-slate-900/50 px-4 py-3 text-white placeholder-slate-500 outline-none transition focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 resize-none" />
        {reqReview && <FieldReviewPanel review={reqReview} onApplyFix={(improved) => { setRequirements(toSafeString(improved, "requirements")); setReqReview(null); toast.success("Requirements updated!"); }} onDismiss={() => setReqReview(null)} />}
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 space-y-5">
        <h2 className="text-sm font-semibold text-white">Job Details</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-2">Location</label>
            <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Lagos, Nigeria" className="w-full rounded-xl border border-white/10 bg-slate-900/50 px-4 py-3 text-white placeholder-slate-500 outline-none transition focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-2">Job Type</label>
            <div className="relative">
              <select value={type} onChange={(e) => setType(e.target.value)} className="w-full appearance-none rounded-xl border border-white/10 bg-slate-900/50 px-4 py-3 text-white outline-none transition focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 text-sm">
                {jobTypes.map((t) => <option key={t.value} value={t.value} className="bg-slate-900">{t.label}</option>)}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-2">Salary Min (₦)</label>
            <input type="number" value={salaryMin} onChange={(e) => setSalaryMin(e.target.value)} placeholder="200000" className="w-full rounded-xl border border-white/10 bg-slate-900/50 px-4 py-3 text-white placeholder-slate-500 outline-none transition focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-2">Salary Max (₦)</label>
            <input type="number" value={salaryMax} onChange={(e) => setSalaryMax(e.target.value)} placeholder="400000" className="w-full rounded-xl border border-white/10 bg-slate-900/50 px-4 py-3 text-white placeholder-slate-500 outline-none transition focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 text-sm" />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-slate-400 mb-2">Application Deadline</label>
            <input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} min={new Date().toISOString().split("T")[0]} className="w-full rounded-xl border border-white/10 bg-slate-900/50 px-4 py-3 text-white outline-none transition focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 text-sm" />
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 pb-8">
        <button onClick={() => handleSave("ACTIVE")} disabled={saving} className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-purple-600 text-white font-semibold hover:bg-purple-500 transition disabled:opacity-50">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}Save & Publish
        </button>
        <button onClick={() => handleSave("DRAFT")} disabled={saving} className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-4 rounded-xl border border-white/10 bg-white/5 text-white font-semibold hover:bg-white/10 transition disabled:opacity-50">
          Save as Draft
        </button>
      </div>
    </div>
  );
}
