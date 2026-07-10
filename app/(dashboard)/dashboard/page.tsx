"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useSearchParams, useRouter } from "next/navigation";
import UsageCounter from "@/components/dashboard/UsageCounter";
import toast, { Toaster } from "react-hot-toast";
import {
  FileText,
  Target,
  Mail,
  TrendingUp,
  Sparkles,
  ArrowRight,
  Crown,
} from "lucide-react";

// Separate component that uses useSearchParams
function PaymentHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [verifyingPayment, setVerifyingPayment] = useState(false);

  useEffect(() => {
    const payment = searchParams.get("payment");
    const reference = searchParams.get("reference");

    if (payment === "success" && reference) {
      setVerifyingPayment(true);
      fetch("/api/payment/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reference }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            toast.success("🎉 Welcome to Premium! Enjoy unlimited access.");
            router.replace("/dashboard");
            setTimeout(() => window.location.reload(), 2000);
          } else {
            toast.error(data.error || "Payment verification failed");
          }
        })
        .catch(() => {
          toast.error("Failed to verify payment");
        })
        .finally(() => {
          setVerifyingPayment(false);
        });
    }
  }, [searchParams, router]);

  if (!verifyingPayment) return null;

  return (
    <div className="rounded-2xl border border-blue-500/20 bg-blue-500/10 p-4 text-center">
      <p className="text-sm text-blue-400">🔄 Verifying your payment...</p>
    </div>
  );
}

export default function DashboardHome() {
  const { data: session } = useSession();
  const user = session?.user as any;
  const isPremium = user?.isPremium || false;

  const features = [
    {
      title: "Analyze Your CV",
      description: "Get ATS score and AI-powered improvement suggestions",
      icon: FileText,
      href: "/dashboard/resume",
      color: "blue",
    },
    {
      title: "Match a Job",
      description: "See how well your CV matches any job description",
      icon: Target,
      href: "/dashboard/job",
      color: "cyan",
    },
    {
      title: "Generate Application",
      description: "AI-crafted cover letters and application emails",
      icon: Mail,
      href: "/dashboard/apply",
      color: "emerald",
    },
    {
      title: "Skill Gap Analysis",
      description: "Discover skills you need to advance your career",
      icon: TrendingUp,
      href: "/dashboard/skills",
      color: "purple",
    },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <Toaster position="top-right" />

      {/* Payment Handler wrapped in Suspense */}
      <Suspense fallback={null}>
        <PaymentHandler />
      </Suspense>

      {/* Welcome */}
      <div>
        <h1 className="text-3xl font-bold text-white">
          Welcome back, {user?.name?.split(" ")[0] || "there"} 👋
        </h1>
        <p className="mt-2 text-slate-400">
          Your AI-powered career assistant is ready to help.
        </p>
      </div>

      {/* Usage Counter */}
      <UsageCounter />

      {/* Quick Actions */}
      <div>
        <h2 className="mb-4 text-lg font-semibold text-white">Quick Actions</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <Link
                key={feature.href}
                href={feature.href}
                className={`group rounded-2xl border border-white/10 bg-white/[0.02] p-6 transition hover:border-${feature.color}-500/30 hover:bg-white/[0.04]`}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-${feature.color}-500/10 ring-1 ring-${feature.color}-500/20`}
                  >
                    <Icon className={`h-6 w-6 text-${feature.color}-400`} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-white">
                      {feature.title}
                    </h3>
                    <p className="mt-1 text-sm text-slate-400">
                      {feature.description}
                    </p>
                    <div className="mt-3 flex items-center gap-1 text-sm text-blue-400 transition group-hover:translate-x-1">
                      Get started <ArrowRight className="h-4 w-4" />
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Premium CTA (only for non-premium) */}
      {!isPremium && (
        <div className="rounded-3xl border border-amber-500/20 bg-gradient-to-br from-amber-500/10 to-orange-500/5 p-8">
          <div className="flex flex-col items-start gap-6 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-500/20">
                <Crown className="h-6 w-6 text-amber-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">
                  Unlock TomParo Premium
                </h3>
                <p className="mt-1 text-sm text-slate-300">
                  Unlimited AI, interview coaching, career chat, and more.
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-3 text-xs">
                  <span className="rounded-full bg-slate-900/60 px-3 py-1 text-slate-300">
                    ✨ Unlimited analyses
                  </span>
                  <span className="rounded-full bg-slate-900/60 px-3 py-1 text-slate-300">
                    🎯 Interview coach
                  </span>
                  <span className="rounded-full bg-slate-900/60 px-3 py-1 text-slate-300">
                    🧠 Career AI chat
                  </span>
                </div>
              </div>
            </div>
            <Link
              href="/pricing"
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 px-6 py-3 text-sm font-medium text-white shadow-lg shadow-amber-700/25 transition hover:from-amber-500 hover:to-orange-500"
            >
              <Sparkles className="h-4 w-4" />
              Upgrade Now
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}