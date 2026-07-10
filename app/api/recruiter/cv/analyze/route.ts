import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { analyzeRecruiterCV } from "@/lib/ai/recruiter-cv-analyzer";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity-log";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id as string;
    const role = (session.user as any).role as string;

    const profile = await prisma.recruiterProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      return NextResponse.json(
        { error: "Recruiter profile not found" },
        { status: 404 }
      );
    }

    const cvLimits: Record<string, number> = {
      FREE: 2,
      RECRUITER_STARTER: 20,
      RECRUITER_GROWTH: 50,
      RECRUITER_BUSINESS: 200,
      RECRUITER_ENTERPRISE: 500,
      RECRUITER_SCALE: 1000,
      RECRUITER_CUSTOM: 99999,
      ADMIN: 99999,
    };

    const limit = cvLimits[role] ?? 0;

    if (limit === 0) {
      return NextResponse.json(
        {
          error: "You need a recruiter plan to analyse CVs.",
          upgradeRequired: true,
        },
        { status: 403 }
      );
    }

    const now = new Date();
    const resetDate = new Date(profile.cvsResetDate);
    const monthDiff =
      (now.getFullYear() - resetDate.getFullYear()) * 12 +
      (now.getMonth() - resetDate.getMonth());

    if (monthDiff >= 1) {
      await prisma.recruiterProfile.update({
        where: { id: profile.id },
        data: { cvsUsedThisMonth: 0, cvsResetDate: now },
      });
      profile.cvsUsedThisMonth = 0;
    }

    if (profile.cvsUsedThisMonth >= limit) {
      return NextResponse.json(
        {
          error: `Monthly CV limit reached (${limit} CVs). Upgrade your plan for more.`,
          limitReached: true,
          used: profile.cvsUsedThisMonth,
          limit,
        },
        { status: 429 }
      );
    }

    const { resumeText, fileName, jobId } = await req.json();

    if (!resumeText || typeof resumeText !== "string") {
      return NextResponse.json(
        { error: "CV text is required" },
        { status: 400 }
      );
    }

    const cleaned = resumeText
      .replace(/\r\n/g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .replace(/[ \t]+/g, " ")
      .trim();

    if (cleaned.length < 100) {
      return NextResponse.json(
        { error: "CV is too short. Please provide more content." },
        { status: 400 }
      );
    }

    const analysis = await analyzeRecruiterCV(cleaned);

    const candidate = await prisma.recruiterCandidate.create({
      data: {
        recruiterId: profile.id,
        jobId: jobId || null,
        fileName: fileName || `CV - ${new Date().toLocaleDateString()}`,
        rawText: cleaned.slice(0, 50000),
        candidateName: analysis.candidateName || null,
        candidateEmail: analysis.candidateEmail || null,
        candidatePhone: analysis.candidatePhone || null,
        aiAnalysis: JSON.stringify(analysis),
        atsScore: analysis.atsScore || 0,
        status: "NEW",
      },
    });

    await prisma.recruiterProfile.update({
      where: { id: profile.id },
      data: { cvsUsedThisMonth: { increment: 1 } },
    });

    return NextResponse.json({
      success: true,
      candidateId: candidate.id,
      analysis,
      usage: {
        used: profile.cvsUsedThisMonth + 1,
        limit,
        remaining: limit - profile.cvsUsedThisMonth - 1,
      },
    });
  } catch (error) {
    console.error("Recruiter CV analysis error:", error);
    const message = error instanceof Error ? error.message : "Analysis failed";
    return NextResponse.json(
      { error: `Failed to analyse CV: ${message}` },
      { status: 500 }
    );
  }
}
