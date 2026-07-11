import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    const interview = await prisma.recruiterInterview.findUnique({
      where: { shareToken: token },
      include: {
        questions: { orderBy: { order: "asc" } },
        candidate: {
          select: {
            candidateName: true,
            candidateEmail: true,
            aiAnalysis: true,
            atsScore: true,
          },
        },
        application: {
          select: {
            candidateName: true,
            candidateEmail: true,
            aiAnalysis: true,
            atsScore: true,
          },
        },
        recruiter: {
          select: {
            companyName: true,
            interviewSettings: {
              select: {
                globalOpening: true,
                globalOpeningType: true,
                globalOpeningUrl: true,
                globalClosing: true,
                globalClosingType: true,
                globalClosingUrl: true,
                globalInstructions: true,
              },
            },
          },
        },
      },
    });

    if (!interview) {
      return NextResponse.json({ error: "Interview not found" }, { status: 404 });
    }

    if (interview.status === "CANCELLED") {
      return NextResponse.json({ error: "This interview has been cancelled" }, { status: 400 });
    }

    // ── Resolve CV data from candidate or application ──
    const cvSource = interview.candidate || interview.application;
    let cvData: any = null;
    if (cvSource?.aiAnalysis) {
      try {
        const parsed = JSON.parse(cvSource.aiAnalysis);
        cvData = {
          topSkills: parsed.topSkills || [],
          experienceLevel: parsed.experienceLevel || null,
          totalExperienceYears: parsed.totalExperienceYears || null,
          currentRole: parsed.currentRole || null,
          candidateLocation: parsed.candidateLocation || null,
        };
      } catch {}
    }

    // ── Resolve messages (per-interview overrides global) ──
    const globalSettings = interview.recruiter?.interviewSettings;

    const opening = {
      message: interview.openingMessage || globalSettings?.globalOpening || null,
      type: interview.openingMessageType || globalSettings?.globalOpeningType || "TEXT",
      url: interview.openingMessageUrl || globalSettings?.globalOpeningUrl || null,
    };

    const closing = {
      message: interview.closingMessage || globalSettings?.globalClosing || null,
      type: interview.closingMessageType || globalSettings?.globalClosingType || "TEXT",
      url: interview.closingMessageUrl || globalSettings?.globalClosingUrl || null,
    };

    const instructions = (() => {
      const perInterview = interview.customInstructions;
      const global = globalSettings?.globalInstructions;
      if (perInterview) { try { return JSON.parse(perInterview); } catch { return []; } }
      if (global) { try { return JSON.parse(global); } catch { return []; } }
      return [];
    })();

    return NextResponse.json({
      interview: {
        id: interview.id,
        shareToken: interview.shareToken,
        candidateName: interview.candidateName,
        jobTitle: interview.jobTitle,
        companyName: interview.recruiter?.companyName || null,
        status: interview.status,
        mode: interview.mode,
        interviewType: interview.interviewType,
        isLive: interview.isLive,
        liveMessage: interview.liveMessage,
        totalQuestions: interview.totalQuestions,
        answeredQuestions: interview.answeredQuestions,
        completedAt: interview.completedAt,
        cvData,
        opening,
        closing,
        instructions,
        questions: interview.questions.map((q) => ({
          id: q.id,
          question: q.question,
          questionType: q.questionType,
          order: q.order,
          answered: !!q.candidateAnswer,
          skipped: q.skipped,
          // Never expose scores to candidate
        })),
      },
    });
  } catch (error) {
    console.error("Load interview session error:", error);
    return NextResponse.json({ error: "Failed to load interview" }, { status: 500 });
  }
}
