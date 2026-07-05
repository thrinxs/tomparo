import Link from "next/link";


import Image from "next/image";
import Logo from "@/components/Logo";
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950">
      {/* Background glow */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute -left-32 -top-32 h-[500px] w-[500px] rounded-full bg-blue-600/10 blur-[120px]" />
        <div className="absolute -right-32 top-1/2 h-[500px] w-[500px] rounded-full bg-cyan-500/10 blur-[120px]" />
      </div>

      {/* Minimal header with logo */}
      <header className="relative z-10 border-b border-white/5">
        <div className="mx-auto flex h-24 max-w-6xl items-center justify-between px-6">
        <Logo size="lg" />

          <Link
            href="/"
            className="text-sm text-slate-400 transition hover:text-white"
          >
            ← Back to home
          </Link>
        </div>
      </header>

      {/* Main content */}
      <main className="relative z-10 flex min-h-[calc(100vh-6rem)] items-center justify-center px-6 py-12">
        {children}
      </main>
    </div>
  );
}