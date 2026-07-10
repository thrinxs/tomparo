"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";

function AcceptInviteInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");
  const [companyName, setCompanyName] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Invalid invite link — no token found.");
      return;
    }

    const acceptInvite = async () => {
      try {
        const res = await fetch("/api/recruiter/team/invite/accept", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
        const data = await res.json();
        if (!res.ok) {
          setStatus("error");
          setMessage(data.error || "Failed to accept invite");
        } else {
          setStatus("success");
          setCompanyName(data.companyName);
          setTimeout(() => router.push("/recruiter"), 3000);
        }
      } catch {
        setStatus("error");
        setMessage("Something went wrong. Please try again.");
      }
    };

    acceptInvite();
  }, [token, router]);

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-6">
      <div className="max-w-md w-full rounded-3xl border border-white/10 bg-white/[0.02] p-10 text-center">
        {status === "loading" && (
          <>
            <Loader2 className="w-12 h-12 text-purple-400 animate-spin mx-auto mb-4" />
            <p className="text-white font-semibold text-lg">Accepting your invite...</p>
          </>
        )}
        {status === "success" && (
          <>
            <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
            <p className="text-white font-bold text-xl mb-2">You're in! 🎉</p>
            <p className="text-slate-400">
              You've joined <span className="text-white font-semibold">{companyName}</span>'s recruitment team.
            </p>
            <p className="text-slate-500 text-sm mt-3">Redirecting to dashboard...</p>
          </>
        )}
        {status === "error" && (
          <>
            <XCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <p className="text-white font-bold text-xl mb-2">Invite Failed</p>
            <p className="text-slate-400">{message}</p>
          </>
        )}
      </div>
    </div>
  );
}

export default function AcceptInvitePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-slate-500" />
      </div>
    }>
      <AcceptInviteInner />
    </Suspense>
  );
}
