import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { scoreInterviewAnswer } from "@/lib/ai/interview-engine";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { questionId, answer, shareToken, skipped } = await req.json();

    if (!questionId || !answer?.trim()) {
      return NextResponse.json({ error: "Question ID and answer are required" }, { status: 400 });
    }

    const interview = await prisma.recruiterInterview.findUnique({
      where: { id },
      include: { questions: true },
    });

    if (!interview) return NextResponse.json({ error: "Interview not found" }, { status: 404 });
    if (interview.status === "COMPLETED" || interview.status === "CANCELLED") {
      return NextResponse.json({ error: "This interview is no longer active" }, { status: 400 });
    }
    if (interview.mode === "ASYNC" && interview.shareToken !== shareToken) {
      return NextResponse.json({ error: "Invalid interview link" }, { status: 403 });
    }

    const question = interview.questions.find((q) => q.id === questionId);
    if (!question) return NextResponse.json({ error: "Question not found" }, { status: 404 });
    if (question.candidateAnswer) return NextResponse.json({ error: "Already answered" }, { status: 400 });

    let score = 0;
    let feedback = "Question was skipped.";

    if (!skipped) {
      const result = await scoreInterviewAnswer({
        question: question.question,
        questionType: question.questionType,
        candidateAnswer: answer,
        jobTitle: interview.jobTitle || undefined,
        candidateName: interview.candidateName,
      });
      score = result.score;
      feedback = result.feedback;
    }

    await prisma.recruiterInterviewQuestion.update({
      where: { id: questionId },
      data: {
        candidateAnswer: answer,
        aiScore: skipped ? null : score,
        aiFeedback: skipped ? null : feedback,
        skipped: !!skipped,
        answeredAt: new Date(),
      },
    });

    const answeredCount = interview.questions.filter(
      (q) => q.candidateAnswer || q.id === questionId
    ).length;

    await prisma.recruiterInterview.update({
      where: { id },
      data: {
        answeredQuestions: answeredCount,
        status: interview.status === "PENDING" ? "IN_PROGRESS" : interview.status,
        startedAt: interview.startedAt || new Date(),
      },
    });

    return NextResponse.json({ success: true, score, feedback });
  } catch (error) {
    console.error("Submit answer error:", error);
    return NextResponse.json({ error: "Failed to submit answer" }, { status: 500 });
  }
}
