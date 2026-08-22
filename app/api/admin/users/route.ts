import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function adminOnly(role: string) {
  return role === "ADMIN";
}

// ── GET — fetch all users, companies, teams, usage ──────────────────────────
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const role = (session?.user as any)?.role as string;
    if (!adminOnly(role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // All users
    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        subscription: true,
        recruiterProfile: {
          select: {
            id: true,
            companyName: true,
            cvsUsedThisMonth: true,
          },
        },
        teamMemberships: {
          include: {
            recruiter: {
              select: {
                id: true,
                companyName: true,
                userId: true,
              },
            },
          },
        },
        usageTracking: {
          where: {
            date: {
              gte: new Date(new Date().setHours(0, 0, 0, 0)),
            },
          },
        },
      },
    });

    // All recruiter profiles (companies) with team members
    const companies = await prisma.recruiterProfile.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            createdAt: true,
          },
        },
        teamMembers: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
                createdAt: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({ success: true, users, companies });
  } catch (err) {
    console.error("Admin users GET error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// ── PATCH — update a user's role ─────────────────────────────────────────────
export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const role = (session?.user as any)?.role as string;
    if (!adminOnly(role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { userId, newRole } = await req.json();

    if (!userId || !newRole) {
      return NextResponse.json(
        { error: "userId and newRole are required" },
        { status: 400 }
      );
    }

    const validRoles = [
      "FREE", "PREMIUM", "ADMIN", "STAFF", "SUPPORT",
      "RECRUITER_STARTER", "RECRUITER_GROWTH", "RECRUITER_BUSINESS",
      "RECRUITER_ENTERPRISE", "RECRUITER_SCALE", "RECRUITER_CUSTOM",
    ];

    if (!validRoles.includes(newRole)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { role: newRole },
      select: { id: true, email: true, name: true, role: true },
    });

    return NextResponse.json({ success: true, user: updated });
  } catch (err) {
    console.error("Admin users PATCH error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
