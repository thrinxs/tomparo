"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import {
  Plus, Trash2, Save, Download, Mail, Loader2,
  User, Briefcase, GraduationCap, Award, Code,
  ChevronDown, ChevronUp, Eye, Crown, FileText,
  ArrowLeft, Check,
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import Link from "next/link";
import dynamic from "next/dynamic";
import { CvData, Experience, Education, Certification } from "@/components/cv-builder/types";

const BasicTemplate = dynamic(() => import("@/components/cv-builder/BasicTemplate"), { ssr: false });
const PremiumTemplate = dynamic(() => import("@/components/cv-builder/PremiumTemplate"), { ssr: false });

function uid() { return Math.random().toString(36).slice(2); }

const EMPTY_EXP = (): Experience => ({ id: uid(), title: "", company: "", from: "", to: "", current: false, description: "" });
const EMPTY_EDU = (): Education => ({ id: uid(), school: "", degree: "", field: "", from: "", to: "" });
const EMPTY_CERT = (): Certification => ({ id: uid(), name: "", issuer: "", year: "" });

export default function CvBuilderPage() {
  const { data: session } = useSession();
  const user = session?.user as any;
  const isPremium = user?.isPremium || user?.role === "PREMIUM" || user?.role === "ADMIN";

  const [savedCVs, setSavedCVs] = useState<any[]>([]);
  const [currentCVId, setCurrentCVId] = useState<string | null>(null);
  const [template, setTemplate] = useState<"basic" | "premium">("basic");
  const [cvTitle, setCvTitle] = useState("My CV");
  const [preview, setPreview] = useState(false);
  const [saving, setSaving] = useState(false);
  const [openSection, setOpenSection] = useState("personal");

  // Form fields
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState(user?.email || "");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [website, setWebsite] = useState("");
  const [summary, setSummary] = useState("");
  const [experience, setExperience] = useState<Experience[]>([EMPTY_EXP()]);
  const [education, setEducation] = useState<Education[]>([EMPTY_EDU()]);
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState("");
  const [certifications, setCertifications] = useState<Certification[]>([]);

  // Load saved CVs
  useEffect(() => {
    fetch("/api/cv-builder")
      .then((r) => r.json())
      .then((d) => { if (d.success) setSavedCVs(d.cvs); });
  }, []);

  // Pre-fill name + email from session
  useEffect(() => {
    if (user?.name && !fullName) setFullName(user.name);
    if (user?.email && !email) setEmail(user.email);
  }, [user]);

  const cvData: CvData = {
    fullName, email, phone, location, linkedin, website,
    summary, experience, education, skills, certifications,
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const body = { title: cvTitle, template, ...cvData };
      const res = await fetch(
        currentCVId ? `/api/cv-builder/${currentCVId}` : "/api/cv-builder",
        {
          method: currentCVId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      );
      const data = await res.json();
      if (data.success) {
        toast.success("CV saved!");
        if (!currentCVId && data.cv?.id) setCurrentCVId(data.cv.id);
        // Refresh list
        fetch("/api/cv-builder").then((r) => r.json()).then((d) => { if (d.success) setSavedCVs(d.cvs); });
      } else {
        toast.error(data.error || "Failed to save");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setSaving(false);
    }
  };

  const handleEmailCV = async () => {
    if (!currentCVId) { toast.error("Save your CV first"); return; }
    if (!user?.email) { toast.error("No email on file"); return; }
    toast.loading("Sending CV to your email...", { id: "email-cv" });
    try {
      const res = await fetch(`/api/cv-builder/${currentCVId}/email`, { method: "POST" });
      const data = await res.json();
      if (data.success) toast.success(`CV sent to ${user.email}`, { id: "email-cv" });
      else toast.error(data.error || "Failed to send", { id: "email-cv" });
    } catch {
      toast.error("Network error", { id: "email-cv" });
    }
  };

  const handleDownload = async () => {
    if (!currentCVId) { toast.error("Save your CV first"); return; }
    toast.loading("Generating DOCX...", { id: "download-cv" });
    try {
      const res = await fetch(`/api/cv-builder/${currentCVId}/download`);
      if (!res.ok) { toast.error("Failed to generate CV", { id: "download-cv" }); return; }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${fullName || "CV"}_CV.docx`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("CV downloaded!", { id: "download-cv" });
    } catch {
      toast.error("Network error", { id: "download-cv" });
    }
  };

  const loadCV = async (id: string) => {
    const res = await fetch(`/api/cv-builder/${id}`);
    const data = await res.json();
    if (!data.success) return;
    const cv = data.cv;
    setCurrentCVId(cv.id);
    setCvTitle(cv.title);
    setTemplate(cv.template);
    setFullName(cv.fullName || "");
    setEmail(cv.email || "");
    setPhone(cv.phone || "");
    setLocation(cv.location || "");
    setLinkedin(cv.linkedin || "");
    setWebsite(cv.website || "");
    setSummary(cv.summary || "");
    setExperience(cv.experience ? JSON.parse(cv.experience) : [EMPTY_EXP()]);
    setEducation(cv.education ? JSON.parse(cv.education) : [EMPTY_EDU()]);
    setSkills(cv.skills ? JSON.parse(cv.skills) : []);
    setCertifications(cv.certifications ? JSON.parse(cv.certifications) : []);
    toast.success("CV loaded");
  };

  const inputClass = "w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-white outline-none placeholder:text-slate-500 focus:border-blue-500/40 focus:ring-1 focus:ring-blue-500/20 transition";

  const Section = ({ id, title, icon: Icon, children }: any) => (
    <div className="rounded-2xl border border-white/5 bg-white/[0.02] overflow-hidden">
      <button
        onClick={() => setOpenSection(openSection === id ? "" : id)}
        className="flex w-full items-center justify-between p-4 text-left"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
            <Icon className="h-4 w-4 text-blue-400" />
          </div>
          <span className="text-sm font-semibold text-white">{title}</span>
        </div>
        {openSection === id ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
      </button>
      {openSection === id && <div className="border-t border-white/5 p-4 space-y-3">{children}</div>}
    </div>
  );

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <Toaster position="top-right" />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="text-slate-400 hover:text-white transition">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white">CV Builder</h1>
            <p className="text-sm text-slate-400 mt-0.5">Build a professional CV and download it instantly</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPreview(!preview)}
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300 hover:bg-white/10 transition"
          >
            <Eye className="h-4 w-4" />
            {preview ? "Edit" : "Preview"}
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 transition disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* ── LEFT: Form ── */}
        {!preview && (
          <div className="space-y-4">
            {/* CV Title + Template */}
            <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-4 space-y-3">
              <div>
                <label className="text-xs text-slate-400 mb-1 block">CV Title</label>
                <input value={cvTitle} onChange={(e) => setCvTitle(e.target.value)}
                  className={inputClass} placeholder="e.g. Software Engineer CV" />
              </div>

              <div>
                <label className="text-xs text-slate-400 mb-1 block">Template</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setTemplate("basic")}
                    className={`rounded-xl border p-3 text-left transition ${template === "basic" ? "border-blue-500/40 bg-blue-500/10" : "border-white/10 bg-white/[0.02]"}`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-white">Basic</span>
                      {template === "basic" && <Check className="h-4 w-4 text-blue-400" />}
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">Clean, simple, ATS-friendly</p>
                    <span className="text-[10px] text-emerald-400 mt-1 block">Free</span>
                  </button>

                  <button
                    onClick={() => isPremium && setTemplate("premium")}
                    className={`rounded-xl border p-3 text-left transition ${
                      template === "premium" ? "border-amber-500/40 bg-amber-500/10"
                      : isPremium ? "border-white/10 bg-white/[0.02] hover:border-amber-500/20"
                      : "border-white/5 bg-white/[0.01] opacity-60 cursor-not-allowed"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-white">Premium</span>
                      {template === "premium" ? <Check className="h-4 w-4 text-amber-400" /> : !isPremium && <Crown className="h-4 w-4 text-amber-400" />}
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">Featured, sidebar design</p>
                    <span className="text-[10px] text-amber-400 mt-1 block">{isPremium ? "Available" : "Premium only"}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Personal Info */}
            <Section id="personal" title="Personal Information" icon={User}>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="text-xs text-slate-400 mb-1 block">Full Name</label>
                  <input value={fullName} onChange={(e) => setFullName(e.target.value)} className={inputClass} placeholder="John Doe" />
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Email</label>
                  <input value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} placeholder="john@example.com" />
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Phone</label>
                  <input value={phone} onChange={(e) => setPhone(e.target.value)} className={inputClass} placeholder="+234..." />
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Location</label>
                  <input value={location} onChange={(e) => setLocation(e.target.value)} className={inputClass} placeholder="Lagos, Nigeria" />
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">LinkedIn</label>
                  <input value={linkedin} onChange={(e) => setLinkedin(e.target.value)} className={inputClass} placeholder="linkedin.com/in/..." />
                </div>
                <div className="col-span-2">
                  <label className="text-xs text-slate-400 mb-1 block">Website</label>
                  <input value={website} onChange={(e) => setWebsite(e.target.value)} className={inputClass} placeholder="yourwebsite.com" />
                </div>
                <div className="col-span-2">
                  <label className="text-xs text-slate-400 mb-1 block">Professional Summary</label>
                  <textarea value={summary} onChange={(e) => setSummary(e.target.value)}
                    rows={3} className={`${inputClass} resize-none`}
                    placeholder="A brief summary of your professional background and goals..." />
                </div>
              </div>
            </Section>

            {/* Experience */}
            <Section id="experience" title="Work Experience" icon={Briefcase}>
              {experience.map((exp, i) => (
                <div key={exp.id} className="rounded-xl border border-white/5 bg-white/[0.02] p-3 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-400">Experience {i + 1}</span>
                    <button onClick={() => setExperience(experience.filter((_, j) => j !== i))}
                      className="text-red-400 hover:text-red-300 transition">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input value={exp.title} onChange={(e) => setExperience(experience.map((x, j) => j === i ? { ...x, title: e.target.value } : x))}
                      className={inputClass} placeholder="Job Title" />
                    <input value={exp.company} onChange={(e) => setExperience(experience.map((x, j) => j === i ? { ...x, company: e.target.value } : x))}
                      className={inputClass} placeholder="Company" />
                    <input value={exp.from} onChange={(e) => setExperience(experience.map((x, j) => j === i ? { ...x, from: e.target.value } : x))}
                      className={inputClass} placeholder="From (e.g. Jan 2020)" />
                    {!exp.current ? (
                      <input value={exp.to} onChange={(e) => setExperience(experience.map((x, j) => j === i ? { ...x, to: e.target.value } : x))}
                        className={inputClass} placeholder="To (e.g. Dec 2023)" />
                    ) : (
                      <div className={`${inputClass} text-slate-500`}>Present</div>
                    )}
                  </div>
                  <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer">
                    <input type="checkbox" checked={exp.current}
                      onChange={(e) => setExperience(experience.map((x, j) => j === i ? { ...x, current: e.target.checked } : x))}
                      className="rounded" />
                    Currently working here
                  </label>
                  <textarea value={exp.description}
                    onChange={(e) => setExperience(experience.map((x, j) => j === i ? { ...x, description: e.target.value } : x))}
                    rows={2} className={`${inputClass} resize-none`} placeholder="Describe your role and achievements..." />
                </div>
              ))}
              <button onClick={() => setExperience([...experience, EMPTY_EXP()])}
                className="inline-flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 transition">
                <Plus className="h-4 w-4" /> Add Experience
              </button>
            </Section>

            {/* Education */}
            <Section id="education" title="Education" icon={GraduationCap}>
              {education.map((edu, i) => (
                <div key={edu.id} className="rounded-xl border border-white/5 bg-white/[0.02] p-3 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-400">Education {i + 1}</span>
                    <button onClick={() => setEducation(education.filter((_, j) => j !== i))}
                      className="text-red-400 hover:text-red-300 transition">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="col-span-2">
                      <input value={edu.school} onChange={(e) => setEducation(education.map((x, j) => j === i ? { ...x, school: e.target.value } : x))}
                        className={inputClass} placeholder="School / University" />
                    </div>
                    <input value={edu.degree} onChange={(e) => setEducation(education.map((x, j) => j === i ? { ...x, degree: e.target.value } : x))}
                      className={inputClass} placeholder="Degree (e.g. BSc)" />
                    <input value={edu.field} onChange={(e) => setEducation(education.map((x, j) => j === i ? { ...x, field: e.target.value } : x))}
                      className={inputClass} placeholder="Field of Study" />
                    <input value={edu.from} onChange={(e) => setEducation(education.map((x, j) => j === i ? { ...x, from: e.target.value } : x))}
                      className={inputClass} placeholder="From (e.g. 2018)" />
                    <input value={edu.to} onChange={(e) => setEducation(education.map((x, j) => j === i ? { ...x, to: e.target.value } : x))}
                      className={inputClass} placeholder="To (e.g. 2022)" />
                  </div>
                </div>
              ))}
              <button onClick={() => setEducation([...education, EMPTY_EDU()])}
                className="inline-flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 transition">
                <Plus className="h-4 w-4" /> Add Education
              </button>
            </Section>

            {/* Skills */}
            <Section id="skills" title="Skills" icon={Code}>
              <div className="flex gap-2">
                <input value={skillInput} onChange={(e) => setSkillInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && skillInput.trim()) {
                      setSkills([...skills, skillInput.trim()]);
                      setSkillInput("");
                    }
                  }}
                  className={inputClass} placeholder="Type a skill and press Enter" />
                <button onClick={() => { if (skillInput.trim()) { setSkills([...skills, skillInput.trim()]); setSkillInput(""); } }}
                  className="rounded-xl bg-blue-600 px-3 text-white hover:bg-blue-500 transition">
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {skills.map((skill, i) => (
                  <span key={i} className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">
                    {skill}
                    <button onClick={() => setSkills(skills.filter((_, j) => j !== i))} className="text-slate-500 hover:text-red-400 transition ml-1">×</button>
                  </span>
                ))}
              </div>
            </Section>

            {/* Certifications */}
            <Section id="certifications" title="Certifications" icon={Award}>
              {certifications.map((cert, i) => (
                <div key={cert.id} className="rounded-xl border border-white/5 bg-white/[0.02] p-3 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-400">Certification {i + 1}</span>
                    <button onClick={() => setCertifications(certifications.filter((_, j) => j !== i))}
                      className="text-red-400 hover:text-red-300 transition">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="col-span-2">
                      <input value={cert.name} onChange={(e) => setCertifications(certifications.map((x, j) => j === i ? { ...x, name: e.target.value } : x))}
                        className={inputClass} placeholder="Certification Name" />
                    </div>
                    <input value={cert.year} onChange={(e) => setCertifications(certifications.map((x, j) => j === i ? { ...x, year: e.target.value } : x))}
                      className={inputClass} placeholder="Year" />
                    <div className="col-span-3">
                      <input value={cert.issuer} onChange={(e) => setCertifications(certifications.map((x, j) => j === i ? { ...x, issuer: e.target.value } : x))}
                        className={inputClass} placeholder="Issuing Organization" />
                    </div>
                  </div>
                </div>
              ))}
              <button onClick={() => setCertifications([...certifications, EMPTY_CERT()])}
                className="inline-flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 transition">
                <Plus className="h-4 w-4" /> Add Certification
              </button>
            </Section>

            {/* Actions */}
            <div className="flex flex-wrap gap-3">
              <button onClick={handleSave} disabled={saving}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-500 transition disabled:opacity-50">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}Save CV
              </button>
              <button onClick={handleEmailCV}
                className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 py-2.5 text-sm text-slate-300 hover:bg-white/10 transition">
                <Mail className="h-4 w-4" />Email to Me
              </button>
              <button onClick={handleDownload}
                className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 py-2.5 text-sm text-slate-300 hover:bg-white/10 transition">
                <Download className="h-4 w-4" />Download DOCX
              </button>
            </div>

            {/* Saved CVs */}
            {savedCVs.length > 0 && (
              <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-4">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Saved CVs</p>
                <div className="space-y-2">
                  {savedCVs.map((cv) => (
                    <div key={cv.id} className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.02] px-3 py-2">
                      <div>
                        <p className="text-sm font-medium text-white">{cv.title}</p>
                        <p className="text-xs text-slate-500">{cv.template} · {new Date(cv.updatedAt).toLocaleDateString("en-NG")}</p>
                      </div>
                      <button onClick={() => loadCV(cv.id)}
                        className="rounded-lg border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300 hover:bg-white/10 transition">
                        Load
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── RIGHT: Live Preview ── */}
        <div className={preview ? "col-span-2" : ""}>
          <div className="sticky top-20">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Live Preview — {template === "premium" ? "Premium" : "Basic"} Template
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 overflow-hidden shadow-2xl"
              style={{ transform: "scale(0.75)", transformOrigin: "top left", width: "133.33%", height: "auto" }}>
              {template === "premium" && isPremium
                ? <PremiumTemplate data={cvData} />
                : <BasicTemplate data={cvData} />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
