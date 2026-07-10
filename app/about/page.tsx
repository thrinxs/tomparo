import type { Metadata } from "next";
import Link from "next/link";
import {
  Sparkles,
  Target,
  ShieldCheck,
  Gauge,
  Lock,
  Zap,
  Globe,
  Users,
} from "lucide-react";

export const metadata: Metadata = {
  title: "About TomParo",
  description:
    "Learn about TomParo — an AI career & job application platform built to help you get hired faster.",
};

const values = [
  {
    icon: Target,
    title: "Outcome-first",
    body: "We ship what improves interview rate, response rate, and confidence—not vanity features.",
  },
  {
    icon: ShieldCheck,
    title: "Trust & safety",
    body: "Clear limits, clear pricing, and no sketchy behavior. Trust is a product feature.",
  },
  {
    icon: Gauge,
    title: "Speed wins",
    body: "Job search is time-sensitive. TomParo is built for fast loops: analyze → improve → apply.",
  },
  {
    icon: Lock,
    title: "Privacy by design",
    body: "Career data is personal. We keep things simple and avoid unnecessary exposure.",
  },
];

const stats = [
  { label: "Built for", value: "Job seekers + recruiters" },
  { label: "Core tools", value: "CV + job match + apply" },
  { label: "AI model", value: "Gemini (fast + affordable)" },
  { label: "Payments", value: "Paystack (NGN)" },
];

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-background">
      {/* HERO */}
      <section className="mx-auto w-full max-w-6xl px-4 pb-10 pt-16">
        <div className="grid gap-10 md:grid-cols-2 md:items-center">
          <div className="space-y-6">
            <p className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm text-muted-foreground">
              <Sparkles className="h-4 w-4" />
              Built for real-world hiring
            </p>

            <h1 className="text-balance text-4xl font-semibold tracking-tight md:text-5xl">
              About <span className="text-primary">TomParo</span>
            </h1>

            <p className="text-pretty text-lg text-muted-foreground">
              TomParo is an AI-powered career intelligence platform designed to
              help job seekers get hired faster—while giving recruiters smarter
              signals for evaluating candidates.
            </p>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/pricing"
                className="inline-flex h-11 items-center justify-center rounded-xl bg-primary px-5 text-sm font-medium text-primary-foreground hover:opacity-90"
              >
                See Pricing
              </Link>
              <Link
                href="/signup"
                className="inline-flex h-11 items-center justify-center rounded-xl border px-5 text-sm font-medium hover:bg-accent"
              >
                Create Free Account
              </Link>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2 sm:grid-cols-4">
              {stats.map((s) => (
                <div
                  key={s.label}
                  className="rounded-xl border bg-card px-4 py-3"
                >
                  <div className="text-xs text-muted-foreground">{s.label}</div>
                  <div className="mt-1 text-sm font-medium">{s.value}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border bg-card p-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Zap className="h-4 w-4" />
                What TomParo helps you do
              </div>

              <ul className="space-y-3 text-sm text-muted-foreground">
                <li className="flex gap-3">
                  <span className="mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-lg border bg-background text-xs">
                    1
                  </span>
                  <span>
                    Upload your CV (PDF/DOC/DOCX) and get an ATS-focused review
                    with quick wins.
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-lg border bg-background text-xs">
                    2
                  </span>
                  <span>
                    Paste a job description and get a match score + tailored
                    improvement plan.
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-lg border bg-background text-xs">
                    3
                  </span>
                  <span>
                    Generate a cover letter + application email you can edit and
                    download as DOCX.
                  </span>
                </li>
              </ul>

              <div className="rounded-xl border bg-background p-4 text-sm">
                <div className="flex items-center gap-2 font-medium">
                  <Globe className="h-4 w-4" />
                  Built with Nigeria in mind
                </div>
                <p className="mt-2 text-muted-foreground">
                  TomParo is optimized for real hiring workflows, realistic
                  pricing, and Paystack payments in NGN—while still being useful
                  globally.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* VALUES */}
      <section className="mx-auto w-full max-w-6xl px-4 pb-16">
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
            Principles we build by
          </h2>
          <p className="max-w-2xl text-muted-foreground">
            The goal is simple: make job search less confusing, less
            time-consuming, and more effective.
          </p>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {values.map((v) => {
            const Icon = v.icon;
            return (
              <div key={v.title} className="rounded-2xl border bg-card p-6">
                <div className="flex items-start gap-4">
                  <div className="rounded-xl border bg-background p-3">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-base font-semibold">{v.title}</div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {v.body}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* CTA */}
        <div className="mt-10 rounded-2xl border bg-card p-6 md:p-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="flex items-center gap-2 text-sm font-medium">
                <Users className="h-4 w-4" />
                Ready to try it?
              </div>
              <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                Start free. If you like the workflow and want unlimited usage,
                upgrade anytime.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/signup"
                className="inline-flex h-11 items-center justify-center rounded-xl bg-primary px-5 text-sm font-medium text-primary-foreground hover:opacity-90"
              >
                Get Started Free
              </Link>
              <Link
                href="/pricing"
                className="inline-flex h-11 items-center justify-center rounded-xl border px-5 text-sm font-medium hover:bg-accent"
              >
                View Plans
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}