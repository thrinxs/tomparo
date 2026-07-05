import Link from "next/link";
import {
  ArrowRight,
  Brain,
  BriefcaseBusiness,
  CheckCircle2,
  Crown,
  FileText,
  Mail,
  MessageSquareText,
  Sparkles,
  Target,
  TrendingUp,
  Zap,
} from "lucide-react";

export default function LandingPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-950 text-white">
      {/* ==================== BACKGROUND GLOW ==================== */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute -left-32 -top-32 h-[500px] w-[500px] rounded-full bg-blue-600/15 blur-[120px]" />
        <div className="absolute -right-32 top-48 h-[400px] w-[400px] rounded-full bg-cyan-500/10 blur-[100px]" />
        <div className="absolute bottom-0 left-1/3 h-[500px] w-[500px] rounded-full bg-indigo-600/10 blur-[120px]" />
      </div>

      

      {/* ==================== HERO ==================== */}
      <section className="relative z-10 mx-auto grid max-w-6xl gap-16 px-6 pb-24 pt-20 lg:grid-cols-2 lg:items-center lg:pt-32 lg:pb-32">
        {/* Left — Copy */}
        <div className="max-w-xl">
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-4 py-2 text-sm text-blue-300">
            <Sparkles className="h-4 w-4" />
            AI-powered career intelligence
          </div>

          <h1 className="text-4xl font-semibold leading-[1.15] tracking-tight sm:text-5xl lg:text-6xl">
            Get hired{" "}
            <span className="bg-gradient-to-r from-blue-400 via-cyan-300 to-blue-600 bg-clip-text text-transparent">
              faster with AI
            </span>
          </h1>

          <p className="mt-6 max-w-lg text-base leading-7 text-slate-400 sm:text-lg sm:leading-8">
            TomParo analyzes your CV, matches you to jobs, generates tailored
            applications, identifies missing skills, and coaches you through
            interviews — all in one place.
          </p>

          <div className="mt-10 flex flex-col gap-4 sm:flex-row">
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-7 py-4 text-base font-medium text-white shadow-lg shadow-blue-700/25 transition hover:bg-blue-500"
            >
              Start for Free
              <ArrowRight className="h-5 w-5" />
            </Link>
            <a
              href="#pricing"
              className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-7 py-4 text-base font-medium text-slate-200 transition hover:bg-white/10"
            >
              View Pricing
            </a>
          </div>

          <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm text-slate-500">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              No credit card
            </span>
            <span className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              Free forever plan
            </span>
            <span className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              Premium from ₦5,000/mo
            </span>
          </div>
        </div>

        {/* Right — Dashboard Preview */}
        <div className="relative">
          <div className="rounded-[28px] border border-white/10 bg-white/5 p-4 shadow-2xl shadow-black/40 backdrop-blur-xl">
            <div className="rounded-[22px] border border-white/10 bg-slate-900/90 p-6">
              {/* Preview header */}
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-500">TomParo Dashboard</p>
                  <h3 className="mt-1 text-base font-semibold text-white">
                    Career Snapshot
                  </h3>
                </div>
                <span className="rounded-full border border-amber-400/20 bg-amber-400/10 px-3 py-1 text-xs font-medium text-amber-300">
                  Premium
                </span>
              </div>

              {/* Score cards */}
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-2xl border border-white/10 bg-slate-800/60 p-4">
                  <p className="text-xs text-slate-500">Resume Score</p>
                  <p className="mt-2 text-3xl font-bold text-white">87</p>
                  <div className="mt-3 h-1.5 rounded-full bg-slate-700">
                    <div className="h-1.5 w-[87%] rounded-full bg-blue-500" />
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-slate-800/60 p-4">
                  <p className="text-xs text-slate-500">Job Match</p>
                  <p className="mt-2 text-3xl font-bold text-white">74</p>
                  <div className="mt-3 h-1.5 rounded-full bg-slate-700">
                    <div className="h-1.5 w-[74%] rounded-full bg-cyan-400" />
                  </div>
                </div>

                {/* Missing skills */}
                <div className="col-span-2 rounded-2xl border border-white/10 bg-slate-800/60 p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-sm font-medium text-white">Missing Skills</p>
                    <span className="text-xs text-slate-500">4 identified</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {["TypeScript", "AWS", "System Design", "Docker"].map(
                      (skill) => (
                        <span
                          key={skill}
                          className="rounded-full border border-white/10 bg-slate-900 px-3 py-1.5 text-xs text-slate-300"
                        >
                          {skill}
                        </span>
                      )
                    )}
                  </div>
                </div>

                {/* AI Insight */}
                <div className="col-span-2 rounded-2xl border border-blue-500/20 bg-blue-500/10 p-4">
                  <div className="flex items-start gap-3">
                    <Brain className="mt-0.5 h-5 w-5 shrink-0 text-blue-300" />
                    <div>
                      <p className="text-sm font-medium text-white">AI Insight</p>
                      <p className="mt-1 text-sm leading-6 text-slate-300">
                        Learning TypeScript and AWS basics would improve your
                        match score for this role by an estimated 14%.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Floating badge */}
          <div className="absolute -bottom-4 -left-4 rounded-2xl border border-white/10 bg-slate-900/90 px-5 py-3 shadow-xl backdrop-blur-lg">
            <p className="text-xs text-slate-500">Application Email</p>
            <p className="mt-0.5 text-sm font-medium text-white">
              Generated in 3 seconds
            </p>
          </div>
        </div>
      </section>

      {/* ==================== STATS ==================== */}
      <section className="relative z-10 mx-auto max-w-6xl px-6 pb-24">
        <div className="grid gap-4 rounded-3xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-xl sm:grid-cols-2 lg:grid-cols-4">
          {[
            { title: "Resume Analysis", sub: "ATS-focused scoring" },
            { title: "Job Matching", sub: "AI-powered comparison" },
            { title: "Skill Insights", sub: "Role-specific gaps" },
            { title: "Premium Support", sub: "Priority response" },
          ].map((stat) => (
            <div
              key={stat.title}
              className="rounded-2xl border border-white/5 bg-slate-900/50 p-5"
            >
              <p className="text-sm font-medium text-white">{stat.title}</p>
              <p className="mt-1 text-sm text-slate-500">{stat.sub}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ==================== FEATURES ==================== */}
      <section id="features" className="relative z-10 mx-auto max-w-6xl px-6 py-24 lg:py-32">
        <div className="mb-16 max-w-2xl">
          <p className="mb-4 text-sm font-medium uppercase tracking-[0.2em] text-blue-400">
            Features
          </p>
          <h2 className="text-3xl font-semibold leading-tight tracking-tight text-white sm:text-4xl lg:text-5xl">
            Everything you need to go from CV to confident application
          </h2>
          <p className="mt-5 text-base leading-7 text-slate-400 sm:text-lg">
            Stop using 5 different tools. TomParo handles your entire job
            search workflow.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {[
            {
              icon: FileText,
              title: "AI Resume Optimizer",
              text: "Upload your CV and get ATS scoring, keyword analysis, and AI-powered rewrite suggestions instantly.",
              badge: "Free",
            },
            {
              icon: Target,
              title: "Job Match Analysis",
              text: "Paste any job description and instantly see your match score with specific improvement tips.",
              badge: "Free",
            },
            {
              icon: Mail,
              title: "Application Generator",
              text: "Generate tailored cover letters and professional emails in formal, modern, or concise styles.",
              badge: "Free",
            },
            {
              icon: MessageSquareText,
              title: "Interview Coaching",
              text: "Practice with AI-generated questions and get detailed feedback on every answer you give.",
              badge: "Premium",
            },
            {
              icon: TrendingUp,
              title: "Skill Gap Intelligence",
              text: "Discover which skills are missing, how critical they are, and how each one affects your score.",
              badge: "Free",
            },
            {
              icon: Brain,
              title: "AI Career Chat",
              text: "Chat directly with AI to understand your results, get career advice, and plan your next move.",
              badge: "Premium",
            },
          ].map((feature) => {
            const Icon = feature.icon;
            const isPremium = feature.badge === "Premium";

            return (
              <div
                key={feature.title}
                className="group relative rounded-3xl border border-white/10 bg-white/[0.02] p-7 transition duration-300 hover:-translate-y-1 hover:border-blue-500/20 hover:bg-white/[0.04]"
              >
                <div className="mb-6 flex items-start justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-400 ring-1 ring-blue-500/20 transition group-hover:bg-blue-500/15">
                    <Icon className="h-6 w-6" />
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ${
                      isPremium
                        ? "border border-amber-500/20 bg-amber-500/10 text-amber-300"
                        : "border border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
                    }`}
                  >
                    {feature.badge}
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-white">
                  {feature.title}
                </h3>
                <p className="mt-3 text-sm leading-7 text-slate-400">
                  {feature.text}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ==================== HOW IT WORKS ==================== */}
      <section
        id="how-it-works"
        className="relative z-10 border-y border-white/5 bg-white/[0.01] py-24 lg:py-32"
      >
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-16 max-w-2xl">
            <p className="mb-4 text-sm font-medium uppercase tracking-[0.2em] text-cyan-400">
              How it works
            </p>
            <h2 className="text-3xl font-semibold leading-tight tracking-tight text-white sm:text-4xl lg:text-5xl">
              Four steps from CV upload to smarter applications
            </h2>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                step: "01",
                title: "Upload your CV",
                text: "Drop your existing PDF or DOC, or paste your CV text directly.",
                icon: FileText,
              },
              {
                step: "02",
                title: "Paste a job",
                text: "Add any vacancy and let TomParo extract all requirements automatically.",
                icon: BriefcaseBusiness,
              },
              {
                step: "03",
                title: "Get AI insights",
                text: "See your ATS score, job match, missing skills, and tailored recommendations.",
                icon: Brain,
              },
              {
                step: "04",
                title: "Apply smarter",
                text: "Use generated materials to apply. Upgrade for interviews and deeper guidance.",
                icon: Crown,
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.step}
                  className="rounded-3xl border border-white/10 bg-slate-900/60 p-7"
                >
                  <div className="mb-6 flex items-center justify-between">
                    <span className="text-2xl font-bold text-slate-700">
                      {item.step}
                    </span>
                    <Icon className="h-5 w-5 text-slate-500" />
                  </div>
                  <h3 className="text-lg font-semibold text-white">
                    {item.title}
                  </h3>
                  <p className="mt-3 text-sm leading-7 text-slate-400">
                    {item.text}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ==================== PRICING ==================== */}
      <section
        id="pricing"
        className="relative z-10 mx-auto max-w-6xl px-6 py-24 lg:py-32"
      >
        <div className="mb-16 text-center">
          <p className="mb-4 text-sm font-medium uppercase tracking-[0.2em] text-blue-400">
            Pricing
          </p>
          <h2 className="text-3xl font-semibold leading-tight tracking-tight text-white sm:text-4xl lg:text-5xl">
            Start free. Upgrade when you need more.
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-slate-400 sm:text-lg">
            TomParo is built so everyone can access basic tools. Premium unlocks
            the full AI career experience.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Guest */}
          <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-8">
            <h3 className="text-lg font-semibold text-white">Guest</h3>
            <p className="mt-4 text-4xl font-bold text-white">Free</p>
            <p className="mt-2 text-sm text-slate-500">No account needed</p>

            <ul className="mt-8 space-y-4">
              {[
                "2 CV analyses per day",
                "3 job matches per day",
                "Basic cover letter",
                "Basic email generation",
                "Skill score only",
              ].map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-3 text-sm text-slate-400"
                >
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <Link
              href="/dashboard"
              className="mt-10 inline-flex w-full items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-5 py-3.5 text-sm font-medium text-white transition hover:bg-white/10"
            >
              Start Now
            </Link>
          </div>

          {/* Free Account */}
          <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-8">
            <h3 className="text-lg font-semibold text-white">Free Account</h3>
            <p className="mt-4 text-4xl font-bold text-white">₦0</p>
            <p className="mt-2 text-sm text-slate-500">Sign up for more</p>

            <ul className="mt-8 space-y-4">
              {[
                "5 CV analyses per day",
                "10 job matches per day",
                "Save CV history",
                "See missing skills list",
                "Basic account dashboard",
              ].map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-3 text-sm text-slate-400"
                >
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <Link
              href="/signup"
              className="mt-10 inline-flex w-full items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-5 py-3.5 text-sm font-medium text-white transition hover:bg-white/10"
            >
              Create Free Account
            </Link>
          </div>

          {/* Premium */}
          <div className="relative rounded-3xl border border-blue-500/30 bg-gradient-to-b from-blue-600/10 to-slate-900 p-8 shadow-xl shadow-blue-950/20">
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-blue-600 px-4 py-1.5 text-xs font-bold text-white shadow-lg shadow-blue-700/30">
              MOST POPULAR
            </div>

            <h3 className="flex items-center gap-2 text-lg font-semibold text-white">
              <Crown className="h-5 w-5 text-amber-400" />
              Premium
            </h3>
            <p className="mt-4 text-4xl font-bold text-white">
              ₦5,000
              <span className="text-lg font-normal text-slate-400">/month</span>
            </p>
            <p className="mt-2 text-sm text-slate-500">
              or ₦50,000/year (save ₦10,000)
            </p>

            <ul className="mt-8 space-y-4">
              {[
                "Unlimited AI usage",
                "Full interview simulation",
                "AI career chat assistant",
                "Complete skill roadmap",
                "Learning & certification links",
                "Live CV updates",
                "Priority AI processing",
                "Priority support",
                "No ads",
              ].map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-3 text-sm text-slate-200"
                >
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-blue-400" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <Link
              href="/signup"
              className="mt-10 inline-flex w-full items-center justify-center rounded-2xl bg-blue-600 px-5 py-3.5 text-sm font-medium text-white shadow-lg shadow-blue-700/25 transition hover:bg-blue-500"
            >
              Get Premium
            </Link>
          </div>
        </div>
      </section>

      {/* ==================== FINAL CTA ==================== */}
      <section className="relative z-10 mx-auto max-w-5xl px-6 pb-28">
        <div className="rounded-[32px] border border-white/10 bg-gradient-to-br from-blue-600/10 via-slate-900 to-cyan-500/5 p-12 text-center shadow-2xl shadow-blue-950/10 sm:p-16">
          <h2 className="text-3xl font-semibold leading-tight tracking-tight text-white sm:text-4xl lg:text-5xl">
            Your next career move deserves{" "}
            <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              better tools
            </span>
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-base leading-7 text-slate-400 sm:text-lg">
            Start free today. Upgrade later for interviews, AI career chat,
            skill roadmaps, and premium support.
          </p>

          <div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row">
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-7 py-4 text-base font-medium text-white shadow-lg shadow-blue-700/25 transition hover:bg-blue-500"
            >
              Launch Dashboard
              <ArrowRight className="h-5 w-5" />
            </Link>
            <Link
              href="/signup"
              className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-7 py-4 text-base font-medium text-slate-200 transition hover:bg-white/10"
            >
              Create Free Account
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}