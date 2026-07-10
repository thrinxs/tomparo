import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity-log";
import {
  sendInterviewInvite,
  sendRejectionEmail,
  sendOfferEmail,
  sendFollowUpEmail,
  sendWaitlistEmail,
} from "@/lib/email";
import { generateRecruiterEmail } from "@/lib/ai/recruiter-email-generator";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id as string;
    const role = (session.user as any).role as string;
    const recruiterName = (session.user as any).name as string;

    // ── Check plan (Business+ only) ──
    const bulkAllowed = [
      "RECRUITER_BUSINESS",
      "RECRUITER_ENTERPRISE",
      "RECRUITER_SCALE",
      "RECRUITER_CUSTOM",
      "ADMIN",
    ];

    if (!bulkAllowed.includes(role)) {
      return NextResponse.json(
        {
          error: "Bulk email sending requires Business plan or higher.",
          upgradeRequired: true,
        },
        { status: 403 }
      );
    }

    const profile = await prisma.recruiterProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      return NextResponse.json(
        { error: "Recruiter profile not found" },
        { status: 404 }
      );
    }

    const { type, candidateIds, jobTitle, customMessage } = await req.json();

    if (!type || !candidateIds || !Array.isArray(candidateIds) || candidateIds.length === 0) {
      return NextResponse.json(
        { error: "Email type and candidate IDs are required" },
        { status: 400 }
      );
    }

    if (candidateIds.length > 50) {
      return NextResponse.json(
        { error: "Maximum 50 candidates per bulk send" },
        { status: 400 }
      );
    }

    // ── Fetch all candidates ──
    const candidates = await prisma.recruiterCandidate.findMany({
      where: {
        id: { in: candidateIds },
        recruiterId: profile.id,
      },
      include: { job: { select: { title: true } } },
    });

    const baseUrl = process.env.NEXTAUTH_URL || "https://www.tomparo.com";
    const replyTo = profile.replyToEmail || undefined;

    const results: {
      candidateId: string;
      candidateName: string;
      email: string;
      success: boolean;
      error?: string;
    }[] = [];

    // ── Send email to each candidate ──
    for (const candidate of candidates) {
      if (!candidate.candidateEmail) {
        results.push({
          candidateId: candidate.id,
          candidateName: candidate.candidateName || "Unknown",
          email: "no email",
          success: false,
          error: "No email address",
        });
        continue;
      }

      try {
        // AI generate personalized message
        const aiResult = customMessage
          ? { subject: `${type.replace("_", " ")} — ${jobTitle || candidate.job?.title || "Position"}`, message: customMessage }
          : await generateRecruiterEmail({
              type: type as any,
              candidateName: candidate.candidateName || "Candidate",
              jobTitle: jobTitle || candidate.job?.title || "the position",
              companyName: profile.companyName,
            });

        const subject = aiResult.subject || `${type} — ${profile.companyName}`;
        const message = aiResult.message || customMessage || "";

        // Create email record
        const emailRecord = await prisma.recruiterEmail.create({
          data: {
            recruiterId: profile.id,
            candidateId: candidate.id,
            type,
            to: candidate.candidateEmail,
            subject,
            message,
            replyTo: replyTo || null,
            ccSelf: false,
            status: "sent",
          },
        });

        const trackingPixelUrl = `${baseUrl}/api/track/email-open/${emailRecord.id}`;

        const baseOpts = {
          to: candidate.candidateEmail,
          candidateName: candidate.candidateName || "Candidate",
          companyName: profile.companyName,
          jobTitle: jobTitle || candidate.job?.title || "the position",
          message,
          recruiterName: recruiterName || profile.companyName,
          replyTo,
          trackingPixelUrl,
        };

        let sendResult: any;
        switch (type) {
          case "interview_invite":
            sendResult = await sendInterviewInvite(baseOpts);
            break;
          case "rejection":
            sendResult = await sendRejectionEmail(baseOpts);
            break;
          case "offer":
            sendResult = await sendOfferEmail(baseOpts);
            break;
          case "followup":
            sendResult = await sendFollowUpEmail(baseOpts);
            break;
          case "waitlist":
            sendResult = await sendWaitlistEmail(baseOpts);
            break;
          default:
            throw new Error("Invalid email type");
        }

        await prisma.recruiterEmail.update({
          where: { id: emailRecord.id },
          data: {
            resendId: sendResult?.data?.id || null,
            status: sendResult?.error ? "failed" : "sent",
          },
        });

        results.push({
          candidateId: candidate.id,
          candidateName: candidate.candidateName || "Unknown",
          email: candidate.candidateEmail,
          success: true,
        });

        // Small delay to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 200));
      } catch (err: any) {
        results.push({
          candidateId: candidate.id,
          candidateName: candidate.candidateName || "Unknown",
          email: candidate.candidateEmail,
          success: false,
          error: err.message || "Failed to send",
        });
      }
    }

    const successful = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;

    await logActivity({
      recruiterId: profile.id,
      type: "BULK_EMAIL_SENT",
      title: "Bulk email sent",
      description: `${successful} of ${results.length} emails delivered`,
      meta: { type, total: results.length, successful, failed },
    });

    return NextResponse.json({
      success: true,
      results,
      summary: { total: results.length, successful, failed },
    });
  } catch (error) {
    console.error("Bulk email error:", error);
    return NextResponse.json(
      { error: "Failed to send bulk emails" },
      { status: 500 }
    );
  }
}
