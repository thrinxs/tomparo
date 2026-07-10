// app/not-found.tsx
import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-screen bg-background">
      <section className="mx-auto w-full max-w-3xl px-4 pb-16 pt-20">
        <div className="rounded-2xl border bg-card p-8">
          <p className="text-sm text-muted-foreground">404</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">
            Page not found
          </h1>
          <p className="mt-3 text-muted-foreground">
            The page you’re looking for doesn’t exist (or was moved). Use the
            links below to get back on track.
          </p>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/"
              className="inline-flex h-11 items-center justify-center rounded-xl bg-primary px-5 text-sm font-medium text-primary-foreground hover:opacity-90"
            >
              Go Home
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex h-11 items-center justify-center rounded-xl border px-5 text-sm font-medium hover:bg-accent"
            >
              Dashboard
            </Link>
            <Link
              href="/contact"
              className="inline-flex h-11 items-center justify-center rounded-xl border px-5 text-sm font-medium hover:bg-accent"
            >
              Contact Support
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}