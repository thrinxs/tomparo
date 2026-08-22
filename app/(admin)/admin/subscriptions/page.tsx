"use client";

import { useEffect, useState, useCallback } from "react";
import { CreditCard, RefreshCw, Loader2, Search, Crown, Building2 } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

type SubUser = {
  id: string;
  name: string | null;
  email: string;
  role: string;
  createdAt: string;
  subscription: {
    id: string;
    plan: string;
    status: string;
    amount: number | null;
    currency: string | null;
    currentPeriodStart: string | null;
    currentPeriodEnd: string | null;
    paystackReference: string | null;
  } | null;
};

const ROLE_LABELS: Record<string, string> = {
  FREE: "Free", PREMIUM: "Premium", ADMIN: "Admin", STAFF: "Staff", SUPPORT: "Support",
  RECRUITER_STARTER: "Starter", RECRUITER_GROWTH: "Growth", RECRUITER_BUSINESS: "Business",
  RECRUITER_ENTERPRISE: "Enterprise", RECRUITER_SCALE: "Scale", RECRUITER_CUSTOM: "Custom",
};

const ROLE_COLORS: Record<string, string> = {
  FREE: "bg-slate-500/20 text-slate-400", PREMIUM: "bg-amber-500/20 text-amber-400",
  RECRUITER_STARTER: "bg-purple-500/20 text-purple-400", RECRUITER_GROWTH: "bg-purple-500/20 text-purple-400",
  RECRUITER_BUSINESS: "bg-purple-500/20 text-purple-400", RECRUITER_ENTERPRISE: "bg-violet-500/20 text-violet-400",
  RECRUITER_SCALE: "bg-violet-500/20 text-violet-400", RECRUITER_CUSTOM: "bg-violet-500/20 text-violet-400",
};

export default function AdminSubscriptionsPage() {
  const [users, setUsers] = useState<SubUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/users");
      const data = await res.json();
      if (data.success) setUsers(data.users);
    } catch {
      toast.error("Failed to load subscriptions");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const paid = users.filter((u) => u.subscription);
  const filtered = paid.filter((u) =>
    u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  const totalRevenue = paid.reduce((sum, u) => sum + (u.subscription?.amount ?? 0), 0);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <Toaster position="top-right" />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Subscriptions</h1>
          <p className="mt-1 text-sm text-slate-400">All paid subscriptions on the platform</p>
        </div>
        <button onClick={fetchData} disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300 hover:bg-white/10 transition disabled:opacity-50">
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-amber-500/20 bg-white/[0.02] p-5">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center mb-3">
            <Crown className="h-5 w-5 text-amber-400" />
          </div>
          <p className="text-2xl font-bold text-white">{paid.length}</p>
          <p className="text-xs text-white mt-0.5">Active Subscriptions</p>
          <p className="text-xs text-slate-500 mt-0.5">paid accounts</p>
        </div>
        <div className="rounded-2xl border border-emerald-500/20 bg-white/[0.02] p-5">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-3">
            <CreditCard className="h-5 w-5 text-emerald-400" />
          </div>
          <p className="text-2xl font-bold text-white">
            ₦{(totalRevenue / 100).toLocaleString("en-NG")}
          </p>
          <p className="text-xs text-white mt-0.5">Total Revenue Tracked</p>
          <p className="text-xs text-slate-500 mt-0.5">from Paystack records</p>
        </div>
        <div className="rounded-2xl border border-blue-500/20 bg-white/[0.02] p-5">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center mb-3">
            <Building2 className="h-5 w-5 text-blue-400" />
          </div>
          <p className="text-2xl font-bold text-white">
            {paid.filter((u) => u.role.startsWith("RECRUITER")).length}
          </p>
          <p className="text-xs text-white mt-0.5">Recruiter Plans</p>
          <p className="text-xs text-slate-500 mt-0.5">company subscriptions</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative w-72">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
        <input value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Search subscriber..."
          className="h-9 w-full rounded-xl border border-white/10 bg-white/[0.02] pl-9 pr-4 text-sm text-white outline-none placeholder:text-slate-500 focus:border-purple-500/40" />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-slate-500" />
        </div>
      ) : (
        <div className="rounded-2xl border border-white/5 bg-white/[0.02]">
          {filtered.length === 0 && (
            <div className="p-10 text-center text-slate-500">No subscriptions found</div>
          )}
          {filtered.map((user, idx) => (
            <div key={user.id} className={`flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between ${idx !== filtered.length - 1 ? "border-b border-white/5" : ""}`}>
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-600 text-xs font-bold text-white">
                  {(user.name ?? user.email)[0].toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-white">{user.name ?? "—"}</p>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${ROLE_COLORS[user.role] ?? "bg-slate-500/20 text-slate-400"}`}>
                      {ROLE_LABELS[user.role] ?? user.role}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">{user.email}</p>
                </div>
              </div>
              {user.subscription && (
                <div className="flex flex-wrap gap-3 text-xs">
                  <div className="rounded-xl border border-white/5 bg-white/[0.02] px-3 py-2 space-y-0.5">
                    <p className="text-slate-500">Plan</p>
                    <p className="text-white font-medium">{user.subscription.plan}</p>
                  </div>
                  <div className="rounded-xl border border-white/5 bg-white/[0.02] px-3 py-2 space-y-0.5">
                    <p className="text-slate-500">Status</p>
                    <p className={`font-medium ${user.subscription.status === "ACTIVE" ? "text-emerald-400" : "text-amber-400"}`}>
                      {user.subscription.status}
                    </p>
                  </div>
                  {user.subscription.amount && (
                    <div className="rounded-xl border border-white/5 bg-white/[0.02] px-3 py-2 space-y-0.5">
                      <p className="text-slate-500">Amount</p>
                      <p className="text-white font-medium">
                        ₦{(user.subscription.amount / 100).toLocaleString("en-NG")}
                      </p>
                    </div>
                  )}
                  {user.subscription.currentPeriodEnd && (
                    <div className="rounded-xl border border-white/5 bg-white/[0.02] px-3 py-2 space-y-0.5">
                      <p className="text-slate-500">Renews</p>
                      <p className="text-white font-medium">
                        {new Date(user.subscription.currentPeriodEnd).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}
                      </p>
                    </div>
                  )}
                  {user.subscription.paystackReference && (
                    <div className="rounded-xl border border-white/5 bg-white/[0.02] px-3 py-2 space-y-0.5">
                      <p className="text-slate-500">Reference</p>
                      <p className="text-white font-mono text-[10px]">{user.subscription.paystackReference}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
