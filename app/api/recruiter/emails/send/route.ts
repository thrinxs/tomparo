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

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id as string;
    const recruiterName = (session.user as any).name as string;

    const profile = await prisma.recruiterProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      return NextResponse.json(
        { error: "Recruiter profile not found" },
        { status: 404 }
      );
    }

    const {
      type,
      candidateId,
      to,
      candidateName,
      jobTitle,
      message,
      subject,
      ccSelf,
      interviewDate,
      interviewType,
      interviewLink,
      salary,
      startDate,
      attachment,
    } = await req.json();

    if (!type || !to || !candidateName || !jobTitle || !message || !subject) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const replyTo = profile.replyToEmail || undefined;
    const cc = ccSelf && profile.replyToEmail ? [profile.replyToEmail] : undefined;

    // ── Build attachments ──
    const attachments = attachment ? [{
      filename: attachment.filename,
      content: Buffer.from(attachment.content, "base64"),
      contentType: attachment.contentType,
    }] : undefined;

    // ── Create email record first to get ID for tracking pixel ──
    const emailRecord = await prisma.recruiterEmail.create({
      data: {
        recruiterId: profile.id,
        candidateId: candidateId || null,
        type,
        to,
        subject,
        message,
        replyTo: replyTo || null,
        ccSelf: !!ccSelf,
        hasAttachment: !!attachment,
        attachmentName: attachment?.filename || null,
        status: "sent",
      },
    });

    // ── Build tracking pixel URL ──
    const baseUrl = process.env.NEXTAUTH_URL || "https://www.tomparo.com";
    const trackingPixelUrl = `${baseUrl}/api/track/email-open/${emailRecord.id}`;

    const baseOpts = {
      to,
      candidateName,
      companyName: profile.companyName,
      jobTitle,
      message,
      recruiterName: recruiterName || profile.companyName,
      replyTo,
      cc,
      attachments,
      trackingPixelUrl,
    };

    // ── Send email ──
    let result: any;

    switch (type) {
      case "interview_invite":
        result = await sendInterviewInvite({
          ...baseOpts,
          interviewDate,
          interviewType,
          interviewLink,
        });
        break;
      case "rejection":
        result = await sendRejectionEmail(baseOpts);
        break;
      case "offer":
        result = await sendOfferEmail({ ...baseOpts, salary, startDate });
        break;
      case "followup":
        result = await sendFollowUpEmail(baseOpts);
        break;
      case "waitlist":
        result = await sendWaitlistEmail(baseOpts);
        break;
      default:
        return NextResponse.json(
          { error: "Invalid email type" },
          { status: 400 }
        );
    }

    // ── Update record with Resend ID ──
    await prisma.recruiterEmail.update({
      where: { id: emailRecord.id },
      data: {
        resendId: result?.data?.id || null,
        status: result?.error ? "failed" : "sent",
      },
    });

    await logActivity({
      recruiterId: profile.id,
      type: "EMAIL_SENT",
      title: "Email sent to candidate",
      description: `${type} → ${to}`,
      meta: { type, to, candidateName, jobTitle, subject },
    });

    return NextResponse.json({
      success: true,
      emailId: emailRecord.id,
      result,
    });
  } catch (error) {
    console.error("Send email error:", error);
    return NextResponse.json(
      { error: "Failed to send email" },
      { status: 500 }
    );
  }
}
