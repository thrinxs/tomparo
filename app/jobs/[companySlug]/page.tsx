import { notFound } from "next/navigation";
import Link from "next/link";
import {
  Building2, MapPin, Briefcase, Clock,
  ArrowRight, Globe, Calendar,
} from "lucide-react";

const typeLabels: Record<string, string> = {
  FULL_TIME: "Full Time",
  PART_TIME: "Part Time",
  CONTRACT: "Contract",
  REMOTE: "Remote",
  HYBRID: "Hybrid",
};

function generateJobSlug(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").slice(0, 60);
}

async function getCompanyJobs(companySlug: string) {
  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
  const res = await fetch(`${baseUrl}/api/jobs/${companySlug}`, {
    cache: "no-store",
  });
  if (!res.ok) return null;
  return res.json();
}

export default async function CompanyJobsPage({
  params,
}: {
  params: Promise<{ companySlug: string }>;
}) {
  const { companySlug } = await params;
  const data = await getCompanyJobs(companySlug);

  if (!data) notFound();

  const { company, jobs } = data;

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">

      {/* Header */}
      <div className="border-b border-white/5 bg-slate-950/80 backdrop-blur-xl">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-purple-500/20 border border-purple-500/20 flex items-center justify-center shrink-0">
              <Building2 className="w-7 h-7 text-purple-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">{company.name}</h1>
              <div className="flex items-center gap-3 mt-1 flex-wrap">
                {company.industry && (
                  <span className="text-sm text-slate-400">{company.industry}</span>
                )}
                {company.website && (
                  <a
                    href={company.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-purple-400 hover:text-purple-300 transition flex items-center gap-1"
                  >
                    <Globe className="w-3.5 h-3.5" />
                    Website
                  </a>
                )}
              </div>
            </div>
          </div>
          {company.description && (
            <p className="text-slate-400 text-sm mt-4 leading-relaxed max-w-2xl">
              {company.description}
            </p>
          )}
        </div>
      </div>

      {/* Jobs */}
      <div className="max-w-4xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-white">
            Open Positions{" "}
            <span className="text-slate-500 font-normal">({jobs.length})</span>
          </h2>
        </div>

        {jobs.length === 0 ? (
          <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-16 text-center">
            <Briefcase className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">
              No open positions
            </h3>
            <p className="text-slate-400 text-sm">
              {company.name} doesn&apos;t have any open positions at the moment.
              Check back later!
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {jobs.map((job: any) => {
              const slug = job.jobSlug || generateJobSlug(job.title);
              return (
                <Link
                  key={job.id}
                  href={`/jobs/${companySlug}/${slug}`}
                  className="group block rounded-2xl border border-white/5 bg-white/[0.02] p-6 hover:border-purple-500/30 hover:bg-purple-500/5 transition"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-white group-hover:text-purple-400 transition mb-2">
                        {job.title}
                      </h3>
                      <div className="flex flex-wrap gap-3 text-sm text-slate-400">
                        {job.location && (
                          <span className="flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5" />
                            {job.location}
                          </span>
                        )}
                        <span className="flex items-center gap-1.5">
                          <Briefcase className="w-3.5 h-3.5" />
                          {typeLabels[job.type] || job.type}
                        </span>
                        {job.salaryMin && job.salaryMax && (
                          <span className="text-emerald-400">
                            ₦{job.salaryMin.toLocaleString()} –
                            ₦{job.salaryMax.toLocaleString()}/mo
                          </span>
                        )}
                        {job.deadline && (
                          <span className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5" />
                            Closes {new Date(job.deadline).toLocaleDateString("en-NG", {
                              day: "numeric", month: "short", year: "numeric",
                            })}
                          </span>
                        )}
                      </div>
                    </div>
                    <ArrowRight className="w-5 h-5 text-slate-600 group-hover:text-purple-400 transition shrink-0 mt-1" />
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {/* Footer */}
        <div className="mt-12 text-center">
          <p className="text-xs text-slate-600">
            Powered by{" "}
            <Link href="/" className="text-purple-400 hover:text-purple-300 transition">
              TomParo
            </Link>
            {" "}— Nigeria&apos;s AI Recruitment Platform
          </p>
        </div>
      </div>
    </div>
  );
}
