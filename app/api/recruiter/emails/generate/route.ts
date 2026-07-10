import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateRecruiterEmail, type EmailType } from "@/lib/ai/recruiter-email-generator";

export async function POST(req: NextRequest) {
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

    const { type, candidateName, jobTitle, candidateSummary, extraContext } =
      await req.json();

    if (!type || !candidateName || !jobTitle) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const result = await generateRecruiterEmail({
      type: type as EmailType,
      candidateName,
      jobTitle,
      companyName: profile.companyName,
      candidateSummary,
      extraContext,
    });

    return NextResponse.json({ success: true, result });
  } catch (error) {
    console.error("Generate email error:", error);
    return NextResponse.json(
      { error: "Failed to generate email" },
      { status: 500 }
    );
  }
}
