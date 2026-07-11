import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateInterviewQuestions, DEFAULT_MALE_VOICE_ID, DEFAULT_FEMALE_VOICE_ID } from "@/lib/ai/interview-engine";
import { logActivity } from "@/lib/activity-log";

const interviewAllowed = [
  "RECRUITER_BUSINESS", "RECRUITER_ENTERPRISE", "RECRUITER_SCALE",
  "RECRUITER_CUSTOM", "ADMIN",
];

const elevenlabsPlans = [
  "RECRUITER_BUSINESS", "RECRUITER_ENTERPRISE", "RECRUITER_SCALE",
  "RECRUITER_CUSTOM", "ADMIN",
];

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userId = (session.user as any).id as string;
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || undefined;
    const candidateId = searchParams.get("candidateId") || undefined;

    const profile = await prisma.recruiterProfile.findUnique({ where: { userId } });
    if (!profile) return NextResponse.json({ error: "Recruiter profile not found" }, { status: 404 });

    const interviews = await prisma.recruiterInterview.findMany({
      where: {
        recruiterId: profile.id,
        ...(status ? { status: status as any } : {}),
        ...(candidateId ? { candidateId } : {}),
      },
      include: {
        candidate: { select: { id: true, candidateName: true, candidateEmail: true, atsScore: true } },
        job: { select: { id: true, title: true } },
        _count: { select: { questions: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ interviews });
  } catch (error) {
    console.error("List interviews error:", error);
    return NextResponse.json({ error: "Failed to load interviews" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userId = (session.user as any).id as string;
    const role = (session.user as any).role as string;

    if (!interviewAllowed.includes(role)) {
      return NextResponse.json(
        { error: "AI Interviews require Business plan or higher.", upgradeRequired: true },
        { status: 403 }
      );
    }

    const profile = await prisma.recruiterProfile.findUnique({
      where: { userId },
      include: { interviewSettings: true },
    });
    if (!profile) return NextResponse.json({ error: "Recruiter profile not found" }, { status: 404 });

    const {
      candidateId, applicationId, jobId, mode, interviewType,
      scheduledAt, allowFollowUps, voiceId,
    } = await req.json();

    if (!candidateId && !applicationId) {
      return NextResponse.json({ error: "Either candidateId or applicationId is required" }, { status: 400 });
    }

    let candidateName = "Candidate";
    let candidateEmail: string | null = null;
    let candidateLocation: string | null = null;
    let jobTitle: string | null = null;
    let jobDescription: string | null = null;
    let cvSummary: string | null = null;
    let topSkills: string[] = [];
    let experience: string | null = null;
    let education: string | null = null;
    let currentRole: string | null = null;
    let redFlags: string[] = [];
    let resolvedJobId: string | null = jobId || null;
    let resolvedCandidateId: string | null = candidateId || null;
    let resolvedApplicationId: string | null = applicationId || null;

    if (candidateId) {
      const candidate = await prisma.recruiterCandidate.findFirst({
        where: { id: candidateId, recruiterId: profile.id },
        include: { job: { select: { id: true, title: true, description: true } } },
      });
      if (!candidate) return NextResponse.json({ error: "Candidate not found" }, { status: 404 });

      candidateName = candidate.candidateName || "Candidate";
      candidateEmail = candidate.candidateEmail || null;

      if (candidate.aiAnalysis) {
        const analysis = JSON.parse(candidate.aiAnalysis as string);
        candidateLocation = analysis.candidateLocation || null;
        cvSummary = analysis.summary || null;
        topSkills = analysis.topSkills || [];
        experience = analysis.totalExperienceYears ? `${analysis.totalExperienceYears} years` : null;
        education = analysis.education?.highestDegree || null;
        currentRole = analysis.currentRole || null;
        redFlags = (analysis.redFlags || []).map((f: any) => f.title || f);
      }

      if (candidate.job) {
        resolvedJobId = candidate.job.id;
        jobTitle = candidate.job.title;
        jobDescription = candidate.job.description;
      }
    }

    if (applicationId) {
      const application = await prisma.recruiterApplication.findFirst({
        where: { id: applicationId, recruiterId: profile.id },
        include: { job: { select: { id: true, title: true, description: true } } },
      });
      if (!application) return NextResponse.json({ error: "Application not found" }, { status: 404 });

      candidateName = application.candidateName || "Candidate";
      candidateEmail = application.candidateEmail || null;

      if (application.aiAnalysis) {
        const analysis = JSON.parse(application.aiAnalysis as string);
        candidateLocation = analysis.candidateLocation || null;
        cvSummary = analysis.summary || null;
        topSkills = analysis.topSkills || [];
        experience = analysis.totalExperienceYears ? `${analysis.totalExperienceYears} years` : null;
        education = analysis.education?.highestDegree || null;
        currentRole = analysis.currentRole || null;
        redFlags = (analysis.redFlags || []).map((f: any) => f.title || f);
      }

      if (application.job) {
        resolvedJobId = application.job.id;
        jobTitle = application.job.title;
        jobDescription = application.job.description;
      }
    }

    if (jobId && !jobTitle) {
      const job = await prisma.jobPosting.findFirst({ where: { id: jobId, recruiterId: profile.id } });
      if (job) { jobTitle = job.title; jobDescription = job.description; }
    }

    // ── Resolve voice ID ──
    let resolvedVoiceId: string | null = null;
    if (elevenlabsPlans.includes(role) && interviewType === "VOICE") {
      resolvedVoiceId =
        voiceId ||
        profile.interviewSettings?.defaultVoiceId ||
        DEFAULT_MALE_VOICE_ID; // Brian as global default
    }

    // ── Generate questions ──
    const generatedQuestions = await generateInterviewQuestions({
      candidateName,
      candidateLocation: candidateLocation || undefined,
      jobTitle: jobTitle || undefined,
      jobDescription: jobDescription || undefined,
      cvSummary: cvSummary || undefined,
      topSkills,
      experience: experience || undefined,
      education: education || undefined,
      currentRole: currentRole || undefined,
      redFlags,
    });

    const validTypes = ["TEXT", "VOICE", "VIDEO"];
    const resolvedType = validTypes.includes(interviewType) ? interviewType : "TEXT";

    const interview = await prisma.recruiterInterview.create({
      data: {
        recruiterId: profile.id,
        candidateId: resolvedCandidateId || null,
        applicationId: resolvedApplicationId || null,
        jobId: resolvedJobId || null,
        mode: mode || "ASYNC",
        interviewType: resolvedType,
        status: "PENDING",
        voiceId: resolvedVoiceId,
        allowFollowUps: allowFollowUps !== false, // default true
        followUpCount: 0,
        candidateName,
        candidateEmail,
        candidateLocation,
        jobTitle,
        cvSummary,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        totalQuestions: generatedQuestions.length,
        questions: {
          create: generatedQuestions.map((q) => ({
            question: q.question,
            questionType: q.questionType,
            order: q.order,
          })),
        },
      },
      include: { questions: { orderBy: { order: "asc" } } },
    });

    await logActivity({
      recruiterId: profile.id,
      type: "CANDIDATE_STATUS_CHANGED",
      title: "Interview created",
      description: `${resolvedType} ${mode || "ASYNC"} interview for ${candidateName}`,
      meta: { candidateName, jobTitle, mode, interviewType: resolvedType, interviewId: interview.id },
    });

    return NextResponse.json({ success: true, interview });
  } catch (error) {
    console.error("Create interview error:", error);
    return NextResponse.json({ error: "Failed to create interview" }, { status: 500 });
  }
}
