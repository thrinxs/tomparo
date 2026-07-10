import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "./prisma";
import bcrypt from "bcryptjs";

const recruiterRoles = [
  "RECRUITER_STARTER",
  "RECRUITER_GROWTH",
  "RECRUITER_BUSINESS",
  "RECRUITER_ENTERPRISE",
  "RECRUITER_SCALE",
  "RECRUITER_CUSTOM",
];

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as any,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "placeholder",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "placeholder",
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password are required");
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user || !user.password) {
          throw new Error("No account found with this email");
        }

        const isValid = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isValid) {
          throw new Error("Incorrect password");
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      // ── Always fetch fresh data from DB on every JWT refresh ──
      // This ensures role + isRecruiter is always up to date
      const emailToLookup = (user?.email || token?.email) as string | undefined;

      if (emailToLookup) {
        const dbUser = await prisma.user.findUnique({
          where: { email: emailToLookup },
          include: {
            subscription: true,
            recruiterProfile: true,
          },
        });

        if (dbUser) {
          token.id = dbUser.id;
          token.role = dbUser.role || "FREE";

          // Consumer flags
          token.isPremium = dbUser.role === "PREMIUM";

          // Staff flags
          token.isAdmin = dbUser.role === "ADMIN";
          token.isStaff = dbUser.role === "STAFF";
          token.isSupport = dbUser.role === "SUPPORT";

          // Recruiter flags
          token.isRecruiter =
            recruiterRoles.includes(dbUser.role || "") ||
            !!dbUser.recruiterProfile;
          token.recruiterProfileId = dbUser.recruiterProfile?.id ?? null;
          token.companyName = dbUser.recruiterProfile?.companyName ?? null;
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;

        // Consumer flags
        (session.user as any).isPremium = token.isPremium;

        // Staff flags
        (session.user as any).isAdmin = token.isAdmin;
        (session.user as any).isStaff = token.isStaff;
        (session.user as any).isSupport = token.isSupport;

        // Recruiter flags
        (session.user as any).isRecruiter = token.isRecruiter;
        (session.user as any).recruiterProfileId = token.recruiterProfileId;
        (session.user as any).companyName = token.companyName;
      }
      return session;
    },
  },
  pages: {
    signIn: "/signin",
    error: "/signin",
  },
};