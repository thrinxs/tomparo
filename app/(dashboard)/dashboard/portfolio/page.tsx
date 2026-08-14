"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import {
  User, MapPin, Mail, Phone, Globe, Twitter, Linkedin, Github,
  Plus, Trash2, Save, Eye, EyeOff, ExternalLink, Loader2,
  CheckCircle, AlertTriangle, Link2, Download, Briefcase,
  GraduationCap, Award, Code, ChevronDown, ChevronUp, Copy,
} from "lucide-react";
import toast from "react-hot-toast";

interface Experience { id: string; title: string; company: string; from: string; to: string; current: boolean; description: string; }
interface Project { id: string; title: string; description: string; url: string; image: string; }
interface Education { id: string; school: string; degree: string; field: string; from: string; to: string; }
interface Certification { id: string; name: string; issuer: string; year: string; url: string; }

function uid() { return Math.random().toString(36).slice(2); }

export default function PortfolioPage() {
  const { data: session } = useSession();
  const user = session?.user as any;
  const isPremium = user?.isPremium || user?.role === "PREMIUM" || user?.role === "ADMIN";

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [slug, setSlug] = useState("");
  const [slugStatus, setSlugStatus] = useState<"idle" | "checking" | "available" | "taken" | "invalid">("idle");
  const [isPublic, setIsPublic] = useState(false);
  const [headline, setHeadline] = useState("");
  const [bio, setBio] = useState("");
  const [location, setLocation] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [website, setWebsite] = useState("");
  const [twitter, setTwitter] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [github, setGithub] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState("");
  const [experience, setExperience] = useState<Experience[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [education, setEducation] = useState<Education[]>([]);
  const [certifications, setCertifications] = useState<Certification[]>([]);
  const [openSection, setOpenSection] = useState<string | null>("basics");
  const [viewCount, setViewCount] = useState(0);
  const slugCheckRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/portfolio");
        const data = await res.json();
        if (data.portfolio) {
          const p = data.portfolio;
          setSlug(p.slug || "");
          setIsPublic(p.isPublic || false);
          setHeadline(p.headline || "");
          setBio(p.bio || "");
          setLocation(p.location || "");
          setEmail(p.email || "");
          setPhone(p.phone || "");
          setWebsite(p.website || "");
          setTwitter(p.twitter || "");
          setLinkedin(p.linkedin || "");
          setGithub(p.github || "");
          setSkills(p.skills ? JSON.parse(p.skills) : []);
          setExperience(p.experience ? JSON.parse(p.experience) : []);
          setProjects(p.projects ? JSON.parse(p.projects) : []);
          setEducation(p.education ? JSON.parse(p.education) : []);
          setCertifications(p.certifications ? JSON.parse(p.certifications) : []);
          setViewCount(p.viewCount || 0);
        } else {
          const name = user?.name || "";
          const autoSlug = name.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "").slice(0, 30);
          setSlug(autoSlug || "my-portfolio");
          setEmail(user?.email || "");
        }
      } catch {}
      finally { setLoading(false); }
    };
    load();
  }, []);

  const checkSlug = useCallback((value: string) => {
    if (!value) { setSlugStatus("idle"); return; }
    if (!/^[a-z0-9-]+$/.test(value)) { setSlugStatus("invalid"); return; }
    setSlugStatus("checking");
    if (slugCheckRef.current) clearTimeout(slugCheckRef.current);
    slugCheckRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/portfolio/slug/check?slug=${value}`);
        const data = await res.json();
        setSlugStatus(data.available ? "available" : "taken");
      } catch { setSlugStatus("idle"); }
    }, 500);
  }, []);

  const handleSlugChange = (value: string) => {
    const clean = value.toLowerCase().replace(/[^a-z0-9-]/g, "");
    setSlug(clean);
    checkSlug(clean);
  };

  const handleSave = async () => {
    if (!slug) { toast.error("Please set a portfolio URL"); return; }
    if (slugStatus === "taken") { toast.error("That URL is already taken"); return; }
    if (slugStatus === "invalid") { toast.error("Invalid URL format"); return; }
    setSaving(true);
    try {
      const res = await fetch("/api/portfolio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug, isPublic, headline, bio, location, email, phone,
          website, twitter, linkedin, github, skills, experience,
          projects, education, certifications,
        }),
      });
      if (!res.ok) throw new Error("Failed to save");
      setSaved(true);
      toast.success("Portfolio saved!");
      setTimeout(() => setSaved(false), 3000);
    } catch { toast.error("Failed to save portfolio"); }
    finally { setSaving(false); }
  };

  const handleDownloadPDF = async () => {
    const html2pdf = (await import("html2pdf.js")).default;
    const element = document.getElementById("portfolio-preview");
    if (!element) { toast.error("Nothing to download yet"); return; }
    const opt = {
      margin: 0,
      filename: `${slug || "portfolio"}.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: "in", format: "a4", orientation: "portrait" },
    };
    toast.loading("Generating PDF...", { id: "pdf" });
    try {
      await html2pdf().set(opt).from(element).save();
      toast.success("PDF downloaded!", { id: "pdf" });
    } catch { toast.error("PDF generation failed", { id: "pdf" }); }
  };

  const addSkill = () => {
    const s = skillInput.trim();
    if (!s || skills.includes(s)) return;
    setSkills([...skills, s]);
    setSkillInput("");
  };

  const toggle = (section: string) => setOpenSection(openSection === section ? null : section);

  if (loading) return (
    <div className="flex items-center justify-center h-96">
      <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
    </div>
  );

  const portfolioUrl = `${typeof window !== "undefined" ? window.location.origin : "https://tomparo.com"}/portfolio/${slug}`;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-white">My Portfolio</h1>
          <p className="text-slate-400 text-sm mt-1">Build your public portfolio page and share it with employers.</p>
        </div>
        <div className="flex items-center gap-3">
          {isPremium && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-emerald-500/20 bg-emerald-500/5 text-emerald-400 text-xs font-medium">
              <Eye className="w-3.5 h-3.5" />{viewCount} view{viewCount !== 1 ? "s" : ""}
            </div>
          )}
          <button onClick={handleDownloadPDF}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/10 bg-white/5 text-slate-400 text-sm font-medium hover:text-white transition">
            <Download className="w-4 h-4" />Download PDF
          </button>
          <button onClick={handleSave} disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-sm font-semibold transition disabled:opacity-50">
            {saving ? <><Loader2 className="w-4 h-4 animate-spin" />Saving...</> : saved ? <><CheckCircle className="w-4 h-4" />Saved!</> : <><Save className="w-4 h-4" />Save Portfolio</>}
          </button>
        </div>
      </div>

      {/* Portfolio URL + Visibility */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 space-y-4">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2"><Link2 className="w-4 h-4 text-slate-400" />Portfolio URL</h3>
        <div className="flex items-center gap-2">
          <span className="text-slate-500 text-sm shrink-0">tomparo.com/portfolio/</span>
          <div className="flex-1 relative">
            <input value={slug} onChange={(e) => handleSlugChange(e.target.value)} placeholder="your-name"
              className="w-full rounded-xl border border-white/10 bg-slate-900/50 px-4 py-2.5 text-sm text-white outline-none focus:border-purple-500/50 transition" />
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              {slugStatus === "checking" && <Loader2 className="w-4 h-4 animate-spin text-slate-400" />}
              {slugStatus === "available" && <CheckCircle className="w-4 h-4 text-emerald-400" />}
              {slugStatus === "taken" && <AlertTriangle className="w-4 h-4 text-red-400" />}
              {slugStatus === "invalid" && <AlertTriangle className="w-4 h-4 text-amber-400" />}
            </div>
          </div>
          <button onClick={() => { navigator.clipboard.writeText(portfolioUrl); toast.success("Link copied!"); }}
            className="p-2.5 rounded-xl border border-white/10 bg-white/5 text-slate-400 hover:text-white transition">
            <Copy className="w-4 h-4" />
          </button>
          {isPublic && slug && (
            <a href={portfolioUrl} target="_blank" rel="noopener noreferrer"
              className="p-2.5 rounded-xl border border-white/10 bg-white/5 text-slate-400 hover:text-white transition">
              <ExternalLink className="w-4 h-4" />
            </a>
          )}
        </div>
        {slugStatus === "taken" && <p className="text-xs text-red-400">That URL is already taken. Try another.</p>}
        {slugStatus === "invalid" && <p className="text-xs text-amber-400">Only lowercase letters, numbers, and hyphens.</p>}
        {slugStatus === "available" && <p className="text-xs text-emerald-400">✓ Available!</p>}

        <div className="flex items-center justify-between p-4 rounded-xl border border-white/5 bg-white/[0.02]">
          <div>
            <p className="text-sm font-medium text-white">Visibility</p>
            <p className="text-xs text-slate-500 mt-0.5">{isPublic ? "Anyone with the link can view your portfolio" : "Only you can see your portfolio"}</p>
          </div>
          <button onClick={() => setIsPublic(!isPublic)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isPublic ? "bg-purple-600" : "bg-slate-700"}`}>
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isPublic ? "translate-x-6" : "translate-x-1"}`} />
          </button>
        </div>

        {!isPremium && (
          <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-400">Free plan PDFs include a TomParo watermark. <span className="text-white font-medium">Upgrade to Premium</span> to remove it and unlock view analytics.</p>
          </div>
        )}
      </div>

      {/* Basics */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden">
        <button onClick={() => toggle("basics")} className="w-full flex items-center justify-between px-6 py-4 hover:bg-white/[0.02] transition">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2"><User className="w-4 h-4 text-slate-400" />Basic Information</h3>
          {openSection === "basics" ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </button>
        {openSection === "basics" && (
          <div className="px-6 pb-6 space-y-4 border-t border-white/5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              {[
                { label: "Professional Headline", value: headline, set: setHeadline, placeholder: "e.g. Senior Product Designer" },
                { label: "Location", value: location, set: setLocation, placeholder: "e.g. Lagos, Nigeria", icon: MapPin },
                { label: "Email", value: email, set: setEmail, placeholder: "your@email.com", icon: Mail },
                { label: "Phone", value: phone, set: setPhone, placeholder: "+234 800 000 0000", icon: Phone },
                { label: "Website", value: website, set: setWebsite, placeholder: "https://yoursite.com", icon: Globe },
                { label: "Twitter / X", value: twitter, set: setTwitter, placeholder: "@username", icon: Twitter },
                { label: "LinkedIn", value: linkedin, set: setLinkedin, placeholder: "linkedin.com/in/...", icon: Linkedin },
                { label: "GitHub", value: github, set: setGithub, placeholder: "github.com/...", icon: Github },
              ].map((field) => (
                <div key={field.label} className={field.label === "Professional Headline" ? "sm:col-span-2" : ""}>
                  <label className="text-xs text-slate-500 mb-1.5 block">{field.label}</label>
                  <input value={field.value} onChange={(e) => field.set(e.target.value)} placeholder={field.placeholder}
                    className="w-full rounded-xl border border-white/10 bg-slate-900/50 px-4 py-2.5 text-sm text-white placeholder-slate-600 outline-none focus:border-purple-500/50 transition" />
                </div>
              ))}
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1.5 block">Bio</label>
              <textarea value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Write a short bio about yourself..." rows={4}
                className="w-full rounded-xl border border-white/10 bg-slate-900/50 px-4 py-3 text-sm text-white placeholder-slate-600 outline-none focus:border-purple-500/50 resize-none transition" />
            </div>
          </div>
        )}
      </div>

      {/* Skills */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden">
        <button onClick={() => toggle("skills")} className="w-full flex items-center justify-between px-6 py-4 hover:bg-white/[0.02] transition">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2"><Code className="w-4 h-4 text-slate-400" />Skills <span className="text-slate-500 font-normal">({skills.length})</span></h3>
          {openSection === "skills" ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </button>
        {openSection === "skills" && (
          <div className="px-6 pb-6 space-y-4 border-t border-white/5 mt-0 pt-4">
            <div className="flex gap-2">
              <input value={skillInput} onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addSkill()}
                placeholder="Add a skill (press Enter)" className="flex-1 rounded-xl border border-white/10 bg-slate-900/50 px-4 py-2.5 text-sm text-white placeholder-slate-600 outline-none focus:border-purple-500/50 transition" />
              <button onClick={addSkill} className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-sm font-semibold transition">
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {skills.map((s) => (
                <span key={s} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-medium">
                  {s}
                  <button onClick={() => setSkills(skills.filter((x) => x !== s))} className="hover:text-red-400 transition"><Trash2 className="w-3 h-3" /></button>
                </span>
              ))}
              {skills.length === 0 && <p className="text-xs text-slate-600">No skills added yet.</p>}
            </div>
          </div>
        )}
      </div>

      {/* Experience */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden">
        <button onClick={() => toggle("experience")} className="w-full flex items-center justify-between px-6 py-4 hover:bg-white/[0.02] transition">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2"><Briefcase className="w-4 h-4 text-slate-400" />Work Experience <span className="text-slate-500 font-normal">({experience.length})</span></h3>
          {openSection === "experience" ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </button>
        {openSection === "experience" && (
          <div className="px-6 pb-6 space-y-4 border-t border-white/5 pt-4">
            {experience.map((exp, i) => (
              <div key={exp.id} className="rounded-xl border border-white/5 bg-white/[0.02] p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Experience {i + 1}</p>
                  <button onClick={() => setExperience(experience.filter((e) => e.id !== exp.id))} className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 transition"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { label: "Job Title", key: "title" as const, placeholder: "e.g. Product Designer" },
                    { label: "Company", key: "company" as const, placeholder: "e.g. TomParo" },
                    { label: "From", key: "from" as const, placeholder: "Jan 2022", type: "month" },
                    { label: "To", key: "to" as const, placeholder: "Dec 2023", type: "month" },
                  ].map((field) => (
                    <div key={field.key}>
                      <label className="text-[10px] text-slate-500 mb-1 block">{field.label}</label>
                      <input type={field.type || "text"} value={(exp as any)[field.key]}
                        onChange={(e) => setExperience(experience.map((x) => x.id === exp.id ? { ...x, [field.key]: e.target.value } : x))}
                        placeholder={field.placeholder}
                        className="w-full rounded-lg border border-white/10 bg-slate-900/50 px-3 py-2 text-sm text-white placeholder-slate-600 outline-none focus:border-purple-500/50 transition" />
                    </div>
                  ))}
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 mb-1 block">Description</label>
                  <textarea value={exp.description} onChange={(e) => setExperience(experience.map((x) => x.id === exp.id ? { ...x, description: e.target.value } : x))}
                    placeholder="What did you do in this role?" rows={3}
                    className="w-full rounded-lg border border-white/10 bg-slate-900/50 px-3 py-2 text-sm text-white placeholder-slate-600 outline-none focus:border-purple-500/50 resize-none transition" />
                </div>
              </div>
            ))}
            <button onClick={() => setExperience([...experience, { id: uid(), title: "", company: "", from: "", to: "", current: false, description: "" }])}
              className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl border border-dashed border-white/10 text-slate-500 text-sm hover:text-white hover:border-white/20 transition">
              <Plus className="w-4 h-4" />Add Experience
            </button>
          </div>
        )}
      </div>

      {/* Projects */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden">
        <button onClick={() => toggle("projects")} className="w-full flex items-center justify-between px-6 py-4 hover:bg-white/[0.02] transition">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2"><Code className="w-4 h-4 text-slate-400" />Projects <span className="text-slate-500 font-normal">({projects.length})</span></h3>
          {openSection === "projects" ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </button>
        {openSection === "projects" && (
          <div className="px-6 pb-6 space-y-4 border-t border-white/5 pt-4">
            {projects.map((proj, i) => (
              <div key={proj.id} className="rounded-xl border border-white/5 bg-white/[0.02] p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Project {i + 1}</p>
                  <button onClick={() => setProjects(projects.filter((p) => p.id !== proj.id))} className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 transition"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
                {[
                  { label: "Project Title", key: "title" as const, placeholder: "e.g. TomParo" },
                  { label: "Project URL", key: "url" as const, placeholder: "https://..." },
                ].map((field) => (
                  <div key={field.key}>
                    <label className="text-[10px] text-slate-500 mb-1 block">{field.label}</label>
                    <input value={(proj as any)[field.key]}
                      onChange={(e) => setProjects(projects.map((x) => x.id === proj.id ? { ...x, [field.key]: e.target.value } : x))}
                      placeholder={field.placeholder}
                      className="w-full rounded-lg border border-white/10 bg-slate-900/50 px-3 py-2 text-sm text-white placeholder-slate-600 outline-none focus:border-purple-500/50 transition" />
                  </div>
                ))}
                <div>
                  <label className="text-[10px] text-slate-500 mb-1 block">Description</label>
                  <textarea value={proj.description} onChange={(e) => setProjects(projects.map((x) => x.id === proj.id ? { ...x, description: e.target.value } : x))}
                    placeholder="Describe this project..." rows={3}
                    className="w-full rounded-lg border border-white/10 bg-slate-900/50 px-3 py-2 text-sm text-white placeholder-slate-600 outline-none focus:border-purple-500/50 resize-none transition" />
                </div>
              </div>
            ))}
            <button onClick={() => setProjects([...projects, { id: uid(), title: "", description: "", url: "", image: "" }])}
              className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl border border-dashed border-white/10 text-slate-500 text-sm hover:text-white hover:border-white/20 transition">
              <Plus className="w-4 h-4" />Add Project
            </button>
          </div>
        )}
      </div>

      {/* Education */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden">
        <button onClick={() => toggle("education")} className="w-full flex items-center justify-between px-6 py-4 hover:bg-white/[0.02] transition">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2"><GraduationCap className="w-4 h-4 text-slate-400" />Education <span className="text-slate-500 font-normal">({education.length})</span></h3>
          {openSection === "education" ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </button>
        {openSection === "education" && (
          <div className="px-6 pb-6 space-y-4 border-t border-white/5 pt-4">
            {education.map((edu, i) => (
              <div key={edu.id} className="rounded-xl border border-white/5 bg-white/[0.02] p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Education {i + 1}</p>
                  <button onClick={() => setEducation(education.filter((e) => e.id !== edu.id))} className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 transition"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { label: "School", key: "school" as const, placeholder: "University of Lagos" },
                    { label: "Degree", key: "degree" as const, placeholder: "B.Sc." },
                    { label: "Field of Study", key: "field" as const, placeholder: "Computer Science" },
                    { label: "From", key: "from" as const, placeholder: "2018", type: "number" },
                    { label: "To", key: "to" as const, placeholder: "2022", type: "number" },
                  ].map((field) => (
                    <div key={field.key} className={field.key === "school" ? "sm:col-span-2" : ""}>
                      <label className="text-[10px] text-slate-500 mb-1 block">{field.label}</label>
                      <input type={field.type || "text"} value={(edu as any)[field.key]}
                        onChange={(e) => setEducation(education.map((x) => x.id === edu.id ? { ...x, [field.key]: e.target.value } : x))}
                        placeholder={field.placeholder}
                        className="w-full rounded-lg border border-white/10 bg-slate-900/50 px-3 py-2 text-sm text-white placeholder-slate-600 outline-none focus:border-purple-500/50 transition" />
                    </div>
                  ))}
                </div>
              </div>
            ))}
            <button onClick={() => setEducation([...education, { id: uid(), school: "", degree: "", field: "", from: "", to: "" }])}
              className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl border border-dashed border-white/10 text-slate-500 text-sm hover:text-white hover:border-white/20 transition">
              <Plus className="w-4 h-4" />Add Education
            </button>
          </div>
        )}
      </div>

      {/* Certifications */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden">
        <button onClick={() => toggle("certifications")} className="w-full flex items-center justify-between px-6 py-4 hover:bg-white/[0.02] transition">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2"><Award className="w-4 h-4 text-slate-400" />Certifications <span className="text-slate-500 font-normal">({certifications.length})</span></h3>
          {openSection === "certifications" ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </button>
        {openSection === "certifications" && (
          <div className="px-6 pb-6 space-y-4 border-t border-white/5 pt-4">
            {certifications.map((cert, i) => (
              <div key={cert.id} className="rounded-xl border border-white/5 bg-white/[0.02] p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Certification {i + 1}</p>
                  <button onClick={() => setCertifications(certifications.filter((c) => c.id !== cert.id))} className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 transition"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { label: "Certificate Name", key: "name" as const, placeholder: "AWS Solutions Architect" },
                    { label: "Issuer", key: "issuer" as const, placeholder: "Amazon Web Services" },
                    { label: "Year", key: "year" as const, placeholder: "2023" },
                    { label: "Certificate URL", key: "url" as const, placeholder: "https://..." },
                  ].map((field) => (
                    <div key={field.key} className={field.key === "name" ? "sm:col-span-2" : ""}>
                      <label className="text-[10px] text-slate-500 mb-1 block">{field.label}</label>
                      <input value={(cert as any)[field.key]}
                        onChange={(e) => setCertifications(certifications.map((x) => x.id === cert.id ? { ...x, [field.key]: e.target.value } : x))}
                        placeholder={field.placeholder}
                        className="w-full rounded-lg border border-white/10 bg-slate-900/50 px-3 py-2 text-sm text-white placeholder-slate-600 outline-none focus:border-purple-500/50 transition" />
                    </div>
                  ))}
                </div>
              </div>
            ))}
            <button onClick={() => setCertifications([...certifications, { id: uid(), name: "", issuer: "", year: "", url: "" }])}
              className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl border border-dashed border-white/10 text-slate-500 text-sm hover:text-white hover:border-white/20 transition">
              <Plus className="w-4 h-4" />Add Certification
            </button>
          </div>
        )}
      </div>

      <div className="flex justify-end">
        <button onClick={handleSave} disabled={saving}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-sm font-semibold transition disabled:opacity-50">
          {saving ? <><Loader2 className="w-4 h-4 animate-spin" />Saving...</> : saved ? <><CheckCircle className="w-4 h-4" />Saved!</> : <><Save className="w-4 h-4" />Save Portfolio</>}
        </button>
      </div>
    </div>
  );
}
