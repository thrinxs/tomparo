import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { evaluateAnswer } from "@/lib/ai/interview-coach";
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

    const {
      sessionId,
      questionIndex,
      question,
      answer,
      category,
      jobContext,
    } = await req.json();

    if (!question || !answer) {
      return NextResponse.json(
        { error: "Question and answer are required" },
        { status: 400 }
      );
    }

    if (answer.trim().length < 20) {
      return NextResponse.json(
        { error: "Answer is too short. Please provide a detailed response." },
        { status: 400 }
      );
    }

    const evaluation = await evaluateAnswer(
      question,
      answer,
      category,
      jobContext
    );

    // Save answer + evaluation to session
    if (sessionId) {
      const userId = (session.user as any).id;

      const existingSession = await prisma.interviewSession.findFirst({
        where: { id: sessionId, userId },
      });

      if (existingSession) {
        const answers = existingSession.answers
          ? JSON.parse(existingSession.answers)
          : [];

        const feedback = existingSession.feedback
          ? JSON.parse(existingSession.feedback)
          : [];

        answers[questionIndex] = { question, answer, category };
        feedback[questionIndex] = evaluation;

        // Calculate average score
        const allScores = feedback
          .filter((f: any) => f && typeof f.score === "number")
          .map((f: any) => f.score);

        const avgScore =
          allScores.length > 0
            ? Math.round(
                allScores.reduce((a: number, b: number) => a + b, 0) /
                  allScores.length
              )
            : 0;

        await prisma.interviewSession.update({
          where: { id: sessionId },
          data: {
            answers: JSON.stringify(answers),
            feedback: JSON.stringify(feedback),
            readinessScore: avgScore,
          },
        });
      }
    }

    return NextResponse.json({
      success: true,
      evaluation,
    });
  } catch (error) {
    console.error("Evaluate answer error:", error);
    const message = error instanceof Error ? error.message : "Failed to evaluate";
    return NextResponse.json(
      { error: `Failed to evaluate: ${message}` },
      { status: 500 }
    );
  }
}