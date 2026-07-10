import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/Footer";
import SessionProvider from "../components/SessionProvider";
import TawkChat from "../components/TawkChat";
import CookieBanner from "../components/CookieBanner";
import { Toaster } from "react-hot-toast";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TomParo — AI Career Assistant",
  description:
    "Get hired faster with AI-powered CV optimization, job matching, interview coaching, and skill gap analysis.",
  keywords:
    "CV builder, job application, AI career, interview preparation, skill gap analysis",
  openGraph: {
    title: "TomParo — AI Career Assistant",
    description:
      "Get hired faster with AI-powered CV optimization and job matching.",
    url: "https://tomparo.com",
    siteName: "TomParo",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-slate-950 text-white`}
      >
        <SessionProvider>
          <Navbar />
          {children}
          <Footer />
          <TawkChat />
          <CookieBanner />
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: "#1e293b",
                color: "#fff",
                border: "1px solid rgba(255,255,255,0.1)",
              },
            }}
          />
        </SessionProvider>
      </body>
    </html>
  );
}