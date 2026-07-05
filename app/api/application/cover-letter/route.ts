import { NextRequest, NextResponse } from "next/server";
import { generateCoverLetter } from "@/lib/ai/application-generator";

export async function POST(req: NextRequest) {
  try {
    const { resumeText, jobDescription } = await req.json();

    if (!resumeText || !jobDescription) {
      return NextResponse.json(
        { error: "Resume and job description are required" },
        { status: 400 }
      );
    }

    if (resumeText.trim().length < 100) {
      return NextResponse.json(
        { error: "Resume is too short" },
        { status: 400 }
      );
    }

    if (jobDescription.trim().length < 50) {
      return NextResponse.json(
        { error: "Job description is too short" },
        { status: 400 }
      );
    }

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

    const result = await generateCoverLetter(cleanedResume, cleanedJob);

    return NextResponse.json({
      success: true,
      result,
    });
  } catch (error) {
    console.error("Cover letter error:", error);
    const message = error instanceof Error ? error.message : "Generation failed";
    return NextResponse.json(
      { error: `Failed to generate cover letter: ${message}` },
      { status: 500 }
    );
  }
}