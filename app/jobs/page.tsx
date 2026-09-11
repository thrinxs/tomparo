"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Search, MapPin, Briefcase, Clock, Filter,
  Building2, ArrowRight, Loader2, SlidersHorizontal,
  ChevronLeft, ChevronRight, Star, Zap, X,
} from "lucide-react";

const TYPE_OPTIONS = [
  { value: "", label: "All Types" },
  { value: "FULL_TIME", label: "Full Time" },
  { value: "PART_TIME", label: "Part Time" },
  { value: "CONTRACT", label: "Contract" },
  { value: "REMOTE", label: "Remote" },
  { value: "HYBRID", label: "Hybrid" },
];

const SALARY_OPTIONS = [
  { value: "", label: "Any Salary" },
  { value: "entry", label: "Entry (≤ ₦200k)" },
  { value: "mid", label: "Mid (₦200k–500k)" },
  { value: "senior", label: "Senior (≥ ₦500k)" },
];

const TYPE_COLORS: Record<string, string> = {
  FULL_TIME: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  PART_TIME: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  CONTRACT:  "bg-amber-500/10 text-amber-400 border-amber-500/20",
  REMOTE:    "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  HYBRID:    "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
};

const TYPE_LABELS: Record<string, string> = {
  FULL_TIME: "Full Time",
  PART_TIME: "Part Time",
  CONTRACT: "Contract",
  REMOTE: "Remote",
  HYBRID: "Hybrid",
};

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

function formatSalary(min?: number | null, max?: number | null, currency?: string | null) {
  if (!min && !max) return null;
  const fmt = (n: number) => n >= 1000000
    ? `₦${(n / 1000000).toFixed(1)}M`
    : `₦${(n / 1000).toFixed(0)}k`;
  if (min && max) return `${fmt(min)} – ${fmt(max)}`;
  if (min) return `From ${fmt(min)}`;
  if (max) return `Up to ${fmt(max)}`;
  return null;
}

function JobCard({ job }: { job: any }) {
  const salary = formatSalary(job.salaryMin, job.salaryMax, job.salaryCurrency);
  const slug = job.jobSlug || job.title.toLowerCase().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").slice(0, 60);

  return (
    <Link
      href={`/jobs/${job.recruiter.companySlug}/${slug}`}
      className="group flex flex-col rounded-2xl border border-white/5 bg-white/[0.02] p-5 transition hover:border-blue-500/20 hover:bg-white/[0.04]"
    >
      {/* Company + type */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-sm font-bold text-white">
            {job.recruiter.companyName[0]}
          </div>
          <div>
            <p className="text-xs text-slate-400">{job.recruiter.companyName}</p>
            {job.recruiter.industry && (
              <p className="text-[10px] text-slate-600">{job.recruiter.industry}</p>
            )}
          </div>
        </div>
        <span className={`shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-medium ${TYPE_COLORS[job.type] ?? "bg-slate-500/20 text-slate-400"}`}>
          {TYPE_LABELS[job.type] ?? job.type}
        </span>
      </div>

      {/* Title */}
      <h3 className="text-base font-semibold text-white group-hover:text-blue-400 transition mb-2 line-clamp-2">
        {job.title}
      </h3>

      {/* Description preview */}
      <p className="text-xs text-slate-500 line-clamp-2 mb-3 flex-1">
        {job.description?.replace(/<[^>]*>/g, "").slice(0, 150)}
      </p>

      {/* Meta */}
      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
        {job.location && (
          <span className="flex items-center gap-1">
            <MapPin className="h-3 w-3" />{job.location}
          </span>
        )}
        {salary && (
          <span className="flex items-center gap-1">
            <Briefcase className="h-3 w-3" />{salary}
          </span>
        )}
        <span className="flex items-center gap-1 ml-auto">
          <Clock className="h-3 w-3" />{timeAgo(job.createdAt)}
        </span>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/5">
        <span className="text-xs text-slate-600">
          {job._count?.applications ?? 0} applicant{job._count?.applications !== 1 ? "s" : ""}
        </span>
        <span className="flex items-center gap-1 text-xs text-blue-400 opacity-0 group-hover:opacity-100 transition">
          View job <ArrowRight className="h-3 w-3" />
        </span>
      </div>
    </Link>
  );
}

export default function JobsPage() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const [query, setQuery] = useState("");
  const [type, setType] = useState("");
  const [location, setLocation] = useState("");
  const [salary, setSalary] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const fetchJobs = useCallback(async (p = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (query) params.set("q", query);
      if (type) params.set("type", type);
      if (location) params.set("location", location);
      if (salary) params.set("salary", salary);
      params.set("page", String(p));

      const res = await fetch(`/api/jobs?${params}`);
      const data = await res.json();
      if (data.success) {
        setJobs(data.jobs);
        setTotal(data.total);
        setPages(data.pages);
        setPage(data.page);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [query, type, location, salary]);

  useEffect(() => { fetchJobs(1); }, [fetchJobs]);

  const hasActiveFilters = type || location || salary;

  const clearFilters = () => {
    setType("");
    setLocation("");
    setSalary("");
  };

  return (
    <div className="min-h-screen bg-slate-950">

      {/* Hero */}
      <div className="border-b border-white/5 bg-gradient-to-b from-slate-900 to-slate-950 px-4 py-12">
        <div className="mx-auto max-w-4xl text-center space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-4 py-1.5 text-sm text-blue-400">
            <Zap className="h-4 w-4" />
            Find your next opportunity
          </div>
          <h1 className="text-4xl font-bold text-white md:text-5xl">
            Browse Open <span className="text-blue-400">Jobs</span>
          </h1>
          <p className="text-slate-400 text-lg">
            Discover opportunities from top companies. Apply in minutes.
          </p>

          {/* Search bar */}
          <div className="relative mt-6">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && fetchJobs(1)}
              placeholder="Search job title, company, or keyword..."
              className="w-full rounded-2xl border border-white/10 bg-white/5 py-4 pl-12 pr-32 text-white outline-none placeholder:text-slate-500 focus:border-blue-500/40 focus:ring-2 focus:ring-blue-500/10 transition text-sm"
            />
            <button
              onClick={() => fetchJobs(1)}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-xl bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-500 transition"
            >
              Search
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="mx-auto max-w-7xl px-4 py-8">

        {/* Filter bar */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm transition ${showFilters ? "border-blue-500/40 bg-blue-500/10 text-blue-400" : "border-white/10 bg-white/5 text-slate-400 hover:text-white"}`}
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filters
            {hasActiveFilters && (
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-blue-500 text-[10px] text-white font-bold">
                {[type, location, salary].filter(Boolean).length}
              </span>
            )}
          </button>

          {/* Quick type filters */}
          <div className="flex flex-wrap gap-2">
            {TYPE_OPTIONS.slice(1).map((t) => (
              <button
                key={t.value}
                onClick={() => setType(type === t.value ? "" : t.value)}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                  type === t.value
                    ? TYPE_COLORS[t.value]
                    : "border-white/10 bg-white/5 text-slate-400 hover:text-white"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {hasActiveFilters && (
            <button onClick={clearFilters} className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-red-400 transition ml-auto">
              <X className="h-3 w-3" />Clear filters
            </button>
          )}

          <p className="text-xs text-slate-500 ml-auto">
            {total} job{total !== 1 ? "s" : ""} found
          </p>
        </div>

        {/* Expanded filters */}
        {showFilters && (
          <div className="mb-6 rounded-2xl border border-white/5 bg-white/[0.02] p-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Job Type</label>
                <select value={type} onChange={(e) => setType(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-blue-500/40">
                  {TYPE_OPTIONS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Location</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                  <input value={location} onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. Lagos, Remote"
                    className="w-full rounded-xl border border-white/10 bg-slate-900 pl-9 pr-4 py-2 text-sm text-white outline-none placeholder:text-slate-500 focus:border-blue-500/40" />
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Salary Range</label>
                <select value={salary} onChange={(e) => setSalary(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-blue-500/40">
                  {SALARY_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>
            </div>
            <div className="flex justify-end mt-3">
              <button onClick={() => fetchJobs(1)}
                className="rounded-xl bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-500 transition">
                Apply Filters
              </button>
            </div>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-slate-500" />
          </div>
        )}

        {/* No results */}
        {!loading && jobs.length === 0 && (
          <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-12 text-center">
            <Building2 className="h-12 w-12 text-slate-700 mx-auto mb-4" />
            <p className="text-white font-semibold">No jobs found</p>
            <p className="text-slate-400 text-sm mt-1">
              Try different keywords or clear your filters
            </p>
            {hasActiveFilters && (
              <button onClick={clearFilters}
                className="mt-4 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300 hover:bg-white/10 transition">
                Clear Filters
              </button>
            )}
          </div>
        )}

        {/* Jobs grid */}
        {!loading && jobs.length > 0 && (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {jobs.map((job) => <JobCard key={job.id} job={job} />)}
            </div>

            {/* Pagination */}
            {pages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <button
                  onClick={() => fetchJobs(page - 1)}
                  disabled={page === 1}
                  className="rounded-xl border border-white/10 bg-white/5 p-2 text-slate-400 hover:text-white transition disabled:opacity-30"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>

                {Array.from({ length: Math.min(5, pages) }, (_, i) => {
                  const p = Math.max(1, Math.min(pages - 4, page - 2)) + i;
                  return (
                    <button
                      key={p}
                      onClick={() => fetchJobs(p)}
                      className={`h-9 w-9 rounded-xl border text-sm font-medium transition ${
                        p === page
                          ? "border-blue-500/40 bg-blue-500/10 text-blue-400"
                          : "border-white/10 bg-white/5 text-slate-400 hover:text-white"
                      }`}
                    >
                      {p}
                    </button>
                  );
                })}

                <button
                  onClick={() => fetchJobs(page + 1)}
                  disabled={page === pages}
                  className="rounded-xl border border-white/10 bg-white/5 p-2 text-slate-400 hover:text-white transition disabled:opacity-30"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* CTA for job seekers */}
      <div className="border-t border-white/5 bg-gradient-to-r from-blue-500/5 to-purple-500/5 px-4 py-12">
        <div className="mx-auto max-w-3xl text-center space-y-4">
          <h2 className="text-2xl font-bold text-white">Get matched to the right jobs</h2>
          <p className="text-slate-400">
            Upload your CV and TomParo will analyse your profile to find the best-matching opportunities.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/signup"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-medium text-white hover:bg-blue-500 transition">
              <Zap className="h-4 w-4" />Get Started Free
            </Link>
            <Link href="/signin"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-6 py-3 text-sm font-medium text-white hover:bg-white/10 transition">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
