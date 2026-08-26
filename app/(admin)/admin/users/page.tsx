"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Users, Building2, Crown, Search, ChevronDown,
  ChevronRight, RefreshCw, Shield, Briefcase,
  BarChart3, Check, Loader2, Mail, Phone,
  Trash2, Ban, UserCheck, UserPlus, Send,
  MessageSquare, X, Megaphone,
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

// ── Types ────────────────────────────────────────────────────────────────────

type UserRecord = {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  role: string;
  createdAt: string;
  subscription: any | null;
  recruiterProfile: {
    id: string;
    companyName: string;
    cvsUsedThisMonth: number;
  } | null;
  teamMemberships: Array<{
    role: string;
    recruiter: { id: string; companyName: string; userId: string };
  }>;
  usageTracking: Array<{ action: string; count: number; limit: number }>;
};

type Company = {
  id: string;
  companyName: string;
  cvsUsedThisMonth: number;
  createdAt: string;
  user: { id: string; name: string | null; email: string; role: string; createdAt: string };
  teamMembers: Array<{
    role: string;
    user: { id: string; name: string | null; email: string; role: string; createdAt: string };
  }>;
};

// ── Constants ─────────────────────────────────────────────────────────────────

const ALL_ROLES = [
  "FREE","PREMIUM","ADMIN","STAFF","SUPPORT","SUSPENDED",
  "RECRUITER_STARTER","RECRUITER_GROWTH","RECRUITER_BUSINESS",
  "RECRUITER_ENTERPRISE","RECRUITER_SCALE","RECRUITER_CUSTOM",
];

const ROLE_COLORS: Record<string, string> = {
  FREE:                 "bg-slate-500/20 text-slate-400 border-slate-500/20",
  PREMIUM:              "bg-amber-500/20 text-amber-400 border-amber-500/20",
  ADMIN:                "bg-red-500/20 text-red-400 border-red-500/20",
  STAFF:                "bg-blue-500/20 text-blue-400 border-blue-500/20",
  SUPPORT:              "bg-cyan-500/20 text-cyan-400 border-cyan-500/20",
  SUSPENDED:            "bg-rose-900/40 text-rose-400 border-rose-500/20",
  RECRUITER_STARTER:    "bg-purple-500/20 text-purple-400 border-purple-500/20",
  RECRUITER_GROWTH:     "bg-purple-500/20 text-purple-400 border-purple-500/20",
  RECRUITER_BUSINESS:   "bg-purple-500/20 text-purple-400 border-purple-500/20",
  RECRUITER_ENTERPRISE: "bg-violet-500/20 text-violet-400 border-violet-500/20",
  RECRUITER_SCALE:      "bg-violet-500/20 text-violet-400 border-violet-500/20",
  RECRUITER_CUSTOM:     "bg-violet-500/20 text-violet-400 border-violet-500/20",
};

const ROLE_LABELS: Record<string, string> = {
  FREE:"Free", PREMIUM:"Premium", ADMIN:"Admin", STAFF:"Staff",
  SUPPORT:"Support", SUSPENDED:"Suspended",
  RECRUITER_STARTER:"Starter", RECRUITER_GROWTH:"Growth",
  RECRUITER_BUSINESS:"Business", RECRUITER_ENTERPRISE:"Enterprise",
  RECRUITER_SCALE:"Scale", RECRUITER_CUSTOM:"Custom",
};

const CV_LIMITS: Record<string, number> = {
  RECRUITER_STARTER:20, RECRUITER_GROWTH:50, RECRUITER_BUSINESS:200,
  RECRUITER_ENTERPRISE:500, RECRUITER_SCALE:1000, RECRUITER_CUSTOM:99999,
};

// ── Sub-components ────────────────────────────────────────────────────────────

function RoleBadge({ role }: { role: string }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${ROLE_COLORS[role] ?? "bg-slate-500/20 text-slate-400"}`}>
      {ROLE_LABELS[role] ?? role}
    </span>
  );
}

function RoleSelector({ userId, currentRole, onUpdated }: {
  userId: string; currentRole: string;
  onUpdated: (userId: string, newRole: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSelect = async (newRole: string) => {
    if (newRole === currentRole) { setOpen(false); return; }
    setLoading(true); setOpen(false);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, newRole }),
      });
      const data = await res.json();
      if (data.success) { toast.success(`Role → ${ROLE_LABELS[newRole] ?? newRole}`); onUpdated(userId, newRole); }
      else toast.error(data.error || "Failed");
    } catch { toast.error("Network error"); }
    finally { setLoading(false); }
  };

  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)} disabled={loading}
        className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-300 hover:bg-white/10 transition disabled:opacity-50">
        {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <><span>Role</span><ChevronDown className="h-3 w-3" /></>}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full z-20 mt-1 w-44 rounded-xl border border-white/10 bg-slate-900 p-1 shadow-xl">
            {ALL_ROLES.map((r) => (
              <button key={r} onClick={() => handleSelect(r)}
                className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs transition hover:bg-white/5 ${r === currentRole ? "text-white" : "text-slate-400"}`}>
                {ROLE_LABELS[r] ?? r}
                {r === currentRole && <Check className="h-3 w-3 text-emerald-400" />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function UsageBar({ used, limit, label }: { used: number; limit: number; label: string }) {
  const pct = limit > 0 ? Math.min(100, (used / limit) * 100) : 0;
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-slate-500">{label}</span>
        <span className="text-slate-400">{used}/{limit >= 999 ? "∞" : limit}</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-white/5">
        <div className={`h-1.5 rounded-full ${pct > 80 ? "bg-red-500" : pct > 50 ? "bg-amber-500" : "bg-emerald-500"}`}
          style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

// ── Email Modal ───────────────────────────────────────────────────────────────

function EmailModal({ user, onClose }: { user: UserRecord; onClose: () => void }) {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const send = async () => {
    if (!subject.trim() || !message.trim()) { toast.error("Subject and message required"); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/admin/user-action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "email", userId: user.id, subject, message }),
      });
      const data = await res.json();
      if (data.success) { toast.success(`Email sent to ${user.email}`); onClose(); }
      else toast.error(data.error || "Failed to send");
    } catch { toast.error("Network error"); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm font-semibold text-white">Email {user.name ?? user.email}</p>
            <p className="text-xs text-slate-500">{user.email}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition"><X className="h-5 w-5" /></button>
        </div>
        <div className="space-y-3">
          <input value={subject} onChange={(e) => setSubject(e.target.value)}
            placeholder="Subject"
            className="w-full rounded-xl border border-white/10 bg-slate-800 px-4 py-2.5 text-sm text-white outline-none placeholder:text-slate-500 focus:border-purple-500/40" />
          <textarea value={message} onChange={(e) => setMessage(e.target.value)}
            placeholder="Message..."
            rows={5}
            className="w-full rounded-xl border border-white/10 bg-slate-800 px-4 py-2.5 text-sm text-white outline-none placeholder:text-slate-500 focus:border-purple-500/40 resize-none" />
          <div className="flex gap-2 justify-end">
            <button onClick={onClose} className="rounded-xl border border-white/10 px-4 py-2 text-sm text-slate-400 hover:text-white transition">Cancel</button>
            <button onClick={send} disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-500 transition disabled:opacity-50">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Assign Team Modal ──────────────────────────────────────────────────────────

function AssignTeamModal({ user, companies, onClose, onSuccess }: {
  user: UserRecord; companies: Company[];
  onClose: () => void; onSuccess: () => void;
}) {
  const [recruiterId, setRecruiterId] = useState("");
  const [teamRole, setTeamRole] = useState("MEMBER");
  const [loading, setLoading] = useState(false);

  const assign = async () => {
    if (!recruiterId) { toast.error("Select a company"); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/admin/user-action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "assign_team", userId: user.id, recruiterId, teamRole }),
      });
      const data = await res.json();
      if (data.success) { toast.success(data.message); onSuccess(); onClose(); }
      else toast.error(data.error || "Failed");
    } catch { toast.error("Network error"); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-semibold text-white">Assign {user.name ?? user.email} to a company</p>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition"><X className="h-5 w-5" /></button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Company</label>
            <select value={recruiterId} onChange={(e) => setRecruiterId(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-slate-800 px-3 py-2.5 text-sm text-white outline-none focus:border-purple-500/40">
              <option value="">Select company...</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>{c.companyName}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Team Role</label>
            <select value={teamRole} onChange={(e) => setTeamRole(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-slate-800 px-3 py-2.5 text-sm text-white outline-none focus:border-purple-500/40">
              <option value="MEMBER">Member</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>
          <div className="flex gap-2 justify-end pt-1">
            <button onClick={onClose} className="rounded-xl border border-white/10 px-4 py-2 text-sm text-slate-400 hover:text-white transition">Cancel</button>
            <button onClick={assign} disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-500 transition disabled:opacity-50">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}Assign
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Announcement Modal ────────────────────────────────────────────────────────

function AnnouncementModal({ onClose }: { onClose: () => void }) {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [audience, setAudience] = useState("all");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState<number | null>(null);

  const send = async () => {
    if (!subject.trim() || !message.trim()) { toast.error("Subject and message required"); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/admin/announcement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, message, audience }),
      });
      const data = await res.json();
      if (data.success) { setSent(data.sent); toast.success(`Sent to ${data.sent} users`); }
      else toast.error(data.error || "Failed");
    } catch { toast.error("Network error"); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Megaphone className="h-5 w-5 text-amber-400" />
            <p className="text-sm font-semibold text-white">Send Announcement</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition"><X className="h-5 w-5" /></button>
        </div>

        {sent !== null ? (
          <div className="text-center py-8 space-y-2">
            <p className="text-3xl font-bold text-emerald-400">{sent}</p>
            <p className="text-sm text-slate-400">emails sent successfully</p>
            <button onClick={onClose} className="mt-4 rounded-xl bg-white/10 px-5 py-2 text-sm text-white hover:bg-white/20 transition">Close</button>
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Audience</label>
              <select value={audience} onChange={(e) => setAudience(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-slate-800 px-3 py-2.5 text-sm text-white outline-none focus:border-amber-500/40">
                <option value="all">All users</option>
                <option value="premium">Premium users only</option>
                <option value="free">Free users only</option>
                <option value="recruiters">Recruiters only</option>
              </select>
            </div>
            <input value={subject} onChange={(e) => setSubject(e.target.value)}
              placeholder="Subject"
              className="w-full rounded-xl border border-white/10 bg-slate-800 px-4 py-2.5 text-sm text-white outline-none placeholder:text-slate-500 focus:border-amber-500/40" />
            <textarea value={message} onChange={(e) => setMessage(e.target.value)}
              placeholder="Your message..."
              rows={5}
              className="w-full rounded-xl border border-white/10 bg-slate-800 px-4 py-2.5 text-sm text-white outline-none placeholder:text-slate-500 focus:border-amber-500/40 resize-none" />
            <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 text-xs text-amber-400">
              This will send an email to all users matching the audience filter. Max 500 per send.
            </div>
            <div className="flex gap-2 justify-end">
              <button onClick={onClose} className="rounded-xl border border-white/10 px-4 py-2 text-sm text-slate-400 hover:text-white transition">Cancel</button>
              <button onClick={send} disabled={loading}
                className="inline-flex items-center gap-2 rounded-xl bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-500 transition disabled:opacity-50">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Megaphone className="h-4 w-4" />}Send Announcement
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState("ALL");
  const [tab, setTab] = useState<"users" | "companies">("users");
  const [expandedUsers, setExpandedUsers] = useState<Set<string>>(new Set());
  const [expandedCompanies, setExpandedCompanies] = useState<Set<string>>(new Set());

  // Modals
  const [emailModal, setEmailModal] = useState<UserRecord | null>(null);
  const [assignModal, setAssignModal] = useState<UserRecord | null>(null);
  const [announcementOpen, setAnnouncementOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/users");
      const data = await res.json();
      if (data.success) { setUsers(data.users); setCompanies(data.companies); }
      else toast.error("Failed to load users");
    } catch { toast.error("Network error"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleRoleUpdated = (userId: string, newRole: string) => {
    setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, role: newRole } : u));
  };

  const handleUserAction = async (action: string, userId: string, extra?: any) => {
    setActionLoadingId(userId);
    try {
      const res = await fetch("/api/admin/user-action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, userId, ...extra }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message);
        if (action === "delete") {
          setUsers((prev) => prev.filter((u) => u.id !== userId));
        } else if (action === "suspend") {
          handleRoleUpdated(userId, "SUSPENDED");
        } else if (action === "unsuspend") {
          handleRoleUpdated(userId, "FREE");
        }
      } else {
        toast.error(data.error || "Action failed");
      }
    } catch { toast.error("Network error"); }
    finally { setActionLoadingId(null); setDeletingId(null); }
  };

  const toggleUser = (id: string) => {
    setExpandedUsers((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };

  const toggleCompany = (id: string) => {
    setExpandedCompanies((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };

  const filteredUsers = users.filter((u) => {
    const matchSearch = u.name?.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
    const matchRole = filterRole === "ALL" || u.role === filterRole;
    return matchSearch && matchRole;
  });

  const filteredCompanies = companies.filter((c) =>
    c.companyName.toLowerCase().includes(search.toLowerCase()) ||
    c.user.email.toLowerCase().includes(search.toLowerCase())
  );

  const totalUsers = users.length;
  const totalPremium = users.filter((u) => u.role === "PREMIUM").length;
  const totalSuspended = users.filter((u) => u.role === "SUSPENDED").length;

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <Toaster position="top-right" />

      {/* Modals */}
      {emailModal && <EmailModal user={emailModal} onClose={() => setEmailModal(null)} />}
      {assignModal && (
        <AssignTeamModal
          user={assignModal}
          companies={companies}
          onClose={() => setAssignModal(null)}
          onSuccess={fetchData}
        />
      )}
      {announcementOpen && <AnnouncementModal onClose={() => setAnnouncementOpen(false)} />}

      {/* Delete confirmation */}
      {deletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setDeletingId(null)} />
          <div className="relative w-full max-w-sm rounded-2xl border border-red-500/20 bg-slate-900 p-6 shadow-2xl">
            <p className="text-base font-semibold text-white">Delete user?</p>
            <p className="mt-1 text-sm text-slate-400">This permanently deletes the account and all associated data. This cannot be undone.</p>
            <div className="mt-4 flex gap-2 justify-end">
              <button onClick={() => setDeletingId(null)}
                className="rounded-xl border border-white/10 px-4 py-2 text-sm text-slate-400 hover:text-white transition">Cancel</button>
              <button onClick={() => handleUserAction("delete", deletingId)}
                disabled={actionLoadingId === deletingId}
                className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-500 transition disabled:opacity-50">
                {actionLoadingId === deletingId ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Users</h1>
          <p className="mt-1 text-sm text-slate-400">Manage all accounts, plans, and usage</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setAnnouncementOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-2 text-sm font-medium text-amber-400 hover:bg-amber-500/20 transition">
            <Megaphone className="h-4 w-4" />Announce
          </button>
          <button onClick={fetchData} disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300 hover:bg-white/10 transition disabled:opacity-50">
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />Refresh
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          { label: "Total Users", value: totalUsers, icon: Users, color: "text-blue-400", bg: "bg-blue-500/10" },
          { label: "Premium", value: totalPremium, icon: Crown, color: "text-amber-400", bg: "bg-amber-500/10" },
          { label: "Companies", value: companies.length, icon: Building2, color: "text-purple-400", bg: "bg-purple-500/10" },
          { label: "Suspended", value: totalSuspended, icon: Ban, color: "text-rose-400", bg: "bg-rose-500/10" },
        ].map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="rounded-2xl border border-white/5 bg-white/[0.02] p-5">
              <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center mb-3`}>
                <Icon className={`h-5 w-5 ${s.color}`} />
              </div>
              <p className="text-2xl font-bold text-white">{s.value}</p>
              <p className="text-xs text-slate-400 mt-0.5">{s.label}</p>
            </div>
          );
        })}
      </div>

      {/* Tabs + Search + Filter */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex rounded-xl border border-white/10 bg-white/[0.02] p-1 w-fit">
          <button onClick={() => setTab("users")}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition flex items-center gap-2 ${tab === "users" ? "bg-white/10 text-white" : "text-slate-400 hover:text-white"}`}>
            <Users className="h-4 w-4" />All Users ({totalUsers})
          </button>
          <button onClick={() => setTab("companies")}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition flex items-center gap-2 ${tab === "companies" ? "bg-white/10 text-white" : "text-slate-400 hover:text-white"}`}>
            <Building2 className="h-4 w-4" />Companies ({companies.length})
          </button>
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name or email..."
              className="h-9 w-64 rounded-xl border border-white/10 bg-white/[0.02] pl-9 pr-4 text-sm text-white outline-none placeholder:text-slate-500 focus:border-purple-500/40" />
          </div>
          {tab === "users" && (
            <select value={filterRole} onChange={(e) => setFilterRole(e.target.value)}
              className="h-9 rounded-xl border border-white/10 bg-slate-900 px-3 text-sm text-white outline-none focus:border-purple-500/40">
              <option value="ALL">All Roles</option>
              {ALL_ROLES.map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
            </select>
          )}
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-slate-500" />
        </div>
      )}

      {/* ── USERS TAB ── */}
      {!loading && tab === "users" && (
        <div className="space-y-2">
          {filteredUsers.length === 0 && (
            <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-10 text-center text-slate-500">No users found</div>
          )}
          {filteredUsers.map((user) => {
            const expanded = expandedUsers.has(user.id);
            const isTeamMember = user.teamMemberships.length > 0;
            const isSuspended = user.role === "SUSPENDED";

            return (
              <div key={user.id} className={`rounded-2xl border bg-white/[0.02] overflow-visible ${isSuspended ? "border-rose-500/20" : "border-white/5"}`}>
                <div className="flex items-center gap-4 p-4">
                  <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xs font-bold text-white ${isSuspended ? "bg-rose-800" : "bg-purple-600"}`}>
                    {(user.name ?? user.email)[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-white truncate">{user.name ?? "—"}</p>
                      <RoleBadge role={user.role} />
                      {isTeamMember && (
                        <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[10px] text-emerald-400">
                          Team · {user.teamMemberships[0].recruiter.companyName}
                        </span>
                      )}
                      {user.recruiterProfile && (
                        <span className="rounded-full border border-purple-500/20 bg-purple-500/10 px-2 py-0.5 text-[10px] text-purple-400">
                          Owner · {user.recruiterProfile.companyName}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 truncate">{user.email}</p>
                  </div>
                  <p className="hidden text-xs text-slate-500 md:block shrink-0">
                    {new Date(user.createdAt).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                  <div className="flex items-center gap-2 shrink-0">
                    <RoleSelector userId={user.id} currentRole={user.role} onUpdated={handleRoleUpdated} />
                    <button onClick={() => toggleUser(user.id)}
                      className="rounded-lg border border-white/10 bg-white/5 p-1.5 text-slate-400 hover:text-white transition">
                      {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Expanded */}
                {expanded && (
                  <div className="border-t border-white/5 bg-white/[0.01] p-4 space-y-4">

                    {/* Action buttons */}
                    <div>
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Actions</p>
                      <div className="flex flex-wrap gap-2">

                        {/* Email */}
                        <button onClick={() => setEmailModal(user)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-300 hover:bg-white/10 transition">
                          <Mail className="h-3.5 w-3.5" />Email
                        </button>

                        {/* WhatsApp */}
                        {user.phone ? (
                          <a href={`https://wa.me/${user.phone.replace(/[^0-9]/g, "")}`}
                            target="_blank" rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-xs text-emerald-400 hover:bg-emerald-500/20 transition">
                            <Phone className="h-3.5 w-3.5" />WhatsApp
                          </a>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded-lg border border-white/5 px-3 py-1.5 text-xs text-slate-600 cursor-not-allowed">
                            <Phone className="h-3.5 w-3.5" />No phone
                          </span>
                        )}

                        {/* Assign to team */}
                        <button onClick={() => setAssignModal(user)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-300 hover:bg-white/10 transition">
                          <UserPlus className="h-3.5 w-3.5" />Assign to Team
                        </button>

                        {/* Suspend / Unsuspend */}
                        {isSuspended ? (
                          <button onClick={() => handleUserAction("unsuspend", user.id)}
                            disabled={actionLoadingId === user.id}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-xs text-emerald-400 hover:bg-emerald-500/20 transition disabled:opacity-50">
                            {actionLoadingId === user.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <UserCheck className="h-3.5 w-3.5" />}Restore Access
                          </button>
                        ) : (
                          <button onClick={() => handleUserAction("suspend", user.id)}
                            disabled={actionLoadingId === user.id}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-1.5 text-xs text-amber-400 hover:bg-amber-500/20 transition disabled:opacity-50">
                            {actionLoadingId === user.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Ban className="h-3.5 w-3.5" />}Suspend
                          </button>
                        )}

                        {/* Delete */}
                        <button onClick={() => setDeletingId(user.id)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-1.5 text-xs text-red-400 hover:bg-red-500/20 transition">
                          <Trash2 className="h-3.5 w-3.5" />Delete
                        </button>
                      </div>
                    </div>

                    {/* Usage */}
                    {user.usageTracking.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Today's Usage</p>
                        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
                          {user.usageTracking.map((u) => (
                            <UsageBar key={u.action} label={u.action} used={u.count} limit={u.limit} />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Subscription */}
                    {user.subscription && (
                      <div>
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Subscription</p>
                        <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3 text-xs text-slate-300 space-y-1">
                          <p>Plan: <span className="text-white font-medium">{user.subscription.plan}</span></p>
                          <p>Status: <span className="text-white font-medium">{user.subscription.status}</span></p>
                          {user.subscription.currentPeriodEnd && (
                            <p>Renews: <span className="text-white font-medium">{new Date(user.subscription.currentPeriodEnd).toLocaleDateString("en-NG")}</span></p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Team memberships */}
                    {isTeamMember && (
                      <div>
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Team Membership</p>
                        <div className="space-y-2">
                          {user.teamMemberships.map((m) => (
                            <div key={m.recruiter.id} className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.02] p-3">
                              <div>
                                <p className="text-sm text-white font-medium">{m.recruiter.companyName}</p>
                                <p className="text-xs text-slate-500">Role: {m.role}</p>
                              </div>
                              <button onClick={() => handleUserAction("remove_team", user.id, { recruiterId: m.recruiter.id })}
                                disabled={actionLoadingId === user.id}
                                className="rounded-lg border border-red-500/20 bg-red-500/10 px-2.5 py-1 text-xs text-red-400 hover:bg-red-500/20 transition disabled:opacity-50">
                                Remove
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <p className="text-[10px] text-slate-600 font-mono">ID: {user.id}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── COMPANIES TAB ── */}
      {!loading && tab === "companies" && (
        <div className="space-y-3">
          {filteredCompanies.length === 0 && (
            <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-10 text-center text-slate-500">No companies found</div>
          )}
          {filteredCompanies.map((company) => {
            const expanded = expandedCompanies.has(company.id);
            const ownerRole = company.user.role;

            return (
              <div key={company.id} className="rounded-2xl border border-white/5 bg-white/[0.02] overflow-visible">
                <div className="flex items-center gap-4 p-4 cursor-pointer hover:bg-white/[0.02] transition"
                  onClick={() => toggleCompany(company.id)}>
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-600/20 border border-purple-500/20">
                    <Building2 className="h-5 w-5 text-purple-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-white">{company.companyName}</p>
                      <RoleBadge role={ownerRole} />
                    </div>
                    <p className="text-xs text-slate-500">Owner: {company.user.name ?? "—"} · {company.user.email}</p>
                  </div>
                  <div className="hidden md:flex items-center gap-4 text-xs text-slate-400 shrink-0">
                    <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" />{company.teamMembers.length} members</span>
                    <span className="flex items-center gap-1"><BarChart3 className="h-3.5 w-3.5" />{company.cvsUsedThisMonth} CVs</span>
                  </div>
                  {expanded ? <ChevronDown className="h-4 w-4 text-slate-400 shrink-0" /> : <ChevronRight className="h-4 w-4 text-slate-400 shrink-0" />}
                </div>

                {expanded && (
                  <div className="border-t border-white/5 bg-white/[0.01] p-4 space-y-4">
                    <div>
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Account Owner</p>
                      <div className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.02] p-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-600 text-xs font-bold text-white">
                            {(company.user.name ?? company.user.email)[0].toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-white">{company.user.name ?? "—"}</p>
                            <p className="text-xs text-slate-500">{company.user.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <RoleBadge role={company.user.role} />
                          <RoleSelector userId={company.user.id} currentRole={company.user.role} onUpdated={handleRoleUpdated} />
                        </div>
                      </div>
                    </div>

                    <div>
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">CV Usage</p>
                      <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3">
                        <UsageBar label="CVs analysed this month" used={company.cvsUsedThisMonth}
                          limit={CV_LIMITS[ownerRole] ?? 0} />
                      </div>
                    </div>

                    {company.teamMembers.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                          Team Members ({company.teamMembers.length})
                        </p>
                        <div className="space-y-2">
                          {company.teamMembers.map((member) => (
                            <div key={member.user.id} className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.02] p-3">
                              <div className="flex items-center gap-3">
                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-700 text-xs font-bold text-white">
                                  {(member.user.name ?? member.user.email)[0].toUpperCase()}
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-white">{member.user.name ?? "—"}</p>
                                  <p className="text-xs text-slate-500">{member.user.email}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] text-slate-400">{member.role}</span>
                                <RoleSelector userId={member.user.id} currentRole={member.user.role} onUpdated={handleRoleUpdated} />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
