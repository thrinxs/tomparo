export type UserRole =
  | "GUEST"
  | "FREE"
  | "PREMIUM"
  | "SUPPORT"
  | "STAFF"
  | "ADMIN";

export type SubscriptionPlan = "monthly" | "yearly";

export type SubscriptionStatus =
  | "ACTIVE"
  | "CANCELLED"
  | "EXPIRED"
  | "PAST_DUE";

export interface User {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  image: string | null;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserSession {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  role: UserRole;
  isPremium: boolean;
  isAdmin: boolean;
  isStaff: boolean;
  isSupport: boolean;
}

export interface Subscription {
  id: string;
  userId: string;
  paystackCustomerId: string | null;
  paystackPlanCode: string | null;
  paystackSubCode: string | null;
  status: SubscriptionStatus;
  plan: SubscriptionPlan;
  amount: number | null;
  currentPeriodStart: Date | null;
  currentPeriodEnd: Date | null;
}

export interface UsageLimit {
  action: string;
  allowed: boolean;
  remaining: number;
  limit: number | "unlimited";
}

export const DAILY_LIMITS: Record<string, Record<string, number>> = {
  GUEST: {
    resumeAnalysis: 2,
    jobAnalysis: 3,
    coverLetter: 2,
    emailGeneration: 2,
    skillGap: 1,
    interview: 0,
    careerAI: 0,
    aiChat: 0,
  },
  FREE: {
    resumeAnalysis: 5,
    jobAnalysis: 10,
    coverLetter: 5,
    emailGeneration: 5,
    skillGap: 3,
    interview: 0,
    careerAI: 0,
    aiChat: 0,
  },
  PREMIUM: {
    resumeAnalysis: 999,
    jobAnalysis: 999,
    coverLetter: 999,
    emailGeneration: 999,
    skillGap: 999,
    interview: 999,
    careerAI: 999,
    aiChat: 999,
  },
};