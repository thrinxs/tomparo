"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  Search, Heart, MessageSquare, Loader2, Globe,
  SlidersHorizontal, ChevronLeft, ChevronRight,
} from "lucide-react";
import toast from "react-hot-toast";

const CATEGORIES = [
  "All","Web Development","Mobile Development","UI/UX Design","Graphic Design",
  "Motion & Video","Photography","Writing & Copywriting","Marketing & Growth",
  "Teaching & Education","Engineering","Finance & Accounting","Data & Analytics",
  "Product Management","Music & Audio","Fashion & Styling","Architecture","Other",
];

function ExploreContent() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const [portfolios, setPortfolios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const [requestedIds, setRequestedIds] = useState<Set<string>>(new Set());

  useEffect(() => { fetchPortfolios(); }, [category, page]);

  const fetchPortfolios = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (category !== "All") params.set("category", category);
      if (search) params.set("search", search);
      params.set("page", String(page));
      const res = await fetch(`/api/portfolio/explore?${params}`);
      const data = await res.json();
      setPortfolios(data.portfolios || []);
      setTotalPages(data.pages || 1);
    } catch { toast.error("Failed to load portfolios"); }
    finally { setLoading(false); }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchPortfolios();
  };

  const handleLike = async (portfolioId: string) => {
    if (!session?.user) { toast.error("Sign in to like portfolios"); return; }
    try {
      const res = await fetch(`/api/portfolio/${portfolioId}/like`, { method: "POST" });
      const data = await res.json();
      setLikedIds(prev => {
        const next = new Set(prev);
        data.liked ? next.add(portfolioId) : next.delete(portfolioId);
        return next;
      });
      setPortfolios(prev => prev.map(p => p.id === portfolioId
        ? { ...p, likesCount: data.liked ? p.likesCount + 1 : p.likesCount - 1 }
        : p
      ));
    } catch { toast.error("Failed"); }
  };

  const handleCvRequest = async (portfolio: any) => {
    if (!session?.user) { toast.error("Sign in to request a CV"); return; }
    try {
      const res = await fetch(`/api/portfolio/${portfolio.id}/cv-request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: "" }),
      });
      const data = await res.json();
      if (!res.ok) return toast.error(data.error || "Failed");
      setRequestedIds(prev => new Set(prev).add(portfolio.id));
      toast.success("CV request sent!");
    } catch { toast.error("Something went wrong"); }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-6 py-10">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Discover Talent</h1>
            <p className="text-slate-500">Explore portfolios from professionals across all fields</p>
          </div>
          <form onSubmit={handleSearch} className="max-w-xl mx-auto flex gap-2">
            <div className="flex-1 relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search portfolios..."
                className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              />
            </div>
            <button type="submit"
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition">
              Search
            </button>
          </form>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Category Filter */}
        <div className="flex gap-2 overflow-x-auto pb-3 mb-8 scrollbar-hide">
          {CATEGORIES.map(c => (
            <button key={c}
              onClick={() => { setCategory(c); setPage(1); }}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition ${
                category === c
                  ? "bg-blue-600 text-white"
                  : "bg-white border border-slate-200 text-slate-600 hover:border-blue-300"
              }`}>
              {c}
            </button>
          ))}
        </div>

        {/* Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={32} className="animate-spin text-blue-600" />
          </div>
        ) : portfolios.length === 0 ? (
          <div className="text-center py-20">
            <Globe size={40} className="text-slate-300 mx-auto mb-3" />
            <h3 className="text-slate-700 font-semibold mb-1">No portfolios found</h3>
            <p className="text-slate-400 text-sm">Try a different category or search term</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {portfolios.map((p: any) => (
              <div key={p.id} className="bg-white border border-slate-200 rounded-3xl overflow-hidden hover:shadow-lg transition group">
                {/* Cover */}
                <a href={`/portfolio/${p.slug}`} target="_blank" rel="noreferrer">
                  <div className="h-44 bg-gradient-to-br from-blue-500 to-purple-600 relative overflow-hidden">
                    {p.coverImage && (
                      <img src={p.coverImage} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                    )}
                    <div className="absolute top-3 left-3">
                      <span className="bg-black/40 backdrop-blur-sm text-white text-xs px-2.5 py-1 rounded-full">
                        {p.category}
                      </span>
                    </div>
                  </div>
                </a>

                <div className="p-4">
                  {/* User info */}
                  <div className="flex items-center gap-2 mb-3">
                    {p.user?.image ? (
                      <img src={p.user.image} alt={p.user.name} className="w-7 h-7 rounded-full object-cover" />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-600">
                        {p.user?.name?.[0] || "?"}
                      </div>
                    )}
                    <span className="text-xs text-slate-500 font-medium">{p.user?.name}</span>
                  </div>

                  <a href={`/portfolio/${p.slug}`} target="_blank" rel="noreferrer">
                    <h3 className="font-bold text-slate-800 mb-1 hover:text-blue-600 transition">{p.title}</h3>
                  </a>
                  {p.tagline && <p className="text-slate-500 text-xs mb-3 line-clamp-2">{p.tagline}</p>}

                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400">{p.projects?.length || 0} projects</span>
                    <div className="flex items-center gap-2">
                      <button onClick={() => handleLike(p.id)}
                        className={`flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg transition ${
                          likedIds.has(p.id)
                            ? "bg-red-100 text-red-500"
                            : "bg-slate-100 text-slate-500 hover:bg-red-50 hover:text-red-400"
                        }`}>
                        <Heart size={12} className={likedIds.has(p.id) ? "fill-current" : ""} />
                        {p.likesCount}
                      </button>
                      <button onClick={() => handleCvRequest(p)}
                        disabled={requestedIds.has(p.id)}
                        className={`flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg transition ${
                          requestedIds.has(p.id)
                            ? "bg-green-100 text-green-600 cursor-default"
                            : "bg-blue-100 text-blue-600 hover:bg-blue-200"
                        }`}>
                        <MessageSquare size={12} />
                        {requestedIds.has(p.id) ? "Requested" : "Request CV"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 mt-10">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 disabled:opacity-40 transition">
              <ChevronLeft size={18} />
            </button>
            <span className="text-sm text-slate-600">Page {page} of {totalPages}</span>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 disabled:opacity-40 transition">
              <ChevronRight size={18} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ExplorePage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><Loader2 size={32} className="animate-spin text-blue-600" /></div>}>
      <ExploreContent />
    </Suspense>
  );
}
