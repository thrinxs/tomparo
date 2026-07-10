import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const userId = (session.user as any).id;

    // Fetch all user's data in parallel
    const [resumes, jobAnalyses, applications] = await Promise.all([
      prisma.resume.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 20,
        select: {
          id: true,
          title: true,
          fileName: true,
          atsScore: true,
          createdAt: true,
          parsedData: true,
        },
      }),
      prisma.jobAnalysis.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 20,
        select: {
          id: true,
          jobTitle: true,
          company: true,
          matchScore: true,
          createdAt: true,
        },
      }),
      prisma.application.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 20,
        select: {
          id: true,
          coverLetter: true,
          emailSubject: true,
          emailStyle: true,
          coverLetterScore: true,
          emailScore: true,
          createdAt: true,
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      resumes,
      jobAnalyses,
      applications,
      stats: {
        totalResumes: resumes.length,
        totalJobMatches: jobAnalyses.length,
        totalApplications: applications.length,
      },
    });
  } catch (error) {
    console.error("Get history error:", error);
    return NextResponse.json(
      { error: "Failed to fetch history" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");
    const id = searchParams.get("id");
    const userId = (session.user as any).id;

    if (!type || !id) {
      return NextResponse.json(
        { error: "Type and ID required" },
        { status: 400 }
      );
    }

    if (type === "resume") {
      await prisma.resume.deleteMany({
        where: { id, userId },
      });
    } else if (type === "job") {
      await prisma.jobAnalysis.deleteMany({
        where: { id, userId },
      });
    } else if (type === "application") {
      await prisma.application.deleteMany({
        where: { id, userId },
      });
    } else {
      return NextResponse.json({ error: "Invalid type" }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: "Deleted successfully",
    });
  } catch (error) {
    console.error("Delete history error:", error);
    return NextResponse.json(
      { error: "Failed to delete" },
      { status: 500 }
    );
  }
}