"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Briefcase, Plus, RefreshCw, Loader2, Check, X,
  ExternalLink, Trash2, Globe, Building2, Zap,
  ChevronDown, ChevronUp, MapPin, Clock, AlertCircle,
  ScanLine, Search, CheckSquare, Square, MinusSquare,
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

const SOURCE_COLORS: Record<string, string> = {
  ADMIN:    "bg-blue-500/20 text-blue-400 border-blue-500/20",
  ADZUNA:   "bg-purple-500/20 text-purple-400 border-purple-500/20",
  SCRAPED:  "bg-amber-500/20 text-amber-400 border-amber-500/20",
  RECRUITER:"bg-emerald-500/20 text-emerald-400 border-emerald-500/20",
};

const APPROVAL_COLORS: Record<string, string> = {
  PENDING:  "bg-amber-500/20 text-amber-400",
  APPROVED: "bg-emerald-500/20 text-emerald-400",
  REJECTED: "bg-red-500/20 text-red-400",
};

const TYPE_OPTIONS = ["FULL_TIME","PART_TIME","CONTRACT","REMOTE","HYBRID"];

const COUNTRIES = [
  ["gb","UK"],["us","USA"],["ca","Canada"],["au","Australia"],
  ["za","South Africa"],["de","Germany"],["fr","France"],
  ["in","India"],["br","Brazil"],["sg","Singapore"],
  ["nl","Netherlands"],["at","Austria"],["pl","Poland"],["nz","New Zealand"],
];

export default function AdminJobsPage() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"all"|"pending"|"approved"|"rejected">("pending");
  const [sourceFilter, setSourceFilter] = useState("");
  const [expandedJob, setExpandedJob] = useState<string|null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string|null>(null);

  // Bulk selection
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);

  // New job form
  const [showForm, setShowForm] = useState(false);
  const [formTitle, setFormTitle] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formLocation, setFormLocation] = useState("");
  const [formType, setFormType] = useState("FULL_TIME");
  const [formSalaryMin, setFormSalaryMin] = useState("");
  const [formSalaryMax, setFormSalaryMax] = useState("");
  const [formDeadline, setFormDeadline] = useState("");
  const [formExtUrl, setFormExtUrl] = useState("");
  const [formSourceCompany, setFormSourceCompany] = useState("");
  const [formSubmitting, setFormSubmitting] = useState(false);

  // Adzuna
  const [adzunaKeyword, setAdzunaKeyword] = useState("software engineer");
  const [adzunaCountry, setAdzunaCountry] = useState("gb");
  const [adzunaPages, setAdzunaPages] = useState("2");
  const [adzunaLoading, setAdzunaLoading] = useState(false);

  // Scraper
  const [scrapeUrl, setScrapeUrl] = useState("");
  const [scrapeCompany, setScrapeCompany] = useState("");
  const [scrapeLoading, setScrapeLoading] = useState(false);
  const [findingUrl, setFindingUrl] = useState(false);
  const [sources, setSources] = useState<any[]>([]);

  // Batch URLs
  const [batchUrls, setBatchUrls] = useState("");
  const [batchLoading, setBatchLoading] = useState(false);
  const [batchResults, setBatchResults] = useState<any[]>([]);

  // Paste extract
  const [pasteText, setPasteText] = useState("");
  const [pasteLoading, setPasteLoading] = useState(false);
  const [pastedJobs, setPastedJobs] = useState<any[]>([]);
  const [savingPasted, setSavingPasted] = useState(false);

  // Cleanup
  const [cleanupLoading, setCleanupLoading] = useState(false);

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    setSelected(new Set());
    try {
      const params = new URLSearchParams();
      if (tab !== "all") params.set("approvalStatus", tab.toUpperCase());
      if (sourceFilter) params.set("source", sourceFilter);
      const res = await fetch(`/api/admin/jobs?${params}`);
      const data = await res.json();
      if (data.success) { setJobs(data.jobs); setTotal(data.total); }
    } catch { toast.error("Failed to load jobs"); }
    finally { setLoading(false); }
  }, [tab, sourceFilter]);

  const fetchSources = useCallback(async () => {
    const res = await fetch("/api/admin/jobs/scrape");
    const data = await res.json();
    if (data.success) setSources(data.sources);
  }, []);

  useEffect(() => { fetchJobs(); }, [fetchJobs]);
  useEffect(() => { fetchSources(); }, [fetchSources]);

  // ── Selection helpers ──
  const allSelected = jobs.length > 0 && selected.size === jobs.length;
  const someSelected = selected.size > 0 && !allSelected;

  const toggleAll = () => {
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(jobs.map((j) => j.id)));
    }
  };

  const toggleOne = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  // ── Bulk actions ──
  const bulkAction = async (action: "approve" | "reject" | "delete") => {
    if (!selected.size) return;
    setBulkLoading(true);

    const ids = Array.from(selected);
    let success = 0;

    for (const jobId of ids) {
      try {
        if (action === "delete") {
          const res = await fetch("/api/admin/jobs", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ jobId }),
          });
          if ((await res.json()).success) success++;
        } else {
          const res = await fetch("/api/admin/jobs", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              jobId,
              approvalStatus: action === "approve" ? "APPROVED" : "REJECTED",
            }),
          });
          if ((await res.json()).success) success++;
        }
      } catch { /* continue */ }
    }

    toast.success(`${success} job${success !== 1 ? "s" : ""} ${action}d`);
    setBulkLoading(false);
    fetchJobs();
  };

  // ── Single actions ──
  const handleApprove = async (jobId: string) => {
    setActionLoadingId(jobId);
    const res = await fetch("/api/admin/jobs", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jobId, approvalStatus: "APPROVED" }),
    });
    if ((await res.json()).success) { toast.success("Approved!"); fetchJobs(); }
    setActionLoadingId(null);
  };

  const handleReject = async (jobId: string) => {
    setActionLoadingId(jobId);
    const res = await fetch("/api/admin/jobs", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jobId, approvalStatus: "REJECTED" }),
    });
    if ((await res.json()).success) { toast.success("Rejected"); fetchJobs(); }
    setActionLoadingId(null);
  };

  const handleDelete = async (jobId: string) => {
    if (!confirm("Delete this job permanently?")) return;
    setActionLoadingId(jobId);
    const res = await fetch("/api/admin/jobs", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jobId }),
    });
    if ((await res.json()).success) { toast.success("Deleted"); fetchJobs(); }
    setActionLoadingId(null);
  };

  const handlePostJob = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitting(true);
    const res = await fetch("/api/admin/jobs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: formTitle, description: formDesc,
        location: formLocation, type: formType,
        salaryMin: formSalaryMin, salaryMax: formSalaryMax,
        deadline: formDeadline, externalUrl: formExtUrl,
        sourceCompanyName: formSourceCompany,
      }),
    });
    const data = await res.json();
    if (data.success) {
      toast.success("Job posted!");
      setShowForm(false);
      setFormTitle(""); setFormDesc(""); setFormLocation("");
      fetchJobs();
    } else {
      toast.error(data.error || "Failed");
    }
    setFormSubmitting(false);
  };

  const handleAdzunaFetch = async () => {
    setAdzunaLoading(true);
    toast.loading("Fetching from Adzuna...", { id: "adzuna" });
    const res = await fetch("/api/admin/jobs/adzuna", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ keyword: adzunaKeyword, country: adzunaCountry, pages: parseInt(adzunaPages) }),
    });
    const data = await res.json();
    if (data.success) {
      toast.success(`Imported ${data.imported} jobs (${data.skipped} skipped)`, { id: "adzuna" });
      fetchJobs();
    } else {
      toast.error(data.error || "Failed", { id: "adzuna" });
    }
    setAdzunaLoading(false);
  };

  // Find career URL from company name
  const handleFindUrl = async () => {
    if (!scrapeCompany.trim()) { toast.error("Enter a company name first"); return; }
    setFindingUrl(true);
    toast.loading(`Finding career page for ${scrapeCompany}...`, { id: "find-url" });
    try {
      const res = await fetch("/api/admin/jobs/find-careers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyName: scrapeCompany }),
      });
      const data = await res.json();
      if (data.success) {
        setScrapeUrl(data.url);
        toast.success("Career page found!", { id: "find-url" });
      } else {
        toast.error(data.error || "Could not find career page", { id: "find-url" });
      }
    } catch {
      toast.error("Network error", { id: "find-url" });
    }
    setFindingUrl(false);
  };

  const handleScrape = async () => {
    if (!scrapeUrl) { toast.error("URL is required"); return; }
    setScrapeLoading(true);
    const displayName = scrapeCompany || new URL(scrapeUrl).hostname.replace("www.", "");
    toast.loading(`Scraping ${displayName}...`, { id: "scrape" });
    const res = await fetch("/api/admin/jobs/scrape", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: scrapeUrl, companyName: scrapeCompany || null }),
    });
    const data = await res.json();
    if (data.success) {
      toast.success(`Found ${data.imported} new jobs`, { id: "scrape" });
      setScrapeUrl(""); setScrapeCompany("");
      fetchJobs(); fetchSources();
    } else {
      toast.error(data.error || "Failed to scrape", { id: "scrape" });
    }
    setScrapeLoading(false);
  };

  const handleBatchScrape = async () => {
    const urls = batchUrls.split("\n").map((u) => u.trim()).filter((u) => u.startsWith("http"));
    if (!urls.length) { toast.error("Enter at least one valid URL"); return; }
    setBatchLoading(true);
    setBatchResults([]);
    toast.loading(`Scraping ${urls.length} URLs...`, { id: "batch" });
    try {
      const res = await fetch("/api/admin/jobs/scrape-batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ urls }),
      });
      const data = await res.json();
      if (data.success) {
        setBatchResults(data.results);
        toast.success(`Done! ${data.totalImported} jobs imported from ${data.totalUrls} URLs`, { id: "batch" });
        fetchJobs();
      } else {
        toast.error(data.error || "Failed", { id: "batch" });
      }
    } catch {
      toast.error("Network error", { id: "batch" });
    }
    setBatchLoading(false);
  };

  const handlePasteExtract = async () => {
    if (!pasteText.trim()) { toast.error("Paste some job information first"); return; }
    setPasteLoading(true);
    setPastedJobs([]);
    toast.loading("Extracting jobs from text...", { id: "paste" });
    try {
      const res = await fetch("/api/admin/jobs/paste-extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: pasteText }),
      });
      const data = await res.json();
      if (data.success) {
        setPastedJobs(data.jobs);
        if (data.jobs.length === 0) {
          toast.error("No job listings found in the text", { id: "paste" });
        } else {
          toast.success(`Found ${data.jobs.length} job${data.jobs.length !== 1 ? "s" : ""}! Review and save below.`, { id: "paste" });
        }
      } else {
        toast.error(data.error || "Failed", { id: "paste" });
      }
    } catch {
      toast.error("Network error", { id: "paste" });
    }
    setPasteLoading(false);
  };

  const handleSavePasted = async () => {
    if (!pastedJobs.length) return;
    setSavingPasted(true);
    try {
      const res = await fetch("/api/admin/jobs/save-extracted", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobs: pastedJobs }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`${data.saved} jobs saved to pending queue!`);
        setPastedJobs([]);
        setPasteText("");
        fetchJobs();
      } else {
        toast.error(data.error || "Failed to save");
      }
    } catch {
      toast.error("Network error");
    }
    setSavingPasted(false);
  };

  const handleCleanup = async () => {
    setCleanupLoading(true);
    const secret = prompt("Enter first 16 chars of NEXTAUTH_SECRET:");
    if (!secret) { setCleanupLoading(false); return; }
    const res = await fetch("/api/admin/jobs/cleanup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ secret }),
    });
    const data = await res.json();
    if (data.success) toast.success(data.message);
    else toast.error(data.error || "Failed");
    setCleanupLoading(false);
    fetchJobs();
  };

  const inputClass = "w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-2.5 text-sm text-white outline-none placeholder:text-slate-500 focus:border-blue-500/40";

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <Toaster position="top-right" />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Job Management</h1>
          <p className="mt-1 text-sm text-slate-400">Post, approve, and manage all job listings</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleCleanup} disabled={cleanupLoading}
            className="inline-flex items-center gap-2 rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-2 text-sm text-amber-400 hover:bg-amber-500/20 transition disabled:opacity-50">
            <Clock className="h-4 w-4" />Expire Deadlines
          </button>
          <button onClick={() => setShowForm(!showForm)}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 transition">
            <Plus className="h-4 w-4" />Post Job
          </button>
        </div>
      </div>

      {/* Post Job Form */}
      {showForm && (
        <div className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-6">
          <h2 className="text-base font-semibold text-white mb-4">Post New Job</h2>
          <form onSubmit={handlePostJob} className="grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="text-xs text-slate-400 mb-1 block">Job Title *</label>
              <input value={formTitle} onChange={(e) => setFormTitle(e.target.value)} required className={inputClass} placeholder="e.g. Senior Software Engineer" />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs text-slate-400 mb-1 block">Description *</label>
              <textarea value={formDesc} onChange={(e) => setFormDesc(e.target.value)} required rows={4} className={`${inputClass} resize-none`} placeholder="Full job description..." />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Location</label>
              <input value={formLocation} onChange={(e) => setFormLocation(e.target.value)} className={inputClass} placeholder="Lagos, Nigeria / Remote" />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Job Type</label>
              <select value={formType} onChange={(e) => setFormType(e.target.value)} className={inputClass}>
                {TYPE_OPTIONS.map((t) => <option key={t} value={t}>{t.replace("_", " ")}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Min Salary</label>
              <input value={formSalaryMin} onChange={(e) => setFormSalaryMin(e.target.value)} className={inputClass} placeholder="e.g. 200000" type="number" />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Max Salary</label>
              <input value={formSalaryMax} onChange={(e) => setFormSalaryMax(e.target.value)} className={inputClass} placeholder="e.g. 500000" type="number" />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Application Deadline</label>
              <input value={formDeadline} onChange={(e) => setFormDeadline(e.target.value)} className={inputClass} type="date" />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">External Apply URL</label>
              <input value={formExtUrl} onChange={(e) => setFormExtUrl(e.target.value)} className={inputClass} placeholder="https://company.com/apply" />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Source Company (if external)</label>
              <input value={formSourceCompany} onChange={(e) => setFormSourceCompany(e.target.value)} className={inputClass} placeholder="Leave blank for TomParo Featured" />
            </div>
            <div className="sm:col-span-2 flex gap-2 justify-end">
              <button type="button" onClick={() => setShowForm(false)} className="rounded-xl border border-white/10 px-4 py-2 text-sm text-slate-400 hover:text-white transition">Cancel</button>
              <button type="submit" disabled={formSubmitting} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-500 transition disabled:opacity-50">
                {formSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}Post Job
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Adzuna + Scraper */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Adzuna */}
        <div className="rounded-2xl border border-purple-500/20 bg-purple-500/5 p-5">
          <div className="flex items-center gap-2 mb-3">
            <Globe className="h-4 w-4 text-purple-400" />
            <p className="text-sm font-semibold text-white">Fetch from Adzuna</p>
            <span className="text-xs text-slate-500">(Global job boards)</span>
          </div>
          <div className="space-y-2">
            <input value={adzunaKeyword} onChange={(e) => setAdzunaKeyword(e.target.value)}
              className={inputClass} placeholder="Keyword (e.g. software engineer)" />
            <div className="grid grid-cols-2 gap-2">
              <select value={adzunaCountry} onChange={(e) => setAdzunaCountry(e.target.value)} className={inputClass}>
                {COUNTRIES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
              <select value={adzunaPages} onChange={(e) => setAdzunaPages(e.target.value)} className={inputClass}>
                {["1","2","3","4","5"].map((p) => <option key={p} value={p}>{p} page{p !== "1" ? "s" : ""} ({parseInt(p) * 20} jobs)</option>)}
              </select>
            </div>
            <button onClick={handleAdzunaFetch} disabled={adzunaLoading}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-500 transition disabled:opacity-50">
              {adzunaLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
              Fetch Jobs
            </button>
          </div>
        </div>

        {/* Firecrawl scraper */}
        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-5">
          <div className="flex items-center gap-2 mb-3">
            <ScanLine className="h-4 w-4 text-amber-400" />
            <p className="text-sm font-semibold text-white">Scrape Career Page</p>
            <span className="text-xs text-slate-500">(URL or name)</span>
          </div>
          <div className="space-y-2">
            {/* Company name with auto-find */}
            <div className="flex gap-2">
              <input value={scrapeCompany} onChange={(e) => setScrapeCompany(e.target.value)}
                className={inputClass} placeholder="Company name (optional — auto-detected from URL)" />
              <button onClick={handleFindUrl} disabled={findingUrl || !scrapeCompany.trim()}
                title="Auto-find career page URL from company name"
                className="shrink-0 rounded-xl border border-amber-500/20 bg-amber-500/10 px-3 text-amber-400 hover:bg-amber-500/20 transition disabled:opacity-40">
                {findingUrl ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              </button>
            </div>

            {/* URL */}
            <input value={scrapeUrl} onChange={(e) => setScrapeUrl(e.target.value)}
              className={inputClass} placeholder="Career page URL (required — or click 🔍 to find from name)" />

            <p className="text-[10px] text-slate-500">
              💡 Enter company name → click 🔍 to auto-find URL, or paste URL directly (name is optional)
            </p>

            <button onClick={handleScrape} disabled={scrapeLoading || !scrapeUrl}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-500 transition disabled:opacity-50">
              {scrapeLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ScanLine className="h-4 w-4" />}
              Scrape & Extract Jobs
            </button>
          </div>

          {sources.length > 0 && (
            <div className="mt-3 space-y-1.5 border-t border-white/5 pt-3">
              <p className="text-xs text-slate-500 font-medium">Recently scraped</p>
              {sources.slice(0, 4).map((s) => (
                <div key={s.id} className="flex items-center justify-between text-xs">
                  <span className="text-slate-300 truncate">{s.companyName}</span>
                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    <span className="text-slate-500">{s.jobsFound} jobs</span>
                    <button onClick={() => { setScrapeCompany(s.companyName); setScrapeUrl(s.careerUrl); }}
                      className="text-amber-400 hover:text-amber-300 text-[10px]">Re-scan</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Batch URL scraper */}
      <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-5">
        <div className="flex items-center gap-2 mb-3">
          <Globe className="h-4 w-4 text-cyan-400" />
          <p className="text-sm font-semibold text-white">Batch Scrape — Multiple URLs</p>
          <span className="text-xs text-slate-500">(up to 20 at once)</span>
        </div>
        <div className="space-y-2">
          <textarea
            value={batchUrls}
            onChange={(e) => setBatchUrls(e.target.value)}
            rows={5}
            className={`${inputClass} resize-none font-mono text-xs`}
            placeholder={"Paste one URL per line:\nhttps://flutterwave.com/ng/careers\nhttps://paystack.com/careers\nhttps://kuda.com/en-ng/careers\nhttps://andela.com/open-roles"}
          />
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500">
              {batchUrls.split("\n").filter((u) => u.trim().startsWith("http")).length} valid URLs detected
            </span>
            <button onClick={handleBatchScrape} disabled={batchLoading}
              className="inline-flex items-center gap-2 rounded-xl bg-cyan-600 px-4 py-2 text-sm font-medium text-white hover:bg-cyan-500 transition disabled:opacity-50">
              {batchLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ScanLine className="h-4 w-4" />}
              Scrape All
            </button>
          </div>
          {batchResults.length > 0 && (
            <div className="mt-2 space-y-1.5 border-t border-white/5 pt-3">
              {batchResults.map((r, i) => (
                <div key={i} className="flex items-center justify-between text-xs rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2">
                  <span className="text-slate-300 truncate">{r.company}</span>
                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    {r.error ? (
                      <span className="text-red-400">{r.error}</span>
                    ) : (
                      <span className="text-emerald-400">+{r.imported} jobs</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Paste & Extract */}
      <div className="rounded-2xl border border-pink-500/20 bg-pink-500/5 p-5">
        <div className="flex items-center gap-2 mb-3">
          <Briefcase className="h-4 w-4 text-pink-400" />
          <p className="text-sm font-semibold text-white">Paste Job Data</p>
          <span className="text-xs text-slate-500">(AI extracts + enriches from web)</span>
        </div>
        <div className="space-y-2">
          <textarea
            value={pasteText}
            onChange={(e) => setPasteText(e.target.value)}
            rows={5}
            className={`${inputClass} resize-none text-xs`}
            placeholder="Paste any job information here — copied from a website, WhatsApp, email, PDF, anywhere. AI will extract the job listings, clean them up, and search the web for more details."
          />
          <button onClick={handlePasteExtract} disabled={pasteLoading || !pasteText.trim()}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-pink-600 px-4 py-2 text-sm font-medium text-white hover:bg-pink-500 transition disabled:opacity-50">
            {pasteLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
            Extract & Enrich Jobs
          </button>
        </div>

        {pastedJobs.length > 0 && (
          <div className="mt-4 space-y-3 border-t border-white/5 pt-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-white">{pastedJobs.length} job{pastedJobs.length !== 1 ? "s" : ""} extracted</p>
              <button onClick={handleSavePasted} disabled={savingPasted}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 transition disabled:opacity-50">
                {savingPasted ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                Save All to Pending
              </button>
            </div>
            {pastedJobs.map((job, i) => (
              <div key={i} className="rounded-xl border border-white/5 bg-white/[0.02] p-3 space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-white">{job.title}</p>
                  <span className="text-xs text-slate-500 shrink-0">{job.type?.replace("_", " ")}</span>
                </div>
                {job.company && <p className="text-xs text-pink-400">{job.company}</p>}
                {job.location && <p className="text-xs text-slate-500">{job.location}</p>}
                <p className="text-xs text-slate-400 line-clamp-3">{job.description}</p>
                {job._enriched && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[10px] text-emerald-400">
                    <Zap className="h-2.5 w-2.5" /> Web-enriched
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tabs + Filter */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex rounded-xl border border-white/10 bg-white/[0.02] p-1">
          {(["pending","approved","rejected","all"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition capitalize ${tab === t ? "bg-white/10 text-white" : "text-slate-400 hover:text-white"}`}>
              {t}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <select value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value)}
            className="rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-sm text-white outline-none">
            <option value="">All Sources</option>
            <option value="ADMIN">Admin</option>
            <option value="ADZUNA">Adzuna</option>
            <option value="SCRAPED">Scraped</option>
            <option value="RECRUITER">Recruiter</option>
          </select>
          <button onClick={fetchJobs} disabled={loading}
            className="rounded-xl border border-white/10 bg-white/5 p-2 text-slate-400 hover:text-white transition">
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-900 px-4 py-3">
          <span className="text-sm text-white font-medium">{selected.size} selected</span>
          <div className="flex items-center gap-2 ml-auto">
            <button onClick={() => bulkAction("approve")} disabled={bulkLoading}
              className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-400 hover:bg-emerald-500/20 transition disabled:opacity-50">
              {bulkLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
              Approve All
            </button>
            <button onClick={() => bulkAction("reject")} disabled={bulkLoading}
              className="inline-flex items-center gap-1.5 rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-2 text-sm text-amber-400 hover:bg-amber-500/20 transition disabled:opacity-50">
              <X className="h-3.5 w-3.5" />Reject All
            </button>
            <button onClick={() => { if (confirm(`Delete ${selected.size} jobs?`)) bulkAction("delete"); }} disabled={bulkLoading}
              className="inline-flex items-center gap-1.5 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-2 text-sm text-red-400 hover:bg-red-500/20 transition disabled:opacity-50">
              <Trash2 className="h-3.5 w-3.5" />Delete All
            </button>
            <button onClick={() => setSelected(new Set())}
              className="text-slate-500 hover:text-white transition text-sm">Clear</button>
          </div>
        </div>
      )}

      <p className="text-xs text-slate-500">{total} job{total !== 1 ? "s" : ""} found</p>

      {/* Jobs list */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-slate-500" />
        </div>
      ) : jobs.length === 0 ? (
        <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-10 text-center text-slate-500">
          No jobs found in this category
        </div>
      ) : (
        <div className="space-y-2">
          {/* Select all row */}
          <div className="flex items-center gap-3 px-4 py-2">
            <button onClick={toggleAll} className="text-slate-400 hover:text-white transition shrink-0">
              {allSelected ? (
                <CheckSquare className="h-4 w-4 text-blue-400" />
              ) : someSelected ? (
                <MinusSquare className="h-4 w-4 text-blue-400" />
              ) : (
                <Square className="h-4 w-4" />
              )}
            </button>
            <span className="text-xs text-slate-500">
              {allSelected ? "Deselect all" : `Select all ${jobs.length} jobs`}
            </span>
          </div>

          {jobs.map((job) => {
            const expanded = expandedJob === job.id;
            const isSelected = selected.has(job.id);

            return (
              <div key={job.id}
                className={`rounded-2xl border bg-white/[0.02] overflow-visible transition ${isSelected ? "border-blue-500/30 bg-blue-500/5" : "border-white/5"}`}>
                <div className="flex items-start gap-3 p-4">
                  {/* Checkbox */}
                  <button onClick={() => toggleOne(job.id)} className="mt-1 text-slate-400 hover:text-blue-400 transition shrink-0">
                    {isSelected ? <CheckSquare className="h-4 w-4 text-blue-400" /> : <Square className="h-4 w-4" />}
                  </button>

                  {/* Company avatar */}
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/5 border border-white/10 text-sm font-bold text-white">
                    {(job.sourceCompanyName || job.recruiter?.companyName || "T")[0]}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-white truncate">{job.title}</p>
                      <span className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${SOURCE_COLORS[job.source] ?? "bg-slate-500/20 text-slate-400"}`}>
                        {job.source}
                      </span>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${APPROVAL_COLORS[job.approvalStatus] ?? ""}`}>
                        {job.approvalStatus}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-slate-500">
                      <span>{job.sourceCompanyName || job.recruiter?.companyName}</span>
                      {job.location && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{job.location}</span>}
                      {job.deadline && (
                        <span className={`flex items-center gap-1 ${new Date(job.deadline) < new Date() ? "text-red-400" : ""}`}>
                          <AlertCircle className="h-3 w-3" />
                          {new Date(job.deadline) < new Date() ? "Expired: " : "Deadline: "}
                          {new Date(job.deadline).toLocaleDateString("en-NG")}
                        </span>
                      )}
                      <span>{job._count?.applications ?? 0} applications</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    {job.approvalStatus === "PENDING" && (
                      <>
                        <button onClick={() => handleApprove(job.id)} disabled={actionLoadingId === job.id}
                          className="inline-flex items-center gap-1 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1.5 text-xs text-emerald-400 hover:bg-emerald-500/20 transition disabled:opacity-50">
                          {actionLoadingId === job.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                          Approve
                        </button>
                        <button onClick={() => handleReject(job.id)} disabled={actionLoadingId === job.id}
                          className="inline-flex items-center gap-1 rounded-lg border border-red-500/20 bg-red-500/10 px-2.5 py-1.5 text-xs text-red-400 hover:bg-red-500/20 transition disabled:opacity-50">
                          <X className="h-3 w-3" />Reject
                        </button>
                      </>
                    )}
                    {job.approvalStatus === "APPROVED" && (
                      <button onClick={() => handleReject(job.id)} disabled={actionLoadingId === job.id}
                        className="rounded-lg border border-amber-500/20 bg-amber-500/10 px-2.5 py-1.5 text-xs text-amber-400 hover:bg-amber-500/20 transition disabled:opacity-50">
                        Unpublish
                      </button>
                    )}
                    {job.approvalStatus === "REJECTED" && (
                      <button onClick={() => handleApprove(job.id)} disabled={actionLoadingId === job.id}
                        className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1.5 text-xs text-emerald-400 hover:bg-emerald-500/20 transition disabled:opacity-50">
                        Re-approve
                      </button>
                    )}
                    {job.externalUrl && (
                      <a href={job.externalUrl} target="_blank" rel="noopener noreferrer"
                        className="rounded-lg border border-white/10 bg-white/5 p-1.5 text-slate-400 hover:text-white transition">
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    )}
                    <button onClick={() => handleDelete(job.id)} disabled={actionLoadingId === job.id}
                      className="rounded-lg border border-red-500/20 bg-red-500/10 p-1.5 text-red-400 hover:bg-red-500/20 transition">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => setExpandedJob(expanded ? null : job.id)}
                      className="rounded-lg border border-white/10 bg-white/5 p-1.5 text-slate-400 hover:text-white transition">
                      {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {expanded && (
                  <div className="border-t border-white/5 bg-white/[0.01] p-4 space-y-2">
                    <p className="text-xs text-slate-300 leading-relaxed line-clamp-6">{job.description}</p>
                    {job.scrapedFrom && (
                      <p className="text-xs text-slate-500">Scraped from: <a href={job.scrapedFrom} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">{job.scrapedFrom}</a></p>
                    )}
                    <p className="text-[10px] text-slate-600 font-mono">ID: {job.id}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
