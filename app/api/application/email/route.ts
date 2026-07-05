import { NextRequest, NextResponse } from "next/server";
import { generateApplicationEmail } from "@/lib/ai/application-generator";

export async function POST(req: NextRequest) {
  try {
    const { resumeText, jobDescription, style } = await req.json();

    if (!resumeText || !jobDescription) {
      return NextResponse.json(
        { error: "Resume and job description are required" },
        { status: 400 }
      );
    }

    if (!["formal", "modern", "concise"].includes(style)) {
      return NextResponse.json(
        { error: "Invalid style. Must be formal, modern, or concise." },
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

    const result = await generateApplicationEmail(
      cleanedResume,
      cleanedJob,
      style
    );

    return NextResponse.json({
      success: true,
      result,
    });
  } catch (error) {
    console.error("Email generation error:", error);
    const message = error instanceof Error ? error.message : "Generation failed";
    return NextResponse.json(
      { error: `Failed to generate email: ${message}` },
      { status: 500 }
    );
  }
}