// app/success-stories/page.tsx
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Success Stories",
  description: "Real outcomes from TomParo users.",
};

export default function SuccessStoriesPage() {
  return (
    <main className="min-h-screen bg-background">
      <section className="mx-auto w-full max-w-4xl px-4 pb-16 pt-16">
        <div className="rounded-2xl border bg-card p-8">
          <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
            Success Stories
          </h1>
          <p className="mt-3 text-muted-foreground">
            Testimonials and case studies are coming soon.
          </p>
          <div className="mt-6 flex gap-3">
            <Link
              href="/pricing"
              className="inline-flex h-11 items-center justify-center rounded-xl bg-primary px-5 text-sm font-medium text-primary-foreground hover:opacity-90"
            >
              View Pricing
            </Link>
            <Link
              href="/contact"
              className="inline-flex h-11 items-center justify-center rounded-xl border px-5 text-sm font-medium hover:bg-accent"
            >
              Share Your Story
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}