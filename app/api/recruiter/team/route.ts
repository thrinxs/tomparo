import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity-log";
import { sendEmail, FROM } from "@/lib/email";

const seatLimits: Record<string, number> = {
  FREE: 1,
  RECRUITER_STARTER: 1,
  RECRUITER_GROWTH: 2,
  RECRUITER_BUSINESS: 5,
  RECRUITER_ENTERPRISE: 10,
  RECRUITER_SCALE: 25,
  RECRUITER_CUSTOM: 999,
  ADMIN: 999,
};

export async function GET(req: NextRequest) {
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

    const [members, invites] = await Promise.all([
      prisma.recruiterTeamMember.findMany({
        where: { recruiterId: profile.id },
        include: {
          user: {
            select: { id: true, name: true, email: true, image: true },
          },
        },
        orderBy: { joinedAt: "asc" },
      }),
      prisma.recruiterInvite.findMany({
        where: {
          recruiterId: profile.id,
          status: "PENDING",
          expiresAt: { gt: new Date() },
        },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    return NextResponse.json({ members, invites });
  } catch (error) {
    console.error("Get team error:", error);
    return NextResponse.json(
      { error: "Failed to load team" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id as string;
    const role = (session.user as any).role as string;

    const profile = await prisma.recruiterProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      return NextResponse.json(
        { error: "Recruiter profile not found" },
        { status: 404 }
      );
    }

    // ── Check seat limit ──
    const seatLimit = seatLimits[role] || 1;
    const currentMembers = await prisma.recruiterTeamMember.count({
      where: { recruiterId: profile.id },
    });
    const pendingInvites = await prisma.recruiterInvite.count({
      where: {
        recruiterId: profile.id,
        status: "PENDING",
        expiresAt: { gt: new Date() },
      },
    });

    if (currentMembers + pendingInvites >= seatLimit) {
      return NextResponse.json(
        {
          error: `Your plan allows ${seatLimit} seat${seatLimit !== 1 ? "s" : ""}. Upgrade to invite more team members.`,
          upgradeRequired: true,
          seatLimit,
        },
        { status: 403 }
      );
    }

    const { email, memberRole } = await req.json();

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    // ── Check if already a member ──
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      const alreadyMember = await prisma.recruiterTeamMember.findFirst({
        where: { recruiterId: profile.id, userId: existingUser.id },
      });
      if (alreadyMember) {
        return NextResponse.json(
          { error: "This person is already a team member" },
          { status: 400 }
        );
      }
    }

    // ── Check for existing pending invite ──
    const existingInvite = await prisma.recruiterInvite.findFirst({
      where: {
        recruiterId: profile.id,
        email,
        status: "PENDING",
        expiresAt: { gt: new Date() },
      },
    });

    if (existingInvite) {
      return NextResponse.json(
        { error: "An invite has already been sent to this email" },
        { status: 400 }
      );
    }

    // ── Create invite ──
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    const invite = await prisma.recruiterInvite.create({
      data: {
        recruiterId: profile.id,
        email,
        role: memberRole || "MEMBER",
        expiresAt,
      },
    });

    // ── Send invite email ──
    const inviteUrl = `${process.env.NEXTAUTH_URL}/recruiter/invite/accept?token=${invite.token}`;

    await sendEmail({
      to: email,
      from: FROM.hire,
      subject: `You've been invited to join ${profile.companyName} on TomParo`,
      html: `
        <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:40px 20px;">
          <h2 style="color:#7c3aed;">You're invited!</h2>
          <p>${profile.companyName} has invited you to join their recruitment team on TomParo.</p>
          <p>Click the button below to accept your invitation. This link expires in 7 days.</p>
          <div style="text-align:center;margin:32px 0;">
            <a href="${inviteUrl}" style="background:#7c3aed;color:#fff;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:600;">
              Accept Invitation
            </a>
          </div>
          <p style="color:#888;font-size:13px;">Or copy this link: ${inviteUrl}</p>
        </div>
      `,
    });

    // ── Log activity ──
    await logActivity({
      recruiterId: profile.id,
      type: "TEAM_MEMBER_INVITED",
      title: "Team member invited",
      description: `Invited ${email} as ${memberRole || "Member"}`,
      meta: { email, role: memberRole || "MEMBER" },
    });

    return NextResponse.json({ success: true, invite });
  } catch (error) {
    console.error("Invite team member error:", error);
    return NextResponse.json(
      { error: "Failed to send invite" },
      { status: 500 }
    );
  }
}
