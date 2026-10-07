import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: "TomParo Admin",
    template: "%s | TomParo Admin",
  },
  description: "TomParo Platform Administration",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/images/favicon_io/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/images/favicon_io/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/images/favicon_io/favicon-48x48.png", sizes: "48x48", type: "image/png" },
    ],
    apple: "/images/favicon_io/apple-touch-icon.png",
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
