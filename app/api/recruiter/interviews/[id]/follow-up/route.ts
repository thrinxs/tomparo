import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { analyzeForFollowUp, generateFollowUpQuestion } from "@/lib/ai/interview-engine";

// POST — analyze answer and optionally generate follow-up
// Called by candidate page — authenticated by shareToken
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { questionId, answer, shareToken } = await req.json();

    if (!questionId || !answer?.trim() || !shareToken) {
      return NextResponse.json({ shouldAsk: false }, { status: 200 });
    }

    // Verify interview via shareToken
    const interview = await prisma.recruiterInterview.findFirst({
      where: { id, shareToken },
      include: {
        questions: { orderBy: { order: "asc" } },
      },
    });

    if (!interview || !interview.allowFollowUps) {
      return NextResponse.json({ shouldAsk: false });
    }

    if (interview.followUpCount >= 3) {
      return NextResponse.json({ shouldAsk: false });
    }

    const question = interview.questions.find((q) => q.id === questionId);
    if (!question) {
      return NextResponse.json({ shouldAsk: false });
    }

    // Don't follow up on follow-up questions
    if (question.isFollowUp) {
      return NextResponse.json({ shouldAsk: false });
    }

    // Don't follow up on skipped questions
    if (question.skipped) {
      return NextResponse.json({ shouldAsk: false });
    }

    // AI decides if follow-up is warranted
    const decision = await analyzeForFollowUp({
      question: question.question,
      questionType: question.questionType,
      candidateAnswer: answer,
      jobTitle: interview.jobTitle || undefined,
      candidateName: interview.candidateName,
      followUpCount: interview.followUpCount,
    });

    if (!decision.shouldAsk) {
      return NextResponse.json({ shouldAsk: false });
    }

    // Generate the follow-up question
    const followUp = await generateFollowUpQuestion({
      question: question.question,
      candidateAnswer: answer,
      suggestedTopic: decision.suggestedTopic,
      jobTitle: interview.jobTitle || undefined,
      candidateName: interview.candidateName,
    });

    // Save follow-up question to DB
    const followUpQuestion = await prisma.recruiterInterviewQuestion.create({
      data: {
        interviewId: id,
        question: followUp.question,
        questionType: question.questionType,
        order: question.order + 0.5, // between parent and next question
        isFollowUp: true,
        parentQuestionId: question.id,
        followUpReason: decision.reason,
      },
    });

    // Increment follow-up count + total questions
    await prisma.recruiterInterview.update({
      where: { id },
      data: {
        followUpCount: { increment: 1 },
        totalQuestions: { increment: 1 },
      },
    });

    return NextResponse.json({
      shouldAsk: true,
      followUpQuestion: {
        id: followUpQuestion.id,
        question: followUpQuestion.question,
        naturalOpener: followUp.naturalOpener,
        questionType: followUpQuestion.questionType,
        isFollowUp: true,
        parentQuestionId: question.id,
      },
    });
  } catch (error) {
    console.error("Follow-up error:", error);
    // Silently fail — never break the interview flow
    return NextResponse.json({ shouldAsk: false });
  }
}
