"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Users, Building2, Crown, Search, ChevronDown,
  ChevronRight, RefreshCw, Shield, Briefcase,
  TrendingUp, BarChart3, Check, X, Loader2,
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

// ── Types ─────────────────────────────────────────────────────────────────────

type UserRecord = {
  id: string;
  name: string | null;
  email: string;
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
  usageTracking: Array<{
    action: string;
    count: number;
    limit: number;
  }>;
};

type Company = {
  id: string;
  companyName: string;
  cvsUsedThisMonth: number;
  slug: string;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    email: string;
    role: string;
    createdAt: string;
  };
  teamMembers: Array<{
    role: string;
    user: {
      id: string;
      name: string | null;
      email: string;
      role: string;
      createdAt: string;
    };
  }>;
};

// ── Constants ─────────────────────────────────────────────────────────────────

const ALL_ROLES = [
  "FREE", "PREMIUM", "ADMIN", "STAFF", "SUPPORT",
  "RECRUITER_STARTER", "RECRUITER_GROWTH", "RECRUITER_BUSINESS",
  "RECRUITER_ENTERPRISE", "RECRUITER_SCALE", "RECRUITER_CUSTOM",
];

const ROLE_COLORS: Record<string, string> = {
  FREE:                 "bg-slate-500/20 text-slate-400 border-slate-500/20",
  PREMIUM:              "bg-amber-500/20 text-amber-400 border-amber-500/20",
  ADMIN:                "bg-red-500/20 text-red-400 border-red-500/20",
  STAFF:                "bg-blue-500/20 text-blue-400 border-blue-500/20",
  SUPPORT:              "bg-cyan-500/20 text-cyan-400 border-cyan-500/20",
  RECRUITER_STARTER:    "bg-purple-500/20 text-purple-400 border-purple-500/20",
  RECRUITER_GROWTH:     "bg-purple-500/20 text-purple-400 border-purple-500/20",
  RECRUITER_BUSINESS:   "bg-purple-500/20 text-purple-400 border-purple-500/20",
  RECRUITER_ENTERPRISE: "bg-violet-500/20 text-violet-400 border-violet-500/20",
  RECRUITER_SCALE:      "bg-violet-500/20 text-violet-400 border-violet-500/20",
  RECRUITER_CUSTOM:     "bg-violet-500/20 text-violet-400 border-violet-500/20",
};

const ROLE_LABELS: Record<string, string> = {
  FREE:                 "Free",
  PREMIUM:              "Premium",
  ADMIN:                "Admin",
  STAFF:                "Staff",
  SUPPORT:              "Support",
  RECRUITER_STARTER:    "Starter",
  RECRUITER_GROWTH:     "Growth",
  RECRUITER_BUSINESS:   "Business",
  RECRUITER_ENTERPRISE: "Enterprise",
  RECRUITER_SCALE:      "Scale",
  RECRUITER_CUSTOM:     "Custom",
};

// ── Role Badge ────────────────────────────────────────────────────────────────

function RoleBadge({ role }: { role: string }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${ROLE_COLORS[role] ?? "bg-slate-500/20 text-slate-400"}`}>
      {ROLE_LABELS[role] ?? role}
    </span>
  );
}

// ── Role Selector ─────────────────────────────────────────────────────────────

function RoleSelector({
  userId,
  currentRole,
  onUpdated,
}: {
  userId: string;
  currentRole: string;
  onUpdated: (userId: string, newRole: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSelect = async (newRole: string) => {
    if (newRole === currentRole) { setOpen(false); return; }
    setLoading(true);
    setOpen(false);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, newRole }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Role updated to ${ROLE_LABELS[newRole] ?? newRole}`);
        onUpdated(userId, newRole);
      } else {
        toast.error(data.error || "Failed to update role");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        disabled={loading}
        className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-300 hover:bg-white/10 transition disabled:opacity-50"
      >
        {loading ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : (
          <>
            Change role
            <ChevronDown className="h-3 w-3" />
          </>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full z-20 mt-1 w-48 rounded-xl border border-white/10 bg-slate-900 p-1 shadow-xl">
            {ALL_ROLES.map((r) => (
              <button
                key={r}
                onClick={() => handleSelect(r)}
                className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs transition hover:bg-white/5 ${r === currentRole ? "text-white" : "text-slate-400"}`}
              >
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

// ── Usage Bar ─────────────────────────────────────────────────────────────────

function UsageBar({ used, limit, label }: { used: number; limit: number; label: string }) {
  const pct = limit > 0 ? Math.min(100, (used / limit) * 100) : 0;
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-slate-500">{label}</span>
        <span className="text-slate-400">{used}/{limit === 999 ? "∞" : limit}</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-white/5">
        <div
          className={`h-1.5 rounded-full transition-all ${pct > 80 ? "bg-red-500" : pct > 50 ? "bg-amber-500" : "bg-emerald-500"}`}
          style={{ width: `${pct}%` }}
        />
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
  const [expandedCompanies, setExpandedCompanies] = useState<Set<string>>(new Set());
  const [expandedUsers, setExpandedUsers] = useState<Set<string>>(new Set());

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/users");
      const data = await res.json();
      if (data.success) {
        setUsers(data.users);
        setCompanies(data.companies);
      } else {
        toast.error("Failed to load users");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleRoleUpdated = (userId: string, newRole: string) => {
    setUsers((prev) =>
      prev.map((u) => u.id === userId ? { ...u, role: newRole } : u)
    );
  };

  const toggleCompany = (id: string) => {
    setExpandedCompanies((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleUser = (id: string) => {
    setExpandedUsers((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  // ── Filtered users ──
  const filteredUsers = users.filter((u) => {
    const matchSearch =
      u.name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchRole = filterRole === "ALL" || u.role === filterRole;
    return matchSearch && matchRole;
  });

  // ── Filtered companies ──
  const filteredCompanies = companies.filter((c) => {
    return (
      c.companyName.toLowerCase().includes(search.toLowerCase()) ||
      c.user.email.toLowerCase().includes(search.toLowerCase()) ||
      c.teamMembers.some((m) =>
        m.user.email.toLowerCase().includes(search.toLowerCase())
      )
    );
  });

  // ── Stats ──
  const totalUsers     = users.length;
  const totalPremium   = users.filter((u) => u.role === "PREMIUM").length;
  const totalRecruiters = companies.length;
  const totalTeamMembers = companies.reduce((sum, c) => sum + c.teamMembers.length, 0);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <Toaster position="top-right" />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Users</h1>
          <p className="mt-1 text-sm text-slate-400">
            Manage all accounts, plans, and usage across the platform
          </p>
        </div>
        <button
          onClick={fetchData}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300 hover:bg-white/10 transition disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          { label: "Total Users",    value: totalUsers,        icon: Users,     color: "text-blue-400",   bg: "bg-blue-500/10" },
          { label: "Premium",        value: totalPremium,      icon: Crown,     color: "text-amber-400",  bg: "bg-amber-500/10" },
          { label: "Companies",      value: totalRecruiters,   icon: Building2, color: "text-purple-400", bg: "bg-purple-500/10" },
          { label: "Team Members",   value: totalTeamMembers,  icon: Briefcase, color: "text-emerald-400",bg: "bg-emerald-500/10" },
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
        {/* Tabs */}
        <div className="flex rounded-xl border border-white/10 bg-white/[0.02] p-1 w-fit">
          <button
            onClick={() => setTab("users")}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${tab === "users" ? "bg-white/10 text-white" : "text-slate-400 hover:text-white"}`}
          >
            <span className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              All Users ({totalUsers})
            </span>
          </button>
          <button
            onClick={() => setTab("companies")}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${tab === "companies" ? "bg-white/10 text-white" : "text-slate-400 hover:text-white"}`}
          >
            <span className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Companies ({totalRecruiters})
            </span>
          </button>
        </div>

        {/* Search + Filter */}
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name or email..."
              className="h-9 w-64 rounded-xl border border-white/10 bg-white/[0.02] pl-9 pr-4 text-sm text-white outline-none placeholder:text-slate-500 focus:border-purple-500/40"
            />
          </div>

          {tab === "users" && (
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="h-9 rounded-xl border border-white/10 bg-slate-900 px-3 text-sm text-white outline-none focus:border-purple-500/40"
            >
              <option value="ALL">All Roles</option>
              {ALL_ROLES.map((r) => (
                <option key={r} value={r}>{ROLE_LABELS[r]}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-slate-500" />
        </div>
      )}

      {/* ── USERS TAB ── */}
      {!loading && tab === "users" && (
        <div className="space-y-2">
          {filteredUsers.length === 0 && (
            <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-10 text-center text-slate-500">
              No users found
            </div>
          )}

          {filteredUsers.map((user) => {
            const expanded = expandedUsers.has(user.id);
            const isTeamMember = user.teamMemberships.length > 0;

            return (
              <div key={user.id} className="rounded-2xl border border-white/5 bg-white/[0.02]">
                {/* Row */}
                <div className="flex items-center gap-4 p-4">
                  {/* Avatar */}
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-purple-600 text-xs font-bold text-white">
                    {(user.name ?? user.email)[0].toUpperCase()}
                  </div>

                  {/* Name + email */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-white truncate">
                        {user.name ?? "—"}
                      </p>
                      <RoleBadge role={user.role} />
                      {isTeamMember && (
                        <span className="inline-flex items-center rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[10px] text-emerald-400">
                          Team · {user.teamMemberships[0].recruiter.companyName}
                        </span>
                      )}
                      {user.recruiterProfile && (
                        <span className="inline-flex items-center rounded-full border border-purple-500/20 bg-purple-500/10 px-2 py-0.5 text-[10px] text-purple-400">
                          Owner · {user.recruiterProfile.companyName}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 truncate">{user.email}</p>
                  </div>

                  {/* Joined */}
                  <p className="hidden text-xs text-slate-500 md:block shrink-0">
                    {new Date(user.createdAt).toLocaleDateString("en-NG", {
                      day: "numeric", month: "short", year: "numeric",
                    })}
                  </p>

                  {/* Role change */}
                  <RoleSelector
                    userId={user.id}
                    currentRole={user.role}
                    onUpdated={handleRoleUpdated}
                  />

                  {/* Expand */}
                  <button
                    onClick={() => toggleUser(user.id)}
                    className="rounded-lg border border-white/10 bg-white/5 p-1.5 text-slate-400 hover:text-white transition"
                  >
                    {expanded
                      ? <ChevronDown className="h-4 w-4" />
                      : <ChevronRight className="h-4 w-4" />}
                  </button>
                </div>

                {/* Expanded — usage */}
                {expanded && (
                  <div className="border-t border-white/5 bg-white/[0.01] p-4 space-y-4">
                    {/* Today's usage */}
                    {user.usageTracking.length > 0 ? (
                      <div>
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                          Today's Usage
                        </p>
                        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
                          {user.usageTracking.map((u) => (
                            <UsageBar
                              key={u.action}
                              label={u.action}
                              used={u.count}
                              limit={u.limit}
                            />
                          ))}
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-500">No usage today</p>
                    )}

                    {/* Subscription */}
                    {user.subscription && (
                      <div>
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                          Subscription
                        </p>
                        <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3 text-xs text-slate-300 space-y-1">
                          <p>Plan: <span className="text-white font-medium">{user.subscription.plan}</span></p>
                          <p>Status: <span className="text-white font-medium">{user.subscription.status}</span></p>
                          {user.subscription.currentPeriodEnd && (
                            <p>Renews: <span className="text-white font-medium">
                              {new Date(user.subscription.currentPeriodEnd).toLocaleDateString("en-NG")}
                            </span></p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Recruiter profile */}
                    {user.recruiterProfile && (
                      <div>
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                          Recruiter Profile
                        </p>
                        <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3 text-xs text-slate-300 space-y-1">
                          <p>Company: <span className="text-white font-medium">{user.recruiterProfile.companyName}</span></p>
                          <p>CVs used this month: <span className="text-white font-medium">{user.recruiterProfile.cvsUsedThisMonth}</span></p>
                        </div>
                      </div>
                    )}

                    {/* Team membership */}
                    {isTeamMember && (
                      <div>
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                          Team Membership
                        </p>
                        <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3 text-xs text-slate-300 space-y-1">
                          <p>Company: <span className="text-white font-medium">{user.teamMemberships[0].recruiter.companyName}</span></p>
                          <p>Team role: <span className="text-white font-medium">{user.teamMemberships[0].role}</span></p>
                        </div>
                      </div>
                    )}

                    {/* User ID */}
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
            <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-10 text-center text-slate-500">
              No companies found
            </div>
          )}

          {filteredCompanies.map((company) => {
            const expanded = expandedCompanies.has(company.id);
            const ownerRole = company.user.role;

            return (
              <div key={company.id} className="rounded-2xl border border-white/5 bg-white/[0.02]">
                {/* Company header */}
                <div
                  className="flex items-center gap-4 p-4 cursor-pointer hover:bg-white/[0.02] transition"
                  onClick={() => toggleCompany(company.id)}
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-600/20 border border-purple-500/20">
                    <Building2 className="h-5 w-5 text-purple-400" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-white">
                        {company.companyName}
                      </p>
                      <RoleBadge role={ownerRole} />
                    </div>
                    <p className="text-xs text-slate-500">
                      Owner: {company.user.name ?? "—"} · {company.user.email}
                    </p>
                  </div>

                  <div className="hidden md:flex items-center gap-4 text-xs text-slate-400 shrink-0">
                    <span className="flex items-center gap-1">
                      <Users className="h-3.5 w-3.5" />
                      {company.teamMembers.length} member{company.teamMembers.length !== 1 ? "s" : ""}
                    </span>
                    <span className="flex items-center gap-1">
                      <BarChart3 className="h-3.5 w-3.5" />
                      {company.cvsUsedThisMonth} CVs this month
                    </span>
                    <span>
                      {new Date(company.createdAt).toLocaleDateString("en-NG", {
                        day: "numeric", month: "short", year: "numeric",
                      })}
                    </span>
                  </div>

                  {expanded
                    ? <ChevronDown className="h-4 w-4 text-slate-400 shrink-0" />
                    : <ChevronRight className="h-4 w-4 text-slate-400 shrink-0" />}
                </div>

                {/* Expanded — owner + team */}
                {expanded && (
                  <div className="border-t border-white/5 bg-white/[0.01] p-4 space-y-4">

                    {/* Owner */}
                    <div>
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                        Account Owner
                      </p>
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
                          <RoleSelector
                            userId={company.user.id}
                            currentRole={company.user.role}
                            onUpdated={handleRoleUpdated}
                          />
                        </div>
                      </div>
                    </div>

                    {/* CV usage */}
                    <div>
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                        CV Usage This Month
                      </p>
                      <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3">
                        <UsageBar
                          label="CVs analysed"
                          used={company.cvsUsedThisMonth}
                          limit={
                            ownerRole === "RECRUITER_STARTER" ? 20 :
                            ownerRole === "RECRUITER_GROWTH" ? 50 :
                            ownerRole === "RECRUITER_BUSINESS" ? 200 :
                            ownerRole === "RECRUITER_ENTERPRISE" ? 500 :
                            ownerRole === "RECRUITER_SCALE" ? 1000 : 99999
                          }
                        />
                      </div>
                    </div>

                    {/* Team members */}
                    {company.teamMembers.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                          Team Members ({company.teamMembers.length})
                        </p>
                        <div className="space-y-2">
                          {company.teamMembers.map((member) => (
                            <div
                              key={member.user.id}
                              className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.02] p-3"
                            >
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
                                <span className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] text-slate-400">
                                  {member.role}
                                </span>
                                <RoleSelector
                                  userId={member.user.id}
                                  currentRole={member.user.role}
                                  onUpdated={handleRoleUpdated}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {company.teamMembers.length === 0 && (
                      <p className="text-xs text-slate-500">No team members yet</p>
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
