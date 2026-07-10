import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity-log";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    const { role } = await req.json();

    const member = await prisma.recruiterTeamMember.findFirst({
      where: { id, recruiterId: profile.id },
      include: { user: { select: { name: true, email: true } } },
    });

    if (!member) {
      return NextResponse.json(
        { error: "Team member not found" },
        { status: 404 }
      );
    }

    const updated = await prisma.recruiterTeamMember.update({
      where: { id },
      data: { role },
    });

    return NextResponse.json({ success: true, member: updated });
  } catch (error) {
    console.error("Update team member error:", error);
    return NextResponse.json(
      { error: "Failed to update team member" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    const member = await prisma.recruiterTeamMember.findFirst({
      where: { id, recruiterId: profile.id },
      include: { user: { select: { name: true, email: true } } },
    });

    if (!member) {
      return NextResponse.json(
        { error: "Team member not found" },
        { status: 404 }
      );
    }

    await prisma.recruiterTeamMember.delete({ where: { id } });

    await logActivity({
      recruiterId: profile.id,
      type: "TEAM_MEMBER_REMOVED",
      title: "Team member removed",
      description: `Removed ${member.user.name || member.user.email} from the team`,
      meta: { email: member.user.email },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Remove team member error:", error);
    return NextResponse.json(
      { error: "Failed to remove team member" },
      { status: 500 }
    );
  }
}
