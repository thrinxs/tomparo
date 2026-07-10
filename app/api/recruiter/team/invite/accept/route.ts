import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity-log";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id as string;
    const userEmail = (session.user as any).email as string;

    const { token } = await req.json();

    if (!token) {
      return NextResponse.json(
        { error: "Invite token is required" },
        { status: 400 }
      );
    }

    const invite = await prisma.recruiterInvite.findUnique({
      where: { token },
      include: {
        recruiter: { select: { id: true, companyName: true } },
      },
    });

    if (!invite) {
      return NextResponse.json(
        { error: "Invalid invite link" },
        { status: 404 }
      );
    }

    if (invite.status !== "PENDING") {
      return NextResponse.json(
        { error: "This invite has already been used or cancelled" },
        { status: 400 }
      );
    }

    if (invite.expiresAt < new Date()) {
      await prisma.recruiterInvite.update({
        where: { token },
        data: { status: "EXPIRED" },
      });
      return NextResponse.json(
        { error: "This invite has expired. Ask the recruiter to send a new one." },
        { status: 400 }
      );
    }

    if (invite.email !== userEmail) {
      return NextResponse.json(
        { error: "This invite was sent to a different email address" },
        { status: 403 }
      );
    }

    // ── Check not already a member ──
    const alreadyMember = await prisma.recruiterTeamMember.findFirst({
      where: { recruiterId: invite.recruiterId, userId },
    });

    if (alreadyMember) {
      return NextResponse.json(
        { error: "You are already a member of this team" },
        { status: 400 }
      );
    }

    // ── Create team member + mark invite accepted ──
    await prisma.$transaction([
      prisma.recruiterTeamMember.create({
        data: {
          recruiterId: invite.recruiterId,
          userId,
          role: invite.role,
        },
      }),
      prisma.recruiterInvite.update({
        where: { token },
        data: { status: "ACCEPTED", acceptedAt: new Date() },
      }),
    ]);

    await logActivity({
      recruiterId: invite.recruiterId,
      type: "TEAM_MEMBER_JOINED",
      title: "Team member joined",
      description: `${userEmail} accepted their invitation`,
      meta: { email: userEmail, role: invite.role },
    });

    return NextResponse.json({
      success: true,
      companyName: invite.recruiter.companyName,
    });
  } catch (error) {
    console.error("Accept invite error:", error);
    return NextResponse.json(
      { error: "Failed to accept invite" },
      { status: 500 }
    );
  }
}
