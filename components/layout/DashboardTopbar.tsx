"use client";

import { useSession, signOut } from "next-auth/react";
import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Bell, ChevronDown, User, Settings,
  LogOut, Crown, Menu, Heart, MessageSquare,
  CheckCheck, ExternalLink,
} from "lucide-react";

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  link: string;
  read: boolean;
  createdAt: string;
}

interface Props {
  onMenuClick: () => void;
}

export default function DashboardTopbar({ onMenuClick }: Props) {
  const { data: session } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);
  const bellRef = useRef<HTMLDivElement>(null);

  const user = session?.user as any;
  const isPremium = user?.isPremium || false;

  const fetchNotifications = useCallback(async () => {
    if (!session?.user) return;
    try {
      const res = await fetch("/api/notifications");
      if (!res.ok) return;
      const data = await res.json();
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch {}
  }, [session?.user]);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
      if (bellRef.current && !bellRef.current.contains(event.target as Node)) {
        setBellOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const markAllRead = async () => {
    try {
      await fetch("/api/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAllRead: true }),
      });
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch {}
  };

  const markRead = async (id: string) => {
    try {
      await fetch("/api/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch {}
  };

  const notifIcon = (type: string) => {
    if (type === "PORTFOLIO_LIKE") return <Heart className="h-4 w-4 text-red-400" />;
    if (type === "CV_REQUEST") return <MessageSquare className="h-4 w-4 text-blue-400" />;
    if (type === "CV_APPROVED") return <CheckCheck className="h-4 w-4 text-green-400" />;
    if (type === "CV_DENIED") return <MessageSquare className="h-4 w-4 text-slate-400" />;
    return <Bell className="h-4 w-4 text-slate-400" />;
  };

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  const initials = user?.name
    ?.split(" ")
    .map((n: string) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase() || "U";

  return (
    <div className="sticky top-0 z-30 border-b border-white/5 bg-slate-950/80 backdrop-blur-xl">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6">

        {/* Left */}
        <div className="flex items-center gap-3">
          <button
            onClick={onMenuClick}
            className="lg:hidden rounded-xl border border-white/10 bg-white/5 p-2 text-slate-400 hover:text-white hover:bg-white/10 transition"
          >
            <Menu className="h-5 w-5" />
          </button>
          <h1 className="text-sm font-medium text-slate-400">
            Welcome back,{" "}
            <span className="text-white">{user?.name?.split(" ")[0] || "there"}</span>
          </h1>
        </div>

        {/* Right */}
        <div className="flex items-center gap-2 sm:gap-3">

          {/* Bell */}
          <div className="relative" ref={bellRef}>
            <button
              onClick={() => { setBellOpen(!bellOpen); if (!bellOpen) fetchNotifications(); }}
              className="relative rounded-xl border border-white/5 bg-white/5 p-2.5 text-slate-400 transition hover:bg-white/10 hover:text-white"
            >
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>

            {bellOpen && (
              <div className="absolute right-0 top-full mt-2 w-80 rounded-2xl border border-white/10 bg-slate-900/98 shadow-2xl backdrop-blur-xl overflow-hidden z-50">
                {/* Bell Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
                  <span className="text-sm font-semibold text-white">Notifications</span>
                  {unreadCount > 0 && (
                    <button onClick={markAllRead}
                      className="text-xs text-blue-400 hover:text-blue-300 transition flex items-center gap-1">
                      <CheckCheck className="h-3 w-3" /> Mark all read
                    </button>
                  )}
                </div>

                {/* Notification List */}
                <div className="max-h-96 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="py-10 text-center">
                      <Bell className="h-8 w-8 text-slate-700 mx-auto mb-2" />
                      <p className="text-sm text-slate-500">No notifications yet</p>
                    </div>
                  ) : (
                    notifications.map(n => (
                      <div key={n.id}
                        className={`flex items-start gap-3 px-4 py-3 border-b border-white/5 hover:bg-white/5 transition cursor-pointer ${!n.read ? "bg-blue-500/5" : ""}`}
                        onClick={() => {
                          markRead(n.id);
                          if (n.link) window.location.href = n.link;
                          setBellOpen(false);
                        }}
                      >
                        <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/5">
                          {notifIcon(n.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-xs font-semibold leading-snug ${!n.read ? "text-white" : "text-slate-300"}`}>
                            {n.title}
                          </p>
                          {n.body && <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{n.body}</p>}
                          <p className="text-xs text-slate-600 mt-1">{timeAgo(n.createdAt)}</p>
                        </div>
                        {!n.read && (
                          <div className="mt-1.5 h-2 w-2 rounded-full bg-blue-500 shrink-0" />
                        )}
                      </div>
                    ))
                  )}
                </div>

                {notifications.length > 0 && (
                  <div className="p-2 border-t border-white/5">
                    <Link href="/dashboard/portfolio/requests"
                      onClick={() => setBellOpen(false)}
                      className="flex items-center justify-center gap-1.5 w-full py-2 rounded-xl text-xs text-slate-400 hover:text-white hover:bg-white/5 transition">
                      <ExternalLink className="h-3 w-3" /> View CV Requests
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* User Menu */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex items-center gap-2 sm:gap-3 rounded-xl border border-white/5 bg-white/5 px-2 sm:px-3 py-2 transition hover:bg-white/10"
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-cyan-400 text-xs font-semibold text-white shrink-0">
                {initials}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-xs font-medium text-white">{user?.name || "User"}</p>
                <p className="text-xs text-slate-500">{isPremium ? "Premium" : "Free Plan"}</p>
              </div>
              <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-full mt-2 w-64 rounded-2xl border border-white/10 bg-slate-900/95 p-2 shadow-2xl backdrop-blur-xl">
                <div className="border-b border-white/5 p-3">
                  <p className="text-sm font-medium text-white">{user?.name || "User"}</p>
                  <p className="mt-0.5 text-xs text-slate-500">{user?.email}</p>
                  <div className="mt-2">
                    {isPremium ? (
                      <div className="inline-flex items-center gap-1 rounded-full border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-400">
                        <Crown className="h-3 w-3" /> Premium
                      </div>
                    ) : (
                      <div className="inline-flex items-center gap-1 rounded-full border border-slate-700 bg-slate-800 px-2 py-0.5 text-xs font-medium text-slate-400">
                        Free Plan
                      </div>
                    )}
                  </div>
                </div>
                <div className="p-1">
                  <Link href="/dashboard/settings" onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-300 transition hover:bg-white/5 hover:text-white">
                    <User className="h-4 w-4" /> Profile
                  </Link>
                  <Link href="/dashboard/settings" onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-300 transition hover:bg-white/5 hover:text-white">
                    <Settings className="h-4 w-4" /> Settings
                  </Link>
                  {!isPremium && (
                    <Link href="/pricing" onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-amber-400 transition hover:bg-amber-500/10">
                      <Crown className="h-4 w-4" /> Upgrade to Premium
                    </Link>
                  )}
                </div>
                <div className="border-t border-white/5 p-1">
                  <button onClick={() => signOut({ callbackUrl: "/" })}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-red-400 transition hover:bg-red-500/10">
                    <LogOut className="h-4 w-4" /> Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
