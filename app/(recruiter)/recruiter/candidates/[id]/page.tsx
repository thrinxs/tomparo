"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Mail, Phone, MapPin, Briefcase, GraduationCap,
  Globe, Star, AlertTriangle, Trophy, CheckCircle, XCircle,
  ChevronDown, ChevronUp, Zap, TrendingUp, BarChart3, Loader2,
  ChevronRight, Send, Wand2, Paperclip, Info,
} from "lucide-react";
import toast from "react-hot-toast";

const statusOptions = [
  { value: "NEW", label: "New", color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20" },
  { value: "REVIEWED", label: "Reviewed", color: "text-purple-400", bg: "bg-purple-500/10", border: "border-purple-500/20" },
  { value: "SHORTLISTED", label: "Shortlisted", color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20" },
  { value: "REJECTED", label: "Rejected", color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/20" },
  { value: "HIRED", label: "Hired", color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
];

const recommendationConfig: Record<string, { color: string; bg: string; border: string; icon: any }> = {
  "Strong Hire": { color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/30", icon: CheckCircle },
  "Hire": { color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/30", icon: CheckCircle },
  "Maybe": { color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/30", icon: AlertTriangle },
  "No Hire": { color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/30", icon: XCircle },
};

const emailTypes = [
  { value: "interview_invite", label: "Interview Invite", icon: "📅", color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20", description: "Invite candidate for an interview" },
  { value: "rejection", label: "Rejection", icon: "❌", color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/20", description: "Kindly inform candidate they were not selected" },
  { value: "offer", label: "Job Offer", icon: "🎉", color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20", description: "Send a formal job offer" },
  { value: "followup", label: "Follow Up", icon: "👋", color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20", description: "Check in with candidate" },
  { value: "waitlist", label: "Waitlist", icon: "⏳", color: "text-purple-400", bg: "bg-purple-500/10", border: "border-purple-500/20", description: "Keep candidate warm while on hold" },
];

export default function CandidateDetailPage() {
  const params = useParams();
  const router = useRouter();
  const candidateId = params.id as string;
  const emailSectionRef = useRef<HTMLDivElement>(null);

  const [candidate, setCandidate] = useState<any>(null);
  const [analysis, setAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("NEW");
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [notes, setNotes] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);
  const [showAllStrengths, setShowAllStrengths] = useState(false);
  const [showAllRedFlags, setShowAllRedFlags] = useState(false);

  const [selectedEmailType, setSelectedEmailType] = useState<string | null>(null);
  const [emailSubject, setEmailSubject] = useState("");
  const [emailMessage, setEmailMessage] = useState("");
  const [emailGenerating, setEmailGenerating] = useState(false);
  const [emailSending, setEmailSending] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [ccSelf, setCcSelf] = useState(false);
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const [replyToEmail, setReplyToEmail] = useState("");
  const [emailHistory, setEmailHistory] = useState<any[]>([]);
  const [interviewDate, setInterviewDate] = useState("");
  const [interviewType, setInterviewType] = useState("");
  const [salary, setSalary] = useState("");
  const [startDate, setStartDate] = useState("");

  const fetchEmailHistory = useCallback(async () => {
    try {
      const res = await fetch(`/api/recruiter/emails/history?candidateId=${candidateId}`);
      const data = await res.json();
      if (data.emails) setEmailHistory(data.emails);
    } catch {}
  }, [candidateId]);

  useEffect(() => {
    const fetchCandidate = async () => {
      try {
        const res = await fetch(`/api/recruiter/candidates/${candidateId}`);
        const data = await res.json();
        if (!res.ok) {
          toast.error("Candidate not found");
          router.push("/recruiter/candidates");
          return;
        }
        setCandidate(data.candidate);
        setStatus(data.candidate.status);
        setNotes(data.candidate.notes || "");
        if (data.candidate.aiAnalysis) {
          setAnalysis(JSON.parse(data.candidate.aiAnalysis));
        }
        if (data.candidate.status === "NEW") {
          await fetch(`/api/recruiter/candidates/${candidateId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: "REVIEWED" }),
          });
          setStatus("REVIEWED");
        }
        const settingsRes = await fetch("/api/recruiter/settings");
        const settingsData = await settingsRes.json();
        if (settingsData.profile?.replyToEmail) {
          setReplyToEmail(settingsData.profile.replyToEmail);
        }
      } catch {
        toast.error("Failed to load candidate");
      } finally {
        setLoading(false);
      }
    };
    fetchCandidate();
    fetchEmailHistory();
  }, [candidateId, fetchEmailHistory]);

  useEffect(() => {
    if (window.location.hash === "#email" && emailSectionRef.current) {
      setTimeout(() => {
        emailSectionRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 500);
    }
  }, [loading]);

  const handleStatusChange = async (newStatus: string) => {
    setUpdatingStatus(true);
    try {
      const res = await fetch(`/api/recruiter/candidates/${candidateId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error();
      setStatus(newStatus);
      toast.success(`Status updated to ${newStatus.toLowerCase()}`);
    } catch {
      toast.error("Failed to update status");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleSaveNotes = async () => {
    setSavingNotes(true);
    try {
      const res = await fetch(`/api/recruiter/candidates/${candidateId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes }),
      });
      if (!res.ok) throw new Error();
      toast.success("Notes saved!");
    } catch {
      toast.error("Failed to save notes");
    } finally {
      setSavingNotes(false);
    }
  };

  const handleSelectEmailType = (type: string) => {
    setSelectedEmailType(type);
    setEmailSubject("");
    setEmailMessage("");
    setEmailSent(false);
    setInterviewDate("");
    setInterviewType("");
    setSalary("");
    setStartDate("");
    setAttachmentFile(null);
  };

  const handleGenerateEmail = async () => {
    if (!selectedEmailType) return;
    setEmailGenerating(true);
    try {
      const res = await fetch("/api/recruiter/emails/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: selectedEmailType,
          candidateName: candidate?.candidateName || "Candidate",
          jobTitle: candidate?.job?.title || "the position",
          candidateSummary: analysis?.summary,
          extraContext: notes || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setEmailSubject(data.result?.subject || "");
      setEmailMessage(data.result?.message || "");
      toast.success("Email drafted by AI!");
    } catch (err: any) {
      toast.error(err.message || "Failed to generate email");
    } finally {
      setEmailGenerating(false);
    }
  };

  const handleSendEmail = async () => {
    if (!candidate?.candidateEmail) {
      toast.error("No email address for this candidate");
      return;
    }
    if (!emailMessage.trim() || !emailSubject.trim()) {
      toast.error("Please fill in the subject and message");
      return;
    }

    setEmailSending(true);
    try {
      let attachment = null;
      if (attachmentFile) {
        const reader = new FileReader();
        const base64 = await new Promise<string>((resolve) => {
          reader.onload = (e) => resolve((e.target?.result as string).split(",")[1]);
          reader.readAsDataURL(attachmentFile);
        });
        attachment = {
          filename: attachmentFile.name,
          content: base64,
          contentType: attachmentFile.type,
        };
      }

      const res = await fetch("/api/recruiter/emails/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: selectedEmailType,
          candidateId,
          to: candidate.candidateEmail,
          candidateName: candidate.candidateName || "Candidate",
          jobTitle: candidate?.job?.title || "the position",
          message: emailMessage,
          subject: emailSubject,
          ccSelf,
          interviewDate: interviewDate || undefined,
          interviewType: interviewType || undefined,
          salary: salary || undefined,
          startDate: startDate || undefined,
          attachment,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setEmailSent(true);
      fetchEmailHistory();
      toast.success("Email sent successfully!");
    } catch (err: any) {
      toast.error(err.message || "Failed to send email");
    } finally {
      setEmailSending(false);
    }
  };

  const getAtsColor = (score: number) =>
    score >= 80 ? "bg-emerald-500" : score >= 60 ? "bg-amber-500" : "bg-red-500";

  const recommendation = analysis?.hiringRecommendation as string | undefined;
  const recConfig = recommendation ? recommendationConfig[recommendation] : null;
  const selectedType = emailTypes.find((t) => t.value === selectedEmailType);
  const hasEmail = !!candidate?.candidateEmail;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-slate-500" />
      </div>
    );
  }

  if (!candidate) return null;

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">

      {/* Breadcrumb */}
      <div>
        <div className="flex items-center gap-2 text-sm text-slate-500 mb-4">
          <Link href="/recruiter/candidates" className="hover:text-white transition">Candidates</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-white">{candidate.candidateName || "Unknown"}</span>
        </div>
        <Link href="/recruiter/candidates" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition">
          <ArrowLeft className="w-4 h-4" />
          Back to Candidates
        </Link>
      </div>

      {/* Top Card */}
      <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-8">
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="flex-1">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-16 h-16 rounded-2xl bg-purple-500/20 flex items-center justify-center shrink-0">
                <span className="text-purple-400 font-bold text-xl">
                  {(candidate.candidateName || "?").split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)}
                </span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">{candidate.candidateName || "Unknown Candidate"}</h1>
                <p className="text-slate-400 text-sm mt-0.5">
                  {analysis?.currentRole || "Role not specified"}
                  {analysis?.currentCompany && ` · ${analysis.currentCompany}`}
                </p>
                {candidate.job && <p className="text-purple-400 text-xs mt-1">📋 Applied for: {candidate.job.title}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
              {candidate.candidateEmail && (
                <div className="flex items-center gap-2 text-sm text-slate-300">
                  <Mail className="w-4 h-4 text-slate-500 shrink-0" />
                  {candidate.candidateEmail}
                </div>
              )}
              {candidate.candidatePhone && (
                <div className="flex items-center gap-2 text-sm text-slate-300">
                  <Phone className="w-4 h-4 text-slate-500 shrink-0" />
                  {candidate.candidatePhone}
                </div>
              )}
              {analysis?.candidateLocation && (
                <div className="flex items-center gap-2 text-sm text-slate-300">
                  <MapPin className="w-4 h-4 text-slate-500 shrink-0" />
                  {analysis.candidateLocation}
                </div>
              )}
              {analysis?.totalExperienceYears != null && (
                <div className="flex items-center gap-2 text-sm text-slate-300">
                  <Briefcase className="w-4 h-4 text-slate-500 shrink-0" />
                  {analysis.totalExperienceYears} years experience
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              {analysis?.experienceLevel && (
                <span className="px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-xs text-purple-400 font-medium">
                  {analysis.experienceLevel}
                </span>
              )}
              {analysis?.industryBackground?.map((ind: string) => (
                <span key={ind} className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-slate-300">{ind}</span>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-4 lg:w-64">
            {recConfig && (
              <div className={`rounded-2xl border ${recConfig.border} ${recConfig.bg} p-5 text-center`}>
                <p className="text-xs text-slate-400 mb-2 uppercase tracking-wider font-medium">AI Recommendation</p>
                <div className={`text-2xl font-bold ${recConfig.color} mb-1`}>{recommendation}</div>
                <p className="text-xs text-slate-500">{analysis?.confidenceScore}% confidence</p>
              </div>
            )}

            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs text-slate-400 uppercase tracking-wider font-medium">ATS Score</p>
                <p className="text-2xl font-bold text-white">{candidate.atsScore}<span className="text-sm text-slate-500">/100</span></p>
              </div>
              <div className="h-2 w-full rounded-full bg-white/5">
                <div className={`h-2 rounded-full transition-all ${getAtsColor(candidate.atsScore || 0)}`} style={{ width: `${candidate.atsScore || 0}%` }} />
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
              <p className="text-xs text-slate-400 uppercase tracking-wider font-medium mb-3">Status</p>
              <div className="space-y-1.5">
                {statusOptions.map((s) => (
                  <button
                    key={s.value}
                    onClick={() => handleStatusChange(s.value)}
                    disabled={updatingStatus || status === s.value}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition ${
                      status === s.value
                        ? `${s.bg} ${s.border} border ${s.color}`
                        : "text-slate-500 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${status === s.value ? s.color.replace("text-", "bg-") : "bg-slate-700"}`} />
                    {s.label}
                    {status === s.value && <CheckCircle className="w-3.5 h-3.5 ml-auto" />}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {analysis?.summary && (
          <div className="mt-6 pt-6 border-t border-white/5">
            <p className="text-xs text-purple-400 font-semibold uppercase tracking-wider mb-2">AI Summary</p>
            <p className="text-slate-300 text-sm leading-relaxed">{analysis.summary}</p>
          </div>
        )}
      </div>

      {/* Skills */}
      {(analysis?.topSkills?.length > 0 || analysis?.technicalSkills?.length > 0 || analysis?.softSkills?.length > 0) && (
        <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-8">
          <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-purple-400" />Skills
          </h3>
          <div className="space-y-5">
            {analysis?.topSkills?.length > 0 && (
              <div>
                <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-3">Top Skills</p>
                <div className="flex flex-wrap gap-2">
                  {analysis.topSkills.map((skill: string) => (
                    <span key={skill} className="px-3 py-1.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-sm text-purple-300">{skill}</span>
                  ))}
                </div>
              </div>
            )}
            {analysis?.technicalSkills?.length > 0 && (
              <div>
                <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-3">Technical</p>
                <div className="flex flex-wrap gap-2">
                  {analysis.technicalSkills.map((skill: string) => (
                    <span key={skill} className="px-3 py-1.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-sm text-blue-300">{skill}</span>
                  ))}
                </div>
              </div>
            )}
            {analysis?.softSkills?.length > 0 && (
              <div>
                <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-3">Soft Skills</p>
                <div className="flex flex-wrap gap-2">
                  {analysis.softSkills.map((skill: string) => (
                    <span key={skill} className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-sm text-emerald-300">{skill}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Strengths + Red Flags */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {analysis?.strengths?.length > 0 && (
          <div className="rounded-3xl border border-emerald-500/20 bg-emerald-500/5 p-8">
            <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
              <Star className="w-5 h-5 text-emerald-400" />Strengths
            </h3>
            <div className="space-y-4">
              {(showAllStrengths ? analysis.strengths : analysis.strengths.slice(0, 3)).map((s: any, i: number) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{s.title}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{s.detail}</p>
                  </div>
                </div>
              ))}
            </div>
            {analysis.strengths.length > 3 && (
              <button onClick={() => setShowAllStrengths(!showAllStrengths)} className="mt-4 flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 transition">
                {showAllStrengths ? <><ChevronUp className="w-3 h-3" />Show less</> : <><ChevronDown className="w-3 h-3" />{analysis.strengths.length - 3} more</>}
              </button>
            )}
          </div>
        )}

        <div className="rounded-3xl border border-red-500/20 bg-red-500/5 p-8">
          <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-400" />Red Flags
          </h3>
          {!analysis?.redFlags?.length ? (
            <div className="flex items-center gap-3 text-emerald-400">
              <CheckCircle className="w-5 h-5" />
              <p className="text-sm">No red flags detected</p>
            </div>
          ) : (
            <div className="space-y-4">
              {(showAllRedFlags ? analysis.redFlags : analysis.redFlags.slice(0, 3)).map((f: any, i: number) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-red-500/20 flex items-center justify-center shrink-0 mt-0.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{f.title}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{f.detail}</p>
                  </div>
                </div>
              ))}
              {analysis.redFlags.length > 3 && (
                <button onClick={() => setShowAllRedFlags(!showAllRedFlags)} className="mt-2 flex items-center gap-1 text-xs text-red-400 hover:text-red-300 transition">
                  {showAllRedFlags ? <><ChevronUp className="w-3 h-3" />Show less</> : <><ChevronDown className="w-3 h-3" />{analysis.redFlags.length - 3} more</>}
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Key Achievements */}
      {analysis?.keyAchievements?.length > 0 && (
        <div className="rounded-3xl border border-amber-500/20 bg-amber-500/5 p-8">
          <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-400" />Key Achievements
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {analysis.keyAchievements.map((a: string, i: number) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0 mt-0.5">
                  <Star className="w-3.5 h-3.5 text-amber-400" />
                </div>
                <p className="text-sm text-slate-300">{a}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Education + Languages + Salary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {analysis?.education && (
          <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-6">
            <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-purple-400" />Education
            </h3>
            <p className="text-white font-medium text-sm">{analysis.education.highestDegree}</p>
            {analysis.education.institution && <p className="text-slate-400 text-xs mt-1">{analysis.education.institution}</p>}
            {analysis.education.graduationYear && <p className="text-slate-500 text-xs mt-0.5">{analysis.education.graduationYear}</p>}
          </div>
        )}
        {analysis?.languagesSpoken?.length > 0 && (
          <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-6">
            <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
              <Globe className="w-4 h-4 text-blue-400" />Languages
            </h3>
            <div className="flex flex-wrap gap-2">
              {analysis.languagesSpoken.map((lang: string) => (
                <span key={lang} className="px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-xs text-blue-300">{lang}</span>
              ))}
            </div>
          </div>
        )}
        {analysis?.salaryExpectation && (
          <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-6">
            <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />Est. Salary Range
            </h3>
            <p className="text-emerald-400 font-semibold text-sm">{analysis.salaryExpectation}</p>
            <p className="text-slate-500 text-xs mt-1">Based on experience level</p>
          </div>
        )}
      </div>

      {/* Interview Recommendation */}
      {analysis?.interviewRecommendation && (
        <div className="rounded-3xl border border-purple-500/20 bg-purple-500/5 p-8">
          <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
            <Zap className="w-5 h-5 text-purple-400" />Interview Recommendation
          </h3>
          <p className="text-slate-300 text-sm leading-relaxed">{analysis.interviewRecommendation}</p>
        </div>
      )}

      {/* ── EMAIL SECTION ── */}
      <div id="email" ref={emailSectionRef} className="rounded-3xl border border-blue-500/20 bg-blue-500/5 p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
            <Mail className="w-5 h-5 text-blue-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-white">Send Email</h3>
            <p className="text-slate-400 text-xs mt-0.5">
              {hasEmail
                ? `AI writes a personalized email to ${candidate.candidateEmail}`
                : "No email address on file for this candidate"}
            </p>
          </div>
          {!replyToEmail && hasEmail && (
            <Link
              href="/recruiter/settings"
              className="text-xs text-amber-400 hover:text-amber-300 transition flex items-center gap-1"
            >
              <Info className="w-3.5 h-3.5" />
              Set reply-to in Settings
            </Link>
          )}
        </div>

        {!hasEmail ? (
          <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-center">
            <p className="text-slate-400 text-sm">This candidate doesn't have an email address on file.</p>
          </div>
        ) : emailSent ? (
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-6 text-center">
            <CheckCircle className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
            <p className="text-white font-semibold">Email Sent Successfully!</p>
            <p className="text-slate-400 text-sm mt-1">
              Your {selectedType?.label.toLowerCase()} email was delivered to {candidate.candidateEmail}
            </p>
            {replyToEmail && (
              <p className="text-slate-500 text-xs mt-1">Replies will go to {replyToEmail}</p>
            )}
            <button
              onClick={() => {
                setEmailSent(false);
                setSelectedEmailType(null);
                setEmailSubject("");
                setEmailMessage("");
                setAttachmentFile(null);
              }}
              className="mt-4 px-4 py-2 rounded-xl border border-white/10 bg-white/5 text-sm text-white hover:bg-white/10 transition"
            >
              Send Another Email
            </button>
          </div>
        ) : (
          <div className="space-y-5">

            <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4 flex items-start gap-3">
              <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
              <div className="text-xs text-slate-400 space-y-1">
                <p>Emails are sent from <span className="text-white font-medium">hire@tomparo.com</span> with your company name</p>
                {replyToEmail
                  ? <p>Candidate replies go directly to <span className="text-emerald-400">{replyToEmail}</span></p>
                  : <p>Set your reply-to email in <Link href="/recruiter/settings" className="text-blue-400 underline">Settings</Link> so candidates can reply to you directly</p>
                }
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-white uppercase tracking-wider mb-3">
                1. Choose Email Type
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {emailTypes.map((type) => (
                  <button
                    key={type.value}
                    onClick={() => handleSelectEmailType(type.value)}
                    className={`flex items-start gap-3 p-4 rounded-xl border text-left transition ${
                      selectedEmailType === type.value
                        ? `${type.bg} ${type.border} border`
                        : "border-white/10 bg-white/[0.02] hover:border-white/20"
                    }`}
                  >
                    <span className="text-xl shrink-0">{type.icon}</span>
                    <div>
                      <p className={`text-sm font-semibold ${selectedEmailType === type.value ? type.color : "text-white"}`}>
                        {type.label}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">{type.description}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {selectedEmailType === "interview_invite" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-2">
                    Interview Date & Time <span className="text-slate-600">(optional)</span>
                  </label>
                  <input
                    type="text"
                    value={interviewDate}
                    onChange={(e) => setInterviewDate(e.target.value)}
                    placeholder="e.g. Monday 14 July 2026, 10:00 AM"
                    className="w-full rounded-xl border border-white/10 bg-slate-900/50 px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-2">
                    Interview Format <span className="text-slate-600">(optional)</span>
                  </label>
                  <input
                    type="text"
                    value={interviewType}
                    onChange={(e) => setInterviewType(e.target.value)}
                    placeholder="e.g. Video call via Google Meet"
                    className="w-full rounded-xl border border-white/10 bg-slate-900/50 px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition"
                  />
                </div>
              </div>
            )}

            {selectedEmailType === "offer" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-2">
                    Salary Offer <span className="text-slate-600">(optional)</span>
                  </label>
                  <input
                    type="text"
                    value={salary}
                    onChange={(e) => setSalary(e.target.value)}
                    placeholder="e.g. ₦350,000/month"
                    className="w-full rounded-xl border border-white/10 bg-slate-900/50 px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-2">
                    Start Date <span className="text-slate-600">(optional)</span>
                  </label>
                  <input
                    type="text"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    placeholder="e.g. 1 August 2026"
                    className="w-full rounded-xl border border-white/10 bg-slate-900/50 px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 transition"
                  />
                </div>
              </div>
            )}

            {selectedEmailType && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-white uppercase tracking-wider">
                    2. Write Email
                  </p>
                  <button
                    onClick={handleGenerateEmail}
                    disabled={emailGenerating}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs font-semibold hover:opacity-90 transition disabled:opacity-50"
                  >
                    {emailGenerating ? (
                      <><Loader2 className="w-3.5 h-3.5 animate-spin" />Writing...</>
                    ) : (
                      <><Wand2 className="w-3.5 h-3.5" />Write with AI</>
                    )}
                  </button>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-2">Subject</label>
                  <input
                    type="text"
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                    placeholder="Email subject line..."
                    className="w-full rounded-xl border border-white/10 bg-slate-900/50 px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-2">Message</label>
                  <textarea
                    value={emailMessage}
                    onChange={(e) => setEmailMessage(e.target.value)}
                    placeholder="Write your message or click 'Write with AI'..."
                    rows={8}
                    className="w-full rounded-xl border border-white/10 bg-slate-900/50 px-4 py-3 text-sm text-white placeholder-slate-500 outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 resize-none transition"
                  />
                  <p className="text-xs text-slate-600 mt-1">
                    Greeting (Dear {candidate.candidateName || "Candidate"}) and sign-off are added automatically
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-2">
                    Attach Document <span className="text-slate-600">(optional — PDF, DOC, DOCX)</span>
                  </label>
                  <div className="flex items-center gap-3">
                    <label className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/10 bg-white/5 text-sm text-slate-300 hover:bg-white/10 transition cursor-pointer">
                      <Paperclip className="w-4 h-4" />
                      {attachmentFile ? attachmentFile.name : "Choose file"}
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx"
                        className="hidden"
                        onChange={(e) => setAttachmentFile(e.target.files?.[0] || null)}
                      />
                    </label>
                    {attachmentFile && (
                      <button
                        onClick={() => setAttachmentFile(null)}
                        className="text-xs text-red-400 hover:text-red-300 transition"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 rounded-xl border border-white/10 bg-white/[0.02]">
                  <input
                    type="checkbox"
                    id="ccSelf"
                    checked={ccSelf}
                    onChange={(e) => setCcSelf(e.target.checked)}
                    className="w-4 h-4 rounded accent-purple-500"
                  />
                  <label htmlFor="ccSelf" className="text-sm text-slate-300 cursor-pointer flex-1">
                    Send me a copy of this email
                  </label>
                  {!replyToEmail && (
                    <span className="text-xs text-amber-400">
                      Requires reply-to email in{" "}
                      <Link href="/recruiter/settings" className="underline hover:text-amber-300">Settings</Link>
                    </span>
                  )}
                </div>

                <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4 space-y-1.5 text-xs text-slate-400">
                  <p>📤 Sent from: <span className="text-white">hire@tomparo.com</span></p>
                  <p>📬 Delivered to: <span className="text-white">{candidate.candidateEmail}</span></p>
                  {replyToEmail && <p>↩️ Replies go to: <span className="text-emerald-400">{replyToEmail}</span></p>}
                  {ccSelf && replyToEmail && <p>📋 CC copy to: <span className="text-blue-400">{replyToEmail}</span></p>}
                  {attachmentFile && <p>📎 Attachment: <span className="text-white">{attachmentFile.name}</span></p>}
                </div>

                <div className="flex items-center justify-end pt-2">
                  <button
                    onClick={handleSendEmail}
                    disabled={emailSending || !emailMessage.trim() || !emailSubject.trim()}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-500 transition disabled:opacity-50"
                  >
                    {emailSending ? (
                      <><Loader2 className="w-4 h-4 animate-spin" />Sending...</>
                    ) : (
                      <><Send className="w-4 h-4" />Send Email</>
                    )}
                  </button>
                </div>
              </div>
            )}

            {!selectedEmailType && (
              <p className="text-xs text-slate-500 text-center py-4">
                Select an email type above to get started
              </p>
            )}
          </div>
        )}
      </div>

      {/* ── EMAIL HISTORY ── */}
      {emailHistory.length > 0 && (
        <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-8">
          <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
            <Mail className="w-5 h-5 text-slate-400" />
            Email History
            <span className="ml-auto text-xs text-slate-500">{emailHistory.length} sent</span>
          </h3>
          <div className="space-y-3">
            {emailHistory.map((email: any) => {
              const typeConf = emailTypes.find((t) => t.value === email.type);
              return (
                <div key={email.id} className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <span className="text-lg shrink-0">{typeConf?.icon || "✉️"}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">{email.subject}</p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          To: {email.to} ·{" "}
                          {new Date(email.createdAt).toLocaleDateString("en-NG", {
                            day: "numeric", month: "short", year: "numeric",
                            hour: "2-digit", minute: "2-digit",
                          })}
                        </p>
                        {email.ccSelf && (
                          <p className="text-xs text-blue-400 mt-0.5">CC copy sent to you</p>
                        )}
                        {/* ── Open tracking info ── */}
                        {email.openCount > 0 && (
                          <p className="text-xs text-emerald-400 mt-0.5 flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" />
                            Opened {email.openCount} time{email.openCount !== 1 ? "s" : ""}
                            {email.openedAt && (
                              <span className="text-slate-500">
                                · Last {new Date(email.openedAt).toLocaleDateString("en-NG", {
                                  day: "numeric", month: "short",
                                  hour: "2-digit", minute: "2-digit",
                                })}
                              </span>
                            )}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* ── Status badge with opened state ── */}
                    <span className={`shrink-0 px-2 py-0.5 rounded-full text-xs font-medium ${
                      email.status === "opened"
                        ? "bg-emerald-500/10 text-emerald-400"
                        : email.status === "sent"
                        ? "bg-blue-500/10 text-blue-400"
                        : "bg-red-500/10 text-red-400"
                    }`}>
                      {email.status === "opened"
                        ? "✅ Opened"
                        : email.status === "sent"
                        ? "Sent"
                        : "Failed"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Notes */}
      <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-8">
        <h3 className="text-lg font-semibold text-white mb-4">Recruiter Notes</h3>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Add private notes about this candidate..."
          rows={4}
          className="w-full rounded-xl border border-white/10 bg-slate-900/50 px-4 py-3 text-white placeholder-slate-500 outline-none transition focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 resize-none text-sm"
        />
        <button
          onClick={handleSaveNotes}
          disabled={savingNotes}
          className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 text-white text-sm font-medium hover:bg-purple-500 transition disabled:opacity-50"
        >
          {savingNotes ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
          Save Notes
        </button>
      </div>

      {/* CV Quality */}
      {analysis?.cvQuality && (
        <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-6">
          <h3 className="text-sm font-semibold text-white mb-4">CV Quality</h3>
          <div className="grid grid-cols-3 gap-4 text-center">
            {[
              { label: "Formatting", value: analysis.cvQuality.formatting },
              { label: "Completeness", value: analysis.cvQuality.completeness },
              { label: "Clarity", value: analysis.cvQuality.clarity },
            ].map((q) => (
              <div key={q.label} className="rounded-xl bg-white/[0.02] p-3">
                <p className="text-white font-semibold text-sm">{q.value}</p>
                <p className="text-slate-500 text-xs mt-0.5">{q.label}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}