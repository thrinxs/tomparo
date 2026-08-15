"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  Users, MessageSquare, CheckSquare, Mail, Crown,
  Shield, User, Clock, Plus, Trash2, RefreshCw,
  CheckCircle, XCircle, Loader2, Activity,
} from "lucide-react";
import toast from "react-hot-toast";

export default function TeamPage() {
  const { data: session } = useSession();
  const user = session?.user as any;
  const [members, setMembers] = useState<any[]>([]);
  const [invites, setInvites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [seatLimit, setSeatLimit] = useState(1);
  const [usedSeats, setUsedSeats] = useState(0);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("MEMBER");
  const [inviting, setInviting] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const load = async () => {
    try {
      const res = await fetch("/api/recruiter/team");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMembers(data.members || []);
      setInvites(data.invites || []);
      setSeatLimit(data.seatLimit || 1);
      setUsedSeats(data.usedSeats || 0);
    } catch { toast.error("Failed to load team"); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleInvite = async () => {
    if (!inviteEmail.trim()) { toast.error("Enter an email address"); return; }
    setInviting(true);
    try {
      const res = await fetch("/api/recruiter/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail.trim(), memberRole: inviteRole }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setInviteEmail("");
      toast.success("Invite sent!");
      load();
    } catch (err: any) { toast.error(err.message || "Failed to send invite"); }
    finally { setInviting(false); }
  };

  const handleRemove = async (memberId: string) => {
    if (!confirm("Remove this team member?")) return;
    setRemovingId(memberId);
    try {
      const res = await fetch(`/api/recruiter/team/${memberId}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setMembers((prev) => prev.filter((m) => m.id !== memberId));
      toast.success("Member removed");
    } catch { toast.error("Failed to remove member"); }
    finally { setRemovingId(null); }
  };

  const roleConfig: Record<string, { icon: any; color: string; label: string }> = {
    OWNER:  { icon: Crown,  color: "text-amber-400",  label: "Owner"  },
    ADMIN:  { icon: Shield, color: "text-blue-400",   label: "Admin"  },
    MEMBER: { icon: User,   color: "text-slate-400",  label: "Member" },
  };

  if (loading) return <div className="flex items-center justify-center h-96"><Loader2 className="w-8 h-8 animate-spin text-purple-400" /></div>;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-white">Team</h1>
          <p className="text-slate-400 text-sm mt-1">Manage your team, collaborate, and track activity.</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/recruiter/team/room"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/10 bg-white/5 text-slate-400 text-sm font-medium hover:text-white transition">
            <MessageSquare className="w-4 h-4" />Conference Room
          </Link>
          <Link href="/recruiter/team/tasks"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-sm font-semibold transition">
            <CheckSquare className="w-4 h-4" />Tasks
          </Link>
        </div>
      </div>

      {/* Seat usage */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold text-white">Team Seats</p>
          <p className="text-sm text-slate-400"><span className="text-white font-bold">{usedSeats}</span> / {seatLimit} used</p>
        </div>
        <div className="h-2 w-full rounded-full bg-white/5">
          <div className="h-2 rounded-full bg-purple-500 transition-all" style={{ width: `${Math.min(100, (usedSeats / seatLimit) * 100)}%` }} />
        </div>
        {usedSeats >= seatLimit && (
          <p className="text-xs text-amber-400 mt-2">Seat limit reached. <Link href="/recruiter-pricing" className="underline">Upgrade</Link> to add more members.</p>
        )}
      </div>

      {/* Invite form */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 space-y-4">
        <h3 className="text-sm font-semibold text-white">Invite Team Member</h3>
        <div className="flex gap-3 flex-wrap">
          <input value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleInvite()}
            placeholder="colleague@company.com"
            className="flex-1 rounded-xl border border-white/10 bg-slate-900/50 px-4 py-2.5 text-sm text-white placeholder-slate-600 outline-none focus:border-purple-500/50 transition" />
          <select value={inviteRole} onChange={(e) => setInviteRole(e.target.value)}
            className="rounded-xl border border-white/10 bg-slate-900/50 px-4 py-2.5 text-sm text-white outline-none focus:border-purple-500/50 transition">
            <option value="ADMIN">Admin</option>
            <option value="MEMBER">Member</option>
          </select>
          <button onClick={handleInvite} disabled={inviting || !inviteEmail.trim()}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-sm font-semibold transition disabled:opacity-50">
            {inviting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
            {inviting ? "Sending..." : "Send Invite"}
          </button>
        </div>
      </div>

      {/* Members list */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-white uppercase tracking-wider">Members ({members.length})</h3>
        {members.map((member) => {
          const rc = roleConfig[member.role] || roleConfig.MEMBER;
          const RoleIcon = rc.icon;
          return (
            <div key={member.id} className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.02] p-5">
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center shrink-0">
                {member.user?.image
                  ? <img src={member.user.image} alt="" className="w-10 h-10 rounded-xl object-cover" />
                  : <span className="text-purple-400 font-bold text-sm">{(member.user?.name || "?")[0].toUpperCase()}</span>}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">{member.user?.name || member.user?.email}</p>
                <p className="text-xs text-slate-500 truncate">{member.user?.email}</p>
              </div>
              <div className="flex items-center gap-1.5">
                <RoleIcon className={`w-3.5 h-3.5 ${rc.color}`} />
                <span className={`text-xs font-medium ${rc.color}`}>{rc.label}</span>
              </div>
              <p className="text-xs text-slate-600 shrink-0">
                Joined {new Date(member.joinedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
              </p>
              {member.role !== "OWNER" && (
                <button onClick={() => handleRemove(member.id)} disabled={removingId === member.id}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition">
                  {removingId === member.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Pending invites */}
      {invites.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-white uppercase tracking-wider">Pending Invites ({invites.length})</h3>
          {invites.map((invite) => (
            <div key={invite.id} className="flex items-center gap-4 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-5">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
                <Mail className="w-5 h-5 text-amber-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">{invite.email}</p>
                <p className="text-xs text-slate-500">
                  Invited as {invite.role} · Expires {new Date(invite.expiresAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                </p>
              </div>
              <span className="text-xs px-2 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">Pending</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
