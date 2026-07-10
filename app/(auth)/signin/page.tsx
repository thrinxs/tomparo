"use client";

import Link from "next/link";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import {
  Mail, Lock, ArrowRight, Loader2,
  Briefcase, Building2, Eye, EyeOff,
} from "lucide-react";

function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const typeParam = searchParams.get("type");

  const [accountType, setAccountType] = useState<"jobseeker" | "recruiter">(
    typeParam === "recruiter" ? "recruiter" : "jobseeker"
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [keepSignedIn, setKeepSignedIn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (typeParam === "recruiter") setAccountType("recruiter");
  }, [typeParam]);

  const isRecruiter = accountType === "recruiter";

  const recruiterRoles = [
    "RECRUITER_STARTER", "RECRUITER_GROWTH", "RECRUITER_BUSINESS",
    "RECRUITER_ENTERPRISE", "RECRUITER_SCALE", "RECRUITER_CUSTOM",
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        if (result.error === "No account found with this email") {
          setError("No account found with this email address.");
        } else if (result.error === "Incorrect password") {
          setError("Incorrect password. Please try again.");
        } else {
          setError("Sign in failed. Please check your details.");
        }
        setLoading(false);
        return;
      }

      // Save keep-signed-in preference
      if (keepSignedIn) {
        localStorage.setItem("tomparo-keep-signed-in", "true");
      }

      await new Promise((resolve) => setTimeout(resolve, 300));

      const sessionRes = await fetch("/api/auth/session");
      const session = await sessionRes.json();
      const role = session?.user?.role as string | undefined;
      const isRecruiterAccount = session?.user?.isRecruiter as boolean | undefined;

      if (role === "ADMIN") {
        router.push("/admin");
      } else if (role === "STAFF") {
        router.push("/staff");
      } else if (role === "SUPPORT") {
        router.push("/support");
      } else if (role && recruiterRoles.includes(role)) {
        router.push("/recruiter");
      } else if (isRecruiterAccount) {
        router.push("/recruiter");
      } else {
        router.push("/dashboard");
      }

      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    await signIn("google", {
      callbackUrl: isRecruiter ? "/recruiter" : "/dashboard",
    });
  };

  return (
    <div className="w-full max-w-md">

      {/* Header */}
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-semibold text-white sm:text-4xl">
          Welcome back
        </h1>
        <p className="mt-3 text-base text-slate-400">
          {isRecruiter
            ? "Sign in to your recruiter dashboard"
            : "Sign in to continue your career journey"}
        </p>
      </div>

      {/* Toggle */}
      <div className="mb-6 flex rounded-2xl border border-white/10 bg-white/[0.03] p-1">
        <button
          type="button"
          onClick={() => setAccountType("jobseeker")}
          className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold transition-all ${
            !isRecruiter
              ? "bg-blue-600 text-white shadow-lg shadow-blue-700/25"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <Briefcase className="h-4 w-4" />
          Job Seeker
        </button>
        <button
          type="button"
          onClick={() => setAccountType("recruiter")}
          className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold transition-all ${
            isRecruiter
              ? "bg-purple-600 text-white shadow-lg shadow-purple-700/25"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <Building2 className="h-4 w-4" />
          Recruiter
        </button>
      </div>

      <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-8 backdrop-blur-xl">

        {/* Error */}
        {error && (
          <div className="mb-6 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Email */}
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">
              {isRecruiter ? "Work Email" : "Email"}
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className={`w-full rounded-xl border border-white/10 bg-slate-900/50 px-11 py-3.5 text-white placeholder-slate-500 outline-none transition ${
                  isRecruiter
                    ? "focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20"
                    : "focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20"
                }`}
                placeholder={isRecruiter ? "you@company.com" : "you@example.com"}
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="text-sm font-medium text-slate-300">Password</label>
              <Link href="/forgot-password" className="text-xs text-blue-400 transition hover:text-blue-300">
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className={`w-full rounded-xl border border-white/10 bg-slate-900/50 px-11 py-3.5 text-white placeholder-slate-500 outline-none transition ${
                  isRecruiter
                    ? "focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20"
                    : "focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20"
                }`}
                placeholder="Enter your password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          {/* Keep me signed in */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="keepSignedIn"
              checked={keepSignedIn}
              onChange={(e) => setKeepSignedIn(e.target.checked)}
              className="w-4 h-4 rounded accent-blue-500"
            />
            <label htmlFor="keepSignedIn" className="text-sm text-slate-400 cursor-pointer">
              Keep me signed in on this device
            </label>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className={`inline-flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3.5 text-sm font-medium text-white shadow-lg transition disabled:opacity-50 ${
              isRecruiter
                ? "bg-purple-600 shadow-purple-700/25 hover:bg-purple-500"
                : "bg-blue-600 shadow-blue-700/25 hover:bg-blue-500"
            }`}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>Sign In <ArrowRight className="h-4 w-4" /></>
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="my-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-white/5" />
          <span className="text-xs text-slate-500">or continue with</span>
          <div className="h-px flex-1 bg-white/5" />
        </div>

        {/* Google */}
        <button
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="inline-flex w-full items-center justify-center gap-3 rounded-xl border border-white/10 bg-white/5 px-5 py-3.5 text-sm font-medium text-white transition hover:bg-white/10 disabled:opacity-50"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          Continue with Google
        </button>

        {/* Sign up link */}
        <p className="mt-6 text-center text-sm text-slate-400">
          Don&apos;t have an account?{" "}
          <Link
            href={isRecruiter ? "/signup?type=recruiter" : "/signup"}
            className="font-medium text-blue-400 transition hover:text-blue-300"
          >
            {isRecruiter ? "Create recruiter account" : "Sign up for free"}
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-slate-500" />
        </div>
      </div>
    }>
      <SignInForm />
    </Suspense>
  );
}