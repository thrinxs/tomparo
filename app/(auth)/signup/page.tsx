"use client";

import Link from "next/link";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import {
  User, Mail, Lock, Phone, ArrowRight, Loader2,
  Building2, Briefcase, Users, ChevronDown,
  Eye, EyeOff,
} from "lucide-react";

function SignUpForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const typeParam = searchParams.get("type");
  const planParam = searchParams.get("plan");

  const [accountType, setAccountType] = useState<"jobseeker" | "recruiter">(
    typeParam === "recruiter" ? "recruiter" : "jobseeker"
  );

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [companyName, setCompanyName] = useState("");
  const [companySize, setCompanySize] = useState("");
  const [industry, setIndustry] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (typeParam === "recruiter") setAccountType("recruiter");
  }, [typeParam]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    if (accountType === "recruiter" && !companyName.trim()) {
      setError("Company name is required");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name, email, phone, password, accountType,
          ...(accountType === "recruiter" && {
            companyName, companySize, industry, plan: planParam,
          }),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to create account");
        setLoading(false);
        return;
      }

      const signInResult = await signIn("credentials", {
        email, password, redirect: false,
      });

      if (signInResult?.error) {
        setError("Account created but sign in failed. Please try signing in.");
        setLoading(false);
        return;
      }

      if (accountType === "recruiter") {
        router.push("/recruiter-pricing");
      } else {
        router.push("/dashboard");
      }

      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setLoading(true);
    await signIn("google", {
      callbackUrl: accountType === "recruiter" ? "/recruiter-pricing" : "/dashboard",
    });
  };

  const isRecruiter = accountType === "recruiter";

  const inputClass = (recruiter: boolean) =>
    `w-full rounded-xl border border-white/10 bg-slate-900/50 px-11 py-3 text-white placeholder-slate-500 outline-none transition ${
      recruiter
        ? "focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20"
        : "focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20"
    }`;

  return (
    <div className="w-full max-w-md">

      {/* Header */}
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-semibold text-white sm:text-4xl">
          Create your account
        </h1>
        <p className="mt-3 text-base text-slate-400">
          {isRecruiter ? "Start hiring smarter with AI" : "Start optimizing your career today"}
        </p>
      </div>

      {/* Toggle */}
      <div className="mb-6 flex rounded-2xl border border-white/10 bg-white/[0.03] p-1">
        <button
          type="button"
          onClick={() => setAccountType("jobseeker")}
          className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold transition-all ${
            !isRecruiter ? "bg-blue-600 text-white shadow-lg shadow-blue-700/25" : "text-slate-400 hover:text-white"
          }`}
        >
          <Briefcase className="h-4 w-4" />
          Job Seeker
        </button>
        <button
          type="button"
          onClick={() => setAccountType("recruiter")}
          className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold transition-all ${
            isRecruiter ? "bg-purple-600 text-white shadow-lg shadow-purple-700/25" : "text-slate-400 hover:text-white"
          }`}
        >
          <Building2 className="h-4 w-4" />
          Recruiter
        </button>
      </div>

      {/* Plan badge */}
      {isRecruiter && planParam && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-purple-500/20 bg-purple-500/10 px-4 py-3">
          <div className="h-2 w-2 rounded-full bg-purple-400 animate-pulse" />
          <p className="text-sm text-purple-300">
            Selected plan:{" "}
            <span className="font-semibold">
              {planParam.replace("RECRUITER_", "").charAt(0).toUpperCase() +
                planParam.replace("RECRUITER_", "").slice(1).toLowerCase()}
            </span>
          </p>
        </div>
      )}

      <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-8 backdrop-blur-xl">

        {/* Error */}
        {error && (
          <div className="mb-6 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Full Name */}
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">
              {isRecruiter ? "Your Full Name" : "Full Name"}
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className={inputClass(isRecruiter)}
                placeholder="John Doe"
              />
            </div>
          </div>

          {/* Company Name */}
          {isRecruiter && (
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">
                Company Name
              </label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  required={isRecruiter}
                  className={inputClass(true)}
                  placeholder="Acme Corp"
                />
              </div>
            </div>
          )}

          {/* Company Size + Industry */}
          {isRecruiter && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Company Size <span className="text-xs text-slate-500">(optional)</span>
                </label>
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500 pointer-events-none" />
                  <select
                    value={companySize}
                    onChange={(e) => setCompanySize(e.target.value)}
                    className="w-full appearance-none rounded-xl border border-white/10 bg-slate-900/50 pl-9 pr-8 py-3 text-sm text-white outline-none transition focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20"
                  >
                    <option value="" className="bg-slate-900">Select...</option>
                    {["1-10", "11-50", "51-200", "201-500", "500+"].map((s) => (
                      <option key={s} value={s} className="bg-slate-900">{s}</option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Industry <span className="text-xs text-slate-500">(optional)</span>
                </label>
                <div className="relative">
                  <Briefcase className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500 pointer-events-none" />
                  <select
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    className="w-full appearance-none rounded-xl border border-white/10 bg-slate-900/50 pl-9 pr-8 py-3 text-sm text-white outline-none transition focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20"
                  >
                    <option value="" className="bg-slate-900">Select...</option>
                    {["Technology", "Finance", "Healthcare", "Education", "Retail",
                      "Manufacturing", "Media", "Consulting", "Real Estate",
                      "NGO/Non-profit", "Government", "Other"].map((i) => (
                      <option key={i} value={i} className="bg-slate-900">{i}</option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                </div>
              </div>
            </div>
          )}

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
                className={inputClass(isRecruiter)}
                placeholder={isRecruiter ? "you@company.com" : "you@example.com"}
              />
            </div>
          </div>

          {/* Phone */}
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">
              Phone <span className="text-xs text-slate-500">(optional)</span>
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className={inputClass(isRecruiter)}
                placeholder="+234 XXX XXX XXXX"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                className={inputClass(isRecruiter)}
                placeholder="At least 8 characters"
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

          {/* Confirm Password */}
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">
              Confirm Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
              <input
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={8}
                className={inputClass(isRecruiter)}
                placeholder="Confirm your password"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition"
              >
                {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          {/* Terms */}
          <p className="text-xs text-slate-500">
            By creating an account, you agree to our{" "}
            <Link href="/terms" className="text-blue-400 hover:text-blue-300">Terms</Link>{" "}
            and{" "}
            <Link href="/privacy" className="text-blue-400 hover:text-blue-300">Privacy Policy</Link>.
          </p>

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
              <>
                {isRecruiter ? "Create Recruiter Account" : "Create Account"}
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>

          {isRecruiter && (
            <p className="text-center text-xs text-slate-500">
              You&apos;ll choose your plan after signing up
            </p>
          )}
        </form>

        {/* Divider */}
        <div className="my-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-white/5" />
          <span className="text-xs text-slate-500">or sign up with</span>
          <div className="h-px flex-1 bg-white/5" />
        </div>

        {/* Google */}
        <button
          onClick={handleGoogleSignUp}
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

        {/* Sign in link */}
        <p className="mt-6 text-center text-sm text-slate-400">
          Already have an account?{" "}
          <Link href="/signin" className="font-medium text-blue-400 transition hover:text-blue-300">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function SignUpPage() {
  return (
    <Suspense fallback={
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-slate-500" />
        </div>
      </div>
    }>
      <SignUpForm />
    </Suspense>
  );
}