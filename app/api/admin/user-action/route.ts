import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

function adminOnly(role: string) {
  return role === "ADMIN";
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const adminRole = (session?.user as any)?.role as string;
    if (!adminOnly(adminRole)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const { action, userId } = body;

    if (!action || !userId) {
      return NextResponse.json({ error: "action and userId required" }, { status: 400 });
    }

    // ── Get target user ──
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { teamMemberships: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // ── SUSPEND ──
    if (action === "suspend") {
      await prisma.user.update({
        where: { id: userId },
        data: { role: "SUSPENDED" },
      });
      return NextResponse.json({ success: true, message: "User suspended" });
    }

    // ── UNSUSPEND ──
    if (action === "unsuspend") {
      await prisma.user.update({
        where: { id: userId },
        data: { role: "FREE" },
      });
      return NextResponse.json({ success: true, message: "User restored to Free" });
    }

    // ── DELETE ──
    if (action === "delete") {
      // Delete in order to avoid FK constraint errors
      await prisma.usageTracking.deleteMany({ where: { userId } });
      await prisma.recruiterTeamMember.deleteMany({ where: { userId } });
      await prisma.session.deleteMany({ where: { userId } });
      await prisma.account.deleteMany({ where: { userId } });
      await prisma.subscription.deleteMany({ where: { userId } });
      await prisma.user.delete({ where: { id: userId } });
      return NextResponse.json({ success: true, message: "User deleted" });
    }

    // ── SEND EMAIL ──
    if (action === "email") {
      const { subject, message } = body;
      if (!subject || !message) {
        return NextResponse.json({ error: "subject and message required" }, { status: 400 });
      }

      await resend.emails.send({
        from: "TomParo Admin <noreply@tomparo.com>",
        to: user.email!,
        subject,
        html: `
          <div style="font-family:system-ui,sans-serif;max-width:600px;margin:0 auto;padding:24px;">
            <h2 style="color:#7c3aed;margin-bottom:8px;">Message from TomParo</h2>
            <p style="color:#374151;white-space:pre-wrap;">${message}</p>
            <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;" />
            <p style="color:#9ca3af;font-size:13px;">
              This message was sent to ${user.email} by the TomParo team.
            </p>
          </div>
        `,
      });

      return NextResponse.json({ success: true, message: "Email sent" });
    }

    // ── ASSIGN TO TEAM ──
    if (action === "assign_team") {
      const { recruiterId, teamRole } = body;
      if (!recruiterId || !teamRole) {
        return NextResponse.json({ error: "recruiterId and teamRole required" }, { status: 400 });
      }

      // Check company exists
      const company = await prisma.recruiterProfile.findUnique({
        where: { id: recruiterId },
      });
      if (!company) {
        return NextResponse.json({ error: "Company not found" }, { status: 404 });
      }

      // Check not already a member
      const existing = await prisma.recruiterTeamMember.findFirst({
        where: { userId, recruiterId },
      });
      if (existing) {
        // Update their role instead
        await prisma.recruiterTeamMember.updateMany({
          where: { userId, recruiterId },
          data: { role: teamRole },
        });
        return NextResponse.json({ success: true, message: "Team role updated" });
      }

      // Add to team
      await prisma.recruiterTeamMember.create({
        data: { userId, recruiterId, role: teamRole, joinedAt: new Date() },
      });

      return NextResponse.json({ success: true, message: `Added to ${company.companyName}` });
    }

    // ── REMOVE FROM TEAM ──
    if (action === "remove_team") {
      const { recruiterId } = body;
      await prisma.recruiterTeamMember.deleteMany({
        where: { userId, recruiterId },
      });
      return NextResponse.json({ success: true, message: "Removed from team" });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (err: any) {
    console.error("Admin user-action error:", err);
    return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
  }
}
