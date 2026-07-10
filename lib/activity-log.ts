import { prisma } from "@/lib/prisma";

export type ActivityType =
  | "CV_UPLOADED"
  | "CV_BULK_UPLOADED"
  | "JOB_CREATED"
  | "JOB_UPDATED"
  | "JOB_CLOSED"
  | "APPLICATION_RECEIVED"
  | "CANDIDATE_STATUS_CHANGED"
  | "EMAIL_SENT"
  | "BULK_EMAIL_SENT"
  | "TEAM_MEMBER_INVITED"
  | "TEAM_MEMBER_JOINED"
  | "TEAM_MEMBER_REMOVED"
  | "SETTINGS_UPDATED";

interface LogActivityOptions {
  recruiterId: string;
  type: ActivityType;
  title: string;
  description?: string;
  meta?: Record<string, any>;
}

export async function logActivity({
  recruiterId,
  type,
  title,
  description,
  meta,
}: LogActivityOptions) {
  try {
    await prisma.recruiterActivityLog.create({
      data: {
        recruiterId,
        type,
        title,
        description: description || null,
        meta: meta ? JSON.stringify(meta) : null,
      },
    });
  } catch {
    // Silently fail — never break main flow for logging errors
  }
}
