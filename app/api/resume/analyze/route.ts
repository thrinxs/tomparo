import { NextRequest, NextResponse } from "next/server";
import { analyzeResume } from "@/lib/ai/resume-analyzer";

export async function POST(req: NextRequest) {
  try {
    const { resumeText } = await req.json();

    if (!resumeText || typeof resumeText !== "string") {
      return NextResponse.json(
        { error: "Resume text is required" },
        { status: 400 }
      );
    }

    // Clean up the resume text
    const cleaned = resumeText
      .replace(/\r\n/g, "\n") // Normalize line endings
      .replace(/\n{3,}/g, "\n\n") // Reduce excessive line breaks
      .replace(/[ \t]+/g, " ") // Multiple spaces to single space
      .replace(/\n /g, "\n") // Remove space after newline
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

    // Call Gemini AI
    const analysis = await analyzeResume(cleaned);

    return NextResponse.json({
      success: true,
      analysis,
    });
  } catch (error) {
    console.error("Resume analysis error:", error);
    const message =
      error instanceof Error ? error.message : "Analysis failed";
    return NextResponse.json(
      {
        error: `Failed to analyze resume: ${message}. Please try again.`,
      },
      { status: 500 }
    );
  }
}