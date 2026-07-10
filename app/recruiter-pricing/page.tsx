"use client";

import { useSession } from "next-auth/react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  Check, X, Zap, Building2, Rocket, Star, Crown, Infinity,
  ArrowRight, FileText, Brain, Mail, BarChart3, Shield,
  Mic, Video, Bot, ChevronDown, Eye, Pause, FileSignature, Users,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

type FeatureValue = boolean | string | number;

interface Plan {
  id: string;
  name: string;
  price: number;
  icon: React.ElementType;
  color: string;
  border: string;
  glow: string;
  accentColor: string;
  cvs: number;
  jobs: number | string;
  seats: number;
  popular: boolean;
  badge?: string;
  description: string;
  tagline: string;
  heroFeature: string;
  features: {
    category: string;
    items: { label: string; included: FeatureValue }[];
  }[];
}

// ── Yearly price helper (15% discount) ───────────────────────────────────────
const yearlyPrice = (monthly: number) => Math.round(monthly * 12 * 0.85);

// ── Plans ─────────────────────────────────────────────────────────────────────

const plans: Plan[] = [
  {
    id: "RECRUITER_STARTER",
    name: "Starter",
    price: 5000,
    icon: Zap,
    color: "from-blue-500 to-cyan-500",
    border: "border-blue-500/30",
    glow: "shadow-blue-500/20",
    accentColor: "#3b82f6",
    cvs: 20,
    jobs: 3,
    seats: 1,
    popular: false,
    description: "For solo recruiters just getting started",
    tagline: "Screen faster, hire smarter",
    heroFeature: "AI CV Analysis",
    features: [
      {
        category: "CV & Candidates",
        items: [
          { label: "CVs per month", included: "20" },
          { label: "Individual CV upload", included: true },
          { label: "AI CV analysis", included: true },
          { label: "AI candidate summary", included: true },
          { label: "AI candidate ranking", included: true },
          { label: "Candidate status tracking", included: true },
          { label: "Bulk ZIP upload", included: false },
          { label: "Duplicate CV detection", included: false },
          { label: "Red flag detection", included: false },
          { label: "Culture fit score", included: false },
        ],
      },
      {
        category: "Jobs & Pipeline",
        items: [
          { label: "Active job postings", included: "3" },
          { label: "Hiring pipeline (Kanban)", included: false },
          { label: "Notes & ratings", included: false },
          { label: "Featured job badge", included: false },
          { label: "Verified employer badge", included: false },
        ],
      },
      {
        category: "AI Emails",
        items: [
          { label: "AI rejection letter", included: false },
          { label: "AI interview invite email", included: false },
          { label: "AI hiring offer email", included: false },
          { label: "AI follow-up & waitlist email", included: false },
          { label: "Bulk email sending", included: false },
          { label: "Email open tracking", included: false },
        ],
      },
      {
        category: "AI Interviews",
        items: [
          { label: "Text interview", included: false },
          { label: "Voice interview", included: false },
          { label: "Video interview", included: false },
          { label: "AI generates questions", included: false },
          { label: "Per-answer AI scoring", included: false },
          { label: "Interview summary", included: false },
          { label: "Interview recording", included: false },
          { label: "Shareable interview link", included: false },
        ],
      },
      {
        category: "AI Autopilot",
        items: [
          { label: "AI hire recommendation", included: false },
          { label: "Watch live pipeline", included: false },
          { label: "Full autopilot mode", included: false },
          { label: "Pause / resume any stage", included: false },
        ],
      },
      {
        category: "AI Documents",
        items: [
          { label: "AI employment letter (PDF + DOCX)", included: false },
          { label: "AI offer letter (PDF + DOCX)", included: false },
          { label: "AI NDA generation", included: false },
          { label: "White-label documents", included: false },
        ],
      },
      {
        category: "Team & Analytics",
        items: [
          { label: "Team seats", included: "1" },
          { label: "Analytics dashboard", included: false },
          { label: "Role-based access", included: false },
          { label: "Activity log", included: false },
          { label: "API access", included: false },
        ],
      },
    ],
  },
  {
    id: "RECRUITER_GROWTH",
    name: "Growth",
    price: 10000,
    icon: Rocket,
    color: "from-purple-500 to-pink-500",
    border: "border-purple-500/30",
    glow: "shadow-purple-500/20",
    accentColor: "#a855f7",
    cvs: 50,
    jobs: 10,
    seats: 2,
    popular: true,
    badge: "MOST POPULAR",
    description: "For growing teams that hire consistently",
    tagline: "Manage your entire candidate flow",
    heroFeature: "AI Emails + Pipeline",
    features: [
      {
        category: "CV & Candidates",
        items: [
          { label: "CVs per month", included: "50" },
          { label: "Individual CV upload", included: true },
          { label: "AI CV analysis", included: true },
          { label: "AI candidate summary", included: true },
          { label: "AI candidate ranking", included: true },
          { label: "Candidate status tracking", included: true },
          { label: "Bulk ZIP upload", included: true },
          { label: "Duplicate CV detection", included: true },
          { label: "Red flag detection", included: true },
          { label: "Culture fit score", included: false },
        ],
      },
      {
        category: "Jobs & Pipeline",
        items: [
          { label: "Active job postings", included: "10" },
          { label: "Hiring pipeline (Kanban)", included: true },
          { label: "Notes & ratings", included: true },
          { label: "Featured job badge", included: false },
          { label: "Verified employer badge", included: false },
        ],
      },
      {
        category: "AI Emails",
        items: [
          { label: "AI rejection letter", included: true },
          { label: "AI interview invite email", included: true },
          { label: "AI hiring offer email", included: true },
          { label: "AI follow-up & waitlist email", included: true },
          { label: "Bulk email sending", included: false },
          { label: "Email open tracking", included: false },
        ],
      },
      {
        category: "AI Interviews",
        items: [
          { label: "Text interview", included: false },
          { label: "Voice interview", included: false },
          { label: "Video interview", included: false },
          { label: "AI generates questions", included: false },
          { label: "Per-answer AI scoring", included: false },
          { label: "Interview summary", included: false },
          { label: "Interview recording", included: false },
          { label: "Shareable interview link", included: false },
        ],
      },
      {
        category: "AI Autopilot",
        items: [
          { label: "AI hire recommendation", included: false },
          { label: "Watch live pipeline", included: false },
          { label: "Full autopilot mode", included: false },
          { label: "Pause / resume any stage", included: false },
        ],
      },
      {
        category: "AI Documents",
        items: [
          { label: "AI employment letter (PDF + DOCX)", included: false },
          { label: "AI offer letter (PDF + DOCX)", included: false },
          { label: "AI NDA generation", included: false },
          { label: "White-label documents", included: false },
        ],
      },
      {
        category: "Team & Analytics",
        items: [
          { label: "Team seats", included: "2" },
          { label: "Analytics dashboard", included: false },
          { label: "Role-based access", included: false },
          { label: "Activity log", included: false },
          { label: "API access", included: false },
        ],
      },
    ],
  },
  {
    id: "RECRUITER_BUSINESS",
    name: "Business",
    price: 30000,
    icon: Building2,
    color: "from-amber-500 to-orange-500",
    border: "border-amber-500/30",
    glow: "shadow-amber-500/20",
    accentColor: "#f59e0b",
    cvs: 200,
    jobs: 30,
    seats: 5,
    popular: false,
    description: "For high-volume teams that interview at scale",
    tagline: "Let AI interview for you",
    heroFeature: "AI Interviews (Text + Voice + Video)",
    features: [
      {
        category: "CV & Candidates",
        items: [
          { label: "CVs per month", included: "200" },
          { label: "Individual CV upload", included: true },
          { label: "AI CV analysis", included: true },
          { label: "AI candidate summary", included: true },
          { label: "AI candidate ranking", included: true },
          { label: "Candidate status tracking", included: true },
          { label: "Bulk ZIP upload", included: true },
          { label: "Duplicate CV detection", included: true },
          { label: "Red flag detection", included: true },
          { label: "Culture fit score", included: false },
        ],
      },
      {
        category: "Jobs & Pipeline",
        items: [
          { label: "Active job postings", included: "30" },
          { label: "Hiring pipeline (Kanban)", included: true },
          { label: "Notes & ratings", included: true },
          { label: "Featured job badge", included: false },
          { label: "Verified employer badge", included: true },
        ],
      },
      {
        category: "AI Emails",
        items: [
          { label: "AI rejection letter", included: true },
          { label: "AI interview invite email", included: true },
          { label: "AI hiring offer email", included: true },
          { label: "AI follow-up & waitlist email", included: true },
          { label: "Bulk email sending", included: true },
          { label: "Email open tracking", included: true },
        ],
      },
      {
        category: "AI Interviews",
        items: [
          { label: "Text interview", included: true },
          { label: "Voice interview", included: true },
          { label: "Video interview", included: true },
          { label: "AI generates questions", included: true },
          { label: "Custom question bank", included: true },
          { label: "Per-answer AI scoring", included: true },
          { label: "Interview summary", included: true },
          { label: "Interview recording (audio + video)", included: true },
          { label: "Shareable interview link", included: true },
          { label: "Recruiter approval flow", included: true },
          { label: "Company branding on video", included: false },
        ],
      },
      {
        category: "AI Autopilot",
        items: [
          { label: "AI hire recommendation", included: true },
          { label: "Watch live pipeline", included: true },
          { label: "Full autopilot mode", included: false },
          { label: "Pause / resume any stage", included: false },
        ],
      },
      {
        category: "AI Documents",
        items: [
          { label: "AI employment letter (PDF + DOCX)", included: true },
          { label: "AI offer letter (PDF + DOCX)", included: true },
          { label: "AI welcome email", included: true },
          { label: "AI NDA generation", included: false },
          { label: "White-label documents", included: false },
        ],
      },
      {
        category: "Team & Analytics",
        items: [
          { label: "Team seats", included: "5" },
          { label: "Analytics dashboard", included: true },
          { label: "Time-to-hire tracking", included: true },
          { label: "Full audit trail", included: true },
          { label: "Role-based access", included: true },
          { label: "Activity log", included: false },
          { label: "API access", included: false },
        ],
      },
    ],
  },
  {
    id: "RECRUITER_ENTERPRISE",
    name: "Enterprise",
    price: 80000,
    icon: Star,
    color: "from-emerald-500 to-teal-500",
    border: "border-emerald-500/30",
    glow: "shadow-emerald-500/20",
    accentColor: "#10b981",
    cvs: 500,
    jobs: "Unlimited + Featured",
    seats: 10,
    popular: false,
    badge: "FULL AUTOPILOT",
    description: "For large companies with serious hiring needs",
    tagline: "Set it. Watch it. Hire.",
    heroFeature: "Full AI Autopilot",
    features: [
      {
        category: "CV & Candidates",
        items: [
          { label: "CVs per month", included: "500" },
          { label: "Individual CV upload", included: true },
          { label: "AI CV analysis", included: true },
          { label: "AI candidate summary", included: true },
          { label: "AI candidate ranking", included: true },
          { label: "Candidate status tracking", included: true },
          { label: "Bulk ZIP upload", included: true },
          { label: "Duplicate CV detection", included: true },
          { label: "Red flag detection", included: true },
          { label: "Culture fit score", included: true },
        ],
      },
      {
        category: "Jobs & Pipeline",
        items: [
          { label: "Active job postings", included: "Unlimited + Featured" },
          { label: "Hiring pipeline (Kanban)", included: true },
          { label: "Notes & ratings", included: true },
          { label: "Featured job badge", included: true },
          { label: "Verified employer badge", included: true },
        ],
      },
      {
        category: "AI Emails",
        items: [
          { label: "AI rejection letter", included: true },
          { label: "AI interview invite email", included: true },
          { label: "AI hiring offer email", included: true },
          { label: "AI follow-up & waitlist email", included: true },
          { label: "Bulk email sending", included: true },
          { label: "Email open tracking", included: true },
        ],
      },
      {
        category: "AI Interviews",
        items: [
          { label: "Text interview", included: true },
          { label: "Voice interview", included: true },
          { label: "Video interview", included: true },
          { label: "AI generates questions", included: true },
          { label: "Custom question bank", included: true },
          { label: "Per-answer AI scoring", included: true },
          { label: "Interview summary", included: true },
          { label: "Interview recording (audio + video)", included: true },
          { label: "Shareable interview link", included: true },
          { label: "Recruiter approval flow", included: true },
          { label: "Company branding on video", included: true },
        ],
      },
      {
        category: "AI Autopilot",
        items: [
          { label: "AI hire recommendation", included: true },
          { label: "Watch live pipeline", included: true },
          { label: "Full autopilot mode", included: true },
          { label: "Pause / resume any stage", included: true },
          { label: "Simultaneous autopilots", included: "10" },
        ],
      },
      {
        category: "AI Documents",
        items: [
          { label: "AI employment letter (PDF + DOCX)", included: true },
          { label: "AI offer letter (PDF + DOCX)", included: true },
          { label: "AI welcome email", included: true },
          { label: "AI NDA generation", included: true },
          { label: "AI probation notice", included: true },
          { label: "White-label documents", included: false },
        ],
      },
      {
        category: "Team & Analytics",
        items: [
          { label: "Team seats", included: "10" },
          { label: "Analytics dashboard", included: true },
          { label: "Time-to-hire tracking", included: true },
          { label: "Conversion funnel", included: true },
          { label: "Full audit trail", included: true },
          { label: "Role-based access", included: true },
          { label: "Activity log", included: true },
          { label: "Dedicated account manager", included: true },
          { label: "API access", included: false },
        ],
      },
    ],
  },
  {
    id: "RECRUITER_SCALE",
    name: "Scale",
    price: 150000,
    icon: Crown,
    color: "from-rose-500 to-red-500",
    border: "border-rose-500/30",
    glow: "shadow-rose-500/20",
    accentColor: "#f43f5e",
    cvs: 1000,
    jobs: "Unlimited + Priority",
    seats: 25,
    popular: false,
    description: "For recruitment agencies and large enterprises",
    tagline: "Built for agencies",
    heroFeature: "Unlimited Everything + API",
    features: [
      {
        category: "CV & Candidates",
        items: [
          { label: "CVs per month", included: "1,000" },
          { label: "Individual CV upload", included: true },
          { label: "AI CV analysis", included: true },
          { label: "AI candidate summary", included: true },
          { label: "AI candidate ranking", included: true },
          { label: "Candidate status tracking", included: true },
          { label: "Bulk ZIP upload", included: true },
          { label: "Duplicate CV detection", included: true },
          { label: "Red flag detection", included: true },
          { label: "Culture fit score", included: true },
        ],
      },
      {
        category: "Jobs & Pipeline",
        items: [
          { label: "Active job postings", included: "Unlimited + Priority" },
          { label: "Hiring pipeline (Kanban)", included: true },
          { label: "Notes & ratings", included: true },
          { label: "Featured job badge", included: true },
          { label: "Verified employer badge", included: true },
        ],
      },
      {
        category: "AI Emails",
        items: [
          { label: "AI rejection letter", included: true },
          { label: "AI interview invite email", included: true },
          { label: "AI hiring offer email", included: true },
          { label: "AI follow-up & waitlist email", included: true },
          { label: "Bulk email sending", included: true },
          { label: "Email open tracking", included: true },
        ],
      },
      {
        category: "AI Interviews",
        items: [
          { label: "Text interview", included: true },
          { label: "Voice interview", included: true },
          { label: "Video interview", included: true },
          { label: "AI generates questions", included: true },
          { label: "Custom question bank", included: true },
          { label: "Per-answer AI scoring", included: true },
          { label: "Interview summary", included: true },
          { label: "Interview recording (audio + video)", included: true },
          { label: "Shareable interview link", included: true },
          { label: "Recruiter approval flow", included: true },
          { label: "Company branding on video", included: true },
        ],
      },
      {
        category: "AI Autopilot",
        items: [
          { label: "AI hire recommendation", included: true },
          { label: "Watch live pipeline", included: true },
          { label: "Full autopilot mode", included: true },
          { label: "Pause / resume any stage", included: true },
          { label: "Simultaneous autopilots", included: "Unlimited" },
        ],
      },
      {
        category: "AI Documents",
        items: [
          { label: "AI employment letter (PDF + DOCX)", included: true },
          { label: "AI offer letter (PDF + DOCX)", included: true },
          { label: "AI welcome email", included: true },
          { label: "AI NDA generation", included: true },
          { label: "AI probation notice", included: true },
          { label: "White-label documents", included: true },
        ],
      },
      {
        category: "Team & Analytics",
        items: [
          { label: "Team seats", included: "25" },
          { label: "Analytics dashboard", included: true },
          { label: "Time-to-hire tracking", included: true },
          { label: "Conversion funnel", included: true },
          { label: "Full audit trail", included: true },
          { label: "Role-based access", included: true },
          { label: "Activity log", included: true },
          { label: "Dedicated account manager", included: true },
          { label: "SLA guarantee", included: true },
          { label: "API access", included: true },
        ],
      },
    ],
  },
];

// ── FAQ Data ───────────────────────────────────────────────────────────────────

const faqs = [
  {
    q: "Can I switch plans anytime?",
    a: "Yes. Upgrade or downgrade at any time. Changes take effect on your next billing cycle.",
  },
  {
    q: "What counts as a CV analysis?",
    a: "Each CV you upload and run through AI counts as one analysis. Viewing a previously analysed CV does not count.",
  },
  {
    q: "How does the AI Autopilot work?",
    a: "You give the AI a hiring brief. It posts the job, screens CVs, schedules and conducts interviews, then recommends the best candidate. You watch the entire process and can pause or override any stage at any time.",
  },
  {
    q: "What happens in AI video interviews?",
    a: "Candidates access a branded interview room with your company logo. The AI asks questions via voice, the candidate responds on camera, and the full session is recorded. You review the recording, transcript, and AI scores afterwards.",
  },
  {
    q: "Does AI send documents automatically?",
    a: "Only in full autopilot mode. Otherwise, AI generates the employment letter, offer letter, and NDA for your review. You approve before anything is sent. Candidates receive PDF. You receive both PDF and editable DOCX.",
  },
  {
    q: "What payment methods do you accept?",
    a: "All Nigerian cards (Verve, Mastercard, Visa) and bank transfers via Paystack.",
  },
  {
    q: "Is there a free trial?",
    a: "No free trial, but our Starter plan at ₦5,000/mo is low-risk and gives you a real feel for the platform before committing to higher tiers.",
  },
  {
    q: "Do you offer refunds?",
    a: "We have a no-refund policy. The Starter plan is designed to be your trial before committing to higher tiers.",
  },
];

// ── Category Icons ─────────────────────────────────────────────────────────────

const categoryIcons: Record<string, React.ElementType> = {
  "CV & Candidates": FileText,
  "Jobs & Pipeline": Rocket,
  "AI Emails": Mail,
  "AI Interviews": Mic,
  "AI Autopilot": Bot,
  "AI Documents": FileSignature,
  "Team & Analytics": BarChart3,
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function RecruiterPricingPage() {
  const { data: session } = useSession();
  const isLoggedIn = !!session?.user;

  const [billing, setBilling] = useState<"monthly" | "yearly">("monthly");
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
    }).format(price);

  const getDisplayPrice = (monthly: number) =>
    billing === "yearly" ? Math.round(yearlyPrice(monthly) / 12) : monthly;

  const getPlanHref = (planId: string) => {
    if (isLoggedIn) return `/recruiter?plan=${planId}`;
    return `/signup?type=recruiter&plan=${planId}`;
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">

      {/* ── Hero ── */}
      <section className="relative pt-24 pb-16 px-4 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-purple-600/10 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-5xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-sm font-medium mb-6">
              <Building2 className="w-4 h-4" />
              For Recruiters & Employers
            </span>

            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
              Hire Smarter with{" "}
              <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                AI-Powered
              </span>{" "}
              Recruitment
            </h1>

            <p className="text-lg text-gray-400 max-w-2xl mx-auto mb-10">
              From CV screening to AI interviews to fully autonomous hiring —
              TomParo gives you the tools to hire faster, smarter, and with confidence.
            </p>

            <div className="flex flex-wrap justify-center gap-3 mb-10">
              {[
                { icon: Brain, label: "AI CV Ranking" },
                { icon: Mic, label: "Voice Interviews" },
                { icon: Video, label: "Video Interviews" },
                { icon: Bot, label: "Full Autopilot" },
                { icon: Eye, label: "Watch Live" },
                { icon: Pause, label: "Pause Anytime" },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm text-gray-300">
                  <Icon className="w-3.5 h-3.5 text-purple-400" />
                  {label}
                </div>
              ))}
            </div>

            <div className="flex flex-wrap justify-center gap-10">
              {[
                { value: "10x", label: "Faster screening" },
                { value: "7", label: "AI providers" },
                { value: "100%", label: "Nigerian payments" },
                { value: "0", label: "Per-post fees" },
              ].map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className="text-2xl font-bold text-white">{stat.value}</div>
                  <div className="text-sm text-gray-500">{stat.label}</div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── All-inclusive banner ── */}
      <section className="px-4 mb-4">
        <div className="max-w-5xl mx-auto">
          <div className="rounded-xl border border-purple-500/20 bg-purple-500/5 px-6 py-4 flex flex-col sm:flex-row items-center justify-center gap-2 text-center sm:text-left">
            <span className="text-purple-300 font-semibold">
              🎉 All plans are ALL-INCLUSIVE
            </span>
            <span className="text-gray-400 text-sm">
              — No per-post fees. No per-CV charges. No hidden costs. Ever.
            </span>
          </div>
        </div>
      </section>

      {/* ── Billing Toggle ── */}
      <section className="px-4 mb-8">
        <div className="max-w-5xl mx-auto flex justify-center">
          <div className="inline-flex items-center gap-1 rounded-2xl border border-white/10 bg-white/[0.03] p-1">
            <button
              onClick={() => setBilling("monthly")}
              className={`px-6 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                billing === "monthly"
                  ? "bg-purple-600 text-white shadow-lg shadow-purple-700/25"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBilling("yearly")}
              className={`px-6 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${
                billing === "yearly"
                  ? "bg-purple-600 text-white shadow-lg shadow-purple-700/25"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Yearly
              <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                billing === "yearly"
                  ? "bg-white/20 text-white"
                  : "bg-emerald-500/20 text-emerald-400"
              }`}>
                Save 15%
              </span>
            </button>
          </div>
        </div>

        {billing === "yearly" && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-5xl mx-auto mt-4"
          >
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-6 py-3 text-center">
              <p className="text-emerald-400 text-sm font-medium">
                🎉 Billed annually — 15% off every plan
              </p>
              <p className="text-slate-500 text-xs mt-1">
                Switch back to monthly anytime
              </p>
            </div>
          </motion.div>
        )}
      </section>

      {/* ── Pricing Cards ── */}
      <section className="py-12 px-4">
        <div className="max-w-7xl mx-auto">

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {plans.slice(0, 3).map((plan, i) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                index={i}
                formatPrice={formatPrice}
                getDisplayPrice={getDisplayPrice}
                billing={billing}
                selected={selectedPlan === plan.id}
                onSelect={setSelectedPlan}
                planHref={getPlanHref(plan.id)}
              />
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.slice(3, 5).map((plan, i) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                index={i + 3}
                formatPrice={formatPrice}
                getDisplayPrice={getDisplayPrice}
                billing={billing}
                selected={selectedPlan === plan.id}
                onSelect={setSelectedPlan}
                planHref={getPlanHref(plan.id)}
              />
            ))}

            {/* Custom Plan */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.5 }}
              className="relative rounded-2xl border border-white/10 bg-white/[0.02] p-8 flex flex-col justify-between"
            >
              <div>
                <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center mb-4">
                  <Infinity className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white mb-1">Custom</h3>
                <p className="text-sm text-gray-400 mb-2">
                  For recruitment agencies with enterprise-scale needs
                </p>
                <p className="text-xs text-purple-400 font-medium mb-4">
                  Unlimited Everything
                </p>
                <div className="text-3xl font-bold text-white mb-6">
                  Let&apos;s Talk
                </div>
                <ul className="space-y-2.5 mb-8">
                  {[
                    "Unlimited CV analyses",
                    "Unlimited autopilots",
                    "Custom integrations",
                    "Dedicated infrastructure",
                    "Custom onboarding",
                    "SLA + legal agreements",
                    "White-label platform",
                  ].map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-gray-300">
                      <Check className="w-4 h-4 text-white mt-0.5 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
              <Link
                href="/contact"
                className="w-full py-3 rounded-xl border border-white/20 text-white font-semibold text-center hover:bg-white/5 transition-colors flex items-center justify-center gap-2"
              >
                Contact Sales
                <ArrowRight className="w-4 h-4" />
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Autopilot Highlight Section ── */}
      <section className="py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 to-teal-500/5 p-10"
          >
            <div className="flex flex-col md:flex-row items-start gap-8">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                    <Bot className="w-5 h-5 text-emerald-400" />
                  </div>
                  <span className="text-emerald-400 font-semibold text-sm uppercase tracking-wider">
                    Enterprise & Scale Only
                  </span>
                </div>
                <h2 className="text-3xl font-bold text-white mb-4">
                  AI Autopilot — Hire Without Lifting a Finger
                </h2>
                <p className="text-gray-400 mb-6 leading-relaxed">
                  Tell the AI what role you need to fill. It writes the job post, screens every CV,
                  schedules interviews, conducts them autonomously, recommends the best candidate,
                  sends rejection and offer emails, then delivers the employment letter and
                  documents — all while you watch.
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    "AI posts the job",
                    "AI screens all CVs",
                    "AI conducts interviews",
                    "AI recommends hire",
                    "AI sends all emails",
                    "AI generates documents",
                    "You watch live",
                    "Pause any stage",
                  ].map((item) => (
                    <div key={item} className="flex items-center gap-2 text-sm text-gray-300">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                      {item}
                    </div>
                  ))}
                </div>
              </div>

              <div className="w-full md:w-72 shrink-0">
                <div className="rounded-xl border border-white/10 bg-[#0a0a0f] p-4 space-y-2">
                  <p className="text-xs text-gray-500 font-medium mb-3 uppercase tracking-wider">
                    Live Autopilot
                  </p>
                  {[
                    { stage: "Job Posted", status: "done" },
                    { stage: "47 CVs Screened", status: "done" },
                    { stage: "8 Interviews Sent", status: "done" },
                    { stage: "Interviews Running", status: "active" },
                    { stage: "AI Recommendation", status: "waiting" },
                    { stage: "Send Emails", status: "waiting" },
                    { stage: "Send Documents", status: "waiting" },
                  ].map(({ stage, status }) => (
                    <div key={stage} className="flex items-center gap-3 p-2 rounded-lg bg-white/[0.02]">
                      <div className={`w-2 h-2 rounded-full shrink-0 ${
                        status === "done" ? "bg-emerald-400" : status === "active" ? "bg-amber-400 animate-pulse" : "bg-white/20"
                      }`} />
                      <span className={`text-xs ${
                        status === "done" ? "text-gray-400 line-through" : status === "active" ? "text-white font-medium" : "text-gray-600"
                      }`}>
                        {stage}
                      </span>
                      {status === "done" && <Check className="w-3 h-3 text-emerald-400 ml-auto" />}
                    </div>
                  ))}
                  <div className="pt-2 flex gap-2">
                    <button className="flex-1 py-1.5 rounded-lg bg-amber-500/20 text-amber-400 text-xs font-medium">⏸ Pause</button>
                    <button className="flex-1 py-1.5 rounded-lg bg-white/5 text-gray-400 text-xs font-medium">👁 Watch</button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Detailed Feature Breakdown Per Plan ── */}
      <section className="py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-white mb-3">Full Feature Breakdown</h2>
            <p className="text-gray-400">Click any plan to see exactly what you get</p>
          </motion.div>

          <div className="flex flex-wrap gap-2 justify-center mb-8">
            {plans.map((plan) => (
              <button
                key={plan.id}
                onClick={() => setSelectedPlan(selectedPlan === plan.id ? null : plan.id)}
                className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  selectedPlan === plan.id
                    ? `bg-gradient-to-r ${plan.color} text-white`
                    : "bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10"
                }`}
              >
                {plan.name}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {selectedPlan && (() => {
              const plan = plans.find((p) => p.id === selectedPlan)!;
              return (
                <motion.div
                  key={selectedPlan}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className={`rounded-2xl border ${plan.border} bg-white/[0.02] p-8`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-white/10">
                    <div>
                      <h3 className={`text-2xl font-bold bg-gradient-to-r ${plan.color} bg-clip-text text-transparent`}>
                        {plan.name} Plan
                      </h3>
                      <p className="text-gray-400 text-sm mt-1">{plan.description}</p>
                      <p className="text-sm font-medium mt-1" style={{ color: plan.accentColor }}>
                        ✦ {plan.heroFeature}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-3xl font-bold text-white">
                        {formatPrice(getDisplayPrice(plan.price))}
                      </div>
                      <div className="text-gray-500 text-sm">
                        /month{billing === "yearly" && <span className="text-emerald-400 ml-1 text-xs">(billed yearly)</span>}
                      </div>
                      {billing === "yearly" && (
                        <div className="text-xs text-emerald-400 mt-0.5">
                          Save {formatPrice(Math.round(plan.price * 12 * 0.15))}/yr
                        </div>
                      )}
                      <Link
                        href={getPlanHref(plan.id)}
                        className={`mt-3 inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r ${plan.color} text-white text-sm font-semibold hover:opacity-90 transition-opacity`}
                      >
                        Get Started
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {plan.features.map((category) => {
                      const CatIcon = categoryIcons[category.category] || Shield;
                      return (
                        <div key={category.category}>
                          <div className="flex items-center gap-2 mb-3">
                            <CatIcon className="w-4 h-4" style={{ color: plan.accentColor }} />
                            <h4 className="text-sm font-semibold text-white">{category.category}</h4>
                          </div>
                          <ul className="space-y-2">
                            {category.items.map((item) => (
                              <li key={item.label} className="flex items-center justify-between gap-3 text-sm">
                                <span className={item.included === false ? "text-gray-600" : "text-gray-300"}>
                                  {item.label}
                                </span>
                                <span className="shrink-0">
                                  {typeof item.included === "boolean" ? (
                                    item.included ? (
                                      <Check className="w-4 h-4" style={{ color: plan.accentColor }} />
                                    ) : (
                                      <X className="w-4 h-4 text-gray-700" />
                                    )
                                  ) : (
                                    <span className="text-xs font-semibold" style={{ color: plan.accentColor }}>
                                      {item.included}
                                    </span>
                                  )}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              );
            })()}
          </AnimatePresence>

          {!selectedPlan && (
            <div className="text-center py-12 text-gray-600 text-sm">
              👆 Select a plan above to see its full feature list
            </div>
          )}
        </div>
      </section>

      {/* ── Interview Types Section ── */}
      <section className="py-16 px-4 bg-white/[0.01]">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-white mb-3">3 Types of AI Interviews</h2>
            <p className="text-gray-400">Available on Business, Enterprise & Scale plans</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: FileText,
                color: "from-amber-500 to-orange-500",
                border: "border-amber-500/20",
                title: "Text Interview",
                plan: "Business+",
                description: "AI asks questions, candidate types answers. AI scores each response for relevance, depth, and clarity.",
                steps: [
                  "AI generates tailored questions from JD + CV",
                  "Candidate receives shareable link",
                  "Reads question → types answer",
                  "AI scores every answer in real-time",
                  "Full transcript + summary sent to recruiter",
                ],
              },
              {
                icon: Mic,
                color: "from-purple-500 to-pink-500",
                border: "border-purple-500/20",
                title: "Voice Interview",
                plan: "Business+",
                description: "AI speaks questions aloud. Candidate responds by voice. AI transcribes, scores, and records everything.",
                steps: [
                  "AI generates questions → speaks them aloud",
                  "Candidate responds by speaking",
                  "AI transcribes answers in real-time",
                  "Audio recorded and saved",
                  "Recruiter reviews transcript + recording + scores",
                ],
              },
              {
                icon: Video,
                color: "from-emerald-500 to-teal-500",
                border: "border-emerald-500/20",
                title: "Video Interview",
                plan: "Business+",
                description: "Candidate enters a branded video room. AI asks questions. Candidate is live on camera. Everything recorded.",
                steps: [
                  "Candidate enters branded video room (your logo)",
                  "AI avatar speaks questions on screen",
                  "Candidate answers live on camera",
                  "Full video session recorded",
                  "AI scores + transcript + full recording for recruiter",
                ],
              },
            ].map((type) => {
              const Icon = type.icon;
              return (
                <motion.div
                  key={type.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className={`rounded-2xl border ${type.border} bg-white/[0.02] p-6`}
                >
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${type.color} flex items-center justify-center mb-4`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-lg font-bold text-white">{type.title}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full bg-gradient-to-r ${type.color} text-white font-medium`}>
                      {type.plan}
                    </span>
                  </div>
                  <p className="text-gray-400 text-sm mb-4">{type.description}</p>
                  <ul className="space-y-2">
                    {type.steps.map((step, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-gray-400">
                        <span className={`w-4 h-4 rounded-full bg-gradient-to-br ${type.color} flex items-center justify-center text-white text-[10px] font-bold shrink-0 mt-0.5`}>
                          {i + 1}
                        </span>
                        {step}
                      </li>
                    ))}
                  </ul>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="py-16 px-4">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-white mb-3">Frequently Asked Questions</h2>
            <p className="text-gray-400">Everything recruiters want to know</p>
          </motion.div>

          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="rounded-xl border border-white/10 bg-white/[0.02] overflow-hidden"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full text-left px-6 py-4 flex items-center justify-between gap-4"
                >
                  <span className="text-white font-medium text-sm">{faq.q}</span>
                  <ChevronDown className={`w-4 h-4 text-gray-400 shrink-0 transition-transform duration-200 ${openFaq === i ? "rotate-180" : ""}`} />
                </button>
                <AnimatePresence>
                  {openFaq === i && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="px-6 pb-4 text-gray-400 text-sm leading-relaxed border-t border-white/5 pt-3">
                        {faq.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-20 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="rounded-2xl border border-purple-500/20 bg-gradient-to-b from-purple-500/10 to-transparent p-12"
          >
            <h2 className="text-3xl font-bold text-white mb-4">Ready to Hire Smarter?</h2>
            <p className="text-gray-400 mb-8 text-lg">
              Join Nigerian recruiters using TomParo to find and hire the best
              candidates — faster, cheaper, and smarter than ever.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href={isLoggedIn ? "/recruiter" : "/signup?type=recruiter"}
                className="px-8 py-4 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
              >
                {isLoggedIn ? "Go to Dashboard" : "Get Started"}
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/contact"
                className="px-8 py-4 rounded-xl border border-white/20 text-white font-semibold hover:bg-white/5 transition-colors"
              >
                Talk to Sales
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}

// ── Plan Card ─────────────────────────────────────────────────────────────────

function PlanCard({
  plan,
  index,
  formatPrice,
  getDisplayPrice,
  billing,
  selected,
  onSelect,
  planHref,
}: {
  plan: Plan;
  index: number;
  formatPrice: (p: number) => string;
  getDisplayPrice: (monthly: number) => number;
  billing: "monthly" | "yearly";
  selected: boolean;
  onSelect: (id: string) => void;
  planHref: string;
}) {
  const Icon = plan.icon;

  const previewFeatures = plan.features
    .flatMap((cat) => cat.items)
    .filter((item) => item.included !== false)
    .slice(0, 6);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.08 }}
      className={`relative rounded-2xl border ${plan.border} bg-white/[0.03] p-8 flex flex-col
        ${selected ? `shadow-xl ${plan.glow} ring-1 ring-white/20` : ""}
        ${plan.popular ? `shadow-lg ${plan.glow}` : ""}
      `}
    >
      {plan.badge && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className={`px-4 py-1 rounded-full bg-gradient-to-r ${plan.color} text-white text-xs font-bold whitespace-nowrap`}>
            {plan.badge}
          </span>
        </div>
      )}

      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${plan.color} flex items-center justify-center mb-4`}>
        <Icon className="w-6 h-6 text-white" />
      </div>

      <h3 className="text-xl font-bold text-white mb-0.5">{plan.name}</h3>
      <p className="text-xs font-semibold mb-1" style={{ color: plan.accentColor }}>{plan.tagline}</p>
      <p className="text-gray-400 text-sm mb-4">{plan.description}</p>

      {/* Price */}
      <div className="mb-0.5">
        <span className="text-4xl font-bold text-white">
          {formatPrice(getDisplayPrice(plan.price))}
        </span>
        <span className="text-gray-500 text-sm">/month</span>
      </div>
      {billing === "yearly" && (
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs text-slate-500 line-through">{formatPrice(plan.price)}/mo</span>
          <span className="text-xs text-emerald-400 font-semibold">
            Save {formatPrice(Math.round(plan.price * 12 * 0.15))}/yr
          </span>
        </div>
      )}
      {billing === "yearly" && (
        <p className="text-xs text-slate-600 mb-3">
          Billed {formatPrice(yearlyPrice(plan.price))} annually
        </p>
      )}

      {/* Limits */}
      <div className="flex flex-wrap gap-3 mb-6 mt-2">
        <div className="text-xs text-gray-400 bg-white/5 px-3 py-1 rounded-full">
          <span className="font-bold" style={{ color: plan.accentColor }}>{plan.cvs.toLocaleString()}</span> CVs/mo
        </div>
        <div className="text-xs text-gray-400 bg-white/5 px-3 py-1 rounded-full">
          <span className="font-bold" style={{ color: plan.accentColor }}>{plan.jobs}</span> jobs
        </div>
        <div className="text-xs text-gray-400 bg-white/5 px-3 py-1 rounded-full">
          <span className="font-bold" style={{ color: plan.accentColor }}>{plan.seats}</span> seat{plan.seats > 1 ? "s" : ""}
        </div>
      </div>

      {/* Preview features */}
      <ul className="space-y-2 mb-4 flex-1">
        {previewFeatures.map((f) => (
          <li key={f.label} className="flex items-start gap-2 text-sm text-gray-300">
            <Check className="w-4 h-4 mt-0.5 shrink-0" style={{ color: plan.accentColor }} />
            <span>
              {f.label}
              {typeof f.included === "string" && f.included !== "true" && (
                <span className="ml-1 font-semibold" style={{ color: plan.accentColor }}>({f.included})</span>
              )}
            </span>
          </li>
        ))}
      </ul>

      <button
        onClick={() => onSelect(plan.id)}
        className="text-xs text-gray-500 hover:text-gray-300 transition-colors mb-4 text-left flex items-center gap-1"
      >
        <ChevronDown className={`w-3 h-3 transition-transform ${selected ? "rotate-180" : ""}`} />
        {selected ? "Hide" : "See all"} features
      </button>

      <Link
        href={planHref}
        className={`w-full py-3 rounded-xl bg-gradient-to-r ${plan.color} text-white font-semibold text-center hover:opacity-90 transition-opacity`}
      >
        Get Started
      </Link>
    </motion.div>
  );
}