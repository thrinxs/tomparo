import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ companySlug: string; jobSlug: string }> }
) {
  try {
    const { companySlug, jobSlug } = await params;

    const profile = await prisma.recruiterProfile.findFirst({
      where: { companySlug },
    });

    if (!profile) {
      return NextResponse.json(
        { error: "Company not found" },
        { status: 404 }
      );
    }

    const job = await prisma.jobPosting.findFirst({
      where: {
        recruiterId: profile.id,
        jobSlug,
        status: "ACTIVE",
      },
    });

    if (!job) {
      return NextResponse.json(
        { error: "Job not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      company: {
        name: profile.companyName,
        slug: profile.companySlug,
        industry: profile.industry,
        website: profile.website,
        description: profile.description,
      },
      job,
    });
  } catch (error) {
    console.error("Get job error:", error);
    return NextResponse.json(
      { error: "Failed to fetch job" },
      { status: 500 }
    );
  }
}
