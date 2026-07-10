// app/how-it-works/page.tsx
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "How It Works",
  description: "How TomParo helps you analyze, match, and apply faster.",
};

export default function HowItWorksPage() {
  return (
    <main className="min-h-screen bg-background">
      <section className="mx-auto w-full max-w-4xl px-4 pb-16 pt-16">
        <div className="rounded-2xl border bg-card p-8">
          <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
            How TomParo Works
          </h1>
          <p className="mt-3 text-muted-foreground">
            This page is coming online next. For now, you can explore the tools
            from your dashboard.
          </p>
          <div className="mt-6">
            <Link
              href="/dashboard"
              className="inline-flex h-11 items-center justify-center rounded-xl bg-primary px-5 text-sm font-medium text-primary-foreground hover:opacity-90"
            >
              Go to Dashboard
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}