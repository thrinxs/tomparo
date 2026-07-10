import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { matchResumeToJob } from "@/lib/ai/job-analyzer";
import { checkUsageLimit, trackUsage, UserRole } from "@/lib/usage-limiter";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;
    const role = ((session?.user as any)?.role || "FREE") as UserRole;

    if (userId) {
      const { allowed, usage } = await checkUsageLimit(
        userId,
        "jobMatch",
        role
      );

      if (!allowed) {
        return NextResponse.json(
          {
            error: `Daily limit reached (${usage.limit}/day). Upgrade to Premium for unlimited matches.`,
            limitReached: true,
            usage,
          },
          { status: 429 }
        );
      }
    }

    const { resumeText, jobDescription } = await req.json();

    if (!resumeText || !jobDescription) {
      return NextResponse.json(
        { error: "Resume and job description are required" },
        { status: 400 }
      );
    }

    const cleanedResume = resumeText.trim();
    const cleanedJob = jobDescription.trim();

    const matchResult = await matchResumeToJob(cleanedResume, cleanedJob);

    // Save to database
    if (userId) {
      try {
        await prisma.jobAnalysis.create({
          data: {
            userId,
            jobTitle: matchResult.jobDetails?.title || "Untitled Job",
            company: matchResult.jobDetails?.company || null,
            jobDescription: cleanedJob.slice(0, 20000),
            matchScore: matchResult.matchScore,
            requiredSkills: JSON.stringify(matchResult.matchedSkills || []),
            missingSkills: JSON.stringify(matchResult.missingSkills || []),
            recommendations: JSON.stringify(matchResult.applicationAdvice || {}),
            parsedRequirements: JSON.stringify(matchResult),
          },
        });
        await trackUsage(userId, "jobMatch");
      } catch (dbError) {
        console.error("Failed to save job match:", dbError);
      }
    }

    return NextResponse.json({
      success: true,
      matchResult,
    });
  } catch (error) {
    console.error("Job match error:", error);
    const message = error instanceof Error ? error.message : "Match failed";
    return NextResponse.json(
      { error: `Failed to match job: ${message}` },
      { status: 500 }
    );
  }
}