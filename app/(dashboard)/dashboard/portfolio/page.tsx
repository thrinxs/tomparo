"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
  Plus, Folder, Eye, EyeOff, Globe, Lock, Link2,
  Trash2, Pencil, Star, StarOff, Loader2, ExternalLink,
  LayoutGrid, Bell,
} from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";

const CATEGORIES = [
  "Web Development","Mobile Development","UI/UX Design","Graphic Design",
  "Motion & Video","Photography","Writing & Copywriting","Marketing & Growth",
  "Teaching & Education","Engineering","Finance & Accounting","Data & Analytics",
  "Product Management","Music & Audio","Fashion & Styling","Architecture","Other",
];

interface Portfolio {
  id: string;
  title: string;
  slug: string;
  category: string;
  tagline: string;
  coverImage: string;
  template: string;
  visibility: string;
  isDefault: boolean;
  onDiscovery: boolean;
  likesCount: number;
  projects: any[];
  createdAt: string;
}

export default function PortfolioListPage() {
  const { data: session } = useSession();
  const user = session?.user as any;
  const isPremium = user?.isPremium || user?.role === "PREMIUM" || user?.role === "ADMIN";

  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ title: "", slug: "", category: "", tagline: "" });

  useEffect(() => { fetchPortfolios(); }, []);

  const fetchPortfolios = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/portfolio");
      const data = await res.json();
      setPortfolios(Array.isArray(data) ? data : []);
    } catch { toast.error("Failed to load portfolios"); }
    finally { setLoading(false); }
  };

  const autoSlug = (title: string) =>
    title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  const handleCreate = async () => {
    if (!form.title || !form.category) return toast.error("Title and category are required");
    setCreating(true);
    try {
      const res = await fetch("/api/portfolio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, slug: form.slug || autoSlug(form.title) }),
      });
      const data = await res.json();
      if (!res.ok) return toast.error(data.error || "Failed to create");
      toast.success("Portfolio created!");
      setShowCreate(false);
      setForm({ title: "", slug: "", category: "", tagline: "" });
      window.location.href = `/dashboard/portfolio/${data.id}`;
    } catch { toast.error("Something went wrong"); }
    finally { setCreating(false); }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/portfolio/${id}`, { method: "DELETE" });
      if (!res.ok) return toast.error("Failed to delete");
      toast.success("Deleted");
      setPortfolios(prev => prev.filter(p => p.id !== id));
    } catch { toast.error("Something went wrong"); }
  };

  const handleSetDefault = async (id: string) => {
    try {
      await fetch(`/api/portfolio/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isDefault: true }),
      });
      setPortfolios(prev => prev.map(p => ({ ...p, isDefault: p.id === id })));
      toast.success("Default portfolio updated");
    } catch { toast.error("Failed"); }
  };

  const visibilityIcon = (v: string) =>
    v === "PUBLIC" ? <Globe size={14} className="text-green-400" /> :
    v === "LINK_ONLY" ? <Link2 size={14} className="text-amber-400" /> :
    <Lock size={14} className="text-slate-400" />;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Portfolios</h1>
          <p className="text-slate-500 text-sm mt-1">
            {isPremium ? "Unlimited portfolios" : `${portfolios.length} / 1 portfolio (Free plan)`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/dashboard/portfolio/requests"
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-sm font-medium transition">
            <Bell size={16} /> CV Requests
          </Link>
          <button
            onClick={() => {
              if (!isPremium && portfolios.length >= 1) {
                toast.error("Free plan allows 1 portfolio. Upgrade to Premium for unlimited.");
                return;
              }
              setShowCreate(true);
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition"
          >
            <Plus size={16} /> New Portfolio
          </button>
        </div>
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl">
            <h2 className="text-lg font-bold text-slate-800 mb-4">Create New Portfolio</h2>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1 block">Portfolio Title *</label>
                <input
                  value={form.title}
                  onChange={e => {
                    const t = e.target.value;
                    setForm(f => ({ ...f, title: t, slug: autoSlug(t) }));
                  }}
                  placeholder="e.g. My UX Design Work"
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1 block">Category *</label>
                <select
                  value={form.category}
                  onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a category</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1 block">Tagline</label>
                <input
                  value={form.tagline}
                  onChange={e => setForm(f => ({ ...f, tagline: e.target.value }))}
                  placeholder="e.g. Designing experiences that convert"
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1 block">URL Slug</label>
                <div className="flex items-center border border-slate-200 rounded-xl overflow-hidden">
                  <span className="px-3 py-2.5 bg-slate-50 text-slate-400 text-xs border-r border-slate-200">tomparo.com/portfolio/</span>
                  <input
                    value={form.slug}
                    onChange={e => setForm(f => ({ ...f, slug: e.target.value }))}
                    className="flex-1 px-3 py-2.5 text-sm focus:outline-none"
                  />
                </div>
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={() => setShowCreate(false)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 transition">
                Cancel
              </button>
              <button onClick={handleCreate} disabled={creating}
                className="flex-1 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition flex items-center justify-center gap-2">
                {creating ? <><Loader2 size={14} className="animate-spin" /> Creating...</> : "Create Portfolio"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Portfolio Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={32} className="animate-spin text-blue-600" />
        </div>
      ) : portfolios.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed border-slate-200 rounded-3xl">
          <LayoutGrid size={40} className="text-slate-300 mx-auto mb-3" />
          <h3 className="text-slate-700 font-semibold text-lg mb-1">No portfolios yet</h3>
          <p className="text-slate-400 text-sm mb-4">Create your first portfolio to showcase your work</p>
          <button onClick={() => setShowCreate(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition">
            <Plus size={16} /> Create Portfolio
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {portfolios.map(p => (
            <div key={p.id} className="bg-white border border-slate-200 rounded-3xl overflow-hidden hover:shadow-md transition group">
              {/* Cover */}
              <div className="h-36 bg-gradient-to-br from-blue-500 to-purple-600 relative">
                {p.coverImage && (
                  <img src={p.coverImage} alt={p.title} className="w-full h-full object-cover" />
                )}
                <div className="absolute top-3 left-3 flex items-center gap-1.5">
                  <span className="bg-black/40 backdrop-blur-sm text-white text-xs px-2.5 py-1 rounded-full font-medium">
                    {p.category}
                  </span>
                  {p.isDefault && (
                    <span className="bg-amber-500/90 text-white text-xs px-2.5 py-1 rounded-full font-medium flex items-center gap-1">
                      <Star size={10} /> Default
                    </span>
                  )}
                </div>
                <div className="absolute top-3 right-3 flex items-center gap-1.5">
                  <span className="bg-black/40 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                    {visibilityIcon(p.visibility)}
                    {p.visibility === "PUBLIC" ? "Public" : p.visibility === "LINK_ONLY" ? "Link only" : "Private"}
                  </span>
                </div>
              </div>

              {/* Content */}
              <div className="p-4">
                <h3 className="font-bold text-slate-800 text-base mb-0.5">{p.title}</h3>
                {p.tagline && <p className="text-slate-500 text-xs mb-2 line-clamp-1">{p.tagline}</p>}
                <div className="flex items-center gap-3 text-xs text-slate-400 mb-4">
                  <span>{p.projects?.length || 0} projects</span>
                  <span>·</span>
                  <span>❤️ {p.likesCount} likes</span>
                  {p.onDiscovery && <><span>·</span><span className="text-purple-500">On Discovery</span></>}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <Link href={`/dashboard/portfolio/${p.id}`}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition">
                    <Pencil size={12} /> Edit
                  </Link>
                  <a href={`/portfolio/${p.slug}`} target="_blank" rel="noreferrer"
                    className="flex items-center justify-center gap-1.5 px-3 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-medium transition">
                    <ExternalLink size={12} /> View
                  </a>
                  {!p.isDefault && (
                    <button onClick={() => handleSetDefault(p.id)}
                      className="flex items-center justify-center px-3 py-2 border border-amber-200 hover:bg-amber-50 text-amber-600 rounded-xl text-xs font-medium transition"
                      title="Set as default">
                      <Star size={12} />
                    </button>
                  )}
                  <button onClick={() => handleDelete(p.id, p.title)}
                    className="flex items-center justify-center px-3 py-2 border border-red-200 hover:bg-red-50 text-red-500 rounded-xl text-xs font-medium transition">
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
