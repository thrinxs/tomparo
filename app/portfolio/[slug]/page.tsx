"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import {
  MapPin, Mail, Phone, Globe, Twitter, Linkedin, Github,
  Briefcase, GraduationCap, Award, Code, ExternalLink,
  Download, Loader2, Lock, Calendar,
} from "lucide-react";
import toast from "react-hot-toast";

export default function PublicPortfolioPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [portfolio, setPortfolio] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`/api/portfolio/${slug}`);
        const data = await res.json();
        if (res.status === 403) { setIsPrivate(true); return; }
        if (!res.ok) { setError(data.error || "Portfolio not found"); return; }
        setPortfolio(data.portfolio);
      } catch { setError("Failed to load portfolio"); }
      finally { setLoading(false); }
    };
    load();
  }, [slug]);

  const handleDownloadPDF = async () => {
    const html2pdf = (await import("html2pdf.js")).default;
    const element = document.getElementById("portfolio-content");
    if (!element) return;
    const opt = {
      margin: 0,
      filename: `${slug}-portfolio.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: "in", format: "a4", orientation: "portrait" },
    };
    toast.loading("Generating PDF...", { id: "pdf" });
    try {
      await html2pdf().set(opt).from(element).save();
      toast.success("PDF downloaded!", { id: "pdf" });
    } catch { toast.error("Failed to generate PDF", { id: "pdf" }); }
  };

  if (loading) return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
    </div>
  );

  if (isPrivate) return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center mx-auto">
          <Lock className="w-8 h-8 text-slate-400" />
        </div>
        <h1 className="text-xl font-bold text-white">This portfolio is private</h1>
        <p className="text-slate-400 text-sm">The owner has not made this portfolio public yet.</p>
      </div>
    </div>
  );

  if (error || !portfolio) return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center space-y-4">
        <h1 className="text-xl font-bold text-white">Portfolio not found</h1>
        <p className="text-slate-400 text-sm">This portfolio link may be invalid or has been removed.</p>
      </div>
    </div>
  );

  const p = portfolio;

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      {/* Top bar */}
      <div className="border-b border-white/5 bg-[#0a0a0f]/80 backdrop-blur-xl sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-3 flex items-center justify-between">
          <a href="https://tomparo.com" className="text-xs text-slate-500 hover:text-white transition">
            Powered by <span className="text-purple-400 font-medium">TomParo</span>
          </a>
          <button onClick={handleDownloadPDF}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 bg-white/5 text-slate-400 text-xs font-medium hover:text-white transition">
            <Download className="w-3.5 h-3.5" />Download PDF
          </button>
        </div>
      </div>

      <div id="portfolio-content" className="max-w-4xl mx-auto px-6 py-12 space-y-10">
        {/* Hero */}
        <div className="flex items-start gap-6 flex-wrap">
          {p.avatar ? (
            <img src={p.avatar} alt={p.user?.name} className="w-24 h-24 rounded-2xl object-cover border border-white/10" />
          ) : (
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-white/10 flex items-center justify-center shrink-0">
              <span className="text-3xl font-bold text-white">{(p.user?.name || "?")[0]}</span>
            </div>
          )}
          <div className="flex-1 min-w-0 space-y-2">
            <h1 className="text-3xl font-bold text-white">{p.user?.name}</h1>
            {p.headline && <p className="text-purple-400 font-medium">{p.headline}</p>}
            <div className="flex flex-wrap gap-3 text-sm text-slate-400">
              {p.location && <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" />{p.location}</span>}
              {p.email && <a href={`mailto:${p.email}`} className="flex items-center gap-1.5 hover:text-white transition"><Mail className="w-3.5 h-3.5" />{p.email}</a>}
              {p.phone && <span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" />{p.phone}</span>}
              {p.website && <a href={p.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:text-white transition"><Globe className="w-3.5 h-3.5" />{p.website.replace(/https?:\/\//, "")}</a>}
            </div>
            <div className="flex items-center gap-3">
              {p.twitter && <a href={`https://twitter.com/${p.twitter.replace("@","")}`} target="_blank" rel="noopener noreferrer" className="p-2 rounded-xl border border-white/10 bg-white/[0.02] text-slate-400 hover:text-sky-400 hover:border-sky-500/30 transition"><Twitter className="w-4 h-4" /></a>}
              {p.linkedin && <a href={p.linkedin.startsWith("http") ? p.linkedin : `https://${p.linkedin}`} target="_blank" rel="noopener noreferrer" className="p-2 rounded-xl border border-white/10 bg-white/[0.02] text-slate-400 hover:text-blue-400 hover:border-blue-500/30 transition"><Linkedin className="w-4 h-4" /></a>}
              {p.github && <a href={p.github.startsWith("http") ? p.github : `https://${p.github}`} target="_blank" rel="noopener noreferrer" className="p-2 rounded-xl border border-white/10 bg-white/[0.02] text-slate-400 hover:text-white transition"><Github className="w-4 h-4" /></a>}
            </div>
          </div>
        </div>

        {/* Bio */}
        {p.bio && (
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
            <p className="text-slate-300 leading-relaxed">{p.bio}</p>
          </div>
        )}

        {/* Skills */}
        {p.skills?.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2"><Code className="w-5 h-5 text-purple-400" />Skills</h2>
            <div className="flex flex-wrap gap-2">
              {p.skills.map((s: string) => (
                <span key={s} className="px-3 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-sm font-medium">{s}</span>
              ))}
            </div>
          </div>
        )}

        {/* Experience */}
        {p.experience?.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2"><Briefcase className="w-5 h-5 text-blue-400" />Work Experience</h2>
            <div className="space-y-4">
              {p.experience.map((exp: any) => (
                <div key={exp.id} className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 space-y-2">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div>
                      <p className="text-white font-semibold">{exp.title}</p>
                      <p className="text-purple-400 text-sm">{exp.company}</p>
                    </div>
                    {(exp.from || exp.to) && (
                      <div className="flex items-center gap-1.5 text-xs text-slate-500">
                        <Calendar className="w-3.5 h-3.5" />
                        {exp.from}{exp.from && exp.to ? " — " : ""}{exp.to}
                      </div>
                    )}
                  </div>
                  {exp.description && <p className="text-slate-400 text-sm leading-relaxed">{exp.description}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Projects */}
        {p.projects?.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2"><Code className="w-5 h-5 text-emerald-400" />Projects</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {p.projects.map((proj: any) => (
                <div key={proj.id} className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-white font-semibold">{proj.title}</p>
                    {proj.url && (
                      <a href={proj.url} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-lg border border-white/10 text-slate-400 hover:text-white transition shrink-0">
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                  {proj.description && <p className="text-slate-400 text-sm leading-relaxed">{proj.description}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Education */}
        {p.education?.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2"><GraduationCap className="w-5 h-5 text-amber-400" />Education</h2>
            <div className="space-y-3">
              {p.education.map((edu: any) => (
                <div key={edu.id} className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <p className="text-white font-semibold">{edu.school}</p>
                    <p className="text-slate-400 text-sm">{edu.degree}{edu.degree && edu.field ? " · " : ""}{edu.field}</p>
                  </div>
                  {(edu.from || edu.to) && <p className="text-xs text-slate-500">{edu.from}{edu.from && edu.to ? " — " : ""}{edu.to}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Certifications */}
        {p.certifications?.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2"><Award className="w-5 h-5 text-pink-400" />Certifications</h2>
            <div className="space-y-3">
              {p.certifications.map((cert: any) => (
                <div key={cert.id} className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-white font-semibold">{cert.name}</p>
                    <p className="text-slate-400 text-sm">{cert.issuer}{cert.issuer && cert.year ? " · " : ""}{cert.year}</p>
                  </div>
                  {cert.url && (
                    <a href={cert.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/10 text-slate-400 text-xs hover:text-white transition">
                      <ExternalLink className="w-3 h-3" />View
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer watermark — Free only */}
        <div className="border-t border-white/5 pt-6 text-center">
          <a href="https://tomparo.com" target="_blank" rel="noopener noreferrer" className="text-xs text-slate-600 hover:text-slate-400 transition">
            Built with <span className="text-purple-400">TomParo</span> · Nigeria's AI Career Platform
          </a>
        </div>
      </div>
    </div>
  );
}
