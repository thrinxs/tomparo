import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userId = (session.user as any).id as string;
    const profile = await prisma.recruiterProfile.findUnique({ where: { userId } });
    if (!profile) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const jobId = searchParams.get("jobId");
    const search = searchParams.get("search");

    const where: any = { recruiterId: profile.id };
    if (status && status !== "ALL") where.status = status;
    if (jobId) where.jobId = jobId;
    if (search) {
      where.OR = [
        { candidateName: { contains: search, mode: "insensitive" } },
        { candidateEmail: { contains: search, mode: "insensitive" } },
        { fileName: { contains: search, mode: "insensitive" } },
      ];
    }

    const candidates = await prisma.recruiterCandidate.findMany({
      where,
      include: { job: { select: { id: true, title: true } } },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ candidates });
  } catch (error) {
    console.error("Get candidates error:", error);
    return NextResponse.json({ error: "Failed to fetch candidates" }, { status: 500 });
  }
}
