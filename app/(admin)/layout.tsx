import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "TomParo Admin",
  description: "TomParo Platform Administration",
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
  },
};

export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
