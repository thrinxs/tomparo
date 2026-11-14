"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, Loader2, CheckCircle, XCircle, Clock, User } from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";

interface CVRequest {
  id: string;
  status: string;
  message: string;
  createdAt: string;
  approvedAt: string | null;
  portfolio: { id: string; title: string; slug: string };
  requestedBy: { id: string; name: string; email: string; image: string };
}

export default function CVRequestsPage() {
  const [requests, setRequests] = useState<CVRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => { fetchRequests(); }, []);

  const fetchRequests = async () => {
    try {
      const res = await fetch("/api/portfolio/requests");
      const data = await res.json();
      setRequests(Array.isArray(data) ? data : []);
    } catch { toast.error("Failed to load requests"); }
    finally { setLoading(false); }
  };

  const handleAction = async (id: string, action: "approve" | "deny") => {
    setUpdating(id);
    try {
      const res = await fetch("/api/portfolio/requests", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action }),
      });
      if (!res.ok) return toast.error("Failed to update request");
      toast.success(action === "approve" ? "CV access granted!" : "Request declined");
      setRequests(prev => prev.map(r => r.id === id ? {
        ...r,
        status: action === "approve" ? "APPROVED" : "DENIED",
        approvedAt: action === "approve" ? new Date().toISOString() : null,
      } : r));
    } catch { toast.error("Something went wrong"); }
    finally { setUpdating(null); }
  };

  const statusBadge = (status: string) => {
    if (status === "APPROVED") return <span className="flex items-center gap-1 text-xs text-green-600 bg-green-100 px-2.5 py-1 rounded-full font-medium"><CheckCircle size={12} /> Approved</span>;
    if (status === "DENIED") return <span className="flex items-center gap-1 text-xs text-red-500 bg-red-100 px-2.5 py-1 rounded-full font-medium"><XCircle size={12} /> Declined</span>;
    return <span className="flex items-center gap-1 text-xs text-amber-600 bg-amber-100 px-2.5 py-1 rounded-full font-medium"><Clock size={12} /> Pending</span>;
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-8">
        <Link href="/dashboard/portfolio" className="p-2 rounded-xl hover:bg-slate-100 text-slate-500 transition">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">CV Requests</h1>
          <p className="text-slate-500 text-sm">Manage who can view your CV</p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={32} className="animate-spin text-blue-600" />
        </div>
      ) : requests.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed border-slate-200 rounded-3xl">
          <User size={40} className="text-slate-300 mx-auto mb-3" />
          <h3 className="text-slate-700 font-semibold mb-1">No CV requests yet</h3>
          <p className="text-slate-400 text-sm">When employers like your portfolio and request your CV, they will appear here</p>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map(r => (
            <div key={r.id} className="bg-white border border-slate-200 rounded-2xl p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  {r.requestedBy.image ? (
                    <img src={r.requestedBy.image} alt={r.requestedBy.name} className="w-10 h-10 rounded-full object-cover" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <User size={18} className="text-blue-600" />
                    </div>
                  )}
                  <div>
                    <p className="font-semibold text-slate-800">{r.requestedBy.name}</p>
                    <p className="text-xs text-slate-400">{r.requestedBy.email}</p>
                  </div>
                </div>
                {statusBadge(r.status)}
              </div>

              <div className="mt-3 pl-13">
                <p className="text-xs text-slate-500 mb-1">
                  Requesting CV from: <span className="font-medium text-slate-700">{r.portfolio.title}</span>
                </p>
                {r.message && (
                  <div className="bg-slate-50 rounded-xl p-3 mt-2">
                    <p className="text-sm text-slate-600 italic">"{r.message}"</p>
                  </div>
                )}
                <p className="text-xs text-slate-400 mt-2">
                  {new Date(r.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                </p>
              </div>

              {r.status === "PENDING" && (
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => handleAction(r.id, "approve")}
                    disabled={updating === r.id}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-semibold transition">
                    {updating === r.id ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
                    Approve Access
                  </button>
                  <button
                    onClick={() => handleAction(r.id, "deny")}
                    disabled={updating === r.id}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 border border-red-200 hover:bg-red-50 text-red-500 rounded-xl text-sm font-semibold transition">
                    <XCircle size={14} /> Decline
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
