"use client";

import { useEffect, useState, useCallback } from "react";
import { Shield, RefreshCw, Loader2, Search, UserPlus, Check } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

type StaffUser = {
  id: string;
  name: string | null;
  email: string;
  role: string;
  createdAt: string;
};

const STAFF_ROLES = ["STAFF", "SUPPORT", "ADMIN"];

const ROLE_COLORS: Record<string, string> = {
  ADMIN: "bg-red-500/20 text-red-400 border-red-500/20",
  STAFF: "bg-blue-500/20 text-blue-400 border-blue-500/20",
  SUPPORT: "bg-cyan-500/20 text-cyan-400 border-cyan-500/20",
};

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Admin", STAFF: "Staff", SUPPORT: "Support",
};

export default function AdminStaffPage() {
  const [users, setUsers] = useState<StaffUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/users");
      const data = await res.json();
      if (data.success) {
        setUsers(data.users.filter((u: StaffUser) => STAFF_ROLES.includes(u.role)));
      }
    } catch {
      toast.error("Failed to load staff");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const updateRole = async (userId: string, newRole: string) => {
    setUpdatingId(userId);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, newRole }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Role updated to ${ROLE_LABELS[newRole] ?? newRole}`);
        setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, role: newRole } : u));
      } else {
        toast.error(data.error || "Failed to update role");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setUpdatingId(null);
    }
  };

  const removeStaff = async (userId: string) => {
    setUpdatingId(userId);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, newRole: "FREE" }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Staff access removed");
        setUsers((prev) => prev.filter((u) => u.id !== userId));
      } else {
        toast.error(data.error || "Failed to remove staff");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setUpdatingId(null);
    }
  };

  const filtered = users.filter((u) =>
    u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <Toaster position="top-right" />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Staff</h1>
          <p className="mt-1 text-sm text-slate-400">Manage admin, staff, and support accounts</p>
        </div>
        <button onClick={fetchData} disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300 hover:bg-white/10 transition disabled:opacity-50">
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {STAFF_ROLES.map((role) => (
          <div key={role} className={`rounded-2xl border ${ROLE_COLORS[role]} bg-white/[0.02] p-4`}>
            <p className="text-2xl font-bold text-white">
              {users.filter((u) => u.role === role).length}
            </p>
            <p className="text-xs mt-0.5">{ROLE_LABELS[role]}</p>
          </div>
        ))}
      </div>

      {/* How to add staff */}
      <div className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-4">
        <div className="flex items-start gap-3">
          <UserPlus className="h-5 w-5 text-blue-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-white">How to add staff</p>
            <p className="text-xs text-slate-400 mt-1">
              Go to <span className="text-white font-medium">Users</span> → find the account → click <span className="text-white font-medium">Change role</span> → select Staff, Support, or Admin.
              The user must already have a TomParo account.
            </p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative w-72">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
        <input value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Search staff..."
          className="h-9 w-full rounded-xl border border-white/10 bg-white/[0.02] pl-9 pr-4 text-sm text-white outline-none placeholder:text-slate-500 focus:border-red-500/40" />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-slate-500" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-10 text-center text-slate-500">
          No staff accounts found
        </div>
      ) : (
        <div className="rounded-2xl border border-white/5 bg-white/[0.02]">
          {filtered.map((user, idx) => (
            <div key={user.id} className={`flex items-center gap-4 p-4 ${idx !== filtered.length - 1 ? "border-b border-white/5" : ""}`}>
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-600 text-xs font-bold text-white">
                {(user.name ?? user.email)[0].toUpperCase()}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-white truncate">{user.name ?? "—"}</p>
                  <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${ROLE_COLORS[user.role]}`}>
                    {ROLE_LABELS[user.role] ?? user.role}
                  </span>
                </div>
                <p className="text-xs text-slate-500 truncate">{user.email}</p>
              </div>

              <p className="hidden text-xs text-slate-500 shrink-0 md:block">
                {new Date(user.createdAt).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}
              </p>

              {/* Role buttons */}
              <div className="flex items-center gap-2 shrink-0">
                {STAFF_ROLES.filter((r) => r !== user.role).map((r) => (
                  <button key={r}
                    onClick={() => updateRole(user.id, r)}
                    disabled={updatingId === user.id}
                    className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-300 hover:bg-white/10 transition disabled:opacity-50">
                    {updatingId === user.id ? <Loader2 className="h-3 w-3 animate-spin" /> : `Set ${ROLE_LABELS[r]}`}
                  </button>
                ))}
                <button
                  onClick={() => removeStaff(user.id)}
                  disabled={updatingId === user.id}
                  className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-1.5 text-xs text-red-400 hover:bg-red-500/20 transition disabled:opacity-50">
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
