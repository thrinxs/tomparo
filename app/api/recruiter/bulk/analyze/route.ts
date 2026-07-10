import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { analyzeRecruiterCV } from "@/lib/ai/recruiter-cv-analyzer";

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

    // ── CV limits ──
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

    // Reset monthly if needed
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

    const remaining = Math.max(0, limit - profile.cvsUsedThisMonth);

    const { selectedCVs, jobId } = await req.json();

    if (!selectedCVs || !Array.isArray(selectedCVs) || selectedCVs.length === 0) {
      return NextResponse.json(
        { error: "No CVs selected" },
        { status: 400 }
      );
    }

    if (selectedCVs.length > remaining) {
      return NextResponse.json(
        {
          error: `You can only analyse ${remaining} more CV${remaining !== 1 ? "s" : ""} this month.`,
          limitReached: true,
          remaining,
        },
        { status: 429 }
      );
    }

    // ── Analyse each selected CV ──
    const results: {
      fileName: string;
      success: boolean;
      candidateId?: string;
      analysis?: any;
      error?: string;
    }[] = [];

    for (const cv of selectedCVs) {
      try {
        const analysis = await analyzeRecruiterCV(cv.text);

        const candidate = await prisma.recruiterCandidate.create({
          data: {
            recruiterId: profile.id,
            jobId: jobId || null,
            fileName: cv.fileName,
            rawText: cv.text.slice(0, 50000),
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

        results.push({
          fileName: cv.fileName,
          success: true,
          candidateId: candidate.id,
          analysis,
        });
      } catch (err) {
        results.push({
          fileName: cv.fileName,
          success: false,
          error: "Analysis failed",
        });
      }
    }

    const successful = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;

    return NextResponse.json({
      success: true,
      results,
      summary: {
        total: selectedCVs.length,
        successful,
        failed,
      },
    });
  } catch (error) {
    console.error("Bulk analyze error:", error);
    return NextResponse.json(
      { error: "Failed to analyse CVs" },
      { status: 500 }
    );
  }
}
