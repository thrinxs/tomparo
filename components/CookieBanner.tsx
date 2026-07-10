"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Cookie, X, Check, Settings } from "lucide-react";

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("tomparo-cookie-consent");
    if (!consent) {
      setTimeout(() => setVisible(true), 1500);
    }
  }, []);

  const accept = () => {
    localStorage.setItem("tomparo-cookie-consent", "accepted");
    setVisible(false);
  };

  const reject = () => {
    localStorage.setItem("tomparo-cookie-consent", "rejected");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6">
      <div className="max-w-4xl mx-auto rounded-2xl border border-white/10 bg-slate-900/95 backdrop-blur-xl shadow-2xl p-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">

          {/* Icon */}
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center shrink-0">
            <Cookie className="w-5 h-5 text-amber-400" />
          </div>

          {/* Text */}
          <div className="flex-1">
            <p className="text-sm font-semibold text-white mb-1">
              We use cookies 🍪
            </p>
            <p className="text-xs text-slate-400 leading-relaxed">
              TomParo uses cookies to improve your experience, remember your preferences,
              and analyse site traffic. By clicking &quot;Accept&quot;, you agree to our use of cookies.{" "}
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="text-blue-400 hover:text-blue-300 underline transition"
              >
                {showDetails ? "Hide details" : "Learn more"}
              </button>
            </p>

            {/* Cookie details */}
            {showDetails && (
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2">
                {[
                  { name: "Essential", desc: "Required for the site to work. Cannot be disabled.", always: true },
                  { name: "Functional", desc: "Remember your preferences and settings.", always: false },
                  { name: "Analytics", desc: "Help us understand how you use TomParo.", always: false },
                ].map((cookie) => (
                  <div
                    key={cookie.name}
                    className="rounded-xl border border-white/5 bg-white/[0.02] p-3"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-xs font-semibold text-white">{cookie.name}</p>
                      {cookie.always
                        ? <span className="text-xs text-emerald-400">Always on</span>
                        : <span className="text-xs text-slate-500">Optional</span>
                      }
                    </div>
                    <p className="text-xs text-slate-500">{cookie.desc}</p>
                  </div>
                ))}
              </div>
            )}

            <p className="text-xs text-slate-600 mt-2">
              Read our{" "}
              <Link href="/privacy" className="text-blue-400 hover:text-blue-300 transition">
                Privacy Policy
              </Link>{" "}
              and{" "}
              <Link href="/terms" className="text-blue-400 hover:text-blue-300 transition">
                Terms of Service
              </Link>
            </p>
          </div>

          {/* Buttons */}
          <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
            <button
              onClick={reject}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-white/10 bg-white/5 text-sm text-slate-300 hover:bg-white/10 transition"
            >
              <X className="w-3.5 h-3.5" />
              Reject
            </button>
            <button
              onClick={accept}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-500 transition"
            >
              <Check className="w-3.5 h-3.5" />
              Accept All
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}