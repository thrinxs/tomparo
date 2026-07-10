"use client";

import { useSession } from "next-auth/react";
import LockedFeature from "@/components/dashboard/LockedFeature";
import {
  Inbox,
  MessageCircle,
  Zap,
  Crown,
  Clock,
  CheckCircle2,
} from "lucide-react";

declare global {
  interface Window {
    Tawk_API?: any;
  }
}

export default function MessagesPage() {
  const { data: session } = useSession();
  const isPremium = (session?.user as any)?.isPremium || false;

  if (!isPremium) {
    return (
      <LockedFeature
        feature="Priority Support"
        description="Get priority support with fast response times and dedicated help from our team."
        icon={Inbox}
        color="amber"
        benefits={[
          "Priority support with faster responses",
          "Direct access to our support team",
          "Live chat support",
          "Attach files to support requests",
          "Get help with your CV, jobs, and career",
          "Personalized assistance",
          "Faster resolution times",
          "Premium badge in chat conversations",
        ]}
      />
    );
  }

  const openChat = () => {
    if (typeof window !== "undefined" && window.Tawk_API?.maximize) {
      window.Tawk_API.maximize();
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-400">
          <Crown className="h-3 w-3" />
          Priority Support
        </div>
        <h1 className="text-3xl font-bold text-white">Support Center</h1>
        <p className="mt-2 text-slate-400">
          As a Premium user, you get priority support with faster response times.
        </p>
      </div>

      <div className="rounded-3xl border border-amber-500/20 bg-gradient-to-br from-amber-500/10 to-orange-500/5 p-8">
        <div className="flex flex-col items-center text-center md:flex-row md:items-start md:text-left">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-amber-500/20 ring-1 ring-amber-500/30 md:mb-0 md:mr-6">
            <MessageCircle className="h-8 w-8 text-amber-400" />
          </div>

          <div className="flex-1">
            <h2 className="text-2xl font-bold text-white">Chat with Us Live</h2>
            <p className="mt-2 text-slate-300">
              Click the chat button in the bottom right corner of your screen to
              start a conversation with our support team.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                onClick={openChat}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 px-6 py-3 text-sm font-medium text-white shadow-lg shadow-amber-700/25 transition hover:from-amber-500 hover:to-orange-500"
              >
                <MessageCircle className="h-4 w-4" />
                Open Live Chat
              </button>

              <a
                href="mailto:tomparo.biz@gmail.com"
                className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-6 py-3 text-sm font-medium text-white transition hover:bg-white/10"
              >
                <Inbox className="h-4 w-4" />
                Email Us
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10">
            <Zap className="h-6 w-6 text-emerald-400" />
          </div>
          <h3 className="font-semibold text-white">Priority Response</h3>
          <p className="mt-1 text-sm text-slate-400">
            Get responses faster than free users
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/10">
            <Clock className="h-6 w-6 text-blue-400" />
          </div>
          <h3 className="font-semibold text-white">24/7 Availability</h3>
          <p className="mt-1 text-sm text-slate-400">
            Messages available anytime, we respond ASAP
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-500/10">
            <CheckCircle2 className="h-6 w-6 text-purple-400" />
          </div>
          <h3 className="font-semibold text-white">Personal Help</h3>
          <p className="mt-1 text-sm text-slate-400">
            Get personalized answers to your questions
          </p>
        </div>
      </div>

      <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-6">
        <h3 className="mb-4 text-lg font-semibold text-white">
          What We Can Help With
        </h3>
        <div className="grid gap-3 md:grid-cols-2">
          {[
            "Account and subscription questions",
            "Payment and billing issues",
            "Help using AI features",
            "CV and career advice",
            "Technical support and bugs",
            "Feature requests and feedback",
            "Password reset help",
            "Data privacy questions",
          ].map((topic, i) => (
            <div
              key={i}
              className="flex items-start gap-3 rounded-xl border border-white/5 bg-slate-900/40 p-3"
            >
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
              <span className="text-sm text-slate-300">{topic}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-6 text-center">
        <p className="text-sm text-slate-300">
          <strong className="text-blue-400">Typical response time:</strong>{" "}
          Within 24 hours for premium users
        </p>
      </div>
    </div>
  );
}