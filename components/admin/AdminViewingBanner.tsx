"use client";

import Link from "next/link";
import { Shield, X } from "lucide-react";
import { useState } from "react";

interface Props {
  dashboardType: "jobseeker" | "recruiter";
}

export default function AdminViewingBanner({ dashboardType }: Props) {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  return (
    <div className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 w-full max-w-2xl px-4">
      <div className="flex items-center justify-between gap-4 rounded-2xl border border-red-500/30 bg-red-950/90 px-5 py-3 shadow-2xl backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-500/20">
            <Shield className="h-4 w-4 text-red-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">
              Admin Preview Mode —{" "}
              {dashboardType === "jobseeker"
                ? "Job Seeker Dashboard"
                : "Recruiter Dashboard"}
            </p>
            <p className="text-xs text-red-300">
              You are viewing this as admin. All features are unlocked for you.
              Usage is not tracked.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Link
            href="/admin"
            className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-300 hover:bg-red-500/20 transition"
          >
            Back to Admin
          </Link>
          <button
            onClick={() => setDismissed(true)}
            className="text-red-400 hover:text-red-300 transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
