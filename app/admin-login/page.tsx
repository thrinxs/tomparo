"use client";

import { useState } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Shield, Lock, Mail, Eye, EyeOff, Loader2, KeyRound } from "lucide-react";
import Logo from "@/components/Logo";

export default function AdminLoginPage() {
  const router = useRouter();
  const { data: session } = useSession();

  const [step, setStep] = useState<"credentials" | "code">(
    session?.user ? "code" : "credentials"
  );

  // Step 1 fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Step 2 fields
  const [code, setCode] = useState("");
  const [showCode, setShowCode] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // ── Step 1: Sign in with credentials ──
  const handleCredentials = async (e: React.FormEvent) => {
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
        setError("Invalid email or password");
        return;
      }

      // Signed in — now need to verify admin code
      setStep("code");
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  };

  // ── Step 2: Verify admin code ──
  const handleCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/admin/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });

      const data = await res.json();

      if (!data.success) {
        setError(data.error || "Invalid admin code");
        return;
      }

      // Both checks passed — go to admin dashboard
      window.location.href = "/admin";
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md space-y-6">

        {/* Logo + header */}
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <Logo size="lg" href="https://www.tomparo.com" />
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-red-500/20 bg-red-500/10 px-4 py-1.5">
            <Shield className="h-4 w-4 text-red-400" />
            <span className="text-sm font-medium text-red-400">
              Admin Access Only
            </span>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">
              {step === "credentials" ? "Admin Sign In" : "Verify Admin Code"}
            </h1>
            <p className="mt-1 text-sm text-slate-400">
              {step === "credentials"
                ? "Sign in with your admin account credentials"
                : "Enter your secret admin access code to continue"}
            </p>
          </div>
        </div>

        {/* Progress indicators */}
        <div className="flex items-center gap-3">
          <div className={`flex-1 h-1 rounded-full transition-all ${step === "credentials" ? "bg-red-500" : "bg-emerald-500"}`} />
          <div className={`flex-1 h-1 rounded-full transition-all ${step === "code" ? "bg-red-500" : "bg-white/10"}`} />
        </div>
        <div className="flex justify-between text-xs text-slate-500">
          <span className={step === "credentials" ? "text-red-400" : "text-emerald-400"}>
            1. Account credentials
          </span>
          <span className={step === "code" ? "text-red-400" : ""}>
            2. Admin access code
          </span>
        </div>

        {/* Card */}
        <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-8 backdrop-blur-xl">

          {error && (
            <div className="mb-5 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}

          {/* Step 1 — credentials */}
          {step === "credentials" && (
            <form onSubmit={handleCredentials} className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="admin@tomparo.com"
                    className="w-full rounded-xl border border-white/10 bg-slate-900/50 px-11 py-3 text-white placeholder-slate-500 outline-none transition focus:border-red-500/50 focus:ring-2 focus:ring-red-500/20"
                  />
                </div>
              </div>

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
                    placeholder="Your account password"
                    className="w-full rounded-xl border border-white/10 bg-slate-900/50 px-11 py-3 text-white placeholder-slate-500 outline-none transition focus:border-red-500/50 focus:ring-2 focus:ring-red-500/20"
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

              <button
                type="submit"
                disabled={loading}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-3.5 text-sm font-medium text-white shadow-lg shadow-red-700/25 transition hover:bg-red-500 disabled:opacity-50"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : (
                  <>
                    <Shield className="h-4 w-4" />
                    Continue to Step 2
                  </>
                )}
              </button>
            </form>
          )}

          {/* Step 2 — admin code */}
          {step === "code" && (
            <form onSubmit={handleCode} className="space-y-4">
              <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 text-sm text-amber-400">
                ✓ Account verified. Now enter your secret admin code.
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Admin Access Code
                </label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
                  <input
                    type={showCode ? "text" : "password"}
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    required
                    placeholder="Enter your admin code"
                    className="w-full rounded-xl border border-white/10 bg-slate-900/50 px-11 py-3 text-white placeholder-slate-500 outline-none transition focus:border-red-500/50 focus:ring-2 focus:ring-red-500/20 tracking-widest"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCode(!showCode)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition"
                  >
                    {showCode ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  This code is separate from your password. Contact the platform owner if you don't have it.
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-3.5 text-sm font-medium text-white shadow-lg shadow-red-700/25 transition hover:bg-red-500 disabled:opacity-50"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : (
                  <>
                    <Shield className="h-4 w-4" />
                    Access Admin Dashboard
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => { setStep("credentials"); setError(""); setCode(""); }}
                className="w-full text-center text-xs text-slate-500 hover:text-slate-300 transition"
              >
                ← Back to credentials
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-xs text-slate-600">
          This portal is restricted to TomParo administrators only.
          Unauthorized access attempts are logged.
        </p>
      </div>
    </div>
  );
}
