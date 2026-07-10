import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateJobField } from "@/lib/ai/job-description-generator";

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

    const { field, title } = await req.json();

    if (!field || !title) {
      return NextResponse.json(
        { error: "Field and title are required" },
        { status: 400 }
      );
    }

    const result = await generateJobField(
      field,
      title,
      profile.companyName,
      profile.industry || ""
    );

    console.log("🔍 Generate result:", JSON.stringify(result, null, 2));

    return NextResponse.json({ success: true, result });
  } catch (error) {
    console.error("Generate field error:", error);
    return NextResponse.json(
      { error: "Failed to generate content" },
      { status: 500 }
    );
  }
}
