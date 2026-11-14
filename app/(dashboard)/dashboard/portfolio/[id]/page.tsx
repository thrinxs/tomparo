"use client";

import { useState, useEffect, use } from "react";
import { useSession } from "next-auth/react";
import {
  Save, ArrowLeft, Plus, Trash2, Loader2, Eye, ExternalLink,
  Globe, Lock, Link2, Star, Video, Image as ImageIcon, X,
  GripVertical, ChevronDown, ChevronUp, Sparkles,
} from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";

const CATEGORIES = [
  "Web Development","Mobile Development","UI/UX Design","Graphic Design",
  "Motion & Video","Photography","Writing & Copywriting","Marketing & Growth",
  "Teaching & Education","Engineering","Finance & Accounting","Data & Analytics",
  "Product Management","Music & Audio","Fashion & Styling","Architecture","Other",
];

const TEMPLATES = [
  { id: "default", name: "Default", desc: "Clean white, blue accents", free: true },
  { id: "slate", name: "Slate", desc: "Dark bg, white text — tech/dev", free: false },
  { id: "aurora", name: "Aurora", desc: "Gradient header — creative/design", free: false },
  { id: "noir", name: "Noir", desc: "Black & gold — executive", free: false },
  { id: "minimal", name: "Minimal", desc: "Typographic — writers/consultants", free: false },
  { id: "bold", name: "Bold", desc: "Big typography — marketing/media", free: false },
];

function detectVideoType(url: string): string {
  if (!url) return "";
  if (url.includes("youtube.com") || url.includes("youtu.be")) return "youtube";
  if (url.includes("drive.google.com")) return "gdrive";
  if (url.includes("vimeo.com")) return "vimeo";
  return "other";
}

function getVideoThumbnail(url: string, type: string): string {
  if (type === "youtube") {
    const match = url.match(/(?:v=|youtu\.be\/)([^&?/]+)/);
    if (match) return `https://img.youtube.com/vi/${match[1]}/hqdefault.jpg`;
  }
  if (type === "gdrive") {
    const match = url.match(/\/d\/([^/]+)/);
    if (match) return `https://drive.google.com/thumbnail?id=${match[1]}&sz=w800`;
  }
  return "";
}

function getVideoEmbed(url: string, type: string): string {
  if (type === "youtube") {
    const match = url.match(/(?:v=|youtu\.be\/)([^&?/]+)/);
    if (match) return `https://www.youtube.com/embed/${match[1]}`;
  }
  if (type === "gdrive") {
    const match = url.match(/\/d\/([^/]+)/);
    if (match) return `https://drive.google.com/file/d/${match[1]}/preview`;
  }
  if (type === "vimeo") {
    const match = url.match(/vimeo\.com\/(\d+)/);
    if (match) return `https://player.vimeo.com/video/${match[1]}`;
  }
  return url;
}

interface Project {
  id: string;
  title: string;
  description: string;
  coverImage: string;
  videoUrl: string;
  videoType: string;
  liveUrl: string;
  repoUrl: string;
  tags: string[];
  order: number;
  isNew?: boolean;
}

export default function PortfolioEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: session } = useSession();
  const user = session?.user as any;
  const isPremium = user?.isPremium || user?.role === "PREMIUM" || user?.role === "ADMIN";

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [portfolio, setPortfolio] = useState<any>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [expandedProject, setExpandedProject] = useState<string | null>(null);
  const [videoModal, setVideoModal] = useState<{ url: string; type: string } | null>(null);

  // Portfolio fields
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [category, setCategory] = useState("");
  const [tagline, setTagline] = useState("");
  const [coverImage, setCoverImage] = useState("");
  const [template, setTemplate] = useState("default");
  const [visibility, setVisibility] = useState("PUBLIC");
  const [onDiscovery, setOnDiscovery] = useState(false);
  const [isDefault, setIsDefault] = useState(false);

  useEffect(() => { fetchPortfolio(); }, [id]);

  const fetchPortfolio = async () => {
    try {
      const res = await fetch(`/api/portfolio/${id}`);
      if (!res.ok) return toast.error("Portfolio not found");
      const data = await res.json();
      setPortfolio(data);
      setTitle(data.title || "");
      setSlug(data.slug || "");
      setCategory(data.category || "");
      setTagline(data.tagline || "");
      setCoverImage(data.coverImage || "");
      setTemplate(data.template || "default");
      setVisibility(data.visibility || "PUBLIC");
      setOnDiscovery(data.onDiscovery || false);
      setIsDefault(data.isDefault || false);
      setProjects((data.projects || []).map((p: any) => ({
        ...p,
        tags: p.tags ? JSON.parse(p.tags) : [],
      })));
    } catch { toast.error("Failed to load portfolio"); }
    finally { setLoading(false); }
  };

  const savePortfolio = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/portfolio/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, slug, category, tagline, coverImage, template, visibility, onDiscovery, isDefault }),
      });
      const data = await res.json();
      if (!res.ok) return toast.error(data.error || "Failed to save");
      toast.success("Portfolio saved!");
    } catch { toast.error("Failed to save"); }
    finally { setSaving(false); }
  };

  const addProject = () => {
    const newProj: Project = {
      id: `new-${Date.now()}`,
      title: "", description: "", coverImage: "", videoUrl: "",
      videoType: "", liveUrl: "", repoUrl: "", tags: [],
      order: projects.length, isNew: true,
    };
    setProjects(prev => [...prev, newProj]);
    setExpandedProject(newProj.id);
  };

  const updateProject = (projId: string, field: string, value: any) => {
    setProjects(prev => prev.map(p => {
      if (p.id !== projId) return p;
      const updated = { ...p, [field]: value };
      if (field === "videoUrl") {
        updated.videoType = detectVideoType(value);
        updated.coverImage = updated.coverImage || getVideoThumbnail(value, updated.videoType);
      }
      return updated;
    }));
  };

  const saveProject = async (proj: Project) => {
    if (!proj.title) return toast.error("Project title is required");
    try {
      if (proj.isNew) {
        const res = await fetch(`/api/portfolio/${id}/projects`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...proj, tags: proj.tags }),
        });
        const data = await res.json();
        if (!res.ok) return toast.error(data.error || "Failed to save project");
        setProjects(prev => prev.map(p => p.id === proj.id ? { ...data, tags: data.tags ? JSON.parse(data.tags) : [], isNew: false } : p));
        toast.success("Project added!");
      } else {
        const res = await fetch(`/api/portfolio/${id}/projects/${proj.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...proj, tags: proj.tags }),
        });
        if (!res.ok) return toast.error("Failed to update project");
        toast.success("Project updated!");
      }
    } catch { toast.error("Something went wrong"); }
  };

  const deleteProject = async (proj: Project) => {
    if (!confirm("Delete this project?")) return;
    if (!proj.isNew) {
      try {
        await fetch(`/api/portfolio/${id}/projects/${proj.id}`, { method: "DELETE" });
      } catch { toast.error("Failed to delete"); return; }
    }
    setProjects(prev => prev.filter(p => p.id !== proj.id));
    toast.success("Project removed");
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <Loader2 size={32} className="animate-spin text-blue-600" />
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/portfolio" className="p-2 rounded-xl hover:bg-slate-100 text-slate-500 transition">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-slate-800">{title || "Edit Portfolio"}</h1>
            <a href={`/portfolio/${slug}`} target="_blank" rel="noreferrer"
              className="text-xs text-blue-500 hover:underline flex items-center gap-1 mt-0.5">
              tomparo.com/portfolio/{slug} <ExternalLink size={10} />
            </a>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <a href={`/portfolio/${slug}`} target="_blank" rel="noreferrer"
            className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 text-sm font-medium transition">
            <Eye size={16} /> Preview
          </a>
          <button onClick={savePortfolio} disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition">
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {/* Basic Info */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6">
          <h2 className="font-bold text-slate-800 mb-4">Portfolio Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1 block">Title *</label>
              <input value={title} onChange={e => setTitle(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1 block">Category *</label>
              <select value={category} onChange={e => setCategory(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="text-xs font-semibold text-slate-600 mb-1 block">Tagline</label>
              <input value={tagline} onChange={e => setTagline(e.target.value)}
                placeholder="e.g. Building beautiful digital experiences"
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1 block">URL Slug</label>
              <div className="flex items-center border border-slate-200 rounded-xl overflow-hidden">
                <span className="px-3 py-2.5 bg-slate-50 text-slate-400 text-xs border-r border-slate-200 whitespace-nowrap">tomparo.com/portfolio/</span>
                <input value={slug} onChange={e => setSlug(e.target.value)}
                  className="flex-1 px-3 py-2.5 text-sm focus:outline-none" />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1 block">Cover Image URL</label>
              <input value={coverImage} onChange={e => setCoverImage(e.target.value)}
                placeholder="https://..."
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
        </div>

        {/* Visibility & Settings */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6">
          <h2 className="font-bold text-slate-800 mb-4">Visibility & Settings</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {["PUBLIC","LINK_ONLY","PRIVATE"].map(v => (
              <button key={v} onClick={() => setVisibility(v)}
                className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition ${
                  visibility === v ? "border-blue-500 bg-blue-50" : "border-slate-200 hover:border-slate-300"
                }`}>
                {v === "PUBLIC" ? <Globe size={18} className="text-green-500" /> :
                 v === "LINK_ONLY" ? <Link2 size={18} className="text-amber-500" /> :
                 <Lock size={18} className="text-slate-400" />}
                <div className="text-left">
                  <p className="text-sm font-semibold text-slate-700">
                    {v === "PUBLIC" ? "Public" : v === "LINK_ONLY" ? "Link Only" : "Private"}
                  </p>
                  <p className="text-xs text-slate-400">
                    {v === "PUBLIC" ? "Anyone can find it" : v === "LINK_ONLY" ? "Only with link" : "Only you"}
                  </p>
                </div>
              </button>
            ))}
          </div>

          <div className="mt-4 space-y-3">
            <label className={`flex items-center justify-between p-4 rounded-2xl border-2 cursor-pointer transition ${
              isDefault ? "border-amber-400 bg-amber-50" : "border-slate-200 hover:border-slate-300"
            }`}>
              <div className="flex items-center gap-3">
                <Star size={18} className={isDefault ? "text-amber-500" : "text-slate-400"} />
                <div>
                  <p className="text-sm font-semibold text-slate-700">Set as Default Portfolio</p>
                  <p className="text-xs text-slate-400">Shown on your public profile</p>
                </div>
              </div>
              <input type="checkbox" checked={isDefault} onChange={e => setIsDefault(e.target.checked)} className="w-4 h-4 accent-amber-500" />
            </label>

            {isPremium && (
              <label className={`flex items-center justify-between p-4 rounded-2xl border-2 cursor-pointer transition ${
                onDiscovery ? "border-purple-400 bg-purple-50" : "border-slate-200 hover:border-slate-300"
              }`}>
                <div className="flex items-center gap-3">
                  <Sparkles size={18} className={onDiscovery ? "text-purple-500" : "text-slate-400"} />
                  <div>
                    <p className="text-sm font-semibold text-slate-700">Show on Discovery Page</p>
                    <p className="text-xs text-slate-400">Employers & clients can find and like your portfolio</p>
                  </div>
                </div>
                <input type="checkbox" checked={onDiscovery} onChange={e => setOnDiscovery(e.target.checked)} className="w-4 h-4 accent-purple-500" />
              </label>
            )}
          </div>
        </div>

        {/* Template Picker — Premium Only */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-slate-800">Template</h2>
            {!isPremium && <span className="text-xs bg-amber-100 text-amber-700 px-2.5 py-1 rounded-full font-medium">Premium templates require upgrade</span>}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {TEMPLATES.map(t => (
              <button key={t.id}
                onClick={() => { if (!t.free && !isPremium) { toast.error("Upgrade to Premium to use this template"); return; } setTemplate(t.id); }}
                className={`p-4 rounded-2xl border-2 text-left transition relative ${
                  template === t.id ? "border-blue-500 bg-blue-50" : "border-slate-200 hover:border-slate-300"
                } ${!t.free && !isPremium ? "opacity-60" : ""}`}>
                {!t.free && !isPremium && (
                  <span className="absolute top-2 right-2 text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full">Pro</span>
                )}
                <p className="font-semibold text-slate-700 text-sm">{t.name}</p>
                <p className="text-xs text-slate-400 mt-0.5">{t.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Projects */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-bold text-slate-800">Projects</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {isPremium ? "Unlimited projects" : `${projects.length} / 10 projects`}
              </p>
            </div>
            <button onClick={addProject}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition">
              <Plus size={16} /> Add Project
            </button>
          </div>

          <div className="space-y-3">
            {projects.length === 0 && (
              <div className="text-center py-10 border-2 border-dashed border-slate-200 rounded-2xl">
                <ImageIcon size={28} className="text-slate-300 mx-auto mb-2" />
                <p className="text-slate-400 text-sm">No projects yet. Add your first project.</p>
              </div>
            )}

            {projects.map(proj => (
              <div key={proj.id} className="border border-slate-200 rounded-2xl overflow-hidden">
                {/* Project Header */}
                <div className="flex items-center gap-3 px-4 py-3 bg-slate-50 cursor-pointer"
                  onClick={() => setExpandedProject(expandedProject === proj.id ? null : proj.id)}>
                  <GripVertical size={16} className="text-slate-300" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-700 truncate">{proj.title || "Untitled Project"}</p>
                    {proj.videoUrl && <p className="text-xs text-blue-500 mt-0.5 flex items-center gap-1"><Video size={10} /> Has video</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    {proj.videoUrl && (
                      <button onClick={e => { e.stopPropagation(); setVideoModal({ url: proj.videoUrl, type: proj.videoType }); }}
                        className="p-1.5 hover:bg-slate-200 rounded-lg text-blue-500 transition">
                        <Eye size={14} />
                      </button>
                    )}
                    <button onClick={e => { e.stopPropagation(); deleteProject(proj); }}
                      className="p-1.5 hover:bg-red-100 rounded-lg text-red-400 transition">
                      <Trash2 size={14} />
                    </button>
                    {expandedProject === proj.id ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
                  </div>
                </div>

                {/* Project Form */}
                {expandedProject === proj.id && (
                  <div className="p-4 space-y-3">
                    <div>
                      <label className="text-xs font-semibold text-slate-600 mb-1 block">Project Title *</label>
                      <input value={proj.title} onChange={e => updateProject(proj.id, "title", e.target.value)}
                        placeholder="e.g. Brand Identity for TechCorp"
                        className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-600 mb-1 block">Description</label>
                      <textarea value={proj.description} onChange={e => updateProject(proj.id, "description", e.target.value)}
                        rows={3} placeholder="What did you build? What was the impact?"
                        className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-600 mb-1 block">Video URL (YouTube, Google Drive, Vimeo)</label>
                      <input value={proj.videoUrl} onChange={e => updateProject(proj.id, "videoUrl", e.target.value)}
                        placeholder="https://youtube.com/watch?v=... or drive.google.com/..."
                        className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                      {proj.videoUrl && (
                        <div className="mt-2 flex items-center gap-2">
                          {proj.coverImage && <img src={proj.coverImage} alt="thumb" className="w-20 h-12 object-cover rounded-lg" />}
                          <button onClick={() => setVideoModal({ url: proj.videoUrl, type: proj.videoType })}
                            className="text-xs text-blue-500 hover:underline flex items-center gap-1">
                            <Eye size={12} /> Preview video
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-semibold text-slate-600 mb-1 block">Cover Image URL</label>
                        <input value={proj.coverImage} onChange={e => updateProject(proj.id, "coverImage", e.target.value)}
                          placeholder="https://..."
                          className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-slate-600 mb-1 block">Live URL</label>
                        <input value={proj.liveUrl} onChange={e => updateProject(proj.id, "liveUrl", e.target.value)}
                          placeholder="https://..."
                          className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-600 mb-1 block">Tags (comma separated)</label>
                      <input
                        value={proj.tags.join(", ")}
                        onChange={e => updateProject(proj.id, "tags", e.target.value.split(",").map(t => t.trim()).filter(Boolean))}
                        placeholder="React, Figma, Branding"
                        className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <button onClick={() => saveProject(proj)}
                      className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition flex items-center justify-center gap-2">
                      <Save size={14} /> Save Project
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Video Modal */}
      {videoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm px-4"
          onClick={() => setVideoModal(null)}>
          <div className="relative w-full max-w-3xl aspect-video bg-black rounded-2xl overflow-hidden"
            onClick={e => e.stopPropagation()}>
            <button onClick={() => setVideoModal(null)}
              className="absolute top-3 right-3 z-10 p-2 bg-black/60 hover:bg-black/80 rounded-full text-white transition">
              <X size={18} />
            </button>
            <iframe
              src={getVideoEmbed(videoModal.url, videoModal.type)}
              className="w-full h-full"
              allow="autoplay; fullscreen"
              allowFullScreen
            />
          </div>
        </div>
      )}
    </div>
  );
}
