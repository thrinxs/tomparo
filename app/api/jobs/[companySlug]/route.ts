import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ companySlug: string }> }
) {
  try {
    const { companySlug } = await params;

    const profile = await prisma.recruiterProfile.findFirst({
      where: { companySlug },
    });

    if (!profile) {
      return NextResponse.json(
        { error: "Company not found" },
        { status: 404 }
      );
    }

    const jobs = await prisma.jobPosting.findMany({
      where: {
        recruiterId: profile.id,
        status: "ACTIVE",
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      company: {
        name: profile.companyName,
        slug: profile.companySlug,
        industry: profile.industry,
        website: profile.website,
        description: profile.description,
      },
      jobs,
    });
  } catch (error) {
    console.error("Get company jobs error:", error);
    return NextResponse.json(
      { error: "Failed to fetch jobs" },
      { status: 500 }
    );
  }
}
