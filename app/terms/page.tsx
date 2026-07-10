import Link from "next/link";
import {
  FileText,
  User,
  CreditCard,
  Shield,
  AlertTriangle,
  Ban,
  Scale,
  Mail,
} from "lucide-react";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-slate-950 pb-24 pt-32">
      <div className="mx-auto max-w-4xl px-6">
        {/* Header */}
        <div className="text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-4 py-2 text-sm text-blue-400">
            <Scale className="h-4 w-4" />
            Legal Agreement
          </div>
          <h1 className="text-4xl font-bold text-white sm:text-5xl">
            Terms of Service
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
              Welcome to TomParo. These Terms of Service ("Terms") govern your
              use of our AI-powered career platform ("Service"). By accessing
              or using TomParo, you agree to be bound by these Terms. If you
              disagree with any part of these Terms, please do not use our
              Service.
            </p>
          </div>

          {[
            {
              icon: User,
              title: "1. Acceptance of Terms",
              content: (
                <p className="text-slate-400">
                  By creating an account or using TomParo, you confirm that you
                  are at least 16 years old and have the legal capacity to enter
                  into these Terms. If you're using the Service on behalf of an
                  organization, you represent that you have authority to bind
                  that organization to these Terms.
                </p>
              ),
            },
            {
              icon: FileText,
              title: "2. Description of Service",
              content: (
                <div className="space-y-3">
                  <p>
                    TomParo provides AI-powered career tools including:
                  </p>
                  <ul className="ml-6 list-disc space-y-2 text-slate-400">
                    <li>CV/Resume analysis with ATS scoring</li>
                    <li>Job description matching and comparison</li>
                    <li>AI-generated cover letters and application emails</li>
                    <li>Skill gap analysis and career recommendations</li>
                    <li>Interview coaching (Premium)</li>
                    <li>Career intelligence and chat (Premium)</li>
                  </ul>
                  <p className="mt-3">
                    We may add, modify, or remove features at any time.
                  </p>
                </div>
              ),
            },
            {
              icon: User,
              title: "3. User Accounts",
              content: (
                <div className="space-y-3">
                  <p>You are responsible for:</p>
                  <ul className="ml-6 list-disc space-y-2 text-slate-400">
                    <li>Maintaining the confidentiality of your password</li>
                    <li>All activities under your account</li>
                    <li>Providing accurate registration information</li>
                    <li>Keeping your information up to date</li>
                    <li>Notifying us of unauthorized access</li>
                  </ul>
                </div>
              ),
            },
            {
              icon: CreditCard,
              title: "4. Subscription & Payments",
              content: (
                <div className="space-y-3">
                  <p className="mb-3">
                    <strong className="text-white">Pricing:</strong> Premium
                    plans are priced at ₦5,000/month or ₦50,000/year. Prices may
                    change with notice.
                  </p>
                  <p className="mb-3">
                    <strong className="text-white">Billing:</strong> Payments are
                    processed by Paystack. Your subscription automatically
                    renews at the end of each billing period.
                  </p>
                  <p className="mb-3">
                    <strong className="text-white">Cancellation:</strong> You can
                    cancel anytime. You'll retain Premium access until the end
                    of your current billing period.
                  </p>
                  <p className="mb-3">
                    <strong className="text-white">No Refunds:</strong> We do NOT
                    offer refunds on subscriptions. This is why we offer a
                    generous Free tier — try before you subscribe.
                  </p>
                  <p>
                    <strong className="text-white">Failed Payments:</strong> If
                    payment fails, your account will be downgraded to Free tier
                    until payment is successful.
                  </p>
                </div>
              ),
            },
            {
              icon: Shield,
              title: "5. Acceptable Use",
              content: (
                <div className="space-y-3">
                  <p>You agree NOT to:</p>
                  <ul className="ml-6 list-disc space-y-2 text-slate-400">
                    <li>Use TomParo for illegal purposes</li>
                    <li>Upload false, misleading, or fraudulent information</li>
                    <li>Attempt to hack, disrupt, or damage the Service</li>
                    <li>Share your account with others</li>
                    <li>Use automated systems to abuse the Service</li>
                    <li>Reverse engineer or copy our platform</li>
                    <li>Upload others' CVs without their permission</li>
                    <li>Resell or redistribute our AI-generated content commercially</li>
                    <li>Violate any laws or third-party rights</li>
                  </ul>
                </div>
              ),
            },
            {
              icon: FileText,
              title: "6. Content Ownership",
              content: (
                <div className="space-y-3">
                  <p className="mb-3">
                    <strong className="text-white">Your Content:</strong> You
                    retain ownership of any CVs, job descriptions, or content
                    you submit. By using our Service, you grant us a license to
                    process this content to provide our services.
                  </p>
                  <p className="mb-3">
                    <strong className="text-white">AI-Generated Content:</strong>{" "}
                    Cover letters, emails, and analyses generated by our AI are
                    yours to use for personal job applications.
                  </p>
                  <p>
                    <strong className="text-white">Our Content:</strong> TomParo's
                    platform, code, design, and branding are our intellectual
                    property.
                  </p>
                </div>
              ),
            },
            {
              icon: AlertTriangle,
              title: "7. AI Disclaimers",
              content: (
                <div className="space-y-3">
                  <p>Please understand:</p>
                  <ul className="ml-6 list-disc space-y-2 text-slate-400">
                    <li>
                      Our AI provides suggestions, not guarantees. Job success
                      depends on many factors beyond your CV.
                    </li>
                    <li>
                      AI-generated content should be reviewed and personalized
                      before use.
                    </li>
                    <li>
                      We cannot guarantee that using TomParo will result in job
                      offers, interviews, or specific outcomes.
                    </li>
                    <li>
                      Match scores and analyses are estimates based on AI
                      interpretation.
                    </li>
                    <li>
                      Course, certification, and career recommendations are
                      suggestions — you're responsible for your career decisions.
                    </li>
                  </ul>
                </div>
              ),
            },
            {
              icon: Ban,
              title: "8. Account Termination",
              content: (
                <div className="space-y-3">
                  <p>We may suspend or terminate your account if you:</p>
                  <ul className="ml-6 list-disc space-y-2 text-slate-400">
                    <li>Violate these Terms</li>
                    <li>Engage in fraud or abuse</li>
                    <li>Fail to pay subscription fees</li>
                    <li>Threaten our team or other users</li>
                  </ul>
                  <p className="mt-3">
                    You may delete your account anytime through Settings.
                  </p>
                </div>
              ),
            },
            {
              icon: Shield,
              title: "9. Limitation of Liability",
              content: (
                <p className="text-slate-400">
                  TomParo is provided "as is" without warranties of any kind. We
                  are not liable for any indirect, incidental, or consequential
                  damages arising from your use of the Service. Our total
                  liability shall not exceed the amount you paid us in the past
                  6 months.
                </p>
              ),
            },
            {
              icon: Scale,
              title: "10. Governing Law",
              content: (
                <p className="text-slate-400">
                  These Terms are governed by the laws of the Federal Republic
                  of Nigeria. Any disputes shall be resolved in the courts of
                  Nigeria.
                </p>
              ),
            },
            {
              icon: FileText,
              title: "11. Changes to Terms",
              content: (
                <p className="text-slate-400">
                  We may update these Terms from time to time. We'll notify you
                  of significant changes via email or a notice on the platform.
                  Your continued use of TomParo after changes constitutes
                  acceptance of the new Terms.
                </p>
              ),
            },
            {
              icon: Mail,
              title: "12. Contact",
              content: (
                <div className="space-y-3">
                  <p>Questions about these Terms? Contact us:</p>
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
              By using TomParo, you acknowledge that you have read and agree to
              these Terms of Service.
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-3">
              <Link
                href="/privacy"
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white hover:bg-white/10"
              >
                Privacy Policy
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