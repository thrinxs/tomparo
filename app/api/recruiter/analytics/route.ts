import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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

    const recruiterId = profile.id;

    // ── Date ranges ──────────────────────────────────────────────────────────
    const now = new Date();
    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    // ── CV stats ─────────────────────────────────────────────────────────────
    const [totalCVs, cvsThisMonth, cvsLastMonth] = await Promise.all([
      prisma.recruiterCandidate.count({ where: { recruiterId } }),
      prisma.recruiterCandidate.count({
        where: { recruiterId, createdAt: { gte: startOfThisMonth } },
      }),
      prisma.recruiterCandidate.count({
        where: {
          recruiterId,
          createdAt: { gte: startOfLastMonth, lte: endOfLastMonth },
        },
      }),
    ]);

    // ── Application stats ────────────────────────────────────────────────────
    const [totalApplications, applicationsThisMonth, applicationsLastMonth] =
      await Promise.all([
        prisma.recruiterApplication.count({ where: { recruiterId } }),
        prisma.recruiterApplication.count({
          where: { recruiterId, createdAt: { gte: startOfThisMonth } },
        }),
        prisma.recruiterApplication.count({
          where: {
            recruiterId,
            createdAt: { gte: startOfLastMonth, lte: endOfLastMonth },
          },
        }),
      ]);

    // ── Job stats ────────────────────────────────────────────────────────────
    const [totalJobs, activeJobs, closedJobs] = await Promise.all([
      prisma.jobPosting.count({ where: { recruiterId } }),
      prisma.jobPosting.count({ where: { recruiterId, status: "ACTIVE" } }),
      prisma.jobPosting.count({ where: { recruiterId, status: "CLOSED" } }),
    ]);

    // ── Email stats ──────────────────────────────────────────────────────────
    const [totalEmails, openedEmails, emailsThisMonth] = await Promise.all([
      prisma.recruiterEmail.count({ where: { recruiterId } }),
      prisma.recruiterEmail.count({
        where: { recruiterId, status: "opened" },
      }),
      prisma.recruiterEmail.count({
        where: { recruiterId, createdAt: { gte: startOfThisMonth } },
      }),
    ]);

    const openRate =
      totalEmails > 0 ? Math.round((openedEmails / totalEmails) * 100) : 0;

    // ── Candidate pipeline breakdown ─────────────────────────────────────────
    const [newCount, reviewedCount, shortlistedCount, rejectedCount, hiredCount] =
      await Promise.all([
        prisma.recruiterCandidate.count({ where: { recruiterId, status: "NEW" } }),
        prisma.recruiterCandidate.count({ where: { recruiterId, status: "REVIEWED" } }),
        prisma.recruiterCandidate.count({ where: { recruiterId, status: "SHORTLISTED" } }),
        prisma.recruiterCandidate.count({ where: { recruiterId, status: "REJECTED" } }),
        prisma.recruiterCandidate.count({ where: { recruiterId, status: "HIRED" } }),
      ]);

    const hireRate =
      totalCVs > 0 ? Math.round((hiredCount / totalCVs) * 100) : 0;

    // ── Top performing jobs (most applications) ──────────────────────────────
    const topJobs = await prisma.jobPosting.findMany({
      where: { recruiterId },
      include: {
        _count: {
          select: { applications: true },
        },
      },
      orderBy: {
        applications: { _count: "desc" },
      },
      take: 5,
    });

    // ── Recent activity ──────────────────────────────────────────────────────
    const recentActivity = await prisma.recruiterActivityLog.findMany({
      where: { recruiterId },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    // ── Team count ───────────────────────────────────────────────────────────
    const teamCount = await prisma.recruiterTeamMember.count({
      where: { recruiterId },
    });

    return NextResponse.json({
      cvs: {
        total: totalCVs,
        thisMonth: cvsThisMonth,
        lastMonth: cvsLastMonth,
        changePercent:
          cvsLastMonth > 0
            ? Math.round(((cvsThisMonth - cvsLastMonth) / cvsLastMonth) * 100)
            : cvsThisMonth > 0
            ? 100
            : 0,
      },
      applications: {
        total: totalApplications,
        thisMonth: applicationsThisMonth,
        lastMonth: applicationsLastMonth,
        changePercent:
          applicationsLastMonth > 0
            ? Math.round(
                ((applicationsThisMonth - applicationsLastMonth) /
                  applicationsLastMonth) *
                  100
              )
            : applicationsThisMonth > 0
            ? 100
            : 0,
      },
      jobs: {
        total: totalJobs,
        active: activeJobs,
        closed: closedJobs,
      },
      emails: {
        total: totalEmails,
        opened: openedEmails,
        thisMonth: emailsThisMonth,
        openRate,
      },
      pipeline: {
        new: newCount,
        reviewed: reviewedCount,
        shortlisted: shortlistedCount,
        rejected: rejectedCount,
        hired: hiredCount,
        hireRate,
      },
      topJobs: topJobs.map((j) => ({
        id: j.id,
        title: j.title,
        status: j.status,
        applications: j._count.applications,
      })),
      recentActivity: recentActivity.map((a) => ({
        id: a.id,
        type: a.type,
        title: a.title,
        description: a.description,
        meta: a.meta ? JSON.parse(a.meta) : null,
        createdAt: a.createdAt,
      })),
      team: {
        count: teamCount,
      },
    });
  } catch (error) {
    console.error("Analytics error:", error);
    return NextResponse.json(
      { error: "Failed to load analytics" },
      { status: 500 }
    );
  }
}
