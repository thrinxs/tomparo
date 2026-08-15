"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
  Plus, CheckSquare, Clock, AlertTriangle, Loader2,
  User, Calendar, MessageSquare, ChevronDown, ChevronUp,
  CheckCircle, Circle, Zap, Flag, Trash2, Send,
} from "lucide-react";
import toast from "react-hot-toast";
import Link from "next/link";

const PRIORITY_CONFIG: Record<string, { color: string; bg: string; border: string; label: string; icon: any }> = {
  LOW:    { color: "text-slate-400",   bg: "bg-slate-500/10",  border: "border-slate-500/20",  label: "Low",    icon: Circle },
  MEDIUM: { color: "text-blue-400",    bg: "bg-blue-500/10",   border: "border-blue-500/20",   label: "Medium", icon: Flag   },
  HIGH:   { color: "text-amber-400",   bg: "bg-amber-500/10",  border: "border-amber-500/20",  label: "High",   icon: AlertTriangle },
  URGENT: { color: "text-red-400",     bg: "bg-red-500/10",    border: "border-red-500/20",    label: "Urgent", icon: Zap    },
};

const STATUS_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
  TODO:        { color: "text-slate-400",   bg: "bg-slate-500/10",   label: "To Do"      },
  IN_PROGRESS: { color: "text-blue-400",    bg: "bg-blue-500/10",    label: "In Progress" },
  DONE:        { color: "text-emerald-400", bg: "bg-emerald-500/10", label: "Done"        },
};

export default function TasksPage() {
  const { data: session } = useSession();
  const user = session?.user as any;
  const [tasks, setTasks] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [expandedTask, setExpandedTask] = useState<string | null>(null);
  const [comment, setComment] = useState<Record<string, string>>({});
  const [sendingComment, setSendingComment] = useState<string | null>(null);
  const [updatingTask, setUpdatingTask] = useState<string | null>(null);
  const [deletingTask, setDeletingTask] = useState<string | null>(null);

  // Form state
  const [form, setForm] = useState({
    title: "", description: "", priority: "MEDIUM",
    assignedToId: "", dueDate: "", candidateId: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const [filterStatus, setFilterStatus] = useState("ALL");
  const [filterAssignee, setFilterAssignee] = useState("ALL");

  useEffect(() => {
    Promise.all([
      fetch("/api/recruiter/team/tasks").then((r) => r.json()),
      fetch("/api/recruiter/team").then((r) => r.json()),
    ]).then(([taskData, teamData]) => {
      setTasks(taskData.tasks || []);
      setMembers(teamData.members || []);
    }).catch(() => toast.error("Failed to load tasks"))
    .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async () => {
    if (!form.title.trim()) { toast.error("Task title required"); return; }
    if (!form.assignedToId) { toast.error("Please assign this task to a team member"); return; }
    setSubmitting(true);
    try {
      const res = await fetch("/api/recruiter/team/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setTasks((prev) => [data.task, ...prev]);
      setForm({ title: "", description: "", priority: "MEDIUM", assignedToId: "", dueDate: "", candidateId: "" });
      setShowForm(false);
      toast.success("Task created!");
    } catch (err: any) { toast.error(err.message || "Failed to create task"); }
    finally { setSubmitting(false); }
  };

  const handleStatusChange = async (taskId: string, status: string) => {
    setUpdatingTask(taskId);
    try {
      const res = await fetch(`/api/recruiter/team/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setTasks((prev) => prev.map((t) => t.id === taskId ? data.task : t));
      toast.success("Status updated");
    } catch (err: any) { toast.error(err.message || "Failed to update task"); }
    finally { setUpdatingTask(null); }
  };

  const handleDelete = async (taskId: string) => {
    if (!confirm("Delete this task?")) return;
    setDeletingTask(taskId);
    try {
      const res = await fetch(`/api/recruiter/team/tasks/${taskId}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
      toast.success("Task deleted");
    } catch { toast.error("Failed to delete task"); }
    finally { setDeletingTask(null); }
  };

  const handleComment = async (taskId: string) => {
    const content = comment[taskId]?.trim();
    if (!content) return;
    setSendingComment(taskId);
    try {
      const res = await fetch(`/api/recruiter/team/tasks/${taskId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setTasks((prev) => prev.map((t) => t.id === taskId
        ? { ...t, comments: [...t.comments, data.comment] } : t));
      setComment((prev) => ({ ...prev, [taskId]: "" }));
    } catch { toast.error("Failed to add comment"); }
    finally { setSendingComment(null); }
  };

  const filteredTasks = tasks.filter((t) => {
    if (filterStatus !== "ALL" && t.status !== filterStatus) return false;
    if (filterAssignee !== "ALL" && t.assignedToId !== filterAssignee) return false;
    return true;
  });

  const statusGroups = ["TODO", "IN_PROGRESS", "DONE"];

  if (loading) return <div className="flex items-center justify-center h-96"><Loader2 className="w-8 h-8 animate-spin text-purple-400" /></div>;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-white">Tasks</h1>
          <p className="text-slate-400 text-sm mt-1">Assign and track team tasks.</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/recruiter/team" className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/10 bg-white/5 text-slate-400 text-sm font-medium hover:text-white transition">
            Back to Team
          </Link>
          <button onClick={() => setShowForm(!showForm)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-sm font-semibold transition">
            <Plus className="w-4 h-4" />New Task
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {statusGroups.map((s) => {
          const count = tasks.filter((t) => t.status === s).length;
          const sc = STATUS_CONFIG[s];
          return (
            <div key={s} className={`rounded-2xl border border-white/10 p-4 text-center ${sc.bg}`}>
              <p className={`text-2xl font-bold ${sc.color}`}>{count}</p>
              <p className="text-xs text-slate-500 mt-0.5">{sc.label}</p>
            </div>
          );
        })}
      </div>

      {/* Create task form */}
      {showForm && (
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 space-y-4">
          <h3 className="text-sm font-semibold text-white">Create New Task</h3>
          <div className="space-y-3">
            <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Task title *" className="w-full rounded-xl border border-white/10 bg-slate-900/50 px-4 py-2.5 text-sm text-white placeholder-slate-600 outline-none focus:border-purple-500/50 transition" />
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Description (optional)" rows={3}
              className="w-full rounded-xl border border-white/10 bg-slate-900/50 px-4 py-3 text-sm text-white placeholder-slate-600 outline-none focus:border-purple-500/50 resize-none transition" />
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="text-[10px] text-slate-500 mb-1 block">Priority</label>
                <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}
                  className="w-full rounded-xl border border-white/10 bg-slate-900/50 px-3 py-2 text-sm text-white outline-none transition">
                  {Object.entries(PRIORITY_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] text-slate-500 mb-1 block">Assign To *</label>
                <select value={form.assignedToId} onChange={(e) => setForm({ ...form, assignedToId: e.target.value })}
                  className="w-full rounded-xl border border-white/10 bg-slate-900/50 px-3 py-2 text-sm text-white outline-none transition">
                  <option value="">Select member</option>
                  {members.map((m) => <option key={m.userId} value={m.userId}>{m.user?.name || m.user?.email}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] text-slate-500 mb-1 block">Due Date</label>
                <input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                  className="w-full rounded-xl border border-white/10 bg-slate-900/50 px-3 py-2 text-sm text-white outline-none transition" />
              </div>
              <div className="flex items-end">
                <button onClick={handleSubmit} disabled={submitting}
                  className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-sm font-semibold transition disabled:opacity-50">
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  {submitting ? "Creating..." : "Create"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
          className="rounded-xl border border-white/10 bg-white/[0.02] px-4 py-2 text-sm text-white outline-none transition">
          <option value="ALL">All Statuses</option>
          {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <select value={filterAssignee} onChange={(e) => setFilterAssignee(e.target.value)}
          className="rounded-xl border border-white/10 bg-white/[0.02] px-4 py-2 text-sm text-white outline-none transition">
          <option value="ALL">All Members</option>
          {members.map((m) => <option key={m.userId} value={m.userId}>{m.user?.name || m.user?.email}</option>)}
        </select>
      </div>

      {/* Task list */}
      <div className="space-y-3">
        {filteredTasks.length === 0 && (
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-12 text-center space-y-3">
            <CheckSquare className="w-10 h-10 text-slate-600 mx-auto" />
            <p className="text-slate-400 text-sm">No tasks yet. Create one to get started.</p>
          </div>
        )}
        {filteredTasks.map((task) => {
          const pc = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.MEDIUM;
          const sc = STATUS_CONFIG[task.status] || STATUS_CONFIG.TODO;
          const PriorityIcon = pc.icon;
          const isExpanded = expandedTask === task.id;
          const isMyTask = task.assignedToId === user?.id;
          const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== "DONE";

          return (
            <div key={task.id} className={`rounded-2xl border transition ${
              isOverdue ? "border-red-500/20 bg-red-500/5" : "border-white/10 bg-white/[0.02]"
            }`}>
              <div className="p-5">
                <div className="flex items-start gap-4">
                  {/* Status toggle */}
                  <button
                    onClick={() => handleStatusChange(task.id, task.status === "TODO" ? "IN_PROGRESS" : task.status === "IN_PROGRESS" ? "DONE" : "TODO")}
                    disabled={updatingTask === task.id}
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 transition ${
                      task.status === "DONE" ? "bg-emerald-500 border-emerald-500" :
                      task.status === "IN_PROGRESS" ? "border-blue-400" : "border-slate-600 hover:border-white"
                    }`}
                  >
                    {task.status === "DONE" && <CheckCircle className="w-3 h-3 text-white" />}
                    {updatingTask === task.id && <Loader2 className="w-3 h-3 animate-spin text-slate-400" />}
                  </button>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <p className={`text-sm font-semibold ${task.status === "DONE" ? "line-through text-slate-500" : "text-white"}`}>
                        {task.title}
                      </p>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border font-medium ${pc.bg} ${pc.border} ${pc.color}`}>
                          <PriorityIcon className="w-2.5 h-2.5" />{pc.label}
                        </span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${sc.bg} ${sc.color}`}>{sc.label}</span>
                      </div>
                    </div>
                    {task.description && <p className="text-xs text-slate-400 mt-1">{task.description}</p>}
                    <div className="flex items-center gap-4 mt-2 flex-wrap">
                      <div className="flex items-center gap-1.5">
                        <div className="w-4 h-4 rounded-full bg-purple-500/20 flex items-center justify-center">
                          <span className="text-[8px] text-purple-400 font-bold">{(task.assignedTo?.name || "?")[0].toUpperCase()}</span>
                        </div>
                        <span className="text-xs text-slate-400">{task.assignedTo?.name || task.assignedTo?.email}</span>
                      </div>
                      {task.dueDate && (
                        <div className={`flex items-center gap-1 text-xs ${isOverdue ? "text-red-400" : "text-slate-400"}`}>
                          <Calendar className="w-3 h-3" />
                          {new Date(task.dueDate).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                          {isOverdue && " · Overdue"}
                        </div>
                      )}
                      <button onClick={() => setExpandedTask(isExpanded ? null : task.id)}
                        className="flex items-center gap-1 text-xs text-slate-500 hover:text-white transition">
                        <MessageSquare className="w-3 h-3" />
                        {task.comments.length} comment{task.comments.length !== 1 ? "s" : ""}
                        {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      </button>
                    </div>
                  </div>

                  <button onClick={() => handleDelete(task.id)} disabled={deletingTask === task.id}
                    className="p-1.5 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition shrink-0">
                    {deletingTask === task.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                  </button>
                </div>

                {/* Comments */}
                {isExpanded && (
                  <div className="mt-4 pl-9 space-y-3 border-t border-white/5 pt-4">
                    {task.comments.map((c: any) => (
                      <div key={c.id} className="flex items-start gap-2">
                        <div className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center shrink-0">
                          <span className="text-[8px] text-slate-300 font-bold">{(c.author?.name || "?")[0].toUpperCase()}</span>
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-xs font-medium text-white">{c.author?.name}</p>
                            <p className="text-[10px] text-slate-600">{new Date(c.createdAt).toLocaleDateString()}</p>
                          </div>
                          <p className="text-xs text-slate-300 mt-0.5">{c.content}</p>
                        </div>
                      </div>
                    ))}
                    <div className="flex gap-2 mt-2">
                      <input
                        value={comment[task.id] || ""}
                        onChange={(e) => setComment((prev) => ({ ...prev, [task.id]: e.target.value }))}
                        onKeyDown={(e) => e.key === "Enter" && handleComment(task.id)}
                        placeholder="Add a comment..."
                        className="flex-1 rounded-xl border border-white/10 bg-slate-900/50 px-3 py-2 text-xs text-white placeholder-slate-600 outline-none focus:border-purple-500/50 transition"
                      />
                      <button onClick={() => handleComment(task.id)} disabled={sendingComment === task.id}
                        className="px-3 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white transition disabled:opacity-50">
                        {sendingComment === task.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
