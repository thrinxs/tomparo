import { NextRequest, NextResponse } from "next/server";
import { matchResumeToJob } from "@/lib/ai/job-analyzer";

export async function POST(req: NextRequest) {
  try {
    const { resumeText, jobDescription } = await req.json();

    if (!resumeText || typeof resumeText !== "string") {
      return NextResponse.json(
        { error: "Resume text is required" },
        { status: 400 }
      );
    }

    if (!jobDescription || typeof jobDescription !== "string") {
      return NextResponse.json(
        { error: "Job description is required" },
        { status: 400 }
      );
    }

    if (resumeText.trim().length < 100) {
      return NextResponse.json(
        { error: "Resume is too short. Please provide more content." },
        { status: 400 }
      );
    }

    if (jobDescription.trim().length < 50) {
      return NextResponse.json(
        {
          error:
            "Job description is too short. Please provide the full job posting.",
        },
        { status: 400 }
      );
    }

    // Clean the texts
    const cleanedResume = resumeText
      .replace(/\r\n/g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .replace(/[ \t]+/g, " ")
      .trim();

    const cleanedJob = jobDescription
      .replace(/\r\n/g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .replace(/[ \t]+/g, " ")
      .trim();

    // Call Gemini AI
    const matchResult = await matchResumeToJob(cleanedResume, cleanedJob);

    return NextResponse.json({
      success: true,
      matchResult,
    });
  } catch (error) {
    console.error("Job match error:", error);
    const message = error instanceof Error ? error.message : "Match failed";
    return NextResponse.json(
      { error: `Failed to match job: ${message}. Please try again.` },
      { status: 500 }
    );
  }
}