import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// PATCH — recruiter takes over interview live
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userId = (session.user as any).id as string;
    const profile = await prisma.recruiterProfile.findUnique({ where: { userId } });
    if (!profile) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

    const interview = await prisma.recruiterInterview.findFirst({
      where: { id, recruiterId: profile.id },
    });
    if (!interview) return NextResponse.json({ error: "Interview not found" }, { status: 404 });

    const body = await req.json();

    // Handle go-live toggle OR live message from recruiter
    const updated = await prisma.recruiterInterview.update({
      where: { id },
      data: {
        ...(typeof body.isLive === "boolean" ? {
          isLive: body.isLive,
          liveStartedAt: body.isLive ? new Date() : null,
        } : {}),
        ...(body.liveMessage !== undefined ? { liveMessage: body.liveMessage } : {}),
      },
    });

    return NextResponse.json({ success: true, interview: updated });
  } catch (error) {
    console.error("Go live error:", error);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}
