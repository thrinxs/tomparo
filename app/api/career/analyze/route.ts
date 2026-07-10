import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { analyzeCareer } from "@/lib/ai/career-intelligence";
import { prisma } from "@/lib/prisma";
import { checkUsageLimit, trackUsage, UserRole } from "@/lib/usage-limiter";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const role = ((session.user as any).role || "FREE") as UserRole;

    if (role !== "PREMIUM" && role !== "ADMIN") {
      return NextResponse.json(
        { error: "Premium subscription required" },
        { status: 403 }
      );
    }

    const userId = (session.user as any).id;

    const { allowed, usage } = await checkUsageLimit(
      userId,
      "career",
      role
    );

    if (!allowed) {
      return NextResponse.json(
        {
          error: `Daily limit reached (${usage.limit}/day).`,
          limitReached: true,
          usage,
        },
        { status: 429 }
      );
    }

    const { resumeText } = await req.json();

    if (!resumeText || typeof resumeText !== "string") {
      return NextResponse.json(
        { error: "Resume text is required" },
        { status: 400 }
      );
    }

    if (resumeText.trim().length < 100) {
      return NextResponse.json(
        { error: "Resume is too short. Please provide more content." },
        { status: 400 }
      );
    }

    const cleaned = resumeText
      .replace(/\r\n/g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .replace(/[ \t]+/g, " ")
      .trim();

    const analysis = await analyzeCareer(cleaned);

    // Save to database
    try {
      await prisma.careerInsight.create({
        data: {
          userId,
          careerLevel: analysis.currentLevel,
          missingSkills: JSON.stringify(analysis.skillsToAcquire),
          recommendedCerts: JSON.stringify(analysis.certificationsToPursue),
          experienceGaps: JSON.stringify(analysis.experienceGaps),
          marketDemand: JSON.stringify(analysis.marketDemand),
          nextLevelNeeds: JSON.stringify(analysis.actionPlan),
        },
      });

      await trackUsage(userId, "career");
    } catch (dbError) {
      console.error("Failed to save career analysis:", dbError);
    }

    return NextResponse.json({
      success: true,
      analysis,
    });
  } catch (error) {
    console.error("Career analysis error:", error);
    const message = error instanceof Error ? error.message : "Analysis failed";
    return NextResponse.json(
      { error: `Failed to analyze career: ${message}` },
      { status: 500 }
    );
  }
}