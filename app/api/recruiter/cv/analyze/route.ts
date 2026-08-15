import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { analyzeRecruiterCV } from "@/lib/ai/recruiter-cv-analyzer";
import { analyzeCvCredibility } from "@/lib/ai/cv-credibility-analyzer";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity-log";
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
    if (limit === 0) {
      return NextResponse.json({ error: "You need a recruiter plan to analyse CVs.", upgradeRequired: true }, { status: 403 });
    }

    // Reset monthly quota if needed
    const now       = new Date();
    const resetDate = new Date(profile.cvsResetDate);
    const monthDiff = (now.getFullYear() - resetDate.getFullYear()) * 12 + (now.getMonth() - resetDate.getMonth());
    if (monthDiff >= 1) {
      await prisma.recruiterProfile.update({ where: { id: profile.id }, data: { cvsUsedThisMonth: 0, cvsResetDate: now } });
      profile.cvsUsedThisMonth = 0;
    }

    if (profile.cvsUsedThisMonth >= limit) {
      return NextResponse.json({
        error: `Monthly CV limit reached (${limit} CVs). Upgrade your plan for more.`,
        limitReached: true, used: profile.cvsUsedThisMonth, limit,
      }, { status: 429 });
    }

    // Parse FormData or JSON
    let resumeText   = "";
    let fileName     = "";
    let jobId: string | null = null;
    let jobContext: any      = null;
    let uploadedFile: File | null = null;

    const contentType = req.headers.get("content-type") || "";
    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      resumeText = formData.get("resumeText") as string || "";
      fileName   = formData.get("fileName")   as string || "";
      jobId      = formData.get("jobId")      as string || null;
      const jc   = formData.get("jobContext") as string;
      if (jc) { try { jobContext = JSON.parse(jc); } catch {} }
      const f = formData.get("file");
      if (f instanceof File) uploadedFile = f;
    } else {
      const body = await req.json();
      resumeText = body.resumeText || "";
      fileName   = body.fileName   || "";
      jobId      = body.jobId      || null;
      jobContext  = body.jobContext || null;
    }

    if (!resumeText || typeof resumeText !== "string") {
      return NextResponse.json({ error: "CV text is required" }, { status: 400 });
    }

    const cleaned = resumeText.replace(/\r\n/g, "\n").replace(/\n{3,}/g, "\n\n").replace(/[ \t]+/g, " ").trim();
    if (cleaned.length < 100) {
      return NextResponse.json({ error: "CV is too short. Please provide more content." }, { status: 400 });
    }

    // Upload file to Supabase Storage
    let cvFileUrl: string | null = null;
    if (uploadedFile) {
      try {
        const buffer   = Buffer.from(await uploadedFile.arrayBuffer());
        const mimeType = uploadedFile.type || "application/octet-stream";
        cvFileUrl = await uploadCV(buffer, uploadedFile.name, mimeType, `recruiter/${profile.id}`);
      } catch { /* silently fail */ }
    }

    // Run AI analysis
    const analysis = await analyzeRecruiterCV(cleaned, jobContext || undefined);

    // Create candidate record
    const candidate = await prisma.recruiterCandidate.create({
      data: {
        recruiterId:    profile.id,
        jobId:          jobId || null,
        fileName:       fileName || `CV - ${new Date().toLocaleDateString()}`,
        rawText:        cleaned.slice(0, 50000),
        cvFileUrl:      cvFileUrl,
        candidateName:  analysis.candidateName  || null,
        candidateEmail: analysis.candidateEmail || null,
        candidatePhone: analysis.candidatePhone || null,
        aiAnalysis:     JSON.stringify(analysis),
        atsScore:       analysis.atsScore || 0,
        status:         "NEW",
      },
    });

    await prisma.recruiterProfile.update({ where: { id: profile.id }, data: { cvsUsedThisMonth: { increment: 1 } } });

    // Run credibility analysis for Business+ plans (async, don't block response)
    let verification: any = null;
    if (VERIFICATION_PLANS.includes(role)) {
      try {
        const credibility = await analyzeCvCredibility(
          cleaned,
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
          flags:             credibility.flags,
          entityCount:       credibility.verifiableEntities.length,
        };
      } catch { /* silently fail — never block main flow */ }
    }

    await logActivity({
      recruiterId: profile.id,
      type:        "CV_UPLOADED",
      title:       "CV Analysed",
      description: `${analysis.candidateName || fileName} analysed`,
    });

    return NextResponse.json({
      success: true,
      candidateId: candidate.id,
      analysis,
      verification,
      hasCvFile: !!cvFileUrl,
      usage: {
        used:      profile.cvsUsedThisMonth + 1,
        limit,
        remaining: limit - profile.cvsUsedThisMonth - 1,
      },
    });
  } catch (error) {
    console.error("Recruiter CV analysis error:", error);
    return NextResponse.json({ error: "Failed to analyse CV" }, { status: 500 });
  }
}
