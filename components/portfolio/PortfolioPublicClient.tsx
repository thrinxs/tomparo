"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import {
  Heart, ExternalLink, Play, X, MessageSquare,
  Github, Globe, Share2, Loader2, CheckCircle,
} from "lucide-react";
import toast from "react-hot-toast";

interface Project {
  id: string; title: string; description: string;
  coverImage: string; videoUrl: string; videoType: string;
  liveUrl: string; repoUrl: string; tags: string[];
}

interface Portfolio {
  id: string; title: string; slug: string; category: string;
  tagline: string; coverImage: string; template: string;
  visibility: string; onDiscovery: boolean; likesCount: number;
  user: { id: string; name: string; image: string; email: string };
  projects: Project[];
}

function getVideoEmbed(url: string, type: string): string {
  if (type === "youtube") {
    const match = url.match(/(?:v=|youtu\.be\/)([^&?/]+)/);
    if (match) return `https://www.youtube.com/embed/${match[1]}?autoplay=1`;
  }
  if (type === "gdrive") {
    const match = url.match(/\/d\/([^/]+)/);
    if (match) return `https://drive.google.com/file/d/${match[1]}/preview`;
  }
  if (type === "vimeo") {
    const match = url.match(/vimeo\.com\/(\d+)/);
    if (match) return `https://player.vimeo.com/video/${match[1]}?autoplay=1`;
  }
  return url;
}

// ── Template Renderers ─────────────────────────────────────────────────────

function DefaultTemplate({ portfolio, onVideoClick, onLike, liked, likeCount, onCvRequest, cvRequested }: any) {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-6 py-16 flex flex-col md:flex-row items-center gap-8">
          {portfolio.user.image && (
            <img src={portfolio.user.image} alt={portfolio.user.name}
              className="w-24 h-24 rounded-full object-cover ring-4 ring-blue-100 shrink-0" />
          )}
          <div className="flex-1 text-center md:text-left">
            <span className="inline-block bg-blue-100 text-blue-700 text-xs font-semibold px-3 py-1 rounded-full mb-3">{portfolio.category}</span>
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">{portfolio.title}</h1>
            {portfolio.tagline && <p className="text-slate-500 text-lg mb-4">{portfolio.tagline}</p>}
            <p className="text-slate-400 text-sm">By {portfolio.user.name}</p>
          </div>
          <div className="flex flex-col items-center gap-3 shrink-0">
            <ActionButtons liked={liked} likeCount={likeCount} onLike={onLike} cvRequested={cvRequested} onCvRequest={onCvRequest} portfolio={portfolio} />
          </div>
        </div>
      </div>
      {/* Projects */}
      <div className="max-w-5xl mx-auto px-6 py-12">
        <h2 className="text-xl font-bold text-slate-800 mb-6">Projects</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {portfolio.projects.map((p: Project) => (
            <ProjectCard key={p.id} project={p} onVideoClick={onVideoClick} theme="light" />
          ))}
        </div>
      </div>
      <PortfolioFooter />
    </div>
  );
}

function SlateTemplate({ portfolio, onVideoClick, onLike, liked, likeCount, onCvRequest, cvRequested }: any) {
  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border-b border-slate-700">
        <div className="max-w-5xl mx-auto px-6 py-20 flex flex-col md:flex-row items-center gap-8">
          {portfolio.user.image && (
            <img src={portfolio.user.image} alt={portfolio.user.name}
              className="w-28 h-28 rounded-full object-cover ring-4 ring-blue-500/30 shrink-0" />
          )}
          <div className="flex-1">
            <span className="inline-block bg-blue-500/20 text-blue-400 text-xs font-semibold px-3 py-1 rounded-full mb-3">{portfolio.category}</span>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-3">{portfolio.title}</h1>
            {portfolio.tagline && <p className="text-slate-400 text-lg mb-4">{portfolio.tagline}</p>}
            <p className="text-slate-500 text-sm">By {portfolio.user.name}</p>
          </div>
          <div className="flex flex-col gap-3 shrink-0">
            <ActionButtons liked={liked} likeCount={likeCount} onLike={onLike} cvRequested={cvRequested} onCvRequest={onCvRequest} portfolio={portfolio} dark />
          </div>
        </div>
      </div>
      <div className="max-w-5xl mx-auto px-6 py-12">
        <h2 className="text-lg font-bold text-slate-300 uppercase tracking-widest mb-6">Work</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {portfolio.projects.map((p: Project) => (
            <ProjectCard key={p.id} project={p} onVideoClick={onVideoClick} theme="dark" />
          ))}
        </div>
      </div>
      <PortfolioFooter dark />
    </div>
  );
}

function AuroraTemplate({ portfolio, onVideoClick, onLike, liked, likeCount, onCvRequest, cvRequested }: any) {
  return (
    <div className="min-h-screen bg-white">
      <div className="bg-gradient-to-br from-purple-600 via-blue-600 to-cyan-500 text-white">
        <div className="max-w-5xl mx-auto px-6 py-20 text-center">
          {portfolio.user.image && (
            <img src={portfolio.user.image} alt={portfolio.user.name}
              className="w-24 h-24 rounded-full object-cover ring-4 ring-white/30 mx-auto mb-6" />
          )}
          <span className="inline-block bg-white/20 text-white text-xs font-semibold px-3 py-1 rounded-full mb-4">{portfolio.category}</span>
          <h1 className="text-4xl md:text-6xl font-bold mb-4">{portfolio.title}</h1>
          {portfolio.tagline && <p className="text-white/80 text-xl mb-6 max-w-2xl mx-auto">{portfolio.tagline}</p>}
          <p className="text-white/60 text-sm mb-8">By {portfolio.user.name}</p>
          <div className="flex items-center justify-center gap-3">
            <ActionButtons liked={liked} likeCount={likeCount} onLike={onLike} cvRequested={cvRequested} onCvRequest={onCvRequest} portfolio={portfolio} aurora />
          </div>
        </div>
      </div>
      <div className="max-w-5xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {portfolio.projects.map((p: Project) => (
            <ProjectCard key={p.id} project={p} onVideoClick={onVideoClick} theme="aurora" />
          ))}
        </div>
      </div>
      <PortfolioFooter />
    </div>
  );
}

function NoirTemplate({ portfolio, onVideoClick, onLike, liked, likeCount, onCvRequest, cvRequested }: any) {
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="border-b border-yellow-500/20">
        <div className="max-w-5xl mx-auto px-6 py-24 flex flex-col md:flex-row items-center gap-10">
          {portfolio.user.image && (
            <img src={portfolio.user.image} alt={portfolio.user.name}
              className="w-32 h-32 rounded-full object-cover ring-4 ring-yellow-500/40 shrink-0" />
          )}
          <div className="flex-1">
            <span className="inline-block border border-yellow-500/40 text-yellow-500 text-xs font-semibold px-3 py-1 rounded-full mb-4 tracking-widest uppercase">{portfolio.category}</span>
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-3 leading-tight">{portfolio.title}</h1>
            {portfolio.tagline && <p className="text-zinc-400 text-lg mb-4">{portfolio.tagline}</p>}
            <p className="text-zinc-600 text-sm">By {portfolio.user.name}</p>
          </div>
          <div className="flex flex-col gap-3 shrink-0">
            <ActionButtons liked={liked} likeCount={likeCount} onLike={onLike} cvRequested={cvRequested} onCvRequest={onCvRequest} portfolio={portfolio} noir />
          </div>
        </div>
      </div>
      <div className="max-w-5xl mx-auto px-6 py-16">
        <h2 className="text-xs font-bold text-yellow-500 uppercase tracking-widest mb-8">Selected Works</h2>
        <div className="space-y-6">
          {portfolio.projects.map((p: Project) => (
            <ProjectCard key={p.id} project={p} onVideoClick={onVideoClick} theme="noir" />
          ))}
        </div>
      </div>
      <PortfolioFooter dark />
    </div>
  );
}

function MinimalTemplate({ portfolio, onVideoClick, onLike, liked, likeCount, onCvRequest, cvRequested }: any) {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-6 py-20">
        <div className="mb-16">
          <p className="text-slate-400 text-sm uppercase tracking-widest mb-2">{portfolio.category}</p>
          <h1 className="text-5xl font-bold text-slate-900 mb-4 leading-tight">{portfolio.title}</h1>
          {portfolio.tagline && <p className="text-slate-500 text-xl border-l-4 border-slate-200 pl-4">{portfolio.tagline}</p>}
          <p className="text-slate-400 text-sm mt-4">By {portfolio.user.name}</p>
          <div className="flex items-center gap-3 mt-6">
            <ActionButtons liked={liked} likeCount={likeCount} onLike={onLike} cvRequested={cvRequested} onCvRequest={onCvRequest} portfolio={portfolio} />
          </div>
        </div>
        <div className="space-y-12">
          {portfolio.projects.map((p: Project, i: number) => (
            <div key={p.id} className="border-t border-slate-100 pt-8">
              <div className="flex items-start gap-4">
                <span className="text-slate-200 text-4xl font-bold leading-none mt-1">{String(i + 1).padStart(2, "0")}</span>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-slate-800 mb-2">{p.title}</h3>
                  {p.description && <p className="text-slate-500 text-sm leading-relaxed mb-3">{p.description}</p>}
                  {p.videoUrl && (
                    <button onClick={() => onVideoClick(p.videoUrl, p.videoType)}
                      className="flex items-center gap-2 text-sm text-blue-600 hover:underline">
                      <Play size={14} /> Watch video
                    </button>
                  )}
                  {p.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {p.tags.map((t: string) => <span key={t} className="text-xs text-slate-400 border border-slate-200 px-2 py-0.5 rounded">{t}</span>)}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <PortfolioFooter />
    </div>
  );
}

function BoldTemplate({ portfolio, onVideoClick, onLike, liked, likeCount, onCvRequest, cvRequested }: any) {
  return (
    <div className="min-h-screen bg-orange-50">
      <div className="bg-orange-500 text-white">
        <div className="max-w-6xl mx-auto px-6 py-24">
          <span className="inline-block bg-white/20 text-white text-xs font-bold px-3 py-1 rounded-full mb-6 uppercase tracking-widest">{portfolio.category}</span>
          <h1 className="text-6xl md:text-8xl font-black mb-6 leading-none">{portfolio.title}</h1>
          {portfolio.tagline && <p className="text-white/80 text-2xl mb-6 max-w-2xl">{portfolio.tagline}</p>}
          <p className="text-white/60 text-sm mb-8">By {portfolio.user.name}</p>
          <div className="flex items-center gap-3">
            <ActionButtons liked={liked} likeCount={likeCount} onLike={onLike} cvRequested={cvRequested} onCvRequest={onCvRequest} portfolio={portfolio} bold />
          </div>
        </div>
      </div>
      <div className="max-w-6xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {portfolio.projects.map((p: Project) => (
            <ProjectCard key={p.id} project={p} onVideoClick={onVideoClick} theme="bold" />
          ))}
        </div>
      </div>
      <PortfolioFooter />
    </div>
  );
}

// ── Shared Components ──────────────────────────────────────────────────────

function ProjectCard({ project, onVideoClick, theme }: { project: Project; onVideoClick: any; theme: string }) {
  const isDark = theme === "dark" || theme === "noir";
  const cardClass = {
    light: "bg-white border border-slate-200 rounded-2xl overflow-hidden hover:shadow-lg transition",
    dark: "bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden hover:shadow-xl transition",
    aurora: "bg-white border border-slate-100 rounded-2xl overflow-hidden hover:shadow-xl transition",
    noir: "bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden hover:border-yellow-500/30 transition flex gap-4 p-4",
    bold: "bg-white rounded-2xl overflow-hidden hover:shadow-xl transition",
  }[theme] || "bg-white border border-slate-200 rounded-2xl overflow-hidden";

  if (theme === "noir") {
    return (
      <div className={cardClass}>
        {project.coverImage && (
          <img src={project.coverImage} alt={project.title} className="w-32 h-24 object-cover rounded-xl shrink-0" />
        )}
        <div className="flex-1">
          <h3 className="font-bold text-white mb-1">{project.title}</h3>
          {project.description && <p className="text-zinc-400 text-sm line-clamp-2 mb-2">{project.description}</p>}
          <div className="flex items-center gap-3">
            {project.videoUrl && (
              <button onClick={() => onVideoClick(project.videoUrl, project.videoType)}
                className="flex items-center gap-1 text-xs text-yellow-500 hover:underline">
                <Play size={12} /> Watch
              </button>
            )}
            {project.liveUrl && (
              <a href={project.liveUrl} target="_blank" rel="noreferrer"
                className="flex items-center gap-1 text-xs text-zinc-400 hover:text-white">
                <ExternalLink size={12} /> Live
              </a>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cardClass}>
      {project.coverImage && (
        <div className="relative">
          <img src={project.coverImage} alt={project.title} className="w-full h-44 object-cover" />
          {project.videoUrl && (
            <button onClick={() => onVideoClick(project.videoUrl, project.videoType)}
              className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 hover:opacity-100 transition">
              <div className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center">
                <Play size={22} className="text-slate-800 ml-1" />
              </div>
            </button>
          )}
        </div>
      )}
      <div className="p-4">
        <h3 className={`font-bold text-base mb-1 ${isDark ? "text-white" : "text-slate-800"}`}>{project.title}</h3>
        {project.description && (
          <p className={`text-sm line-clamp-2 mb-3 ${isDark ? "text-slate-400" : "text-slate-500"}`}>{project.description}</p>
        )}
        {project.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {project.tags.map((t: string) => (
              <span key={t} className={`text-xs px-2 py-0.5 rounded-full ${
                isDark ? "bg-slate-700 text-slate-300" : "bg-slate-100 text-slate-600"
              }`}>{t}</span>
            ))}
          </div>
        )}
        <div className="flex items-center gap-3">
          {project.videoUrl && !project.coverImage && (
            <button onClick={() => onVideoClick(project.videoUrl, project.videoType)}
              className="flex items-center gap-1 text-xs text-blue-500 hover:underline">
              <Play size={12} /> Watch
            </button>
          )}
          {project.liveUrl && (
            <a href={project.liveUrl} target="_blank" rel="noreferrer"
              className={`flex items-center gap-1 text-xs hover:underline ${isDark ? "text-slate-400" : "text-slate-500"}`}>
              <ExternalLink size={12} /> Live
            </a>
          )}
          {project.repoUrl && (
            <a href={project.repoUrl} target="_blank" rel="noreferrer"
              className={`flex items-center gap-1 text-xs hover:underline ${isDark ? "text-slate-400" : "text-slate-500"}`}>
              <Github size={12} /> Code
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

function ActionButtons({ liked, likeCount, onLike, cvRequested, onCvRequest, portfolio, dark, aurora, noir, bold }: any) {
  const btnBase = "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition";
  const likeClass = liked
    ? `${btnBase} bg-red-500 text-white`
    : noir
    ? `${btnBase} border border-yellow-500/40 text-yellow-500 hover:bg-yellow-500/10`
    : dark
    ? `${btnBase} border border-slate-600 text-slate-300 hover:border-slate-400`
    : `${btnBase} border border-slate-200 text-slate-600 hover:bg-slate-50 bg-white`;

  const cvClass = cvRequested
    ? `${btnBase} bg-green-600 text-white cursor-default`
    : noir
    ? `${btnBase} bg-yellow-500 text-black hover:bg-yellow-400`
    : aurora
    ? `${btnBase} bg-white text-purple-700 hover:bg-white/90`
    : bold
    ? `${btnBase} bg-white text-orange-600 hover:bg-orange-50`
    : dark
    ? `${btnBase} bg-blue-500 text-white hover:bg-blue-600`
    : `${btnBase} bg-blue-600 text-white hover:bg-blue-700`;

  return (
    <>
      <button onClick={onLike} className={likeClass}>
        <Heart size={16} className={liked ? "fill-current" : ""} />
        <span>{likeCount}</span>
      </button>
      {portfolio.onDiscovery && (
        <button onClick={onCvRequest} disabled={cvRequested} className={cvClass}>
          {cvRequested ? <><CheckCircle size={16} /> Requested</> : <><MessageSquare size={16} /> Request CV</>}
        </button>
      )}
      <button onClick={() => { navigator.clipboard.writeText(window.location.href); toast.success("Link copied!"); }}
        className={`${btnBase} ${dark ? "border border-slate-600 text-slate-400 hover:border-slate-400" : "border border-slate-200 text-slate-500 hover:bg-slate-50 bg-white"}`}>
        <Share2 size={16} />
      </button>
    </>
  );
}

function PortfolioFooter({ dark }: { dark?: boolean }) {
  return (
    <div className={`py-8 text-center border-t ${dark ? "border-slate-800 text-slate-600" : "border-slate-100 text-slate-400"}`}>
      <p className="text-xs">Built with <a href="https://tomparo.com" className="text-blue-500 hover:underline">TomParo</a></p>
    </div>
  );
}

// ── Main Client Component ──────────────────────────────────────────────────

export default function PortfolioPublicClient({ portfolio }: { portfolio: Portfolio }) {
  const { data: session } = useSession();
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(portfolio.likesCount || 0);
  const [videoModal, setVideoModal] = useState<{ url: string; type: string } | null>(null);
  const [showCvModal, setShowCvModal] = useState(false);
  const [cvMessage, setCvMessage] = useState("");
  const [cvRequested, setCvRequested] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleLike = async () => {
    if (!session?.user) { toast.error("Sign in to like portfolios"); return; }
    try {
      const res = await fetch(`/api/portfolio/${portfolio.id}/like`, { method: "POST" });
      const data = await res.json();
      setLiked(data.liked);
      setLikeCount(prev => data.liked ? prev + 1 : prev - 1);
    } catch { toast.error("Failed to like"); }
  };

  const handleCvRequest = () => {
    if (!session?.user) { toast.error("Sign in to request a CV"); return; }
    setShowCvModal(true);
  };

  const submitCvRequest = async () => {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/portfolio/${portfolio.id}/cv-request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: cvMessage }),
      });
      const data = await res.json();
      if (!res.ok) return toast.error(data.error || "Failed to send request");
      toast.success("CV request sent! You will be notified when approved.");
      setCvRequested(true);
      setShowCvModal(false);
    } catch { toast.error("Something went wrong"); }
    finally { setSubmitting(false); }
  };

  const templateProps = { portfolio, onVideoClick: (url: string, type: string) => setVideoModal({ url, type }), onLike: handleLike, liked, likeCount, onCvRequest: handleCvRequest, cvRequested };

  const TemplateMap: Record<string, React.ComponentType<any>> = {
    default: DefaultTemplate,
    slate: SlateTemplate,
    aurora: AuroraTemplate,
    noir: NoirTemplate,
    minimal: MinimalTemplate,
    bold: BoldTemplate,
  };

  const Template = TemplateMap[portfolio.template] || DefaultTemplate;

  return (
    <>
      <Template {...templateProps} />

      {/* Video Modal */}
      {videoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm px-4"
          onClick={() => setVideoModal(null)}>
          <div className="relative w-full max-w-4xl aspect-video bg-black rounded-2xl overflow-hidden"
            onClick={e => e.stopPropagation()}>
            <button onClick={() => setVideoModal(null)}
              className="absolute top-3 right-3 z-10 p-2 bg-black/60 hover:bg-black/80 rounded-full text-white">
              <X size={20} />
            </button>
            <iframe src={getVideoEmbed(videoModal.url, videoModal.type)}
              className="w-full h-full" allow="autoplay; fullscreen" allowFullScreen />
          </div>
        </div>
      )}

      {/* CV Request Modal */}
      {showCvModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl">
            <h2 className="text-lg font-bold text-slate-800 mb-1">Request CV from {portfolio.user.name}</h2>
            <p className="text-sm text-slate-500 mb-4">
              Send a request to view their CV. They will be notified and can approve or decline.
            </p>
            <textarea
              value={cvMessage}
              onChange={e => setCvMessage(e.target.value)}
              rows={3}
              placeholder="Optional: introduce yourself or explain why you are interested..."
              className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none mb-4"
            />
            <div className="flex gap-2">
              <button onClick={() => setShowCvModal(false)}
                className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-slate-600 text-sm font-medium hover:bg-slate-50 transition">
                Cancel
              </button>
              <button onClick={submitCvRequest} disabled={submitting}
                className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition flex items-center justify-center gap-2">
                {submitting ? <Loader2 size={14} className="animate-spin" /> : <MessageSquare size={14} />}
                Send Request
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
