"use client";

import { useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import {
  Mail,
  MessageSquare,
  Send,
  Loader2,
  Sparkles,
  Clock,
  MapPin,
  Globe,
} from "lucide-react";

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // For now, just show a success message
    // TODO: Integrate with email service (Resend, SendGrid, etc.)
    setTimeout(() => {
      toast.success("Thanks for reaching out! We'll get back to you soon.");
      setName("");
      setEmail("");
      setSubject("");
      setMessage("");
      setLoading(false);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-slate-950 pb-24 pt-32">
      <Toaster position="top-right" />

      <div className="mx-auto max-w-6xl px-6">
        {/* Header */}
        <div className="text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-4 py-2 text-sm text-blue-400">
            <MessageSquare className="h-4 w-4" />
            Get in touch
          </div>
          <h1 className="text-4xl font-bold text-white sm:text-5xl">
            We'd love to{" "}
            <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              hear from you
            </span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-400">
            Have a question, feedback, or partnership idea? Send us a message.
          </p>
        </div>

        {/* Contact Info + Form Grid */}
        <div className="mt-16 grid gap-8 lg:grid-cols-3">
          {/* Contact Info */}
          <div className="space-y-6 lg:col-span-1">
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10">
                <Mail className="h-5 w-5 text-blue-400" />
              </div>
              <h3 className="font-semibold text-white">Email Us</h3>
              <p className="mt-1 text-sm text-slate-400">
                For general inquiries
              </p>
              <a
                href="mailto:tomparo.biz@gmail.com"
                className="mt-3 block text-sm font-medium text-blue-400 hover:text-blue-300"
              >
                tomparo.biz@gmail.com
              </a>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10">
                <Clock className="h-5 w-5 text-emerald-400" />
              </div>
              <h3 className="font-semibold text-white">Response Time</h3>
              <p className="mt-1 text-sm text-slate-400">Typically within</p>
              <p className="mt-3 text-sm font-medium text-emerald-400">
                24-48 hours
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Premium users get priority support
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10">
                <MapPin className="h-5 w-5 text-amber-400" />
              </div>
              <h3 className="font-semibold text-white">Location</h3>
              <p className="mt-1 text-sm text-slate-400">Based in</p>
              <p className="mt-3 text-sm font-medium text-amber-400">
                🇳🇬 Nigeria
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Serving customers worldwide
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10">
                <Globe className="h-5 w-5 text-purple-400" />
              </div>
              <h3 className="font-semibold text-white">Company</h3>
              <p className="mt-1 text-sm text-slate-400">Built by</p>
              <a
                href="https://thrinxs.com"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 block text-sm font-medium text-purple-400 hover:text-purple-300"
              >
                Thrinxs →
              </a>
            </div>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-2">
            <form
              onSubmit={handleSubmit}
              className="rounded-3xl border border-white/10 bg-white/[0.02] p-8 backdrop-blur-xl"
            >
              <div className="mb-6">
                <h3 className="text-xl font-semibold text-white">
                  Send us a message
                </h3>
                <p className="mt-1 text-sm text-slate-400">
                  Fill out the form below and we'll respond soon
                </p>
              </div>

              <div className="space-y-5">
                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-300">
                      Your Name
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      placeholder="John Doe"
                      className="w-full rounded-xl border border-white/10 bg-slate-900/50 px-4 py-3 text-white placeholder-slate-500 outline-none transition focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-300">
                      Email
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      placeholder="you@example.com"
                      className="w-full rounded-xl border border-white/10 bg-slate-900/50 px-4 py-3 text-white placeholder-slate-500 outline-none transition focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">
                    Subject
                  </label>
                  <select
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    required
                    className="w-full rounded-xl border border-white/10 bg-slate-900/50 px-4 py-3 text-white outline-none transition focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value="">Select a subject</option>
                    <option value="general">General Inquiry</option>
                    <option value="support">Technical Support</option>
                    <option value="billing">Billing Question</option>
                    <option value="feedback">Product Feedback</option>
                    <option value="partnership">Partnership</option>
                    <option value="bug">Report a Bug</option>
                    <option value="feature">Feature Request</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">
                    Message
                  </label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    required
                    rows={6}
                    placeholder="Tell us what's on your mind..."
                    className="w-full resize-none rounded-xl border border-white/10 bg-slate-900/50 px-4 py-3 text-white placeholder-slate-500 outline-none transition focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 px-6 py-3.5 text-base font-medium text-white shadow-lg shadow-blue-700/25 transition hover:from-blue-500 hover:to-cyan-500 disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="h-5 w-5" />
                      Send Message
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Alternative Contact Methods */}
        <div className="mt-16 rounded-3xl border border-white/10 bg-gradient-to-br from-blue-500/10 to-cyan-500/5 p-8 text-center">
          <Sparkles className="mx-auto mb-4 h-8 w-8 text-blue-400" />
          <h3 className="text-xl font-semibold text-white">
            Need faster support?
          </h3>
          <p className="mx-auto mt-2 max-w-lg text-slate-400">
            Premium users get priority support with response times under 12
            hours.
          </p>
        </div>
      </div>
    </div>
  );
}