import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userId = (session.user as any).id as string;
    const profile = await prisma.recruiterProfile.findUnique({ where: { userId } });
    if (!profile) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

    const { jobTitle, requirements } = await req.json();
    if (!jobTitle) return NextResponse.json({ matches: [] });

    // Get all candidates for this recruiter
    const candidates = await prisma.recruiterCandidate.findMany({
      where: { recruiterId: profile.id },
      select: {
        id: true,
        candidateName: true,
        candidateEmail: true,
        atsScore: true,
        status: true,
        aiAnalysis: true,
        fileName: true,
        createdAt: true,
        jobId: true,
      },
    });

    const titleWords = jobTitle.toLowerCase().split(/\s+/).filter((w: string) => w.length > 2);
    const reqWords = requirements
      ? requirements.toLowerCase().split(/[\s,]+/).filter((w: string) => w.length > 3)
      : [];

    const scored = candidates
      .map((c) => {
        let score = 0;
        const analysis = c.aiAnalysis ? JSON.parse(c.aiAnalysis as string) : null;
        if (!analysis) return null;

        const searchText = [
          analysis.currentRole || "",
          analysis.summary || "",
          (analysis.topSkills || []).join(" "),
          (analysis.technicalSkills || []).join(" "),
          (analysis.industryBackground || []).join(" "),
        ].join(" ").toLowerCase();

        // Title word matches
        for (const word of titleWords) {
          if (searchText.includes(word)) score += 10;
        }

        // Requirements word matches
        for (const word of reqWords) {
          if (searchText.includes(word)) score += 5;
        }

        // ATS score bonus
        score += (analysis.atsScore || 0) * 0.3;

        return { ...c, matchScore: Math.round(score), analysis };
      })
      .filter(Boolean)
      .filter((c: any) => c.matchScore > 10)
      .sort((a: any, b: any) => b.matchScore - a.matchScore)
      .slice(0, 20);

    // Categorize
    const categorized = {
      hired: scored.filter((c: any) => c.status === "HIRED"),
      topRanked: scored.filter((c: any) => c.status !== "HIRED" && c.status !== "REJECTED" && c.atsScore >= 75),
      available: scored.filter((c: any) => c.status !== "HIRED" && c.status !== "REJECTED" && c.atsScore < 75),
      rejected: scored.filter((c: any) => c.status === "REJECTED"),
    };

    return NextResponse.json({
      total: scored.length,
      categorized,
      all: scored,
    });
  } catch (error) {
    return NextResponse.json({ error: "Match failed" }, { status: 500 });
  }
}
