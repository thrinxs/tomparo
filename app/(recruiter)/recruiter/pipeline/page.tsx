"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
  useDroppable,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Users,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Star,
  ArrowRight,
  Briefcase,
  GripVertical,
  Upload,
} from "lucide-react";
import toast from "react-hot-toast";

// ── Types ─────────────────────────────────────────────────────────────────────

type CandidateStatus = "NEW" | "REVIEWED" | "SHORTLISTED" | "REJECTED" | "HIRED";

interface Candidate {
  id: string;
  candidateName: string | null;
  candidateEmail: string | null;
  fileName: string;
  atsScore: number | null;
  status: CandidateStatus;
  createdAt: string;
  aiAnalysis: string | null;
  job?: { id: string; title: string } | null;
}

// ── Column config ─────────────────────────────────────────────────────────────

const columns: {
  id: CandidateStatus;
  label: string;
  color: string;
  bg: string;
  border: string;
  borderActive: string;
  bgActive: string;
  dot: string;
  count_bg: string;
}[] = [
  {
    id: "NEW",
    label: "New",
    color: "text-blue-400",
    bg: "bg-blue-500/5",
    border: "border-blue-500/20",
    borderActive: "border-blue-400",
    bgActive: "bg-blue-500/20",
    dot: "bg-blue-400",
    count_bg: "bg-blue-500/20",
  },
  {
    id: "REVIEWED",
    label: "Reviewed",
    color: "text-purple-400",
    bg: "bg-purple-500/5",
    border: "border-purple-500/20",
    borderActive: "border-purple-400",
    bgActive: "bg-purple-500/20",
    dot: "bg-purple-400",
    count_bg: "bg-purple-500/20",
  },
  {
    id: "SHORTLISTED",
    label: "Shortlisted",
    color: "text-amber-400",
    bg: "bg-amber-500/5",
    border: "border-amber-500/20",
    borderActive: "border-amber-400",
    bgActive: "bg-amber-500/20",
    dot: "bg-amber-400",
    count_bg: "bg-amber-500/20",
  },
  {
    id: "REJECTED",
    label: "Rejected",
    color: "text-red-400",
    bg: "bg-red-500/5",
    border: "border-red-500/20",
    borderActive: "border-red-400",
    bgActive: "bg-red-500/20",
    dot: "bg-red-400",
    count_bg: "bg-red-500/20",
  },
  {
    id: "HIRED",
    label: "Hired",
    color: "text-emerald-400",
    bg: "bg-emerald-500/5",
    border: "border-emerald-500/20",
    borderActive: "border-emerald-400",
    bgActive: "bg-emerald-500/20",
    dot: "bg-emerald-400",
    count_bg: "bg-emerald-500/20",
  },
];

const recommendationConfig: Record<string, { color: string; icon: any }> = {
  "Strong Hire": { color: "text-emerald-400", icon: CheckCircle },
  "Hire": { color: "text-blue-400", icon: CheckCircle },
  "Maybe": { color: "text-amber-400", icon: AlertTriangle },
  "No Hire": { color: "text-red-400", icon: XCircle },
};

// ── Candidate Card ─────────────────────────────────────────────────────────────

function CandidateCard({
  candidate,
  isDragging = false,
}: {
  candidate: Candidate;
  isDragging?: boolean;
}) {
  const analysis = candidate.aiAnalysis
    ? JSON.parse(candidate.aiAnalysis)
    : null;
  const recommendation = analysis?.hiringRecommendation as string | undefined;
  const recConfig = recommendation
    ? recommendationConfig[recommendation]
    : null;
  const RecIcon = recConfig?.icon;

  const initials = (candidate.candidateName || candidate.fileName || "?")
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const atsColor =
    (candidate.atsScore || 0) >= 80
      ? "text-emerald-400"
      : (candidate.atsScore || 0) >= 60
      ? "text-amber-400"
      : "text-red-400";

  return (
    <div
      className={`rounded-xl border bg-slate-900 p-4 space-y-3 select-none ${
        isDragging
          ? "border-purple-400 shadow-2xl shadow-purple-500/20 opacity-90"
          : "border-white/10 hover:border-white/25"
      } transition-all cursor-grab active:cursor-grabbing`}
    >
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-lg bg-purple-500/20 flex items-center justify-center shrink-0">
          <span className="text-purple-400 font-bold text-xs">{initials}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white truncate">
            {candidate.candidateName || "Unknown"}
          </p>
          {candidate.candidateEmail && (
            <p className="text-xs text-slate-500 truncate">
              {candidate.candidateEmail}
            </p>
          )}
        </div>
        <GripVertical className="w-4 h-4 text-slate-600 shrink-0 mt-0.5" />
      </div>

      {/* Scores */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-1.5">
          <Star className="w-3 h-3 text-slate-500" />
          <span className={`text-xs font-bold ${atsColor}`}>
            {candidate.atsScore || 0}
          </span>
          <span className="text-xs text-slate-600">/100</span>
        </div>

        {recConfig && RecIcon && (
          <div className="flex items-center gap-1">
            <RecIcon className={`w-3 h-3 ${recConfig.color}`} />
            <span className={`text-xs font-medium ${recConfig.color}`}>
              {recommendation}
            </span>
          </div>
        )}
      </div>

      {/* Job tag */}
      {candidate.job && (
        <div className="flex items-center gap-1.5">
          <Briefcase className="w-3 h-3 text-slate-600" />
          <span className="text-xs text-slate-500 truncate">
            {candidate.job.title}
          </span>
        </div>
      )}

      {/* View link */}
      <Link
        href={`/recruiter/candidates/${candidate.id}`}
        onClick={(e) => e.stopPropagation()}
        className="flex items-center gap-1 text-xs text-purple-400 hover:text-purple-300 transition w-fit"
      >
        View profile
        <ArrowRight className="w-3 h-3" />
      </Link>
    </div>
  );
}

// ── Sortable Card Wrapper ──────────────────────────────────────────────────────

function SortableCard({ candidate }: { candidate: Candidate }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: candidate.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
    >
      <CandidateCard candidate={candidate} isDragging={isDragging} />
    </div>
  );
}

// ── Droppable Column ──────────────────────────────────────────────────────────

function KanbanColumn({
  column,
  candidates,
  isOver,
}: {
  column: (typeof columns)[0];
  candidates: Candidate[];
  isOver: boolean;
}) {
  const { setNodeRef } = useDroppable({ id: column.id });

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col rounded-2xl border-2 p-4 min-h-[500px] transition-all duration-150 ${
        isOver
          ? `${column.borderActive} ${column.bgActive} scale-[1.02] shadow-lg`
          : `${column.border} ${column.bg}`
      }`}
    >
      {/* Column header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-full ${column.dot} ${isOver ? "animate-pulse" : ""}`} />
          <h3 className={`text-sm font-bold ${column.color}`}>
            {column.label}
          </h3>
        </div>
        <span
          className={`px-2.5 py-0.5 rounded-full ${column.count_bg} text-xs font-bold ${column.color}`}
        >
          {candidates.length}
        </span>
      </div>

      {/* Drop indicator */}
      {isOver && (
        <div
          className={`mb-3 rounded-xl border-2 border-dashed ${column.borderActive} p-3 text-center`}
        >
          <p className={`text-xs font-semibold ${column.color}`}>
            Drop here → {column.label}
          </p>
        </div>
      )}

      {/* Cards */}
      <SortableContext
        items={candidates.map((c) => c.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="flex flex-col gap-3 flex-1">
          {candidates.length === 0 && !isOver ? (
            <div className="flex-1 flex items-center justify-center rounded-xl border-2 border-dashed border-white/5 p-6">
              <p className="text-xs text-slate-600 text-center">
                Drag candidates here
              </p>
            </div>
          ) : (
            candidates.map((candidate) => (
              <SortableCard key={candidate.id} candidate={candidate} />
            ))
          )}
        </div>
      </SortableContext>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function PipelinePage() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [jobFilter, setJobFilter] = useState("");
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [overColumnId, setOverColumnId] = useState<CandidateStatus | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    })
  );

  const fetchCandidates = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (jobFilter) params.set("jobId", jobFilter);
      const res = await fetch(`/api/recruiter/candidates?${params}`);
      const data = await res.json();
      if (data.candidates) setCandidates(data.candidates);
    } catch {
      toast.error("Failed to load candidates");
    } finally {
      setLoading(false);
    }
  }, [jobFilter]);

  const fetchJobs = async () => {
    try {
      const res = await fetch("/api/recruiter/jobs");
      const data = await res.json();
      if (data.jobs) setJobs(data.jobs);
    } catch {}
  };

  useEffect(() => { fetchJobs(); }, []);
  useEffect(() => { fetchCandidates(); }, [fetchCandidates]);

  // ── Drag handlers ──
  const handleDragStart = (event: DragStartEvent) => {
    setActiveDragId(event.active.id as string);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { over } = event;
    if (!over) {
      setOverColumnId(null);
      return;
    }

    const overId = over.id as string;

    // Check if over a column
    const col = columns.find((c) => c.id === overId);
    if (col) {
      setOverColumnId(col.id);
      return;
    }

    // Check if over a card — find which column that card is in
    const overCandidate = candidates.find((c) => c.id === overId);
    if (overCandidate) {
      setOverColumnId(overCandidate.status);
      return;
    }

    setOverColumnId(null);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDragId(null);
    setOverColumnId(null);

    if (!over) return;

    const draggedId = active.id as string;
    const overId = over.id as string;

    // Determine target status
    let newStatus: CandidateStatus | null = null;

    const targetColumn = columns.find((col) => col.id === overId);
    if (targetColumn) {
      newStatus = targetColumn.id;
    } else {
      const targetCandidate = candidates.find((c) => c.id === overId);
      if (targetCandidate) newStatus = targetCandidate.status;
    }

    if (!newStatus) return;

    const draggedCandidate = candidates.find((c) => c.id === draggedId);
    if (!draggedCandidate || draggedCandidate.status === newStatus) return;

    // Optimistic update
    setCandidates((prev) =>
      prev.map((c) =>
        c.id === draggedId ? { ...c, status: newStatus! } : c
      )
    );

    // Persist to DB
    try {
      const res = await fetch(`/api/recruiter/candidates/${draggedId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) throw new Error();
      toast.success(
        `Moved to ${columns.find((c) => c.id === newStatus)?.label}`
      );
    } catch {
      // Rollback
      setCandidates((prev) =>
        prev.map((c) =>
          c.id === draggedId
            ? { ...c, status: draggedCandidate.status }
            : c
        )
      );
      toast.error("Failed to update status");
    }
  };

  const activeDragCandidate = candidates.find((c) => c.id === activeDragId);

  // Group by status
  const grouped = columns.reduce((acc, col) => {
    acc[col.id] = candidates.filter((c) => c.status === col.id);
    return acc;
  }, {} as Record<CandidateStatus, Candidate[]>);

  const totalCandidates = candidates.length;
  const shortlisted = candidates.filter((c) => c.status === "SHORTLISTED").length;
  const hired = candidates.filter((c) => c.status === "HIRED").length;

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Hiring Pipeline</h1>
          <p className="text-slate-400 mt-1">
            {totalCandidates} candidates · {shortlisted} shortlisted · {hired} hired
          </p>
        </div>

        {jobs.length > 0 && (
          <select
            value={jobFilter}
            onChange={(e) => setJobFilter(e.target.value)}
            className="rounded-xl border border-white/10 bg-white/[0.02] px-4 py-2.5 text-sm text-white outline-none focus:border-purple-500/50 transition"
          >
            <option value="" className="bg-slate-900">All Jobs</option>
            {jobs.map((j) => (
              <option key={j.id} value={j.id} className="bg-slate-900">
                {j.title}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-5 gap-3">
        {columns.map((col) => (
          <div
            key={col.id}
            className={`rounded-xl border ${col.border} ${col.bg} px-4 py-3 text-center`}
          >
            <p className={`text-2xl font-bold ${col.color}`}>
              {grouped[col.id]?.length || 0}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">{col.label}</p>
          </div>
        ))}
      </div>

      {/* Hint */}
      {!loading && totalCandidates > 0 && (
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <GripVertical className="w-3.5 h-3.5" />
          Drag candidate cards between columns to update their status
        </div>
      )}

      {/* Empty state */}
      {!loading && totalCandidates === 0 && (
        <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-16 text-center">
          <Users className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">
            No candidates yet
          </h3>
          <p className="text-slate-400 text-sm mb-6">
            Upload CVs to start your pipeline
          </p>
          <Link
            href="/recruiter/upload"
            className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-purple-500 transition"
          >
            <Upload className="w-4 h-4" />
            Upload CV
          </Link>
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-4">
          {columns.map((col) => (
            <div
              key={col.id}
              className={`rounded-2xl border ${col.border} ${col.bg} p-4 min-h-[400px] animate-pulse`}
            >
              <div className="h-4 bg-white/5 rounded w-1/2 mb-4" />
              <div className="space-y-3">
                {[1, 2].map((i) => (
                  <div key={i} className="rounded-xl bg-white/5 h-28" />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Kanban Board */}
      {!loading && totalCandidates > 0 && (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-4 pb-8">
            {columns.map((col) => (
              <KanbanColumn
                key={col.id}
                column={col}
                candidates={grouped[col.id] || []}
                isOver={overColumnId === col.id}
              />
            ))}
          </div>

          {/* Drag overlay — follows cursor */}
          <DragOverlay dropAnimation={null}>
            {activeDragCandidate ? (
              <div className="w-64 rotate-2">
                <CandidateCard candidate={activeDragCandidate} isDragging />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      )}
    </div>
  );
}
