"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Building2, Mail, Globe, Users, Briefcase,
  Save, Loader2, CheckCircle, Info, Lock, UserPlus,
  Copy, ExternalLink, MessageSquare, Plus, Trash2,
  ChevronDown, ChevronUp, Mic, Type, Video, Play,
} from "lucide-react";
import toast from "react-hot-toast";
import { ELEVENLABS_VOICES, DEFAULT_MALE_VOICE_ID } from "@/lib/ai/interview-engine";

const companySizes = ["1-10", "11-50", "51-200", "201-500", "500+"];
const industries = [
  "Technology", "Finance", "Healthcare", "Education", "Retail",
  "Manufacturing", "Media", "Consulting", "Real Estate",
  "NGO/Non-profit", "Government", "Other",
];

const seatLimits: Record<string, number> = {
  FREE: 1, RECRUITER_STARTER: 1, RECRUITER_GROWTH: 2,
  RECRUITER_BUSINESS: 5, RECRUITER_ENTERPRISE: 10,
  RECRUITER_SCALE: 25, RECRUITER_CUSTOM: 999, ADMIN: 999,
};

const ELEVENLABS_PLANS = [
  "RECRUITER_BUSINESS", "RECRUITER_ENTERPRISE", "RECRUITER_SCALE",
  "RECRUITER_CUSTOM", "ADMIN",
];

const triggerOptions = [
  { value: "before_question", label: "Before a specific question number" },
  { value: "question_type", label: "Before every question of a type" },
  { value: "timed", label: "After a set number of minutes" },
];

const questionTypeOptions = [
  { value: "CV_VERIFICATION", label: "CV Verification" },
  { value: "LOCATION_BASED", label: "Location Based" },
  { value: "JOB_SPECIFIC", label: "Job Specific" },
  { value: "BEHAVIOURAL", label: "Behavioural" },
];

interface Instruction {
  id: string;
  trigger: "before_question" | "question_type" | "timed";
  questionIndex?: number;
  questionType?: string;
  afterMinutes?: number;
  message: string;
}

type UsernameStatus = "idle" | "checking" | "available" | "taken" | "invalid" | "reserved";

export default function RecruiterSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [savingUsername, setSavingUsername] = useState(false);
  const [usernameSaved, setUsernameSaved] = useState(false);
  const [profileId, setProfileId] = useState("");
  const [recruiterPlan, setRecruiterPlan] = useState("");

  // ── Company fields ──
  const [companyName, setCompanyName] = useState("");
  const [companySize, setCompanySize] = useState("");
  const [industry, setIndustry] = useState("");
  const [website, setWebsite] = useState("");
  const [description, setDescription] = useState("");
  const [replyToEmail, setReplyToEmail] = useState("");

  // ── Username fields ──
  const [username, setUsername] = useState("");
  const [originalUsername, setOriginalUsername] = useState("");
  const [usernameStatus, setUsernameStatus] = useState<UsernameStatus>("idle");
  const [usernameMessage, setUsernameMessage] = useState("");
  const [slugLocked, setSlugLocked] = useState(false);
  const [checkTimer, setCheckTimer] = useState<NodeJS.Timeout | null>(null);

  // ── Team fields ──
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [pendingInvites, setPendingInvites] = useState<any[]>([]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("MEMBER");
  const [inviting, setInviting] = useState(false);
  const [seatLimit, setSeatLimit] = useState(1);

  // ── Interview Settings fields ──
  const [globalOpening, setGlobalOpening] = useState("");
  const [globalClosing, setGlobalClosing] = useState("");
  const [globalInstructions, setGlobalInstructions] = useState<Instruction[]>([]);
  const [defaultVoiceId, setDefaultVoiceId] = useState<string>(DEFAULT_MALE_VOICE_ID);
  const [showInterviewSettings, setShowInterviewSettings] = useState(false);
  const [savingInterviewSettings, setSavingInterviewSettings] = useState(false);
  const [interviewSettingsSaved, setInterviewSettingsSaved] = useState(false);
  const [previewingVoiceId, setPreviewingVoiceId] = useState<string | null>(null);

  const isElevenLabsPlan = ELEVENLABS_PLANS.includes(recruiterPlan);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [settingsRes, teamRes, profileRes, intSettingsRes] = await Promise.all([
          fetch("/api/recruiter/settings"),
          fetch("/api/recruiter/team"),
          fetch("/api/user/profile"),
          fetch("/api/recruiter/interview-settings"),
        ]);
        const [settingsData, teamData, profileData, intData] = await Promise.all([
          settingsRes.json(), teamRes.json(), profileRes.json(), intSettingsRes.json(),
        ]);

        if (settingsData.profile) {
          setProfileId(settingsData.profile.id);
          setCompanyName(settingsData.profile.companyName || "");
          setCompanySize(settingsData.profile.companySize || "");
          setIndustry(settingsData.profile.industry || "");
          setWebsite(settingsData.profile.website || "");
          setDescription(settingsData.profile.description || "");
          setReplyToEmail(settingsData.profile.replyToEmail || "");
          setUsername(settingsData.profile.companySlug || "");
          setOriginalUsername(settingsData.profile.companySlug || "");
          setSlugLocked(settingsData.profile.slugLocked || false);
        }

        if (teamData.members) setTeamMembers(teamData.members);
        if (teamData.invites) setPendingInvites(teamData.invites);

        if (profileData.user?.role) {
          setRecruiterPlan(profileData.user.role);
          setSeatLimit(seatLimits[profileData.user.role] || 1);
        }

        if (intData.settings) {
          setGlobalOpening(intData.settings.globalOpening || "");
          setGlobalClosing(intData.settings.globalClosing || "");
          setDefaultVoiceId(intData.settings.defaultVoiceId || DEFAULT_MALE_VOICE_ID);
          if (intData.settings.globalInstructions) {
            try {
              const parsed = JSON.parse(intData.settings.globalInstructions);
              setGlobalInstructions(parsed.map((ins: any) => ({
                ...ins, id: ins.id || Math.random().toString(36).slice(2),
              })));
            } catch {}
          }
        }
      } catch {
        toast.error("Failed to load settings");
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  // ── Username check ──
  const checkUsername = useCallback(async (value: string) => {
    if (!value || value === originalUsername) { setUsernameStatus("idle"); setUsernameMessage(""); return; }
    const regex = /^[a-z0-9]{3,20}$/;
    if (!regex.test(value)) { setUsernameStatus("invalid"); setUsernameMessage("Must be 3-20 characters, lowercase letters and numbers only"); return; }
    setUsernameStatus("checking");
    try {
      const params = new URLSearchParams({ slug: value });
      if (profileId) params.set("excludeId", profileId);
      const res = await fetch(`/api/recruiter/slug/check?${params}`);
      const data = await res.json();
      if (data.error && !data.available) { setUsernameStatus("reserved"); setUsernameMessage(data.error); }
      else if (data.available) { setUsernameStatus("available"); setUsernameMessage(`Available! Your apply email will be: ${data.applyEmail}`); }
      else { setUsernameStatus("taken"); setUsernameMessage("This username is already taken. Try another one."); }
    } catch { setUsernameStatus("idle"); setUsernameMessage(""); }
  }, [originalUsername, profileId]);

  const handleUsernameChange = (value: string) => {
    const cleaned = value.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 20);
    setUsername(cleaned);
    if (checkTimer) clearTimeout(checkTimer);
    const timer = setTimeout(() => checkUsername(cleaned), 500);
    setCheckTimer(timer);
  };

  const handleConfirmUsername = async () => {
    if (usernameStatus !== "available") return;
    setSavingUsername(true);
    try {
      const res = await fetch("/api/recruiter/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyName, companySlug: username }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.slugLocked ? "Username is locked. Contact support." : data.error || "Failed to save username"); return; }
      setOriginalUsername(username);
      setUsernameStatus("idle");
      setUsernameMessage("");
      setUsernameSaved(true);
      setTimeout(() => setUsernameSaved(false), 3000);
      toast.success("Company username confirmed!");
    } catch { toast.error("Failed to save username"); }
    finally { setSavingUsername(false); }
  };

  const handleSave = async () => {
    if (!companyName.trim()) { toast.error("Company name is required"); return; }
    setSaving(true);
    try {
      const res = await fetch("/api/recruiter/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyName, companySize, industry, website, description, replyToEmail }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || "Failed to save settings"); return; }
      toast.success("Settings saved!");
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch { toast.error("Something went wrong. Please try again."); }
    finally { setSaving(false); }
  };

  // ── Preview ElevenLabs voice ──
  const handlePreviewVoice = async (voiceId: string) => {
    if (previewingVoiceId === voiceId) { setPreviewingVoiceId(null); return; }
    setPreviewingVoiceId(voiceId);
    try {
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: "Hello! I'm your AI interviewer for today.", voiceId }),
      });
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const audio = new Audio(URL.createObjectURL(blob));
      audio.onended = () => setPreviewingVoiceId(null);
      audio.onerror = () => setPreviewingVoiceId(null);
      audio.play();
    } catch { setPreviewingVoiceId(null); toast.error("Failed to preview voice"); }
  };

  // ── Save global interview settings ──
  const handleSaveInterviewSettings = async () => {
    setSavingInterviewSettings(true);
    try {
      const res = await fetch("/api/recruiter/interview-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          globalOpening: globalOpening.trim() || null,
          globalClosing: globalClosing.trim() || null,
          globalInstructions: globalInstructions.length > 0 ? globalInstructions : null,
          defaultVoiceId: isElevenLabsPlan ? defaultVoiceId : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success("Interview template saved!");
      setInterviewSettingsSaved(true);
      setTimeout(() => setInterviewSettingsSaved(false), 3000);
    } catch (err: any) {
      toast.error(err.message || "Failed to save interview settings");
    } finally {
      setSavingInterviewSettings(false);
    }
  };

  // ── Instruction helpers ──
  const addInstruction = () => {
    setGlobalInstructions((prev) => [...prev, {
      id: Math.random().toString(36).slice(2), trigger: "before_question", questionIndex: 2, message: "",
    }]);
  };
  const updateInstruction = (id: string, updates: Partial<Instruction>) => {
    setGlobalInstructions((prev) => prev.map((ins) => ins.id === id ? { ...ins, ...updates } : ins));
  };
  const removeInstruction = (id: string) => {
    setGlobalInstructions((prev) => prev.filter((ins) => ins.id !== id));
  };

  // ── Team handlers ──
  const handleInvite = async () => {
    if (!inviteEmail.trim()) return;
    setInviting(true);
    try {
      const res = await fetch("/api/recruiter/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail, memberRole: inviteRole }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || "Failed to send invite"); return; }
      setPendingInvites((prev) => [...prev, data.invite]);
      setInviteEmail("");
      toast.success("Invite sent!");
    } catch { toast.error("Failed to send invite"); }
    finally { setInviting(false); }
  };

  const handleRemoveMember = async (memberId: string) => {
    try {
      const res = await fetch(`/api/recruiter/team/${memberId}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setTeamMembers((prev) => prev.filter((m) => m.id !== memberId));
      toast.success("Team member removed");
    } catch { toast.error("Failed to remove member"); }
  };

  const copyApplyEmail = () => {
    navigator.clipboard.writeText(`${originalUsername}-apply@tomparo.com`);
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
        <p className="text-slate-400 mt-1">Manage your company profile, email preferences, and interview templates</p>
      </div>

      {/* ── Company Profile ── */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-8 space-y-5">
        <h2 className="text-base font-semibold text-white flex items-center gap-2">
          <Building2 className="w-4 h-4 text-purple-400" />
          Company Profile
        </h2>

        <div>
          <label className="block text-xs font-medium text-slate-400 mb-2">Company Name <span className="text-red-400">*</span></label>
          <input type="text" value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="Acme Corp"
            className="w-full rounded-xl border border-white/10 bg-slate-900/50 px-4 py-3 text-white placeholder-slate-500 outline-none transition focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 text-sm" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-2">Company Size</label>
            <div className="relative">
              <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
              <select value={companySize} onChange={(e) => setCompanySize(e.target.value)}
                className="w-full appearance-none rounded-xl border border-white/10 bg-slate-900/50 pl-9 pr-8 py-3 text-sm text-white outline-none focus:border-purple-500/50 transition">
                <option value="" className="bg-slate-900">Select...</option>
                {companySizes.map((s) => <option key={s} value={s} className="bg-slate-900">{s}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-2">Industry</label>
            <div className="relative">
              <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
              <select value={industry} onChange={(e) => setIndustry(e.target.value)}
                className="w-full appearance-none rounded-xl border border-white/10 bg-slate-900/50 pl-9 pr-8 py-3 text-sm text-white outline-none focus:border-purple-500/50 transition">
                <option value="" className="bg-slate-900">Select...</option>
                {industries.map((i) => <option key={i} value={i} className="bg-slate-900">{i}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-400 mb-2">Website</label>
          <div className="relative">
            <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
            <input type="url" value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://yourcompany.com"
              className="w-full rounded-xl border border-white/10 bg-slate-900/50 pl-9 pr-4 py-3 text-white placeholder-slate-500 outline-none transition focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 text-sm" />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-400 mb-2">Company Description</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Brief description of your company..." rows={3}
            className="w-full rounded-xl border border-white/10 bg-slate-900/50 px-4 py-3 text-white placeholder-slate-500 outline-none transition focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 resize-none text-sm" />
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
            <p className="text-xs text-slate-400 mt-1">This creates your unique apply email address where candidates send their applications</p>
          </div>
          {slugLocked && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <Lock className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-xs text-amber-400 font-medium">Locked</span>
            </div>
          )}
        </div>

        {originalUsername && (
          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs text-slate-500 mb-1">Your current apply email address</p>
              <p className="text-white font-semibold text-sm">{originalUsername}-apply@tomparo.com</p>
            </div>
            <div className="flex gap-2 shrink-0">
              <button onClick={copyApplyEmail} className="p-2 rounded-lg border border-white/10 bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition" title="Copy">
                <Copy className="w-4 h-4" />
              </button>
              <a href={`mailto:${originalUsername}-apply@tomparo.com`} className="p-2 rounded-lg border border-white/10 bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition">
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>
        )}

        {slugLocked ? (
          <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-5">
            <div className="flex items-start gap-3">
              <Lock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-white">Company username is locked</p>
                <p className="text-xs text-slate-400 mt-1">Contact TomParo support with government-issued ID to change.</p>
                <a href="mailto:support@tomparo.com?subject=Company Username Change Request"
                  className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-400 text-xs font-semibold hover:bg-amber-500/30 transition">
                  <Mail className="w-3.5 h-3.5" />Contact Support
                </a>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <label className="block text-xs font-medium text-slate-400">Choose your company username</label>
            <div className="flex items-center">
              <input type="text" value={username} onChange={(e) => handleUsernameChange(e.target.value)}
                placeholder="yourcompany" maxLength={20}
                className={`flex-1 rounded-l-xl border border-r-0 bg-slate-900/50 px-4 py-3 text-white placeholder-slate-500 outline-none transition text-sm ${statusConfig[usernameStatus].border}`} />
              <div className="rounded-r-xl border border-l-0 border-white/10 bg-slate-900/80 px-4 py-3 text-slate-400 text-sm whitespace-nowrap">
                -apply@tomparo.com
              </div>
            </div>
            {usernameStatus !== "idle" && (
              <div className={`rounded-xl border px-4 py-3 ${usernameStatus === "available" ? "border-emerald-500/20 bg-emerald-500/5" : "border-red-500/20 bg-red-500/5"}`}>
                <p className={`text-xs flex items-center gap-2 ${statusConfig[usernameStatus].color}`}>
                  {usernameStatus === "checking" ? <><Loader2 className="w-3 h-3 animate-spin" />Checking...</>
                    : usernameStatus === "available" ? <><CheckCircle className="w-3 h-3" />{usernameMessage}</>
                    : usernameMessage}
                </p>
              </div>
            )}
            {usernameStatus === "available" && (
              <button onClick={handleConfirmUsername} disabled={savingUsername}
                className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white text-sm font-semibold hover:opacity-90 transition disabled:opacity-50">
                {savingUsername ? <><Loader2 className="w-4 h-4 animate-spin" />Confirming...</> : <><CheckCircle className="w-4 h-4" />Confirm Username</>}
              </button>
            )}
            {usernameStatus === "idle" && originalUsername && originalUsername === username && (
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-emerald-500/20 bg-emerald-500/5">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-emerald-400">Username confirmed: {originalUsername}</p>
                  <p className="text-xs text-slate-500">Apply email: {originalUsername}-apply@tomparo.com</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Email Reply Settings ── */}
      <div className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-8 space-y-5">
        <h2 className="text-base font-semibold text-white flex items-center gap-2">
          <Mail className="w-4 h-4 text-blue-400" />
          Email Reply Settings
        </h2>
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-2">Your Personal / Business Email (Reply-To)</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
            <input type="email" value={replyToEmail} onChange={(e) => setReplyToEmail(e.target.value)}
              placeholder="you@gmail.com or you@yourcompany.com"
              className="w-full rounded-xl border border-white/10 bg-slate-900/50 pl-9 pr-4 py-3 text-white placeholder-slate-500 outline-none transition focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 text-sm" />
          </div>
          <p className="text-xs text-slate-500 mt-2">Candidate replies will go to this email.</p>
        </div>
        {replyToEmail && (
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 flex items-start gap-3">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div className="text-xs text-slate-300 space-y-1">
              <p>📤 TomParo sends from <span className="text-blue-400">hire@tomparo.com</span></p>
              <p>↩️ Candidate replies → <span className="text-emerald-400">{replyToEmail}</span></p>
            </div>
          </div>
        )}
      </div>

      {/* ── Global Interview Message Template ── */}
      <div className="rounded-2xl border border-indigo-500/20 bg-indigo-500/5 overflow-hidden">
        <button onClick={() => setShowInterviewSettings(!showInterviewSettings)}
          className="w-full flex items-center justify-between p-6 hover:bg-white/[0.01] transition">
          <div className="flex items-center gap-3">
            <MessageSquare className="w-4 h-4 text-indigo-400 shrink-0" />
            <div className="text-left">
              <p className="text-sm font-semibold text-white">Global Interview Template</p>
              <p className="text-xs text-slate-400 mt-0.5">
                Default voice, opening, closing, and instructions for all AI interviews
              </p>
            </div>
          </div>
          {showInterviewSettings ? <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" /> : <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />}
        </button>

        {showInterviewSettings && (
          <div className="px-6 pb-6 space-y-6 border-t border-white/5 pt-6">

            {/* Info */}
            <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-4 flex items-start gap-3">
              <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
              <div className="text-xs text-slate-400 space-y-1">
                <p>These apply to <span className="text-white">all interviews</span> by default. Overridable per interview.</p>
                <p>Use <span className="text-indigo-400">[Name]</span> <span className="text-indigo-400">[Job]</span> <span className="text-indigo-400">[Company]</span> as placeholders.</p>
              </div>
            </div>

            {/* ── Default Voice (Business+ only) ── */}
            {isElevenLabsPlan ? (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-white mb-1">
                    Default AI Interview Voice
                    <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] bg-violet-500/20 text-violet-400">ElevenLabs</span>
                  </label>
                  <p className="text-[11px] text-slate-500">
                    This voice is used in all your voice interviews. Candidates can change it on their setup screen.
                  </p>
                </div>
                <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
                  {ELEVENLABS_VOICES.map((v) => (
                    <div
                      key={v.id}
                      onClick={() => setDefaultVoiceId(v.id)}
                      className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs transition border cursor-pointer ${defaultVoiceId === v.id ? "bg-violet-600 border-violet-600 text-white" : "border-white/10 bg-white/[0.02] text-slate-400 hover:border-white/20 hover:text-white"}`}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium">{v.name}</p>
                        <p className={`text-[10px] truncate ${defaultVoiceId === v.id ? "text-violet-200" : "text-slate-600"}`}>{v.desc}</p>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); handlePreviewVoice(v.id); }}
                        className={`ml-3 p-1.5 rounded-lg shrink-0 transition ${defaultVoiceId === v.id ? "hover:bg-white/20 text-white" : "hover:bg-white/10 text-slate-500 hover:text-white"}`}
                      >
                        {previewingVoiceId === v.id
                          ? <Loader2 className="w-3 h-3 animate-spin" />
                          : <Play className="w-3 h-3" />
                        }
                      </button>
                    </div>
                  ))}
                </div>
                {defaultVoiceId && (
                  <p className="text-xs text-slate-500">
                    Selected: <span className="text-white font-medium">{ELEVENLABS_VOICES.find(v => v.id === defaultVoiceId)?.name || "Unknown"}</span>
                  </p>
                )}
              </div>
            ) : (
              <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                <div className="flex items-start gap-3">
                  <Mic className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-slate-400">AI Voice Selection</p>
                    <p className="text-xs text-slate-600 mt-1">
                      Human-like ElevenLabs voices are available on Business plan and above.
                      Your current plan uses the browser's built-in voice.
                    </p>
                    <a href="/recruiter-pricing" className="mt-2 inline-flex items-center gap-1 text-xs text-purple-400 hover:text-purple-300 transition">
                      Upgrade to unlock ElevenLabs voices →
                    </a>
                  </div>
                </div>
              </div>
            )}

            {/* Interview type notes */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { icon: Type, label: "Text", color: "text-indigo-400", note: "Displays as text" },
                { icon: Mic, label: "Voice", color: "text-violet-400", note: "AI reads aloud" },
                { icon: Video, label: "Video", color: "text-pink-400", note: "AI reads aloud" },
              ].map(({ icon: Icon, label, color, note }) => (
                <div key={label} className="rounded-xl border border-white/5 bg-white/[0.02] p-3 text-center">
                  <Icon className={`w-4 h-4 ${color} mx-auto mb-1`} />
                  <p className={`text-xs font-semibold ${color}`}>{label}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">{note}</p>
                </div>
              ))}
            </div>

            {/* Global opening */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-white">Global Opening Message</label>
              <p className="text-[11px] text-slate-500">AI says this at the start of every interview. Leave blank for TomParo default.</p>
              <textarea value={globalOpening} onChange={(e) => setGlobalOpening(e.target.value)}
                placeholder="Hi [Name]! Welcome to your interview for [Job] at [Company]. I'm your AI interviewer today. Let's begin."
                rows={4}
                className="w-full rounded-xl border border-white/10 bg-slate-900/50 px-4 py-3 text-sm text-white placeholder-slate-600 outline-none focus:border-indigo-500/50 resize-none transition" />
              <div className="flex items-center justify-between">
                <p className="text-[10px] text-slate-600">{globalOpening.length} / 500 characters</p>
                {globalOpening && <button onClick={() => setGlobalOpening("")} className="text-[10px] text-slate-500 hover:text-red-400 transition">Clear (use default)</button>}
              </div>
            </div>

            {/* Global closing */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-white">Global Closing Message</label>
              <p className="text-[11px] text-slate-500">AI says this after all questions. Leave blank for TomParo default.</p>
              <textarea value={globalClosing} onChange={(e) => setGlobalClosing(e.target.value)}
                placeholder="That's all for today, [Name]. Thank you for your time. The team will review your responses and be in touch soon. Good luck!"
                rows={4}
                className="w-full rounded-xl border border-white/10 bg-slate-900/50 px-4 py-3 text-sm text-white placeholder-slate-600 outline-none focus:border-indigo-500/50 resize-none transition" />
              <div className="flex items-center justify-between">
                <p className="text-[10px] text-slate-600">{globalClosing.length} / 500 characters</p>
                {globalClosing && <button onClick={() => setGlobalClosing("")} className="text-[10px] text-slate-500 hover:text-red-400 transition">Clear (use default)</button>}
              </div>
            </div>

            {/* Global instructions */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <label className="block text-xs font-semibold text-white">Global Mid-Interview Instructions</label>
                  <p className="text-[11px] text-slate-500 mt-0.5">AI says these at specific points in every interview.</p>
                </div>
                <button onClick={addInstruction} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-500 transition">
                  <Plus className="w-3.5 h-3.5" /> Add
                </button>
              </div>

              {globalInstructions.length === 0 && (
                <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4 text-center">
                  <p className="text-xs text-slate-500">No global instructions yet.</p>
                </div>
              )}

              {globalInstructions.map((ins, idx) => (
                <div key={ins.id} className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-white">Instruction {idx + 1}</p>
                    <button onClick={() => removeInstruction(ins.id)} className="p-1 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">When</label>
                    <div className="flex flex-col gap-1.5">
                      {triggerOptions.map((opt) => (
                        <button key={opt.value} onClick={() => updateInstruction(ins.id, { trigger: opt.value as any })}
                          className={`text-left px-3 py-2 rounded-lg text-xs transition ${ins.trigger === opt.value ? "bg-indigo-500/10 border border-indigo-500/20 text-indigo-400" : "bg-white/[0.02] border border-white/5 text-slate-400 hover:border-white/10"}`}>
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  {ins.trigger === "before_question" && (
                    <div className="space-y-1">
                      <label className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">Before question number</label>
                      <input type="number" min={1} max={10} value={ins.questionIndex || 2}
                        onChange={(e) => updateInstruction(ins.id, { questionIndex: parseInt(e.target.value) })}
                        className="w-24 rounded-lg border border-white/10 bg-slate-900/50 px-3 py-1.5 text-sm text-white outline-none focus:border-indigo-500/50 transition" />
                    </div>
                  )}
                  {ins.trigger === "question_type" && (
                    <div className="space-y-1">
                      <label className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">Question type</label>
                      <div className="flex flex-wrap gap-1.5">
                        {questionTypeOptions.map((opt) => (
                          <button key={opt.value} onClick={() => updateInstruction(ins.id, { questionType: opt.value })}
                            className={`px-2.5 py-1.5 rounded-lg text-xs transition ${ins.questionType === opt.value ? "bg-indigo-500/10 border border-indigo-500/20 text-indigo-400" : "bg-white/[0.02] border border-white/5 text-slate-400 hover:border-white/10"}`}>
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  {ins.trigger === "timed" && (
                    <div className="space-y-1">
                      <label className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">After minutes</label>
                      <input type="number" min={1} max={60} value={ins.afterMinutes || 5}
                        onChange={(e) => updateInstruction(ins.id, { afterMinutes: parseInt(e.target.value) })}
                        className="w-24 rounded-lg border border-white/10 bg-slate-900/50 px-3 py-1.5 text-sm text-white outline-none focus:border-indigo-500/50 transition" />
                    </div>
                  )}
                  <div className="space-y-1">
                    <label className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">What AI should say</label>
                    <textarea value={ins.message} onChange={(e) => updateInstruction(ins.id, { message: e.target.value })}
                      placeholder='e.g. "Great work so far. We are now moving to the technical section."'
                      rows={2}
                      className="w-full rounded-lg border border-white/10 bg-slate-900/50 px-3 py-2 text-xs text-white placeholder-slate-600 outline-none focus:border-indigo-500/50 resize-none transition" />
                  </div>
                </div>
              ))}
            </div>

            {/* Save interview settings */}
            <button onClick={handleSaveInterviewSettings} disabled={savingInterviewSettings}
              className={`w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-white font-semibold transition disabled:opacity-50 ${interviewSettingsSaved ? "bg-emerald-600 hover:bg-emerald-500" : "bg-indigo-600 hover:bg-indigo-500"}`}>
              {savingInterviewSettings ? <><Loader2 className="w-4 h-4 animate-spin" />Saving...</>
                : interviewSettingsSaved ? <><CheckCircle className="w-4 h-4" />Interview Template Saved!</>
                : <><Save className="w-4 h-4" />Save Interview Template</>}
            </button>
          </div>
        )}
      </div>

      {/* ── Team Management ── */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-purple-400" />
              Team Members
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">Invite colleagues to manage recruitment together</p>
          </div>
          <span className="text-xs text-slate-500 border border-white/10 px-3 py-1 rounded-full">
            {teamMembers.length} / {seatLimit} seat{seatLimit !== 1 ? "s" : ""}
          </span>
        </div>

        {teamMembers.length > 0 && (
          <div className="space-y-2">
            {teamMembers.map((member: any) => (
              <div key={member.id} className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5">
                <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center shrink-0">
                  <span className="text-xs font-bold text-purple-400">
                    {(member.user.name || member.user.email || "?")[0].toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{member.user.name || member.user.email}</p>
                  <p className="text-xs text-slate-500">{member.user.email} · {member.role.toLowerCase()}</p>
                </div>
                <button onClick={() => handleRemoveMember(member.id)} className="text-xs text-red-400 hover:text-red-300 transition px-2 py-1 rounded-lg hover:bg-red-500/10">
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}

        {pendingInvites.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Pending Invites</p>
            {pendingInvites.map((invite: any) => (
              <div key={invite.id} className="flex items-center gap-3 p-3 rounded-xl bg-amber-500/5 border border-amber-500/20">
                <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center shrink-0">
                  <span className="text-xs font-bold text-amber-400">?</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{invite.email}</p>
                  <p className="text-xs text-amber-400">Invite pending · expires {new Date(invite.expiresAt).toLocaleDateString("en-NG")}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {teamMembers.length + pendingInvites.length < seatLimit ? (
          <div className="space-y-3">
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Invite Team Member</p>
            <div className="flex gap-3">
              <input type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="colleague@company.com"
                className="flex-1 rounded-xl border border-white/10 bg-slate-900/50 px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-purple-500/50 transition" />
              <select value={inviteRole} onChange={(e) => setInviteRole(e.target.value)}
                className="rounded-xl border border-white/10 bg-slate-900/50 px-3 py-2.5 text-sm text-white outline-none focus:border-purple-500/50 transition">
                <option value="MEMBER" className="bg-slate-900">Member</option>
                <option value="ADMIN" className="bg-slate-900">Admin</option>
              </select>
              <button onClick={handleInvite} disabled={inviting || !inviteEmail.trim()}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 text-white text-sm font-semibold hover:bg-purple-500 transition disabled:opacity-50">
                {inviting ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                Invite
              </button>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 text-center">
            <p className="text-sm text-amber-400 font-medium">All seats filled</p>
            <p className="text-xs text-slate-500 mt-1">
              <a href="/recruiter-pricing" className="text-purple-400 hover:text-purple-300 underline">Upgrade</a> for more seats.
            </p>
          </div>
        )}
      </div>

      {/* ── Save Settings ── */}
      <button onClick={handleSave} disabled={saving}
        className={`w-full inline-flex items-center justify-center gap-2 px-6 py-4 rounded-xl text-white font-semibold transition disabled:opacity-50 ${saved ? "bg-emerald-600 hover:bg-emerald-500" : "bg-purple-600 hover:bg-purple-500"}`}>
        {saving ? <><Loader2 className="w-4 h-4 animate-spin" />Saving...</>
          : saved ? <><CheckCircle className="w-4 h-4" />Settings Saved!</>
          : <><Save className="w-4 h-4" />Save Settings</>}
      </button>
    </div>
  );
}
