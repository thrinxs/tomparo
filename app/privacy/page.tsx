import Link from "next/link";
import { Shield, Lock, Eye, Database, Cookie, Mail } from "lucide-react";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-slate-950 pb-24 pt-32">
      <div className="mx-auto max-w-4xl px-6">
        {/* Header */}
        <div className="text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-4 py-2 text-sm text-blue-400">
            <Shield className="h-4 w-4" />
            Your Privacy Matters
          </div>
          <h1 className="text-4xl font-bold text-white sm:text-5xl">
            Privacy Policy
          </h1>
          <p className="mt-4 text-slate-400">
            Last updated: {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>

        {/* Content */}
        <div className="mt-16 space-y-8">
          {/* Introduction */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-8">
            <p className="text-slate-300">
              At TomParo, we take your privacy seriously. This Privacy Policy
              explains how we collect, use, protect, and share your personal
              information when you use our AI-powered career platform. By using
              TomParo, you agree to the terms outlined below.
            </p>
          </div>

          {/* Sections */}
          {[
            {
              icon: Database,
              title: "Information We Collect",
              content: (
                <div className="space-y-3">
                  <p>We collect the following types of information:</p>
                  <ul className="ml-6 list-disc space-y-2 text-slate-400">
                    <li>
                      <strong className="text-white">Account Information:</strong> Name, email
                      address, phone number (optional), and password (encrypted).
                    </li>
                    <li>
                      <strong className="text-white">CV/Resume Data:</strong> The content of
                      your CVs, work experience, skills, education, and career history.
                    </li>
                    <li>
                      <strong className="text-white">Job Data:</strong> Job descriptions you
                      analyze and applications you generate.
                    </li>
                    <li>
                      <strong className="text-white">Usage Data:</strong> Features you use,
                      analysis history, and platform interactions.
                    </li>
                    <li>
                      <strong className="text-white">Payment Information:</strong> Handled
                      securely by Paystack. We never store your card details.
                    </li>
                    <li>
                      <strong className="text-white">Technical Data:</strong> IP address,
                      browser type, device information, and cookies.
                    </li>
                  </ul>
                </div>
              ),
            },
            {
              icon: Eye,
              title: "How We Use Your Information",
              content: (
                <div className="space-y-3">
                  <p>We use your information to:</p>
                  <ul className="ml-6 list-disc space-y-2 text-slate-400">
                    <li>Provide AI-powered CV analysis and job matching services</li>
                    <li>Generate personalized cover letters and application emails</li>
                    <li>Track your usage and enforce plan limits</li>
                    <li>Process payments and manage subscriptions</li>
                    <li>Send you important updates about your account</li>
                    <li>Improve our AI models and platform features</li>
                    <li>Provide customer support</li>
                    <li>Prevent fraud and ensure security</li>
                  </ul>
                </div>
              ),
            },
            {
              icon: Lock,
              title: "How We Protect Your Data",
              content: (
                <div className="space-y-3">
                  <p>Your data security is our top priority:</p>
                  <ul className="ml-6 list-disc space-y-2 text-slate-400">
                    <li>
                      All data is encrypted in transit (HTTPS) and at rest
                    </li>
                    <li>Passwords are hashed using industry-standard bcrypt</li>
                    <li>Database is hosted on secure infrastructure (Supabase)</li>
                    <li>
                      Payment processing is handled by PCI-compliant provider
                      (Paystack)
                    </li>
                    <li>Regular security audits and monitoring</li>
                    <li>Strict access controls for our team</li>
                  </ul>
                </div>
              ),
            },
            {
              icon: Cookie,
              title: "Cookies & Tracking",
              content: (
                <div className="space-y-3">
                  <p>We use cookies to:</p>
                  <ul className="ml-6 list-disc space-y-2 text-slate-400">
                    <li>Keep you logged in (session cookies)</li>
                    <li>Remember your preferences</li>
                    <li>Analyze how you use our platform</li>
                    <li>Improve your experience</li>
                  </ul>
                  <p className="mt-3">
                    You can control cookies through your browser settings.
                    Disabling cookies may affect some functionality.
                  </p>
                </div>
              ),
            },
            {
              icon: Shield,
              title: "Data Sharing",
              content: (
                <div className="space-y-3">
                  <p>We DO NOT sell your personal data. We only share with:</p>
                  <ul className="ml-6 list-disc space-y-2 text-slate-400">
                    <li>
                      <strong className="text-white">Google Gemini AI:</strong> Your CV and job
                      text are sent to Google's AI to generate analyses (not
                      stored by them for training).
                    </li>
                    <li>
                      <strong className="text-white">Paystack:</strong> For payment processing.
                    </li>
                    <li>
                      <strong className="text-white">Vercel & Supabase:</strong> Infrastructure
                      providers who host our platform.
                    </li>
                    <li>
                      <strong className="text-white">Law enforcement:</strong> Only when
                      required by law.
                    </li>
                  </ul>
                </div>
              ),
            },
            {
              icon: Eye,
              title: "Your Rights",
              content: (
                <div className="space-y-3">
                  <p>You have the right to:</p>
                  <ul className="ml-6 list-disc space-y-2 text-slate-400">
                    <li>Access all data we hold about you</li>
                    <li>Update or correct your information anytime</li>
                    <li>Delete your account and all associated data</li>
                    <li>Export your data</li>
                    <li>Opt out of marketing emails</li>
                    <li>Request information about data processing</li>
                  </ul>
                  <p className="mt-3">
                    To exercise these rights, contact us at{" "}
                    <a
                      href="mailto:tomparo.biz@gmail.com"
                      className="text-blue-400 hover:text-blue-300"
                    >
                      tomparo.biz@gmail.com
                    </a>
                    .
                  </p>
                </div>
              ),
            },
            {
              icon: Database,
              title: "Data Retention",
              content: (
                <p className="text-slate-400">
                  We keep your data as long as your account is active. When you
                  delete your account, we permanently remove all your personal
                  data within 30 days, except where required by law to retain
                  certain records (e.g., payment records for tax purposes).
                </p>
              ),
            },
            {
              icon: Mail,
              title: "Contact Us",
              content: (
                <div className="space-y-3">
                  <p>
                    If you have questions about this Privacy Policy, please
                    contact us:
                  </p>
                  <div className="rounded-xl border border-white/10 bg-slate-900/40 p-4">
                    <p className="text-sm">
                      <strong className="text-white">Email:</strong>{" "}
                      <a
                        href="mailto:tomparo.biz@gmail.com"
                        className="text-blue-400 hover:text-blue-300"
                      >
                        tomparo.biz@gmail.com
                      </a>
                    </p>
                    <p className="mt-2 text-sm">
                      <strong className="text-white">Company:</strong> Thrinxs
                    </p>
                    <p className="mt-2 text-sm">
                      <strong className="text-white">Location:</strong> Nigeria
                    </p>
                  </div>
                </div>
              ),
            },
          ].map((section, i) => {
            const Icon = section.icon;
            return (
              <div
                key={i}
                className="rounded-2xl border border-white/10 bg-white/[0.02] p-8"
              >
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10">
                    <Icon className="h-5 w-5 text-blue-400" />
                  </div>
                  <h2 className="text-xl font-bold text-white">
                    {section.title}
                  </h2>
                </div>
                <div className="text-slate-300">{section.content}</div>
              </div>
            );
          })}

          {/* Footer */}
          <div className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-6 text-center">
            <p className="text-sm text-slate-300">
              By using TomParo, you acknowledge that you have read and
              understood this Privacy Policy.
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-3">
              <Link
                href="/terms"
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white hover:bg-white/10"
              >
                Terms of Service
              </Link>
              <Link
                href="/contact"
                className="rounded-xl bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-500"
              >
                Contact Us
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}