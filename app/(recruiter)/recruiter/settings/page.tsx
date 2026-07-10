"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Building2, Mail, Globe, Users, Briefcase,
  Save, Loader2, CheckCircle, Info, Lock,
  Copy, ExternalLink,
} from "lucide-react";
import toast from "react-hot-toast";

const companySizes = ["1-10", "11-50", "51-200", "201-500", "500+"];
const industries = [
  "Technology", "Finance", "Healthcare", "Education", "Retail",
  "Manufacturing", "Media", "Consulting", "Real Estate",
  "NGO/Non-profit", "Government", "Other",
];

type UsernameStatus = "idle" | "checking" | "available" | "taken" | "invalid" | "reserved";

export default function RecruiterSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [savingUsername, setSavingUsername] = useState(false);
  const [usernameSaved, setUsernameSaved] = useState(false);
  const [profileId, setProfileId] = useState("");

  // Company fields
  const [companyName, setCompanyName] = useState("");
  const [companySize, setCompanySize] = useState("");
  const [industry, setIndustry] = useState("");
  const [website, setWebsite] = useState("");
  const [description, setDescription] = useState("");
  const [replyToEmail, setReplyToEmail] = useState("");

  // Username fields
  const [username, setUsername] = useState("");
  const [originalUsername, setOriginalUsername] = useState("");
  const [usernameStatus, setUsernameStatus] = useState<UsernameStatus>("idle");
  const [usernameMessage, setUsernameMessage] = useState("");
  const [slugLocked, setSlugLocked] = useState(false);
  const [checkTimer, setCheckTimer] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch("/api/recruiter/settings");
        const data = await res.json();
        if (data.profile) {
          setProfileId(data.profile.id);
          setCompanyName(data.profile.companyName || "");
          setCompanySize(data.profile.companySize || "");
          setIndustry(data.profile.industry || "");
          setWebsite(data.profile.website || "");
          setDescription(data.profile.description || "");
          setReplyToEmail(data.profile.replyToEmail || "");
          setUsername(data.profile.companySlug || "");
          setOriginalUsername(data.profile.companySlug || "");
          setSlugLocked(data.profile.slugLocked || false);
        }
      } catch {
        toast.error("Failed to load settings");
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  // ── Username availability check ──────────────────────────────────────────────

  const checkUsername = useCallback(async (value: string) => {
    if (!value || value === originalUsername) {
      setUsernameStatus("idle");
      setUsernameMessage("");
      return;
    }

    const regex = /^[a-z0-9]{3,20}$/;
    if (!regex.test(value)) {
      setUsernameStatus("invalid");
      setUsernameMessage("Must be 3-20 characters, lowercase letters and numbers only");
      return;
    }

    setUsernameStatus("checking");
    try {
      const params = new URLSearchParams({ slug: value });
      if (profileId) params.set("excludeId", profileId);

      const res = await fetch(`/api/recruiter/slug/check?${params}`);
      const data = await res.json();

      if (data.error && !data.available) {
        setUsernameStatus("reserved");
        setUsernameMessage(data.error);
      } else if (data.available) {
        setUsernameStatus("available");
        setUsernameMessage(`Available! Your apply email will be: ${data.applyEmail}`);
      } else {
        setUsernameStatus("taken");
        setUsernameMessage("This username is already taken. Try another one.");
      }
    } catch {
      setUsernameStatus("idle");
      setUsernameMessage("");
    }
  }, [originalUsername, profileId]);

  const handleUsernameChange = (value: string) => {
    const cleaned = value.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 20);
    setUsername(cleaned);
    if (checkTimer) clearTimeout(checkTimer);
    const timer = setTimeout(() => checkUsername(cleaned), 500);
    setCheckTimer(timer);
  };

  // ── Confirm username (saves only username) ────────────────────────────────────

  const handleConfirmUsername = async () => {
    if (usernameStatus !== "available") return;

    setSavingUsername(true);
    try {
      const res = await fetch("/api/recruiter/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName,
          companySlug: username,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.slugLocked) {
          toast.error("Username is locked. Contact support to change it.");
        } else {
          toast.error(data.error || "Failed to save username");
        }
        return;
      }

      setOriginalUsername(username);
      setUsernameStatus("idle");
      setUsernameMessage("");
      setUsernameSaved(true);
      setTimeout(() => setUsernameSaved(false), 3000);
      toast.success("Company username confirmed!");
    } catch {
      toast.error("Failed to save username");
    } finally {
      setSavingUsername(false);
    }
  };

  // ── Save all other settings ───────────────────────────────────────────────────

  const handleSave = async () => {
    if (!companyName.trim()) {
      toast.error("Company name is required");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/recruiter/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName,
          companySize,
          industry,
          website,
          description,
          replyToEmail,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Failed to save settings");
        return;
      }

      toast.success("Settings saved successfully!");
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const copyApplyEmail = () => {
    const email = `${originalUsername}-apply@tomparo.com`;
    navigator.clipboard.writeText(email);
    toast.success("Copied to clipboard!");
  };

  const statusConfig = {
    idle: { color: "text-slate-500", border: "border-white/10" },
    checking: { color: "text-slate-400", border: "border-white/10" },
    available: { color: "text-emerald-400", border: "border-emerald-500/30" },
    taken: { color: "text-red-400", border: "border-red-500/30" },
    invalid: { color: "text-amber-400", border: "border-amber-500/30" },
    reserved: { color: "text-amber-400", border: "border-amber-500/30" },
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-slate-500" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-12">

      <div>
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-slate-400 mt-1">Manage your company profile and email preferences</p>
      </div>

      {/* ── Company Profile ── */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-8 space-y-5">
        <h2 className="text-base font-semibold text-white flex items-center gap-2">
          <Building2 className="w-4 h-4 text-purple-400" />
          Company Profile
        </h2>

        <div>
          <label className="block text-xs font-medium text-slate-400 mb-2">
            Company Name <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            placeholder="Acme Corp"
            className="w-full rounded-xl border border-white/10 bg-slate-900/50 px-4 py-3 text-white placeholder-slate-500 outline-none transition focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 text-sm"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-2">Company Size</label>
            <div className="relative">
              <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
              <select
                value={companySize}
                onChange={(e) => setCompanySize(e.target.value)}
                className="w-full appearance-none rounded-xl border border-white/10 bg-slate-900/50 pl-9 pr-8 py-3 text-sm text-white outline-none focus:border-purple-500/50 transition"
              >
                <option value="" className="bg-slate-900">Select...</option>
                {companySizes.map((s) => (
                  <option key={s} value={s} className="bg-slate-900">{s}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-2">Industry</label>
            <div className="relative">
              <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
              <select
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                className="w-full appearance-none rounded-xl border border-white/10 bg-slate-900/50 pl-9 pr-8 py-3 text-sm text-white outline-none focus:border-purple-500/50 transition"
              >
                <option value="" className="bg-slate-900">Select...</option>
                {industries.map((i) => (
                  <option key={i} value={i} className="bg-slate-900">{i}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-400 mb-2">Website</label>
          <div className="relative">
            <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
            <input
              type="url"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://yourcompany.com"
              className="w-full rounded-xl border border-white/10 bg-slate-900/50 pl-9 pr-4 py-3 text-white placeholder-slate-500 outline-none transition focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 text-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-400 mb-2">Company Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief description of your company..."
            rows={3}
            className="w-full rounded-xl border border-white/10 bg-slate-900/50 px-4 py-3 text-white placeholder-slate-500 outline-none transition focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 resize-none text-sm"
          />
        </div>
      </div>

      {/* ── Company Username ── */}
      <div className="rounded-2xl border border-purple-500/20 bg-purple-500/5 p-8 space-y-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <Mail className="w-4 h-4 text-purple-400" />
              Company Username
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              This creates your unique apply email address where candidates send their applications
            </p>
          </div>
          {slugLocked && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <Lock className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-xs text-amber-400 font-medium">Locked</span>
            </div>
          )}
        </div>

        {/* Current apply email display */}
        {originalUsername && (
          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs text-slate-500 mb-1">Your current apply email address</p>
              <p className="text-white font-semibold text-sm">
                {originalUsername}-apply@tomparo.com
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Share this with candidates so they can apply directly to you
              </p>
            </div>
            <div className="flex gap-2 shrink-0">
              <button
                onClick={copyApplyEmail}
                className="p-2 rounded-lg border border-white/10 bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition"
                title="Copy to clipboard"
              >
                <Copy className="w-4 h-4" />
              </button>
              <a
                href={`mailto:${originalUsername}-apply@tomparo.com`}
                className="p-2 rounded-lg border border-white/10 bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition"
                title="Open in email client"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>
        )}

        {/* Locked state */}
        {slugLocked ? (
          <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-5">
            <div className="flex items-start gap-3">
              <Lock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-white">Company username is locked</p>
                <p className="text-xs text-slate-400 mt-1">
                  To change your company username, contact TomParo support with:
                </p>
                <ul className="mt-2 space-y-1">
                  {[
                    "Government-issued document proving company name change",
                    "Valid management staff ID card",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2 text-xs text-slate-300">
                      <span className="text-amber-400 shrink-0">•</span>
                      {item}
                    </li>
                  ))}
                </ul>
                <a
                  href="mailto:support@tomparo.com?subject=Company Username Change Request"
                  className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-400 text-xs font-semibold hover:bg-amber-500/30 transition"
                >
                  <Mail className="w-3.5 h-3.5" />
                  Contact Support
                </a>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <label className="block text-xs font-medium text-slate-400">
              Choose your company username
            </label>

            {/* Input + suffix */}
            <div className="flex items-center">
              <input
                type="text"
                value={username}
                onChange={(e) => handleUsernameChange(e.target.value)}
                placeholder="yourcompany"
                maxLength={20}
                className={`flex-1 rounded-l-xl border border-r-0 bg-slate-900/50 px-4 py-3 text-white placeholder-slate-500 outline-none transition text-sm ${statusConfig[usernameStatus].border}`}
              />
              <div className="rounded-r-xl border border-l-0 border-white/10 bg-slate-900/80 px-4 py-3 text-slate-400 text-sm whitespace-nowrap">
                -apply@tomparo.com
              </div>
            </div>

            {/* Status message */}
            {usernameStatus !== "idle" && (
              <div className={`rounded-xl border px-4 py-3 ${
                usernameStatus === "available"
                  ? "border-emerald-500/20 bg-emerald-500/5"
                  : usernameStatus === "taken" || usernameStatus === "invalid" || usernameStatus === "reserved"
                  ? "border-red-500/20 bg-red-500/5"
                  : "border-white/5 bg-white/[0.02]"
              }`}>
                <p className={`text-xs flex items-center gap-2 ${statusConfig[usernameStatus].color}`}>
                  {usernameStatus === "checking" ? (
                    <><Loader2 className="w-3 h-3 animate-spin" />Checking if username is available...</>
                  ) : usernameStatus === "available" ? (
                    <><CheckCircle className="w-3 h-3" />{usernameMessage}</>
                  ) : (
                    usernameMessage
                  )}
                </p>
              </div>
            )}

            {/* Confirm Username Button — only shows when available */}
            {usernameStatus === "available" && (
              <button
                onClick={handleConfirmUsername}
                disabled={savingUsername}
                className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white text-sm font-semibold hover:opacity-90 transition disabled:opacity-50"
              >
                {savingUsername ? (
                  <><Loader2 className="w-4 h-4 animate-spin" />Confirming...</>
                ) : usernameSaved ? (
                  <><CheckCircle className="w-4 h-4" />Username Confirmed!</>
                ) : (
                  <><CheckCircle className="w-4 h-4" />Confirm Username</>
                )}
              </button>
            )}

            {/* Confirmed badge */}
            {usernameStatus === "idle" && originalUsername && originalUsername === username && (
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-emerald-500/20 bg-emerald-500/5">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-emerald-400">
                    Username confirmed: {originalUsername}
                  </p>
                  <p className="text-xs text-slate-500">
                    Apply email: {originalUsername}-apply@tomparo.com
                  </p>
                </div>
              </div>
            )}

            {/* Info box */}
            <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4 flex items-start gap-3">
              <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
              <div className="text-xs text-slate-400 space-y-1">
                <p>Your company username creates a unique apply email address for candidates.</p>
                <p>You can change it freely right now. After confirming, future changes require identity verification via support.</p>
                <p className="text-amber-400">Choose carefully — this is how candidates will reach you.</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Email Reply Settings ── */}
      <div className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-8 space-y-5">
        <h2 className="text-base font-semibold text-white flex items-center gap-2">
          <Mail className="w-4 h-4 text-blue-400" />
          Email Reply Settings
        </h2>

        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 space-y-2">
          <p className="text-xs font-semibold text-white flex items-center gap-2">
            <Info className="w-3.5 h-3.5 text-blue-400" />
            How email sending works
          </p>
          <div className="space-y-1.5 text-xs text-slate-400">
            <div className="flex items-start gap-2">
              <span className="text-blue-400 shrink-0">→</span>
              When you send an email to a candidate, it is sent from{" "}
              <span className="text-white font-medium">hire@tomparo.com</span>{" "}
              with your company name displayed
            </div>
            <div className="flex items-start gap-2">
              <span className="text-blue-400 shrink-0">→</span>
              When the candidate clicks{" "}
              <span className="text-white font-medium">Reply</span>,
              their reply goes directly to your personal email below — not to TomParo
            </div>
            <div className="flex items-start gap-2">
              <span className="text-blue-400 shrink-0">→</span>
              You can also choose to receive a copy of every email you send to candidates
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-400 mb-2">
            Your Personal / Business Email (Reply-To)
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
            <input
              type="email"
              value={replyToEmail}
              onChange={(e) => setReplyToEmail(e.target.value)}
              placeholder="you@gmail.com or you@yourcompany.com"
              className="w-full rounded-xl border border-white/10 bg-slate-900/50 pl-9 pr-4 py-3 text-white placeholder-slate-500 outline-none transition focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 text-sm"
            />
          </div>
          <p className="text-xs text-slate-500 mt-2">
            Candidate replies will go to this email. Use your Gmail, Yahoo, or business email.
          </p>
        </div>

        {replyToEmail && (
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 flex items-start gap-3">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div className="text-xs text-slate-300 space-y-1">
              <p className="font-medium text-white">How it will work:</p>
              <p>📤 TomParo sends email from <span className="text-blue-400">hire@tomparo.com</span></p>
              <p>📬 Candidate receives a professional branded email</p>
              <p>↩️ Candidate clicks Reply → goes to <span className="text-emerald-400">{replyToEmail}</span></p>
              <p>📋 CC copy (if ticked when sending) → also goes to <span className="text-emerald-400">{replyToEmail}</span></p>
            </div>
          </div>
        )}
      </div>

      {/* ── Save Settings ── */}
      <button
        onClick={handleSave}
        disabled={saving}
        className={`w-full inline-flex items-center justify-center gap-2 px-6 py-4 rounded-xl text-white font-semibold transition disabled:opacity-50 ${
          saved
            ? "bg-emerald-600 hover:bg-emerald-500"
            : "bg-purple-600 hover:bg-purple-500"
        }`}
      >
        {saving ? (
          <><Loader2 className="w-4 h-4 animate-spin" />Saving...</>
        ) : saved ? (
          <><CheckCircle className="w-4 h-4" />Settings Saved!</>
        ) : (
          <><Save className="w-4 h-4" />Save Settings</>
        )}
      </button>
    </div>
  );
}