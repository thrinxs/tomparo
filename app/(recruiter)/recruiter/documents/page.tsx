"use client";

import { useState, useEffect } from "react";
import {
  FolderOpen, FileText, Edit2, Trash2, ChevronDown, ChevronUp,
  Loader2, Plus, Calendar, Files, Check, X, PenLine,
  FileX, GraduationCap, Award, Briefcase, Search,
} from "lucide-react";
import toast from "react-hot-toast";
import Link from "next/link";

const TYPE_CONFIG: Record<string, { label: string; color: string; bg: string; border: string; icon: any }> = {
  CV: { label: "CVs / Resumes", color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20", icon: FileText },
  COVER_LETTER: { label: "Cover Letters", color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20", icon: PenLine },
  REFERENCE_LETTER: { label: "Reference Letters", color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20", icon: Award },
  TRANSCRIPT: { label: "Academic Transcripts", color: "text-purple-400", bg: "bg-purple-500/10", border: "border-purple-500/20", icon: GraduationCap },
  PORTFOLIO: { label: "Portfolios", color: "text-pink-400", bg: "bg-pink-500/10", border: "border-pink-500/20", icon: Briefcase },
  OTHER: { label: "Other Documents", color: "text-slate-400", bg: "bg-slate-500/10", border: "border-slate-500/20", icon: FileX },
};

export default function DocumentLibraryPage() {
  const [batches, setBatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedBatch, setExpandedBatch] = useState<string | null>(null);
  const [editingGroup, setEditingGroup] = useState<string | null>(null);
  const [editingBatch, setEditingBatch] = useState<string | null>(null);
  const [groupName, setGroupName] = useState("");
  const [batchName, setBatchName] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      const res = await fetch("/api/recruiter/documents");
      const data = await res.json();
      setBatches(data.batches || []);
      if (data.batches?.length > 0) setExpandedBatch(data.batches[0].id);
    } catch { toast.error("Failed to load documents"); }
    finally { setLoading(false); }
  };

  const saveGroupName = async (groupId: string) => {
    setSavingId(groupId);
    try {
      const res = await fetch(`/api/recruiter/documents/${groupId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customName: groupName }),
      });
      if (!res.ok) throw new Error("Failed");
      setBatches((prev) => prev.map((b) => ({
        ...b,
        groups: b.groups.map((g: any) => g.id === groupId ? { ...g, customName: groupName } : g),
      })));
      setEditingGroup(null);
      toast.success("Group renamed!");
    } catch { toast.error("Failed to rename group"); }
    finally { setSavingId(null); }
  };

  const saveBatchName = async (batchId: string) => {
    setSavingId(batchId);
    try {
      const res = await fetch(`/api/recruiter/documents/${batchId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ batchName }),
      });
      if (!res.ok) throw new Error("Failed");
      setBatches((prev) => prev.map((b) => b.id === batchId ? { ...b, name: batchName } : b));
      setEditingBatch(null);
      toast.success("Batch renamed!");
    } catch { toast.error("Failed to rename batch"); }
    finally { setSavingId(null); }
  };

  const deleteBatch = async (batchId: string) => {
    if (!confirm("Delete this entire batch and all its files?")) return;
    setDeletingId(batchId);
    try {
      const res = await fetch(`/api/recruiter/documents/${batchId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
      setBatches((prev) => prev.filter((b) => b.id !== batchId));
      toast.success("Batch deleted");
    } catch { toast.error("Failed to delete batch"); }
    finally { setDeletingId(null); }
  };

  const filteredBatches = search
    ? batches.filter((b) =>
        b.name.toLowerCase().includes(search.toLowerCase()) ||
        b.groups.some((g: any) =>
          g.files.some((f: any) => f.fileName.toLowerCase().includes(search.toLowerCase()))
        )
      )
    : batches;

  const totalFiles = batches.reduce((acc, b) => acc + b.totalFiles, 0);
  const totalCVs = batches.reduce((acc, b) => acc + b.groups.filter((g: any) => g.detectedType === "CV").reduce((a: number, g: any) => a + g.fileCount, 0), 0);

  if (loading) return (
    <div className="flex items-center justify-center h-96">
      <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-white">Document Library</h1>
          <p className="text-slate-400 text-sm mt-1">All uploaded documents organised by type and batch.</p>
        </div>
        <Link href="/recruiter/bulk"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-sm font-semibold transition">
          <Plus className="w-4 h-4" />Upload New Batch
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Batches", value: batches.length, color: "text-white" },
          { label: "Total Files", value: totalFiles, color: "text-white" },
          { label: "CVs", value: totalCVs, color: "text-emerald-400" },
          { label: "Other Docs", value: totalFiles - totalCVs, color: "text-slate-400" },
        ].map((stat) => (
          <div key={stat.label} className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 text-center">
            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            <p className="text-xs text-slate-500 mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Search batches or files..."
          className="w-full pl-10 pr-4 py-3 rounded-xl border border-white/10 bg-slate-900/50 text-sm text-white placeholder-slate-500 outline-none focus:border-purple-500/50 transition" />
      </div>

      {/* Batches */}
      {filteredBatches.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-12 text-center space-y-4">
          <FolderOpen className="w-12 h-12 text-slate-600 mx-auto" />
          <p className="text-slate-400">{search ? "No results found." : "No documents uploaded yet."}</p>
          {!search && (
            <Link href="/recruiter/bulk" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 text-white text-sm font-semibold hover:bg-purple-500 transition">
              <Plus className="w-4 h-4" />Upload your first batch
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredBatches.map((batch) => (
            <div key={batch.id} className="rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden">
              {/* Batch header */}
              <div className="flex items-center gap-4 px-6 py-4">
                <button onClick={() => setExpandedBatch(expandedBatch === batch.id ? null : batch.id)}
                  className="flex-1 flex items-center gap-4 text-left">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shrink-0">
                    <FolderOpen className="w-5 h-5 text-purple-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    {editingBatch === batch.id ? (
                      <input value={batchName} onChange={(e) => setBatchName(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        onKeyDown={(e) => e.key === "Enter" && saveBatchName(batch.id)}
                        className="bg-slate-800 border border-purple-500/50 rounded-lg px-2 py-1 text-sm text-white outline-none w-full"
                        autoFocus />
                    ) : (
                      <p className="text-sm font-semibold text-white truncate">{batch.name}</p>
                    )}
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-xs text-slate-500 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(batch.uploadedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                      </span>
                      <span className="text-xs text-slate-500 flex items-center gap-1">
                        <Files className="w-3 h-3" />{batch.totalFiles} files
                      </span>
                    </div>
                  </div>
                  {expandedBatch === batch.id ? <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" /> : <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />}
                </button>

                {/* Batch actions */}
                <div className="flex items-center gap-2 shrink-0">
                  {editingBatch === batch.id ? (
                    <>
                      <button onClick={() => saveBatchName(batch.id)} disabled={savingId === batch.id}
                        className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition">
                        {savingId === batch.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                      </button>
                      <button onClick={() => setEditingBatch(null)} className="p-1.5 rounded-lg bg-white/5 text-slate-400 hover:text-white transition">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </>
                  ) : (
                    <button onClick={() => { setEditingBatch(batch.id); setBatchName(batch.name); }}
                      className="p-1.5 rounded-lg bg-white/5 text-slate-400 hover:text-white transition">
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button onClick={() => deleteBatch(batch.id)} disabled={deletingId === batch.id}
                    className="p-1.5 rounded-lg bg-white/5 text-red-400 hover:bg-red-500/20 transition">
                    {deletingId === batch.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Groups */}
              {expandedBatch === batch.id && (
                <div className="border-t border-white/5 px-6 pb-6 pt-4 space-y-4">
                  {batch.groups.map((group: any) => {
                    const cfg = TYPE_CONFIG[group.detectedType] || TYPE_CONFIG["OTHER"];
                    const Icon = cfg.icon;
                    const displayName = group.customName || cfg.label;
                    return (
                      <div key={group.id} className={`rounded-xl border ${cfg.border} ${cfg.bg} p-4 space-y-3`}>
                        {/* Group header */}
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <Icon className={`w-4 h-4 ${cfg.color} shrink-0`} />
                            {editingGroup === group.id ? (
                              <input value={groupName} onChange={(e) => setGroupName(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && saveGroupName(group.id)}
                                className="flex-1 bg-slate-800 border border-purple-500/50 rounded-lg px-2 py-1 text-sm text-white outline-none"
                                autoFocus />
                            ) : (
                              <p className={`text-sm font-semibold ${cfg.color} truncate`}>
                                {displayName} ({group.fileCount})
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            {editingGroup === group.id ? (
                              <>
                                <button onClick={() => saveGroupName(group.id)} disabled={savingId === group.id}
                                  className="p-1 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition">
                                  {savingId === group.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                                </button>
                                <button onClick={() => setEditingGroup(null)} className="p-1 rounded-lg bg-white/5 text-slate-400 transition">
                                  <X className="w-3 h-3" />
                                </button>
                              </>
                            ) : (
                              <button onClick={() => { setEditingGroup(group.id); setGroupName(displayName); }}
                                className="p-1 rounded-lg bg-white/5 text-slate-500 hover:text-white transition" title="Rename group">
                                <Edit2 className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Files */}
                        <div className="space-y-1.5">
                          {group.files.map((file: any) => (
                            <div key={file.id} className="flex items-center justify-between gap-3 px-3 py-2 rounded-lg bg-black/20">
                              <div className="flex items-center gap-2 min-w-0">
                                <Icon className={`w-3.5 h-3.5 ${cfg.color} shrink-0`} />
                                <p className="text-sm text-slate-300 truncate">{file.fileName}</p>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <span className="text-[10px] text-slate-500">
                                  {new Date(file.uploadedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                                </span>
                                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${cfg.bg} ${cfg.color} font-medium`}>
                                  {file.confidence}%
                                </span>
                                {file.candidateId && (
                                  <Link href={`/recruiter/candidates/${file.candidateId}`}
                                    className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 transition">
                                    View
                                  </Link>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
