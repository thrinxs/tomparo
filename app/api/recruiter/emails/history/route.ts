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
    const candidateId = searchParams.get("candidateId");

    const profile = await prisma.recruiterProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const emails = await prisma.recruiterEmail.findMany({
      where: {
        recruiterId: profile.id,
        ...(candidateId ? { candidateId } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json({ emails });
  } catch (error) {
    console.error("Get email history error:", error);
    return NextResponse.json({ error: "Failed to fetch email history" }, { status: 500 });
  }
}
