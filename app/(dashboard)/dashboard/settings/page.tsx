"use client";

import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast, { Toaster } from "react-hot-toast";
import {
  User,
  Mail,
  Phone,
  Lock,
  Crown,
  Calendar,
  CreditCard,
  LogOut,
  Trash2,
  Loader2,
  Check,
  AlertCircle,
  Sparkles,
} from "lucide-react";

export default function SettingsPage() {
  const { data: session } = useSession();
  const router = useRouter();

  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch("/api/user/profile");
        const data = await res.json();
        if (data.success) {
          setProfile(data.user);
          setName(data.user.name || "");
          setPhone(data.user.phone || "");
        }
      } catch (error) {
        console.error("Failed to fetch profile:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);

    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone }),
      });

      const data = await res.json();

      if (data.success) {
        toast.success("Profile updated successfully!");
        setProfile({ ...profile, name, phone });
      } else {
        toast.error(data.error || "Failed to update profile");
      }
    } catch (error) {
      toast.error("Something went wrong");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast.error("New passwords don't match");
      return;
    }

    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    setSavingPassword(true);

    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await res.json();

      if (data.success) {
        toast.success("Password changed successfully!");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        toast.error(data.error || "Failed to change password");
      }
    } catch (error) {
      toast.error("Something went wrong");
    } finally {
      setSavingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);

    try {
      const res = await fetch("/api/user/profile", {
        method: "DELETE",
      });

      if (res.ok) {
        toast.success("Account deleted. Goodbye!");
        setTimeout(() => {
          signOut({ callbackUrl: "/" });
        }, 2000);
      } else {
        toast.error("Failed to delete account");
        setDeleting(false);
      }
    } catch (error) {
      toast.error("Something went wrong");
      setDeleting(false);
    }
  };

  const isPremium = profile?.role === "PREMIUM";

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl">
        <div className="flex h-96 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Toaster position="top-right" />

      <div>
        <h1 className="text-3xl font-bold text-white">Settings</h1>
        <p className="mt-2 text-slate-400">
          Manage your account, password, and subscription
        </p>
      </div>

      {/* Subscription Card */}
      <div
        className={`rounded-3xl border p-6 backdrop-blur-xl ${
          isPremium
            ? "border-amber-500/20 bg-gradient-to-br from-amber-500/10 to-orange-500/5"
            : "border-white/10 bg-white/[0.02]"
        }`}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div
              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${
                isPremium
                  ? "bg-amber-500/20 text-amber-400"
                  : "bg-slate-800 text-slate-400"
              }`}
            >
              {isPremium ? (
                <Crown className="h-6 w-6" />
              ) : (
                <User className="h-6 w-6" />
              )}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">
                {isPremium ? "Premium Plan" : "Free Plan"}
              </h3>
              <p className="mt-1 text-sm text-slate-400">
                {isPremium
                  ? "You have unlimited access to all features"
                  : "Limited daily usage — upgrade for unlimited access"}
              </p>
              {isPremium && profile?.subscription?.currentPeriodEnd && (
                <p className="mt-2 flex items-center gap-1 text-xs text-amber-400">
                  <Calendar className="h-3 w-3" />
                  Renews on{" "}
                  {new Date(
                    profile.subscription.currentPeriodEnd
                  ).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>

          {!isPremium && (
            <Link
              href="/pricing"
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-amber-700/25 transition hover:from-amber-500 hover:to-orange-500"
            >
              <Sparkles className="h-4 w-4" />
              Upgrade
            </Link>
          )}
        </div>
      </div>

      {/* Profile Information */}
      <form
        onSubmit={handleUpdateProfile}
        className="rounded-3xl border border-white/10 bg-white/[0.02] p-6 backdrop-blur-xl"
      >
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-white">
            Profile Information
          </h3>
          <p className="mt-1 text-sm text-slate-400">
            Update your account details
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">
              Full Name
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full rounded-xl border border-white/10 bg-slate-900/50 px-11 py-3 text-white placeholder-slate-500 outline-none transition focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
              <input
                type="email"
                value={profile?.email || ""}
                disabled
                className="w-full cursor-not-allowed rounded-xl border border-white/10 bg-slate-900/30 px-11 py-3 text-slate-500 outline-none"
              />
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Email cannot be changed. Contact support if you need to update it.
            </p>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">
              Phone Number{" "}
              <span className="text-xs text-slate-500">(optional)</span>
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+234 XXX XXX XXXX"
                className="w-full rounded-xl border border-white/10 bg-slate-900/50 px-11 py-3 text-white placeholder-slate-500 outline-none transition focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={savingProfile}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-medium text-white shadow-lg shadow-blue-700/25 transition hover:bg-blue-500 disabled:opacity-50"
          >
            {savingProfile ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Check className="h-4 w-4" />
                Save Changes
              </>
            )}
          </button>
        </div>
      </form>

      {/* Change Password */}
      <form
        onSubmit={handleChangePassword}
        className="rounded-3xl border border-white/10 bg-white/[0.02] p-6 backdrop-blur-xl"
      >
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-white">Change Password</h3>
          <p className="mt-1 text-sm text-slate-400">
            Update your password to keep your account secure
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">
              Current Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                className="w-full rounded-xl border border-white/10 bg-slate-900/50 px-11 py-3 text-white placeholder-slate-500 outline-none transition focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">
              New Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={8}
                placeholder="At least 8 characters"
                className="w-full rounded-xl border border-white/10 bg-slate-900/50 px-11 py-3 text-white placeholder-slate-500 outline-none transition focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">
              Confirm New Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={8}
                className="w-full rounded-xl border border-white/10 bg-slate-900/50 px-11 py-3 text-white placeholder-slate-500 outline-none transition focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={savingPassword}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-medium text-white shadow-lg shadow-blue-700/25 transition hover:bg-blue-500 disabled:opacity-50"
          >
            {savingPassword ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Changing...
              </>
            ) : (
              <>
                <Lock className="h-4 w-4" />
                Change Password
              </>
            )}
          </button>
        </div>
      </form>

      {/* Account Actions */}
      <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-6 backdrop-blur-xl">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-white">Account</h3>
          <p className="mt-1 text-sm text-slate-400">
            Manage your session and account
          </p>
        </div>

        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white transition hover:bg-white/10"
        >
          <div className="flex items-center gap-3">
            <LogOut className="h-4 w-4" />
            Sign Out
          </div>
        </button>
      </div>

      {/* Danger Zone */}
      <div className="rounded-3xl border border-red-500/20 bg-red-500/5 p-6 backdrop-blur-xl">
        <div className="mb-4 flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-red-400" />
          <h3 className="text-lg font-semibold text-red-400">Danger Zone</h3>
        </div>

        <p className="mb-4 text-sm text-slate-300">
          Once you delete your account, there is no going back. All your data
          including CVs, analyses, and subscriptions will be permanently
          deleted.
        </p>

        {!showDeleteConfirm ? (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-400 transition hover:bg-red-500/20"
          >
            <Trash2 className="h-4 w-4" />
            Delete Account
          </button>
        ) : (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4">
            <p className="mb-3 text-sm font-medium text-red-400">
              ⚠️ Are you absolutely sure? This cannot be undone.
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleDeleteAccount}
                disabled={deleting}
                className="flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700 disabled:opacity-50"
              >
                {deleting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4" />
                    Yes, Delete My Account
                  </>
                )}
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white transition hover:bg-white/10"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}