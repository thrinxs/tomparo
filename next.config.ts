import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
  serverExternalPackages: [
    "pdf2json",
    "mammoth",
    "@prisma/client",
    "@prisma/adapter-libsql",
  ],
};

export default nextConfig;