import type { Metadata } from "next";
import Link from "next/link";
import { ShieldCheck, CreditCard, Sparkles, FileText } from "lucide-react";

export const metadata: Metadata = {
  title: "FAQ",
  description:
    "Frequently asked questions about TomParo: pricing, privacy, AI output, and how the platform works.",
};

const faqs = [
  {
    q: "Is TomParo free?",
    a: "Yes. You can use TomParo on a free plan with daily usage limits. Premium removes limits and ads, and unlocks all features.",
    tag: "Pricing",
  },
  {
    q: "What do I get with Premium?",
    a: "Premium is built for serious job seekers. You get effectively unlimited usage (no daily caps), full feature access, and no ads.",
    tag: "Premium",
  },
  {
    q: "How do payments work?",
    a: "Payments are processed through Paystack in NGN. After a successful payment, your account upgrades automatically.",
    tag: "Payments",
  },
  {
    q: "Does TomParo store my resume?",
    a: "Your resume text may be processed to generate results and can be saved in your history depending on the feature. Treat anything you upload as sensitive personal data.",
    tag: "Privacy",
  },
  {
    q: "Will AI guarantee me a job?",
    a: "No. TomParo improves your odds by helping you present stronger evidence (CV, tailoring, clearer communication). Hiring decisions are made by humans and vary by company.",
    tag: "Expectations",
  },
  {
    q: "Can I download the cover letter/email?",
    a: "Yes. You can generate and download DOCX files for cover letters and application emails, and edit them before sending.",
    tag: "Documents",
  },
  {
    q: "I forgot my password—can I reset it?",
    a: "The reset flow UI exists. If password reset email isn’t enabled yet in your deployment, you can still sign in with the provider you used (e.g., Google) or contact support.",
    tag: "Account",
  },
  {
    q: "What file types are supported for resumes?",
    a: "PDF, DOC, and DOCX are supported. You can also paste resume text directly into the uploader.",
    tag: "Resumes",
  },
];

export default function FaqPage() {
  return (
    <main className="min-h-screen bg-background">
      {/* HERO */}
      <section className="mx-auto w-full max-w-4xl px-4 pb-10 pt-16">
        <div className="space-y-4">
          <p className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm text-muted-foreground">
            <Sparkles className="h-4 w-4" />
            Quick answers, no fluff
          </p>

          <h1 className="text-balance text-4xl font-semibold tracking-tight md:text-5xl">
            <span className="text-primary">FAQ</span>
          </h1>

          <p className="text-pretty text-lg text-muted-foreground">
            Everything you need to know about how TomParo works—pricing, AI,
            privacy, and downloads.
          </p>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href="/pricing"
              className="inline-flex h-11 items-center justify-center rounded-xl bg-primary px-5 text-sm font-medium text-primary-foreground hover:opacity-90"
            >
              View Pricing
            </Link>
            <Link
              href="/contact"
              className="inline-flex h-11 items-center justify-center rounded-xl border px-5 text-sm font-medium hover:bg-accent"
            >
              Contact Support
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ LIST */}
      <section className="mx-auto w-full max-w-4xl px-4 pb-16">
        <div className="grid gap-4">
          {faqs.map((item) => (
            <div key={item.q} className="rounded-2xl border bg-card p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-base font-semibold">{item.q}</h2>
                <span className="rounded-full border px-3 py-1 text-xs text-muted-foreground">
                  {item.tag}
                </span>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {item.a}
              </p>
            </div>
          ))}
        </div>

        {/* TRUST STRIP */}
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border bg-card p-6">
            <div className="flex items-center gap-2 text-sm font-medium">
              <ShieldCheck className="h-4 w-4" />
              Privacy-minded
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              Your career data is sensitive. Keep uploads minimal and only share
              what’s needed to get good output.
            </p>
          </div>

          <div className="rounded-2xl border bg-card p-6">
            <div className="flex items-center gap-2 text-sm font-medium">
              <CreditCard className="h-4 w-4" />
              Paystack payments
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              Simple NGN checkout. Successful payments upgrade your account
              automatically.
            </p>
          </div>

          <div className="rounded-2xl border bg-card p-6">
            <div className="flex items-center gap-2 text-sm font-medium">
              <FileText className="h-4 w-4" />
              DOCX downloads
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              Generate cover letters and emails, edit them, and download as DOCX
              for clean formatting.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}