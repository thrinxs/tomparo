import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { analyzeResume } from "@/lib/ai/resume-analyzer";
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
        "resumeAnalysis",
        role
      );

      if (!allowed) {
        return NextResponse.json(
          {
            error: `Daily limit reached (${usage.limit}/day). Upgrade to Premium for unlimited analyses.`,
            limitReached: true,
            usage,
          },
          { status: 429 }
        );
      }
    }

    const { resumeText, fileName } = await req.json();

    if (!resumeText || typeof resumeText !== "string") {
      return NextResponse.json(
        { error: "Resume text is required" },
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
        { error: "Resume is too short. Please provide more content." },
        { status: 400 }
      );
    }

    if (cleaned.length > 100000) {
      return NextResponse.json(
        {
          error:
            "Resume is too long. Please shorten it to under 100,000 characters.",
        },
        { status: 400 }
      );
    }

    // Analyze
    const analysis = await analyzeResume(cleaned);

    // Save to database if user is logged in
    if (userId) {
      try {
        await prisma.resume.create({
          data: {
            userId,
            title: fileName || `CV Analysis - ${new Date().toLocaleDateString()}`,
            fileName: fileName || null,
            rawText: cleaned.slice(0, 50000), // Limit stored text
            parsedData: JSON.stringify(analysis),
            atsScore: analysis.atsScore,
          },
        });
        await trackUsage(userId, "resumeAnalysis");
      } catch (dbError) {
        console.error("Failed to save analysis:", dbError);
      }
    }

    return NextResponse.json({
      success: true,
      analysis,
    });
  } catch (error) {
    console.error("Resume analysis error:", error);
    const message = error instanceof Error ? error.message : "Analysis failed";
    return NextResponse.json(
      { error: `Failed to analyze resume: ${message}` },
      { status: 500 }
    );
  }
}