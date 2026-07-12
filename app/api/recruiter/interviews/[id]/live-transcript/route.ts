import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET — recruiter polls for live transcript (1s interval)
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userId = (session.user as any).id as string;
    const profile = await prisma.recruiterProfile.findUnique({ where: { userId } });
    if (!profile) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

    const interview = await prisma.recruiterInterview.findFirst({
      where: { id, recruiterId: profile.id },
      select: {
        liveTranscript: true,
        liveTranscriptUpdatedAt: true,
        isLive: true,
        stealthMode: true,
        status: true,
        answeredQuestions: true,
        totalQuestions: true,
        questions: {
          orderBy: { order: "asc" },
          select: {
            id: true,
            question: true,
            questionType: true,
            order: true,
            candidateAnswer: true,
            skipped: true,
            isFollowUp: true,
            parentQuestionId: true,
          },
        },
      },
    });

    if (!interview) return NextResponse.json({ error: "Not found" }, { status: 404 });

    return NextResponse.json({
      liveTranscript: interview.liveTranscript,
      liveTranscriptUpdatedAt: interview.liveTranscriptUpdatedAt,
      isLive: interview.isLive,
      stealthMode: interview.stealthMode,
      status: interview.status,
      answeredQuestions: interview.answeredQuestions,
      totalQuestions: interview.totalQuestions,
      questions: interview.questions,
    });
  } catch (error) {
    console.error("Live transcript GET error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

// PATCH — toggle stealth mode
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userId = (session.user as any).id as string;
    const profile = await prisma.recruiterProfile.findUnique({ where: { userId } });
    if (!profile) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

    const body = await req.json();
    const updated = await prisma.recruiterInterview.update({
      where: { id },
      data: {
        ...(typeof body.stealthMode === "boolean" ? { stealthMode: body.stealthMode } : {}),
      },
    });

    return NextResponse.json({ success: true, stealthMode: updated.stealthMode });
  } catch (error) {
    console.error("Stealth mode error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
