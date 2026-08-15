import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { analyzeRecruiterCV } from "@/lib/ai/recruiter-cv-analyzer";
import { analyzeCvCredibility } from "@/lib/ai/cv-credibility-analyzer";
import { uploadCV } from "@/lib/supabase-storage";

const CV_LIMITS: Record<string, number> = {
  FREE: 2,
  RECRUITER_STARTER: 20,
  RECRUITER_GROWTH: 50,
  RECRUITER_BUSINESS: 200,
  RECRUITER_ENTERPRISE: 500,
  RECRUITER_SCALE: 1000,
  RECRUITER_CUSTOM: 99999,
  ADMIN: 99999,
};

const VERIFICATION_PLANS = [
  "RECRUITER_BUSINESS",
  "RECRUITER_ENTERPRISE",
  "RECRUITER_SCALE",
  "RECRUITER_CUSTOM",
  "ADMIN",
];

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userId = (session.user as any).id as string;
    const role   = (session.user as any).role as string;

    const profile = await prisma.recruiterProfile.findUnique({ where: { userId } });
    if (!profile) return NextResponse.json({ error: "Recruiter profile not found" }, { status: 404 });

    const limit = CV_LIMITS[role] ?? 0;

    // Reset monthly if needed
    const now       = new Date();
    const resetDate = new Date(profile.cvsResetDate);
    const monthDiff = (now.getFullYear() - resetDate.getFullYear()) * 12 + (now.getMonth() - resetDate.getMonth());
    if (monthDiff >= 1) {
      await prisma.recruiterProfile.update({ where: { id: profile.id }, data: { cvsUsedThisMonth: 0, cvsResetDate: now } });
      profile.cvsUsedThisMonth = 0;
    }

    const remaining = Math.max(0, limit - profile.cvsUsedThisMonth);

    const { selectedCVs, jobId, jobContext } = await req.json();

    if (!selectedCVs || !Array.isArray(selectedCVs) || selectedCVs.length === 0) {
      return NextResponse.json({ error: "No CVs selected" }, { status: 400 });
    }

    if (selectedCVs.length > remaining) {
      return NextResponse.json({
        error: `You can only analyse ${remaining} more CV${remaining !== 1 ? "s" : ""} this month.`,
        limitReached: true, remaining,
      }, { status: 429 });
    }

    const results: {
      fileName: string;
      success: boolean;
      candidateId?: string;
      analysis?: any;
      verification?: any;
      error?: string;
    }[] = [];

    const runVerification = VERIFICATION_PLANS.includes(role);

    for (const cv of selectedCVs) {
      try {
        const analysis = await analyzeRecruiterCV(cv.text, jobContext || undefined);

        // Store raw text as file in Supabase
        let cvFileUrl: string | null = null;
        try {
          const textBuffer = Buffer.from(cv.text, "utf-8");
          cvFileUrl = await uploadCV(textBuffer, `${cv.fileName}.txt`, "text/plain", `recruiter/${profile.id}/bulk`);
        } catch { /* silently fail */ }

        const candidate = await prisma.recruiterCandidate.create({
          data: {
            recruiterId:    profile.id,
            jobId:          jobId || null,
            fileName:       cv.fileName,
            rawText:        cv.text.slice(0, 50000),
            cvFileUrl:      cvFileUrl,
            candidateName:  analysis.candidateName  || null,
            candidateEmail: analysis.candidateEmail || null,
            candidatePhone: analysis.candidatePhone || null,
            aiAnalysis:     JSON.stringify(analysis),
            atsScore:       analysis.atsScore || 0,
            status:         "NEW",
          },
        });

        await prisma.recruiterProfile.update({
          where: { id: profile.id },
          data: { cvsUsedThisMonth: { increment: 1 } },
        });

        // Run credibility analysis for Business+ plans
        let verification: any = null;
        if (runVerification) {
          try {
            const credibility = await analyzeCvCredibility(
              cv.text,
              analysis.candidateName || "Unknown",
              analysis.atsScore || 0
            );

            const overallTrustScore = Math.round(
              ((analysis.atsScore || 0) * 0.6) + (credibility.credibilityScore * 0.4)
            );

            const vRecord = await prisma.cvVerification.create({
              data: {
                candidateId:      candidate.id,
                recruiterId:      profile.id,
                credibilityScore: credibility.credibilityScore,
                flags:            JSON.stringify(credibility.flags),
                overallTrustScore,
              },
            });

            for (const entity of credibility.verifiableEntities) {
              await prisma.cvVerifiableEntity.create({
                data: {
                  verificationId:  vRecord.id,
                  candidateId:     candidate.id,
                  recruiterId:     profile.id,
                  type:            entity.type,
                  name:            entity.name,
                  claimedDetail:   entity.claimedDetail || null,
                  suggestedEmails: JSON.stringify(entity.suggestedEmails || []),
                  status:          "PENDING",
                },
              });
            }

            verification = {
              credibilityScore:  credibility.credibilityScore,
              overallTrustScore,
              flagCount:         credibility.flags.length,
              entityCount:       credibility.verifiableEntities.length,
            };
          } catch { /* silently fail */ }
        }

        results.push({ fileName: cv.fileName, success: true, candidateId: candidate.id, analysis, verification });
      } catch (err) {
        results.push({ fileName: cv.fileName, success: false, error: "Analysis failed" });
      }
    }

    return NextResponse.json({
      success: true,
      results,
      summary: {
        total:      selectedCVs.length,
        successful: results.filter((r) => r.success).length,
        failed:     results.filter((r) => !r.success).length,
      },
    });
  } catch (error) {
    console.error("Bulk analyze error:", error);
    return NextResponse.json({ error: "Failed to analyse CVs" }, { status: 500 });
  }
}
