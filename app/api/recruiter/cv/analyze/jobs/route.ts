import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// ── GET — List all jobs for this recruiter ─────────────────────────────────────
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id as string;

    const profile = await prisma.recruiterProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      return NextResponse.json(
        { error: "Recruiter profile not found" },
        { status: 404 }
      );
    }

    const jobs = await prisma.jobPosting.findMany({
      where: { recruiterId: profile.id },
      include: {
        _count: { select: { candidates: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ jobs });
  } catch (error) {
    console.error("Get jobs error:", error);
    return NextResponse.json(
      { error: "Failed to fetch jobs" },
      { status: 500 }
    );
  }
}

// ── POST — Create a new job ────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id as string;
    const role = (session.user as any).role as string;

    const profile = await prisma.recruiterProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      return NextResponse.json(
        { error: "Recruiter profile not found" },
        { status: 404 }
      );
    }

    // ── Check job posting limits ──
    const jobLimits: Record<string, number> = {
      FREE: 1,
      RECRUITER_STARTER: 3,
      RECRUITER_GROWTH: 10,
      RECRUITER_BUSINESS: 99999,
      RECRUITER_ENTERPRISE: 99999,
      RECRUITER_SCALE: 99999,
      RECRUITER_CUSTOM: 99999,
      ADMIN: 99999,
    };

    const limit = jobLimits[role] ?? 0;

    const activeJobCount = await prisma.jobPosting.count({
      where: {
        recruiterId: profile.id,
        status: "ACTIVE",
      },
    });

    if (activeJobCount >= limit) {
      return NextResponse.json(
        {
          error: `Active job limit reached (${limit} jobs). Upgrade your plan for more.`,
          limitReached: true,
          limit,
        },
        { status: 429 }
      );
    }

    const {
      title,
      description,
      requirements,
      location,
      type,
      salaryMin,
      salaryMax,
      deadline,
      status,
    } = await req.json();

    if (!title || !description) {
      return NextResponse.json(
        { error: "Title and description are required" },
        { status: 400 }
      );
    }

    const job = await prisma.jobPosting.create({
      data: {
        recruiterId: profile.id,
        title,
        description,
        requirements: requirements || null,
        location: location || null,
        type: type || "FULL_TIME",
        salaryMin: salaryMin ? parseInt(salaryMin) : null,
        salaryMax: salaryMax ? parseInt(salaryMax) : null,
        salaryCurrency: "NGN",
        deadline: deadline ? new Date(deadline) : null,
        status: status || "ACTIVE",
      },
    });

    return NextResponse.json({ success: true, job }, { status: 201 });
  } catch (error) {
    console.error("Create job error:", error);
    return NextResponse.json(
      { error: "Failed to create job" },
      { status: 500 }
    );
  }
}