import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { reviewJobField } from "@/lib/ai/job-description-generator";

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

    const { field, content, title } = await req.json();

    if (!field || !content || !title) {
      return NextResponse.json(
        { error: "Field, content and title are required" },
        { status: 400 }
      );
    }

    const review = await reviewJobField(
      field,
      content,
      title,
      profile.companyName
    );

    return NextResponse.json({ success: true, review });
  } catch (error) {
    console.error("Review field error:", error);
    return NextResponse.json(
      { error: "Failed to review content" },
      { status: 500 }
    );
  }
}