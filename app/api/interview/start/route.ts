import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { generateInterviewQuestions } from "@/lib/ai/interview-coach";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const role = (session.user as any).role;
    if (role !== "PREMIUM" && role !== "ADMIN") {
      return NextResponse.json(
        { error: "Premium subscription required" },
        { status: 403 }
      );
    }

    const { resumeText, jobDescription, questionType, difficulty, jobTitle } =
      await req.json();

    if (!resumeText || resumeText.trim().length < 100) {
      return NextResponse.json(
        { error: "Resume is required and must be at least 100 characters" },
        { status: 400 }
      );
    }

    if (!["hr", "technical", "behavioral", "mixed"].includes(questionType)) {
      return NextResponse.json(
        { error: "Invalid question type" },
        { status: 400 }
      );
    }

    if (!["quick", "standard", "full"].includes(difficulty)) {
      return NextResponse.json(
        { error: "Invalid difficulty" },
        { status: 400 }
      );
    }

    const result = await generateInterviewQuestions(
      resumeText,
      jobDescription,
      questionType,
      difficulty
    );

    const userId = (session.user as any).id;

    const interviewSession = await prisma.interviewSession.create({
      data: {
        userId,
        jobTitle: jobTitle || "General Interview",
        difficulty,
        questionType,
        questions: JSON.stringify(result.questions),
      },
    });

    return NextResponse.json({
      success: true,
      sessionId: interviewSession.id,
      questions: result.questions,
      totalQuestions: result.totalQuestions,
      estimatedDuration: result.estimatedDuration,
    });
  } catch (error) {
    console.error("Start interview error:", error);
    const message = error instanceof Error ? error.message : "Failed to start";
    return NextResponse.json(
      { error: `Failed to start interview: ${message}` },
      { status: 500 }
    );
  }
}