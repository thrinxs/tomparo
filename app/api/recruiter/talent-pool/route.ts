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
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const jobId = searchParams.get("jobId");
    const source = searchParams.get("source");
    const search = searchParams.get("search");

    const profile = await prisma.recruiterProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const where: any = { recruiterId: profile.id };
    if (status && status !== "ALL") where.status = status;
    if (jobId) where.jobId = jobId;
    if (source) where.source = source;
    if (search) {
      where.OR = [
        { candidateName: { contains: search, mode: "insensitive" } },
        { candidateEmail: { contains: search, mode: "insensitive" } },
      ];
    }

    const applications = await prisma.recruiterApplication.findMany({
      where,
      include: {
        job: { select: { id: true, title: true } },
      },
      orderBy: [
        { status: "asc" },
        { createdAt: "desc" },
      ],
    });

    // Summary counts
    const counts = {
      ALL: applications.length,
      UNREAD: applications.filter((a) => a.status === "UNREAD").length,
      READ: applications.filter((a) => a.status === "READ").length,
      SHORTLISTED: applications.filter((a) => a.status === "SHORTLISTED").length,
      REJECTED: applications.filter((a) => a.status === "REJECTED").length,
      HIRED: applications.filter((a) => a.status === "HIRED").length,
    };

    return NextResponse.json({ applications, counts });
  } catch (error) {
    console.error("Get talent pool error:", error);
    return NextResponse.json(
      { error: "Failed to fetch applications" },
      { status: 500 }
    );
  }
}
